/**
 * Locale-aware formatting helpers shared by controllers and views.
 *
 * Rule: formatted dates/numbers are produced here with Intl.*, never with
 * `toLocaleDateString("en-US", …)` scattered through templates.
 */
const { LANGUAGES, FALLBACK_LNG } = require("../config/i18n");

const INTL_LOCALE = Object.freeze({
  en: "en-US",
  bn: "bn-BD",
});

const BCP47 = Object.freeze({
  en: "en",
  bn: "bn",
});

function resolveLocale(lng) {
  return INTL_LOCALE[lng] || INTL_LOCALE[FALLBACK_LNG];
}

function resolveBcp47(lng) {
  return BCP47[lng] || FALLBACK_LNG;
}

/**
 * Localised date string. Returns "" for empty input so templates can fall back.
 * @param {Date|string|number} value
 * @param {string} lng  request language code
 * @param {Intl.DateTimeFormatOptions} [options]
 */
function formatDate(value, lng, options) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(resolveLocale(lng), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

/** Localised number: 1,234.5 (en) → ১,২৩৪.৫ (bn). */
function formatNumber(value, lng, options) {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat(resolveLocale(lng), options).format(n);
}

/** Localised currency, e.g. USD in English vs bangla numerals in Bangla. */
function formatCurrency(value, lng, currency = "USD") {
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  return new Intl.NumberFormat(resolveLocale(lng), {
    style: "currency",
    currency,
  }).format(n);
}

/**
 * Localises the digits of an identifier-like string (phone, postal code, ID).
 * Unlike formatNumber this keeps leading zeros and never inserts separators.
 */
function formatDigits(value, lng) {
  if (value === null || value === undefined) return "";
  const out = String(value);
  if (lng === FALLBACK_LNG) return out;
  const local = new Intl.NumberFormat(resolveLocale(lng)).format(1234567890);
  if (!/[০-৯]/.test(local)) return out; // locale does not use the Bengali set
  return out.replace(/[0-9]/g, (d) => String.fromCharCode(0x09e6 + Number(d)));
}

/** Localised relative time: "3 months ago" / "৩ মাস আগে". */
function formatRelative(value, lng) {
  if (!value) return "";
  const target = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(target.getTime())) return "";

  const diffSeconds = Math.round((target.getTime() - Date.now()) / 1000);
  const units = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  const formatter = new Intl.RelativeTimeFormat(resolveLocale(lng), {
    numeric: "auto",
  });

  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds || unit === "second") {
      return formatter.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return "";
}

/**
 * Reads a translated database field.
 *
 * A document stores `title_en` / `title_bn`. For `lng = "bn"` the helper
 * returns `title_bn` when it has content, otherwise falls back to `title_en` —
 * the same "Bangla missing → show English" rule as the JSON namespaces.
 *
 * @param {object} doc        a Mongoose document or plain object
 * @param {string} field      base field name, e.g. "title"
 * @param {string} lng        request language code
 * @param {*}      [fallback] returned when no language has a value
 */
function localizedField(doc, field, lng, fallback = "") {
  if (!doc) return fallback;

  // Supports "title" and nested "seo.title".
  const dot = field.lastIndexOf(".");
  const parent = dot === -1 ? "" : field.slice(0, dot);
  const leaf = dot === -1 ? field : field.slice(dot + 1);
  const prefix = parent ? `${parent}.` : "";

  const get = (name) => {
    // Mongoose 9's get() can return undefined for an optional path that has no
    // default; the raw document is the reliable source for translation columns.
    if (doc._doc && name in doc._doc) return doc._doc[name];
    if (typeof doc.get === "function") return doc.get(name);
    return name.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), doc);
  };

  const candidates = [`${prefix}${leaf}_${lng}`, `${prefix}${leaf}_${FALLBACK_LNG}`, field];
  for (const name of candidates) {
    const value = get(name);
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return fallback;
}

/**
 * Localises a whole document for a template or API response.
 *
 *   localizeDoc(project, 'bn').title  // Bangla, or English when untranslated
 *
 * The `_en` / `_bn` keys are kept so the admin panel can still read them.
 */
function localizeDoc(doc, lng, fields) {
  if (!doc) return null;
  const plain = typeof doc.toObject === "function" ? doc.toObject({ virtuals: true }) : { ...doc };

  // Field names come from the schema when available (a stored document may not
  // contain a `_en` key at all), falling back to whatever translations exist.
  const list =
    fields ||
    (doc.schema && Array.isArray(doc.schema.options.translatedFields)
      ? doc.schema.options.translatedFields
      : Object.keys(plain)
          .filter((key) => key.endsWith(`_${FALLBACK_LNG}`))
          .map((key) => key.slice(0, -(FALLBACK_LNG.length + 1))));

  for (const field of list) plain[field] = localizedField(doc, field, lng);
  return plain;
}

/** Localises a list of documents. */
function localizeMany(docs, lng, fields) {
  return (docs || []).map((doc) => localizeDoc(doc, lng, fields));
}

module.exports = {
  formatDate,
  formatNumber,
  formatDigits,
  formatCurrency,
  formatRelative,
  localizedField,
  localizeDoc,
  localizeMany,
  resolveLocale,
  resolveBcp47,
  LANGUAGES,
};
