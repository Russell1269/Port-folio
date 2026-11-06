const Router = require("router");
const router = Router();

const { loadNamespaces } = require("../middleware/i18n");

// `/about` was previously an inline route in app.js. It now owns a router so
// the page namespace is loaded exactly like every other page.
router.route("/").get(loadNamespaces("about"), (req, res) => {
  res.render("main/about");
});

module.exports = router;
