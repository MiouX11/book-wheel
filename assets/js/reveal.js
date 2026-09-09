// 滚动渐显：观察 .reveal 元素，进入视口时加 .in-view
window.Reveal = (function () {
  function init(root) {
    root = root || document;
    const els = Array.from(root.querySelectorAll(".reveal:not([data-reveal])"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in-view"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => {
      el.setAttribute("data-reveal", "1");
      io.observe(el);
    });
  }
  return { init };
})();
