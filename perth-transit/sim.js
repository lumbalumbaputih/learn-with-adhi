// sim.js: timetable engine for the Perth transit map.
// Pure logic, no DOM. Runs in browsers and in Node (so it can be tested against the raw GTFS).
//
// Geometry convention (must match scripts/compile_gtfs.py):
//   flat metres  x = lon * KX,  y = lat * KY,  LAT0 = -32.0
// Time convention: seconds since local (Australia/Perth) midnight of the "today" service day.
// Trips can run past midnight (GTFS times up to ~27 h), so yesterday's service day is checked too.

export const LAT0 = -32.0;
export const KY = 110574.0;
export const KX = 111320.0 * Math.cos((LAT0 * Math.PI) / 180);
export const DAY = 86400;

// ---------------------------------------------------------------- time helpers
const perthFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Australia/Perth', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

/** Offset in ms to add to a UTC epoch to get Perth wall-clock time. */
export function perthOffsetMs(ms) {
  const p = {};
  for (const x of perthFmt.formatToParts(new Date(ms))) p[x.type] = x.value;
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(ms / 1000) * 1000;
}

/** Perth wall-clock parts for an epoch in ms: { ymd, sec, dow (Monday = 0) }. */
export function perthLocal(ms, offsetMs = perthOffsetMs(ms)) {
  const d = new Date(ms + offsetMs);
  return {
    ymd: d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate(),
    sec: d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds() + d.getUTCMilliseconds() / 1000,
    dow: (d.getUTCDay() + 6) % 7,
    offsetMs,
  };
}

export function ymdParts(ymd) {
  return [Math.floor(ymd / 10000), Math.floor(ymd / 100) % 100, ymd % 100];
}

export function addDays(ymd, n) {
  const [y, m, d] = ymdParts(ymd);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.getUTCFullYear() * 10000 + (dt.getUTCMonth() + 1) * 100 + dt.getUTCDate();
}

export function ymdToDow(ymd) {
  const [y, m, d] = ymdParts(ymd);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

/** Epoch ms for a Perth local date and seconds-after-midnight (sec may exceed 86400). */
export function localToMs(ymd, sec, offsetMs) {
  const [y, m, d] = ymdParts(ymd);
  return Date.UTC(y, m - 1, d) + sec * 1000 - offsetMs;
}

export function fmtClock(sec) {
  const s = ((Math.round(sec) % DAY) + DAY) % DAY;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`;
}

// ---------------------------------------------------------------- geometry
export function decodePolyline(str) {
  const lat = [], lon = [];
  let i = 0, la = 0, lo = 0;
  while (i < str.length) {
    for (let k = 0; k < 2; k++) {
      let shift = 0, result = 0, b;
      do {
        b = str.charCodeAt(i++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (k === 0) la += d; else lo += d;
    }
    lat.push(la * 1e-5);
    lon.push(lo * 1e-5);
  }
  return { lat: Float64Array.from(lat), lon: Float64Array.from(lon) };
}

function buildGeom(enc) {
  const { lat, lon } = decodePolyline(enc);
  const n = lat.length;
  const cum = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    cum[i] = cum[i - 1] + Math.hypot((lon[i] - lon[i - 1]) * KX, (lat[i] - lat[i - 1]) * KY);
  }
  return { lat, lon, cum, n };
}

/** Point at distance d (flat metres) along a geometry. Writes into out. */
function pointAt(g, d, out) {
  const n = g.n;
  if (n === 1 || d <= 0) { out.lat = g.lat[0]; out.lon = g.lon[0]; out.bearing = bearingOf(g, 0); return out; }
  if (d >= g.cum[n - 1]) { out.lat = g.lat[n - 1]; out.lon = g.lon[n - 1]; out.bearing = bearingOf(g, n - 2); return out; }
  let lo = 0, hi = n - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (g.cum[mid] <= d) lo = mid; else hi = mid - 1;
  }
  const seg = g.cum[lo + 1] - g.cum[lo];
  const t = seg > 0 ? (d - g.cum[lo]) / seg : 0;
  out.lat = g.lat[lo] + (g.lat[lo + 1] - g.lat[lo]) * t;
  out.lon = g.lon[lo] + (g.lon[lo + 1] - g.lon[lo]) * t;
  out.bearing = bearingOf(g, lo);
  return out;
}

function bearingOf(g, i) {
  const dx = (g.lon[i + 1] - g.lon[i]) * KX, dy = (g.lat[i + 1] - g.lat[i]) * KY;
  const b = (Math.atan2(dx, dy) * 180) / Math.PI;
  return (b + 360) % 360;
}

export function flatDistance(lat1, lon1, lat2, lon2) {
  return Math.hypot((lon2 - lon1) * KX, (lat2 - lat1) * KY);
}

/**
 * Timetable times are whole minutes, so consecutive stops often share one minute. Taken literally a
 * vehicle would jump along the route at every minute change. For animation only, spread the stops of
 * a shared minute evenly across it (first stop of a trip and last stop of a trip stay exact).
 * Published departure times are never changed: boards use the raw offsets.
 */
export function smoothTimes(arr) {
  const n = arr.length, ta = new Float64Array(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && arr[j + 1] === arr[i]) j++;
    const cnt = j - i + 1, T = arr[i];
    if (cnt === 1) ta[i] = T;
    else if (j === n - 1) {
      const span = Math.min(i > 0 ? T - arr[i - 1] : 60, 60);
      for (let m = 0; m < cnt; m++) ta[i + m] = T - span * ((cnt - 1 - m) / cnt);
    } else {
      const span = Math.min(arr[j + 1] - T, 60);
      for (let m = 0; m < cnt; m++) ta[i + m] = T + span * (m / cnt);
    }
    i = j + 1;
  }
  return ta;
}

/**
 * Realistic motion for trains and the ferry (animation only). The timetable has whole minutes and
 * almost never a stopping time (11 of 1,690 train stop entries), so taken literally a train glides
 * through every station at a steady speed. Instead the vehicle speeds up and slows down between
 * stops at `acc` m/s², up to `top` m/s, and stands at each intermediate stop for up to `dwell`
 * seconds, leaving on the published time. These are assumptions, not measured figures: a typical
 * suburban electric train (Perth's fastest run at about 130 km/h) and a slow harbour ferry.
 * The published times are whole minutes, so a short run can look impossibly fast (1.5 km in "1
 * minute"). Then the stop shrinks to `minDwell`, and after that the vehicle leaves up to `late`
 * seconds after the published time and catches up later. It never leaves early, it reaches the last
 * stop on time, and it only breaks the speed limits if even that is not enough.
 * Buses keep the plain timetable interpolation: they only stop when someone is waiting or rings the
 * bell, so a stop at every bus stop would be less accurate, not more.
 */
export const MOTION = {
  train: { acc: 0.9, top: 130 / 3.6, dwell: 25, minDwell: 15, late: 30 },
  ferry: { acc: 0.25, top: 8, dwell: 0, minDwell: 0, late: 0 },
};

/** Shortest time to cover s metres from stop to stop, speeding up and slowing down at a, no faster than v. */
const minRun = (s, a, v) => (s >= (v * v) / a ? s / v + v / a : 2 * Math.sqrt(s / a));

/** Distance covered t seconds into a stop-to-stop run of s metres taking T seconds, at acceleration a up to speed v. */
function runDistance(s, T, a, v, t) {
  if (t <= 0) return 0;
  if (t >= T) return s;
  const tr = v / a; // time spent speeding up (and again slowing down)
  if (t < tr) return 0.5 * a * t * t;
  if (t > T - tr) { const u = T - t; return s - 0.5 * a * u * u; }
  return 0.5 * a * tr * tr + v * (t - tr);
}

// ---------------------------------------------------------------- network
export class Network {
  constructor({ meta, core, trips, stops, shapes }) {
    this.meta = meta;
    // Contract-specific GTFS route IDs can describe the same public route.
    // Remap only route references; every pattern, profile and trip stays intact.
    this.routes = [];
    const routeKeys = new Map();
    const routeMap = core.routes.map(([short, long, type]) => {
      const key = JSON.stringify([short, long, type]);
      if (!routeKeys.has(key)) {
        const idx = this.routes.length;
        routeKeys.set(key, idx);
        this.routes.push({
          idx, short, long, type, name: short || long, isTrain: type === 2, isFerry: type === 4,
          mode: type === 2 ? 'train' : type === 4 ? 'ferry' : 'bus',
        });
      }
      return routeKeys.get(key);
    });
    this.headsigns = core.headsigns;
    this._shapeEnc = shapes;
    this._geom = new Array(shapes.length);

    // stops and stations
    this.stopCount = stops.id.length;
    this.stopId = stops.id;
    this.stopCode = stops.code;
    this.stopName = stops.name;
    this.stopLat = Float64Array.from(stops.lat, (v) => v / 1e5);
    this.stopLon = Float64Array.from(stops.lon, (v) => v / 1e5);
    this.stopStation = Int32Array.from(stops.par);
    this.stopMode = Uint8Array.from(stops.mode); // bit 1 = bus, bit 2 = train, bit 4 = ferry
    this.stationName = stops.st.name;
    this.stationLat = Float64Array.from(stops.st.lat, (v) => v / 1e5);
    this.stationLon = Float64Array.from(stops.st.lon, (v) => v / 1e5);
    this.stationStops = Array.from({ length: this.stationName.length }, () => []);
    this.stopStation.forEach((p, i) => { if (p >= 0) this.stationStops[p].push(i); });
    this.stationMode = new Uint8Array(this.stationName.length);
    this.stationStops.forEach((kids, s) => { for (const k of kids) this.stationMode[s] |= this.stopMode[k]; });

    // patterns
    this.patterns = core.patterns.map(([route, dir, shape, hs, stopIdx, deltas], idx) => {
      const dist = new Float64Array(deltas.length);
      let acc = 0;
      for (let i = 0; i < deltas.length; i++) { acc += deltas[i]; dist[i] = acc; }
      return { idx, route: routeMap[route], dir, shape, hs, stops: Int32Array.from(stopIdx), dist };
    });

    // profiles (timing variants) and their trips
    this.profiles = [];
    this.patternProfiles = Array.from({ length: this.patterns.length }, () => []);
    this.maxDur = 0;
    this.tripCount = 0;
    trips.forEach((plist, pi) => {
      for (const [a, flatDw, st, svcs] of plist) {
        const arr = new Int32Array(a.length);
        let acc = 0;
        for (let i = 0; i < a.length; i++) { acc += a[i]; arr[i] = acc; }
        const dw = new Int32Array(a.length);
        for (let j = 0; j < flatDw.length; j += 2) dw[flatDw[j]] = flatDw[j + 1];
        const starts = new Int32Array(st.length);
        acc = 0;
        for (let i = 0; i < st.length; i++) { acc += st[i]; starts[i] = acc; }
        const prof = { idx: this.profiles.length, pattern: pi, arr, dw, starts, svc: Uint16Array.from(svcs), dur: arr[arr.length - 1] };
        this.maxDur = Math.max(this.maxDur, prof.dur);
        this.tripCount += starts.length;
        this.profiles.push(prof);
        this.patternProfiles[pi].push(prof.idx);
      }
    });

    // calendar
    this._svc = core.cal.svc;
    this._exByDate = new Map();
    for (const [s, ymd, type] of core.cal.ex) {
      if (!this._exByDate.has(ymd)) this._exByDate.set(ymd, []);
      this._exByDate.get(ymd).push([s, type]);
    }
    this._flags = new Map();
    this._runs = new Map();
    this._stopIndex = null;
    this._routePatterns = null;
  }

  // ------------------------------------------------------------ geometry access
  geom(shapeIdx) {
    return this._geom[shapeIdx] || (this._geom[shapeIdx] = buildGeom(this._shapeEnc[shapeIdx]));
  }

  // ------------------------------------------------------------ service calendar
  serviceFlags(ymd) {
    let f = this._flags.get(ymd);
    if (f) return f;
    f = new Uint8Array(this._svc.length);
    const dow = ymdToDow(ymd);
    for (let s = 0; s < this._svc.length; s++) {
      const [mask, start, end] = this._svc[s];
      if (start <= ymd && ymd <= end && (mask >> dow) & 1) f[s] = 1;
    }
    for (const [s, type] of this._exByDate.get(ymd) || []) f[s] = type === 1 ? 1 : 0;
    this._flags.set(ymd, f);
    return f;
  }

  /** True when the timetable covers this date at all. */
  covers(ymd) {
    return ymd >= this.meta.validFrom && ymd <= this.meta.validTo;
  }

  /** True when the timetable changes the usual service on this date (public holidays, special events). */
  hasChanges(ymd) {
    return this._exByDate.has(ymd);
  }

  /**
   * An ordinary covered day with the same weekday as `ymd`, for showing a typical day when `ymd`
   * itself is outside the timetable. Skips the first week (it may be partial) and days with changes.
   */
  typicalDay(ymd) {
    const dow = ymdToDow(ymd);
    let fallback = null;
    for (let d = addDays(this.meta.validFrom, 7); d <= this.meta.validTo; d = addDays(d, 1)) {
      if (ymdToDow(d) !== dow) continue;
      if (!this.hasChanges(d)) return d;
      if (fallback === null) fallback = d;
    }
    return fallback ?? this.meta.validFrom;
  }

  // ------------------------------------------------------------ runs of a service day
  runsForDay(ymd) {
    let r = this._runs.get(ymd);
    if (r) return r;
    const flags = this.serviceFlags(ymd);
    const s = [], e = [], p = [], t = [];
    for (const prof of this.profiles) {
      const st = prof.starts, sv = prof.svc;
      for (let i = 0; i < st.length; i++) {
        if (flags[sv[i]]) { s.push(st[i] + prof.arr[0]); e.push(st[i] + prof.dur); p.push(prof.idx); t.push(i); }
      }
    }
    const order = Int32Array.from({ length: s.length }, (_, i) => i).sort((a, b) => s[a] - s[b] || a - b);
    const n = order.length;
    r = { n, start: new Int32Array(n), end: new Int32Array(n), prof: new Int32Array(n), ti: new Int32Array(n) };
    for (let i = 0; i < n; i++) {
      const o = order[i];
      r.start[i] = s[o]; r.end[i] = e[o]; r.prof[i] = p[o]; r.ti[i] = t[o];
    }
    if (this._runs.size > 6) this._runs.delete(this._runs.keys().next().value);
    this._runs.set(ymd, r);
    return r;
  }

  /** Runs in progress at `sec` seconds after Perth midnight of `ymd`. Each: { prof, ti, t0, day }. */
  active(ymd, sec) {
    const out = [];
    for (const [dayYmd, shift, day] of [[ymd, 0, 0], [addDays(ymd, -1), -DAY, 1]]) {
      const R = this.runsForDay(dayYmd);
      const tt = sec - shift;
      let lo = 0, hi = R.n;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (R.start[mid] <= tt) lo = mid + 1; else hi = mid;
      }
      for (let i = lo - 1; i >= 0 && R.start[i] >= tt - this.maxDur - 1; i--) {
        if (R.end[i] > tt) {
          out.push({ prof: R.prof[i], ti: R.ti[i], t0: this.profiles[R.prof[i]].starts[R.ti[i]] + shift, day });
        }
      }
    }
    return out;
  }

  /** Position and state of one run at `sec` (same clock as run.t0). Returns null when not running. */
  position(run, sec) {
    const prof = this.profiles[run.prof];
    const pat = this.patterns[prof.pattern];
    const n = prof.arr.length;
    const tau = sec - run.t0;
    if (tau < prof.arr[0] || tau > prof.arr[n - 1]) return null;
    const mo = prof.mo === undefined ? (prof.mo = this._motion(prof)) : prof.mo;
    if (mo) return this._movePosition(prof, pat, mo, tau);
    const arr = prof.ta || (prof.ta = smoothTimes(prof.arr)); // animation times, see smoothTimes
    let lo = 0, hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (arr[mid] <= tau) lo = mid; else hi = mid - 1;
    }
    const k = lo;
    const dep = arr[k] + prof.dw[k];
    let d, state, nextK;
    if (k === n - 1) { d = pat.dist[k]; state = 'end'; nextK = k; }
    else if (tau < dep) { d = pat.dist[k]; state = 'dwell'; nextK = k + 1; }
    else {
      const span = arr[k + 1] - dep;
      const f = span > 0 ? (tau - dep) / span : 1;
      d = pat.dist[k] + (pat.dist[k + 1] - pat.dist[k]) * f;
      state = 'move'; nextK = k + 1;
    }
    const out = { k, nextK, state, dist: d, pattern: pat.idx, prof: prof.idx };
    pointAt(this.geom(pat.shape), d, out);
    return out;
  }

  /**
   * Stop and run timings for a train or ferry profile (see MOTION), or null for buses. Per stop:
   * arrive / depart (seconds after trip start). Per run k (stop k to k + 1): acceleration and top speed.
   */
  _motion(prof) {
    const pat = this.patterns[prof.pattern];
    const cfg = MOTION[this.routes[pat.route].mode];
    if (!cfg) return null;
    const ta = prof.ta || (prof.ta = smoothTimes(prof.arr));
    const n = ta.length;
    const arrive = new Float64Array(n), depart = new Float64Array(n), acc = new Float64Array(n), top = new Float64Array(n);
    arrive[0] = ta[0];
    depart[0] = ta[0] + prof.dw[0];
    for (let k = 1; k < n; k++) {
      const s = pat.dist[k] - pat.dist[k - 1];
      if (k === n - 1) { arrive[k] = depart[k] = ta[k]; }
      else if (prof.dw[k] > 0) { arrive[k] = ta[k]; depart[k] = ta[k] + prof.dw[k]; } // the timetable has a real stopping time
      else {
        const late = ta[k] + cfg.late;
        const earliest = Math.min(depart[k - 1] + minRun(s, cfg.acc, cfg.top), late);
        depart[k] = Math.min(Math.max(ta[k], earliest + cfg.minDwell), late); // on time, or as soon as a short stop allows
        arrive[k] = Math.max(earliest, depart[k] - cfg.dwell);
      }
      if (arrive[k] < depart[k - 1]) { arrive[k] = depart[k - 1]; depart[k] = Math.max(depart[k], arrive[k]); } // keep times in order
      const T = arrive[k] - depart[k - 1];
      if (T > 0 && s > 0) {
        const a = cfg.acc * T * T >= 4 * s ? cfg.acc : (4 * s) / (T * T); // too little time: accelerate harder
        acc[k - 1] = a;
        top[k - 1] = (a * T - Math.sqrt(Math.max(0, a * a * T * T - 4 * a * s))) / 2;
      }
    }
    return { arrive, depart, acc, top };
  }

  _movePosition(prof, pat, mo, tau) {
    const n = mo.arrive.length;
    let lo = 0, hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (mo.arrive[mid] <= tau) lo = mid; else hi = mid - 1;
    }
    const k = lo;
    let d, state, nextK;
    if (k === n - 1) { d = pat.dist[k]; state = 'end'; nextK = k; }
    else if (tau < mo.depart[k]) { d = pat.dist[k]; state = 'dwell'; nextK = k + 1; }
    else {
      const s = pat.dist[k + 1] - pat.dist[k], T = mo.arrive[k + 1] - mo.depart[k];
      d = pat.dist[k] + (mo.acc[k] > 0 ? runDistance(s, T, mo.acc[k], mo.top[k], tau - mo.depart[k]) : s);
      state = 'move'; nextK = k + 1;
    }
    const out = { k, nextK, state, dist: d, pattern: pat.idx, prof: prof.idx };
    pointAt(this.geom(pat.shape), d, out);
    return out;
  }

  /** Animation arrival times (seconds after trip start) for a profile, one per stop. */
  animTimes(profIdx) {
    const prof = this.profiles[profIdx];
    return prof.ta || (prof.ta = smoothTimes(prof.arr));
  }

  /** Current vehicles at (ymd, sec). */
  vehicles(ymd, sec) {
    const list = [];
    for (const run of this.active(ymd, sec)) {
      const pos = this.position(run, sec);
      if (!pos) continue;
      const pat = this.patterns[pos.pattern];
      const route = this.routes[pat.route];
      list.push({
        id: run.day * 2 ** 40 + run.prof * 2 ** 20 + run.ti,
        run, lat: pos.lat, lon: pos.lon, bearing: pos.bearing, dist: pos.dist,
        route: pat.route, type: route.type, pattern: pat.idx, state: pos.state, k: pos.k, nextK: pos.nextK,
      });
    }
    return list;
  }

  /** What a vehicle is doing: headsign, current/next stop and minutes to the next stop. */
  describe(v, sec) {
    const pat = this.patterns[v.pattern];
    const prof = this.profiles[v.run.prof];
    const route = this.routes[pat.route];
    const last = pat.stops.length - 1;
    const hs = this.headsigns[pat.hs] || this.stopName[pat.stops[last]];
    const nextStop = pat.stops[Math.min(v.nextK, last)];
    const etaSec = v.run.t0 + prof.arr[Math.min(v.nextK, last)] - sec;
    return {
      route, headsign: hs, state: v.state,
      stopName: this.stopName[pat.stops[v.k]],
      nextStopName: this.stopName[nextStop], nextStop, etaSec,
      // distance along the route, so a two-stop trip (the ferry) still fills the bar as it goes
      progress: pat.dist[last] > pat.dist[0] ? Math.min(1, Math.max(0, ((v.dist ?? pat.dist[v.k]) - pat.dist[0]) / (pat.dist[last] - pat.dist[0]))) : 0,
      destination: this.stopName[pat.stops[last]],
    };
  }

  // ------------------------------------------------------------ stop to profile index
  _buildStopIndex() {
    const idx = new Map();
    for (const prof of this.profiles) {
      const stops = this.patterns[prof.pattern].stops;
      for (let k = 0; k < stops.length - 1; k++) { // the last stop is arrival only
        const s = stops[k];
        let a = idx.get(s);
        if (!a) idx.set(s, (a = []));
        a.push(prof.idx, k);
      }
    }
    this._stopIndex = idx;
  }

  /** Stop indexes that belong to an entity: { kind: 'station' | 'stop', idx }. */
  entityStops(e) {
    return e.kind === 'station' ? this.stationStops[e.idx] : [e.idx];
  }

  /** Next departures from a set of stops after `sec` on `ymd`. */
  departures(stopIdxs, ymd, sec, { limit = 8, horizon = 5400 } = {}) {
    if (!this._stopIndex) this._buildStopIndex();
    const collect = (hz) => {
      const res = [];
      for (const [shift, dayYmd] of [[-DAY, addDays(ymd, -1)], [0, ymd], [DAY, addDays(ymd, 1)]]) {
        const flags = this.serviceFlags(dayYmd);
        for (const s of stopIdxs) {
          const a = this._stopIndex.get(s);
          if (!a) continue;
          for (let q = 0; q < a.length; q += 2) {
            const prof = this.profiles[a[q]], k = a[q + 1];
            const depOff = prof.arr[k] + prof.dw[k];
            const target = sec - shift - depOff;
            let lo = 0, hi = prof.starts.length;
            while (lo < hi) {
              const mid = (lo + hi) >> 1;
              if (prof.starts[mid] < target) lo = mid + 1; else hi = mid;
            }
            let got = 0;
            for (let j = lo; j < prof.starts.length && got < limit; j++) {
              if (!flags[prof.svc[j]]) continue;
              const t = prof.starts[j] + depOff + shift;
              if (t > sec + hz) break;
              const pat = this.patterns[prof.pattern];
              res.push({ t, stop: s, route: pat.route, pattern: pat.idx, k, prof: prof.idx, ti: j });
              got++;
            }
          }
        }
      }
      return res;
    };
    let res = collect(horizon);
    if (res.length < Math.min(limit, 3) && horizon < DAY) res = collect(DAY);
    res.sort((x, y) => x.t - y.t || x.route - y.route);
    return res.slice(0, limit).map((d) => {
      const pat = this.patterns[d.pattern];
      const last = pat.stops[pat.stops.length - 1];
      return { ...d, headsign: this.headsigns[pat.hs] || this.stopName[last], destination: this.stopName[last] };
    });
  }

  // ------------------------------------------------------------ routes
  _buildRoutePatterns() {
    this._routePatterns = Array.from({ length: this.routes.length }, () => []);
    for (const p of this.patterns) this._routePatterns[p.route].push(p.idx);
  }

  routePatterns(routeIdx) {
    if (!this._routePatterns) this._buildRoutePatterns();
    return this._routePatterns[routeIdx];
  }

  /**
   * How often a route runs on a service day, from the timetable: trips leaving their first stop in each hour
   * (hours past midnight run on to 29 for after-midnight trips), the busiest single direction in that hour,
   * and the first and last departure. It says nothing about how full the vehicles are.
   * Takes one route index or several (see sameNameRoutes).
   */
  routeDay(routeIdxs, ymd) {
    const H = 30, flags = this.serviceFlags(ymd);
    const all = new Uint16Array(H), byDir = new Map();
    let first = Infinity, last = -Infinity, trips = 0;
    for (const pi of [].concat(routeIdxs).flatMap((ri) => this.routePatterns(ri))) {
      const dir = this.patterns[pi].dir;
      let d = byDir.get(dir);
      if (!d) byDir.set(dir, (d = new Uint16Array(H)));
      for (const q of this.patternProfiles[pi]) {
        const p = this.profiles[q];
        for (let i = 0; i < p.starts.length; i++) {
          if (!flags[p.svc[i]]) continue;
          const t = p.starts[i] + p.arr[0], hr = Math.min(H - 1, Math.floor(t / 3600));
          all[hr]++; d[hr]++; trips++;
          if (t < first) first = t;
          if (t > last) last = t;
        }
      }
    }
    const oneWay = new Uint16Array(H);
    for (const d of byDir.values()) for (let hr = 0; hr < H; hr++) if (d[hr] > oneWay[hr]) oneWay[hr] = d[hr];
    return { all, oneWay, dirs: byDir.size, first, last, trips };
  }

  /** Public route identity (contract duplicates have already been coalesced at load). */
  sameNameRoutes(routeIdx) {
    const r = this.routes[routeIdx];
    return this.routes.filter((x) => x.short === r.short && x.long === r.long && x.type === r.type).map((x) => x.idx);
  }

  routeShapes(routeIdx) {
    return [...new Set(this.routePatterns(routeIdx).map((pi) => this.patterns[pi].shape))];
  }

  /** Headsigns for a route, busiest first: [{ headsign, dir, trips }]. */
  routeHeadsigns(routeIdx) {
    const m = new Map();
    for (const pi of this.routePatterns(routeIdx)) {
      const p = this.patterns[pi];
      const trips = this.patternProfiles[pi].reduce((a, q) => a + this.profiles[q].starts.length, 0);
      const last = p.stops[p.stops.length - 1];
      const name = this.headsigns[p.hs] || this.stopName[last];
      const key = `${p.dir}|${name}`;
      m.set(key, (m.get(key) || 0) + trips);
    }
    return [...m.entries()].map(([k, trips]) => {
      const [dir, headsign] = [Number(k.split('|')[0]), k.slice(k.indexOf('|') + 1)];
      return { dir, headsign, trips };
    }).sort((a, b) => b.trips - a.trips);
  }

  routeBounds(routeIdx) {
    let w = 180, s = 90, e = -180, n = -90;
    for (const si of this.routeShapes(routeIdx)) {
      const g = this.geom(si);
      for (let i = 0; i < g.n; i++) {
        if (g.lon[i] < w) w = g.lon[i];
        if (g.lon[i] > e) e = g.lon[i];
        if (g.lat[i] < s) s = g.lat[i];
        if (g.lat[i] > n) n = g.lat[i];
      }
    }
    return [[w, s], [e, n]];
  }

  /** Routes that call at the given stops. */
  routesAt(stopIdxs) {
    if (!this._stopIndex) this._buildStopIndex();
    const set = new Set();
    for (const s of stopIdxs) {
      const a = this._stopIndex.get(s);
      if (!a) continue;
      for (let q = 0; q < a.length; q += 2) set.add(this.patterns[this.profiles[a[q]].pattern].route);
    }
    return [...set].sort((a, b) => a - b);
  }

  // ------------------------------------------------------------ search
  _prepSearch() {
    this._sRoutes = this.routes.map((r) => ({
      r, key: `${r.short} ${r.long}`.toLowerCase(),
    }));
    this._entities = [];
    for (let i = 0; i < this.stationName.length; i++) this._entities.push({ kind: 'station', idx: i });
    for (let i = 0; i < this.stopCount; i++) if (this.stopStation[i] < 0) this._entities.push({ kind: 'stop', idx: i });
    // Match what people see ("Station") as well as the feed's abbreviation ("Stn").
    this._eKey = this._entities.map((e) => {
      const raw = this.entityName(e);
      const pretty = raw.replace(/\bStn\b/g, 'Station');
      return `${pretty} ${e.kind === 'stop' ? this.stopCode[e.idx] : ''}${pretty !== raw ? ` ${raw}` : ''}`.toLowerCase();
    });
  }

  entityName(e) { return e.kind === 'station' ? this.stationName[e.idx] : this.stopName[e.idx]; }
  entityLat(e) { return e.kind === 'station' ? this.stationLat[e.idx] : this.stopLat[e.idx]; }
  entityLon(e) { return e.kind === 'station' ? this.stationLon[e.idx] : this.stopLon[e.idx]; }
  entityMode(e) { return e.kind === 'station' ? this.stationMode[e.idx] : this.stopMode[e.idx]; }

  searchRoutes(q, limit = 40) {
    if (!this._sRoutes) this._prepSearch();
    q = q.trim().toLowerCase();
    if (!q) return this.routes.slice(0, limit);
    const scored = [];
    for (const { r, key } of this._sRoutes) {
      const short = r.short.toLowerCase();
      let score = -1;
      if (short === q) score = 0;
      else if (short.startsWith(q)) score = 1;
      else if (key.includes(q)) score = 2;
      if (score >= 0) scored.push([score, r.idx]);
    }
    scored.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return scored.slice(0, limit).map(([, i]) => this.routes[i]);
  }

  searchEntities(q, limit = 30) {
    if (!this._entities) this._prepSearch();
    const toks = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!toks.length) return [];
    const scored = [];
    for (let i = 0; i < this._entities.length; i++) {
      const key = this._eKey[i];
      let ok = true, score = this._entities[i].kind === 'station' ? 0 : 3;
      for (const t of toks) {
        const at = key.indexOf(t);
        if (at < 0) { ok = false; break; }
        score += at === 0 ? 0 : key[at - 1] === ' ' ? 1 : 2;
      }
      if (ok) scored.push([score, key.length, i]);
    }
    scored.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return scored.slice(0, limit).map(([, , i]) => this._entities[i]);
  }

  nearestEntities(lat, lon, limit = 12, modeMask = 7) {
    if (!this._entities) this._prepSearch();
    const best = [];
    for (const e of this._entities) {
      if (!(this.entityMode(e) & modeMask)) continue;
      const d = flatDistance(lat, lon, this.entityLat(e), this.entityLon(e));
      if (best.length < limit || d < best[best.length - 1].d) {
        let i = best.length;
        while (i > 0 && best[i - 1].d > d) i--;
        best.splice(i, 0, { ...e, d });
        if (best.length > limit) best.pop();
      }
    }
    return best;
  }

  // ------------------------------------------------------------ the day's heartbeat
  /** Vehicles running at each bin start across the Perth service day: { total, bus, train, ferry, bin }. */
  heartbeat(ymd, binSec = 300) {
    const nb = DAY / binSec;
    const bus = new Uint16Array(nb), train = new Uint16Array(nb), ferry = new Uint16Array(nb);
    for (const [dayYmd, shift] of [[ymd, 0], [addDays(ymd, -1), -DAY]]) {
      const R = this.runsForDay(dayYmd);
      for (let i = 0; i < R.n; i++) {
        const s = R.start[i] + shift, e = R.end[i] + shift;
        if (e <= 0 || s >= DAY) continue;
        const route = this.routes[this.patterns[this.profiles[R.prof[i]].pattern].route];
        const from = Math.max(0, Math.ceil(s / binSec)), to = Math.min(nb - 1, Math.ceil(e / binSec) - 1);
        const a = route.isTrain ? train : route.isFerry ? ferry : bus;
        for (let b = from; b <= to; b++) a[b]++;
      }
    }
    const total = new Uint16Array(nb);
    for (let b = 0; b < nb; b++) total[b] = bus[b] + train[b] + ferry[b];
    return { total, bus, train, ferry, bin: binSec };
  }
}
