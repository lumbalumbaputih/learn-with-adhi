// mapview.js: the map, its layers, the moving vehicles and what happens on click.
import * as maplibregl from './vendor/maplibre-gl.mjs';
import { routeColor, busColor, ferryColor, setColorTheme } from './colors.js';
import { prettyName } from './util.js';

export const STYLE_URLS = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
};
const fallbackStyle = (theme) => ({ version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': theme === 'dark' ? '#0c0c0c' : '#eef1f2' } }] });

// Colours of everything this app draws on top of the basemap, per theme.
const PAL = {
  light: {
    casing: '#ffffff', rail: '#56677a', stopFill: '#ffffff', stationStroke: '#15222e', accent: '#0a6c74',
    accentFill: 'rgba(10,108,116,0.14)', meStroke: '#ffffff', halo: '#ffffff', ring: '#15222e',
    label: '#15222e', labelHalo: 'rgba(255,255,255,0.95)', building: '#d3dade', busLine: 0.32,
  },
  dark: {
    casing: '#262e35', rail: '#8a99a8', stopFill: '#161d23', stationStroke: '#e4ebf0', accent: '#4cc0c8',
    accentFill: 'rgba(76,192,200,0.18)', meStroke: '#0c0c0c', halo: '#0c0c0c', ring: '#e4ebf0',
    label: '#e4ebf0', labelHalo: 'rgba(12,12,12,0.9)', building: '#2a3036', busLine: 0.4,
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
    this.following = null;
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

  async init(view, { compactAttribution, theme = 'light' }) {
    this.theme = theme;
    setColorTheme(theme);
    const { style, ok } = await this._loadStyle(theme);
    this.basemapOk = ok;
    this.hasBuildings = !!(style.sources && style.sources.openmaptiles);
    const map = (this.map = new maplibregl.Map({
      container: this.container, style,
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
    return this;
  }

  // ------------------------------------------------------------------ data and layers
  _lineFeatures() {
    const net = this.net;
    const shapeIsTrain = new Set(), shapeIsBus = new Set(), shapeIsFerry = new Set();
    for (const p of net.patterns) {
      const r = net.routes[p.route];
      (r.isTrain ? shapeIsTrain : r.isFerry ? shapeIsFerry : shapeIsBus).add(p.shape);
    }
    const mk = (set) => ({
      type: 'FeatureCollection',
      features: [...set].map((si) => {
        const g = net.geom(si);
        const coords = new Array(g.n);
        for (let i = 0; i < g.n; i++) coords[i] = [g.lon[i], g.lat[i]];
        return { type: 'Feature', properties: { s: si }, geometry: { type: 'LineString', coordinates: coords } };
      }),
    });
    return { bus: mk(shapeIsBus), rail: mk(shapeIsTrain), ferry: mk(shapeIsFerry) };
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

    map.addSource('bus-routes', { type: 'geojson', data: bus });
    map.addSource('rail', { type: 'geojson', data: rail });
    map.addSource('ferry', { type: 'geojson', data: ferry });
    map.addSource('route-hi', { type: 'geojson', data: empty() });
    const st = { type: 'FeatureCollection', features: [] };
    for (let i = 0; i < net.stationName.length; i++) {
      // The feed also groups on-street bus stops under a parent. Only real stations and bus stations get the big marker.
      const raw = net.stationName[i];
      const big = (net.stationMode[i] & 6) || /(Bus Stn|Busport)$/.test(raw) ? 1 : 0; // train stations, jetties, bus stations
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

    const round = { 'line-cap': 'round', 'line-join': 'round' };
    map.addLayer({ id: 'bus-routes', type: 'line', source: 'bus-routes', layout: round, paint: {
      'line-color': BUS,
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.1, 12, 0.15, 15, P.busLine],
      'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.6, 12, 1, 15, 2.2],
    } }, firstSymbol);
    map.addLayer({ id: 'rail-casing', type: 'line', source: 'rail', layout: round, paint: {
      'line-color': P.casing, 'line-opacity': 0.9,
      'line-width': ['interpolate', ['linear'], ['zoom'], 8, 3, 12, 5.5, 15, 8],
    } }, firstSymbol);
    map.addLayer({ id: 'rail', type: 'line', source: 'rail', layout: round, paint: {
      'line-color': P.rail,
      'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.5, 12, 3, 15, 4.5],
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
    const vehSize = ['interpolate', ['linear'], ['zoom'], 8, 0.34, 12, 0.62, 15, 1.0, 17, 1.35];
    const vehIcon = (suffix) => ['match', ['get', 't'], 1, 'ptm-train' + suffix, 2, 'ptm-ferry' + suffix, 'ptm-bus' + suffix];
    const vehLayout = (suffix) => ({
      'icon-image': vehIcon(suffix), 'icon-size': vehSize, 'icon-rotate': ['get', 'b'],
      'icon-rotation-alignment': 'map', 'icon-pitch-alignment': 'map',
      'icon-allow-overlap': true, 'icon-ignore-placement': true,
      // trains draw above buses where they cross
      'symbol-sort-key': ['get', 't'],
    });
    map.addLayer({ id: 'veh-halo', type: 'symbol', source: 'veh', layout: vehLayout('-halo'), paint: {
      'icon-color': P.halo, 'icon-opacity': ['case', ['==', ['get', 'd'], 1], 0.18, 0.95],
    } });
    map.addLayer({ id: 'veh', type: 'symbol', source: 'veh', layout: vehLayout(''), paint: {
      'icon-color': ['get', 'c'], 'icon-opacity': ['case', ['==', ['get', 'd'], 1], 0.22, 1],
    } });
    map.addLayer({ id: 'veh-arrow', type: 'symbol', source: 'veh', minzoom: 13.5, layout: vehLayout('-front'), paint: {
      'icon-opacity': ['case', ['==', ['get', 'd'], 1], 0.2, 0.95],
    } });
    map.addLayer({ id: 'veh-sel', type: 'circle', source: 'veh', filter: ['==', ['get', 'vid'], this.selVid === null ? -1 : this.selVid], paint: {
      'circle-radius': r(8, 10, 14), 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-color': P.ring, 'circle-stroke-width': 2.5, 'circle-pitch-alignment': 'map',
    } });

    if (this.basemapOk) {
      map.addLayer({ id: 'stations-label', type: 'symbol', source: 'stations', minzoom: 11, filter: ['==', ['get', 'big'], 1], layout: {
        'text-field': ['get', 'n'], 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 11, 10, 15, 13],
        'text-anchor': 'top', 'text-offset': [0, 0.9], 'text-optional': true, 'text-max-width': 8,
      }, paint: { 'text-color': P.label, 'text-halo-color': P.labelHalo, 'text-halo-width': 1.6 } });
    }
    for (const id of this.hidden) this.setLayerVisible(id, false);
  }

  /** Switch between the light and dark map. Redraws this app's layers on the new basemap and keeps what was selected. */
  async setTheme(theme) {
    if (theme === this.theme || !this.map) return;
    this.theme = theme;
    setColorTheme(theme);
    const { style, ok } = await this._loadStyle(theme);
    if (theme !== this.theme) return; // switched again while loading
    const keep = { sel: this._selData, me: this._meData, route: this.routeSel };
    this.basemapOk = ok;
    this.hasBuildings = !!(style.sources && style.sources.openmaptiles);
    this.map.setStyle(style, { diff: false });
    await new Promise((res) => this.map.once('style.load', res));
    this._addData();
    if (keep.sel) this.map.getSource('sel').setData(keep.sel);
    if (keep.me) this.map.getSource('me').setData(keep.me);
    if (keep.route !== null) this.highlightRoute(keep.route);
  }

  // ------------------------------------------------------------------ interaction
  _wire() {
    const map = this.map;
    const pickVehicle = (pt) => {
      const pad = 12;
      const hits = map.queryRenderedFeatures([[pt.x - pad, pt.y - pad], [pt.x + pad, pt.y + pad]], { layers: ['veh'] });
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
      const pad = 10;
      const hits = map.queryRenderedFeatures([[e.point.x - pad, e.point.y - pad], [e.point.x + pad, e.point.y + pad]], { layers: ['stations', 'stations-minor', 'stops'] });
      if (hits.length) {
        const f = hits.find((x) => x.layer.id === 'stations') || hits[0];
        this.h.onEntity({ kind: f.layer.id === 'stops' ? 'stop' : 'station', idx: f.properties.i });
        return;
      }
      this.h.onEmpty();
    });
    map.on('mousemove', (e) => {
      const near = map.queryRenderedFeatures([[e.point.x - 8, e.point.y - 8], [e.point.x + 8, e.point.y + 8]], { layers: ['veh', 'stations', 'stations-minor', 'stops'] });
      map.getCanvas().style.cursor = near.length ? 'pointer' : '';
    });
    let t = 0;
    map.on('moveend', () => {
      clearTimeout(t);
      t = setTimeout(() => this.h.onView && this.h.onView(this.view()), 250);
    });
    map.on('dragstart', () => { if (this.following) { this.following = null; this.h.onUnfollow && this.h.onUnfollow(); } });
  }

  view() {
    const c = this.map.getCenter();
    return { lat: c.lat, lon: c.lng, zoom: this.map.getZoom(), pitch: this.map.getPitch() };
  }

  // ------------------------------------------------------------------ vehicles
  setVehicles(list) {
    const net = this.net;
    const feats = [];
    this.byId.clear();
    for (const v of list) {
      this.byId.set(v.id, v);
      const route = net.routes[v.route];
      if (this.mode !== 'all' && route.mode !== this.mode) continue;
      feats.push({ type: 'Feature', properties: {
        vid: v.id, t: route.isTrain ? 1 : route.isFerry ? 2 : 0, c: routeColor(route), b: Math.round(v.bearing),
        d: this.routeSel !== null && this.routeSel !== v.route ? 1 : 0,
      }, geometry: { type: 'Point', coordinates: [v.lon, v.lat] } });
    }
    this.map.getSource('veh').setData({ type: 'FeatureCollection', features: feats });
    if (this.following) {
      const v = this.byId.get(this.following);
      if (v) this.map.easeTo({ center: [v.lon, v.lat], duration: 400, easing: (x) => x, essential: true });
    }
    return feats.length;
  }

  setMode(mode) { this.mode = mode; }

  setSelectedVehicle(id) {
    this.selVid = id;
    this.map.setFilter('veh-sel', ['==', ['get', 'vid'], id === null ? -1 : id]);
  }

  follow(id) { this.following = id; }

  highlightRoute(routeIdx) {
    this.routeSel = routeIdx;
    const src = this.map.getSource('route-hi');
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
    this.map.getSource('sel').setData(this._selData);
    if (fly) this.map.easeTo({ center: [lon, lat], zoom: Math.max(this.map.getZoom(), 15), padding: this._pad(0), duration: 700 });
  }

  clearEntity() { this._selData = null; this.map.getSource('sel').setData(empty()); }

  flyTo(lat, lon, zoom) { this.map.easeTo({ center: [lon, lat], zoom, padding: this._pad(0), duration: 700 }); }

  setPadding(p) { this.padding = p; }

  set3D(on) {
    const map = this.map;
    this.is3D = on;
    if (this.hasBuildings) map.setLayoutProperty('buildings-3d', 'visibility', on ? 'visible' : 'none');
    map.easeTo({ pitch: on ? 62 : 0, bearing: on ? -18 : 0, zoom: on ? Math.max(map.getZoom(), 14.4) : map.getZoom(), duration: 900 });
  }

  setLayerVisible(id, vis) {
    if (vis) this.hidden.delete(id); else this.hidden.add(id);
    const ids = { bus: ['bus-routes'], stops: ['stops', 'stations-minor'], labels: ['stations-label'] }[id] || [];
    for (const l of ids) if (this.map.getLayer(l)) this.map.setLayoutProperty(l, 'visibility', vis ? 'visible' : 'none');
  }

  setMe(lat, lon) {
    this._meData = lat === null ? null : { type: 'FeatureCollection', features: [
      { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [lon, lat] } }] };
    this.map.getSource('me').setData(this._meData || empty());
  }

  resize() { this.map.resize(); }
  zoomBy(d) { this.map.easeTo({ zoom: this.map.getZoom() + d, duration: 250 }); }
  resetNorth() { this.map.easeTo({ bearing: 0, pitch: this.map.getPitch(), duration: 400 }); }
}
