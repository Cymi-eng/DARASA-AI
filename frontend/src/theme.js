const SETTINGS_KEY = "darasa_student_settings";

export const DEFAULT_SETTINGS = {
  darkMode: false,
  compactMode: false,
  reduceAnimations: false,
  showNotifications: true,
};

function normalizeSettings(settings = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
  };
}

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

    return normalizeSettings(parsed);
  } catch {
    return {
      ...DEFAULT_SETTINGS,
    };
  }
}

export function applyStudentTheme(
  settings = getStudentSettings()
) {
  const normalized =
    normalizeSettings(settings);

  const root =
    document.documentElement;

  const body =
    document.body;

  // ============================================================
  // ROOT STATE
  // ============================================================

  root.classList.toggle(
    "dark",
    normalized.darkMode
  );

  root.classList.toggle(
    "compact-mode",
    normalized.compactMode
  );

  root.classList.toggle(
    "reduce-motion",
    normalized.reduceAnimations
  );

  // ============================================================
  // BODY STATE
  // ============================================================

  body.classList.toggle(
    "darasa-dark",
    normalized.darkMode
  );

  body.classList.toggle(
    "darasa-compact",
    normalized.compactMode
  );

  body.classList.toggle(
    "darasa-reduce-motion",
    normalized.reduceAnimations
  );

  // ============================================================
  // DATA ATTRIBUTES
  // ============================================================

  root.dataset.studentTheme =
    normalized.darkMode
      ? "dark"
      : "light";

  root.dataset.studentDensity =
    normalized.compactMode
      ? "compact"
      : "comfortable";

  root.dataset.studentMotion =
    normalized.reduceAnimations
      ? "reduced"
      : "full";

  root.dataset.notifications =
    normalized.showNotifications
      ? "visible"
      : "hidden";

  // ============================================================
  // DARASA-AI THEME VARIABLES
  // ============================================================

  /*
   * LIGHT THEME
   * ------------------------------------------------------------
   * Clean, warm educational SaaS interface.
   *
   * DARK THEME
   * ------------------------------------------------------------
   * Professional slate/charcoal interface.
   *
   * Emerald is used as the brand accent instead of covering
   * the entire interface in green.
   */

  root.style.setProperty(
    "--darasa-page-bg",
    normalized.darkMode
      ? "#0B1110"
      : "#F5F7F4"
  );

  root.style.setProperty(
    "--darasa-surface",
    normalized.darkMode
      ? "#111918"
      : "#FFFFFF"
  );

  root.style.setProperty(
    "--darasa-surface-soft",
    normalized.darkMode
      ? "#151F1D"
      : "#F7F9F6"
  );

  root.style.setProperty(
    "--darasa-border",
    normalized.darkMode
      ? "#293632"
      : "#E2E8E3"
  );

  root.style.setProperty(
    "--darasa-text",
    normalized.darkMode
      ? "#F1F5F3"
      : "#17382E"
  );

  root.style.setProperty(
    "--darasa-text-muted",
    normalized.darkMode
      ? "#9AA9A3"
      : "#718079"
  );

  root.style.setProperty(
    "--darasa-input-bg",
    normalized.darkMode
      ? "#0F1716"
      : "#FFFFFF"
  );

  root.style.setProperty(
    "--darasa-input-text",
    normalized.darkMode
      ? "#F1F5F3"
      : "#17382E"
  );

  root.style.setProperty(
    "--darasa-accent-soft",
    normalized.darkMode
      ? "#123B2C"
      : "#EAF4EE"
  );

  root.style.setProperty(
    "--darasa-shadow",
    normalized.darkMode
      ? "0 12px 35px rgba(0, 0, 0, 0.28)"
      : "0 10px 30px rgba(23, 56, 46, 0.06)"
  );

  // ============================================================
  // BRAND COLORS
  // ============================================================

  root.style.setProperty(
    "--darasa-accent",
    normalized.darkMode
      ? "#35C58D"
      : "#087F5B"
  );

  root.style.setProperty(
    "--darasa-accent-hover",
    normalized.darkMode
      ? "#43D49B"
      : "#066B4D"
  );

  root.style.setProperty(
    "--darasa-accent-dark",
    normalized.darkMode
      ? "#13845F"
      : "#056044"
  );

  // ============================================================
  // SIDEBAR COLORS
  // ============================================================

  root.style.setProperty(
    "--darasa-sidebar-bg",
    normalized.darkMode
      ? "#080F0D"
      : "#FFFFFF"
  );

  root.style.setProperty(
    "--darasa-sidebar-border",
    normalized.darkMode
      ? "#24312D"
      : "#E2E8E3"
  );

  root.style.setProperty(
    "--darasa-sidebar-active",
    normalized.darkMode
      ? "#163C2E"
      : "#EAF4EE"
  );

  root.style.setProperty(
    "--darasa-sidebar-text",
    normalized.darkMode
      ? "#E7EEEB"
      : "#17382E"
  );

  root.style.setProperty(
    "--darasa-sidebar-muted",
    normalized.darkMode
      ? "#879891"
      : "#718079"
  );

  // ============================================================
  // HEADER COLORS
  // ============================================================

  root.style.setProperty(
    "--darasa-header-bg",
    normalized.darkMode
      ? "#0F1715"
      : "#FFFFFF"
  );

  root.style.setProperty(
    "--darasa-header-border",
    normalized.darkMode
      ? "#24312D"
      : "#E2E8E3"
  );

  // ============================================================
  // DENSITY
  // ============================================================

  root.style.setProperty(
    "--darasa-density",
    normalized.compactMode
      ? "0.82"
      : "1"
  );

  // ============================================================
  // COLOR SCHEME
  // ============================================================

  root.style.colorScheme =
    normalized.darkMode
      ? "dark"
      : "light";

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  root.dataset.notifications =
    normalized.showNotifications
      ? "visible"
      : "hidden";
}


// ================================================================
// SAVE SETTINGS
// ================================================================

export function saveStudentSettings(
  settings
) {
  const normalized =
    normalizeSettings(settings);

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


// ================================================================
// RESET SETTINGS
// ================================================================

export function resetStudentSettings() {
  const defaults = {
    ...DEFAULT_SETTINGS,
  };

  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(defaults)
  );

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