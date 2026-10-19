// Serve the repository root on :8099. Fixtures here are fictional, never shipped.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const axePath = require.resolve('axe-core/axe.min.js');
const origin = process.env.PERTH_TEST_ORIGIN || 'http://127.0.0.1:8099';
const plainStyle = { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#eef1f2' } }] };
const fixture = { version: 1, sourceTimestamp: '2026-10-19T00:00:00Z', places: [
  { id: 'node/1', name: 'Example Hotel', kind: 'hotel', lat: -31.957, lon: 115.866, locality: 'Perth', address: '1 Example Street', aliases: ['Old Example Inn'] },
  { id: 'node/2', name: 'Example Hotel', kind: 'hotel', lat: -32.05, lon: 115.75, locality: 'Fremantle', address: '2 Example Street' },
  { id: 'node/3', name: '<img src=x onerror=alert(1)> Café', kind: 'cafe', lat: -31.9575, lon: 115.867, locality: 'Perth', address: '' },
] };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PERTH_CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  const errors = [], externalSearches = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => { if (/overpass|nominatim|photon|geocod/i.test(request.url())) externalSearches.push(request.url()); });
    await page.route('https://tiles.openfreemap.org/styles/*', (route) => route.fulfill({ json: plainStyle }));
    let release;
    const catalogueGate = new Promise((resolve) => { release = resolve; });
    await page.route('**/data/places.json*', async (route) => { await catalogueGate; await route.fulfill({ json: fixture }); });
    await page.goto(`${origin}/perth-transit/?date=2026-10-19&t=08:00&speed=0`);
    await page.waitForFunction(() => !!window.__app);
    const search = page.getByRole('searchbox');
    await search.fill('950');
    await page.getByText('Loading places… Routes and stops are available below.').waitFor();
    assert.ok(await page.getByRole('heading', { name: 'Routes', exact: true }).isVisible(), 'Transit search works during catalogue loading');
    release();
    await page.waitForFunction(() => __app.panel.catalogueState === 'ready');
    await search.fill('old example inn');
    const result = page.getByRole('button', { name: 'Show stops near Example Hotel, Perth', exact: true });
    await result.waitFor();
    await result.focus(); await page.keyboard.press('Enter');
    await page.getByRole('heading', { name: 'Stops near Example Hotel', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'content');
    assert.equal(await page.locator('.destination-marker').textContent(), 'Example Hotel');
    assert.ok(await page.locator('.near .row').count() > 0, 'Nearby timetable stops are shown');
    await page.getByRole('button', { name: 'Save this place', exact: true }).click();
    assert.equal(await page.getByLabel('Location to save').inputValue(), 'saved');
    await page.getByRole('button', { name: 'Save place', exact: true }).click();
    const saved = await page.evaluate(() => __app.favourites.list()[0]);
    assert.deepEqual([saved.lat, saved.lon, saved.name], [-31.957, 115.866, 'Example Hotel']);
    assert.equal(await page.getByRole('heading', { name: 'Stops near Example Hotel' }).count(), 1, 'Saving a favourite does not discard the catalogue selection');
    await page.locator('.near .row').first().click();
    assert.ok(await page.getByText('Next departures', { exact: true }).isVisible(), 'Nearby stop opens its timetable');
    await search.fill('example hotel frem');
    await page.getByRole('button', { name: 'Show stops near Example Hotel, Fremantle', exact: true }).click();
    assert.equal(await page.evaluate(() => __app.panel.nearMe.locality), 'Fremantle');
    await page.getByRole('button', { name: 'Switch to the dark map' }).click();
    await page.waitForFunction(() => __app.mapView.theme === 'dark' && !!__app.mapView.map.getSource('named-places'));
    assert.equal(await page.locator('.destination-marker').textContent(), 'Example Hotel', 'Destination survives style changes');
    assert.equal(await page.evaluate(async () => (await __app.mapView.map.getSource('named-places').getData()).features.length), 3);
    await page.getByRole('button', { name: 'Map layers', exact: true }).click();
    await page.getByLabel('Place names', { exact: true }).uncheck();
    assert.equal(await page.evaluate(() => __app.mapView.map.getLayoutProperty('named-places', 'visibility')), 'none');
    await page.getByRole('button', { name: 'Map layers', exact: true }).click();
    await page.getByRole('button', { name: 'Use map centre', exact: true }).click();
    assert.equal(await page.locator('.destination-marker').count(), 0);
    await search.fill('cafe');
    await page.getByRole('button', { name: /Show stops near <img/ }).click();
    assert.equal(await page.locator('.selected-place img').count(), 0, 'OSM names are text, never HTML');
    assert.equal(await page.locator('.destination-marker img').count(), 0);
    await search.fill('no-such-place-zzyy');
    assert.ok(await page.getByText(/No places found/).isVisible());
    await search.fill('example');
    await page.addScriptTag({ path: axePath });
    async function axe(label) {
      const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } })).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })));
      assert.deepEqual(violations, [], label);
    }
    await axe('Desktop place results');
    await page.setViewportSize({ width: 320, height: 740 });
    await page.getByRole('button', { name: 'Show stops near Example Hotel, Perth', exact: true }).click();
    await axe('320px selected place');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.waitForFunction(() => !__app.mapView.map.isMoving());
    const markerVisible = await page.locator('.destination-marker').evaluate((element) => {
      const box = element.getBoundingClientRect(), panel = document.getElementById('panel').getBoundingClientRect();
      return box.top >= 0 && box.bottom < panel.top && box.left >= 0 && box.right <= innerWidth;
    });
    assert.equal(markerVisible, true, 'Selected hotel label is visible above the phone sheet');
    await page.screenshot({ path: '/tmp/perth-place-search-mobile.png' });
    await page.reload();
    await page.waitForFunction(() => !!window.__app);
    assert.equal(await page.evaluate(() => __app.favourites.list()[0].name), 'Example Hotel', 'Saved destination survives reload');

    // Failed local catalogue must not prevent timetable startup; retry can recover.
    await page.unroute('**/data/places.json*');
    await page.route('**/data/places.json*', (route) => route.fulfill({ status: 503, body: 'unavailable' }));
    await page.reload();
    await page.waitForFunction(() => !!window.__app && __app.panel.catalogueState === 'error');
    await search.fill('950');
    assert.ok(await page.getByRole('heading', { name: 'Routes', exact: true }).isVisible());
    await page.unroute('**/data/places.json*');
    await page.route('**/data/places.json*', (route) => route.fulfill({ json: fixture }));
    await page.getByRole('button', { name: 'Retry place search' }).click();
    await page.waitForFunction(() => __app.panel.catalogueState === 'ready');
    await search.fill('example hotel');
    assert.equal(await page.locator('.named-place-result').count(), 2);
    // Verify label-layer wiring with a glyph-capable test style. Actual provider
    // rendering remains a separate network-dependent check.
    await page.route('**/test-glyphs/**', (route) => route.fulfill({ body: Buffer.alloc(0), contentType: 'application/x-protobuf' }));
    await page.evaluate(async (base) => {
      const view = __app.mapView;
      view.setLayerVisible('places', false);
      view._styles.light = { ok: true, style: { version: 8, glyphs: `${base}/test-glyphs/{fontstack}/{range}.pbf`, sources: {}, layers: [{ id: 'bg', type: 'background' }] } };
      await view.setTheme('light', { force: true });
    }, origin);
    assert.equal(await page.evaluate(() => __app.mapView.map.getLayoutProperty('named-place-labels', 'text-field')[1]), 'name');
    assert.equal(await page.evaluate(() => __app.mapView.map.getLayoutProperty('named-place-labels', 'visibility')), 'none', 'Place-name preference survives theme switching');
    assert.deepEqual(externalSearches, [], 'Queries make no external search API requests');
    assert.deepEqual(errors, []);
    console.log('Place browser checks pass: loading/failure/retry, name search, nearby timetables, favourites, theme/layers, untrusted names, mobile layout and two axe states.');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
