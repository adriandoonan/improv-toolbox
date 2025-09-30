import {
  loadFavorites,
  subscribeToFavorites,
} from "./favorites";
import { FuzzyIndex, FuzzyIndexOptions } from "./fuzzySearch";

interface EqualityFilterDefinition {
  field: string;
  dataAttribute?: string;
}

interface SetupResourceListFilteringOptions {
  listSelector: string;
  formSelector?: string;
  favoritesField?: string;
  equalityFilters?: EqualityFilterDefinition[];
  searchField?: string;
  fuzzyOptions?: FuzzyIndexOptions;
}

type FavoritesState = Record<string, unknown>;

type Nullable<T> = T | null | undefined;

interface ResourceSearchEntry {
  id: string;
  [key: string]: string;
}

interface ResourceEntry {
  id: string;
  card: HTMLLIElement;
  dataset: Record<string, string>;
  searchable: Record<string, string>;
  toggleRoot: HTMLElement | null;
}

function toDatasetRecord(dataset: DOMStringMap): Record<string, string> {
  const record: Record<string, string> = {};
  for (const [key, value] of Object.entries(dataset)) {
    record[key] = value ?? "";
  }
  return record;
}

function normalizeSearchRecord(value: unknown): string {
  if (value == null) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeSearchRecord(item)).join(" ");
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map((item) => normalizeSearchRecord(item))
      .join(" ");
  }
  return String(value);
}

function resolveDatasetValue(
  dataset: Record<string, string>,
  attribute: string
): string {
  if (attribute in dataset) {
    return dataset[attribute] ?? "";
  }
  const camelCased = attribute.replace(/-([a-z])/gi, (_, letter: string) =>
    letter.toUpperCase()
  );
  if (camelCased in dataset) {
    return dataset[camelCased] ?? "";
  }
  return "";
}

function readResourcePayload(
  script: HTMLScriptElement | null
): ResourceSearchEntry[] {
  if (!script || !script.textContent) {
    return [];
  }
  try {
    const parsed = JSON.parse(script.textContent) as unknown;
    const payloadArray = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as Record<string, unknown>)?.items)
      ? ((parsed as Record<string, unknown>).items as unknown[])
      : null;

    if (!Array.isArray(payloadArray)) {
      return [];
    }

    return payloadArray
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }
        const idValue = (entry as Record<string, unknown>).id;
        const id = normalizeSearchRecord(idValue);
        if (!id) {
          return null;
        }
        const result: ResourceSearchEntry = { id };
        for (const [key, value] of Object.entries(
          entry as Record<string, unknown>
        )) {
          if (key === "id") {
            continue;
          }
          result[key] = normalizeSearchRecord(value);
        }
        return result;
      })
      .filter((entry): entry is ResourceSearchEntry => Boolean(entry));
  } catch (error) {
    console.warn("Failed to parse resource list payload", error);
  }
  return [];
}

export function setupResourceListFiltering({
  listSelector,
  formSelector = ".filter-form",
  favoritesField = "favoritesOnly",
  equalityFilters = [],
  searchField,
  fuzzyOptions,
}: SetupResourceListFilteringOptions): () => void {
  const list = document.querySelector<HTMLElement>(listSelector);
  const form = document.querySelector<HTMLFormElement>(formSelector);
  const cards = list
    ? Array.from(list.querySelectorAll<HTMLLIElement>(".resource-card"))
    : [];

  if (!cards.length) {
    return () => {};
  }

  const buildResourceSelector = (key: string): string => {
    if (!key) {
      return "script[data-resource-list]";
    }
    const escapedKey =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(key)
        : key.replace(/"/g, '\\"');
    return `script[data-resource-list="${escapedKey}"]`;
  };

  const listId = list?.id ?? "";
  const localSelector = buildResourceSelector(listId);
  let resourceScript =
    list?.parentElement?.querySelector<HTMLScriptElement>(localSelector) ?? null;

  if (!resourceScript) {
    resourceScript = document.querySelector<HTMLScriptElement>(localSelector);
  }

  if (!resourceScript) {
    resourceScript = document.querySelector<HTMLScriptElement>(
      "script[data-resource-list]"
    );
  }

  const resourcePayload = readResourcePayload(resourceScript);
  const payloadById = new Map(resourcePayload.map((entry) => [entry.id, entry]));

  const resources: ResourceEntry[] = cards.map((card, index) => {
    const datasetRecord = toDatasetRecord(card.dataset);
    const datasetId =
      datasetRecord.resourceId ||
      datasetRecord.slug ||
      datasetRecord.id ||
      datasetRecord.key;
    if (!datasetRecord.favorite) {
      datasetRecord.favorite = card.dataset.favorite ?? "false";
    }
    const fallbackId = card.id || `resource-${index}`;
    const id = datasetId || fallbackId;
    const payload = payloadById.get(id);
    const searchable: Record<string, string> = {};

    for (const [key, value] of Object.entries(datasetRecord)) {
      if (!value) {
        continue;
      }
      searchable[key] = value;
    }

    if (payload) {
      for (const [key, value] of Object.entries(payload)) {
        if (key === "id" || !value) {
          continue;
        }
        searchable[key] = value;
      }
    }

    if (!searchable.name) {
      const title = card.querySelector<HTMLElement>(".resource-card__title");
      const titleText = title?.textContent?.trim();
      if (titleText) {
        searchable.name = titleText;
      }
    }

    if (!searchable.description) {
      const summary = card.querySelector<HTMLElement>(
        ".resource-card__summary"
      );
      const summaryText = summary?.textContent?.trim();
      if (summaryText) {
        searchable.description = summaryText;
      }
    }

    const contentText = card.textContent?.trim();
    if (contentText) {
      searchable.content = contentText;
    }

    if (!card.dataset.resourceId) {
      card.dataset.resourceId = id;
    }

    return {
      id,
      card,
      dataset: datasetRecord,
      searchable,
      toggleRoot: card.querySelector<HTMLElement>("[data-favorite-root]") ?? null,
    };
  });

  const searchRecords: ResourceSearchEntry[] = resources.map((resource) => {
    const record: ResourceSearchEntry = { id: resource.id };
    for (const [key, value] of Object.entries(resource.searchable)) {
      if (!value || key === "favorite" || key === "resourceId") {
        continue;
      }
      record[key] = value;
    }
    return record;
  });

  const defaultKeyOptions = Array.from(
    searchRecords.reduce((keys, record) => {
      Object.keys(record).forEach((key) => {
        if (key === "id") {
          return;
        }
        keys.add(key);
      });
      return keys;
    }, new Set<string>())
  ).map((name) => ({ name }));

  const fuzzyIndex =
    searchField &&
    searchRecords.length > 0 &&
    ((fuzzyOptions?.keys?.length ?? 0) > 0 || defaultKeyOptions.length > 0)
      ? new FuzzyIndex<ResourceSearchEntry>(searchRecords, {
          keys: fuzzyOptions?.keys?.length
            ? fuzzyOptions.keys
            : defaultKeyOptions,
          threshold: fuzzyOptions?.threshold,
          minMatchCharLength: fuzzyOptions?.minMatchCharLength,
        })
      : null;

  let favoritesState: FavoritesState = {};

  const resolveFavorite = (resource: ResourceEntry) => {
    const key = resource.toggleRoot?.dataset.favoriteKey ?? "";
    const storedFavorite = key ? favoritesState[key] : undefined;
    const isFavorite =
      Boolean(storedFavorite) || resource.dataset.favorite === "true";

    return { key, isFavorite } as const;
  };

  const applyFavorites = (items: FavoritesState) => {
    favoritesState = items ?? {};
    resources.forEach((resource) => {
      const { card, toggleRoot } = resource;
      const { isFavorite } = resolveFavorite(resource);
      resource.dataset.favorite = String(isFavorite);
      card.dataset.favorite = resource.dataset.favorite;
      const button = toggleRoot?.querySelector<HTMLButtonElement>(
        "[data-favorite-button]"
      );
      if (button) {
        button.setAttribute("aria-pressed", String(isFavorite));
      }
    });
  };

  const getFormValue = (
    formData: Nullable<FormData>,
    field: string
  ): string => {
    if (!formData) {
      return "";
    }
    const value = formData.get(field);
    return typeof value === "string" ? value : value != null ? String(value) : "";
  };

  const refreshFavoritesFromStorage = () => {
    const payload = loadFavorites();
    applyFavorites(payload.items);
  };

  const applyFilters = () => {
    const formData = form ? new FormData(form) : null;

    const activeFilters = equalityFilters.map((filter) => {
      const attribute = filter.dataAttribute ?? filter.field;
      const value = getFormValue(formData, filter.field).trim();
      return { attribute, value };
    });

    const favoritesOnly = Boolean(
      favoritesField && formData ? formData.has(favoritesField) : false
    );

    const searchQuery = searchField
      ? getFormValue(formData, searchField).trim()
      : "";

    let matchedIds: Set<string> | null = null;
    if (searchField && searchQuery) {
      if (fuzzyIndex) {
        const results = fuzzyIndex.search(searchQuery);
        matchedIds = new Set(results.map((result) => result.item.id));
      } else {
        const normalizedQuery = searchQuery.toLowerCase();
        matchedIds = new Set(
          resources
            .filter((resource) =>
              Object.values(resource.searchable).some((value) =>
                value.toLowerCase().includes(normalizedQuery)
              )
            )
            .map((resource) => resource.id)
        );
      }
    }

    resources.forEach((resource) => {
      const matchesFavorites =
        !favoritesOnly || resource.dataset.favorite === "true";
      const matchesEquality = activeFilters.every(({ attribute, value }) => {
        if (!value) {
          return true;
        }
        const datasetValue = resolveDatasetValue(resource.dataset, attribute);
        return datasetValue === value;
      });
      const matchesSearch =
        !searchField || !searchQuery || matchedIds?.has(resource.id) === true;
      resource.card.hidden = !(matchesFavorites && matchesEquality && matchesSearch);
    });
  };

  const handleChange = () => {
    applyFilters();
  };

  const handleInput = (event: Event) => {
    if (!searchField) {
      return;
    }
    const target = event.target as HTMLInputElement | null;
    if (!target || target.name !== searchField) {
      return;
    }
    applyFilters();
  };

  const handleReset = () => {
    window.setTimeout(applyFilters, 0);
  };

  refreshFavoritesFromStorage();

  applyFilters();

  form?.addEventListener("change", handleChange);
  form?.addEventListener("input", handleInput);
  form?.addEventListener("reset", handleReset);

  const unsubscribe = subscribeToFavorites((detail) => {
    if (!detail || !detail.payload) return;
    applyFavorites(detail.payload.items);
    applyFilters();
  });

  const cleanup = () => {
    form?.removeEventListener("change", handleChange);
    form?.removeEventListener("input", handleInput);
    form?.removeEventListener("reset", handleReset);
    unsubscribe?.();
  };

  window.addEventListener("astro:before-swap", cleanup, { once: true });

  return cleanup;
}
