const Router = require("router");
const { asyncHandler } = require("../utility/miiddleware");
const { loadNamespaces } = require("../middleware/i18n");
const { index, sendMessage } = require("../controller/contact");
const router = Router();

// The namespace must be loaded for both the page and the POST response, since
// validation errors are rendered with `contact:*` translations.
const contactNs = loadNamespaces("contact");

router.route("/").get(contactNs, index).post(contactNs, asyncHandler(sendMessage));

module.exports = router;
