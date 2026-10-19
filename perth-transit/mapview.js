// mapview.js: the map, its layers, the moving vehicles and what happens on click.
import * as maplibregl from './vendor/maplibre-gl.mjs';
import { routeColor, busColor, ferryColor, setColorTheme, chipLabel, textOn } from './colors.js?v=1.9.1';
import { prettyName } from './util.js?v=1.9.1';

export const STYLE_URLS = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
};
// From this zoom on, buses show as route-number tags with a direction pointer.
const TAG_Z = 15; // a whole zoom: per-vehicle zoom rules are evaluated at the tile's whole-number zoom
const TAG_H = 18, TAG_LINE = 1.6, TAG_FONT = '700 11.5px Archivo, system-ui, sans-serif';
const TIP = 20; // pointer image size; its triangle's base sits 0.24 * TIP below the image centre
const fallbackStyle = (theme) => ({ version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': theme === 'dark' ? '#0c0c0c' : '#eef1f2' } }] });

// Colours of everything this app draws on top of the basemap, per theme.
const PAL = {
  light: {
    casing: '#ffffff', rail: '#56677a', stopFill: '#ffffff', stationStroke: '#15222e', accent: '#0a6c74',
    accentFill: 'rgba(10,108,116,0.14)', meStroke: '#ffffff', halo: '#ffffff', ring: '#15222e',
    label: '#15222e', labelHalo: 'rgba(255,255,255,0.95)', building: '#d3dade', busLine: 0.32, tagHalo: '#ffffff',
  },
  dark: {
    casing: '#262e35', rail: '#8a99a8', stopFill: '#161d23', stationStroke: '#e4ebf0', accent: '#4cc0c8',
    accentFill: 'rgba(76,192,200,0.18)', meStroke: '#0c0c0c', halo: '#0c0c0c', ring: '#e4ebf0',
    label: '#e4ebf0', labelHalo: 'rgba(12,12,12,0.9)', building: '#2a3036', busLine: 0.4, tagHalo: '#0c0c0c',
  },
};

const empty = () => ({ type: 'FeatureCollection', features: [] });

export class MapView {
  constructor(container, net, handlers) {
    this.container = container;
    this.net = net;
    this.h = handlers;
    this.byId = new Map();
    this.routeSel = null;
    this.mode = 'all';
    this._modes = null; // null = every mode, else a Set of route modes to draw
    this.kids = false; // Perth Train Spotter: bigger vehicles, coloured train lines, train stations only
    this.following = null;
    // padding to keep the followed vehicle in (kids' page: the part of the map the card and dock leave free).
    // Applied inside each follow step: a separate map.setPadding() is a jump that stops running eases and gestures.
    this.followPadding = null;
    this.padding = { top: 0, right: 0, bottom: 0, left: 0 };
    // what the viewer has set, so it can be put back after the basemap changes (dark mode)
    this.theme = 'light';
    this.selVid = null;
    this.hidden = new Set();
    this.is3D = false;
    this._styles = {};
  }

  async _loadStyle(theme) {
    if (this._styles[theme]) return this._styles[theme];
    let style = fallbackStyle(theme), ok = false;
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch(STYLE_URLS[theme], { signal: ctl.signal });
      clearTimeout(timer);
      if (!r.ok) throw new Error(`style ${r.status}`);
      style = await r.json();
      ok = true;
    } catch (err) {
      console.warn('Basemap style unavailable, using a plain background.', err);
    }
    const res = { style, ok };
    if (ok) this._styles[theme] = res;
    return res;
  }

  async init(view, { compactAttribution, theme = 'light', kids = false }) {
    this.theme = theme;
    this.kids = kids;
    setColorTheme(theme);
    // Timetable interaction must not wait for a third-party style, tiles or fonts.
    const basemap = this._loadStyle(theme);
    this.basemapOk = false;
    this.hasBuildings = false;
    const map = (this.map = new maplibregl.Map({
      container: this.container, style: fallbackStyle(theme),
      center: [view.lon, view.lat], zoom: view.zoom, minZoom: 7.5, maxZoom: 19, maxPitch: 70,
      attributionControl: false, dragRotate: true, touchPitch: true,
    }));
    map.addControl(new maplibregl.AttributionControl({
      compact: compactAttribution,
      customAttribution: 'Timetable data from the Public Transport Authority of WA',
    }), compactAttribution ? 'top-left' : 'bottom-right');
    await new Promise((res) => map.once('load', res));
    if (compactAttribution) {
      // MapLibre opens the compact credit on load; fold it away after a few seconds so it does not cover the controls.
      setTimeout(() => {
        const a = this.container.querySelector('.maplibregl-ctrl-attrib');
        if (a) a.classList.remove('maplibregl-compact-show');
      }, 4000);
    }
    this._addData();
    this._wire();
    // Invalidate measured tags when the optional font arrives; fallback text works meanwhile.
    document.fonts.load(TAG_FONT).then(() => {
      this._tags?.clear();
      this._tagById?.clear();
      for (const id of map.listImages()) if (id.startsWith('tag|')) map.removeImage(id);
      if (this._lastVehicles) this.setVehicles(this._lastVehicles);
    }).catch(() => {});
    basemap.then(({ ok }) => {
      if (ok && this.theme === theme) return this.setTheme(theme, { force: true });
    }).catch((err) => console.warn('Basemap upgrade unavailable.', err));
    return this;
  }

  // ------------------------------------------------------------------ data and layers
  _lineFeatures() {
    if (this._lines) return this._lines;
    const net = this.net;
    const shapeIsTrain = new Set(), shapeIsBus = new Set(), shapeIsFerry = new Set(), lineColor = new Map();
    for (const p of net.patterns) {
      const r = net.routes[p.route];
      (r.isTrain ? shapeIsTrain : r.isFerry ? shapeIsFerry : shapeIsBus).add(p.shape);
      if (r.isTrain && !lineColor.has(p.shape)) lineColor.set(p.shape, routeColor(r)); // train line colours do not change with the theme
    }
    const mk = (set) => ({
      type: 'FeatureCollection',
      features: [...set].map((si) => {
        const g = net.geom(si);
        const coords = new Array(g.n);
        for (let i = 0; i < g.n; i++) coords[i] = [g.lon[i], g.lat[i]];
        return { type: 'Feature', properties: { s: si, c: lineColor.get(si) || null }, geometry: { type: 'LineString', coordinates: coords } };
      }),
    });
    return (this._lines = { bus: mk(shapeIsBus), rail: mk(shapeIsTrain), ferry: mk(shapeIsFerry) });
  }

  _addData() {
    const map = this.map, net = this.net;
    const layers = map.getStyle().layers;
    const firstSymbol = (layers.find((l) => l.type === 'symbol') || {}).id;
    const { bus, rail, ferry } = this._lineFeatures();
    const P = PAL[this.theme], BUS = busColor();
    const addImage = (name, img, opts) => { if (map.hasImage(name)) map.removeImage(name); map.addImage(name, img, opts); };

    // arrow image for heading marks (SDF so it can be tinted)
    const c = document.createElement('canvas');
    c.width = c.height = 48;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.beginPath(); g.moveTo(24, 6); g.lineTo(40, 40); g.lineTo(24, 31); g.lineTo(8, 40); g.closePath(); g.fill();
    addImage('ptm-arrow', g.getImageData(0, 0, 48, 48), { sdf: true });

    // vehicle bodies, drawn pointing north and rotated by bearing: a short pill for buses, a long bar for trains.
    // Each type gets a white outline image, an SDF body (tinted with the route colour) and a white front mark.
    const PR = 2, PAD = 3;
    const vehImg = (name, w, h, shape = 'pill') => {
      const W = (w + PAD * 2) * PR, H = (h + PAD * 2) * PR;
      const draw = (fn) => {
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const x = cv.getContext('2d'); x.scale(PR, PR); x.fillStyle = '#fff'; fn(x);
        return x.getImageData(0, 0, W, H);
      };
      const pill = (x, inset) => {
        x.beginPath(); x.roundRect(PAD - inset, PAD - inset, w + inset * 2, h + inset * 2, Math.min(w / 2 + inset, 4 + inset)); x.fill();
      };
      // ferries get a boat outline: pointed bow (the front), square stern
      const boat = (x, inset) => {
        const l = PAD - inset, r = PAD + w + inset, t = PAD - inset, b = PAD + h + inset, m = PAD + w / 2;
        x.beginPath(); x.moveTo(m, t);
        x.bezierCurveTo(r, t + h * 0.22, r, t + h * 0.45, r, t + h * 0.55);
        x.lineTo(r, b - 2); x.quadraticCurveTo(r, b, r - 2, b); x.lineTo(l + 2, b); x.quadraticCurveTo(l, b, l, b - 2);
        x.lineTo(l, t + h * 0.55); x.bezierCurveTo(l, t + h * 0.45, l, t + h * 0.22, m, t);
        x.closePath(); x.fill();
      };
      const body = shape === 'boat' ? boat : pill;
      addImage(name + '-halo', draw((x) => body(x, 1.6)), { pixelRatio: PR, sdf: true });
      addImage(name, draw((x) => body(x, 0)), { pixelRatio: PR, sdf: true });
      addImage(name + '-front', draw((x) => {
        x.beginPath(); x.moveTo(PAD + w / 2, PAD + 1.5); x.lineTo(PAD + w - 1.6, PAD + 1.5 + w * 0.45);
        x.lineTo(PAD + 1.6, PAD + 1.5 + w * 0.45); x.closePath(); x.fill();
      }), { pixelRatio: PR });
    };
    vehImg('ptm-bus', 9, 17);
    vehImg('ptm-train', 9, 44);
    vehImg('ptm-ferry', 12, 24, 'boat');

    {
      // direction pointer that sits on the tag's edge, pointing the way the bus travels
      // (the tags themselves are drawn on demand, one image per route label: see _tagImage)
      const T = TIP * PR, tip = document.createElement('canvas');
      tip.width = tip.height = T;
      const tg = tip.getContext('2d');
      const tri = (inset) => { tg.beginPath(); tg.moveTo(T / 2, T * 0.08 + inset); tg.lineTo(T * 0.92 - inset, T * 0.74 - inset * 0.5); tg.lineTo(T * 0.08 + inset, T * 0.74 - inset * 0.5); tg.closePath(); tg.fill(); };
      tg.fillStyle = P.tagHalo; tri(0);
      tg.fillStyle = '#000'; tg.globalCompositeOperation = 'destination-out'; tri(TAG_LINE * PR * 1.4); // hole, refilled in the route colour below
      tg.globalCompositeOperation = 'source-over';
      addImage('ptm-tip-ring', tg.getImageData(0, 0, T, T), { pixelRatio: PR });
      tg.clearRect(0, 0, T, T); tg.fillStyle = '#fff'; tri(TAG_LINE * PR * 1.4);
      addImage('ptm-tip', tg.getImageData(0, 0, T, T), { pixelRatio: PR, sdf: true });
    }

    map.addSource('bus-routes', { type: 'geojson', data: bus });
    map.addSource('rail', { type: 'geojson', data: rail });
    map.addSource('ferry', { type: 'geojson', data: ferry });
    map.addSource('route-hi', { type: 'geojson', data: empty() });
    const st = { type: 'FeatureCollection', features: [] };
    for (let i = 0; i < net.stationName.length; i++) {
      // The feed also groups on-street bus stops under a parent. Only real stations and bus stations get the big marker.
      const raw = net.stationName[i];
      const big = (net.stationMode[i] & 6) || (!this.kids && /(Bus Stn|Busport)$/.test(raw)) ? 1 : 0; // train stations, jetties, bus stations (kids: no bus stations)
      st.features.push({ type: 'Feature', properties: { i, n: prettyName(raw), m: net.stationMode[i], big },
        geometry: { type: 'Point', coordinates: [net.stationLon[i], net.stationLat[i]] } });
    }
    const sp = { type: 'FeatureCollection', features: [] };
    for (let i = 0; i < net.stopCount; i++) {
      if (net.stopStation[i] < 0 && (net.stopMode[i] & 1)) {
        sp.features.push({ type: 'Feature', properties: { i },
          geometry: { type: 'Point', coordinates: [net.stopLon[i], net.stopLat[i]] } });
      }
    }
    map.addSource('stations', { type: 'geojson', data: st });
    map.addSource('stops', { type: 'geojson', data: sp });
    map.addSource('sel', { type: 'geojson', data: empty() });
    map.addSource('me', { type: 'geojson', data: empty() });
    map.addSource('veh', { type: 'geojson', data: empty() });
    map.addSource('favourite-places', { type: 'geojson', data: this._placesData || empty() });

    const round = { 'line-cap': 'round', 'line-join': 'round' };
    map.addLayer({ id: 'bus-routes', type: 'line', source: 'bus-routes', layout: round, paint: {
      'line-color': BUS,
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.1, 12, 0.15, 15, P.busLine],
      'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.6, 12, 1, 15, 2.2],
    } }, firstSymbol);
    const K = this.kids ? 1.6 : 1; // kids: thicker lines in their own colours
    map.addLayer({ id: 'rail-casing', type: 'line', source: 'rail', layout: round, paint: {
      'line-color': P.casing, 'line-opacity': 0.9,
      'line-width': ['interpolate', ['linear'], ['zoom'], 8, 3 * K, 12, 5.5 * K, 15, 8 * K],
    } }, firstSymbol);
    map.addLayer({ id: 'rail', type: 'line', source: 'rail', layout: round, paint: {
      'line-color': this.kids ? ['coalesce', ['get', 'c'], P.rail] : P.rail,
      'line-opacity': this.kids ? 0.5 : 1, // kids: lighter tracks so the trains on them stand out
      'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.5 * K, 12, 3 * K, 15, 4.5 * K],
    } }, firstSymbol);
    // ferry crossing over the river, dashed so it reads as a water route
    map.addLayer({ id: 'ferry-line', type: 'line', source: 'ferry', layout: round, paint: {
      'line-color': ferryColor(), 'line-opacity': 0.85, 'line-dasharray': [1.5, 1.5],
      'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.2, 12, 2.4, 15, 3.6],
    } }, firstSymbol);
    map.addLayer({ id: 'route-hi-casing', type: 'line', source: 'route-hi', layout: round, paint: {
      'line-color': P.casing, 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 5, 12, 8, 15, 12],
    } }, firstSymbol);
    map.addLayer({ id: 'route-hi', type: 'line', source: 'route-hi', layout: round, paint: {
      'line-color': ['get', 'c'], 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 3, 12, 5, 15, 8],
    } }, firstSymbol);

    if (this.hasBuildings) {
      map.addLayer({ id: 'buildings-3d', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building',
        minzoom: 14, layout: { visibility: this.is3D ? 'visible' : 'none' }, paint: {
          'fill-extrusion-color': P.building,
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.6,
        } }, firstSymbol);
    }

    map.addLayer({ id: 'stops', type: 'circle', source: 'stops', minzoom: 14.6, paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 14.6, 2.4, 17, 5],
      'circle-color': P.stopFill, 'circle-stroke-color': BUS, 'circle-stroke-width': 1.4,
    } });
    map.addLayer({ id: 'stations-minor', type: 'circle', source: 'stations', minzoom: 14.6, filter: ['==', ['get', 'big'], 0], paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 14.6, 2.4, 17, 5],
      'circle-color': P.stopFill, 'circle-stroke-color': BUS, 'circle-stroke-width': 1.4,
    } });
    map.addLayer({ id: 'stations', type: 'circle', source: 'stations', minzoom: 8.6, filter: ['==', ['get', 'big'], 1], paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 8.6, 2.6, 12, 5.5, 15, 8],
      'circle-color': P.stopFill, 'circle-stroke-color': P.stationStroke, 'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 8.6, 1.4, 12, 2.2],
    } });
    map.addLayer({ id: 'sel-ring', type: 'circle', source: 'sel', paint: {
      'circle-radius': 14, 'circle-color': P.accentFill, 'circle-stroke-color': P.accent, 'circle-stroke-width': 3,
    } });
    map.addLayer({ id: 'me-dot', type: 'circle', source: 'me', paint: {
      'circle-radius': 7, 'circle-color': '#1a73e8', 'circle-stroke-color': P.meStroke, 'circle-stroke-width': 3,
    } });

    const r = (a, b, c3) => ['interpolate', ['linear'], ['zoom'], 8, ['+', a, ['*', ['get', 't'], 1]], 12, ['+', b, ['*', ['get', 't'], 1.4]], 16, ['+', c3, ['*', ['get', 't'], 2.2]]];
    const vehSize = this.kids // kids: big enough to see and tap from the start
      ? ['interpolate', ['linear'], ['zoom'], 8, 0.75, 12, 1.05, 15, 1.4, 17, 1.7]
      : ['interpolate', ['linear'], ['zoom'], 8, 0.34, 12, 0.62, 15, 1.0, 17, 1.35];
    const vehIcon = (suffix) => ['match', ['get', 't'], 1, 'ptm-train' + suffix, 2, 'ptm-ferry' + suffix, 'ptm-bus' + suffix];
    const vehLayout = (suffix) => ({
      'icon-image': vehIcon(suffix), 'icon-size': vehSize, 'icon-rotate': ['get', 'b'],
      'icon-rotation-alignment': 'map', 'icon-pitch-alignment': 'map',
      'icon-allow-overlap': true, 'icon-ignore-placement': true,
      // trains draw above buses where they cross
      'symbol-sort-key': ['get', 't'],
    });
    // at tag zoom the bus shapes give way to the tags; trains and the ferry keep theirs
    const busOff = (expr) => ['step', ['zoom'], expr, TAG_Z, ['case', ['==', ['get', 't'], 0], 0, expr]];
    // kids: a dark outline (light outline on the dark map), so a train never blends into its own coloured track
    const halo = this.kids ? (this.theme === 'dark' ? '#ffffff' : '#15222e') : P.halo;
    map.addLayer({ id: 'veh-halo', type: 'symbol', source: 'veh', layout: vehLayout('-halo'), paint: {
      'icon-color': halo, 'icon-opacity': busOff(['case', ['==', ['get', 'd'], 1], 0.18, 0.95]),
    } });
    map.addLayer({ id: 'veh', type: 'symbol', source: 'veh', layout: vehLayout(''), paint: {
      'icon-color': ['get', 'c'], 'icon-opacity': busOff(['case', ['==', ['get', 'd'], 1], 0.22, 1]),
    } });
    map.addLayer({ id: 'veh-arrow', type: 'symbol', source: 'veh', minzoom: this.kids ? 9 : 13.5, layout: vehLayout('-front'), paint: {
      'icon-opacity': busOff(['case', ['==', ['get', 'd'], 1], 0.2, 0.95]),
    } });
    // Bus tags (from TAG_Z): a direction pointer with an outline, then the tag itself.
    const isBus = ['==', ['get', 't'], 0];
    const shown = (on, off) => ['step', ['zoom'], 0, TAG_Z, ['case', ['==', ['get', 'd'], 1], off, on]];
    const flat = {
      'icon-allow-overlap': true, 'icon-ignore-placement': true, 'icon-rotation-alignment': 'viewport', 'icon-pitch-alignment': 'viewport',
      'icon-rotate': ['get', 'a'], 'icon-offset': ['get', 'o'], 'symbol-sort-key': ['*', -1, ['get', 'd']],
    };
    map.addLayer({ id: 'veh-tip-ring', type: 'symbol', source: 'veh', minzoom: Math.floor(TAG_Z), filter: isBus,
      layout: { ...flat, 'icon-image': 'ptm-tip-ring' }, paint: { 'icon-opacity': shown(1, 0.25) } }, 'veh-halo');
    map.addLayer({ id: 'veh-tip', type: 'symbol', source: 'veh', minzoom: Math.floor(TAG_Z), filter: isBus,
      layout: { ...flat, 'icon-image': 'ptm-tip' }, paint: { 'icon-color': ['get', 'c'], 'icon-opacity': shown(1, 0.25) } }, 'veh-halo');
    // one picture per tag (pill, outline and number together), so a tag on top fully covers the one under it
    map.addLayer({ id: 'veh-tag', type: 'symbol', source: 'veh', minzoom: Math.floor(TAG_Z), filter: isBus, layout: {
      'icon-image': ['get', 'ti'], 'icon-allow-overlap': true, 'icon-ignore-placement': true,
      'icon-pitch-alignment': 'viewport', 'symbol-sort-key': ['*', -1, ['get', 'd']], // dimmed tags under the selected route's
    }, paint: { 'icon-opacity': shown(1, 0.3) } }, 'veh-halo'); // under the shapes: trains and the ferry stay on top
    map.addLayer({ id: 'veh-sel', type: 'circle', source: 'veh', filter: ['==', ['get', 'vid'], this.selVid === null ? -1 : this.selVid], paint: {
      'circle-radius': r(8, 10, 14), 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-color': P.ring, 'circle-stroke-width': 2.5, 'circle-pitch-alignment': 'map',
    } });

    map.addLayer({ id: 'favourite-places', type: 'circle', source: 'favourite-places', paint: {
      'circle-radius': 7, 'circle-color': P.accent, 'circle-stroke-color': P.halo, 'circle-stroke-width': 2.5,
    } });
    if (this.basemapOk && map.getStyle().glyphs) {
      map.addLayer({ id: 'favourite-labels', type: 'symbol', source: 'favourite-places', layout: {
        'text-field': ['get', 'name'], 'text-font': ['Noto Sans Bold'], 'text-size': 13,
        'text-anchor': 'bottom', 'text-offset': [0, -0.8],
      }, paint: { 'text-color': P.label, 'text-halo-color': P.labelHalo, 'text-halo-width': 1.6 } });
      map.addLayer({ id: 'stations-label', type: 'symbol', source: 'stations', minzoom: 11, filter: ['==', ['get', 'big'], 1], layout: {
        'text-field': ['get', 'n'], 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 11, 10, 15, 13],
        'text-anchor': 'top', 'text-offset': [0, 0.9], 'text-optional': true, 'text-max-width': 8,
      }, paint: { 'text-color': P.label, 'text-halo-color': P.labelHalo, 'text-halo-width': 1.6 } });
    }
    for (const id of this.hidden) this.setLayerVisible(id, false);
  }

  /** Switch between the light and dark map. Redraws this app's layers on the new basemap and keeps what was selected. */
  async setTheme(theme, { force = false } = {}) {
    if ((!force && theme === this.theme) || !this.map) return;
    const version = this._styleVersion = (this._styleVersion || 0) + 1;
    this.theme = theme;
    setColorTheme(theme);
    const { style, ok } = await this._loadStyle(theme);
    if (version !== this._styleVersion) return; // switched again while loading
    this.basemapOk = ok;
    this.hasBuildings = !!(style.sources && style.sources.openmaptiles);
    this.map.setStyle(style, { diff: false });
    await new Promise((res) => this.map.once('style.load', res));
    if (version !== this._styleVersion) return;
    this._addData();
    // put back what is selected now (it may have changed while the new basemap loaded)
    if (this._selData) this.map.getSource('sel').setData(this._selData);
    if (this._meData) this.map.getSource('me').setData(this._meData);
    if (this.routeSel !== null) this.highlightRoute(this.routeSel);
    if (this._lastVehicles) this.setVehicles(this._lastVehicles);
  }

  // ------------------------------------------------------------------ interaction
  _wire() {
    const map = this.map;
    map.on('styleimagemissing', (e) => { if (e.id.startsWith('tag|')) this._tagImage(e.id); });
    const pickVehicle = (pt) => {
      const pad = this.kids ? 28 : 12; // small fingers: forgiving taps
      const hits = map.queryRenderedFeatures([[pt.x - pad, pt.y - pad], [pt.x + pad, pt.y + pad]], { layers: ['veh', 'veh-tag'].filter((l) => map.getLayer(l)) });
      let best = null, bd = 1e9;
      for (const f of hits) {
        if (f.properties.d === 1) continue;
        const p = map.project(f.geometry.coordinates);
        const d = Math.hypot(p.x - pt.x, p.y - pt.y);
        if (d < bd) { bd = d; best = f; }
      }
      return best;
    };
    map.on('click', (e) => {
      const v = pickVehicle(e.point);
      if (v) { this.h.onVehicle(v.properties.vid); return; }
      if (map.getLayer('favourite-places')) {
        const place = map.queryRenderedFeatures(e.point, { layers: ['favourite-places'] })[0];
        if (place) { this.h.onPlace(place.properties.id); return; }
      }
      const pad = 10;
      const hits = map.queryRenderedFeatures([[e.point.x - pad, e.point.y - pad], [e.point.x + pad, e.point.y + pad]], { layers: ['stations', 'stations-minor', 'stops'].filter((l) => map.getLayer(l)) });
      if (hits.length) {
        const f = hits.find((x) => x.layer.id === 'stations') || hits[0];
        this.h.onEntity({ kind: f.layer.id === 'stops' ? 'stop' : 'station', idx: f.properties.i });
        return;
      }
      this.h.onEmpty();
    });
    map.on('mousemove', (e) => {
      const near = map.queryRenderedFeatures([[e.point.x - 8, e.point.y - 8], [e.point.x + 8, e.point.y + 8]], { layers: ['veh', 'veh-tag', 'stations', 'stations-minor', 'stops', 'favourite-places'].filter((l) => map.getLayer(l)) });
      map.getCanvas().style.cursor = near.length ? 'pointer' : '';
    });
    let t = 0;
    map.on('moveend', () => {
      clearTimeout(t);
      t = setTimeout(() => this.h.onView && this.h.onView(this.view()), 250);
    });
    map.on('dragstart', () => { if (this.following !== null) { this.following = null; this.h.onUnfollow && this.h.onUnfollow(); } });
  }

  view() {
    const c = this.map.getCenter();
    return { lat: c.lat, lon: c.lng, zoom: this.map.getZoom(), pitch: this.map.getPitch() };
  }

  // ------------------------------------------------------------------ vehicles
  /** A bus's route tag: image id and half size in CSS px, cached per route and theme. */
  _tagInfo(route) {
    const key = `${this.theme}|${route.idx}`;
    let t = (this._tags || (this._tags = new Map())).get(key);
    if (!t) {
      const n = chipLabel(route), c = routeColor(route);
      const ctx = this._measure || (this._measure = document.createElement('canvas').getContext('2d'));
      ctx.font = TAG_FONT;
      const w = Math.ceil(ctx.measureText(n).width) + 12;
      t = { id: `tag|${this.theme}|${c}|${n}`, n, c, tc: textOn(c), w, hw: w / 2 + TAG_LINE, hh: TAG_H / 2 + TAG_LINE };
      this._tags.set(key, t);
      (this._tagById || (this._tagById = new Map())).set(t.id, t);
    }
    return t;
  }

  /** Draws a tag image the first time the map asks for it (styleimagemissing). */
  _tagImage(id) {
    const t = this._tagById && this._tagById.get(id);
    if (!t || this.map.hasImage(id)) return;
    const PR = 2, L = TAG_LINE, W = Math.ceil((t.w + L * 2) * PR), H = Math.ceil((TAG_H + L * 2) * PR);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d'); x.scale(PR, PR);
    const pill = (inset) => { x.beginPath(); x.roundRect(inset, inset, t.w + L * 2 - inset * 2, TAG_H + L * 2 - inset * 2, (TAG_H + L * 2) / 2 - inset); x.fill(); };
    x.fillStyle = PAL[this.theme].tagHalo; pill(0);
    x.fillStyle = t.c; pill(L);
    x.fillStyle = t.tc; x.font = TAG_FONT; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(t.n, (t.w + L * 2) / 2, (TAG_H + L * 2) / 2 + 0.5);
    this.map.addImage(id, x.getImageData(0, 0, W, H), { pixelRatio: PR });
  }

  setVehicles(list) {
    this._lastVehicles = list;
    const net = this.net;
    const feats = [];
    const bounds = this.map.getBounds();
    const latPad = (bounds.getNorth() - bounds.getSouth()) * 0.1;
    const lonPad = (bounds.getEast() - bounds.getWest()) * 0.1;
    const tagsVisible = this.map.getZoom() >= TAG_Z;
    const mapBearing = this.map.getBearing();
    this.byId.clear();
    for (const v of list) {
      this.byId.set(v.id, v);
      const route = net.routes[v.route];
      if (this._modes && !this._modes.has(route.mode)) continue;
      // Keep the complete vehicle lookup for cards/follow, but only send visible points to the map worker.
      if (v.lat < bounds.getSouth() - latPad || v.lat > bounds.getNorth() + latPad ||
          v.lon < bounds.getWest() - lonPad || v.lon > bounds.getEast() + lonPad) continue;
      const p = {
        vid: v.id, t: route.isTrain ? 1 : route.isFerry ? 2 : 0, c: routeColor(route), b: Math.round(v.bearing),
        d: !this.kids && this.routeSel !== null && this.routeSel !== v.route ? 1 : 0, // kids: every train stays tappable
      };
      if (p.t === 0 && tagsVisible) {
        // put the pointer just outside the tag's edge, in the direction the bus is heading on screen
        const tg = this._tagInfo(route), a = (((v.bearing - mapBearing) % 360) + 360) % 360, th = (a * Math.PI) / 180;
        const s = Math.abs(Math.sin(th)), c = Math.abs(Math.cos(th));
        const r = Math.min(s > 1e-3 ? tg.hw / s : 1e9, c > 1e-3 ? tg.hh / c : 1e9) + 0.24 * TIP - 1.5; // pointer base tucks under the tag
        p.ti = tg.id; p.a = Math.round(a); p.o = [0, -Math.round(r * 10) / 10];
      }
      feats.push({ type: 'Feature', properties: p, geometry: { type: 'Point', coordinates: [v.lon, v.lat] } });
    }
    // the source is missing for a moment while the basemap switches (dark mode); the next tick fills it
    const src = this.map.getSource('veh');
    if (src) src.setData({ type: 'FeatureCollection', features: feats });
    this.refollow();
    return feats.length;
  }

  /** One follow step: centre the followed vehicle (inside followPadding when set). setVehicles does this every tick;
   *  call it directly when the padding changes while no ticks run (the clock is paused). */
  refollow() {
    if (this.following === null) return; // ids can be 0, so not a truthiness test
    const v = this.byId.get(this.following);
    if (v) this.map.easeTo(this.followPadding ? { center: [v.lon, v.lat], padding: this.followPadding, duration: 0 } : { center: [v.lon, v.lat], duration: 0 });
  }

  /** 'all', one mode ('train', 'bus', 'ferry') or a list of modes. */
  setMode(mode) { this.mode = mode; this._modes = mode === 'all' ? null : new Set([].concat(mode)); }

  setSelectedVehicle(id) {
    this.selVid = id;
    if (this.map.getLayer('veh-sel')) this.map.setFilter('veh-sel', ['==', ['get', 'vid'], id === null ? -1 : id]);
  }

  follow(id) { this.following = id; }

  highlightRoute(routeIdx) {
    this.routeSel = routeIdx;
    const src = this.map.getSource('route-hi');
    if (!src) return; // basemap switching: setTheme redraws it
    if (routeIdx === null) { src.setData(empty()); return; }
    const net = this.net, color = routeColor(net.routes[routeIdx]);
    src.setData({ type: 'FeatureCollection', features: net.routeShapes(routeIdx).map((si) => {
      const g = net.geom(si);
      const coords = new Array(g.n);
      for (let i = 0; i < g.n; i++) coords[i] = [g.lon[i], g.lat[i]];
      return { type: 'Feature', properties: { c: color }, geometry: { type: 'LineString', coordinates: coords } };
    }) });
  }

  fitRoute(routeIdx) {
    this.map.fitBounds(this.net.routeBounds(routeIdx), { padding: this._pad(48), duration: 800, maxZoom: 14 });
  }

  _pad(n) {
    const p = this.padding;
    return { top: n + p.top, right: n + p.right, bottom: n + p.bottom, left: n + p.left };
  }

  showEntity(e, fly = true) {
    const net = this.net, lat = net.entityLat(e), lon = net.entityLon(e);
    this._selData = { type: 'FeatureCollection', features: [
      { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [lon, lat] } }] };
    const sel = this.map.getSource('sel');
    if (sel) sel.setData(this._selData);
    if (fly) this.map.easeTo({ center: [lon, lat], zoom: Math.max(this.map.getZoom(), 15), padding: this._pad(0), duration: 700 });
  }

  clearEntity() { this._selData = null; const sel = this.map.getSource('sel'); if (sel) sel.setData(empty()); }

  flyTo(lat, lon, zoom) { this.map.easeTo({ center: [lon, lat], zoom, padding: this._pad(0), duration: 700 }); }

  setPadding(p) { this.padding = p; }

  set3D(on) {
    const map = this.map;
    this.is3D = on;
    if (this.hasBuildings && map.getLayer('buildings-3d')) map.setLayoutProperty('buildings-3d', 'visibility', on ? 'visible' : 'none');
    map.easeTo({ pitch: on ? 62 : 0, bearing: on ? -18 : 0, zoom: on ? Math.max(map.getZoom(), 14.4) : map.getZoom(), duration: 900 });
  }

  setLayerVisible(id, vis) {
    if (vis) this.hidden.delete(id); else this.hidden.add(id);
    const ids = { bus: ['bus-routes'], stops: ['stops', 'stations-minor'], labels: ['stations-label'] }[id] || [];
    for (const l of ids) if (this.map.getLayer(l)) this.map.setLayoutProperty(l, 'visibility', vis ? 'visible' : 'none');
  }

  setPlaces(places) {
    this._placesData = { type: 'FeatureCollection', features: places.map(({ id, name, lat, lon }) => ({
      type: 'Feature', properties: { id, name }, geometry: { type: 'Point', coordinates: [lon, lat] },
    })) };
    this.map.getSource('favourite-places')?.setData(this._placesData);
  }

  setMe(lat, lon) {
    this._meData = lat === null ? null : { type: 'FeatureCollection', features: [
      { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [lon, lat] } }] };
    const me = this.map.getSource('me');
    if (me) me.setData(this._meData || empty());
  }

  resize() { this.map.resize(); }
  zoomBy(d) { this.map.easeTo({ zoom: this.map.getZoom() + d, duration: 250 }); }
  resetNorth() { this.map.easeTo({ bearing: 0, pitch: this.map.getPitch(), duration: 400 }); }
}
