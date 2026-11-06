const Router = require("router");
const router = Router();
const {asyncHandler} = require("../utility/miiddleware");
const { loadNamespaces } = require("../middleware/i18n");
const { homeRoute } = require("../controller/home");

router.route("/").get(loadNamespaces("home"), asyncHandler(homeRoute));

module.exports = router;