const Joi = require("joi");

const blogValidationSchema = Joi.object({
  title: Joi.string().trim().max(100).required().messages({
    "string.empty": "A blog post title is required",
    "any.required": "A blog post title is required",
    "string.max": "Title cannot exceed 100 characters",
  }),

  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .required()
    .messages({
      "string.empty": "Slug is required",
      "any.required": "Slug is required",
      "string.pattern.base": "Slug must be URL-safe (lowercase, hyphens only)",
    }),

  summary: Joi.string().trim().max(300).allow("", null).messages({
    "string.max": "Summary cannot exceed 300 characters",
  }),

  content: Joi.string().required().messages({
    "string.empty": "Content is required",
    "any.required": "Content is required",
  }),

  coverImage: Joi.object({
    url: Joi.string().uri().required(),
    fileName: Joi.string().required(),
  }).optional(),
  
  coverImageAlt: Joi.string().trim().allow("", null).default(""),


  tags: Joi.array().items(Joi.string().trim().lowercase()).default([]),

  status: Joi.string()
    .valid("draft", "published", "archived")
    .default("draft")
    .messages({
      "any.only": "{#value} is not a valid status",
    }),

  publishedAt: Joi.date().allow(null),
});

const projectValidationSchema = Joi.object({
  // Basic Information
  title: Joi.string().trim().required().messages({
    "string.empty": "Project title is required",
    "any.required": "Project title is required",
  }),

  slug: Joi.string().trim().lowercase().required().messages({
    "string.empty": "Slug is required",
    "any.required": "Slug is required",
  }),

  tagline: Joi.string().max(120).required().messages({
    "string.max": "Tagline cannot exceed 120 characters",
    "string.empty": "Tagline is required",
    "any.required": "Tagline is required",
  }),

  description: Joi.string().required().messages({
    "string.empty": "Description is required",
    "any.required": "Description is required",
  }),

  // Category
  category: Joi.string()
    .valid("AI", "Full Stack", "Research", "Open Source", "Mobile", "Other")
    .default("Other"),

  // Status
  status: Joi.string()
    .valid("Planning", "In Progress", "Completed", "Maintaining", "Archived")
    .default("Completed"),

  featured: Joi.boolean().default(false),

  // Images
  thumbnail: Joi.object({
    url: Joi.string().uri().required(),
    fileName: Joi.string().required(),
  }).optional().messages({
    "any.required": "Thumbnail image is required",
  }),

  coverImage: Joi.object({
    url: Joi.string().uri().required(),
    fileName: Joi.string().required(),
  }).allow(null),

  // Object Array Validation (Gallery)
  gallery: Joi.array()
    .items(
      Joi.object({
        image: Joi.object({
          url: Joi.string().uri().required(),
          fileName: Joi.string().required(),
        }).required(),
        title: Joi.string().allow("", null),
      }),
    )
    .default([]),

  // Video Preview
  previewVideo: Joi.string().allow("", null),

  // Object Array Validation (Technologies)
  technologies: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        icon: Joi.string().allow("", null),
      }),
    )
    .default([]),

  // Links
  githubUrl: Joi.string().uri().allow("", null).messages({
    "string.uri": "GitHub link must be a valid URL",
  }),

  liveUrl: Joi.string().uri().allow("", null).messages({
    "string.uri": "Live production link must be a valid URL",
  }),

  // Case Study Details
  problem: Joi.string().allow("", null),

  solution: Joi.string().allow("", null),

  features: Joi.array().items(Joi.string()).default([]),

  // Object Array Validation (Development Journey)
  developmentJourney: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().allow("", null),
        description: Joi.string().allow("", null),
      }),
    )
    .default([]),

  futurePlans: Joi.array().items(Joi.string()).default([]),

  // Team Details
  teamSize: Joi.number().integer().min(1).default(1),

  myRole: Joi.string().default("Full Stack Developer"),

  duration: Joi.string().allow("", null),

  completionDate: Joi.date().allow(null),

  // SEO Fields
  metaTitle: Joi.string().allow("", null),

  metaDescription: Joi.string().allow("", null),

  keywords: Joi.array().items(Joi.string()).default([]),

  // Nested Object Validation (Statistics)
  stats: Joi.object({
    users: Joi.number().integer().min(0).default(0),
    commits: Joi.number().integer().min(0).default(0),
    githubStars: Joi.number().integer().min(0).default(0),
    performanceScore: Joi.number().min(0).max(100).default(0),
    lighthouseScore: Joi.number().min(0).max(100).default(0),
  }).default({}),

  // Project Order
  order: Joi.number().integer().default(0),

  // Visibility Status
  published: Joi.boolean().default(true),
});

//publication validation schema
const publicationValidationSchema = Joi.object({
  title: Joi.string().trim().max(100).required().messages({
    "string.empty": "A publication title is required",
    "any.required": "A publication title is required",
    "string.max": "Title cannot exceed 100 characters",
  }),

  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .allow("", null) // অপশনাল রাখা হয়েছে কারণ মঙ্গুস মিডলওয়্যার (pre-validate) এটি নিজে থেকেই তৈরি করে নেবে
    .messages({
      "string.pattern.base": "Slug must be URL-safe (lowercase, hyphens only)",
    }),

  URL: Joi.string().trim().lowercase().uri().required().messages({
    "string.empty": "External publication URL is required",
    "any.required": "External publication URL is required",
    "string.uri": "External publication URL must be a valid URI/URL",
  }),

  abstract: Joi.string().trim().max(1000).required().messages({
    "string.empty": "Abstract is required",
    "any.required": "Abstract is required",
    "string.max": "Abstract cannot exceed 1000 characters",
  }),

  publishedIn: Joi.string().required().messages({
    "string.empty": "Journal or Conference name is required",
    "any.required": "Journal or Conference name is required",
  }),

  publisher: Joi.string().trim().allow("", null).default(""),

  DOI: Joi.string().trim().required().messages({
    "string.empty": "Digital Object Identifier (DOI) is required",
    "any.required": "Digital Object Identifier (DOI) is required",
  }),

  publishedAt: Joi.date().required().messages({
    "any.required": "Publication date is required",
    "date.base": "Publication date must be a valid date",
  }),

  featured: Joi.boolean().default(false),
});

module.exports = {
  projectValidationSchema,
  blogValidationSchema,
  publicationValidationSchema,
};
