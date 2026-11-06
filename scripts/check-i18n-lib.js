#!/usr/bin/env node
/**
 * i18n integrity check — run in CI and before every deploy.
 *
 *   node scripts/check-i18n.js   (or: const { checkI18n } = require('./scripts/check-i18n-lib'))
 *
 * Fails (exit 1) when:
 *   • a JSON file is invalid
 *   • a namespace exists in one language but not another
 *   • keys differ between the fallback language and another language
 *     (keys are NEVER allowed to drift — English is the source of truth)
 *   • placeholders ({{name}}) differ between languages for the same key
 *   • an EJS template references a namespace that is not registered
 *
 * Missing *values* are allowed (they fall back to English by design), but a
 * missing key is a bug, because silent fallback hides broken pages.
 *
 * export: `checkI18n()` returns true/false and is used by `npm test`.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const { LOCALES_DIR, LANGUAGES, FALLBACK_LNG, NAMESPACES } = require("../config/i18n");

const errors = [];
const warnings = [];

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    errors.push(`${path.relative(ROOT, file)}: invalid JSON — ${err.message}`);
    return {};
  }
}

/** Flattens nested JSON into { "nav.home": "Home" } and keeps leaf values. */
function flatten(obj, prefix = "", out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flatten(value, fullKey, out);
    } else {
      out[fullKey] = value;
    }
  }
  return out;
}

const PLACEHOLDER = /\{\{\s*([\w.]+)[^}]*\}\}/g;
const pluralBase = (key) => key.replace(/_(zero|one|two|few|many|other)$/, "");

function placeholders(value) {
  if (typeof value !== "string") return [];
  return [...value.matchAll(PLACEHOLDER)].map((m) => m[1]).sort();
}

const locales = {};

for (const lng of Object.keys(LANGUAGES)) {
  const dir = path.join(LOCALES_DIR, lng);
  if (!fs.existsSync(dir)) {
    errors.push(`locales/${lng}/ does not exist`);
    continue;
  }

  locales[lng] = {};
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const ns = file.replace(/\.json$/, "");
    locales[lng][ns] = flatten(readJson(path.join(dir, file)));
  }
}

/* ---- namespace parity ----------------------------------------------------- */
const fallbackNs = Object.keys(locales[FALLBACK_LNG] || {});

for (const ns of fallbackNs) {
  if (!NAMESPACES.includes(ns)) {
    warnings.push(`namespace "${ns}" exists on disk but is not listed in config/i18n.js NAMESPACES`);
  }

  for (const [lng, namespaces] of Object.entries(locales)) {
    if (lng === FALLBACK_LNG) continue;
    if (!namespaces[ns]) {
      errors.push(`${lng}: missing namespace file locales/${lng}/${ns}.json`);
      continue;
    }

    const base = locales[FALLBACK_LNG][ns];
    const target = namespaces[ns];

    for (const key of Object.keys(base)) {
      if (!(key in target) && !(pluralBase(key) in target)) {
        errors.push(`${lng}/${ns}: missing key "${key}"`);
      }
    }

    for (const key of Object.keys(target)) {
      if (!(key in base) && !(pluralBase(key) in base)) {
        errors.push(`${lng}/${ns}: orphan key "${key}" (not present in ${FALLBACK_LNG})`);
      }
    }

    for (const key of Object.keys(base)) {
      if (!(key in target)) continue;
      const a = placeholders(base[key]).join(",");
      const b = placeholders(target[key]).join(",");
      if (a !== b) {
        errors.push(`${lng}/${ns}: placeholder mismatch in "${key}" (en: ${a || "none"} / ${lng}: ${b || "none"})`);
      }
    }
  }
}

/* ---- registered namespaces must have files -------------------------------- */
for (const ns of NAMESPACES) {
  for (const lng of Object.keys(LANGUAGES)) {
    const file = path.join(LOCALES_DIR, lng, `${ns}.json`);
    if (!fs.existsSync(file)) {
      warnings.push(`registered namespace "${ns}" has no locales/${lng}/${ns}.json yet`);
    }
  }
}

/* ---- templates must use registered namespaces ----------------------------- */
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".ejs")) out.push(full);
  }
  return out;
}

const NS_CALL = /t\(\s*["'`]([a-zA-Z0-9_-]+):/g;
for (const file of walk(path.join(ROOT, "views"))) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(NS_CALL)) {
    if (!NAMESPACES.includes(match[1])) {
      errors.push(`${path.relative(ROOT, file)}: uses unregistered namespace "${match[1]}"`);
    }
  }
}

/* ---- report --------------------------------------------------------------- */
function report({ silent = false } = {}) {
  if (!silent) {
    for (const warning of warnings) console.warn(`⚠  ${warning}`);
  }

  if (errors.length) {
    console.error(`\n✖ ${errors.length} i18n problem(s):`);
    for (const error of errors) console.error(`   - ${error}`);
    return false;
  }

  if (!silent) {
    console.log(
      `✔ i18n OK — ${Object.keys(LANGUAGES).length} languages, ${fallbackNs.length} namespaces, ` +
        `${Object.values(locales[FALLBACK_LNG]).reduce((n, ns) => n + Object.keys(ns).length, 0)} keys`,
    );
  }
  return true;
}

if (require.main === module) {
  process.exit(report() ? 0 : 1);
}

module.exports = { checkI18n: () => report({ silent: true }), errors, warnings };
