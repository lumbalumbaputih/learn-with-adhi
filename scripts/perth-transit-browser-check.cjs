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
    assert.equal(await page.getByRole('link', { name: 'Kids' }).getAttribute('href'), 'kids.html');
    await checkKids(browser, errors);
    assert.deepEqual(errors, []);
    console.log('Keyboard, pause/time, progressive basemap, viewport culling, reduced motion and mobile checks pass.');
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exitCode = 1; });

// ---------------------------------------------------------------- Perth Train Spotter (kids.html)
async function checkKids(browser, errors) {
  const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
  const open = async (q, opts = phone) => {
    const p = await browser.newPage(opts);
    p.on('pageerror', (e) => errors.push(e.message));
    await p.route('https://tiles.openfreemap.org/styles/*', (route) => route.fulfill({ json: plainStyle }));
    await p.goto(`${origin}/perth-transit/kids.html${q}`);
    await p.waitForFunction(() => !!window.__kids && document.getElementById('loading').hidden);
    return p;
  };
  // headless rendering is slow: wait for the map to draw before querying or tapping what is on it
  const idle = (p) => p.evaluate(() => new Promise((r) => __kids.mapView.map.once('idle', r)));
  const axeKids = async (p, label) => {
    await p.addScriptTag({ path: axePath });
    const result = await p.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } }));
    assert.deepEqual(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), [], label);
    console.log('axe passes: kids', label);
  };

  const k = await open('?date=2026-10-19&t=08:00');
  assert.equal(await k.evaluate(() => __kids.clock.speed), 10, 'Kids page starts at 10x');
  await k.getByRole('radio', { name: 'Pause' }).click();
  await idle(k);
  const types = await k.evaluate(async () => (await __kids.mapView.map.getSource('veh').getData()).features.map((f) => f.properties.t));
  assert.ok(types.length > 10 && types.every((t) => t === 1 || t === 2), 'Trains and the ferry only');
  assert.match(await k.locator('#count').innerText(), /^64 trains and 2 boats are moving right now$/);
  assert.equal(await k.locator('#pretend').isHidden(), true);
  await k.getByRole('radio', { name: /^Rocket/ }).click();
  assert.equal(await k.evaluate(() => __kids.clock.speed), 60);
  await k.keyboard.press('ArrowLeft');
  assert.equal(await k.evaluate(() => [__kids.clock.speed, document.activeElement.dataset.speed]).then(String), '10,10');
  await k.getByRole('radio', { name: 'Pause' }).click();
  await idle(k);
  const target = await k.evaluate(() => {
    const m = __kids.mapView.map;
    for (const v of __kids.mapView.byId.values()) {
      if (!__kids.net.routes[v.route].isTrain) continue;
      const p = m.project([v.lon, v.lat]);
      if (p.x > 60 && p.x < 330 && p.y > 160 && p.y < 560) return { x: p.x, y: p.y };
    }
    return null;
  });
  await k.touchscreen.tap(target.x + 10, target.y + 8);
  await k.waitForFunction(() => __kids.selected !== null && !document.getElementById('card').hidden);
  // K1.1 train card: line name, destination without platform words, one strip dot per stop, the next stop marked
  const card = await k.evaluate(() => {
    const v = __kids.mapView.byId.get(__kids.selected), $ = (id) => document.getElementById(id);
    return { title: $('card-title').textContent, line: __kids.net.routes[v.route].isFerry ? 'The ferry' : __kids.net.routes[v.route].long, dest: $('card-dest').textContent, now: $('card-now').textContent,
      dots: document.querySelectorAll('#strip-list li').length, stops: __kids.net.patterns[v.pattern].stops.length };
  });
  assert.equal(card.title, card.line);
  assert.match(card.dest, /^Going to [A-Z]/);
  assert.doesNotMatch(card.dest, /Platform|Stn/);
  assert.equal(card.dots, card.stops);
  assert.match(card.now, /^(Next stop: .+, (arriving now|in about \d+ minutes?)|Stopped at .+\. People are getting on and off\.)$/);
  await axeKids(k, 'phone map with train card');
  const finished = await k.evaluate(() => { const n = __kids.clock.now(); __kids.clock.setTime(n.ymd, n.sec + 3 * 3600); __kids.tick(true); return document.getElementById('card-now').textContent; });
  assert.equal(finished, 'This trip is finished. Tap another train!');
  await k.keyboard.press('Escape');
  assert.equal(await k.locator('#card').isHidden(), true, 'Escape closes the train card');
  await k.getByRole('button', { name: 'For grown-ups' }).click();
  assert.match(await k.locator('#grownups').innerText(), /available free of charge from www\.transperth\.wa\.gov\.au/);
  await axeKids(k, 'grown-ups dialog');
  await k.close();

  const pretend = await open('?date=2027-03-01&t=08:00');
  assert.equal(await pretend.locator('#pretend').innerText(), 'Pretend day: a normal Monday');
  assert.ok(await pretend.evaluate(() => __kids.net.covers(__kids.clock.now().ymd)), 'Pretend day is inside the timetable');
  await pretend.close();

  const night = await open('?date=2026-10-20&t=02:30');
  await night.getByRole('radio', { name: 'Pause' }).click();
  assert.match(await night.locator('#count').innerText(), /asleep/);
  await night.getByRole('button', { name: 'Wake up the trains' }).click();
  await night.getByRole('radio', { name: 'Pause' }).click();
  const woke = await night.evaluate(() => __kids.clock.now().sec);
  assert.ok(woke >= 4 * 3600 && woke <= 4.6 * 3600, `Wakes at the first train (${woke})`);
  await night.close();

  const reduced = await open('?date=2026-10-19&t=08:00', { ...phone, reducedMotion: 'reduce' });
  assert.equal(await reduced.getByRole('radio', { name: 'Pause' }).getAttribute('aria-checked'), 'true', 'Reduced motion starts paused');
  await reduced.close();

  const small = await open('?date=2026-10-19&t=08:00', { ...phone, viewport: { width: 320, height: 640 } });
  assert.equal(await small.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Kids page has no horizontal overflow at 320px');
  assert.ok(await small.evaluate(() => {
    const b = document.querySelector('.brand').getBoundingClientRect(), a = document.querySelector('.top-actions').getBoundingClientRect();
    return b.right <= a.left && a.right <= 320 && [...document.querySelectorAll('.speed')].every((s) => s.getBoundingClientRect().right <= 320);
  }), 'Kids header and speed buttons fit at 320px');
  await small.close();

  const dark = await open('?date=2026-10-19&t=08:00', { viewport: { width: 1280, height: 860 }, colorScheme: 'dark' });
  await axeKids(dark, 'desktop dark');
  await dark.close();
  console.log('Perth Train Spotter checks pass.');
}
