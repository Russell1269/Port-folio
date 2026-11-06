const express = require("express");
const Blog = require("../model/blog");
const ExpressError = require("../utility/expressError");
const cloudinary = require("../config/cloudinary");

module.exports.index = async (req, res) => {
  const blogs = await Blog.find({ status: "published" }).sort({
    publishedAt: -1,
  });

  const featured = blogs[0] || null;

  res.render("main/blogs/index", { blogs, featured });
};

module.exports.addNewPage = (req, res) => {
  res.render("main/blogs/new");
};

module.exports.postNew = async (req, res) => {
  const blogData = new Blog(req.body);
  try {
    await blogData.save();
  } catch (err) {
    const { cleanupUploadedFiles } = require("../config/upload");
    await cleanupUploadedFiles(req.files).catch(() => {});
    throw err;
  }
  res.redirect("/blogs");
};

module.exports.view = async (req, res, next) => {
  const { slug } = req.params;

  const blog = await Blog.findOne({ slug });

  if (!blog) {
    throw new ExpressError(404, "Blog post not found");
  }

  const [previousPost, nextPost] = await Promise.all([
    Blog.findOne({
      createdAt: { $lt: blog.createdAt },
      status: "published",
    })
      .sort({ createdAt: -1 })
      .select("title slug"),

    Blog.findOne({
      createdAt: { $gt: blog.createdAt },
      status: "published",
    })
      .sort({ createdAt: 1 })
      .select("title slug"),
  ]);

  res.render("main/blogs/show", {
    blog,
    previousPost: previousPost || null,
    nextPost: nextPost || null,
    prevLabel: previousPost ? previousPost.title : "No previous article",
    nextLabel: nextPost ? nextPost.title : "No next article",
  });
};

module.exports.edit = async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  res.render("main/blogs/edit", { blog });
};

module.exports.postEdit = async (req, res) => {
  const { id } = req.params;

  const existing = await Blog.findById(id);

  if (!existing) {
    throw new ExpressError(404, "Blog post not found");
  }

  const { title, slug, summary, content, coverImage, coverImageAlt, tags, status } = req.body;

  const update = {
    title,
    slug,
    summary,
    content,
    coverImage: coverImage || existing.coverImage || "",
    coverImageAlt: coverImageAlt ?? existing.coverImageAlt ?? "",
    status,
    tags: Array.isArray(tags) ? tags : [],
  };

  if (status === "published" && !existing.publishedAt) {
    update.publishedAt = new Date();
  }

  try {
    await Blog.findByIdAndUpdate(id, update, {
      runValidators: true,
    });
  } catch (err) {
    const { cleanupUploadedFiles } = require("../config/upload");
    await cleanupUploadedFiles(req.files).catch(() => {});
    throw err;
  }

  if (
    req.files?.coverImage?.[0]?.filename &&
    existing.coverImage?.fileName
  ) {
    await cloudinary.uploader.destroy(existing.coverImage.fileName, { resource_type: "image" });
  }

  res.redirect("/blogs");
};

module.exports.deleteBlog = async (req, res) => {
  const { id } = req.params;
  const blog = await Blog.findByIdAndDelete(id);
  if (blog?.coverImage?.fileName) {
    await cloudinary.uploader.destroy(blog.coverImage.fileName, { resource_type: "image" });
  }
  res.redirect("/blogs");
};
