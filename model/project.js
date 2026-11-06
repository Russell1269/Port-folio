const mongoose = require("mongoose");
const { translatable } = require("./translatable");
const { required } = require("joi");

const projectSchema = new mongoose.Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    tagline: {
      type: String,
      required: true,
      maxlength: 120,
    },

    description: {
      type: String,
      required: true,
    },

    // Category
    category: {
      type: String,
      enum: ["AI", "Full Stack", "Research", "Open Source", "Mobile", "Other"],
      default: "Other",
    },

    // Status
    status: {
      type: String,
      enum: ["Planning", "In Progress", "Completed", "Maintaining", "Archived"],
      default: "Completed",
    },

    featured: {
      type: Boolean,
      default: false,
    },

    // Images
    thumbnail: {
      url: {
        type: String,
        required: true,
      },

      fileName: {
        type: String,
        required: true,
      },
    },
    coverImage: {
      url: {
        type: String,
      },
      fileName: { type: String },
    },

    gallery: [
      {
        image: {
          url: String,
          fileName: String,
        },
        title: String,
      },
    ],

    // Video Preview
    previewVideo: String,

    // Technology
    technologies: [
      {
        name: String,
        icon: String,
      },
    ],

    // Links
    githubUrl: String,

    liveUrl: String,

    // Case Study
    problem: String,

    solution: String,

    features: [String],

    developmentJourney: [
      {
        title: String,
        description: String,
      },
    ],

    futurePlans: [String],

    // Team
    teamSize: {
      type: Number,
      default: 1,
    },

    myRole: {
      type: String,
      default: "Full Stack Developer",
    },

    duration: String,

    completionDate: Date,

    // SEO
    metaTitle: String,

    metaDescription: String,

    keywords: [String],

    // Statistics
    stats: {
      users: Number,
      commits: Number,
      githubStars: Number,
      performanceScore: Number,
      lighthouseScore: Number,
    },

    // Project Order
    order: {
      type: Number,
      default: 0,
    },

    // Published
    published: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Multilingual content.
 *
 * `title` / `tagline` / `description` remain the English source of truth;
 * `_bn` fields are optional and fall back per field via `localized()`.
 * `slug` is deliberately language-neutral: one URL serves every language.
 */
const translatedFields = ["title", "tagline", "description"];
translatable(projectSchema, { fields: translatedFields });
projectSchema.index({ published: 1, featured: -1, createdAt: -1 });
projectSchema.index({ category: 1, published: 1 });

module.exports = mongoose.model("Project", projectSchema);
module.exports.translatedFields = translatedFields;
