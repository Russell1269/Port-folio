const router = require("express").Router();
const {
  asyncHandler,
  ownerOnly,
  LOGIN_PATH,
  isLoggedIn,
} = require("../utility/miiddleware");
const { logInPage, postLogIn, postLogOut } = require("../controller/admin");

router.route(LOGIN_PATH).get(asyncHandler(logInPage));

router.route("/login").post(postLogIn);

router.route("/logout").post(ownerOnly, isLoggedIn, postLogOut);

module.exports = router;
