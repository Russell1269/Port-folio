document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("projects-grid");
  const countDisplay = document.getElementById("project-count");
  if (grid && countDisplay) {
    countDisplay.textContent = grid.children.length;
  }
});

//tailwind config
if (typeof tailwind !== "undefined") tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        glassDark: "rgba(15, 23, 42, 0.65)",
        glassBorder: "rgba(255, 255, 255, 0.08)",
        neonCyan: "#06b6d4",
        neonPurple: "#a855f7",
        neonPink: "#ec4899",
      },
      boxShadow: {
        neon: "0 0 20px rgba(6, 182, 212, 0.15)",
        "neon-hover": "0 0 30px rgba(6, 182, 212, 0.35)",
      },
    },
  },
};

//chat
app.locals.getStatusColor = (status) => {
  switch (status) {
    case "Completed":
      return "bg-green-500/20 text-green-300 border-green-400/20";

    case "In Progress":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-400/20";

    case "Planning":
      return "bg-blue-500/20 text-blue-300 border-blue-400/20";

    case "Maintaining":
      return "bg-purple-500/20 text-purple-300 border-purple-400/20";

    default:
      return "bg-gray-500/20 text-gray-300 border-gray-400/20";
  }
};

//for success button — the contact page runs its own handler (with the avatar
//states), so this fallback only applies where that handler is not present.
const form = document.getElementById("contactForm");

const button = document.getElementById("submitBtn");

const buttonText = document.getElementById("btnText");

const modal = document.getElementById("successModal");

const hasPageHandler = document.querySelector('script[data-contact-handler], #avatar-container');

form?.addEventListener("submit", async (e) => {
  if (hasPageHandler) return;

  e.preventDefault();

  button.disabled = true;

  buttonText.innerHTML = `

        <i class="fas fa-spinner fa-spin"></i>

        Sending...

    `;

  const response = await fetch(form.action, {
    method: "POST",

    body: new FormData(form),
  });

  if (response.ok) {
    form.reset();

    if (modal) modal.hidden = false;

    setTimeout(() => {
      if (modal) modal.hidden = true;
    }, 3000);
  }

  button.disabled = false;

  buttonText.innerHTML = "Send Message";
});

//for footer
const backToTop = document.querySelector('a[href="#top"]');
backToTop?.addEventListener("click", (e) => {
  e.preventDefault();

  window.scrollTo({
    top: 0,

    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
  });
});

//for flash messages — dismissed by the close button or automatically after 6s.
(function () {
  const notices = document.querySelectorAll("[data-flash]");
  if (!notices.length) return;

  function dismiss(notice) {
    notice.style.transition = "opacity 150ms ease, transform 150ms ease";
    notice.style.opacity = "0";
    notice.style.transform = "translate(-50%, -6px)";
    setTimeout(() => notice.remove(), 160);
  }

  notices.forEach((notice) => {
    const close = notice.querySelector("[data-flash-close]");
    close?.addEventListener("click", () => dismiss(notice));
    setTimeout(() => {
      if (notice.isConnected) dismiss(notice);
    }, 6000);
  });
})();
