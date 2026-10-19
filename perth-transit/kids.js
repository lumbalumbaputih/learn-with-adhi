// kids.js: Perth Train Spotter. A kids' page on the same timetable engine and map as the grown-up map:
// trains and the ferry only, big shapes, time that can run faster than real life, and plain words.
import { Network, ymdToDow, addDays, fmtClock, ymdParts, DAY } from './sim.js?v=1.10';
import { SimClock } from './clock.js?v=1.10';
import { MapView } from './mapview.js?v=1.10';
import { chipColors, routeColor } from './colors.js?v=1.10';
import { prettyName } from './util.js?v=1.10';
import { findVehicle, stopsReached, trainsFrom } from './ride.js?v=1.10';
import { Sound, loadSettings, saveSettings } from './sound.js?v=1.10';

const $ = (id) => document.getElementById(id);
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MODES = ['train', 'ferry'];
const START_SPEED = 10; // fast enough to see the trains move at city zoom, slow enough to follow one
const narrowQuery = matchMedia('(max-width: 819px)');
// the card sits at the side (not above the dock) on wide screens and on short landscape phones: keep in step with kids.css
const sideQuery = matchMedia('(min-width: 820px), (max-height: 500px) and (min-width: 640px)');
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
  if (sec <= 40) return 'any moment now';
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

  // ---- sound: effects on and voice off by default, kept on this device (sound.js)
  const settings = loadSettings();
  const sound = new Sound(settings);
  for (const ev of ['pointerdown', 'keydown']) document.addEventListener(ev, () => sound.unlock(), { capture: true, passive: true });
  function syncSettings() {
    $('sound-btn').setAttribute('aria-pressed', String(settings.sound));
    $('set-sound').checked = settings.sound;
    $('set-voice').checked = settings.voice;
    $('set-voice').disabled = !sound.canSpeak;
    // only on-device voices are used (sound.js): say so when there is none, once the voice list has loaded
    const listed = sound.canSpeak && window.speechSynthesis.getVoices().length > 0;
    $('voice-note').hidden = sound.canSpeak && !(listed && !sound.localVoice());
    $('voice-note').textContent = sound.canSpeak ? 'This device has no English voice of its own, so nothing will be read aloud.' : "This browser can't read aloud.";
  }
  if (sound.canSpeak) window.speechSynthesis.addEventListener('voiceschanged', () => syncSettings());
  function changeSettings(patch) {
    Object.assign(settings, patch);
    saveSettings(settings);
    if (!settings.voice) sound.stopSpeaking();
    syncSettings();
  }
  $('sound-btn').addEventListener('click', () => { changeSettings({ sound: !settings.sound }); sound.unlock(); sound.play('pop'); });
  $('set-sound').addEventListener('change', (e) => changeSettings({ sound: e.target.checked }));
  $('set-voice').addEventListener('change', (e) => { changeSettings({ voice: e.target.checked }); sound.speak('Station names will be read aloud.'); });
  syncSettings();

  // ---- map
  let selected = null;
  const mapView = new MapView($('map'), net, {
    onVehicle: (id) => select(id),
    onEntity: () => { if (!riding()) select(null); },
    onEmpty: () => { if (!riding()) select(null); }, // a stray tap must not end a ride
    onUnfollow: () => { ride.follow = false; syncButtons(); },
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
    // tapping the train you are riding (or waiting for) keeps the ride going
    if (id !== null && (id === ride.id || (ride.wait && id === ride.wait.id))) {
      if (ride.id !== null && !ride.done && !ride.follow) { ride.follow = true; mapView.follow(ride.id); syncButtons(); tick(true); }
      return;
    }
    if (riding()) hopOff();
    selected = id;
    mapView.setSelectedVehicle(id);
    const v = id === null ? null : mapView.byId.get(id);
    if (!v) { closeCard(); return; }
    openCard(v.route, v.pattern, v.id);
    sound.play('pop');
    requestAnimationFrame(() => showOnMap(v));
    tick(true);
  }

  // A vehicle's id changes at midnight (findVehicle); keep every place that holds it in step.
  function lookup(id) {
    const f = id === null ? null : findVehicle(mapView.byId, id);
    if (f && f.id !== id) {
      if (selected === id) { selected = f.id; mapView.setSelectedVehicle(f.id); }
      if (cardState.id === id) cardState.id = f.id;
      if (ride.wait && ride.wait.id === id) ride.wait.id = f.id;
      if (ride.id === id) { ride.id = f.id; if (mapView.following === id) mapView.follow(f.id); }
    }
    return f ? f.v : null;
  }

  // ---- the train card: line, destination, what it is doing, and the line strip
  const cardEl = $('card'), stripEl = $('strip'), stripList = $('strip-list'), stripTrain = $('strip-train');
  const cardState = { id: null, pattern: -1, k: '', items: [] };
  function openCard(routeIdx, patternIdx, id) {
    const route = net.routes[routeIdx], pat = net.patterns[patternIdx];
    const { bg, fg } = chipColors(route);
    cardState.id = id; cardState.pattern = patternIdx; cardState.k = '';
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
    cardEl.classList.remove('celebrate');
    $('next-trains').hidden = true;
    cardEl.hidden = false;
    hint.hidden = true;
    mapView.highlightRoute(routeIdx);
    syncButtons();
  }
  function closeCard() {
    if (cardEl.hidden) return;
    cardEl.hidden = true;
    cardState.id = null;
    mapView.highlightRoute(null);
    mapView.map.setPadding(NO_PAD);
  }
  // if the train is hidden behind the card or the dock, move the map so it can be seen
  function showOnMap(v) {
    const m = mapView.map, pt = m.project([v.lon, v.lat]), pad = ridePadding();
    const inView = pt.x > pad.left && pt.x < innerWidth - pad.right && pt.y > pad.top && pt.y < innerHeight - pad.bottom;
    if (!inView) m.easeTo({ center: [v.lon, v.lat], padding: pad, duration: motionQuery.matches ? 0 : 600 });
  }
  /** Strip dots: filled up to `passed`, `next` marked; the words are for screen readers. */
  function markStrip(passed, next, here, hereWords = ' (the train is here)') {
    cardState.items.forEach((it, i) => {
      it.li.classList.toggle('passed', i <= passed);
      it.li.classList.toggle('next', i === next);
      it.sr.textContent = i === here ? hereWords : i <= passed ? ' (passed)' : i === next ? ' (next stop)' : '';
    });
  }
  function placeStripTrain(pos) {
    const x = 16 + pos * STRIP_STEP + STRIP_STEP / 2;
    stripTrain.style.transform = `translateX(${x}px)`;
    if (x < stripEl.scrollLeft + 40 || x > stripEl.scrollLeft + stripEl.clientWidth - 40) stripEl.scrollLeft = x - stripEl.clientWidth / 2;
  }
  function updateCard(now) {
    if (cardState.id === null || ride.done || ride.wait) return; // the ride writes its own words then
    const v = lookup(cardState.id);
    const pat = net.patterns[cardState.pattern];
    if (!v) { // the trip has ended (or time was moved past it)
      $('card-now').textContent = 'This trip is finished. Tap another train!';
      stripTrain.hidden = true;
      if (!$('hop').hidden && ride.id === null) syncButtons();
      return;
    }
    stripTrain.hidden = false;
    const d = net.describe(v, now.sec), here = stationLabel(net, pat.stops[v.k]);
    $('card-now').textContent = v.state === 'end' ? `Arrived at ${here}!`
      : v.state === 'dwell' ? `Stopped at ${here}. People are getting on and off.`
      : `Next stop: ${stationLabel(net, d.nextStop)}, ${soonLabel(d.etaSec)}`;
    const key = `${v.k}|${v.state}`;
    if (key !== cardState.k) {
      cardState.k = key;
      markStrip(v.k, v.state === 'end' ? -1 : v.k + 1, v.state === 'move' ? -1 : v.k);
    }
    // slide the little train between the dots (by distance within the current run)
    const k = v.k, span = k + 1 < pat.dist.length ? pat.dist[k + 1] - pat.dist[k] : 0;
    placeStripTrain(k + (v.state === 'move' && span > 0 ? Math.min(1, Math.max(0, (v.dist - pat.dist[k]) / span)) : 0));
  }

  // ---- Hop on!: ride along with the train, station by station
  const NO_PAD = { top: 0, right: 0, bottom: 0, left: 0 };
  const ride = { id: null, k: -1, endAt: 0, follow: true, done: false, wait: null, station: -1, resume: 0, paused: false, offers: '' };
  // done covers the arrival card and the missed-train card (ride.id is null after a miss)
  const riding = () => ride.id !== null || ride.wait !== null || ride.done;
  const absSec = (ymd, sec) => { const [y, m, d] = ymdParts(ymd); return Date.UTC(y, m - 1, d) / 1000 + sec; };
  const bubble = $('bubble');
  function say(text, sfx) { // a short call with its sound (and the voice, if on); the bubble is a polite live region
    if (sfx) sound.play(sfx);
    sound.speak(text);
    bubble.textContent = text;
    placeBubble();
    bubble.classList.add('show');
    clearTimeout(say.t);
    say.t = setTimeout(() => bubble.classList.remove('show'), 3500);
  }
  // phones: just above the card (or the dock), so the card never has to shrink to make room; side layouts: CSS places it
  function placeBubble() {
    if (sideQuery.matches) { document.documentElement.style.removeProperty('--bubble-bottom'); return; }
    const anchor = (cardEl.hidden ? dock : cardEl).getBoundingClientRect().top;
    const topBar = document.querySelector('.top').getBoundingClientRect().bottom;
    const room = innerHeight - topBar - (bubble.offsetHeight || 44) - 8; // a very tall card: overlap its top rather than the top bar
    document.documentElement.style.setProperty('--bubble-bottom', `${Math.max(0, Math.round(Math.min(innerHeight - anchor + 8, room)))}px`);
  }
  // keep the followed train in the free part of the map when the card changes size (text wraps, riding layout, rotation)
  new ResizeObserver(() => {
    if (ride.id !== null && !ride.done) mapView.map.setPadding(ridePadding());
    if (bubble.classList.contains('show')) placeBubble();
  }).observe(cardEl);
  addEventListener('resize', () => { if (ride.id !== null && !ride.done) mapView.map.setPadding(ridePadding()); placeBubble(); });
  // the part of the map the card and the dock don't cover
  function ridePadding() {
    const r = cardEl.getBoundingClientRect(), dockTop = dock.getBoundingClientRect().top;
    const top = Math.round(document.querySelector('.top').getBoundingClientRect().bottom + 10); // the top bar is taller on small screens
    const p = sideQuery.matches
      ? { top, bottom: Math.max(0, Math.round(innerHeight - dockTop + 10)), left: cardEl.hidden ? 20 : Math.round(r.right + 10), right: 20 }
      : { top, bottom: Math.max(0, Math.round(innerHeight - (cardEl.hidden ? dockTop : r.top) + 10)), left: 20, right: 20 };
    // always leave a band of map to show the train in, even when the card is tall
    const room = innerHeight - 80;
    if (p.top + p.bottom > room) p.bottom = Math.max(0, room - p.top);
    if (p.left + p.right > innerWidth - 80) p.left = Math.max(0, innerWidth - 80 - p.right);
    return p;
  }
  function startRide(v) {
    const pat = net.patterns[v.pattern], prof = net.profiles[v.run.prof], now = clock.now();
    Object.assign(ride, { id: v.id, k: v.k, done: false, wait: null, follow: true });
    ride.endAt = absSec(now.ymd, v.run.t0 + prof.arr[prof.arr.length - 1]);
    syncButtons(); // the riding layout first (a compact card on short phones), so the padding below fits it
    const m = mapView.map, zoom = Math.max(m.getZoom(), 13.2);
    m.setPadding(ridePadding());
    if (motionQuery.matches) { m.jumpTo({ center: [v.lon, v.lat], zoom }); mapView.follow(v.id); }
    else {
      mapView.follow(null); // following jumps every frame, which would cut the zoom short
      m.easeTo({ center: [v.lon, v.lat], zoom, duration: 700 });
      m.once('moveend', () => { if (ride.id !== null && ride.follow) mapView.follow(ride.id); });
    }
    if (clock.speed === 0 && !motionQuery.matches) { clock.setSpeed(START_SPEED); syncSpeeds(); schedule(); }
    say(`All aboard! Next stop: ${stationLabel(net, pat.stops[Math.min(v.k + 1, pat.stops.length - 1)])}`, net.routes[v.route].isFerry ? 'horn' : 'whistle');
    syncButtons();
  }
  // after the arrival pause, carry on at the speed the viewer had chosen (also with reduced motion: it was their choice)
  function resumeAfterArrival() {
    if (ride.paused && clock.speed === 0 && ride.resume) { clock.setSpeed(ride.resume); syncSpeeds(); schedule(); }
    ride.paused = false;
  }
  function hopOff() {
    if (ride.done) resumeAfterArrival(); // leaving the arrival card
    Object.assign(ride, { id: null, wait: null, done: false, follow: true, station: -1 });
    mapView.follow(null);
    mapView.map.setPadding(NO_PAD);
    cardEl.classList.remove('celebrate');
    $('next-trains').hidden = true;
    cardState.k = '';
    syncButtons();
  }
  function updateRide(now) {
    if (ride.wait) { updateWait(now); return; }
    if (ride.id === null || ride.done) return;
    const pat = net.patterns[cardState.pattern], last = pat.stops.length - 1;
    const v = lookup(ride.id);
    if (!v && absSec(now.ymd, now.sec) < ride.endAt - 1) { hopOff(); return; } // time jumped away from the trip
    const k = v ? v.k : last; // gone at its end time: the trip is over
    const reached = stopsReached(ride.k, k);
    ride.k = Math.max(ride.k, k);
    if (k >= last) finishRide(now, pat);
    else if (reached.length) say(`${stationLabel(net, pat.stops[k])}!`, 'chime');
  }
  function finishRide(now, pat) {
    const lastK = pat.stops.length - 1, lastStop = pat.stops[lastK], label = stationLabel(net, lastStop);
    ride.done = true;
    mapView.follow(null);
    $('card-now').textContent = `You made it to ${label}! 🎉`;
    markStrip(lastK, -1, lastK);
    stripTrain.hidden = false;
    placeStripTrain(lastK);
    if (!motionQuery.matches) cardEl.classList.add('celebrate');
    say(`You made it to ${label}!`, 'yay');
    // pause for the moment of arrival, so the next trains on offer don't leave while the choice is made
    ride.paused = clock.speed !== 0;
    if (ride.paused) { ride.resume = clock.speed; clock.setSpeed(0); syncSpeeds(); }
    showNextTrains(net.stopStation[lastStop], now);
    syncButtons();
  }
  const leavesLabel = (sec) => (sec <= 40 ? 'leaves now' : `leaves in about ${Math.max(1, Math.round(sec / 60))} minute${Math.round(sec / 60) > 1 ? 's' : ''}`);
  function showNextTrains(station, now) {
    const list = station >= 0 ? trainsFrom(net, station, now.ymd, now.sec, { limit: 3 }) : [];
    ride.station = station;
    ride.offers = list.map((d) => `${d.id}|${Math.round((d.t - now.sec) / 60)}`).join(',');
    const box = $('next-list');
    box.replaceChildren();
    if (!list.length) box.append(Object.assign(document.createElement('p'), { className: 'next-none', textContent: 'No more trains from here for a while.' }));
    for (const d of list) {
      const route = net.routes[d.route];
      const btn = Object.assign(document.createElement('button'), { type: 'button', className: 'chunky next-train' });
      const sw = Object.assign(document.createElement('span'), { className: 'sw' });
      sw.style.background = routeColor(route);
      const txt = document.createElement('span');
      txt.append(`${lineName(route)} to ${stationLabel(net, d.last)}`, Object.assign(document.createElement('small'), { textContent: leavesLabel(d.t - now.sec) }));
      btn.append(sw, txt);
      btn.addEventListener('click', () => waitFor(d, station));
      box.append(btn);
    }
    $('next-trains').hidden = false;
  }
  // "Hop on another train?": wait at the station until that train is there, then ride it
  function waitFor(d, station) {
    const fromList = $('next-list').contains(document.activeElement); // that button is about to disappear
    resumeAfterArrival();
    const now = clock.now();
    Object.assign(ride, { id: null, done: false, follow: true, wait: { id: d.id, k: d.k, t: d.t, ymd: now.ymd, station, route: d.route } });
    selected = d.id;
    mapView.setSelectedVehicle(d.id);
    openCard(d.route, d.pattern, d.id);
    markStrip(-1, -1, d.k, ' (you are waiting here)');
    stripTrain.hidden = true;
    placeStripTrain(d.k);
    const m = mapView.map;
    m.setPadding(ridePadding());
    m.easeTo({ center: [net.stationLon[station], net.stationLat[station]], zoom: Math.max(m.getZoom(), 13.2), duration: motionQuery.matches ? 0 : 600 });
    if (clock.speed === 0 && !motionQuery.matches) { clock.setSpeed(START_SPEED); syncSpeeds(); schedule(); }
    updateWait(now);
    syncButtons();
    if (fromList) $('hop-off').focus(); // "Stop waiting"
  }
  function updateWait(now) {
    const w = ride.wait, v = lookup(w.id);
    if (v && v.k >= w.k) { ride.wait = null; cardState.k = ''; startRide(v); return; }
    const left = w.t - (absSec(now.ymd, now.sec) - absSec(w.ymd, 0)), noun = net.routes[w.route].isFerry ? 'ferry' : 'train';
    if (!v && left < -180) { // it has gone (time jumped): offer the next ones instead
      ride.wait = null; ride.done = true;
      $('card-now').textContent = `We missed that ${noun}. Pick another one!`;
      showNextTrains(w.station, now);
      syncButtons();
      return;
    }
    const pat = net.patterns[cardState.pattern];
    $('card-now').textContent = `Waiting at ${stationLabel(net, net.stationStops[w.station][0])} for the ${noun} to ${stationLabel(net, pat.stops[pat.stops.length - 1])}. It should come ${soonLabel(left)}.`;
  }
  function syncButtons() {
    const hop = $('hop'), off = $('hop-off'), had = document.activeElement;
    cardEl.classList.toggle('riding', (ride.id !== null && !ride.done) || !!ride.wait);
    if (ride.done) { hop.hidden = true; off.hidden = false; off.textContent = 'Done'; }
    else if (ride.wait) { hop.hidden = true; off.hidden = false; off.textContent = 'Stop waiting'; }
    else if (ride.id !== null) { hop.hidden = ride.follow; hop.textContent = 'Find my train'; off.hidden = false; off.textContent = 'Hop off'; }
    else { hop.hidden = cardState.id === null || !lookup(cardState.id); hop.textContent = 'Hop on!'; off.hidden = true; }
    // a keyboard user's focus must not fall back to the page when the button they pressed hides itself
    if ((had === hop && hop.hidden) || (had === off && off.hidden)) {
      if (!hop.hidden) hop.focus(); else if (!off.hidden) off.focus(); else if (!cardEl.hidden) $('card-title').focus();
    }
  }
  $('hop').addEventListener('click', () => {
    if (ride.id !== null) { ride.follow = true; mapView.follow(ride.id); tick(true); syncButtons(); } // find my train
    else { const v = lookup(cardState.id); if (v) startRide(v); }
  });
  $('hop-off').addEventListener('click', () => {
    const waiting = !!ride.wait;
    hopOff();
    if (waiting) { select(null); dock.focus(); } else tick(true); // the card closes: keep keyboard focus on the page's controls
  });
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
    if (w) {
      clock.setTime(w.ymd, w.sec); if (clock.speed === 0) clock.setSpeed(START_SPEED); syncSpeeds(); sound.play('whistle'); tick(true);
      speedBtns.find((b) => b.tabIndex === 0).focus(); // the wake button has just hidden itself
    }
  });

  // ---- keyboard and screen readers: pick a train without the map (the map itself only pans and zooms).
  // Focus stays on the button, so pressing again picks the next one; the bubble (a live region) says which train.
  let pickOrder = [], pickAt = -1, pickArea = null, pickZoom = 0;
  function pickRound() { // the trains in view, nearest the middle first
    const m = mapView.map, c = m.getCenter();
    pickArea = m.getBounds(); pickZoom = m.getZoom(); pickAt = -1;
    pickOrder = [...mapView.byId.values()]
      .filter((v) => MODES.includes(net.routes[v.route].mode) && pickArea.contains([v.lon, v.lat]))
      .sort((p, q) => Math.hypot(p.lon - c.lng, p.lat - c.lat) - Math.hypot(q.lon - c.lng, q.lat - c.lat))
      .map((v) => v.id);
  }
  function nextPick() { // skip trains whose trip has ended since the round was made
    while (pickAt + 1 < pickOrder.length) { const f = findVehicle(mapView.byId, pickOrder[++pickAt]); if (f) return f; }
    return null;
  }
  $('pick').addEventListener('click', () => {
    const m = mapView.map;
    // a new round when the view has moved somewhere else (not just the small move that shows a picked train)
    if (!pickArea || !pickArea.contains(m.getCenter()) || Math.abs(m.getZoom() - pickZoom) > 1) pickRound();
    let f = nextPick();
    if (!f) { pickRound(); f = nextPick(); } // went round once: start again
    if (!f) { say('No trains here right now. Try zooming out.'); return; }
    select(f.id);
    const v = f.v, pat = net.patterns[v.pattern];
    say(`${lineName(net.routes[v.route])}, going to ${stationLabel(net, pat.stops[pat.stops.length - 1])}`);
  });

  // ---- grown-ups dialog
  const dlg = $('grownups');
  $('grownups-open').addEventListener('click', () => { syncSettings(); dlg.showModal(); });
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
    updateRide(now);
    updateCard(now);
    if (force || t - lastText > 1000) {
      lastText = t;
      const dow = DAYS[ymdToDow(now.ymd)];
      $('clock').textContent = `${dow} ${fmtClock(now.sec)}`;
      $('pretend').hidden = !pretend; // a typical day from the timetable, because the real date is outside it
      const trains = trainCount(vehicles), boats = boatCount(vehicles);
      let line;
      // "should be": these are timetable trains, not live ones
      if (trains === 0) line = boats ? `${plural(boats, 'boat', 'boats')} should be moving. The trains are asleep.` : 'The trains are asleep.';
      else line = `${plural(trains, 'train', 'trains')}${boats ? ` and ${plural(boats, 'boat', 'boats')}` : ''} should be moving right now`;
      $('count').textContent = line;
      $('wake').hidden = trains > 0;
      if (ride.done && ride.station >= 0) { // time is running on the arrival card: keep the offers current
        const fresh = trainsFrom(net, ride.station, now.ymd, now.sec, { limit: 3 }).map((d) => `${d.id}|${Math.round((d.t - now.sec) / 60)}`).join(',');
        if (fresh !== ride.offers) showNextTrains(ride.station, now);
      }
    }
    if (force) schedule();
  }
  function frame() { frameId = null; tick(false); schedule(); }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frameId); frameId = null; } else tick(true);
  });
  // (not while following: the follow camera moves every frame and its moveend would call tick again, endlessly)
  mapView.map.on('moveend', () => { if (mapView.following === null) tick(true); });
  tick(true);

  window.__kids = { net, clock, mapView, tick, select, sound, settings, get selected() { return selected; }, get ride() { return ride; } };
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
