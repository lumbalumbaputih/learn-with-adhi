/* Reading progress + per-course completion persistence (plan-v4 A2).
   - Optional scroll bar: an element with [data-scroll-progress] gets its
     width driven to the scroll percentage. Opt-in by design — most courses
     have their own module-driven progress bars that must not be hijacked.
   - Completion: when <html> or <body> carries data-course-id and the page
     has been scrolled past 90%, the id is added to localStorage
     `lwa:completed`, which feeds the "✓ Read" pill and the "finished on
     this device" count on the index hub. Ids must match assets/courses.json. */
(function () {
  function init() {
    const bar = document.querySelector('[data-scroll-progress]');
    const courseId =
      document.documentElement.dataset.courseId ||
      document.body.dataset.courseId;
    if (!bar && !courseId) return;

    let done = false;
    function onScroll() {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const pct = total > 0 ? (h.scrollTop / total) * 100 : 0;
      if (bar) bar.style.width = pct + '%';
      if (courseId && !done && pct > 90) {
        done = true;
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
