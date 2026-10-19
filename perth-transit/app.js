// app.js: loads the timetable, then wires clock, map, panel and scrubber together.
import { Network, addDays, ymdParts, DAY } from './sim.js?v=1.11';
import { SimClock } from './clock.js?v=1.11';
import { MapView } from './mapview.js?v=1.11';
import { Panel } from './panel.js?v=1.11';
import { Scrubber, dayLabel } from './scrubber.js?v=1.11';
import { fmtN } from './util.js?v=1.11';
import { FavouritePlaces } from './favourites.js?v=1.11';
import { loadPlaceCatalogue } from './places.js?v=1.11';

const $ = (id) => document.getElementById(id);
const DEFAULT_VIEW = { lat: -31.955, lon: 115.87, zoom: 10.4 };
const mobileQuery = window.matchMedia('(max-width: 819px)');
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------------------------------------------------------------------- light / dark
// Follows the device until the viewer presses the button; the choice is then kept in this browser.
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
function savedTheme() {
  try { const t = localStorage.getItem('ptm-theme'); return t === 'light' || t === 'dark' ? t : null; } catch { return null; }
}
const themeNow = () => savedTheme() || (darkQuery.matches ? 'dark' : 'light');
function paintTheme(t) {
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]').content = t === 'dark' ? '#161d23' : '#ffffff';
  const b = $('btn-theme');
  if (b) b.setAttribute('aria-label', t === 'dark' ? 'Switch to the light map' : 'Switch to the dark map');
}

// ---------------------------------------------------------------------- loading
function setLoading(text, fraction) {
  $('loading-text').textContent = text;
  $('loading-bar').style.width = `${Math.round(fraction * 100)}%`;
}

async function loadData() {
  const metaRes = await fetch('data/meta.json', { cache: 'no-cache' });
  if (!metaRes.ok) throw new Error(`meta ${metaRes.status}`);
  const meta = await metaRes.json();
  const names = ['core', 'trips', 'stops', 'shapes'];
  let done = 0;
  setLoading('Loading the timetable', 0.05);
  const parts = await Promise.all(names.map(async (n) => {
    const r = await fetch(`data/${n}.json?v=${meta.hash}`);
    if (!r.ok) throw new Error(`${n} ${r.status}`);
    const j = await r.json();
    setLoading('Loading the timetable', 0.05 + (++done / names.length) * 0.7);
    return j;
  }));
  return { meta, core: parts[0], trips: parts[1], stops: parts[2], shapes: parts[3] };
}

function parseHash() {
  const m = /^#@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(\d+(?:\.\d+)?)/.exec(location.hash);
  if (!m) return { ...DEFAULT_VIEW };
  const v = { lat: +m[1], lon: +m[2], zoom: +m[3] };
  return v.lat < -36 || v.lat > -28 || v.lon < 112 || v.lon > 120 ? { ...DEFAULT_VIEW } : v;
}

function ymdLabel(ymd) {
  return dayLabel(ymd) + ' ' + ymdParts(ymd)[0];
}

// ---------------------------------------------------------------------- bottom sheet (phones)
function setupSheet(onChange) {
  const panel = $('panel'), grab = $('grab');
  const heights = () => ({
    peek: 176,
    half: Math.round(window.innerHeight * 0.52),
    full: window.innerHeight - 72,
  });
  let state = 'peek';
  const apply = (px, animate) => {
    panel.style.transition = animate ? '' : 'none';
    panel.style.height = `${px}px`;
    document.documentElement.style.setProperty('--sheet-h', `${px}px`);
    onChange(px);
  };
  const set = (s, animate = true) => {
    state = s;
    panel.dataset.sheet = s;
    if (mobileQuery.matches) apply(heights()[s], animate);
  };
  const layout = () => {
    if (mobileQuery.matches) { panel.dataset.sheet = state; apply(heights()[state], false); }
    else { panel.style.height = ''; panel.style.transition = ''; document.documentElement.style.setProperty('--sheet-h', '0px'); onChange(0); }
  };
  mobileQuery.addEventListener('change', layout);
  window.addEventListener('resize', layout);
  let startY = 0, startH = 0, dragging = false, moved = false;
  grab.addEventListener('pointerdown', (e) => {
    if (!mobileQuery.matches) return;
    dragging = true; moved = false; startY = e.clientY; startH = panel.getBoundingClientRect().height;
    grab.setPointerCapture(e.pointerId);
  });
  grab.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dy = startY - e.clientY;
    if (Math.abs(dy) > 4) moved = true;
    const hs = heights();
    apply(Math.min(hs.full, Math.max(hs.peek, startH + dy)), false);
  });
  const finish = () => {
    if (!dragging) return;
    dragging = false;
    const hs = heights(), cur = panel.getBoundingClientRect().height;
    if (!moved) { set(state === 'peek' ? 'half' : state === 'half' ? 'full' : 'peek'); return; }
    set(Object.entries(hs).sort((a, b) => Math.abs(a[1] - cur) - Math.abs(b[1] - cur))[0][0]);
  };
  grab.addEventListener('pointerup', finish);
  grab.addEventListener('pointercancel', finish);
  grab.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(state === 'peek' ? 'half' : state === 'half' ? 'full' : 'peek'); }
  });
  layout();
  return { ensure: (s) => { if (mobileQuery.matches && heights()[s] > heights()[state]) set(s); }, set, get state() { return state; } };
}

// ---------------------------------------------------------------------- toast
let toastTimer = 0;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 5000);
}

// ---------------------------------------------------------------------- main
async function main() {
  let data;
  try {
    data = await loadData();
  } catch (err) {
    console.error(err);
    $('loading-text').textContent = "Couldn't load the timetable. Check your connection, then reload the page.";
    $('loading-bar').parentElement.hidden = true;
    $('loading-retry').hidden = false;
    return;
  }
  setLoading('Building the network', 0.82);
  await new Promise((r) => setTimeout(r, 0));
  const net = new Network(data);
  const clock = new SimClock();

  // query parameters: ?t=08:15&date=2026-10-19&speed=10 (handy for sharing a moment)
  const qs = new URLSearchParams(location.search);
  if (qs.get('t')) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(qs.get('t'));
    if (m) {
      let ymd = clock.now().ymd;
      const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(qs.get('date') || '');
      if (dm) ymd = +dm[1] * 10000 + +dm[2] * 100 + +dm[3];
      clock.setTime(ymd, +m[1] * 3600 + +m[2] * 60);
      if (qs.has('speed') && Number.isFinite(Number(qs.get('speed')))) clock.setSpeed(Math.max(0, Math.min(600, Number(qs.get('speed')))));
    }
  }

  if (motionQuery.matches) clock.setSpeed(0);
  let mapView = null, panel = null, scrub = null, favourites = null;
  const sheet = setupSheet((px) => {
    if (mapView && mapView.map) {
      mapView.setPadding({ top: 0, right: 0, left: 0, bottom: mobileQuery.matches ? px : 0 });
    }
  });
  document.querySelector('.skip-link').addEventListener('click', (e) => {
    e.preventDefault(); sheet.ensure('full'); $('content').focus();
  });
  document.querySelector('.skip-time').addEventListener('click', (e) => {
    e.preventDefault(); sheet.set('peek'); $('scrubber').focus();
  });
  $('content').addEventListener('focusin', (e) => {
    if (e.target.matches(':focus-visible')) sheet.ensure('full');
  });

  const act = {
    onMode: (m) => { mapView.setMode(m); tick(true); },
    onRoute: (idx) => { mapView.highlightRoute(idx); mapView.fitRoute(idx); sheet.ensure('half'); tick(true); },
    onRouteClose: () => { mapView.highlightRoute(null); tick(true); },
    onEntity: (e, fly) => { mapView.showEntity(e, fly); sheet.ensure('half'); },
    onEntityClose: () => mapView.clearEntity(),
    onVehicle: (id) => { mapView.setSelectedVehicle(id); sheet.ensure('half'); },
    onVehicleClose: () => { mapView.setSelectedVehicle(null); mapView.follow(null); },
    onFollow: (id, on) => mapView.follow(on ? id : null),
    isFollowing: () => mapView.following !== null,
    onLocate: () => locate(),
    getPlaces: () => favourites?.list() || [],
    onSavePlace: (options) => { mapView.follow(null); favourites.edit(options); },
    onPlace: (place) => {
      mapView.follow(null); mapView.setSelectedVehicle(null);
      mapView.setDestination(null);
      panel.showPlace(place); sheet.ensure('half'); mapView.flyTo(place.lat, place.lon, 15.2); tick(true);
    },
    onNamedPlace: (place) => {
      mapView.follow(null); mapView.setSelectedVehicle(null);
      panel.showPlace(place, { catalogue: true });
      sheet.ensure('half'); mapView.setDestination(place); mapView.flyTo(place.lat, place.lon, 15.5); tick(true);
    },
    onNamedPlaceClose: () => mapView.setDestination(null),
    onRetryPlaces: () => loadNamedPlaces(),
    onSearch: () => sheet.ensure('half'),
    onTab: () => {},
  };
  panel = new Panel({
    content: $('content'), tabs: $('tabs'), search: $('search'), searchClear: $('search-clear'),
  }, net, act);

  mapView = new MapView($('map'), net, {
    onVehicle: (id) => panel.openVehicle(id),
    onEntity: (e) => panel.openEntity(e, { fly: false }),
    onPlace: (id) => favourites?.open(id),
    onNamedPlace: (id) => {
      const place = panel.catalogue?.byId.get(id);
      if (place) act.onNamedPlace(place);
    },
    onEmpty: () => { if (mobileQuery.matches) sheet.set('peek'); },
    onUnfollow: () => panel._refreshVehicleCard(),
    onView: (v) => {
      history.replaceState(null, '', `${location.pathname}${location.search}#@${v.lat.toFixed(5)},${v.lon.toFixed(5)},${v.zoom.toFixed(1)}`);
      panel.setCenter(v.lat, v.lon);
    },
  });
  setLoading('Loading the map', 0.9);
  paintTheme(themeNow());
  await mapView.init(parseHash(), { compactAttribution: mobileQuery.matches, theme: themeNow() });
  mapView.setPadding({ top: 0, right: 0, left: 0, bottom: mobileQuery.matches ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sheet-h'), 10) || 0 : 0 });
  panel.setCenter(mapView.view().lat, mapView.view().lon);
  favourites = new FavouritePlaces({
    view: () => mapView.view(),
    onChange: (places, focus) => {
      mapView.setPlaces(places); panel.refreshPlaces(places);
      if (focus && !favourites.dialog.open) $('content').focus({ preventScroll: true });
    },
    onOpen: (place) => act.onPlace(place),
    onMessage: (message) => toast(message),
  });
  mapView.setPlaces(favourites.list()); panel.refreshPlaces(favourites.list());

  let placesPending = false;
  async function loadNamedPlaces() {
    if (placesPending) return;
    placesPending = true; panel.setCatalogue(null, 'loading');
    try {
      const catalogue = await loadPlaceCatalogue();
      mapView.setCatalogue(catalogue); panel.setCatalogue(catalogue);
    } catch (error) {
      console.warn('Place catalogue unavailable.', error);
      panel.setCatalogue(null, 'error');
    } finally { placesPending = false; }
  }

  scrub = new Scrubber($('scrubber'), {
    onScrub: (sec) => { const n = clock.now(); clock.setTime(n.ymd, sec); tick(true); },
    onDay: (d) => { clock.shiftDays(d); tick(true); },
    onNow: () => { clock.goLive(); tick(true); },
    onSpeed: (s) => {
      if (s === 1 && clock.live) return;
      if (s === 0) scrub.resumeSpeed = clock.speed || 1;
      clock.setSpeed(s); tick(true);
    },
    onPause: () => {
      if (clock.speed === 0 && !clock.live) clock.setSpeed(scrub.resumeSpeed || 1);
      else { scrub.resumeSpeed = clock.speed || 1; clock.setSpeed(0); }
      tick(true);
    },
  });
  motionQuery.addEventListener('change', (e) => {
    if (e.matches) { mapView.follow(null); clock.setSpeed(0); tick(true); }
  });

  // ---- map buttons
  const btn3d = $('btn-3d');
  btn3d.addEventListener('click', () => {
    const on = btn3d.getAttribute('aria-pressed') !== 'true';
    btn3d.setAttribute('aria-pressed', String(on));
    mapView.set3D(on);
  });
  const setTheme = async (t, save) => {
    if (save) { try { localStorage.setItem('ptm-theme', t); } catch { /* private mode: still switches for this visit */ } }
    paintTheme(t);
    await mapView.setTheme(t);
    panel.render(); // route chips take the theme's bus and ferry colours
    tick(true);
  };
  $('btn-theme').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true));
  darkQuery.addEventListener('change', () => { if (!savedTheme()) setTheme(themeNow(), false); });
  $('btn-zoom-in').addEventListener('click', () => mapView.zoomBy(1));
  $('btn-zoom-out').addEventListener('click', () => mapView.zoomBy(-1));
  $('btn-locate').addEventListener('click', () => locate());
  const layersBtn = $('btn-layers'), layersMenu = $('layers-menu');
  layersBtn.addEventListener('click', () => {
    const open = layersMenu.hidden;
    layersMenu.hidden = !open;
    layersBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!layersMenu.hidden && !e.target.closest('#layers-wrap')) { layersMenu.hidden = true; layersBtn.setAttribute('aria-expanded', 'false'); }
  });
  for (const cb of layersMenu.querySelectorAll('input[type=checkbox]')) {
    cb.addEventListener('change', () => mapView.setLayerVisible(cb.dataset.layer, cb.checked));
  }

  // ---- location
  function locate() {
    if (!navigator.geolocation) { toast('Location is not available in this browser.'); return; }
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      if (lat < -36 || lat > -28 || lon < 112 || lon > 120) { toast('You seem to be outside the Perth area, so nearby stops are not shown.'); return; }
      mapView.setMe(lat, lon);
      mapView.setDestination(null);
      mapView.flyTo(lat, lon, 15.2);
      panel.setNearMe(lat, lon);
      panel.query = ''; $('search').value = ''; panel._clearDetail();
      panel.setTab('stops');
      sheet.ensure('half');
    }, () => toast("Couldn't get your location. Check that location access is allowed for this site."), { timeout: 10000, maximumAge: 60000 });
  }

  // ---- about dialog
  const about = $('about');
  $('about-open').addEventListener('click', () => about.showModal());

  // ---- what's new: opens on hover (mouse) or click/tap, closes on leaving, outside click or Escape
  const wn = $('whatsnew'), wnBtn = $('whatsnew-btn'), wnLog = $('whatsnew-log');
  let wnPinned = false, wnTimer = 0;
  // desktop: in the panel footer (bottom-left); phones hide that footer, so it floats on the map instead
  const wnDesk = matchMedia('(min-width: 820px)');
  const wnPlace = () => (wnDesk.matches ? document.querySelector('.panel-foot') : $('main')).appendChild(wn);
  wnPlace(); wnDesk.addEventListener('change', wnPlace);
  const wnShow = (on) => { clearTimeout(wnTimer); wnLog.hidden = !on; wnBtn.setAttribute('aria-expanded', String(on)); if (!on) wnPinned = false; };
  wnBtn.addEventListener('click', () => { wnPinned = !wnPinned || wnLog.hidden; wnShow(wnPinned); });
  wn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') wnShow(true); });
  wn.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !wnPinned) wnTimer = setTimeout(() => wnShow(false), 250); });
  document.addEventListener('pointerdown', (e) => { if (!wnLog.hidden && !wn.contains(e.target)) wnShow(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !wnLog.hidden) { e.stopImmediatePropagation(); wnShow(false); wnBtn.focus(); } });
  $('about-close').addEventListener('click', () => about.close());
  about.addEventListener('click', (e) => { if (e.target === about) about.close(); });
  const mm = net.meta;
  $('about-version').textContent = `Timetable feed ${mm.feed}, valid ${ymdLabel(mm.validFrom)} to ${ymdLabel(mm.validTo)}. Built ${mm.builtAt.slice(0, 10)}, build ${mm.hash}.`;

  // ---- global keys
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || about.open) return;
    if (panel.query) { $('search').value = ''; panel.query = ''; panel.render(); }
    else if (panel.detail) panel.back();
    else if (panel.vehicleId !== null) panel.closeVehicle();
  });

  // ---- main loop
  let hbYmd = 0, lastPanel = 0, lastTick = 0, lastMoment = '', frameId = null;
  function schedule() {
    if (frameId === null && !document.hidden && (clock.live || clock.speed !== 0)) frameId = requestAnimationFrame(frame);
  }
  function tick(force) {
    if (document.hidden) return;
    const t = performance.now();
    // Align with display frames; avoid both timer judder and work that cannot be painted.
    const interval = 1000 / 30, elapsed = t - lastTick;
    if (!force && elapsed < interval) return;
    lastTick = force ? t : t - (elapsed % interval);
    const now = clock.now();
    const moment = `${now.ymd}|${now.sec}`;
    if (!force && moment === lastMoment) return; // paused: no repeated geometry/DOM work
    lastMoment = moment;
    const covered = net.covers(now.ymd);
    if (hbYmd !== now.ymd) {
      hbYmd = now.ymd;
      scrub.setHeartbeat(covered ? net.heartbeat(now.ymd) : null, covered);
      const banner = $('banner');
      banner.hidden = covered;
      if (!covered) banner.textContent = `This timetable covers ${ymdLabel(mm.validFrom)} to ${ymdLabel(mm.validTo)}. Choose a day inside that range to see vehicles.`;
    }
    const vehicles = covered ? net.vehicles(now.ymd, now.sec) : [];
    mapView.setVehicles(vehicles);
    // Text and accessibility attributes need only one refresh per second.
    if (force || t - lastPanel > 1000) {
      lastPanel = t;
      scrub.setTime({ ymd: now.ymd, sec: now.sec, live: clock.live, speed: clock.speed });
      panel.update(now, vehicles);
    }
    scrub.moveTo(now.sec);
    if (force) schedule();
  }
  function frame() { frameId = null; tick(false); schedule(); }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frameId); frameId = null; }
    else tick(true);
  });
  mapView.map.on('moveend', () => { if (mapView.following === null) tick(true); });
  tick(true);

  window.__app = { net, clock, mapView, panel, scrub, tick, sheet, favourites };
  loadNamedPlaces();
  setLoading('Ready', 1);
  document.body.classList.add('ready');
  $('loading').hidden = true;
}

$('loading-retry').addEventListener('click', () => location.reload());
main().catch((err) => {
  console.error(err);
  $('loading-text').textContent = 'Something went wrong while starting the map. Reload the page to try again.';
  $('loading-retry').hidden = false;
});
