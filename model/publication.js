const mongoose = require("mongoose");
const { translatable } = require("./translatable");

const publicationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A publication title is required"],
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
    URL: {
      type: String,
      required: [true, "External publication URL is required"],
      trim: true,
      lowercase: true,
    },
    abstract: {
      type: String,
      trim: true,
      required: [true, "Abstract is required"],
      maxlength: [1000, "Abstract cannot exceed 1000 characters"], // আপনার স্ক্রিনশটের রিসার্চ পেপারের অবস্ট্রাক্ট বড় ছিল, তাই ৩০০ থেকে ১০০০ করা হলো
    },
    publishedIn: {
      type: String,
      required: [true, "Journal or Conference name is required"], // আপনার মেসেজটি ক্লিয়ার করা হলো
    },
    publisher: {
      type: String,
      trim: true,
      default: "",
    },
    DOI: {
      type: String,
      trim: true,
      required: [true, "Digital Object Identifier (DOI) is required"],
    },
    publishedAt: {
      type: Date,
      required: [true, "Publication date is required"],
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

publicationSchema.virtual("readTime").get(function () {
  if (!this.abstract) return 0;
  const words = this.abstract.split(/\s+/).length;
  return Math.ceil(words / 200);
});

publicationSchema.virtual("url").get(function () {
  return `/publications/${this.slug}`;
});

publicationSchema.index({ publishedAt: -1 });
publicationSchema.index({ featured: -1, publishedAt: -1 });

/**
 * Multilingual content.
 *
 * Journal names, publishers, DOIs and URLs are never translated — they are
 * identifiers. Only the title and the abstract are content, so only those get
 * a `_bn` column.
 */
const translatedFields = ["title", "abstract"];
translatable(publicationSchema, { fields: translatedFields });

// Autogenerate a URL-safe slug from the title right before validation runs.
// Mongoose 9 hook runners may be promise-based, so the hook is kept synchronous
// (no `next` argument and no async keyword — that would raise "next is not a function").
publicationSchema.pre("validate", function () {
  if (!this.isModified("title") && this.slug) return;

  const generatedSlug = (this.title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  this.slug = generatedSlug || `publication-${this._id}`;
});

module.exports = mongoose.model("Publication", publicationSchema);
module.exports.translatedFields = translatedFields;
