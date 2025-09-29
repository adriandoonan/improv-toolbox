const STORAGE_NAMESPACE = "improv-toolbox:favorites";
const STORAGE_VERSION = 1;
const STORAGE_PROBE_KEY = `${STORAGE_NAMESPACE}-probe`;
const CHANGE_EVENT = "improv-favorites:change";

export const FAVORITES_EVENT = CHANGE_EVENT;

export interface FavoriteEntry {
  key: string;
  type?: string;
  slug?: string;
  title?: string;
  description?: string;
  addedAt: string;
  [field: string]: unknown;
}

export interface FavoritesPayload {
  version: number;
  items: Record<string, FavoriteEntry>;
}

export interface FavoriteChangeDetail {
  key?: string;
  isFavorite?: boolean;
  payload: FavoritesPayload;
  entry?: FavoriteEntry;
}

export type FavoritesChangeListener = (detail: FavoriteChangeDetail) => void;

export interface FavoriteEntryInput
  extends Omit<Partial<FavoriteEntry>, "key" | "addedAt"> {}

export interface FavoriteKeyParts {
  type: string;
  slug: string;
}

let storageStatus: boolean | null = null;
let storageListenerBound = false;

export function favoriteKey(type: string, slug: string): string {
  return `${type}:${slug}`;
}

export function parseFavoriteKey(key: string): FavoriteKeyParts | null {
  const separatorIndex = key.indexOf(":");
  if (separatorIndex === -1) {
    return null;
  }
  const type = key.slice(0, separatorIndex);
  const slug = key.slice(separatorIndex + 1);
  if (!type || !slug) {
    return null;
  }
  return { type, slug };
}

export function isStorageReady(): boolean {
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

function defaultPayload(): FavoritesPayload {
  return {
    version: STORAGE_VERSION,
    items: {},
  };
}

function sanitizeItems(
  items: Record<string, FavoriteEntry>
): Record<string, FavoriteEntry> {
  const sanitized: Record<string, FavoriteEntry> = {};
  for (const [key, value] of Object.entries(items)) {
    if (!value || typeof value !== "object") {
      continue;
    }
    const entryKey = typeof value.key === "string" ? value.key : key;
    if (!entryKey) {
      continue;
    }
    const addedAt =
      typeof value.addedAt === "string" ? value.addedAt : new Date().toISOString();
    sanitized[entryKey] = {
      ...value,
      key: entryKey,
      addedAt,
    };
  }
  return sanitized;
}

function ensureStorageListener(): void {
  if (storageListenerBound) {
    return;
  }
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") {
    return;
  }
  window.addEventListener("storage", (event: StorageEvent) => {
    if (event.key && event.key !== STORAGE_NAMESPACE) {
      return;
    }
    const payload = loadFavorites();
    dispatchFavoritesChange({ payload });
  });
  storageListenerBound = true;
}

export function loadFavorites(): FavoritesPayload {
  if (!isStorageReady()) {
    return defaultPayload();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_NAMESPACE);
    if (!raw) {
      return defaultPayload();
    }
    const parsed = JSON.parse(raw) as FavoritesPayload;
    if (!parsed || typeof parsed !== "object") {
      return defaultPayload();
    }
    if (parsed.version !== STORAGE_VERSION || typeof parsed.items !== "object") {
      return defaultPayload();
    }
    return {
      version: STORAGE_VERSION,
      items: sanitizeItems(parsed.items as Record<string, FavoriteEntry>),
    };
  } catch (error) {
    console.warn("Failed to read favorites payload", error);
    storageStatus = false;
    return defaultPayload();
  }
}

function saveFavorites(payload: FavoritesPayload): void {
  if (!isStorageReady()) {
    return;
  }
  try {
    window.localStorage.setItem(
      STORAGE_NAMESPACE,
      JSON.stringify({
        version: STORAGE_VERSION,
        items: payload.items,
      })
    );
  } catch (error) {
    console.warn("Failed to persist favorites payload", error);
    storageStatus = false;
  }
}

export function toggleFavorite(
  key: string,
  entryInput: FavoriteEntryInput = {}
): FavoriteChangeDetail | null {
  if (!key) {
    return null;
  }
  ensureStorageListener();
  const payload = loadFavorites();
  const items = { ...payload.items };
  const existing = items[key];
  let isFavorite: boolean;
  let entry: FavoriteEntry | undefined;

  if (existing) {
    delete items[key];
    isFavorite = false;
    entry = undefined;
  } else {
    const addedAt = new Date().toISOString();
    entry = {
      key,
      addedAt,
      ...entryInput,
    };
    items[key] = entry;
    isFavorite = true;
  }

  const nextPayload: FavoritesPayload = {
    version: STORAGE_VERSION,
    items,
  };

  saveFavorites(nextPayload);

  const detail: FavoriteChangeDetail = {
    key,
    isFavorite,
    payload: nextPayload,
    entry,
  };

  dispatchFavoritesChange(detail);

  return detail;
}

function dispatchFavoritesChange(detail: FavoriteChangeDetail): void {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") {
    return;
  }
  if (typeof CustomEvent !== "function") {
    return;
  }
  const event = new CustomEvent<FavoriteChangeDetail>(CHANGE_EVENT, { detail });
  window.dispatchEvent(event);
}

export function subscribeToFavorites(
  listener: FavoritesChangeListener
): () => void {
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") {
    return () => {};
  }
  ensureStorageListener();
  const handler = (event: Event) => {
    const custom = event as CustomEvent<FavoriteChangeDetail>;
    if (!custom.detail) {
      return;
    }
    listener(custom.detail);
  };
  window.addEventListener(CHANGE_EVENT, handler as EventListener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler as EventListener);
  };
}

