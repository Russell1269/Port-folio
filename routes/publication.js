const Router = require("router");
const {
  asyncHandler,
  publicationValidation,
  ownerOnly,
  isLoggedIn,
} = require("../utility/miiddleware");
const { loadNamespaces } = require("../middleware/i18n");
const router = Router();
// Cross-site write guard for every method reaching this router.
// router.use(ownerOnly);

const {
  index,
  newPublications,
  postPublications,
  deletePublications,
} = require("../controller/publication");

router
  .route("/")
  .get(loadNamespaces("publication"), asyncHandler(index))
  .post(
    ownerOnly,
    publicationValidation,
    asyncHandler(postPublications),
  );

router
  .route("/:id")
  .delete(ownerOnly, isLoggedIn, asyncHandler(deletePublications));

router.route("/new").get(ownerOnly, isLoggedIn, newPublications);

module.exports = router;
