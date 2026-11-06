const Project = require("../model/project");
const cloudinary = require("../config/cloudinary");

module.exports.index = async (req, res) => {
  const { category } = req.query;
  if (!category) {
    const projects = await Project.find({}).sort({ createdAt: -1 });
    return res.render("main/projects", {
      projects,
      activeCategory: "All",
    });
  }
  const projects = await Project.find({ category: category }).sort({
    createdAt: -1,
  });
  res.render("main/projects", {
    projects,
    activeCategory: category,
  });
};

module.exports.createNew = (req, res) => {
  res.render("main/projects/new");
};

module.exports.postNew = async (req, res, next) => {
  const projectData = new Project(req.body);
  try {
    await projectData.save();
  } catch (err) {
    const { cleanupUploadedFiles } = require("../config/upload");
    await cleanupUploadedFiles(req.files).catch(() => {});
    throw err;
  }
  res.redirect("/projects");
};

module.exports.viewPost = async (req, res) => {
  let { slug } = req.params;
  const project = await Project.findOne({ slug: slug });
  res.render("main/show", { project });
};

module.exports.editPost = async (req, res) => {
  const { id } = req.params;
  let data = await Project.findOne({ _id: id });
  res.render("main/projects/edit", { project: data });
};

module.exports.updatePost = async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  body.featured = body.featured === "true";
  body.published = body.published === "true";

  const project = await Project.findById(id);
  if (!project) return res.redirect("/projects");

  let existingIndexes = body.existingGalleryIndex || [];
  if (!Array.isArray(existingIndexes)) existingIndexes = [existingIndexes];
  existingIndexes = existingIndexes.map((index) => Number(index)).filter(Number.isInteger);

  const galleryUploads = body.galleryUploads || [];
  const normalizedGalleryUploads = Array.isArray(galleryUploads)
    ? galleryUploads
    : [galleryUploads];
  let nextGallery = existingIndexes.map((index) => {
    const existing = project.gallery[index];
    if (!existing) return null;

    return {
      image: existing.image,
      title: body[`galleryTitle_${index}`] ?? existing.title ?? "",
    };
  }).filter(Boolean);

  for (const upload of normalizedGalleryUploads) {
    if (!upload.image?.url || !upload.image?.fileName) continue;

    const replacementIndex =
      upload.existingIndex !== null && upload.existingIndex !== undefined && upload.existingIndex !== ""
        ? Number(upload.existingIndex)
        : null;
    const replacement = {
      image: upload.image,
      title: upload.title || "",
    };

    if (Number.isInteger(replacementIndex) && project.gallery[replacementIndex]) {
      const position = existingIndexes.indexOf(replacementIndex);
      if (position >= 0) nextGallery[position] = replacement;
      else nextGallery.push(replacement);
    } else {
      nextGallery.push(replacement);
    }
  }

  body.gallery = nextGallery;

  const oldThumbnail = project.thumbnail;
  const oldCoverImage = project.coverImage;
  const oldGallery = project.gallery;
  const deletedGallery = oldGallery.filter((item, index) => {
    if (!existingIndexes.includes(index)) return true;
    return normalizedGalleryUploads.some((upload) =>
      Number(upload.existingIndex) === index
    );
  });

  delete body.galleryUploads;
  delete body.existingGalleryIndex;
  Object.keys(body).forEach((key) => {
    if (key.startsWith("galleryTitle_")) delete body[key];
  });

  try {
    await Project.findByIdAndUpdate(id, body, {
      runValidators: true,
      context: "query",
    });
  } catch (err) {
    const { cleanupUploadedFiles } = require("../config/upload");
    await cleanupUploadedFiles(req.files).catch(() => {});
    throw err;
  }

  if (req.files?.thumbnail?.[0] && oldThumbnail?.fileName) {
    await cloudinary.uploader.destroy(oldThumbnail.fileName, { resource_type: "image" });
  }
  if (req.files?.coverImage?.[0] && oldCoverImage?.fileName) {
    await cloudinary.uploader.destroy(oldCoverImage.fileName, { resource_type: "image" });
  }
  for (const item of deletedGallery) {
    if (item.image?.fileName) {
      await cloudinary.uploader.destroy(item.image.fileName, { resource_type: "image" });
    }
  }
  res.redirect(`/projects`);
};

module.exports.deletePost = async (req, res) => {
  let { id } = req.params;
  const project = await Project.findByIdAndDelete(id);
  if (project) {
    const images = [
      project.thumbnail,
      project.coverImage,
      ...(project.gallery || []).map((item) => item.image),
    ];
    await Promise.all(
      images
        .filter((image) => image?.fileName)
        .map((image) =>
          cloudinary.uploader.destroy(image.fileName, { resource_type: "image" }),
        ),
    );
  }
  res.redirect("/projects");
};
