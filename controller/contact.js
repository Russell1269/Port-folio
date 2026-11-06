const mongoose = require("mongoose");
const { Resend } = require("resend");

let resend = null;
function getResend() {
  // Lazily constructed so the app (and the test suite) can boot without a key.
  if (!resend) resend = new Resend(process.env.RESEND_KEY);
  return resend;
}

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

module.exports.index = (req, res) => {
  res.render("main/contact");
};

/**
 * Accepts either a normal form post or the fetch() JSON request sent by the
 * page's inline script. Every user-facing string comes from `contact:*`, so the
 * response is always in the visitor's language.
 */
module.exports.sendMessage = async (req, res) => {
  const wantsJson = Boolean(req.is && req.is("application/json"));
  const { name, email, subject, message } = req.body || {};

  const fail = (status, key) => {
    const text = req.t(key);
    if (wantsJson) return res.status(status).json({ ok: false, message: text });
    req.flash("error", text);
    return res.redirect("/contact");
  };

  if (!name || !subject || !message || !isEmail(email)) {
    return fail(400, "contact:error.invalid");
  }
  if (
    String(name).trim().length > 100 ||
    String(subject).trim().length > 150 ||
    String(message).trim().length > 5000
  ) {
    return fail(400, "contact:error.invalid");
  }
  if (String(message).trim().length < 10) {
    return fail(400, "contact:error.tooShort");
  }

  try {
    await getResend().emails.send({
      from: "Portfolio Contact <onboarding@resend.dev>",
      to: process.env.CONTACT_EMAIL || "rasel.hasan1563@gmail.com",
      // The subject is written by the visitor — it is never translated.
      subject: String(subject).replace(/[\r\n]/g, " ").trim(),
      html:
        `<p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>` +
        `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
    });

    const success = req.t("contact:error.success");
    if (wantsJson) return res.json({ ok: true, message: success });
    req.flash("success", success);
    return res.redirect("/contact");
  } catch (error) {
    console.error("[contact]", error);
    return fail(500, "contact:error.send");
  }
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
