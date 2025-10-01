const STORAGE_KEY = "improv-toolbox-theme";
const CYCLE_ORDER = ["system", "light", "dark"];
const PREFERENCE_LABEL = {
  system: "System",
  light: "Light",
  dark: "Dark"
};
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
const root = document.documentElement;
const themeMeta = document.querySelector(
  'meta[name="theme-color"]'
);
const metaThemeColors = {
  light: themeMeta?.dataset.themeColorLight ?? "#eef1ff",
  dark: themeMeta?.dataset.themeColorDark ?? "#050b19"
};
const toggleButtons = Array.from(
  document.querySelectorAll("[data-theme-toggle]")
);
let activePreference = getInitialPreference();
applyPreference(activePreference, { persist: hasStoredPreference() });
const handleMediaChange = () => {
  if (activePreference === "system") {
    applyPreference("system", { persist: false });
  }
};
if (typeof prefersDark.addEventListener === "function") {
  prefersDark.addEventListener("change", handleMediaChange);
} else if (typeof prefersDark.addListener === "function") {
  prefersDark.addListener(handleMediaChange);
}
toggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const next = getNextPreference(activePreference);
    applyPreference(next);
  });
});
function applyPreference(preference, { persist = true } = {}) {
  activePreference = preference;
  const resolved = resolvePreference(preference);
  root.dataset.themePreference = preference;
  root.dataset.theme = resolved;
  updateMetaColor(resolved);
  updateToggleLabels(preference);
  if (persist) {
    try {
      window.localStorage.setItem(STORAGE_KEY, preference);
    } catch {
    }
  }
}
function getInitialPreference() {
  const stored = readStoredPreference();
  if (stored) {
    return stored;
  }
  const attr = root.dataset.themePreference;
  if (isThemePreference(attr)) {
    return attr;
  }
  return "system";
}
function hasStoredPreference() {
  return Boolean(readStoredPreference());
}
function readStoredPreference() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isThemePreference(stored)) {
      return stored;
    }
  } catch {
  }
  return null;
}
function resolvePreference(pref) {
  if (pref === "system") {
    return prefersDark.matches ? "dark" : "light";
  }
  return pref;
}
function getNextPreference(current) {
  if (current === "system") {
    return prefersDark.matches ? "light" : "dark";
  }
  if (current === "light") {
    return "dark";
  }
  return "system";
}
function updateMetaColor(theme) {
  if (!themeMeta) return;
  themeMeta.content = metaThemeColors[theme];
}
function updateToggleLabels(preference) {
  const currentLabel = PREFERENCE_LABEL[preference];
  const nextLabel = PREFERENCE_LABEL[getNextPreference(preference)];
  toggleButtons.forEach((button) => {
    button.setAttribute(
      "aria-label",
      `Theme: ${currentLabel}. Activate to switch to ${nextLabel} mode.`
    );
  });
}
function isThemePreference(value) {
  return CYCLE_ORDER.includes(value);
}
