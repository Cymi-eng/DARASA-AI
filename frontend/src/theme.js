const SETTINGS_KEY = "darasa_student_settings";

const DEFAULT_SETTINGS = {
  darkMode: false,
  compactMode: false,
  reduceAnimations: false,
  showNotifications: true,
};

export function getStudentSettings() {
  try {
    const stored = localStorage.getItem(
      SETTINGS_KEY
    );

    if (!stored) {
      return {
        ...DEFAULT_SETTINGS,
      };
    }

    const parsed = JSON.parse(stored);

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return {
      ...DEFAULT_SETTINGS,
    };
  }
}

export function applyStudentTheme(
  settings = getStudentSettings()
) {
  const root = document.documentElement;

  root.classList.toggle(
    "dark",
    Boolean(settings.darkMode)
  );

  root.classList.toggle(
    "compact-mode",
    Boolean(settings.compactMode)
  );

  root.classList.toggle(
    "reduce-motion",
    Boolean(settings.reduceAnimations)
  );

  root.dataset.studentTheme =
    settings.darkMode
      ? "dark"
      : "light";

  root.dataset.studentDensity =
    settings.compactMode
      ? "compact"
      : "comfortable";
}

export function saveStudentSettings(
  settings
) {
  const normalized = {
    ...DEFAULT_SETTINGS,
    ...settings,
  };

  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(normalized)
  );

  applyStudentTheme(
    normalized
  );

  window.dispatchEvent(
    new CustomEvent(
      "darasa-settings-changed",
      {
        detail: normalized,
      }
    )
  );

  return normalized;
}

export function resetStudentSettings() {
  localStorage.removeItem(
    SETTINGS_KEY
  );

  const defaults = {
    ...DEFAULT_SETTINGS,
  };

  applyStudentTheme(
    defaults
  );

  window.dispatchEvent(
    new CustomEvent(
      "darasa-settings-changed",
      {
        detail: defaults,
      }
    )
  );

  return defaults;
}

export {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
};