const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        "Please provide a valid email address",
      ],
    },
    role: {
      type: String,
      enum: ["admin", "guest"],
      default: "guest",
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
  errorMessages: {
    UserExistsError:
      "A user with the given email address is already registered.",
  },
});

module.exports = mongoose.model("User", userSchema);
