const multer = require("multer");
const cloudinary = require("./cloudinary");
const ExpressError = require("../utility/expressError");

const storage = multer.memoryStorage();

const uploadToCloudinary = (req, file) => {
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

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${rootFolder}/${folderName}`,
        resource_type: "image",
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      },
    );
    stream.end(file.buffer);
  });
};

const uploadFilesToCloudinary = async (req, files) => {
  const uploadedFiles = [];
  req.files = req.files || {};
  try {
    for (const [fieldName, fieldFiles] of Object.entries(files || {})) {
      req.files[fieldName] = [];
      for (const file of fieldFiles) {
        const result = await uploadToCloudinary(req, file);
        const uploadedFile = {
          ...file,
          path: result.secure_url,
          url: result.secure_url,
          filename: result.public_id,
        };
        delete uploadedFile.buffer;
        req.files[fieldName].push(uploadedFile);
        uploadedFiles.push(uploadedFile);
      }
    }
  } catch (err) {
    await Promise.all(
      uploadedFiles
        .filter((file) => file.filename)
        .map((file) =>
          cloudinary.uploader.destroy(file.filename, { resource_type: "image" }),
        ),
    ).catch(() => {});
    throw new ExpressError(
      502,
      `Cloudinary upload failed: ${err.message || "Unknown upload error"}`,
    );
  }
};

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
  upload.fields(fields)(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new ExpressError(400, "Image size must be less than 20 MB."));
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE" || err.code === "LIMIT_FILE_COUNT") {
        return next(new ExpressError(400, err.message || "Invalid upload field or file count."));
      }
      if (err.message) {
        return next(new ExpressError(400, err.message));
      }
      return next(new ExpressError(400, "Invalid image upload."));
    }

    try {
      await uploadFilesToCloudinary(req, req.files);
      next();
    } catch (uploadError) {
      next(uploadError);
    }
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