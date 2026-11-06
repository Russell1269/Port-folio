const mongoose = require("mongoose");
const { translatable } = require("./translatable");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A blog post title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must be URL-safe (lowercase, hyphens only)",
      ],
      index: true,
    },
    summary: {
      type: String,
      trim: true,
      maxlength: [300, "Summary cannot exceed 300 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    coverImage: {
      url: {
        type: String,
        trim: true,
      },
      fileName: {
        type: String,
        trim: true,
      },
    },
    coverImageAlt: {
      type: String,
      trim: true,
      default: "",
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    status: {
      type: String,
      enum: {
        values: ["draft", "published", "archived"],
        message: "{VALUE} is not a valid status",
      },
      default: "draft",
      index: true,
    },
    publishedAt: {
      type: Date,
      index: true,
    },
  },
  { timestamps: true },
);

// Virtual: reading time estimate
blogSchema.virtual("readTime").get(function () {
  if (!this.content) return 0;
  const words = this.content.split(/\s+/).length;
  return Math.ceil(words / 200); // ~200 words per minute
});

// Virtual: full URL
blogSchema.virtual("url").get(function () {
  return `/blogs/${this.slug}`;
});

// Index for common queries
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ tags: 1 });

/**
 * Multilingual content.
 *
 * Short fields (`title`, `summary`) get dedicated `_bn` columns so they are
 * queryable and cheap to render in lists. `content` is long-form HTML: its
 * translation lives in `translations.bn.content`, because copying a multi-KB
 * HTML body into a column doubles every document you list on the index page.
 */
const translatedFields = ["title", "summary"];
translatable(blogSchema, { fields: translatedFields, translateDocs: true });

module.exports = mongoose.model("Blog", blogSchema);
module.exports.translatedFields = translatedFields;
