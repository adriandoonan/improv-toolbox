import {
  loadFavorites,
  subscribeToFavorites,
} from "./favorites";

interface EqualityFilterDefinition {
  field: string;
  dataAttribute?: string;
}

interface SetupResourceListFilteringOptions {
  listSelector: string;
  formSelector?: string;
  favoritesField?: string;
  equalityFilters?: EqualityFilterDefinition[];
}

type FavoritesState = Record<string, unknown>;

type Nullable<T> = T | null | undefined;

export function setupResourceListFiltering({
  listSelector,
  formSelector = ".filter-form",
  favoritesField = "favoritesOnly",
  equalityFilters = [],
}: SetupResourceListFilteringOptions): () => void {
  const list = document.querySelector<HTMLElement>(listSelector);
  const form = document.querySelector<HTMLFormElement>(formSelector);
  const cards = list
    ? Array.from(list.querySelectorAll<HTMLLIElement>(".resource-card"))
    : [];

  if (!cards.length) {
    return () => {};
  }

  let favoritesState: FavoritesState = {};

  const resolveFavorite = (card: HTMLLIElement) => {
    const toggleRoot = card.querySelector<HTMLElement>("[data-favorite-root]");
    const key = toggleRoot?.dataset.favoriteKey ?? "";
    const storedFavorite = key ? favoritesState[key] : undefined;
    const isFavorite =
      Boolean(storedFavorite) || card.dataset.favorite === "true";

    return { toggleRoot, key, isFavorite } as const;
  };

  const applyFavorites = (items: FavoritesState) => {
    favoritesState = items ?? {};
    cards.forEach((card) => {
      const { toggleRoot, isFavorite } = resolveFavorite(card);
      card.dataset.favorite = String(isFavorite);
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
      const value = getFormValue(formData, filter.field);
      return { attribute, value };
    });

    const favoritesOnly = Boolean(
      favoritesField && formData ? formData.has(favoritesField) : false
    );

    cards.forEach((card) => {
      const { isFavorite } = resolveFavorite(card);
      const matchesFavorites = !favoritesOnly || isFavorite;
      const matchesEquality = activeFilters.every(({ attribute, value }) => {
        if (!value) {
          return true;
        }
        const dataset = card.dataset as Record<string, string | undefined>;
        return (dataset[attribute] ?? "") === value;
      });
      card.hidden = !(matchesFavorites && matchesEquality);
    });
  };


  refreshFavoritesFromStorage();

  applyFilters();

  form?.addEventListener("change", applyFilters);

  const unsubscribe = subscribeToFavorites((detail) => {
    if (!detail || !detail.payload) return;
    applyFavorites(detail.payload.items);
    applyFilters();
  });

  const cleanup = () => {
    form?.removeEventListener("change", applyFilters);
    unsubscribe?.();
  };

  window.addEventListener("astro:before-swap", cleanup, { once: true });

  return cleanup;
}
