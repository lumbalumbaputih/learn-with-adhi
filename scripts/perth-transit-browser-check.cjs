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
  assert.match(await k.locator('#count').innerText(), /^64 trains and 2 boats should be moving right now$/);
  assert.equal(await k.locator('.brand-sub').innerText(), 'From the timetable, not live', 'The kid-facing screen says the trains are not live');
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
  assert.match(card.now, /^(Next stop: .+, (any moment now|in about \d+ minutes?)|Stopped at .+\. People are getting on and off\.)$/);
  const voicePick = await k.evaluate(() => { // review fix: only on-device voices, never online ones
    if (!('speechSynthesis' in window)) return 'no speech';
    const real = speechSynthesis.getVoices;
    speechSynthesis.getVoices = () => [{ lang: 'en-AU', localService: false, name: 'Online AU' }, { lang: 'en-US', localService: true, name: 'Local US' }];
    const a = __kids.sound.localVoice()?.name;
    speechSynthesis.getVoices = () => [{ lang: 'en-AU', localService: false, name: 'Online AU' }];
    const b = __kids.sound.localVoice();
    speechSynthesis.getVoices = real;
    return [a, b];
  });
  if (voicePick !== 'no speech') assert.deepEqual(voicePick, ['Local US', null], 'Only on-device voices are used');
  await axeKids(k, 'phone map with train card');
  const finished = await k.evaluate(() => { const n = __kids.clock.now(); __kids.clock.setTime(n.ymd, n.sec + 3 * 3600); __kids.tick(true); return document.getElementById('card-now').textContent; });
  assert.equal(finished, 'This trip is finished. Tap another train!');
  await k.keyboard.press('Escape');
  assert.equal(await k.locator('#card').isHidden(), true, 'Escape closes the train card');
  // K1.3 settings: effects on and voice off by default, both kept in this browser
  assert.equal(await k.locator('#sound-btn').getAttribute('aria-pressed'), 'true');
  await k.locator('#sound-btn').click();
  assert.equal(await k.evaluate(() => localStorage.getItem('ptmKids')), '{"sound":false,"voice":false}');
  await k.getByRole('button', { name: 'For grown-ups' }).click();
  assert.match(await k.locator('#grownups').innerText(), /available free of charge from www\.transperth\.wa\.gov\.au/);
  assert.equal(await k.getByRole('checkbox', { name: 'Sound effects' }).isChecked(), false);
  await k.getByRole('checkbox', { name: 'Read station names aloud' }).check();
  assert.equal(await k.evaluate(() => localStorage.getItem('ptmKids')), '{"sound":false,"voice":true}');
  await axeKids(k, 'grown-ups dialog');
  await k.close();

  // K1.2 Hop on!: ride a train to the end, one station call per stop, then the next trains on offer
  const rideP = await open('?date=2026-10-19&t=08:00');
  await rideP.evaluate(() => {
    window.calls = []; window.played = [];
    new MutationObserver((recs) => { for (const r of recs) for (const n of r.addedNodes) if (n.data) calls.push(n.data); })
      .observe(document.getElementById('bubble'), { childList: true, subtree: true });
    const s = __kids.sound, play = s._play.bind(s); // K1.3: record the sounds that would play
    s._play = (n) => { played.push(n); play(n); };
  });
  await rideP.getByRole('radio', { name: 'Pause' }).click();
  const pick = await rideP.evaluate(() => {
    const { net, mapView } = __kids;
    const v = [...mapView.byId.values()].filter((x) => net.routes[x.route].long === 'Fremantle Line' && x.state === 'move').sort((a, b) => a.k - b.k)[0];
    __kids.select(v.id);
    return { id: v.id, left: net.patterns[v.pattern].stops.length - 2 - v.k };
  });
  const dest = (await rideP.locator('#card-dest').innerText()).replace(/^Going to /, '');
  await rideP.getByRole('button', { name: 'Hop on!' }).click();
  assert.equal(await rideP.evaluate(() => __kids.clock.speed), 10, 'Hop on starts a paused clock');
  await rideP.waitForFunction((id) => __kids.mapView.following === id, pick.id);
  await rideP.touchscreen.tap(30, 300);
  assert.equal(await rideP.evaluate(() => __kids.mapView.following), pick.id, 'A stray tap does not end the ride');
  await rideP.evaluate((id) => __kids.select(id), pick.id);
  assert.equal(await rideP.evaluate(() => [__kids.ride.id, __kids.mapView.following]).then(String), `${pick.id},${pick.id}`, 'Tapping your own train keeps the ride going');
  await rideP.evaluate(() => { // an hour in 20-second steps, as frames would go at Rocket speed
    for (let s = 0; s < 3600; s += 20) { const n = __kids.clock.now(); __kids.clock.setTime(n.ymd, n.sec + 20); __kids.tick(true); }
  });
  const calls = await rideP.evaluate(() => calls);
  assert.match(calls[0], /^All aboard! Next stop: /);
  assert.equal(calls.length - 2, pick.left, 'One station call per stop passed');
  assert.equal(calls[calls.length - 1], `You made it to ${dest}!`);
  await rideP.waitForTimeout(200);
  const played = await rideP.evaluate(() => played);
  assert.deepEqual([played[0], played[1], played[played.length - 1], played.filter((x) => x === 'chime').length], ['pop', 'whistle', 'yay', pick.left], 'Pop, whistle, a chime per station, then the fanfare');
  assert.equal(await rideP.getByRole('radio', { name: 'Pause' }).getAttribute('aria-checked'), 'true', 'Arrival pauses time');
  assert.ok((await rideP.locator('#next-list .next-train').count()) >= 1, 'Next trains are offered');
  await axeKids(rideP, 'arrival card with next trains');
  await rideP.locator('#next-list .next-train').first().focus();
  await rideP.keyboard.press('Enter');
  assert.match(await rideP.locator('#card-now').innerText(), new RegExp(`^Waiting at ${dest} for the train to `));
  assert.equal(await rideP.evaluate(() => document.activeElement.id), 'hop-off', 'Keyboard focus moves to Stop waiting');
  assert.equal(await rideP.evaluate(() => __kids.clock.speed), 10, 'Choosing the next train carries on at the earlier speed');
  // a missed train (the tablet slept while waiting) must not break the next train's card
  // (paused first: on a slow machine the running clock could bring the train in before the jump)
  await rideP.evaluate(() => { __kids.clock.setSpeed(0); const n = __kids.clock.now(); __kids.clock.setTime(n.ymd, n.sec + 2 * 3600); __kids.tick(true); });
  assert.equal(await rideP.locator('#card-now').innerText(), 'We missed that train. Pick another one!');
  await rideP.evaluate(() => { const v = [...__kids.mapView.byId.values()].find((x) => __kids.net.routes[x.route].isTrain && x.state === 'move'); __kids.select(v.id); });
  assert.doesNotMatch(await rideP.locator('#card-now').innerText(), /missed/, 'After a missed train, the next card is normal');
  assert.equal(await rideP.locator('#hop').isVisible(), true, 'and offers Hop on!');
  assert.equal(await rideP.locator('#next-trains').isHidden(), true, 'without the old station offers');
  await rideP.close();

  // review fixes: picking a train with the keyboard, and focus when a pressed button hides itself
  const kb = await open('?date=2026-10-19&t=08:00', { viewport: { width: 1280, height: 860 } });
  await kb.getByRole('radio', { name: 'Pause' }).click();
  await kb.evaluate(() => document.activeElement.blur());
  await kb.keyboard.press('Tab');
  await kb.keyboard.press('Tab');
  assert.equal(await kb.evaluate(() => document.activeElement.id), 'pick', 'Pick a train is the second tab stop');
  await kb.keyboard.press('Enter');
  await kb.waitForFunction(() => !document.getElementById('card').hidden);
  assert.equal(await kb.evaluate(() => document.activeElement.id), 'pick', 'Keyboard: a train can be picked without the map, and focus stays to pick again');
  assert.match(await kb.locator('#bubble').innerText(), /, going to /, 'The picked train is announced');
  const firstPick = await kb.evaluate(() => __kids.selected);
  await kb.keyboard.press('Enter');
  assert.notEqual(await kb.evaluate(() => __kids.selected), firstPick, 'Pressing again picks the next train');
  // a train in the round whose trip ends is skipped, not reported as "no trains"
  await kb.evaluate(() => { const n = __kids.clock.now(); __kids.clock.setTime(n.ymd, n.sec + 75 * 60); __kids.tick(true); });
  await kb.keyboard.press('Enter');
  assert.notEqual(await kb.evaluate(() => __kids.selected), null, 'Pick skips trains whose trip has ended');
  // after the view moves somewhere else, picking starts there
  await kb.evaluate(() => { __kids.mapView.map.jumpTo({ center: [115.75, -31.75], zoom: 12 }); __kids.tick(true); });
  await kb.keyboard.press('Enter');
  const near = await kb.evaluate(() => { const v = __kids.mapView.byId.get(__kids.selected); return Math.hypot(v.lon - 115.75, v.lat + 31.75); });
  assert.ok(near < 0.25, `Pick starts again near the new view (${near})`);
  await kb.evaluate(() => __kids.select([...__kids.mapView.byId.values()].find((x) => __kids.net.routes[x.route].isTrain && x.state === 'move').id));
  await kb.locator('#hop').focus();
  await kb.keyboard.press('Enter');
  await kb.waitForFunction(() => __kids.ride.id !== null);
  assert.equal(await kb.evaluate(() => document.activeElement.id), 'hop-off', 'Focus moves to Hop off when Hop on! hides itself');
  await kb.close();

  // review fix: the train with vehicle id 0 can be followed (ids are not truthy tests)
  const zero = await open('?date=2026-10-19&t=07:52', { ...phone, reducedMotion: 'reduce' });
  assert.ok(await zero.evaluate(() => { if (!__kids.mapView.byId.has(0)) return false; __kids.select(0); return true; }), 'Vehicle 0 runs at 7:52 on a Monday');
  await zero.getByRole('button', { name: 'Hop on!' }).click();
  await zero.evaluate(() => { for (let s = 0; s < 300; s += 20) { const n = __kids.clock.now(); __kids.clock.setTime(n.ymd, n.sec + 20); __kids.tick(true); } });
  const zgap = await zero.evaluate(() => { const v = __kids.mapView.byId.get(0), c = __kids.mapView.map.getCenter(); return Math.hypot(v.lon - c.lng, v.lat - c.lat); });
  assert.ok(zgap < 0.002, `The camera follows vehicle 0 (${zgap})`);
  await zero.close();

  // Layout across real phone browser sizes (toolbars showing), normal and pretend days, sideways phones and a tablet:
  // the card's key parts stay visible, the ridden train stays in clear view, nothing covers the map credit or the card head.
  const visibleIn = (el, box) => { const r = el.getBoundingClientRect(); return r.height > 0 && r.top >= box.top - 1 && r.bottom <= box.bottom + 1; };
  for (const [w, h, label] of [[320, 568, 'small phone'], [375, 548, 'iPhone SE in Safari'], [390, 664, 'phone in a browser'], [390, 844, 'tall phone'],
    [568, 320, 'small phone sideways'], [640, 360, 'phone sideways (small)'], [667, 375, 'phone sideways'], [844, 390, 'big phone sideways'], [834, 1112, 'tablet portrait']]) {
    for (const date of ['2026-10-19', '2027-03-01']) { // a normal day, and a pretend day (dock shows the pretend label)
      const tag = `${label} ${w}x${h}${date === '2027-03-01' ? ' pretend' : ''}`;
      const p = await open(`?date=${date}&t=08:00`, { viewport: { width: w, height: h }, isMobile: w < 820, hasTouch: true });
      await p.getByRole('radio', { name: 'Pause' }).click();
      await p.evaluate(() => { const v = [...__kids.mapView.byId.values()].filter((x) => __kids.net.routes[x.route].long === 'Fremantle Line' && x.state === 'move').sort((a, b) => a.k - b.k)[0]; __kids.select(v.id); });
      // before riding: the card's next-stop text, first strip stop and Hop on! are all visible
      const before = await p.evaluate((vis) => {
        const visibleIn = eval(vis), $ = (id) => document.getElementById(id), card = $('card').getBoundingClientRect();
        const box = { top: Math.max(card.top, 0), bottom: Math.min(card.bottom, innerHeight) };
        const dock = $('dock').getBoundingClientRect(), speeds = [...document.querySelectorAll('.speed')].map((b) => b.getBoundingClientRect());
        const credit = document.querySelector('.maplibregl-ctrl-attrib-button'), cr = credit && credit.getBoundingClientRect();
        const overlap = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
        const cl = $('card-close').getBoundingClientRect(), atClose = document.elementFromPoint(cl.left + cl.width / 2, cl.top + cl.height / 2);
        return { now: visibleIn($('card-now'), box), dot: visibleIn(document.querySelector('#strip-list li'), box), hop: visibleIn($('hop'), box),
          speedsFit: speeds.every((r) => r.left >= dock.left - 1 && r.right <= dock.right + 1 && r.right <= innerWidth),
          creditFree: !cr || !overlap(cr, card), closeHits: !!atClose && !!atClose.closest('#card-close') };
      }, visibleIn.toString());
      // under 360 px tall (568x320) the card is about 200 px: the strip is reached by scrolling the card
      assert.ok(before.now && (before.dot || h < 360) && before.hop, `${tag}: next stop, strip and Hop on! visible ${JSON.stringify(before)}`);
      assert.ok(before.speedsFit, `${tag}: the speed buttons fit in the dock`);
      assert.ok(before.creditFree, `${tag}: the card does not cover the map credit`);
      assert.ok(before.closeHits, `${tag}: the card's close button can be tapped`);
      // riding: the train is in clear view, Hop off is visible, and a long station call does not cover the card head
      await p.getByRole('button', { name: 'Hop on!' }).click();
      await p.getByRole('radio', { name: 'Pause' }).click();
      await p.waitForFunction(() => __kids.mapView.following !== null);
      assert.ok(await p.evaluate(() => __kids.mapView.map.getZoom()) >= 13, `${tag}: Hop on! zooms in to the train`);
      await p.evaluate(() => { const n = __kids.clock.now(); __kids.clock.setTime(n.ymd, n.sec + 240); __kids.tick(true); });
      await p.evaluate(() => { const b = document.getElementById('bubble'); b.textContent = 'All aboard! Next stop: Perth Underground'; b.classList.add('show'); dispatchEvent(new Event('resize')); });
      const geo = await p.evaluate((vis) => {
        const visibleIn = eval(vis), r = (el) => el.getBoundingClientRect(), $ = (id) => document.getElementById(id);
        const v = __kids.mapView.byId.get(__kids.mapView.following), pt = __kids.mapView.map.project([v.lon, v.lat]);
        const card = r($('card')), dock = r($('dock')), top = r(document.querySelector('.top')), head = r($('card-head')), bub = r($('bubble'));
        const overlap = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
        const M = 20, clear = (b) => pt.x < b.left - M || pt.x > b.right + M || pt.y < b.top - M || pt.y > b.bottom + M;
        return { pt: [Math.round(pt.x), Math.round(pt.y)], inView: pt.x > M && pt.x < innerWidth - M && pt.y > top.bottom + M && pt.y < innerHeight - M && clear(card) && clear(dock),
          bubbleOverHead: overlap(bub, head), bubbleInView: bub.top >= top.bottom - 1 && bub.right <= innerWidth && bub.left >= 0,
          off: visibleIn($('hop-off'), { top: Math.max(card.top, 0), bottom: Math.min(card.bottom, innerHeight) }) };
      }, visibleIn.toString());
      assert.ok(geo.inView, `${tag}: the train being ridden is in clear view ${geo.pt}`);
      assert.ok(geo.off, `${tag}: Hop off is visible`);
      assert.ok(!geo.bubbleOverHead, `${tag}: the station call does not cover the card's head`);
      assert.ok(geo.bubbleInView || (await p.evaluate(() => document.getElementById('bubble').classList.contains('tucked'))), `${tag}: the station call is on screen, below the top bar`);
      if (date === '2026-10-19') { // the end of the line: the next trains on offer can be seen and tapped
        await p.evaluate(() => { for (let s = 0; s < 3600; s += 20) { const n = __kids.clock.now(); __kids.clock.setTime(n.ymd, n.sec + 20); __kids.tick(true); } });
        await p.waitForTimeout(150);
        const arr = await p.evaluate(() => {
          const b = document.querySelector('#next-list .next-train'); if (!b) return { offer: false };
          const r = b.getBoundingClientRect(), at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          const strip = document.getElementById('strip'), tr = document.getElementById('strip-train').getBoundingClientRect(), sr = strip.getBoundingClientRect();
          return { offer: !!at && !!at.closest('.next-train'), stripOk: strip.offsetParent === null || (tr.left >= sr.left - 1 && tr.right <= sr.right + 1) };
        });
        assert.ok(arr.offer, `${tag}: on arrival the first next train can be tapped`);
        assert.ok(arr.stripOk, `${tag}: on arrival the strip shows the train at the end of the line`);
      }
      await p.close();
    }
  }
  console.log('Layout matrix passes (9 sizes x normal and pretend day).');

  // A drag during a ride keeps going while the card changes height (padding is never applied as a separate camera jump)
  const drag = await open('?date=2026-10-19&t=08:00', { viewport: { width: 390, height: 664 } });
  await drag.getByRole('radio', { name: 'Pause' }).click();
  await drag.evaluate(() => { const v = [...__kids.mapView.byId.values()].filter((x) => __kids.net.routes[x.route].long === 'Fremantle Line' && x.state === 'move').sort((a, b) => a.k - b.k)[0]; __kids.select(v.id); });
  await drag.getByRole('button', { name: 'Hop on!' }).click();
  await drag.getByRole('radio', { name: 'Pause' }).click();
  await drag.waitForFunction(() => __kids.mapView.following !== null);
  const start = await drag.evaluate(() => { const top = document.querySelector('.top').getBoundingClientRect().bottom, card = document.getElementById('card').getBoundingClientRect(); return { x: 195, y: Math.round((top + card.top) / 2) }; });
  await drag.mouse.move(start.x, start.y);
  await drag.mouse.down();
  for (let i = 1; i <= 4; i++) await drag.mouse.move(start.x + i * 10, start.y + i * 4);
  const mid = await drag.evaluate(async () => { // make the card change height mid-drag, as a station call does
    document.getElementById('card-now').textContent = 'Stopped at a station with a very long name. People are getting on and off, and on and off.';
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const c = __kids.mapView.map.getCenter(); return [c.lng, c.lat];
  });
  for (let i = 5; i <= 9; i++) await drag.mouse.move(start.x + i * 10, start.y + i * 4);
  await drag.mouse.up();
  const end = await drag.evaluate(() => { const c = __kids.mapView.map.getCenter(); return [c.lng, c.lat]; });
  assert.ok(Math.hypot(end[0] - mid[0], end[1] - mid[1]) > 1e-4, 'A drag keeps moving the map after the card changes height');
  await drag.close();

  // Fourth review round: rotating a paused ride, the arrival card's status line, and where station calls show
  const pickLine = (p, line, dest) => p.evaluate(([line, src]) => { // the train furthest from the end of its trip, going to dest
    const re = new RegExp(src);
    const vs = [...__kids.mapView.byId.values()].filter((x) => __kids.net.routes[x.route].long === line && x.state === 'move').sort((a, b) => a.k - b.k);
    for (const v of vs) { __kids.select(v.id); if (re.test(document.getElementById('card-dest').textContent)) return v.id; }
    return null;
  }, [line, dest.source]);
  const seen = (p, sel) => p.evaluate((sel) => { // on screen and not covered (by the pinned buttons, or scrolled out of the card)
    const el = document.querySelector(sel), r = el.getBoundingClientRect();
    const at = r.height > 0 && document.elementFromPoint(r.left + Math.min(24, r.width / 2), r.top + r.height / 2);
    return !!at && el.contains(at);
  }, sel);
  const trainClear = (p) => p.evaluate(() => {
    const v = __kids.mapView.byId.get(__kids.ride.id), pt = __kids.mapView.map.project([v.lon, v.lat]), r = (id) => document.getElementById(id).getBoundingClientRect();
    const top = document.querySelector('.top').getBoundingClientRect().bottom, M = 10;
    const clear = (b) => pt.x < b.left - M || pt.x > b.right + M || pt.y < b.top - M || pt.y > b.bottom + M;
    return { pt: [Math.round(pt.x), Math.round(pt.y)], ok: pt.x > M && pt.x < innerWidth - M && pt.y > top + M && pt.y < innerHeight - M && clear(r('card')) && clear(r('dock')) };
  });
  const toEnd = (p) => p.evaluate(() => { for (let s = 0; s < 7200 && !__kids.ride.done; s += 20) { const n = __kids.clock.now(); __kids.clock.setTime(n.ymd, n.sec + 20); __kids.tick(true); } return __kids.ride.done; });
  // a paused ride (and every reduced-motion ride) keeps its train in view when the phone is turned: no tick is called here
  for (const [from, to, rm] of [[[390, 844], [844, 390]], [[844, 390], [390, 844]], [[375, 667], [667, 375]], [[390, 844], [844, 390], true]]) {
    const tag = `paused ride turned ${from.join('x')} to ${to.join('x')}${rm ? ' (reduced motion)' : ''}`;
    const p = await open('?date=2026-10-19&t=08:00', { viewport: { width: from[0], height: from[1] }, isMobile: true, hasTouch: true, ...(rm ? { reducedMotion: 'reduce' } : {}) });
    if (!rm) await p.getByRole('radio', { name: 'Pause' }).click();
    assert.ok((await pickLine(p, 'Fremantle Line', /./)) !== null, `${tag}: a Fremantle Line train`);
    await p.getByRole('button', { name: 'Hop on!' }).click();
    await p.waitForFunction(() => __kids.mapView.following !== null);
    if (!rm) await p.getByRole('radio', { name: 'Pause' }).click();
    assert.equal(await p.evaluate(() => __kids.clock.speed), 0, `${tag}: paused`);
    await p.setViewportSize({ width: to[0], height: to[1] });
    await p.waitForTimeout(600);
    const t = await trainClear(p);
    assert.ok(t.ok, `${tag}: the train stays in clear view ${t.pt}`);
    await p.close();
  }
  // arrival and a missed train on short portrait phones: the status line stays on screen and the first next train can be tapped
  for (const [w, h] of [[320, 568], [375, 548], [360, 600], [412, 600]]) {
    for (const [line, dest] of [['Fremantle Line', /Perth$/], ['Fremantle Line', /Fremantle$/], ['Midland Line', /Perth$/]]) {
      const tag = `${w}x${h} ${line} to ${dest.source.replace('$', '')}`;
      const p = await open('?date=2026-10-19&t=08:00', { viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
      await p.getByRole('radio', { name: 'Pause' }).click();
      assert.ok((await pickLine(p, line, dest)) !== null, `${tag}: a train`);
      await p.getByRole('button', { name: 'Hop on!' }).click();
      assert.ok(await toEnd(p), `${tag}: the ride ends`);
      await p.waitForTimeout(150);
      assert.match(await p.locator('#card-now').innerText(), /^You made it to /);
      assert.ok(await seen(p, '#card-now'), `${tag}: "You made it" stays on screen`);
      assert.ok(await seen(p, '#next-list .next-train'), `${tag}: the first next train can be tapped`);
      if (line === 'Fremantle Line' && /Perth/.test(dest.source)) { // then wait for a train and miss it
        await p.locator('#next-list .next-train').first().click();
        await p.evaluate(() => { const n = __kids.clock.now(); __kids.clock.setTime(n.ymd, n.sec + 2 * 3600); __kids.tick(true); });
        await p.waitForTimeout(150);
        assert.match(await p.locator('#card-now').innerText(), /^We missed that/);
        assert.ok(await seen(p, '#card-now'), `${tag}: "We missed that train" stays on screen`);
        assert.ok(await seen(p, '#next-list .next-train'), `${tag}: after a miss, the first next train can be tapped`);
      }
      await p.close();
    }
  }
  // a stacked sideways phone too narrow for the side layout: the card is too short to show its status line, so calls float
  for (const [w, h] of [[480, 320], [534, 320], [540, 360]]) {
    const p = await open('?date=2026-10-19&t=08:00', { viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
    await p.getByRole('radio', { name: 'Pause' }).click();
    await pickLine(p, 'Fremantle Line', /./);
    await p.getByRole('button', { name: 'Hop on!' }).click();
    await p.waitForFunction(() => __kids.mapView.following !== null);
    await p.getByRole('radio', { name: 'Pause' }).click();
    const call = await p.evaluate(() => { // step on to the next station call
      const b = document.getElementById('bubble'), first = b.textContent;
      for (let s = 0; s < 1800 && b.textContent === first; s += 10) { const n = __kids.clock.now(); __kids.clock.setTime(n.ymd, n.sec + 10); __kids.tick(true); }
      const r = b.getBoundingClientRect(), top = document.querySelector('.top').getBoundingClientRect().bottom;
      return { text: b.textContent, tucked: b.classList.contains('tucked'), inView: r.width > 40 && r.top >= top - 1 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth };
    });
    assert.match(call.text, /!$/, `${w}x${h}: a station call`);
    assert.ok(!call.tucked && call.inView, `${w}x${h}: the station call can be seen ${JSON.stringify(call)}`);
    await p.close();
  }
  // a message that is not about the card ("No trains here") floats even with a card open, and does not light up the card
  for (const [w, h] of [[768, 1024], [390, 844]]) {
    const p = await open('?date=2026-10-19&t=08:00', { viewport: { width: w, height: h } });
    await p.getByRole('radio', { name: 'Pause' }).click();
    await p.locator('#pick').focus();
    await p.keyboard.press('Enter');
    await p.waitForFunction(() => !document.getElementById('card').hidden);
    await p.waitForTimeout(1700); // past the status line's light-up time, if any
    await p.evaluate(() => { __kids.mapView.map.jumpTo({ center: [115.45, -31.95], zoom: 13 }); __kids.tick(true); }); // out at sea
    await p.keyboard.press('Enter');
    const msg = await p.evaluate(() => {
      const b = document.getElementById('bubble'), r = b.getBoundingClientRect(), top = document.querySelector('.top').getBoundingClientRect().bottom;
      return { text: b.textContent, tucked: b.classList.contains('tucked'), inView: r.width > 40 && r.top >= top - 1 && r.bottom <= innerHeight, flash: document.getElementById('card-now').classList.contains('flash') };
    });
    assert.equal(msg.text, 'No trains here right now. Try zooming out.');
    assert.ok(!msg.tucked && msg.inView && !msg.flash, `${w}x${h}: "No trains here" is shown, the card is not lit up ${JSON.stringify(msg)}`);
    await p.close();
  }
  // the status line's light-up is not replayed by a card opened later; with reduced motion it is a still colour
  for (const rm of [false, true]) {
    const p = await open('?date=2026-10-19&t=08:00', { ...phone, ...(rm ? { reducedMotion: 'reduce' } : {}) });
    if (!rm) await p.getByRole('radio', { name: 'Pause' }).click();
    const id = await pickLine(p, 'Fremantle Line', /./);
    await p.getByRole('button', { name: 'Hop on!' }).click();
    const lit = await p.evaluate(() => { const s = document.getElementById('card-now'); return [s.classList.contains('flash'), getComputedStyle(s).backgroundColor]; });
    assert.ok(lit[0] && lit[1] !== 'rgba(0, 0, 0, 0)', `All aboard lights up the status line${rm ? ' (reduced motion: a still colour)' : ''} ${lit}`);
    await p.locator('#hop-off').click();
    await p.evaluate(() => __kids.select(null));
    await p.waitForTimeout(1800);
    await p.evaluate((id) => __kids.select([...__kids.mapView.byId.values()].find((x) => __kids.net.routes[x.route].isTrain && x.id !== id).id), id);
    const again = await p.evaluate(() => { const s = document.getElementById('card-now'); return [s.classList.contains('flash'), s.getAnimations().length]; });
    assert.deepEqual(again, [false, 0], `A card opened later does not light up again${rm ? ' (reduced motion)' : ''}`);
    await p.close();
  }
  console.log('Fourth review round checks pass.');

  // Fifth round: a next train's card starts at its header (the arrival card was scrolled to its offers) on sideways phones
  for (const [w, h] of [[568, 320], [640, 360], [740, 360]]) {
    const p = await open('?date=2026-10-19&t=08:00', { viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
    await p.getByRole('radio', { name: 'Pause' }).click();
    await pickLine(p, 'Fremantle Line', /Perth$/);
    await p.getByRole('button', { name: 'Hop on!' }).click();
    assert.ok(await toEnd(p), `${w}x${h}: the ride ends`);
    await p.waitForTimeout(150);
    await p.locator('#next-list .next-train').first().click();
    const waitTop = await p.evaluate(() => document.getElementById('card').scrollTop);
    assert.equal(waitTop, 0, `${w}x${h}: the waiting card starts at its header`);
    assert.ok(await seen(p, '#card-close'), `${w}x${h}: the waiting card's close button can be tapped`);
    assert.ok(await p.evaluate(() => { for (let s = 0; s < 3600 && __kids.ride.id === null; s += 10) { const n = __kids.clock.now(); __kids.clock.setTime(n.ymd, n.sec + 10); __kids.tick(true); } return __kids.ride.id !== null; }), `${w}x${h}: boards the next train`);
    assert.ok(await seen(p, '#card-close'), `${w}x${h}: riding the next train, its close button can be tapped`);
    await p.close();
  }
  // Fifth round: hopping on a train standing at a station, "All aboard! Next stop: ..." is shown (the card says "Stopped at ...")
  for (const [w, h] of [[375, 667], [390, 844]]) {
    const p = await open('?date=2026-10-19&t=08:00', { viewport: { width: w, height: h }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    assert.ok(await p.evaluate(() => { const v = [...__kids.mapView.byId.values()].find((x) => __kids.net.routes[x.route].isTrain && x.state === 'dwell' && x.k > 0); if (!v) return false; __kids.select(v.id); return true; }), `${w}x${h}: a train standing at a station`);
    await p.getByRole('button', { name: 'Hop on!' }).click();
    const aboard = await p.evaluate(() => {
      const b = document.getElementById('bubble'), r = b.getBoundingClientRect(), top = document.querySelector('.top').getBoundingClientRect().bottom;
      return { text: b.textContent, status: document.getElementById('card-now').textContent, tucked: b.classList.contains('tucked'), inView: r.width > 40 && r.top >= top - 1 && r.bottom <= innerHeight };
    });
    assert.match(aboard.status, /^Stopped at /);
    assert.ok(/^All aboard! Next stop: /.test(aboard.text) && !aboard.tucked && aboard.inView, `${w}x${h}: the All aboard call can be seen ${JSON.stringify(aboard)}`);
    await p.close();
  }
  console.log('Fifth review round checks pass.');

  const pretend = await open('?date=2027-03-01&t=08:00');
  assert.equal(await pretend.locator('#pretend').innerText(), 'Pretend day');
  assert.match(await pretend.locator('#clock').innerText(), /^Monday /);
  assert.ok(await pretend.evaluate(() => __kids.net.covers(__kids.clock.now().ymd)), 'Pretend day is inside the timetable');
  assert.ok(await pretend.evaluate(() => document.getElementById('dock').contains(document.getElementById('pretend'))), 'The pretend label sits in the dock, clear of the map credit');
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
  // review fix: the arrival pause gives back the speed the viewer chose, with reduced motion too
  await reduced.getByRole('radio', { name: /^Fast/ }).click();
  await reduced.evaluate(() => { const v = [...__kids.mapView.byId.values()].filter((x) => __kids.net.routes[x.route].long === 'Fremantle Line' && x.state === 'move').sort((a, b) => a.k - b.k)[0]; __kids.select(v.id); });
  await reduced.getByRole('button', { name: 'Hop on!' }).click();
  await reduced.evaluate(() => { for (let s = 0; s < 3600; s += 20) { const n = __kids.clock.now(); __kids.clock.setTime(n.ymd, n.sec + 20); __kids.tick(true); } });
  assert.equal(await reduced.getByRole('radio', { name: 'Pause' }).getAttribute('aria-checked'), 'true', 'Arrival pauses time');
  await reduced.locator('#next-list .next-train').first().click();
  assert.equal(await reduced.evaluate(() => __kids.clock.speed), 10, 'With reduced motion too, the next train carries on at the chosen speed');
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
