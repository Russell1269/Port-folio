const mongoose = require("mongoose");
const User = require("../model/user");
const { LOGIN_PATH } = require("../utility/miiddleware");
const adminLoginPath = LOGIN_PATH;
const passport = require("passport");

module.exports.logInPage = async (req, res) => {
  await req.i18n.loadNamespaces(["admin"]);
  if (req.isAuthenticated()) {
    const user = req.user;
    return res.render("main/ADMIN/login", { user, alreadyLoggedIn: true });
  }
  res.render("main/ADMIN/login", { user: null, alreadyLoggedIn: false });
};

module.exports.postLogIn = [
  (req, res, next) => {
    if (req.isAuthenticated()) {
      req.flash("info", req.t("common:flash.alreadyLoggedIn"));
      return res.redirect(adminLoginPath);
    }
    if (!req.body.email || !req.body.password) {
      req.flash("error", req.t("common:flash.missingCredentials"));
      return res.redirect(adminLoginPath);
    }
    next();
  },
  (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        req.flash(
          "error",
          (info && info.message) || req.t("common:flash.invalidCredentials"),
        );
        return res.redirect(adminLoginPath);
      }

      const returnTo =
        typeof req.session.returnTo === "string" &&
        req.session.returnTo.startsWith("/") &&
        !req.session.returnTo.startsWith("//")
          ? req.session.returnTo
          : "/";
      req.session.regenerate((regenErr) => {
        if (regenErr) return next(regenErr);

        req.logIn(user, (loginErr) => {
          if (loginErr) return next(loginErr);

          User.findByIdAndUpdate(user._id, { lastLogin: new Date() }).catch(
            () => {},
          );

          req.session.returnTo = undefined;
          req.session.save((saveErr) => {
            if (saveErr) return next(saveErr);
            req.flash(
              "success",
              req.t("common:flash.welcomeBack", { name: user.name }),
            );
            res.redirect(returnTo);
          });
        });
      });
    })(req, res, next);
  },
];

module.exports.postLogOut = (req, res, next) => {
  const returnTo =
    typeof req.session.returnTo === "string" &&
    req.session.returnTo.startsWith("/") &&
    !req.session.returnTo.startsWith("//")
      ? req.session.returnTo
      : "/";
  req.logout((err) => {
    if (err) return next(err);
    req.session.returnTo = undefined;
    req.session.save(() => {
      res.redirect(returnTo);
    });
  });
};
