// kids.js: Perth Train Spotter. A kids' page on the same timetable engine and map as the grown-up map:
// trains and the ferry only, big shapes, time that can run faster than real life, and plain words.
import { Network, ymdToDow, addDays, fmtClock, ymdParts, DAY } from './sim.js?v=1.8';
import { SimClock } from './clock.js?v=1.8';
import { MapView } from './mapview.js?v=1.8';
import { chipColors, routeColor } from './colors.js?v=1.8';
import { prettyName } from './util.js?v=1.8';

const $ = (id) => document.getElementById(id);
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MODES = ['train', 'ferry'];
const START_SPEED = 10; // fast enough to see the trains move at city zoom, slow enough to follow one
const narrowQuery = matchMedia('(max-width: 819px)');
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const darkQuery = matchMedia('(prefers-color-scheme: dark)');

// ---------------------------------------------------------------------- light / dark (same choice as the grown-up map)
function savedTheme() {
  try { const t = localStorage.getItem('ptm-theme'); return t === 'light' || t === 'dark' ? t : null; } catch { return null; }
}
const themeNow = () => savedTheme() || (darkQuery.matches ? 'dark' : 'light');
function paintTheme(t) {
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]').content = t === 'dark' ? '#172026' : '#ffffff';
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
  const parts = await Promise.all(names.map(async (n) => {
    const r = await fetch(`data/${n}.json?v=${meta.hash}`);
    if (!r.ok) throw new Error(`${n} ${r.status}`);
    const j = await r.json();
    setLoading('Getting the trains ready', 0.05 + (++done / names.length) * 0.7);
    return j;
  }));
  return { meta, core: parts[0], trips: parts[1], stops: parts[2], shapes: parts[3] };
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const STRIP_STEP = 76; // px per stop on the line strip (matches .strip-list li in kids.css)

/** "Perth Stn Platform 6" becomes "Perth": the station's name without the platform or the word Station. */
function stationLabel(net, stop) {
  const st = net.stopStation[stop];
  return prettyName(st >= 0 ? net.stationName[st] : net.stopName[stop]).replace(/\s+Platform\s+\S+$/i, '').replace(/\s+Station$/, '');
}
const lineName = (route) => (route.isFerry ? 'The ferry' : route.long);
function soonLabel(sec) {
  if (sec <= 40) return 'arriving now';
  const m = Math.round(sec / 60);
  return m <= 1 ? 'in about 1 minute' : `in about ${m} minutes`;
}
function dateLabel(ymd) {
  const [y, m, d] = ymdParts(ymd);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// ---------------------------------------------------------------------- main
async function main() {
  let data;
  try {
    setLoading('Getting the trains ready', 0.05);
    data = await loadData();
  } catch (err) {
    console.error(err);
    $('loading-text').textContent = "The trains couldn't load. Check the internet connection and try again.";
    $('loading-bar').parentElement.hidden = true;
    $('loading-retry').hidden = false;
    return;
  }
  setLoading('Putting the trains on the tracks', 0.82);
  await new Promise((r) => setTimeout(r, 0));
  const net = new Network(data);
  const clock = new SimClock();
  const trainCount = (list) => list.reduce((n, v) => n + (net.routes[v.route].isTrain ? 1 : 0), 0);
  const boatCount = (list) => list.reduce((n, v) => n + (net.routes[v.route].isFerry ? 1 : 0), 0);

  // Start at the real Perth time (or ?t=08:15&date=2026-10-19, like the grown-up map).
  // Outside the timetable, show the same time on a typical day ("pretend day").
  const real = clock.now();
  const qs = new URLSearchParams(location.search);
  const tm = /^(\d{1,2}):(\d{2})$/.exec(qs.get('t') || ''), dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(qs.get('date') || '');
  if (tm) { real.sec = Math.min(+tm[1] * 3600 + +tm[2] * 60, DAY - 1); if (dm) real.ymd = +dm[1] * 10000 + +dm[2] * 100 + +dm[3]; }
  let pretend = !net.covers(real.ymd);
  clock.setTime(pretend ? net.typicalDay(real.ymd) : real.ymd, real.sec);
  clock.setSpeed(motionQuery.matches ? 0 : START_SPEED);

  // ---- map
  let selected = null;
  const mapView = new MapView($('map'), net, {
    onVehicle: (id) => select(id),
    onEntity: () => select(null),
    onEmpty: () => select(null),
  });
  setLoading('Putting the trains on the tracks', 0.9);
  paintTheme(themeNow());
  const view = narrowQuery.matches ? { lat: -31.955, lon: 115.862, zoom: 10.7 } : { lat: -31.95, lon: 115.86, zoom: 11.3 };
  await mapView.init(view, { compactAttribution: true, theme: themeNow(), kids: true });
  mapView.setMode(MODES);
  mapView.setLayerVisible('bus', false);
  mapView.setLayerVisible('stops', false);
  darkQuery.addEventListener('change', async () => {
    if (savedTheme()) return;
    paintTheme(themeNow()); await mapView.setTheme(themeNow()); tick(true);
  });

  // keep the map's centre clear of the dock
  const dock = $('dock');
  const fitDock = () => {
    const hgt = dock.getBoundingClientRect().height + 12;
    document.documentElement.style.setProperty('--dock-h', `${Math.round(hgt)}px`);
    mapView.setPadding({ top: 64, right: 0, left: 0, bottom: Math.round(hgt) });
  };
  new ResizeObserver(fitDock).observe(dock);
  fitDock();

  function select(id) {
    selected = id;
    mapView.setSelectedVehicle(id);
    const v = id === null ? null : mapView.byId.get(id);
    if (!v) { closeCard(); return; }
    openCard(v);
    tick(true);
  }

  // ---- the train card: line, destination, what it is doing, and the line strip
  const cardEl = $('card'), stripEl = $('strip'), stripList = $('strip-list'), stripTrain = $('strip-train');
  const cardState = { id: null, pattern: -1, k: '', items: [] };
  function openCard(v) {
    const route = net.routes[v.route], pat = net.patterns[v.pattern];
    const { bg, fg } = chipColors(route);
    cardState.id = v.id; cardState.pattern = v.pattern; cardState.k = '';
    $('card-head').style.background = bg;
    $('card-head').style.color = fg;
    cardEl.style.setProperty('--line-c', routeColor(route));
    $('card-title').textContent = lineName(route);
    $('card-dest').textContent = `Going to ${stationLabel(net, pat.stops[pat.stops.length - 1])}`;
    cardState.items = [...pat.stops].map((stop) => {
      const sr = Object.assign(document.createElement('span'), { className: 'sr-only' });
      const li = document.createElement('li');
      li.append(stationLabel(net, stop), sr);
      return { li, sr };
    });
    stripList.replaceChildren(...cardState.items.map((x) => x.li));
    stripEl.scrollLeft = 0;
    cardEl.hidden = false;
    hint.hidden = true;
    mapView.highlightRoute(v.route);
    requestAnimationFrame(() => showOnMap(v));
  }
  function closeCard() {
    if (cardEl.hidden) return;
    cardEl.hidden = true;
    cardState.id = null;
    mapView.highlightRoute(null);
  }
  // if the train is hidden behind the card or the dock, move the map so it can be seen
  function showOnMap(v) {
    const m = mapView.map, pt = m.project([v.lon, v.lat]), r = cardEl.getBoundingClientRect(), dockTop = dock.getBoundingClientRect().top;
    const wide = !narrowQuery.matches;
    const pad = wide ? { top: 80, bottom: innerHeight - dockTop + 20, left: r.right + 20, right: 40 }
      : { top: 80, bottom: innerHeight - r.top + 20, left: 30, right: 30 };
    const inView = pt.x > pad.left && pt.x < innerWidth - pad.right && pt.y > pad.top && pt.y < innerHeight - pad.bottom;
    if (!inView) m.easeTo({ center: [v.lon, v.lat], padding: pad, duration: motionQuery.matches ? 0 : 600 });
  }
  function updateCard(now) {
    if (cardState.id === null) return;
    const v = mapView.byId.get(cardState.id);
    const items = cardState.items, pat = net.patterns[cardState.pattern];
    if (!v) { // the trip has ended (or time was moved past it)
      $('card-now').textContent = 'This trip is finished. Tap another train!';
      stripTrain.hidden = true;
      return;
    }
    stripTrain.hidden = false;
    const d = net.describe(v, now.sec), here = stationLabel(net, pat.stops[v.k]);
    $('card-now').textContent = v.state === 'end' ? `Arrived at ${here}!`
      : v.state === 'dwell' ? `Stopped at ${here}. People are getting on and off.`
      : `Next stop: ${stationLabel(net, d.nextStop)}, ${soonLabel(d.etaSec)}`;
    const key = `${v.k}|${v.state}`;
    if (key !== cardState.k) { // filled dots up to the last stop reached; words for screen readers
      cardState.k = key;
      items.forEach((it, i) => {
        const here = i === v.k && v.state !== 'move', next = i === v.k + 1 && v.state !== 'end';
        it.li.classList.toggle('passed', i <= v.k);
        it.li.classList.toggle('next', next);
        it.sr.textContent = here ? ' (the train is here)' : i <= v.k ? ' (passed)' : next ? ' (next stop)' : '';
      });
    }
    // slide the little train between the dots (by distance within the current run)
    const k = v.k, span = k + 1 < pat.dist.length ? pat.dist[k + 1] - pat.dist[k] : 0;
    const f = v.state === 'move' && span > 0 ? Math.min(1, Math.max(0, (v.dist - pat.dist[k]) / span)) : 0;
    const x = 16 + (k + f) * STRIP_STEP + STRIP_STEP / 2;
    stripTrain.style.transform = `translateX(${x}px)`;
    if (x < stripEl.scrollLeft + 40 || x > stripEl.scrollLeft + stripEl.clientWidth - 40) stripEl.scrollLeft = x - stripEl.clientWidth / 2;
  }
  $('card-close').addEventListener('click', () => select(null));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !dlg.open && cardState.id !== null) select(null); });

  // ---- speed: a radio group with one tab stop and arrow keys
  const speedBtns = [...$('speeds').querySelectorAll('[data-speed]')];
  function syncSpeeds() {
    for (const b of speedBtns) {
      const on = Number(b.dataset.speed) === clock.speed;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    }
  }
  function setSpeed(s) { clock.setSpeed(s); syncSpeeds(); tick(true); }
  speedBtns.forEach((b, i) => {
    b.addEventListener('click', () => setSpeed(Number(b.dataset.speed)));
    b.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      const nb = speedBtns[(i + step + speedBtns.length) % speedBtns.length];
      setSpeed(Number(nb.dataset.speed));
      nb.focus();
    });
  });
  syncSpeeds();
  motionQuery.addEventListener('change', (e) => { if (e.matches) setSpeed(0); });

  // ---- wake up: jump to the next moment a train runs (the trains sleep for a few hours each night)
  function nextTrainTime(ymd, sec) {
    for (let s = sec; s < sec + 14 * 3600; s += 120) {
      const day = s >= DAY ? addDays(ymd, 1) : ymd, t = s % DAY;
      if (net.covers(day) && trainCount(net.vehicles(day, t)) > 0) return { ymd: day, sec: t };
    }
    return null;
  }
  $('wake').addEventListener('click', () => {
    const n = clock.now(), w = nextTrainTime(n.ymd, n.sec);
    if (w) { clock.setTime(w.ymd, w.sec); if (clock.speed === 0) clock.setSpeed(START_SPEED); syncSpeeds(); tick(true); }
  });

  // ---- grown-ups dialog
  const dlg = $('grownups');
  $('grownups-open').addEventListener('click', () => dlg.showModal());
  $('grownups-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  const mm = net.meta;
  $('grownups-version').textContent = `Timetable feed ${mm.feed}, valid ${dateLabel(mm.validFrom)} to ${dateLabel(mm.validTo)}.`;

  // ---- a friendly first hint
  const hint = $('hint');
  const showHint = (text, ms = 7000) => {
    hint.textContent = text; hint.hidden = false;
    clearTimeout(showHint.t); showHint.t = setTimeout(() => { hint.hidden = true; }, ms);
  };

  // ---- main loop
  let lastText = 0, lastTick = 0, frameId = null, lastMoment = '';
  function schedule() {
    if (frameId === null && !document.hidden && clock.speed !== 0) frameId = requestAnimationFrame(frame);
  }
  function tick(force) {
    if (document.hidden) return;
    const t = performance.now(), interval = 1000 / 30, elapsed = t - lastTick;
    if (!force && elapsed < interval) return;
    lastTick = force ? t : t - (elapsed % interval);
    let now = clock.now();
    if (!net.covers(now.ymd)) { // ran past the end of the timetable: carry on with a typical day
      clock.setTime(net.typicalDay(now.ymd), now.sec);
      now = clock.now();
      pretend = true;
    }
    const moment = `${now.ymd}|${now.sec}`;
    if (!force && moment === lastMoment) return;
    lastMoment = moment;
    const vehicles = net.vehicles(now.ymd, now.sec);
    mapView.setVehicles(vehicles);
    updateCard(now);
    if (force || t - lastText > 1000) {
      lastText = t;
      const dow = DAYS[ymdToDow(now.ymd)];
      $('clock').textContent = `${dow} ${fmtClock(now.sec)}`;
      const pr = $('pretend');
      pr.hidden = !pretend;
      if (pretend) pr.textContent = `Pretend day: a normal ${dow}`;
      const trains = trainCount(vehicles), boats = boatCount(vehicles);
      let line;
      if (trains === 0) line = boats ? `${plural(boats, 'boat is', 'boats are')} moving. The trains are asleep.` : 'The trains are asleep.';
      else line = `${plural(trains, 'train', 'trains')}${boats ? ` and ${plural(boats, 'boat', 'boats')}` : ''} ${trains + boats === 1 ? 'is' : 'are'} moving right now`;
      $('count').textContent = line;
      $('wake').hidden = trains > 0;
    }
    if (force) schedule();
  }
  function frame() { frameId = null; tick(false); schedule(); }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frameId); frameId = null; } else tick(true);
  });
  mapView.map.on('moveend', () => tick(true));
  tick(true);

  window.__kids = { net, clock, mapView, tick, select, get selected() { return selected; } };
  setLoading('Ready', 1);
  document.body.classList.add('ready');
  $('loading').hidden = true;
  showHint(clock.speed === 0 ? 'Press Fast to start the trains!' : 'Watch the trains move! Tap Rocket to make time go faster.');
}

$('loading-retry').addEventListener('click', () => location.reload());
main().catch((err) => {
  console.error(err);
  $('loading-text').textContent = 'Something went wrong. Reload the page to try again.';
  $('loading-retry').hidden = false;
});
