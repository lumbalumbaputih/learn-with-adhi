// Uses the same Playwright/axe setup and local server as perth-transit-browser-check.cjs.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const axePath = process.env.PERTH_AXE_PATH || require.resolve('axe-core/axe.min.js');
const origin = process.env.PERTH_TEST_ORIGIN || 'http://127.0.0.1:8099';
const key = 'ptm-favourite-places-v1';
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 900 }, geolocation: { latitude: -32.01, longitude: 115.9 }, permissions: ['geolocation'] });
    await context.route('https://tiles.openfreemap.org/styles/*', (r) => r.fulfill({ json: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background' }] } }));
    const page = await context.newPage(), errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${origin}/perth-transit/?date=2026-10-19&t=08:00&speed=0`);
    await page.waitForFunction(() => !!window.__app);
    const read = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k)).places, key);
    const save = () => page.getByRole('button', { name: 'Save place', exact: true }).click();
    async function audit(label) {
      await page.addScriptTag({ path: axePath });
      const result = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } }));
      assert.deepEqual(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), [], label);
      console.log('axe passes:', label);
    }
    const centre = await page.evaluate(() => __app.mapView.view());
    await page.getByRole('button', { name: 'Save Home', exact: true }).click();
    assert.equal(await page.getByLabel('Place name', { exact: true }).inputValue(), 'Home');
    await audit('add-place dialog');
    await save();
    assert.deepEqual((await read()).map(({ name, lat, lon }) => ({ name, lat, lon })), [{ name: 'Home', lat: centre.lat, lon: centre.lon }]);
    await page.reload(); await page.waitForFunction(() => !!window.__app);
    await page.getByRole('button', { name: 'Show stops near Home', exact: true }).click();
    await page.getByRole('heading', { name: 'Stops near Home', exact: true }).waitFor();
    assert.ok(await page.locator('.near .row').count());
    await page.evaluate(() => __app.mapView.map.jumpTo({ center: [115.99, -31.8] }));
    await page.getByRole('button', { name: 'Edit Home', exact: true }).click();
    await page.getByLabel('Place name', { exact: true }).fill('My home'); await save();
    const home = (await read())[0];
    assert.equal(home.name, 'My home'); assert.equal(home.lat, centre.lat); assert.equal(home.lon, centre.lon);
    await page.getByRole('heading', { name: 'Stops near My home', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Save Work', exact: true }).click();
    await page.getByLabel('Location to save', { exact: true }).selectOption('current'); await save();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.deepEqual((await read()).find((p) => p.name === 'Work').lat, -32.01);
    await page.getByRole('button', { name: 'Edit My home', exact: true }).click();
    await page.getByLabel('Place name', { exact: true }).fill('Work'); await save();
    await page.getByRole('alert').filter({ hasText: 'already exists' }).waitFor();
    assert.equal((await read()).length, 2); await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    // Permission failures must not create a place or dismiss its editable form.
    await page.evaluate(() => Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: (_, fail) => fail({ code: 1 }) } }));
    await page.getByRole('button', { name: 'Add a place', exact: true }).click();
    await page.getByLabel('Place name', { exact: true }).fill('Gym');
    await page.getByLabel('Location to save', { exact: true }).selectOption('current'); await save();
    await page.getByRole('alert').filter({ hasText: 'Could not get your location' }).waitFor();
    assert.equal((await read()).length, 2); await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    // A late location response after Cancel must never save a place.
    await page.evaluate(() => Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: (ok) => { window.finishLocation = ok; } } }));
    await page.getByRole('button', { name: 'Add a place', exact: true }).click();
    await page.getByLabel('Place name', { exact: true }).fill('Gym');
    await page.getByLabel('Location to save', { exact: true }).selectOption('current'); await save();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.evaluate(() => { finishLocation({ coords: { latitude: -31.9, longitude: 115.9 } }); delete navigator.geolocation; });
    assert.equal((await read()).length, 2);
    // Failed writes keep existing places intact and report the failure honestly.
    await page.evaluate(() => { window.originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('Quota'); }; });
    await page.getByRole('button', { name: 'Add a place', exact: true }).click();
    await page.getByLabel('Place name', { exact: true }).fill('Clinic'); await save();
    await page.getByRole('alert').filter({ hasText: 'Could not save changes' }).waitFor();
    assert.equal((await read()).length, 2); await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.evaluate(() => { Storage.prototype.setItem = originalSetItem; });
    const station = await page.evaluate(() => {
      const e = { kind: 'station', idx: 0 }; __app.panel.openEntity(e);
      return { lat: __app.net.entityLat(e), lon: __app.net.entityLon(e) };
    });
    await page.getByRole('button', { name: 'Save this location', exact: true }).click();
    await page.getByLabel('Place name', { exact: true }).fill('Library'); await save();
    const library = (await read()).find((p) => p.name === 'Library');
    assert.equal(library.lat, station.lat); assert.equal(library.lon, station.lon);
    await page.getByRole('tab', { name: 'Stops', exact: true }).click();
    await page.getByRole('button', { name: 'Edit Work', exact: true }).click();
    await page.getByRole('button', { name: 'Delete place', exact: true }).click();
    assert.equal((await read()).some((p) => p.name === 'Work'), false);
    await page.getByRole('button', { name: 'Switch to the dark map' }).click();
    await page.waitForFunction(() => __app.mapView.map.getLayer('favourite-places')
      && __app.mapView.map.getPaintProperty('favourite-places', 'circle-color') === '#4cc0c8'
      && __app.mapView.map.isStyleLoaded());
    assert.equal(await page.evaluate(async () => (await __app.mapView.map.getSource('favourite-places').getData()).features.length), 2);
    await audit('saved places in dark mode');
    await page.setViewportSize({ width: 320, height: 740 });
    await page.evaluate(() => __app.sheet.set('full'));
    await page.getByRole('button', { name: 'Edit Library', exact: true }).click();
    await audit('320px edit-place dialog');
    assert.equal(await page.getByRole('dialog').evaluate((e) => e.scrollWidth > e.clientWidth), false);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Edit Library', exact: true }).focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'place-name');
    await page.screenshot({ path: '/tmp/perth-favourites-phone.png' });
    await page.keyboard.press('Escape');
    const other = await context.newPage();
    await other.goto(`${origin}/perth-transit/?speed=0`); await other.waitForFunction(() => !!window.__app);
    await other.evaluate(() => __app.favourites.store.save({ name: 'Another tab', lat: -31.9, lon: 115.8 }));
    await page.getByRole('button', { name: 'Show stops near Another tab', exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log('Home/Work/custom places, reload, nearby stops, rename, GPS/permission/cancel/storage errors, station save, deletion, map/theme, phone/keyboard and cross-tab sync pass.');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
