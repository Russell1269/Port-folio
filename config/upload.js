const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const routePath = `${req.baseUrl || ""} ${req.originalUrl || ""}`.toLowerCase();
    const field = String(file.fieldname || "").toLowerCase();
    const isBlog = routePath.includes("/blogs");
    const rootFolder = isBlog ? "portfolio/blogs" : "portfolio/projects";
    const folderName =
      field === "thumbnail"
        ? "Thumbnail"
        : field === "coverimage" || field === "cover"
          ? "CoverImage"
          : field === "gallery"
            ? "Gallery"
            : "Misc";

    return {
      folder: `${rootFolder}/${folderName}`,
      type: "upload",
      resource_type: "image",
      allowed_formats: ["png", "jpg", "jpeg", "webp"],
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024, files: 22 },
  fileFilter: (req, file, callback) => {
    if (!/^image\/(png|jpe?g|webp)$/.test(file.mimetype)) {
      return callback(new Error("Only PNG, JPEG, and WebP images are allowed"));
    }
    callback(null, true);
  },
});

module.exports.upload = upload;

module.exports.uploadFields = (fields) => (req, res, next) => {
  upload.fields(fields)(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      req.flash("error", "Image size must be less than 10 MB.");
      return res.redirect("back");
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE" || err.code === "LIMIT_FILE_COUNT") {
      req.flash("error", err.message || "Invalid upload field or file count.");
      return res.redirect("back");
    }
    return next(err);
  });
};

module.exports.cleanupUploadedFiles = async (files) => {
  if (!files) return;
  const images = [
    ...(files.thumbnail || []),
    ...(files.coverImage || []),
    ...(files.cover || []),
    ...(files.gallery || []),
  ];
  await Promise.all(
    [...new Map(images.filter((file) => file?.filename).map((file) => [file.filename, file])).values()]
      .map((file) => cloudinary.uploader.destroy(file.filename, { resource_type: "image" })),
  );
};