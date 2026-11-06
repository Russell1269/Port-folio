const express = require("express");
const router = express.Router();
const { upload } = require("../config/upload");
const {
  asyncHandler,
  projectValidation,
  isLoggedIn,
  ownerOnly,
} = require("../utility/miiddleware");
const { loadNamespaces } = require("../middleware/i18n");

// Namespaces are loaded per route, never globally: a visitor opening
// /projects never downloads the blog or publication copy.
const projectsNs = loadNamespaces("projects");
const projectNs = loadNamespaces("project");

// Cross-site write guard for every method reaching this router.
// router.use(ownerOnly);
const {
  index,
  createNew,
  postNew,
  viewPost,
  editPost,
  updatePost,
  deletePost,
} = require("../controller/project");

router.route("/").get(projectsNs, asyncHandler(index));
// .post(
// //  ownerOnly,
//  // isLoggedIn,
//   upload.fields([
//     { name: "thumbnail", maxCount: 1 },
//     { name: "coverImage", maxCount: 1 },
//     { name: "gallery", maxCount: 20 },
//   ]),
//   projectValidation,
//   asyncHandler(postNew),
// );

router.post(
  "/",
  ownerOnly,
  (req, res, next) => {
    upload.fields([
      { name: "thumbnail", maxCount: 1 },
      { name: "coverImage", maxCount: 1 },
      { name: "gallery", maxCount: 20 },
    ])(req, res, function (err) {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          req.flash("error", "Image size must be less than 10 MB.");
          return res.redirect("back");
        }
        return next(err);
      }
      next();
    });
  },
  projectValidation, 
  asyncHandler(postNew),
);

router.get("/new", ownerOnly, isLoggedIn, createNew);

router.route("/:slug").get(projectNs, asyncHandler(viewPost));

router.route("/:id/edit").get(ownerOnly, isLoggedIn, asyncHandler(editPost));

router
  .route("/:id")
  .put(
    ownerOnly,
    isLoggedIn,
    (req, res, next) => {
      upload.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
        { name: "gallery", maxCount: 20 },
      ])(req, res, function (err) {
        if (err) {
          if (err.code === "LIMIT_FILE_SIZE") {
            req.flash("error", "Image size must be less than 10 MB.");
            return res.redirect("back");
          }
          return next(err);
        }
        next();
      });
    },
    projectValidation,
    asyncHandler(updatePost),
  )
  .delete(ownerOnly, isLoggedIn, asyncHandler(deletePost));

module.exports = router;
