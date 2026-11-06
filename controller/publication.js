const mongoose = require("mongoose");
const Publication = require("../model/publication");
const ExpressError = require("../utility/expressError");

module.exports.index = async (req, res) => {
  const publication = await Publication.find();
  res.render("main/Research/publications/index", {
    publications: publication,
  });
};

module.exports.newPublications = (req, res) => {
  res.render("main/Research/publications/newPub");
};

module.exports.postPublications = async (req, res) => {
  try {
    const {
      title,
      URL,
      DOI,
      publishedIn,
      publisher,
      publishedAt,
      abstract,
      featured,
    } = req.body;

    const payload = {
      title: typeof title === "string" ? title.trim() : title,
      URL: typeof URL === "string" ? URL.trim() : URL,
      DOI: typeof DOI === "string" ? DOI.trim() : DOI,
      publishedIn:
        typeof publishedIn === "string" ? publishedIn.trim() : publishedIn,
      publisher: typeof publisher === "string" ? publisher.trim() : publisher,
      publishedAt,
      abstract: typeof abstract === "string" ? abstract.trim() : abstract,
      featured: featured === "true" || featured === true,
    };
    await Publication.create(payload);

    res.redirect("/research/publications");
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).render("main/error/errorHandler", {
        status: 400,
        success: false,
        message: err.message || "Publication validation failed",
        errors: err.errors,
      });
    }

    throw err;
  }
};

module.exports.deletePublications = async (req, res) => {
  const { id } = req.params;
console.log(id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ExpressError(400, "Invalid publication identifier");
  }

  const deleted = await Publication.findByIdAndDelete(id);

  if (!deleted) {
    throw new ExpressError(404, "Publication not found");
  }

  res.redirect("/research/publications");
};
