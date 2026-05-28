/* Theme toggle: persists user preference and respects system setting.
   Apply the inline init script BEFORE this module to avoid flash:
     <script>(()=>{const s=localStorage.getItem('theme');const m=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',s||m);})();</script>
*/
(function () {
  function bind() {
    const btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    const update = () => {
      const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      btn.setAttribute('aria-pressed', t === 'dark');
      btn.textContent = t === 'dark' ? '☀ Light' : '☾ Dark';
    };
    update();
    btn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      update();
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
