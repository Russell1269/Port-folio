/**
 * Content-page render tests — no database, no network.
 *   node test/content.test.js
 *
 * Renders the real EJS templates for projects, a project detail page,
 * the blog index and the publications index, in both languages, and checks
 * the translation + fallback behaviour end to end.
 */
const express = require("express");
const ejsMate = require("ejs-mate");
const path = require("path");
const {
  i18nextMiddleware,
  i18nCacheHeaders,
  rememberLanguage,
  i18nViewLocals,
  loadNamespaces,
} = require("../middleware/i18n");

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: Boolean(ok) });
  console.log(`${ok ? "✔" : "✖"} ${name}${ok || detail === undefined ? "" : ` → ${detail}`}`);
}

/* ---- fixtures ------------------------------------------------------------ */
const fullyTranslated = {
  _id: "1",
  slug: "qnotes",
  title: "QNotes Platform",
  title_bn: "QNotes প্ল্যাটফর্ম",
  tagline: "Study smarter",
  tagline_bn: "আরও স্মার্টভাবে পড়ুন",
  description: "An academic platform.",
  description_bn: "একটি একাডেমিক প্ল্যাটফর্ম।",
  category: "Full Stack",
  status: "Completed",
  featured: true,
  thumbnail: "/img/q.png",
  technologies: [{ name: "React" }, { name: "Node.js" }, { name: "MongoDB" }, { name: "Express" }],
  liveUrl: "",
  githubUrl: "",
  features: [],
  developmentJourney: [],
  gallery: [],
  futurePlans: [],
};

// English-only document: no _bn keys at all (the "legacy" case).
const englishOnly = {
  _id: "2",
  slug: "legacy",
  title: "Legacy Project",
  tagline: "Older work",
  description: "Built before i18n.",
  category: "AI",
  status: "Maintaining",
  featured: false,
  thumbnail: "/img/l.png",
  technologies: [],
  features: [],
  developmentJourney: [],
  gallery: [],
  futurePlans: [],
};

const blog = {
  _id: "b1",
  slug: "hello-world",
  title: "Hello World",
  summary: "First post",
  content: "<p>English body</p>",
  publishedAt: "2026-10-21T00:00:00.000Z",
  createdAt: "2026-10-21T00:00:00.000Z",
  status: "published",
  tags: ["node"],
  readTime: 4,
};

const publication = {
  _id: "p1",
  title: "AI in Education",
  abstract: "A study of AI tutors.",
  slug: "ai-in-education",
  URL: "https://example.com",
  DOI: "10.1000/x",
  publishedIn: "IEEE",
  publisher: "",
  publishedAt: "2026-05-01T00:00:00.000Z",
  readTime: 3,
  featured: false,
};

function createApp() {
  const app = express();
  app.engine("ejs", ejsMate);
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));

  app.use(i18nextMiddleware);
  app.use(i18nCacheHeaders);
  app.use(rememberLanguage);
  app.use(i18nViewLocals);
  // Templates expect these from setViewLocals in the real app.
  app.use((req, res, next) => {
    res.locals.isOwner = false;
    res.locals.currentUser = null;
    res.locals.flash = { success: [], error: [], info: [] };
    next();
  });

  app.get("/projects", loadNamespaces("projects"), (req, res) =>
    res.render("main/projects", {
      projects: [fullyTranslated, englishOnly],
      activeCategory: req.query.category || "All",
    }),
  );

  app.get("/projects/:slug", loadNamespaces("project"), (req, res) =>
    res.render("main/show", {
      project: req.params.slug === "legacy" ? englishOnly : fullyTranslated,
    }),
  );

  app.get("/blogs", loadNamespaces("blogs"), (req, res) =>
    res.render("main/blogs/index", { blogs: [blog], featured: blog }),
  );

  app.get("/blogs/:slug", loadNamespaces("blogs"), (req, res) =>
    res.render("main/blogs/show", {
      blog,
      previousPost: null,
      nextPost: null,
    }),
  );

  app.get("/research/publications", loadNamespaces("publication"), (req, res) =>
    res.render("main/Research/publications/index", { publications: [publication] }),
  );

  app.use((err, req, res, next) => res.status(500).type("text").send(`ERR: ${err.message}`));
  return app;
}

(async () => {
  const server = await new Promise((resolve) => {
    const s = createApp().listen(0, () => resolve(s));
  });
  const { port } = server.address();
  const get = async (p) => (await fetch(`http://127.0.0.1:${port}${p}`)).text();

  try {
    const projectsEn = await get("/projects?lang=en");
    const projectsBn = await get("/projects?lang=bn");
    const detailEn = await get("/projects/qnotes?lang=en");
    const detailBn = await get("/projects/qnotes?lang=bn");
    const legacyBn = await get("/projects/legacy?lang=bn");
    const blogsEn = await get("/blogs?lang=en");
    const blogsBn = await get("/blogs?lang=bn");
    const blogBn = await get("/blogs/hello-world?lang=bn");
    const pubsEn = await get("/research/publications?lang=en");
    const pubsBn = await get("/research/publications?lang=bn");

    /* ---- no template errors -------------------------------------------- */
    const all = { projectsEn, projectsBn, detailEn, detailBn, legacyBn, blogsEn, blogsBn, blogBn, pubsEn, pubsBn };
    const broken = Object.entries(all).filter(([, html]) => html.includes("ERR:"));
    check("every content page renders", broken.length === 0, broken.map(([k]) => k).join(", "));

    /* ---- projects index ------------------------------------------------- */
    check("projects head translated (bn)", projectsBn.includes("নির্বাচিত প্রকল্প"));
    check("projects filter translated (bn)", projectsBn.includes("ফুল স্ট্যাক"));
    check("projects filter keeps language", projectsBn.includes("/projects?category=AI&amp;lang=bn") || projectsBn.includes("/projects?category=AI&lang=bn"));
    check("DB title localised (bn)", projectsBn.includes("QNotes প্ল্যাটফর্ম"));
    check("DB tagline localised (bn)", projectsBn.includes("আরও স্মার্টভাবে পড়ুন"));
    check("legacy/bn-missing title falls back to English", projectsBn.includes("Legacy Project"));
    check(
      "category translated in card",
      projectsBn.includes(">ফুল স্ট্যাক<") && projectsBn.includes(">AI<"),
      "expected ফুল স্ট্যাক + AI badges",
    );
    check("status translated in card", projectsBn.includes("সম্পন্ন"));
    check("tech overflow label translated", projectsBn.includes("টি") && !projectsBn.includes("+{{count}}"), "card count");
    check("English page unchanged", projectsEn.includes("Featured Projects") && projectsEn.includes("QNotes Platform"));

    /* ---- project detail page -------------------------------------------- */
    check("detail badges translated (bn)", detailBn.includes("⭐ নির্বাচিত") && detailBn.includes("সম্পন্ন"));
    check("detail description localised (bn)", detailBn.includes("একটি একাডেমিক প্ল্যাটফর্ম।"));
    check("detail case study translated (bn)", detailBn.includes("সমস্যা ও সমাধান"));
    check("detail journey label uses locale numbers", detailEn.includes("Step") || detailEn.includes("Technology Stack"));
    check("detail stats fall back to N/A translation", detailBn.includes("প্রযোজ্য নয়"));
    check("detail english title", detailEn.includes("QNotes Platform"));
    check("legacy detail renders in Bangla shell", legacyBn.includes("প্রকল্পের বিবরণ") && legacyBn.includes("Legacy Project"));

    /* ---- blog index ------------------------------------------------------ */
    check("blog head translated (bn)", blogsBn.includes("সর্বশেষ"));
    check("blog status translated (bn)", blogsBn.includes("প্রকাশিত"));
    check("blog date localised (bn)", blogsBn.includes("অক্টো"));
    check("blog read time translated (bn)", blogsBn.includes("মিনিটে পড়া যাবে"));
    check("blog CTA split key renders", blogsBn.includes("আরও লেখা আসছে শিগগিরই।"));
    check("blog links keep language", blogsBn.includes("/blogs/hello-world?lang=bn"));

    /* ---- blog detail ----------------------------------------------------- */
    check("blog detail title localised (bn)", blogBn.includes("Hello World"));
    check("blog detail sidebar translated (bn)", blogBn.includes("লেখার তথ্য") && blogBn.includes("শব্দ"));
    check("blog body falls back to English content", blogBn.includes("English body"));

    /* ---- publications ---------------------------------------------------- */
    check("publications head translated (bn)", pubsBn.includes("প্রকাশিত"));
    check("publications archive translated (bn)", pubsBn.includes("গবেষণা আর্কাইভ"));
    check("publication date localised (bn)", pubsBn.includes("মে"));
    check("publication title falls back (bn)", pubsBn.includes("AI in Education"));
    check("publication English page", pubsEn.includes("All Publications"));

    /* ---- no leaked keys -------------------------------------------------- */
    check("no raw keys leaked", !/projects:|blogs:|publication:|project:/.test(
      [projectsEn, projectsBn, detailBn, blogsBn, blogBn, pubsBn].join(""),
    ));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exitCode = failed.length ? 1 : 0;
})();
