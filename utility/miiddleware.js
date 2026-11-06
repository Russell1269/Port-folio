const { validate } = require("../model/project");
const {
  blogValidationSchema,
  projectValidationSchema,
  publicationValidationSchema,
} = require("../schema");
const ExpressError = require("./expressError");
const { cleanupUploadedFiles } = require("../config/upload");

function asyncHandler(fn) {
  return function (req, res, next) {
    fn(req, res, next).catch((err) => next(err));
  };
}

function handleValidationError(err, req, res, next) {
  if (err.name === "ValidationError") {
    console.log("Validatiion Error Occured");
    let status = 400;
    return res.status(status).render("main/error/errorHandler", {
      status: status,
      success: false,
      message: err.message || "Validation Faild",
      errors: err.errors,
    });
  }
  next(err);
}

const blogValidation = async (req, res, next) => {
  if (req.body.tags) {
    const tagValues = Array.isArray(req.body.tags)
      ? req.body.tags
      : [req.body.tags];
    req.body.tags = [
      ...new Set(
        tagValues
          .flatMap((tag) => String(tag).split(","))
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
  } else {
    req.body.tags = [];
  }

  if (Array.isArray(req.body.status)) {
    const validStatuses = req.body.status
      .map((status) => String(status).trim().toLowerCase())
      .filter((status) => ["draft", "published", "archived"].includes(status));
    req.body.status = validStatuses[validStatuses.length - 1] || "draft";
  } else if (typeof req.body.status === "string") {
    req.body.status = req.body.status.trim().toLowerCase();
  }

  if (req.files?.coverImage?.[0]) {
    req.body.coverImage = {
      url: req.files.coverImage[0].path,
      fileName: req.files.coverImage[0].filename,
    };
  }
  const { error, value } = blogValidationSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  req.body = value;
  if (error) {
    await cleanupUploadedFiles(req.files).catch(() => {});
    throw new ExpressError(400, error.message);
  } else {
    next();
  }
};

const projectValidation = async (req, res, next) => {
  if (req.body.keywords && typeof req.body.keywords === "string") {
    req.body.keywords = req.body.keywords
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }
  for (const key of ["features", "futurePlans"]) {
    if (typeof req.body[key] === "string") req.body[key] = [req.body[key]];
  }
  if (req.body.published !== undefined) {
    req.body.published =
      req.body.published === "true" || req.body.published === true;
  }
  if (req.body.featured !== undefined) {
    req.body.featured =
      req.body.featured === "true" || req.body.featured === true;
  }
  if (req.files?.thumbnail?.[0]) {
    req.body.thumbnail = {
      url: req.files.thumbnail[0].path,
      fileName: req.files.thumbnail[0].filename,
    };
  }
  if (req.files?.coverImage?.[0]) {
    req.body.coverImage = {
      url: req.files.coverImage[0].path,
      fileName: req.files.coverImage[0].filename,
    };
  }
  if (req.files?.gallery?.length) {
    let uploads = req.body.galleryUploads || [];
    if (!Array.isArray(uploads)) uploads = [uploads];

    uploads = uploads
      .map((value) => {
        try {
          return typeof value === "string" ? JSON.parse(value) : value;
        } catch (err) {
          return null;
        }
      })
      .filter(Boolean);

    req.body.galleryUploads = req.files.gallery.map((file, index) => ({
      ...(uploads[index] || {}),
      image: {
        url: file.path,
        fileName: file.filename,
      },
    }));

    if (req.method === "POST") {
      req.body.gallery = req.body.galleryUploads.map((upload) => ({
        image: upload.image,
        title: upload.title || "",
      }));
    }
  }

  if (req.method === "POST" && !req.files?.thumbnail?.[0]) {
    await cleanupUploadedFiles(req.files).catch(() => {});
    throw new ExpressError(400, "Thumbnail image is required");
  }

  const { error } = projectValidationSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true,
  });
  if (error) {
    console.log(error.details);
    await cleanupUploadedFiles(req.files).catch(() => {});
    throw new ExpressError(400, error.details.map((e) => e.message).join("\n"));
  } else {
    next();
  }
};

const publicationValidation = (req, res, next) => {
  let { error } = publicationValidationSchema.validate(req.body);
  if (error) {
    throw new ExpressError(400, error.message);
  } else {
    next();
  }
};

const LOGIN_PATH = "/raselAdmin";

function isCrossSiteWrite(req) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return false;

  const origin = req.get("origin");
  const site = req.get("sec-fetch-site");

  if (site && site !== "same-origin" && site !== "none") return true;

  if (origin) {
    let originHost;
    try {
      originHost = new URL(origin).host;
    } catch (err) {
      return true;
    }
    return originHost !== req.get("host");
  }
  return false;
}

const ownerOnly = (req, res, next) => {
  if (isCrossSiteWrite(req)) {
    console.warn(
      `[auth] blocked cross-site ${req.method} ${req.originalUrl} from origin=${req.get("origin") || "—"} site=${req.get("sec-fetch-site") || "—"}`,
    );
    return next(
      new ExpressError(
        403,
        "This request was rejected because it did not originate from this site.",
      ),
    );
  }

  if (
    req.isAuthenticated() &&
    (req.user.role === "admin" ||
      req.user.email === "rasel.hasan1563@gmail.com")
  ) {
    return next();
  }

  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    req.session.returnTo = req.originalUrl;
  }

  // req.flash("error", "Please sign in to make that change.");
  const wantsMarkup = req.accepts(["html", "text/html", "xhtml"]);
  if (!wantsMarkup) {
    return next(
      new ExpressError(401, "You must be signed in to make that change."),
    );
  }
  return next(new ExpressError(401, "Unauthorized Access"));
};

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  req.session.returnTo = req.originalUrl;
  req.flash("error", "Please sign in to continue.");
  return next(new ExpressError(401, "Unauthorized Access"));
};

const setViewLocals = (req, res, next) => {
  const user = req.user || null;

  if (process.env.AUTH_DEBUG) {
    console.log(
      "AUTHDBG",
      req.method,
      req.originalUrl,
      "auth=",
      req.isAuthenticated(),
      "user=",
      user && user.email,
      "ctype=",
      res.locals.isOwner,
    );
  }

  res.locals.currentUser = user; //template e current user variable available hobe
  res.locals.isOwner = Boolean(user); //return true if logged in false if not
  res.locals.csrfToken = req.session ? req.session.csrfToken : null;
  res.locals.flash = {
    success: req.flash("success"),
    error: req.flash("error"),
    info: req.flash("info"),
  };

  next();
};

module.exports = {
  asyncHandler,
  handleValidationError,
  blogValidation,
  projectValidation,
  publicationValidation,
  isLoggedIn,
  ownerOnly,
  setViewLocals,
  LOGIN_PATH,
};
