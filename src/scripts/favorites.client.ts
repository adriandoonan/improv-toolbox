import {
  loadFavorites,
  toggleFavorite,
  subscribeToFavorites,
  isStorageReady,
  FAVORITES_EVENT,
} from "../utils/favorites";

const ROOT_SELECTOR = "[data-favorite-root]";
const INITIALIZED_FLAG = "favoriteInitialized";

const cleanupMap = new WeakMap<Element, () => void>();

function disableControl(root: HTMLElement, message: string) {
  const button = root.querySelector<HTMLButtonElement>("[data-favorite-button]");
  const srText = root.querySelector<HTMLElement>("[data-favorite-sr-text]");
  const statusEl = root.querySelector<HTMLElement>("[data-favorite-status]");
  const fallbackEl = root.querySelector<HTMLElement>("[data-favorite-fallback]");
  const addLabel = root.dataset.favoriteAddLabel ?? "Save to favorites";
  const srAddLabel = root.dataset.favoriteSrAddLabel ?? addLabel;

  if (button) {
    button.disabled = true;
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", addLabel);
  }
  if (srText) {
    srText.textContent = srAddLabel;
  }
  if (fallbackEl) {
    if (message) {
      fallbackEl.hidden = false;
      fallbackEl.textContent = message;
    } else {
      fallbackEl.hidden = true;
      fallbackEl.textContent = "";
    }
  }
  if (statusEl && message) {
    statusEl.textContent = message;
  }
}

function setupFavorite(root: HTMLElement) {
  if (root.dataset[INITIALIZED_FLAG] === "true") {
    return;
  }

  const button = root.querySelector<HTMLButtonElement>("[data-favorite-button]");
  const srText = root.querySelector<HTMLElement>("[data-favorite-sr-text]");
  const statusEl = root.querySelector<HTMLElement>("[data-favorite-status]");
  const fallbackEl = root.querySelector<HTMLElement>("[data-favorite-fallback]");

  const key = root.dataset.favoriteKey ?? "";
  const addLabel = root.dataset.favoriteAddLabel ?? "Save to favorites";
  const removeLabel = root.dataset.favoriteRemoveLabel ?? "Remove from favorites";
  const srAddLabel = root.dataset.favoriteSrAddLabel ?? addLabel;
  const srRemoveLabel = root.dataset.favoriteSrRemoveLabel ?? removeLabel;
  const statusAdd = root.dataset.favoriteStatusAdd ?? "Added to favorites.";
  const statusRemove = root.dataset.favoriteStatusRemove ?? "Removed from favorites.";
  const fallbackMessage = root.dataset.favoriteFallbackMessage ?? "";

  if (!key || !button) {
    disableControl(root, "Favorites are unavailable for this entry.");
    return;
  }

  if (!isStorageReady()) {
    disableControl(root, "Favorites are unavailable right now.");
    return;
  }

  const toggleText = (isFavorite: boolean) => {
    button.setAttribute("aria-pressed", String(isFavorite));
    button.setAttribute("aria-label", isFavorite ? removeLabel : addLabel);
    if (srText) {
      srText.textContent = isFavorite ? srRemoveLabel : srAddLabel;
    }
  };

  const announce = (isFavorite: boolean) => {
    if (!statusEl) return;
    statusEl.textContent = isFavorite ? statusAdd : statusRemove;
  };

  if (fallbackEl) {
    if (fallbackMessage) {
      fallbackEl.hidden = false;
      fallbackEl.textContent = fallbackMessage;
    } else {
      fallbackEl.hidden = true;
      fallbackEl.textContent = "";
    }
  }

  button.disabled = false;

  const detailInput = {
    type: root.dataset.favoriteType,
    slug: root.dataset.favoriteSlug,
    title: root.dataset.favoriteTitle,
    description: root.dataset.favoriteDescription,
  };

  const payload = loadFavorites();
  toggleText(Boolean(payload.items[key]));

  const clickController = new AbortController();
  const handleClick = () => {
    const detail = toggleFavorite(key, detailInput);
    if (!detail) return;
    const isFavorite = Boolean(detail.isFavorite);
    toggleText(isFavorite);
    announce(isFavorite);
  };

  button.addEventListener("click", handleClick, { signal: clickController.signal });

  const handleChange = (detail: { key?: string; payload?: { items: Record<string, unknown> } }) => {
    if (!detail || !detail.payload) return;
    const isFavorite = Boolean(detail.payload.items[key]);
    toggleText(isFavorite);
    if (detail.key === key) {
      announce(isFavorite);
    }
  };

  const unsubscribe = subscribeToFavorites(handleChange);

  const cleanup = () => {
    clickController.abort();
    unsubscribe?.();
    cleanupMap.delete(root);
    delete root.dataset[INITIALIZED_FLAG];
    if (fallbackEl) {
      if (fallbackMessage) {
        fallbackEl.hidden = false;
        fallbackEl.textContent = fallbackMessage;
      } else {
        fallbackEl.hidden = true;
        fallbackEl.textContent = "";
      }
    }
  };

  cleanupMap.set(root, cleanup);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.removedNodes) {
        if (node === root || (node instanceof Element && node.contains(root))) {
          observer.disconnect();
          cleanup();
          return;
        }
      }
    }
  });

  if (root.parentElement) {
    observer.observe(root.parentElement, { childList: true, subtree: true });
  } else {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.addEventListener(
    "astro:before-swap",
    () => {
      observer.disconnect();
      cleanup();
    },
    { once: true }
  );

  root.dataset.favoriteEvent = root.dataset.favoriteEvent ?? FAVORITES_EVENT;
  root.dataset[INITIALIZED_FLAG] = "true";
}

function initFavorites() {
  document.querySelectorAll<HTMLElement>(ROOT_SELECTOR).forEach((root) => {
    setupFavorite(root);
  });
}

function teardownAll() {
  document.querySelectorAll<HTMLElement>(ROOT_SELECTOR).forEach((root) => {
    const cleanup = cleanupMap.get(root);
    if (cleanup) {
      cleanup();
    }
  });
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFavorites, { once: true });
  } else {
    initFavorites();
  }

  document.addEventListener("astro:page-load", () => {
    initFavorites();
  });

  document.addEventListener("astro:before-swap", () => {
    teardownAll();
  });
}
