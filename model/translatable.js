/**
 * ============================================================================
 *  Translatable content — the database side of i18next
 * ============================================================================
 *
 * WHY `<field>_en` + `<field>_bn` instead of an embedded object or a
 * side-collection?
 *
 *   1. The base field stays the canonical English value. Old documents keep
 *      working, and no migration is needed when a new language is added.
 *   2. Partial translations are first-class: `title_bn` may be empty while
 *      `title_en` is filled. `localized()` then falls back field-by-field,
 *      exactly like i18next falls back key-by-key.
 *   3. Flat fields are trivial to query, sort, index and project. A Mongo
 *      text index on `title_en` is a single line; `{"title.en": …}` dotted
 *      queries are slower to reason about and awkward in the admin forms.
 *   4. The admin panel binds each input to one flat name — no dynamic form
 *      paths for EJS, no `$set` path building, no clobbering sibling
 *      translations when a single field is saved.
 *   5. Adding a third language is additive: `<field>_es` appears, nothing
 *      is rewritten, and the fallback chain simply grows.
 *
 * Fields are declared in ONE place (`translatable` option) so models, admin
 * labels and the API can all enumerate them.
 */
const mongoose = require("mongoose");

const FALLBACK_LNG = "en";

/** Slugify ASCII text; non-Latin scripts fall back to a stable id. */
function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * @param {mongoose.Schema} schema
 * @param {object}   options
 * @param {string[]} options.fields      base field names that get translations
 * @param {boolean} [options.translateDocs=false]  translate the whole document
 *                                                  instead of individual fields
 */
function translatable(schema, { fields = [], translateDocs = false } = {}) {
  // Record the declaration so templates, admin forms and `localizeDoc` can
  // enumerate translatable fields without re-stating them.
  schema.options.translatedFields = fields;
  schema.statics.translatedFields = fields;
  schema.translatableFields = fields;
  /* ---- 1. add `<field>_<lng>` for every supported language except the base --- */
  for (const field of fields) {
    for (const lang of schema.options.translatableLangs || ["bn"]) {
      if (lang === FALLBACK_LNG) continue;
      const path = `${field}_${lang}`;

      if (schema.path(path)) continue; // already added by an earlier call

      const base = schema.path(field);
      schema.add({
        [path]: {
          type: String,
          trim: true,
          default: "", // an empty string = "not translated yet" → English fallback
          maxlength: base && base.options && base.options.maxlength
            ? [base.options.maxlength[0], base.options.maxlength[1]]
            : undefined,
        },
      });
    }
  }

  /* ---- 2. whole-document translations (long-form blog content) -------------- */
  if (translateDocs) {
    schema.add({
      translations: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
        // { bn: { title, summary, content } }
      },
    });
  }

  /* ---- 3. helpers available on every document ------------------------------- */
  // Mongoose 9's `get()` returns undefined for an uninitialised optional path
  // even when the constructor received a value, so read the raw document.
  const read = (doc, path) =>
    doc && doc._doc && path in doc._doc ? doc._doc[path] : typeof doc.get === "function" ? doc.get(path) : doc[path];

  schema.methods.localized = function (field, lng) {
    const value = read(this, `${field}_${lng}`);
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    return this[field];
  };

  /** True when every requested field has a value in `lng`. */
  schema.methods.isTranslatedIn = function (lng, list = this.schema.translatableFields || fields) {
    return list.every((field) => {
      const value = read(this, `${field}_${lng}`);
      return value !== undefined && value !== null && String(value).trim() !== "";
    });
  };

  /** Percentage of translated fields — used by the admin panel. */
  schema.methods.translationProgress = function (lng, list) {
    const declared = this.schema && this.schema.translatableFields;
    const fieldsToCheck = list && list.length ? list : declared && declared.length ? declared : fields;
    if (!fieldsToCheck || !fieldsToCheck.length) return 100;

    const hasValue = (field) => {
      const value = read(this, `${field}_${lng}`);
      return value !== undefined && value !== null && String(value).trim() !== "";
    };
    const done = fieldsToCheck.filter(hasValue).length;
    return Math.round((done / fieldsToCheck.length) * 100);
  };

  /* ---- 4. indexes: querying never needs a translation to exist ------------- */
  schema.index({ [`${fields[0] || "title"}_${FALLBACK_LNG}`]: 1 });

  /* ---- 5. slug is language-neutral (one URL for all languages) -------------- */
  if (schema.path("slug") && !schema.path("slug").options.immutable) {
    schema.pre("validate", function () {
      if (!this.isModified("title") && this.slug) return;
      if (this.slug) return;
      const generated = slugify(this.title);
      this.slug = generated || `item-${this._id}`;
    });
  }

  return schema;
}

module.exports = { translatable, slugify, FALLBACK_LNG };
