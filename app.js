if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const express = require("express");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejs = require("ejs");
const morgan = require("morgan");
const { Resend } = require("resend");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");

const User = require("./model/user");
// router
const home = require("./routes/home");
const project = require("./routes/project");
const blog = require("./routes/blog");
const publication = require("./routes/publication");
const contact = require("./routes/contact");
const about = require("./routes/about");
const admin = require("./routes/admin");

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

//authentication
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose").default;

const {
  handleValidationError,
  asyncHandler,
  setViewLocals,
  ownerOnly,
  LOGIN_PATH,
} = require("./utility/miiddleware");

const {
  i18nextMiddleware,
  i18nCacheHeaders,
  rememberLanguage,
  i18nViewLocals,
  loadNamespaces,
} = require("./middleware/i18n");

const ExpressError = require("./utility/expressError");
const app = express();
const port = 8080;
const path = require("path");
const engine = require("ejs-mate");
require("dotenv").config();
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

// ---- localization (must sit above every render) -----------------------------
// ?lang= > cookie > Accept-Language > "en"  (see middleware/i18n.js)
app.use(i18nextMiddleware);
app.use(i18nCacheHeaders);
app.use(rememberLanguage);
app.use(i18nViewLocals);

//database
async function main() {
  await mongoose.connect(process.env.ATLASIAN_URL);
}
main()
  .then(() => {
    console.log("Database Connected");
  })
  .catch((err) => {
    console.log(err);
  });

//middleware
app.use("/projects/:id", (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Request URL:", req.originalUrl);
    console.log("Request Type:", req.method);
  }
  next();
});

app.use(morgan("dev"));
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  next();
});

// console.log(MongoStore);
// console.log(typeof MongoStore.create);

const store = MongoStore.create({
  mongoUrl: process.env.ATLASIAN_URL,
  crypto: {
    secret: process.env.SESSION_SECRET,
  },
  touchAfter: 24 * 3600, // 24hours
});
store.on("error", (err) => {
  console.log("Session store error", err);
});

app.set("trust proxy", 1);

const sessionOption = {
  store: store,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    maxAge: 1000 * 60 * 60 * 24 * 3,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

if (!sessionOption.secret && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET is required in production");
}
if (!sessionOption.secret) {
  sessionOption.secret = "development-only-session-secret";
}



app.use(session(sessionOption));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/debug-secure", (req, res) => {
  res.json({
    protocol: req.protocol,
    secure: req.secure,
    forwardedProto: req.headers["x-forwarded-proto"],
    host: req.headers.host,
    nodeEnv: process.env.NODE_ENV,
  });
});

app.get(
  "/register/admin",
  asyncHandler(async (req, res) => {
    if (
      process.env.NODE_ENV === "production" ||
      !process.env.ADMIN_SETUP_TOKEN ||
      !process.env.ADMIN_SETUP_PASSWORD ||
      req.query.token !== process.env.ADMIN_SETUP_TOKEN
    ) {
      throw new ExpressError(404, "Page not found");
    }

    const email = "rasel.hasan1563@gmail.com";
    if (await User.exists({ email })) {
      return res.status(409).json({
        success: false,
        message: "An admin account already exists.",
      });
    }

    const info = new User({
      name: "Md Rasel Hasan",
      email,
      role: "admin",
    });
    const newAdmin = await User.register(
      info,
      process.env.ADMIN_SETUP_PASSWORD,
    );
    res.json({ success: true, id: newAdmin._id, email: newAdmin.email });
  }),
);

// Shared by every view (navbar, admin page, error page).
app.use(setViewLocals);
app.use((req, res, next) => {
  const baseUrl =
    process.env.SITE_URL || `${req.protocol}://${req.get("host")}`;
  const cleanPath = String(req.originalUrl || "/").split("?")[0];
  res.locals.canonicalUrl = `${baseUrl.replace(/\/$/, "")}${cleanPath}`;
  next();
});

//home
app.use("/", home);
//admin
app.use("/", admin);
//projects
app.use("/projects", project);

//contact
app.use("/contact", contact);

//about
app.use("/about", about);

//blog
app.use("/blogs", blog);

//RESEARCH PUBLICATIONS
app.use("/research/publications", publication);

//error
app.all(/(.*)/, (req, res, next) => {
  next(new ExpressError(404, req.t("common:error.notFound")));
});

app.use(handleValidationError);

//global error handeler
app.use((err, req, res, next) => {
  let { status = 500, message } = err;
  console.error(err.stack);
  // A blocked cross-site write is reported plainly rather than as a 500.
  if (err.code === "EBADCSRFTOKEN") {
    status = 403;
    message = null;
  }

  message =
    status === 500
      ? req.t("common:error.generic")
      : message ||
        (err.code === "EBADCSRFTOKEN"
          ? req.t("common:error.csrf")
          : req.t("common:error.generic"));

  res.status(status).render("main/error/errorHandler", {
    status,
    success: false,
    message,
  });
});

app.listen(port, () => {
  console.log("Successfull");
});
