const Project = require("../model/project");
const Blog = require("../model/blog");
const Publication = require("../model/publication");
const { localizedField, localizeDoc } = require("../utility/i18n");

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: Boolean(ok) });
  console.log(`${ok ? "✔" : "✖"} ${name}${ok || detail === undefined ? "" : ` → ${JSON.stringify(detail)}`}`);
}

/* ---- schema paths exist -------------------------------------------------- */
check("Project has title_bn/tagline_bn/description_bn",
  ["title_bn", "tagline_bn", "description_bn"].every((p) => Project.schema.path(p)));
check("Project has NO title_en column (base field is English)",
  !Project.schema.path("title_en"));
check("Blog has title_bn/summary_bn + translations subdocument",
  ["title_bn", "summary_bn"].every((p) => Blog.schema.path(p)) && Boolean(Blog.schema.path("translations")));
check("Publication has title_bn/abstract_bn",
  ["title_bn", "abstract_bn"].every((p) => Publication.schema.path(p)));
check("Publication did NOT translate identifiers (DOI/URL/publishedIn)",
  !Publication.schema.path("DOI_bn") && !Publication.schema.path("URL_bn") && !Publication.schema.path("publishedIn_bn"));
check("slug is NOT duplicated per language", !Project.schema.path("slug_bn"));

/* ---- fallback matrix ------------------------------------------------------ */
const full = new Project({ title: "QNotes", title_bn: "কিউনোটস", tagline: "Study", tagline_bn: "পড়ুন" });
check("bn present → Bangla", localizedField(full, "title", "bn") === "কিউনোটস", localizedField(full, "title", "bn"));
check("bn missing on one field → English fallback",
  localizedField(new Project({ title: "X", tagline: "Study" }), "tagline", "bn") === "Study");

const partial = new Project({ title: "QNotes", tagline: "Study", title_bn: "" }); // bn left blank
check("empty bn string → English", localizedField({ title: "QNotes", title_bn: "" }, "title", "bn") === "QNotes");
check("untranslated field → English", localizedField(partial, "tagline", "bn") === "Study");

const legacy = { title: "Legacy project" }; // pre-i18n document, no _bn key at all
check("legacy document (no _bn field) → English", localizedField(legacy, "title", "bn") === "Legacy project");
check("english always resolves to itself", localizedField(full, "title", "en") === "QNotes");
check("unknown language → English fallback", localizedField(full, "title", "de") === "QNotes");

/* ---- helpers on the document --------------------------------------------- */
check("isTranslatedIn(bn) true when fields filled", full.isTranslatedIn("bn", ["title", "tagline"]));
check("isTranslatedIn(bn) false for partial", !partial.isTranslatedIn("bn", ["title"]));
const half = new Project({ title: "QNotes", title_bn: "কিউনোটস", tagline: "Study" });
check("translationProgress reports 50%", half.translationProgress("bn", ["title", "tagline"]) === 50, half.translationProgress("bn", ["title", "tagline"]));

/* ---- localizeDoc exposes base names -------------------------------------- */
check("localizeDoc exposes Bangla under base name", localizeDoc(full, "bn").title === "কিউনোটস", localizeDoc(full, "bn").title);
check("localizeDoc keeps original _bn keys for admin", localizeDoc(full, "bn").title_bn === "কিউনোটস");

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
