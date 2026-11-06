gsap.registerPlugin(ScrollTrigger);

const tl = gsap.timeline();

tl.from("#hero-title", {
  opacity: 0,
  y: 40,
  duration: 1,
  ease: "power4.out",
})
  .from(
    "#hero-subtitle",
    {
      opacity: 0,
      y: 20,
      duration: 0.8,
      ease: "power3.out",
    },
    "-=0.6",
  )
  .from(
    ".hero-cta",
    {
      opacity: 0,
      scale: 0.9,
      duration: 0.6,
      ease: "back.out(1.7)",
      stagger: 0.1,
    },
    "-=0.4",
  );

gsap.utils.toArray(".gsap-card").forEach((card) => {
  gsap.from(card, {
    scrollTrigger: {
      trigger: card,
      start: "top 85%",
      end: "top 50%",
      toggleActions: "play none none reverse",
    },
    opacity: 0,
    y: 60,
    scale: 0.95,
    duration: 0.8,
    ease: "power2.out",
  });
});

document.querySelector(
  "h1").
  addEventListener("click", () => {
    console.log("clicked");
  });
