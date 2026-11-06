const express = require("express");
const {
  i18nextMiddleware,
  i18nCacheHeaders,
  rememberLanguage,
  i18nViewLocals,
  loadNamespaces,
} = require("../middleware/i18n");
const { checkI18n } = require("../scripts/check-i18n-lib");

const ejsMate = require("ejs-mate");

// A minimal app that renders only the nav/footer, so the i18n pipeline can be
// exercised without MongoDB or the GitHub API. The middleware order deliberately
// mirrors app.js — that is what the tests are verifying.
function createTestApp() {
  const app = express();
  app.engine("ejs", ejsMate);
  app.set("view engine", "ejs");
  app.set("views", require("path").join(__dirname, "..", "views"));

  app.use(i18nextMiddleware);
  app.use(i18nCacheHeaders);
  app.use(rememberLanguage);
  app.use(i18nViewLocals);

  app.get("/", loadNamespaces("home"), (req, res) => res.render("test/i18n"));
  app.get("/blogs/post-one", (req, res) => res.render("test/i18n"));
  // Error handler so assertion failures surface as readable output.
  app.use((err, req, res, next) => res.status(500).type("text").send(`ERR: ${err.message}`));

  return app;
}

function start() {
  return new Promise((resolve) => {
    const server = createTestApp().listen(0, () => resolve(server));
  });
}

async function get(server, path, headers = {}) {
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}${path}`, { headers });
  return { status: response.status, body: await response.text(), headers: response.headers };
}

module.exports = { start, get, checkI18n };
