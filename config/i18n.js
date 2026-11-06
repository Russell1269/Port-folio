/**
 * i18n configuration — the single place where languages, namespaces and
 * backend behaviour are defined. Nothing else in the app should hard-code
 * a language code or a namespace name.
 */
const path = require("path");

const LOCALES_DIR = path.join(__dirname, "..", "locales");

/**
 * Registry of every language the site supports.
 * Adding a new language = add an entry here + create `locales/<code>/`.
 * The rest of the codebase never needs to change.
 */
const LANGUAGES = Object.freeze({
  en: Object.freeze({
    code: "en",
    label: "English", // endonym — a language is always shown in its own script
    short: "EN",
    htmlLang: "en",
    dir: "ltr",
    ogLocale: "en_US",
  }),
  bn: Object.freeze({
    code: "bn",
    label: "বাংলা",
    short: "বাংলা",
    htmlLang: "bn",
    dir: "ltr", // Bangla is LTR; only Arabic/Hebrew/Urdu need "rtl"
    ogLocale: "bn_BD",
  }),
});

const SUPPORTED_LNGS = Object.freeze(Object.keys(LANGUAGES));
const FALLBACK_LNG = "en";

/**
 * Namespace registry.
 * - `PRELOAD_NS` ships with every request (navbar/footer render on every page).
 * - Page namespaces are lazy-loaded only by the routes that need them.
 */
const NAMESPACES = Object.freeze([
  "common",
  "footer",
  "home",
  "about",
  "projects",
  "project",
  "blogs",
  "publication",
  "contact",
  "admin",
  "errors",
]);

const PRELOAD_NS = Object.freeze(["common", "footer"]);

const DEFAULT_NS = "common";

/**
 * Normalise any incoming locale-ish string to a supported language code.
 * Accepts "en", "en-US", "en_US", "BN-bd" … and rejects anything unknown.
 * Returning `null` (instead of a default) lets the detector fall through to
 * the next source in the priority chain.
 */
function normalizeLanguage(value) {
  if (typeof value !== "string") return null;
  const primary = value.trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LNGS.includes(primary) ? primary : null;
}

const COOKIE_NAME = "lang";
const LANGUAGE_COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

module.exports = {
  LOCALES_DIR,
  LANGUAGES,
  SUPPORTED_LNGS,
  FALLBACK_LNG,
  NAMESPACES,
  PRELOAD_NS,
  DEFAULT_NS,
  COOKIE_NAME,
  LANGUAGE_COOKIE_MAX_AGE,
  normalizeLanguage,
};
