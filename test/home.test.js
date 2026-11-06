/**
 * Home page render test — no database, no network.
 *   node test/home.test.js
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
  console.log(`${ok ? "✔" : "✖"} ${name}${ok || !detail ? "" : `\n    ${detail}`}`);
}

const featuredProject = {
  slug: "qnotes",
  title: "QNotes Platform",
  title_bn: "QNotes প্ল্যাটফর্ম",
  tagline: "Study smarter",
  tagline_bn: "আরও স্মার্টভাবে পড়ুন",
  technologies: [{ name: "React" }, { name: "Node.js" }],
  thumbnail: "/img/qnotes.png",
  liveUrl: "https://example.com",
  githubUrl: "",
  featured: true,
};

const github = {
  profile: {
    avatar: "/img/avatar.png",
    name: "MD Rasel Hasan",
    username: "Russell1269",
    bio: "Developer",
    location: "Bangladesh",
    company: null,
    githubUrl: "https://github.com/Russell1269",
    joined: "2021-03-15T00:00:00.000Z",
  },
  stats: { followers: 1234, following: 7, publicRepos: 42, totalStars: 98765 },
  languages: [{ name: "JavaScript", percentage: 64, color: "#f7df1e" }],
  repositories: [
    {
      name: "portfolio",
      description: "",
      language: "JavaScript",
      stars: 12500,
      forks: 340,
      updatedAt: "2026-10-21T00:00:00.000Z",
      githubUrl: "https://github.com/x/y",
      homepage: "",
    },
  ],
  contributions: [
    { type: "PushEvent", repo: "x/y", date: "2026-11-01T00:00:00.000Z" },
  ],
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

  app.get("/", loadNamespaces("home"), (req, res) =>
    res.render("main/home", { projects: [featuredProject], github }),
  );
  app.get("/about", (req, res) => res.send("about"));
  app.get("/projects", (req, res) => res.send("projects"));
  app.get("/contact", (req, res) => res.send("contact"));
  app.get("/research/publications", (req, res) => res.send("pubs"));

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
    const en = await get("/?lang=en");
    const bn = await get("/?lang=bn");

    check("home renders without errors", !en.includes("ERR:") && !bn.includes("ERR:"), en.slice(0, 300));
    check("English hero title", en.includes("Building <strong>AI-Powered</strong> Digital Experiences"));
    check("Bangla hero title", bn.includes("<strong>AI-চালিত</strong> ডিজিটাল অভিজ্ঞতা নির্মাণ"));
    check("English facts render", en.includes(">23+<") && en.includes(">Projects<"));
    check("Bangla numerals in facts", bn.includes("২৩+") && bn.includes(">প্রকল্প<"));
    check("featured project English title", en.includes("QNotes Platform"));
    check("featured project Bangla title", bn.includes("QNotes প্ল্যাটফর্ম"));
    check("featured project Bangla tagline", bn.includes("আরও স্মার্টভাবে পড়ুন"));
    check("localizedUrl keeps language", bn.includes('href="/projects?lang=bn"'), "link");
    check("relative project link keeps language", bn.includes('href="/projects/qnotes?lang=bn"'));
    check("GitHub joined date localized (en)", en.includes("March 2021"), "en joined");
    check("GitHub joined date localized (bn)", bn.includes("মার্চ ২০২১") || bn.includes("২০২১"), "bn joined");
    check("stats use Bangla numerals", bn.includes("৯৮,৭৬৫") || bn.includes("৯৮৭৬৫"), "numbers");
    check("repo count localized", bn.includes("১২,৫০০"), "stars");
    check("percent symbol survives Bangla numerals", bn.includes("৬৪%"), "percent");
    check("empty repo description falls back to translation", !en.includes("No description provided.") === false, "desc");
    check("marquee is translated", bn.includes("মেশিন লার্নিং"));
    check("engagement table translated", bn.includes("প্রকল্প নির্মাণ") && bn.includes("আরও গবেষণা পড়ুন") === false);
    check("comparison JS labels come from server", bn.includes("data-selected-template=\"নির্বাচিত: __NAMES__\""));
    check("no raw keys leak", !/home:[a-z]/i.test(en + bn));
    check("no hard-coded en-US date left", !en.includes("toLocaleDateString"));

    const en_date = en.match(/<time datetime="[^"]+">([^<]+)<\/time>/);
    check("repo updated date uses Intl (en)", Boolean(en_date) && en_date[1] === "Oct 21, 2026", en_date && en_date[1]);
    const bn_date = bn.match(/<time datetime="[^"]+">([^<]+)<\/time>/);
    check("repo updated date uses Intl (bn)", bn_date && bn_date[1] !== (en_date && en_date[1]), bn_date && bn_date[1]);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exitCode = failed.length ? 1 : 0;
})();
