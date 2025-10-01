// src/utils/favorites.ts
var STORAGE_NAMESPACE = "improv-toolbox:favorites";
var STORAGE_VERSION = 1;
var STORAGE_PROBE_KEY = `${STORAGE_NAMESPACE}-probe`;
var CHANGE_EVENT = "improv-favorites:change";
var FAVORITES_EVENT = CHANGE_EVENT;
var storageStatus = null;
var storageListenerBound = false;
function isStorageReady() {
  if (typeof window === "undefined" || !("localStorage" in window)) {
    storageStatus = false;
    return false;
  }
  if (storageStatus === true) {
    return true;
  }
  try {
    window.localStorage.setItem(STORAGE_PROBE_KEY, "ok");
    window.localStorage.removeItem(STORAGE_PROBE_KEY);
    storageStatus = true;
  } catch (error) {
    console.warn("Local storage is not available for favorites", error);
    storageStatus = false;
  }
  return storageStatus ?? false;
}
function defaultPayload() {
  return {
    version: STORAGE_VERSION,
    items: {}
  };
}
function sanitizeItems(items) {
  const sanitized = {};
  for (const [key, value] of Object.entries(items)) {
    if (!value || typeof value !== "object") {
      continue;
    }
    const entryKey = typeof value.key === "string" ? value.key : key;
    if (!entryKey) {
      continue;
    }
    const addedAt = typeof value.addedAt === "string" ? value.addedAt : (/* @__PURE__ */ new Date()).toISOString();
    sanitized[entryKey] = {
      ...value,
      key: entryKey,
      addedAt
    };
  }
  return sanitized;
}
function ensureStorageListener() {
  if (storageListenerBound) {
    return;
  }
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") {
    return;
  }
  window.addEventListener("storage", (event) => {
    if (event.key && event.key !== STORAGE_NAMESPACE) {
      return;
    }
    const payload = loadFavorites();
    dispatchFavoritesChange({ payload });
  });
  storageListenerBound = true;
}
function loadFavorites() {
  if (!isStorageReady()) {
    return defaultPayload();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_NAMESPACE);
    if (!raw) {
      return defaultPayload();
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return defaultPayload();
    }
    if (parsed.version !== STORAGE_VERSION || typeof parsed.items !== "object") {
      return defaultPayload();
    }
    return {
      version: STORAGE_VERSION,
      items: sanitizeItems(parsed.items)
    };
  } catch (error) {
    console.warn("Failed to read favorites payload", error);
    storageStatus = false;
    return defaultPayload();
  }
}
function saveFavorites(payload) {
  if (!isStorageReady()) {
    return;
  }
  try {
    window.localStorage.setItem(
      STORAGE_NAMESPACE,
      JSON.stringify({
        version: STORAGE_VERSION,
        items: payload.items
      })
    );
  } catch (error) {
    console.warn("Failed to persist favorites payload", error);
    storageStatus = false;
  }
}
function toggleFavorite(key, entryInput = {}) {
  if (!key) {
    return null;
  }
  ensureStorageListener();
  const payload = loadFavorites();
  const items = { ...payload.items };
  const existing = items[key];
  let isFavorite;
  let entry;
  if (existing) {
    delete items[key];
    isFavorite = false;
    entry = void 0;
  } else {
    const addedAt = (/* @__PURE__ */ new Date()).toISOString();
    entry = {
      key,
      addedAt,
      ...entryInput
    };
    items[key] = entry;
    isFavorite = true;
  }
  const nextPayload = {
    version: STORAGE_VERSION,
    items
  };
  saveFavorites(nextPayload);
  const detail = {
    key,
    isFavorite,
    payload: nextPayload,
    entry
  };
  dispatchFavoritesChange(detail);
  return detail;
}
function dispatchFavoritesChange(detail) {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") {
    return;
  }
  if (typeof CustomEvent !== "function") {
    return;
  }
  const event = new CustomEvent(CHANGE_EVENT, { detail });
  window.dispatchEvent(event);
}
function subscribeToFavorites(listener) {
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") {
    return () => {
    };
  }
  ensureStorageListener();
  const handler = (event) => {
    const custom = event;
    if (!custom.detail) {
      return;
    }
    listener(custom.detail);
  };
  window.addEventListener(CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
  };
}

// src/scripts/favorites.client.ts
var ROOT_SELECTOR = "[data-favorite-root]";
var INITIALIZED_FLAG = "favoriteInitialized";
var cleanupMap = /* @__PURE__ */ new WeakMap();
function disableControl(root, message) {
  const button = root.querySelector("[data-favorite-button]");
  const srText = root.querySelector("[data-favorite-sr-text]");
  const statusEl = root.querySelector("[data-favorite-status]");
  const fallbackEl = root.querySelector("[data-favorite-fallback]");
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
function setupFavorite(root) {
  if (root.dataset[INITIALIZED_FLAG] === "true") {
    return;
  }
  const button = root.querySelector("[data-favorite-button]");
  const srText = root.querySelector("[data-favorite-sr-text]");
  const statusEl = root.querySelector("[data-favorite-status]");
  const fallbackEl = root.querySelector("[data-favorite-fallback]");
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
  const toggleText = (isFavorite) => {
    button.setAttribute("aria-pressed", String(isFavorite));
    button.setAttribute("aria-label", isFavorite ? removeLabel : addLabel);
    if (srText) {
      srText.textContent = isFavorite ? srRemoveLabel : srAddLabel;
    }
  };
  const announce = (isFavorite) => {
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
    description: root.dataset.favoriteDescription
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
  const handleChange = (detail) => {
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
        if (node === root || node instanceof Element && node.contains(root)) {
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
  document.querySelectorAll(ROOT_SELECTOR).forEach((root) => {
    setupFavorite(root);
  });
}
function teardownAll() {
  document.querySelectorAll(ROOT_SELECTOR).forEach((root) => {
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
