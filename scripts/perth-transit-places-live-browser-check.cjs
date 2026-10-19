// Requires the real shipped catalogue and live OpenFreeMap access. No fixtures.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const origin = process.env.PERTH_TEST_ORIGIN || 'http://127.0.0.1:8099';

(async () => {
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  const browser = await chromium.launch({
    executablePath: process.env.PERTH_CHROMIUM_PATH || undefined,
    args: ['--no-sandbox'],
    ...(proxy ? { proxy: { server: proxy, bypass: '127.0.0.1,localhost' } } : {}),
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [], searchRequests = [], assets = { tiles: 0, fonts: 0 };
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (/overpass|nominatim|photon|geocod/i.test(request.url())) searchRequests.push(request.url());
    });
    if (proxy) {
      // Use Playwright's API client with the inherited proxy and Node CA trust.
      // These are real provider responses; TLS validation remains enabled.
      await page.route('https://tiles.openfreemap.org/**', async (route) => {
        const response = await route.fetch({ timeout: 30000 });
        if (response.ok()) {
          if (/\/planet\/.*\.pbf/.test(route.request().url())) assets.tiles++;
          if (/\/fonts\//.test(route.request().url())) assets.fonts++;
        }
        await route.fulfill({ response });
      });
    } else {
      page.on('response', (response) => {
        if (!response.ok()) return;
        if (/tiles\.openfreemap\.org\/planet\/.*\.pbf/.test(response.url())) assets.tiles++;
        if (/tiles\.openfreemap\.org\/fonts\//.test(response.url())) assets.fonts++;
      });
    }
    await page.goto(`${origin}/perth-transit/?date=2026-10-19&t=08:00&speed=0`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.__app && __app.panel.catalogueState === 'ready', null, { timeout: 30000 });
    await page.waitForFunction(() => __app.mapView.basemapOk && !!__app.mapView.map.getLayer('named-place-labels'), null, { timeout: 30000 });
    const search = page.getByRole('searchbox');
    await search.fill('duxton');
    const hotel = page.getByRole('button', { name: /Show stops near Duxton Hotel Perth/ });
    await hotel.click();
    await page.getByRole('heading', { name: 'Stops near Duxton Hotel Perth', exact: true }).waitFor();
    assert.equal(await page.locator('.destination-marker').textContent(), 'Duxton Hotel Perth');
    assert.ok(await page.locator('.near .row').count() > 0);
    await page.waitForFunction(() => !__app.mapView.map.isMoving() && __app.mapView.map.areTilesLoaded(), null, { timeout: 60000 });
    await page.waitForFunction(() => __app.mapView.map.queryRenderedFeatures({ layers: ['named-place-labels'] }).some((f) => f.properties.name === 'Duxton Hotel Perth'), null, { timeout: 30000 });
    assert.ok(assets.tiles > 0 && assets.fonts > 0, 'Real map tiles and label glyphs loaded');
    await page.screenshot({ path: '/tmp/perth-place-real-desktop.png' });
    await page.locator('.near .row').first().click();
    await page.getByText('Next departures', { exact: true }).waitFor();
    await search.fill('pan pacific');
    await page.getByRole('button', { name: /Show stops near Pan Pacific Perth/ }).click();
    await page.getByRole('heading', { name: 'Stops near Pan Pacific Perth', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Switch to the dark map' }).click();
    await page.waitForFunction(() => __app.mapView.theme === 'dark' && !!__app.mapView.map.getLayer('named-place-labels'), null, { timeout: 30000 });
    await page.waitForFunction(() => !__app.mapView.map.isMoving() && __app.mapView.map.areTilesLoaded(), null, { timeout: 60000 });
    assert.equal(await page.locator('.destination-marker').textContent(), 'Pan Pacific Perth');
    await page.waitForFunction(() => __app.mapView.map.queryRenderedFeatures({ layers: ['named-place-labels'] }).length > 0, null, { timeout: 30000 });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => __app.sheet.set('half'));
    await page.waitForFunction(() => !__app.mapView.map.isMoving());
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: '/tmp/perth-place-real-mobile.png' });
    assert.deepEqual(searchRequests, [], 'Real place queries stay on this device');
    assert.deepEqual(errors, []);
    console.log(`Real-data map checks pass: Duxton and Pan Pacific name search, hotel labels, nearby departures, light/dark styles and phone layout; ${assets.tiles} real tiles and ${assets.fonts} font responses.`);
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
