// app.js: loads the timetable, then wires clock, map, panel and scrubber together.
import { Network, addDays, ymdParts, DAY } from './sim.js';
import { SimClock } from './clock.js';
import { MapView } from './mapview.js';
import { Panel } from './panel.js';
import { Scrubber, dayLabel } from './scrubber.js';
import { fmtN } from './util.js';

const $ = (id) => document.getElementById(id);
const DEFAULT_VIEW = { lat: -31.955, lon: 115.87, zoom: 10.4 };
const mobileQuery = window.matchMedia('(max-width: 819px)');

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
      if (qs.get('speed')) clock.setSpeed(Math.max(1, Math.min(600, +qs.get('speed') || 1)));
    }
  }

  let mapView = null, panel = null, scrub = null;
  const sheet = setupSheet((px) => {
    if (mapView && mapView.map) {
      mapView.setPadding({ top: 0, right: 0, left: 0, bottom: mobileQuery.matches ? px : 0 });
    }
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
    onTab: () => {},
  };
  panel = new Panel({
    content: $('content'), tabs: $('tabs'), search: $('search'), searchClear: $('search-clear'),
  }, net, act);

  mapView = new MapView($('map'), net, {
    onVehicle: (id) => panel.openVehicle(id),
    onEntity: (e) => panel.openEntity(e, { fly: false }),
    onEmpty: () => { if (mobileQuery.matches) sheet.set('peek'); },
    onUnfollow: () => panel._refreshVehicleCard(),
    onView: (v) => {
      history.replaceState(null, '', `${location.pathname}${location.search}#@${v.lat.toFixed(5)},${v.lon.toFixed(5)},${v.zoom.toFixed(1)}`);
      panel.setCenter(v.lat, v.lon);
    },
  });
  setLoading('Loading the map', 0.9);
  await mapView.init(parseHash(), { compactAttribution: mobileQuery.matches });
  mapView.setPadding({ top: 0, right: 0, left: 0, bottom: mobileQuery.matches ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sheet-h'), 10) || 0 : 0 });
  panel.setCenter(mapView.view().lat, mapView.view().lon);

  scrub = new Scrubber($('scrubber'), {
    onScrub: (sec) => { const n = clock.now(); clock.setTime(n.ymd, sec); tick(true); },
    onDay: (d) => { clock.shiftDays(d); tick(true); },
    onNow: () => { clock.goLive(); tick(true); },
    onSpeed: (s) => { if (s === 1 && clock.live) return; clock.setSpeed(s); tick(true); },
  });

  // ---- map buttons
  const btn3d = $('btn-3d');
  btn3d.addEventListener('click', () => {
    const on = btn3d.getAttribute('aria-pressed') !== 'true';
    btn3d.setAttribute('aria-pressed', String(on));
    mapView.set3D(on);
  });
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
  let hbYmd = 0, lastPanel = 0, lastTick = 0;
  function tick(force) {
    const t = performance.now();
    const interval = clock.live && clock.speed === 1 ? (mapView.map.getZoom() > 14.5 ? 120 : 250) : 100;
    if (!force && t - lastTick < interval) return;
    lastTick = t;
    const now = clock.now();
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
    scrub.setTime({ ymd: now.ymd, sec: now.sec, live: clock.live, speed: clock.speed });
    if (force || t - lastPanel > 1000) { lastPanel = t; panel.update(now, vehicles); }
  }
  setInterval(() => tick(false), 100);
  tick(true);

  window.__app = { net, clock, mapView, panel, scrub, tick, sheet };
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
