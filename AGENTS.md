# AGENTS.md

## What this project is

Improv Toolbox — a PWA for performers and trainers, with exercises, warmups, forms, and tools.

## Tech conventions

- Astro with content collections
- Custom web components preferred where useful
- PWA, offline-first, Cloudflare deployment
- Functional-first: keep shared logic pure and side-effect free; UI event wiring may remain imperative
- Content: Markdown + front matter
- Clean mobile-friendly UX as per android guidelines and Apple HIG

## Documentation expectations

- Every new feature or behavior change must be paired with documentation updates (README, requirements, outline, or other relevant guides).
- Record follow-up refactor opportunities in `docs/todo.md` under the appropriate section so future contributors can pick them up.

## Key docs

- [Requirements](docs/requirements.md) — feature-level scope and detail
- [outline](docs/outline.md) — feature descriptions
- [Architecture](docs/architecture.md) — system design outline (draft, needs diagrams)
- [API](docs/api.md) — data contracts outline (draft until external integrations land)
- [Todo](docs/todo.md) — backlog of documentation and refactor follow-ups
