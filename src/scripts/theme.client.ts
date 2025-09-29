const STORAGE_KEY = "improv-toolbox-theme" as const;
const CYCLE_ORDER = ["system", "light", "dark"] as const;
type ThemePreference = (typeof CYCLE_ORDER)[number];

const PREFERENCE_LABEL: Record<ThemePreference, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
const root = document.documentElement;
const themeMeta = document.querySelector(
  'meta[name="theme-color"]'
) as HTMLMetaElement | null;
const metaThemeColors: Record<"light" | "dark", string> = {
  light: themeMeta?.dataset.themeColorLight ?? "#eef1ff",
  dark: themeMeta?.dataset.themeColorDark ?? "#050b19",
};
const toggleButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]")
);

let activePreference: ThemePreference = getInitialPreference();
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

function applyPreference(
  preference: ThemePreference,
  { persist = true }: { persist?: boolean } = {}
) {
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
      /* no-op */
    }
  }
}

function getInitialPreference(): ThemePreference {
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

function hasStoredPreference(): boolean {
  return Boolean(readStoredPreference());
}

function readStoredPreference(): ThemePreference | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isThemePreference(stored)) {
      return stored;
    }
  } catch {
    /* ignored */
  }
  return null;
}

function resolvePreference(pref: ThemePreference): "light" | "dark" {
  if (pref === "system") {
    return prefersDark.matches ? "dark" : "light";
  }
  return pref;
}

function getNextPreference(current: ThemePreference): ThemePreference {
  if (current === "system") {
    return prefersDark.matches ? "light" : "dark";
  }
  if (current === "light") {
    return "dark";
  }
  return "system";
}

function updateMetaColor(theme: "light" | "dark") {
  if (!themeMeta) return;
  themeMeta.content = metaThemeColors[theme];
}

function updateToggleLabels(preference: ThemePreference) {
  const currentLabel = PREFERENCE_LABEL[preference];
  const nextLabel = PREFERENCE_LABEL[getNextPreference(preference)];
  toggleButtons.forEach((button) => {
    button.setAttribute(
      "aria-label",
      `Theme: ${currentLabel}. Activate to switch to ${nextLabel} mode.`
    );
  });
}

function isThemePreference(value: unknown): value is ThemePreference {
  return CYCLE_ORDER.includes(value as ThemePreference);
}
