/* ==========================================================================
   Luxury — page behaviour.

   Only two interactive details live here:
   1. The comparison control announces which engagement is marked without
      moving focus or scroll, and marks the matching column.
   2. The closing field opens once, and only when it is safe to do so:
      wide layout, motion allowed, armed after the first scroll while the
      field is still below the viewport. Otherwise it stays fully visible.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const tagline = document.querySelector("[data-home-tagline]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (tagline && !reduceMotion.matches) {
    const walker = document.createTreeWalker(tagline, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach((node) => {
      const words = node.textValue ? node.textValue.trim().split(/\s+/) : node.nodeValue.trim().split(/\s+/);
      if (!words.length || !words[0]) return;
      const fragment = document.createDocumentFragment();

      words.forEach((word, index) => {
        if (index) fragment.append(document.createTextNode(" "));
        const span = document.createElement("span");
        span.className = "lx-home-word";
        span.textContent = word;
        fragment.append(span);
      });
      node.replaceWith(fragment);
    });

    const words = Array.from(tagline.querySelectorAll(".lx-home-word"));
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      words.forEach((word, index) => {
        window.setTimeout(() => word.classList.add("is-active"), Math.min(index * 60, 400));
      });
    }, { threshold: 0.35 });
    observer.observe(tagline);
  }

  const reveals = Array.from(document.querySelectorAll("#hero ~ .lx-section")).filter((section) =>
    !section.classList.contains("lx-section--flush-top")
  );

  if (!reduceMotion.matches && "IntersectionObserver" in window) {
    reveals.forEach((section) => section.classList.add("lx-home-reveal"));
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach((section) => revealObserver.observe(section));
  }
});

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     Comparison selection
     ------------------------------------------------------------------ */

  const compareForm = document.querySelector("[data-compare-form]");

  if (compareForm) {
    const status = compareForm.querySelector(".lx-compare__status");
    const table = compareForm.closest(".lx-section")?.querySelector(".lx-compare");

    const readSelection = () =>
      Array.from(compareForm.querySelectorAll('input[name="plan"]'))
        .filter((input) => input.checked)
        .map((input) => input.closest("label")?.textContent.trim())
        .filter(Boolean);

    // Labels are provided by the server (data-* attributes) so no English is
    // hard-coded here; switching language re-renders the page with new labels.
    const selectedTemplate = compareForm.dataset.selectedTemplate; // "Selected: __NAMES__"
    const emptyLabel = compareForm.dataset.emptyLabel;

    const update = () => {
      const names = readSelection();

      if (status) {
        status.textContent = names.length
          ? selectedTemplate.replace("__NAMES__", names.join(", "))
          : emptyLabel;
      }

      if (!table) return;

      table.querySelectorAll("[data-plan]").forEach((cell) => {
        const input = compareForm.querySelector(
          `input[name="plan"][value="${cell.dataset.plan}"]`
        );
        const selected = Boolean(input && input.checked);

        // The featured column keeps its own charcoal treatment; selection is
        // shown separately through the column's top rule.
        if (cell.tagName === "TH") {
          cell.classList.toggle("is-selected", selected && cell.dataset.plan !== "ongoing");
        }
      });
    };

    compareForm.addEventListener("change", (event) => {
      if (event.target.name === "plan") update();
    });

    update();
  }

  /* ------------------------------------------------------------------
     Closing field reveal
     ------------------------------------------------------------------ */

  const door = document.querySelector(".lx-door");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const wide = window.matchMedia("(min-width: 721px)");
  const supportsClip =
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    (CSS.supports("clip-path", "inset(0 1px 0 1px)") ||
      CSS.supports("-webkit-clip-path", "inset(0 1px 0 1px)"));

  if (!door) return;

  let armed = false;
  let played = false;

  const canPlay = () =>
    !played && wide.matches && !reduceMotion.matches && supportsClip;

  const belowView = () => door.getBoundingClientRect().top > window.innerHeight * 0.6;

  const open = () => {
    door.classList.add("is-open");
    played = true;
    // Drop the clip once the reveal finishes so nothing stays clipped if the
    // viewport changes afterwards.
    window.setTimeout(() => door.classList.remove("is-armed", "is-open"), 1400);
  };

  // Arm only after the first scroll, and only while the field is still below.
  const arm = () => {
    window.removeEventListener("scroll", arm);
    if (!canPlay() || !belowView()) return;

    armed = true;
    door.classList.add("is-armed");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // A tall field can never reach a large ratio in a short viewport, so
          // any meaningful intersection is enough to start the reveal.
          if (!entry.isIntersecting || entry.intersectionRatio < 0.08) return;
          observer.disconnect();
          if (!armed) return;
          armed = false;
          open();
        });
      },
      { threshold: [0.08, 0.2, 0.45] }
    );

    observer.observe(door);
  };

  window.addEventListener("scroll", arm, { once: true, passive: true });

  // If motion preferences change mid-page, restore the visible state.
  reduceMotion.addEventListener?.("change", () => {
    if (reduceMotion.matches) door.classList.remove("is-armed", "is-open");
  });
})();
