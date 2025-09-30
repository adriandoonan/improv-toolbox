import json
import re
import unicodedata
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_FILE = ROOT / "cliffweb_ccbtse.json"
OUTPUT_DIR = ROOT / "src" / "content" / "exercises"
PREFIX = "cliffweb-"


def load_data():
    with DATA_FILE.open() as fh:
        return json.load(fh)


def build_indexes(dump):
    tables = {entry["name"]: entry for entry in dump if entry.get("type") == "table"}
    posts = tables["ddb_posts"]["data"]
    postmeta = tables["ddb_postmeta"]["data"]
    relationships = tables["ddb_term_relationships"]["data"]
    term_taxonomy = tables["ddb_term_taxonomy"]["data"]
    terms = tables["ddb_terms"]["data"]

    meta_by_post = {}
    for row in postmeta:
        meta_by_post.setdefault(row["post_id"], {})[row["meta_key"]] = row["meta_value"]

    tax_lookup = {}
    term_name_lookup = {term["term_id"]: term["name"] for term in terms}
    for tx in term_taxonomy:
        term_id = tx["term_id"]
        tax_lookup[tx["term_taxonomy_id"]] = (term_name_lookup.get(term_id, ""), tx["taxonomy"])

    rel_by_object = {}
    for rel in relationships:
        rel_by_object.setdefault(rel["object_id"], []).append(rel["term_taxonomy_id"])

    return posts, meta_by_post, rel_by_object, tax_lookup


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value or "exercise"


def collapse_spaces(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def to_single_word(value: str) -> str:
    parts = re.findall(r"[A-Za-z0-9]+", value)
    if not parts:
        return "General"
    return "".join(part.capitalize() for part in parts)


def html_to_markdown(html: str) -> str:
    if not html:
        return ""
    text = html.replace("\r\n", "\n")
    replacements = [
        (r"(?i)<br\s*/?>", "\n"),
        (r"(?i)</p>", "\n\n"),
        (r"(?i)<p[^>]*>", ""),
        (r"(?i)</?ul[^>]*>", "\n"),
        (r"(?i)</?ol[^>]*>", "\n"),
        (r"(?i)<li[^>]*>", "- "),
        (r"(?i)</li>", "\n"),
        (r"(?i)</?strong>", "**"),
        (r"(?i)</?b>", "**"),
        (r"(?i)</?em>", "_"),
        (r"(?i)</?i>", "_"),
        (r"(?i)</?h[1-6][^>]*>", "\n\n"),
        (r"(?i)</?blockquote>", "\n"),
    ]
    for pattern, repl in replacements:
        text = re.sub(pattern, repl, text)

    text = re.sub(r"(?is)<(script|style)[^>]*>.*?</\\1>", "", text)
    text = re.sub(r"(?is)<[^>]+>", "", text)
    text = unescape(text)
    lines = [line.rstrip() for line in text.split("\n")]
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped:
            cleaned_lines.append(stripped)
        else:
            if cleaned_lines and cleaned_lines[-1] != "":
                cleaned_lines.append("")
    markdown = "\n".join(cleaned_lines).strip()
    return markdown


def format_string_field(key: str, value: str) -> list[str]:
    if "\n" in value:
        lines = value.split("\n")
        block = [f"{key}: |"]
        for line in lines:
            if line:
                block.append(f"  {line}")
            else:
                block.append("  ")
        return block
    return [f"{key}: {json.dumps(value)}"]


def format_list_field(key: str, values: list[str]) -> list[str]:
    if not values:
        return [f"{key}: []"]
    lines = [f"{key}:"]
    for item in values:
        lines.append(f"  - {json.dumps(item)}")
    return lines


def build_entry(post, meta_by_post, rel_by_object, tax_lookup):
    post_id = post["ID"]
    title = post["post_title"].strip()
    slug = post.get("post_name") or slugify(title)

    relations = rel_by_object.get(post_id, [])
    tag_names = []
    purpose_candidate = None
    for rel_id in relations:
        name, taxonomy = tax_lookup.get(rel_id, ("", ""))
        name = name.strip()
        if not name:
            continue
        if name not in tag_names:
            tag_names.append(name)
        if purpose_candidate is None and taxonomy == "post_tag":
            purpose_candidate = name
    if purpose_candidate is None and tag_names:
        purpose_candidate = tag_names[0]
    if purpose_candidate is None:
        purpose_candidate = title

    purpose = to_single_word(purpose_candidate)

    raw_meta = meta_by_post.get(post_id, {})
    raw_purpose = collapse_spaces(unescape(raw_meta.get("purpose", ""))) if raw_meta.get("purpose") else ""

    description = html_to_markdown(post["post_content"])
    short_description_source = raw_purpose or description.split("\n\n")[0]
    short_description = collapse_spaces(unescape(short_description_source)) if short_description_source else "Improv exercise."

    focus_tags = [name.strip() for name in tag_names if name]
    focus = focus_tags[0] if focus_tags else None

    tags = focus_tags

    lines = ["---"]
    lines.append(f"name: {json.dumps(title)}")
    lines.append(f"purpose: {json.dumps(purpose)}")
    lines.extend(format_string_field("shortDescription", short_description))
    lines.extend(format_string_field("description", description))
    if focus:
        lines.append(f"focus: {json.dumps(focus)}")
    lines.extend(format_list_field("tags", tags))
    lines.append("source: \"cliffweb\"")
    lines.append("credit: \"unclaimed\"")
    lines.append("---\n")

    return slug, "\n".join(lines)


def main():
    dump = load_data()
    posts, meta_by_post, rel_by_object, tax_lookup = build_indexes(dump)
    exercises = [post for post in posts if post.get("post_type") == "exercise" and post.get("post_status") == "publish"]

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for post in exercises:
        slug, content = build_entry(post, meta_by_post, rel_by_object, tax_lookup)
        target = OUTPUT_DIR / f"{PREFIX}{slug}.md"
        target.write_text(content, encoding="utf-8")

    print(f"Imported {len(exercises)} exercises into {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
