/* Renders the breadcrumb and prev/next pager on a course page using
   assets/courses.json as the source of truth.

   Page contract:
     <html data-course-id="ai-bridging-gap"> (or <body>)
     <nav class="breadcrumb" data-course-breadcrumb></nav>
     <nav class="course-pager" data-course-pager></nav>
*/
(function () {
  async function loadManifest() {
    try {
      const res = await fetch('/assets/courses.json', { cache: 'no-cache' });
      if (!res.ok) return null;
      return await res.json();
    } catch (_) {
      return null;
    }
  }

  function renderBreadcrumb(el, course) {
    if (!el || !course) return;
    el.innerHTML =
      '<a href="/index.html">Hub</a>' +
      '<span aria-hidden="true">/</span>' +
      '<a href="/index.html#courses">' + course.category + '</a>' +
      '<span aria-hidden="true">/</span>' +
      '<span>' + course.title + '</span>';
  }

  function renderPager(el, manifest, course) {
    if (!el || !course || !manifest) return;
    const peers = manifest.filter((c) => c.category === course.category);
    const i = peers.findIndex((c) => c.id === course.id);
    const prev = i > 0 ? peers[i - 1] : null;
    const next = i < peers.length - 1 ? peers[i + 1] : null;

    if (!prev && !next) { el.style.display = 'none'; return; }

    function card(item, label, side) {
      if (!item) return '';
      return (
        '<a class="pager-' + side + '" href="/' + item.path + '">' +
        '<div class="pager-label">' + label + '</div>' +
        '<div class="pager-title">' + item.title + '</div></a>'
      );
    }

    if (!prev || !next) el.style.gridTemplateColumns = '1fr';
    el.innerHTML = card(prev, '← Previous', 'prev') + card(next, 'Next →', 'next');
  }

  async function init() {
    const id =
      document.documentElement.dataset.courseId ||
      document.body.dataset.courseId;
    if (!id) return;
    const manifest = await loadManifest();
    if (!manifest) return;
    const course = manifest.find((c) => c.id === id);
    if (!course) return;
    renderBreadcrumb(document.querySelector('[data-course-breadcrumb]'), course);
    renderPager(document.querySelector('[data-course-pager]'), manifest, course);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
