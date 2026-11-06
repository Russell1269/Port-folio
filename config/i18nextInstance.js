/**
 * Initialises i18next exactly once (Node caches modules), then exposes a
 * promise that routes can await before rendering so that the namespace
 * files are guaranteed to be in memory.
 */
const i18next = require("i18next");
const Backend = require("i18next-fs-backend");

const {
  LOCALES_DIR,
  SUPPORTED_LNGS,
  FALLBACK_LNG,
  PRELOAD_NS,
  DEFAULT_NS,
  NAMESPACES,
} = require("./i18n");

if (!i18next.isInitialized) {
  i18next.use(Backend).init({
    // ---- language resolution -------------------------------------------------
    supportedLngs: SUPPORTED_LNGS,
    fallbackLng: FALLBACK_LNG,
    nonExplicitSupportedLngs: true, // "en-US" -> "en"
    load: "languageOnly", // never look for locales/en-US/common.json
    preload: SUPPORTED_LNGS,

    // ---- namespaces ----------------------------------------------------------
    ns: NAMESPACES,
    defaultNS: DEFAULT_NS,
    fallbackNS: DEFAULT_NS, // `t('nav.home')` resolves against common automatically
    preloadNamespaces: PRELOAD_NS,

    // ---- file backend --------------------------------------------------------
    backend: {
      loadPath: `${LOCALES_DIR.replace(/\\/g, "/")}/{{lng}}/{{ns}}.json`,
      addPath: `${LOCALES_DIR.replace(/\\/g, "/")}/{{lng}}/{{ns}}.missing.json`,
      // Files are validated at startup (see scripts/check-i18n.js); a JSON
      // syntax error is fatal rather than silently swallowed.
      jsonIndent: 2,
    },

    // ---- behaviour -----------------------------------------------------------
    // Interpolation: {{name}} style, HTML is preserved (escaping is decided in EJS).
    interpolation: {
      escapeValue: false,
      // Skip interpolation for keys that legitimately contain braces.
      skipOnVariables: false,
    },
    // Return the key (not "") when a translation is missing so QA can spot it.
    returnEmptyString: false,
    returnNull: false,

    // Missing keys are reported once per (lng, ns, key) via the handler below.
    saveMissing: false,
    missingKeyHandler: (lngs, ns, key) => {
      console.warn(
        `[i18n] missing translation: ${lngs.join(",")} ${ns}:${key}`,
      );
    },

    // ---- pluralisation / formatting -------------------------------------------
    // Intl.PluralRules handles English (one/other) and Bangla (one/other) correctly.
    compatibilityJSON: undefined,
    // Number/date/currency formatting is done explicitly with Intl in
    // utility/i18n.js so EJS never hard-codes a locale.

    debug: process.env.I18N_DEBUG === "true",
  });
}

/** Resolves once the critical namespaces are loaded. */
const i18nReady = i18next.loadNamespaces(PRELOAD_NS);

module.exports = { i18next, i18nReady };
