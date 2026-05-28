/* Reading progress bar + per-course completion persistence.
   Looks for an element with class `progress-bar` and updates its width as the
   user scrolls. Stores a "visited" flag in localStorage keyed by data-course-id
   on the <html> or <body> element. */
(function () {
  function init() {
    const bar = document.querySelector('.progress-bar');
    const courseId =
      document.documentElement.dataset.courseId ||
      document.body.dataset.courseId;

    function onScroll() {
      if (!bar) return;
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const pct = total > 0 ? (h.scrollTop / total) * 100 : 0;
      bar.style.width = pct + '%';
      if (courseId && pct > 90) {
        try {
          const key = 'lwa:completed';
          const set = new Set(JSON.parse(localStorage.getItem(key) || '[]'));
          if (!set.has(courseId)) {
            set.add(courseId);
            localStorage.setItem(key, JSON.stringify([...set]));
          }
        } catch (_) { /* storage disabled */ }
      }
    }
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
