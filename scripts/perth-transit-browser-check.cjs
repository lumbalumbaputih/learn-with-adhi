// Serve the repo on localhost:8099, then run with Playwright and axe-core installed.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const axePath = process.env.PERTH_AXE_PATH || require.resolve('axe-core/axe.min.js');
const origin = process.env.PERTH_TEST_ORIGIN || 'http://127.0.0.1:8099';
const plainStyle = { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#eef1f2' } }] };

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', (e) => errors.push(e.message));
    let releaseStyle;
    const gate = new Promise((resolve) => { releaseStyle = resolve; });
    await page.route('https://tiles.openfreemap.org/styles/*', async (route) => {
      await gate;
      await route.fulfill({ json: plainStyle });
    });
    await page.goto(`${origin}/perth-transit/?date=2026-10-19&t=08:00`);
    await page.waitForFunction(() => !!window.__app);
    assert.equal(await page.evaluate(() => __app.mapView.basemapOk), false, 'Timetable works while external basemap is pending');
    console.log('Timetable ready without basemap:', Math.round(await page.evaluate(() => performance.now())), 'ms');
    releaseStyle();
    await page.waitForFunction(() => __app.mapView.basemapOk && !!__app.mapView.map.getSource('veh'));
    await page.getByLabel('Simulation speed', { exact: true }).selectOption('60');
    await page.getByLabel('Simulation speed', { exact: true }).selectOption('0');
    await page.getByRole('button', { name: 'Resume animation' }).click();
    assert.equal(await page.evaluate(() => __app.clock.speed), 60, 'Play restores the speed from before pausing');
    await page.getByRole('button', { name: 'Pause animation', exact: true }).click();
    const paused = await page.evaluate(() => __app.clock.now().sec);
    await page.evaluate(() => {
      const original = __app.net.vehicles.bind(__app.net);
      window.engineCalls = 0;
      __app.net.vehicles = (...args) => { engineCalls++; return original(...args); };
    });
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => __app.clock.now().sec), paused);
    assert.equal(await page.evaluate(() => engineCalls), 0, 'Paused playback does no repeated vehicle work');
    await page.getByRole('button', { name: 'Resume animation' }).click();
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
      engineCalls = 0;
      __app.tick(true);
    });
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => engineCalls), 0, 'Hidden page does no vehicle work');
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await page.getByRole('button', { name: 'Pause animation', exact: true }).click();
    await page.getByLabel('Simulation time', { exact: true }).fill('10:35');
    await page.getByLabel('Simulation time', { exact: true }).press('Tab');
    assert.equal(await page.evaluate(() => __app.clock.now().sec), 38100);
    await page.getByRole('tab', { name: 'Routes', exact: true }).click();
    const all = page.getByRole('radiogroup', { name: 'Filter routes' }).getByRole('radio', { name: 'All', exact: true });
    await all.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Trains');
    assert.equal(await page.getByRole('radio', { name: 'Trains', exact: true }).getAttribute('aria-checked'), 'true');
    await page.getByRole('searchbox').fill('950');
    await page.waitForFunction(() => document.getElementById('search-status').textContent.includes('950'));
    await page.locator('#content .row').first().click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'content');
    await page.addScriptTag({ path: axePath });
    async function checkAxe(label) {
      const result = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } }));
      assert.deepEqual(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), [], label);
      console.log('axe passes:', label);
    }
    await checkAxe('desktop route detail');
    await page.getByText('Hourly timetable counts', { exact: true }).click();
    assert.ok(await page.getByRole('table').isVisible(), 'Chart counts have a readable table alternative');
    await checkAxe('expanded hourly counts');
    // Culling changes rendered work, never the complete timetable/vehicle lookup.
    const culling = await page.evaluate(async () => {
      const { mapView, clock, tick } = __app;
      mapView.map.jumpTo({ center: [115.86, -31.95], zoom: 15.4 });
      clock.setSpeed(1); tick(true);
      const data = await mapView.map.getSource('veh').getData();
      const stats = { total: mapView.byId.size, rendered: data.features.length };
      clock.setSpeed(0); tick(true);
      return stats;
    });
    assert.ok(culling.rendered > 0 && culling.rendered < culling.total / 2);
    console.log('Viewport culling:', culling);
    await page.getByRole('button', { name: 'Switch to the dark map' }).click();
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark' && !!__app.mapView.map.getSource('veh'));
    await checkAxe('dark route detail');
    await page.getByRole('tab', { name: 'Map', exact: true }).click();
    await checkAxe('map summary');
    await page.evaluate(() => __app.panel.openEntity({ kind: 'station', idx: 0 }));
    await checkAxe('station departures');
    await page.getByRole('button', { name: 'About this map' }).click();
    await checkAxe('about dialog');
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 320, height: 740 });
    await page.evaluate(() => __app.sheet.set('peek'));
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No horizontal page overflow');
    assert.ok(await page.getByRole('button', { name: 'Resume animation' }).isVisible());
    assert.ok(await page.getByLabel('Simulation time', { exact: true }).isVisible());
    await checkAxe('320px phone');
    await page.evaluate(() => document.querySelector('.skip-link').click());
    assert.equal(await page.evaluate(() => __app.sheet.state), 'full');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'content');
    await page.evaluate(() => document.querySelector('.skip-time').click());
    assert.equal(await page.evaluate(() => __app.sheet.state), 'peek');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'scrubber');

    const reduced = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    reduced.on('pageerror', (e) => errors.push(e.message));
    await reduced.route('https://tiles.openfreemap.org/styles/*', (route) => route.fulfill({ json: plainStyle }));
    await reduced.goto(`${origin}/perth-transit/?date=2026-10-19&t=08:00&speed=60`);
    await reduced.waitForFunction(() => !!window.__app);
    assert.equal(await reduced.evaluate(() => __app.clock.speed), 0, 'Reduced motion starts paused');
    await reduced.getByRole('button', { name: 'Resume animation' }).click();
    assert.equal(await reduced.evaluate(() => __app.clock.speed), 1);
    await reduced.getByRole('button', { name: 'Pause animation', exact: true }).click();
    const rects = await reduced.locator('.scrub-actions').evaluate((e) => [...e.children].map((c) => ({ left: c.getBoundingClientRect().left, right: c.getBoundingClientRect().right })));
    assert.ok(rects.every((r) => r.left >= 0 && r.right <= 390), 'All touch playback controls fit');
    await reduced.screenshot({ path: '/tmp/perth-motion-mobile.png' });
    // Existing kids-site service workers may hold the previous, unversioned modules.
    // A new release must never execute a mixture of old and new UI code.
    await page.evaluate(async () => {
      await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const cache = await caches.open('perth-old-module-test');
      for (const name of ['app', 'clock', 'colors', 'mapview', 'panel', 'scrubber', 'sim', 'util']) {
        await cache.put(`/perth-transit/${name}.js`, new Response('throw new Error("Stale module executed")', {
          headers: { 'Content-Type': 'text/javascript' },
        }));
      }
    });
    await page.reload();
    await page.waitForFunction(() => !!window.__app);
    assert.equal(await page.evaluate(() => document.getElementById('loading').hidden), true);
    console.log('Warm load with stale unversioned service-worker modules passes.');
    assert.deepEqual(errors, []);
    console.log('Keyboard, pause/time, progressive basemap, viewport culling, reduced motion and mobile checks pass.');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });
