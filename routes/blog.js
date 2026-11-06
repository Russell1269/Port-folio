const Router = require("router");
const router = Router();
const { uploadFields } = require("../config/upload");

const {
  asyncHandler,
  blogValidation,
  ownerOnly,
} = require("../utility/miiddleware");
const { loadNamespaces } = require("../middleware/i18n");

const blogsNs = loadNamespaces("blogs");

// Every write reaching this router passes the cross-site guard first (and
// requires a session for anything mutating).
// router.use(ownerOnly);
const {
  index,
  addNewPage,
  view,
  edit,
  postEdit,
  deleteBlog,
  postNew,
} = require("../controller/blog");

router
  .route("/")
  .get(blogsNs, asyncHandler(index))
  .post(
    ownerOnly,
    uploadFields([
      { name: "coverImage", maxCount: 1 },
    ]),
    blogValidation,
    asyncHandler(postNew),
  );

router.route("/new").get(ownerOnly, addNewPage);

router.route("/:slug").get(blogsNs, asyncHandler(view));

router.route("/:id/edit").get(ownerOnly, asyncHandler(edit));

router
  .route("/:id")
  .put(
    ownerOnly,
    uploadFields([
      { name: "coverImage", maxCount: 1 },
    ]),
    blogValidation,
    asyncHandler(postEdit),
  )
  .delete(ownerOnly, asyncHandler(deleteBlog));

module.exports = router;
