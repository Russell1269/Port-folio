/**
 * i18n smoke tests — no database, no network.
 *
 *   npm test
 */
const { start, get } = require("./helpers");
const { checkI18n } = require("../scripts/check-i18n-lib");

const results = [];

function check(name, condition, detail) {
  results.push({ name, ok: Boolean(condition), detail });
  console.log(`${condition ? "✔" : "✖"} ${name}${condition || !detail ? "" : `\n    ${detail}`}`);
}

(async () => {
  const server = await start();

  try {
    /* 1 — translation integrity (keys/placeholders/namespaces) */
    check("translation files are consistent", checkI18n());

    /* 2 — default language is English */
    const en = await get(server, "/");
    check("default language is English", en.body.includes('lang="en"'), en.body.slice(0, 200));
    check("English nav renders", en.body.includes(">Home<") && en.body.includes(">Projects<"));

    /* 3 — ?lang=bn switches immediately */
    const bn = await get(server, "/?lang=bn");
    check("?lang=bn renders Bangla", bn.body.includes('lang="bn"') && bn.body.includes("হোম"));
    check("Bangla plural form is applied", bn.body.includes("মিনিটে পড়া যাবে"), "readTime");
    check("numbers are localised to Bangla numerals", bn.body.includes("১২,৩৪,৫৬৭"), "formatNumber");
    check("interpolation keeps the placeholder value", bn.body.includes("ফিরে আসায় স্বাগতম, Rasel।"));

    /* 4 — cookie is set to the chosen language */
    const setCookie = bn.headers.get("set-cookie") || "";
    check("language cookie is stored", /lang=bn;.*Max-Age/i.test(setCookie), setCookie);
    check("Content-Language header is correct", bn.headers.get("content-language") === "bn");
    check("Vary header protects caches", /Accept-Language/i.test(bn.headers.get("vary") || ""));

    /* 5 — cookie drives the language on the next visit */
    const viaCookie = await get(server, "/", { cookie: "lang=bn" });
    check("cookie restores the language", viaCookie.body.includes("হোম"));

    /* 6 — browser language is the third fallback */
    const viaBrowser = await get(server, "/", { "accept-language": "bn-BD,bn;q=0.9,en;q=0.5" });
    check("Accept-Language is respected", viaBrowser.body.includes("হোম"));

    /* 7 — query beats cookie */
    const queryWins = await get(server, "/?lang=en", { cookie: "lang=bn" });
    check("?lang= overrides the cookie", queryWins.body.includes(">Home<") && !queryWins.body.includes("হোম"));

    /* 8 — invalid language is ignored, never injected */
    const invalid = await get(server, "/?lang=%3Cscript%3Ealert(1)%3C/script%3E");
    check("invalid ?lang is rejected", !invalid.body.includes("<script>alert(1)"), "injection");
    check("invalid ?lang falls back to English", invalid.body.includes('lang="en"'));

    /* 9 — switcher preserves the current page */
    const deep = await get(server, "/blogs/post-one?lang=en");
    check(
      "switcher keeps the current path",
      deep.body.includes('href="/blogs/post-one?lang=bn"'),
      "expected /blogs/post-one?lang=bn",
    );

    /* 10 — unrelated query params are preserved */
    const paged = await get(server, "/blogs/post-one?page=2&lang=en");
    check(
      "switcher keeps other query params",
      paged.body.includes('href="/blogs/post-one?page=2&amp;lang=bn"') ||
        paged.body.includes('href="/blogs/post-one?page=2&lang=bn"'),
    );

    /* 11 — dates are locale formatted with Intl, not hard-coded */
    check("English date format", en.body.includes("Nov 04, 2026"), "formatDate(en)");
    check("Bangla date format", bn.body.includes("০৪"), "formatDate(bn)");

    /* 12 — no raw keys leak into HTML */
    check("no raw translation keys rendered", !/common:[a-z]/i.test(en.body + bn.body));

    /* 13 — footer namespace renders in both languages */
    check("footer renders in English", en.body.includes("Thanks For Visiting My Digital Space"));
    check("footer renders in Bangla", bn.body.includes("আমার ডিজিটাল জগতে"));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exitCode = failed.length ? 1 : 0;
})();
