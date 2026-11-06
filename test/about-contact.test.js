/**
 * About + Contact render tests — no database, no network, no email.
 *   node test/about-contact.test.js
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

function createApp() {
  const app = express();
  app.engine("ejs", ejsMate);
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(i18nextMiddleware);
  app.use(i18nCacheHeaders);
  app.use(rememberLanguage);
  app.use(i18nViewLocals);
  app.use((req, res, next) => {
    res.locals.isOwner = false;
    res.locals.currentUser = null;
    res.locals.flash = { success: [], error: [], info: [] };
    next();
  });

  app.get("/about", loadNamespaces("about"), (req, res) => res.render("main/about"));
  app.get("/contact", loadNamespaces("contact"), (req, res) => res.render("main/contact"));

  // Mirrors controller/contact.js logic without calling Resend.
  app.post("/contact", loadNamespaces("contact"), (req, res) => {
    const { name, email, subject, message } = req.body || {};
    const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
    const wantsJson = Boolean(req.is("application/json"));

    const fail = (status, key) => {
      const text = req.t(key);
      if (wantsJson) return res.status(status).json({ ok: false, message: text });
      return res.redirect("/contact");
    };

    if (!name || !subject || !message || !isEmail(email)) return fail(400, "contact:error.invalid");
    if (String(message).trim().length < 10) return fail(400, "contact:error.tooShort");

    const success = req.t("contact:error.success");
    if (wantsJson) return res.json({ ok: true, message: success });
    return res.redirect("/contact");
  });

  app.use((err, req, res, next) => res.status(500).type("text").send(`ERR: ${err.message}`));
  return app;
}

(async () => {
  const server = await new Promise((resolve) => {
    const s = createApp().listen(0, () => resolve(s));
  });
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  const get = async (p, init) => {
    const res = await fetch(`${base}${p}`, init);
    const body = await res.text();
    let json = null;
    try {
      json = JSON.parse(body);
    } catch (err) {
      json = null;
    }
    return { status: res.status, body, json };
  };

  try {
    const aboutEn = await get("/about?lang=en");
    const aboutBn = await get("/about?lang=bn");
    const contactEn = await get("/contact?lang=en");
    const contactBn = await get("/contact?lang=bn");

    /* ---- about -------------------------------------------------------- */
    check("about renders", !aboutEn.body.includes("ERR:") && !aboutBn.body.includes("ERR:"));
    check("about heading EN", aboutEn.body.includes("Passion Meets") && aboutEn.body.includes(">Innovation<"));
    check("about heading BN", aboutBn.body.includes("ভালোবাসা যেখানে") && aboutBn.body.includes(">উদ্ভাবনে<"));
    check("about journey translated", aboutBn.body.includes("কৌতূহল থেকে") && aboutBn.body.includes("আমার যাত্রা"));
    check("about timeline years localised to Bangla numerals",
      aboutBn.body.includes(">২০২২<") && aboutBn.body.includes(">২০২৬<"), "years");
    check("about timeline years English", aboutEn.body.includes(">2022<") && aboutEn.body.includes(">2026<"));
    check("about future entry translated", aboutBn.body.includes(">ভবিষ্যৎ<") && aboutBn.body.includes("এরপর কী?"));
    check("about education translated", aboutBn.body.includes("শিক্ষা ও সনদ"));
    check("about institution names kept readable", aboutBn.body.includes("উত্তরা ইউনিভার্সিটি"));
    check("about certification id preserved", aboutBn.body.includes("MON-9831"));
    check("about links keep language", aboutBn.body.includes('href="/contact?lang=bn"'));

    /* ---- contact page ------------------------------------------------- */
    check("contact renders", !contactEn.body.includes("ERR:") && !contactBn.body.includes("ERR:"));
    check("contact heading translated", contactBn.body.includes("একসাথে চমৎকার কিছু তৈরি করি"));
    check("contact labels translated", contactBn.body.includes(">পুরো নাম<") && contactBn.body.includes(">ইমেইল ঠিকানা<"));
    check("contact placeholders translated", contactBn.body.includes('placeholder="আপনার নাম"'));
    check("contact location translated", contactBn.body.includes("গাজীপুর, ঢাকা, বাংলাদেশ"));
    check(
      "contact phone uses Intl numerals",
      contactBn.body.includes("০১৩১৭২৭৩৫৫২"),
      "phone",
    );
    check("contact form action keeps language", contactBn.body.includes('action="/contact?lang=bn"'));
    check("JS labels come from the server",
      contactBn.body.includes('data-sending="পাঠানো হচ্ছে..."') &&
        contactBn.body.includes('data-failed="পাঠানো যায়নি"'));
    check("no English button states left in script",
      !contactEn.body.includes("Message too short!") || contactEn.body.includes("data-short-message=\"Message too short!\""));

    /* ---- contact POST, both response shapes --------------------------- */
    const jsonHeaders = { "content-type": "application/json" };

    const invalidBn = await get("/contact?lang=bn", {
      method: "POST",
      headers: { ...jsonHeaders, "accept-language": "bn" },
      body: JSON.stringify({ name: "", email: "x", subject: "", message: "" }),
    });
    check("POST invalid → 400", invalidBn.status === 400, String(invalidBn.status));
    check("POST invalid message translated (bn)",
      invalidBn.json && invalidBn.json.message.includes("সব ঘর পূরণ করুন"), invalidBn.json && invalidBn.json.message);

    const shortEn = await get("/contact?lang=en", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ name: "A", email: "a@b.co", subject: "Hi", message: "short" }),
    });
    check("POST too short → 400 with EN copy",
      shortEn.status === 400 && shortEn.json.message.includes("at least 10 characters"),
      shortEn.json && shortEn.json.message);

    const okBn = await get("/contact?lang=bn", {
      method: "POST",
      headers: { ...jsonHeaders, "accept-language": "bn" },
      body: JSON.stringify({ name: "Rasel", email: "a@b.co", subject: "Hello", message: "A long enough message." }),
    });
    check("POST success → 200", okBn.status === 200, String(okBn.status));
    check("POST success message translated (bn)", okBn.json && okBn.json.message.includes("বার্তা পাঠানো হয়েছে"));

    const formPost = await get("/contact?lang=bn", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "name=&email=x&subject=&message=",
      redirect: "manual",
    });
    check("form POST redirects instead of JSON", formPost.status === 302, String(formPost.status));

    /* ---- nothing leaked ------------------------------------------------ */
    check("no raw keys leaked", !/about:|contact:/.test(aboutBn.body + contactBn.body + aboutEn.body + contactEn.body));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exitCode = failed.length ? 1 : 0;
})();
