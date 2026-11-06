const { i18next, i18nReady } = require("../config/i18nextInstance");
const {
  LANGUAGES,
  FALLBACK_LNG,
  COOKIE_NAME,
  LANGUAGE_COOKIE_MAX_AGE,
  normalizeLanguage,
} = require("../config/i18n");
const {
  formatDate,
  formatDigits,
  formatNumber,
  formatCurrency,
  formatRelative,
  localizedField,
  resolveLocale,
  resolveBcp47,
} = require("../utility/i18n");

const { handle: handleI18next, LanguageDetector } = require("i18next-http-middleware");

const detection = new LanguageDetector(null, {
  order: ["langQuery", "langCookie", "header"],
});

/** Reads `lang` straight from the Cookie header (no cookie-parser needed). */
function parseLanguageCookie(header) {
  if (!header) return undefined;
  const pair = String(header)
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!pair) return undefined;
  try {
    return decodeURIComponent(pair.slice(COOKIE_NAME.length + 1));
  } catch (err) {
    return undefined;
  }
}

detection.addDetector({
  name: "langQuery",
  lookup: (req) => {
    const value = req.query && req.query.lang;
    const requested = normalizeLanguage(Array.isArray(value) ? value[0] : value);
    // Remember which source won so `rememberLanguage` can tell "explicit pick"
    // from "browser hint" and avoid overwriting a stored preference.
    if (requested) req.languageSource = "query";
    return requested || undefined;
  },
  cacheUserLanguage: () => {},
});

detection.addDetector({
  name: "langCookie",
  lookup: (req) => {
    const raw = req.cookies ? req.cookies[COOKIE_NAME] : parseLanguageCookie(req.headers.cookie);
    return normalizeLanguage(raw) || undefined;
  },
  cacheUserLanguage: () => {},
});

// Registering the detector with the shared i18next instance lets the library
// wire its language utils into the detector (needed for best-match matching)
// and lets the middleware find it on every request.
i18next.use(detection);
i18next.services.languageDetector = detection;

detection.services = i18next.services;
detection.allOptions = i18next.options;

const i18nextMiddleware = handleI18next(i18next, {
  detection,
  removeLngFromUrl: false,
  ignoreRoutes: ["^/css", "^/js", "^/images", "^/animation", "^/favicon.ico"],
});

/* ------------------------------------------------------------------------- */

function appendVary(existing, value) {
  if (!existing) return value;
  const lower = String(existing).toLowerCase();
  const missing = value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v && !lower.includes(v.toLowerCase()));
  return missing.length ? `${existing}, ${missing.join(", ")}` : existing;
}

function readHeader(res, name) {
  if (typeof res.get === "function") return res.get(name);
  if (typeof res.getHeader === "function") return res.getHeader(name);
  if (typeof res.header === "function") return res.header(name);
  // i18next-http-middleware hands us a thin response wrapper ({ setHeader }).
  const raw = res.headersSent === undefined && res.raw ? res.raw : res;
  return raw && typeof raw.getHeader === "function" ? raw.getHeader(name) : undefined;
}

function writeHeader(res, name, value) {
  if (typeof res.set === "function") res.set(name, value);
  else if (typeof res.setHeader === "function") res.setHeader(name, value);
  else if (typeof res.header === "function") res.header(name, value);
}

/**
 * A response that varies by language must tell caches it does.
 * Uses plain header APIs: `res.append()` / `res.cookie()` are Express-only and
 * the response object is not guaranteed to be an Express one.
 */
function i18nCacheHeaders(req, res, next) {
  writeHeader(res, "Vary", appendVary(readHeader(res, "Vary"), "Accept-Language, Cookie"));
  writeHeader(res, "Content-Language", req.language || FALLBACK_LNG);
  next();
}

/**
 * Persists an *explicit* language choice (?lang=) so a returning visitor keeps
 * it. Browser-detected languages are not persisted: the visitor never asked
 * for them, and the cookie would then override their future browser settings.
 */
function rememberLanguage(req, res, next) {
  const lng = normalizeLanguage(req.language) || FALLBACK_LNG;
  const previous = normalizeLanguage(
    req.cookies ? req.cookies[COOKIE_NAME] : parseLanguageCookie(req.headers.cookie),
  );

  if (req.languageSource === "query" && previous !== lng) {
    // Express's res.cookie() needs cookie-parser only for *reading*; writing the
    // header directly keeps this module dependency-free and Express-5 safe.
    const attributes = [
      `${COOKIE_NAME}=${encodeURIComponent(lng)}`,
      "Path=/",
      `Max-Age=${Math.floor(LANGUAGE_COOKIE_MAX_AGE / 1000)}`,
      "SameSite=Lax",
    ];
    if (process.env.NODE_ENV === "production") attributes.push("Secure");
    const header = attributes.join("; ");
    const existing = readHeader(res, "Set-Cookie");
    writeHeader(res, "Set-Cookie", existing ? [existing, header] : header);
  }
  next();
}

/**
 * One entry per configured language, preserving path, query string and hash
 * (/blogs/my-post?page=2&lang=bn stays on /blogs/my-post?page=2&lang=bn).
 */
function buildLanguageLinks(req) {
  const pathname = (req.originalUrl || req.path || "/").split("?")[0].split("#")[0] || "/";

  return Object.values(LANGUAGES).map((language) => {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(req.query || {})) {
      if (key === "lang" || value === undefined || value === null) continue;
      (Array.isArray(value) ? value : [value]).forEach((v) => params.append(key, String(v)));
    }
    params.set("lang", language.code);

    return {
      ...language,
      url: `${pathname}?${params.toString()}`,
      isCurrent: language.code === req.language,
    };
  });
}

/* Adds the current ?lang= to an internal link so a visitor stays in the
   selected language when navigating. Returns the href untouched for external
   URLs, hashes and already-localised links. */
function localizedUrl(req, href) {
  const lng = normalizeLanguage(req.language) || FALLBACK_LNG;
  if (typeof href !== "string" || !href.startsWith("/") || href.startsWith("//")) {
    return href;
  }
  if (/[?&]lang=/.test(href)) return href;
  return `${href}${href.includes("?") ? "&" : "?"}lang=${lng}`;
}

/**
 * Exposes the helpers the templates use: t, lng, dir, formatting and the
 * pre-built language switcher links. Registered once in app.js.
 */
function i18nViewLocals(req, res, next) {
  const lng = normalizeLanguage(req.language) || FALLBACK_LNG;
  const activeLanguage = LANGUAGES[lng] || LANGUAGES[FALLBACK_LNG];

  res.locals.t = req.t.bind(req);
  res.locals.lng = lng;
  res.locals.dir = activeLanguage.dir;
  res.locals.locale = resolveLocale(lng);
  res.locals.htmlLang = resolveBcp47(lng);
  res.locals.languages = buildLanguageLinks(req);
  res.locals.formatDate = (value, options) => formatDate(value, lng, options);
  res.locals.formatNumber = (value, options) => formatNumber(value, lng, options);
  res.locals.formatDigits = (value) => formatDigits(value, lng);
  res.locals.formatCurrency = (value, currency) => formatCurrency(value, lng, currency);
  res.locals.formatRelative = (value) => formatRelative(value, lng);
  res.locals.localized = (doc, field, fallback) => localizedField(doc, field, lng, fallback);
  res.locals.localizedUrl = (href) => localizedUrl(req, href);

  next();
}

/**
 * Guarantees a page namespace is loaded before its handler runs, so the first
 * paint never shows raw keys. Usage:
 *
 *   router.route("/").get(loadNamespaces("home"), asyncHandler(homeRoute));
 */
function loadNamespaces(...namespaces) {
  const ns = namespaces.flat();
  return async (req, res, next) => {
    try {
      await i18nReady;
      await req.i18n.loadNamespaces(ns);
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  i18nextMiddleware,
  i18nCacheHeaders,
  rememberLanguage,
  i18nViewLocals,
  loadNamespaces,
  buildLanguageLinks,
  localizedUrl,
  COOKIE_NAME,
};
