// mapview.js: the map, its layers, the moving vehicles and what happens on click.
import * as maplibregl from './vendor/maplibre-gl.mjs';
import { routeColor, BUS_COLOR, INK } from './colors.js';
import { prettyName } from './util.js';

export const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const FALLBACK_STYLE = { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#eef1f2' } }] };
const ACCENT = '#0a6c74';

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
  }

  async init(view, { compactAttribution }) {
    let style = FALLBACK_STYLE;
    this.basemapOk = false;
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch(STYLE_URL, { signal: ctl.signal });
      clearTimeout(timer);
      if (!r.ok) throw new Error(`style ${r.status}`);
      style = await r.json();
      this.basemapOk = true;
    } catch (err) {
      console.warn('Basemap style unavailable, using a plain background.', err);
    }
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
    const shapeIsTrain = new Set(), shapeIsBus = new Set();
    for (const p of net.patterns) (net.routes[p.route].isTrain ? shapeIsTrain : shapeIsBus).add(p.shape);
    const mk = (set) => ({
      type: 'FeatureCollection',
      features: [...set].map((si) => {
        const g = net.geom(si);
        const coords = new Array(g.n);
        for (let i = 0; i < g.n; i++) coords[i] = [g.lon[i], g.lat[i]];
        return { type: 'Feature', properties: { s: si }, geometry: { type: 'LineString', coordinates: coords } };
      }),
    });
    return { bus: mk(shapeIsBus), rail: mk(shapeIsTrain) };
  }

  _addData() {
    const map = this.map, net = this.net;
    const layers = map.getStyle().layers;
    const firstSymbol = (layers.find((l) => l.type === 'symbol') || {}).id;
    const { bus, rail } = this._lineFeatures();

    // arrow image for heading marks (SDF so it can be tinted)
    const c = document.createElement('canvas');
    c.width = c.height = 48;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.beginPath(); g.moveTo(24, 6); g.lineTo(40, 40); g.lineTo(24, 31); g.lineTo(8, 40); g.closePath(); g.fill();
    map.addImage('ptm-arrow', g.getImageData(0, 0, 48, 48), { sdf: true });

    // vehicle bodies, drawn pointing north and rotated by bearing: a short pill for buses, a long bar for trains.
    // Each type gets a white outline image, an SDF body (tinted with the route colour) and a white front mark.
    const PR = 2, PAD = 3;
    const vehImg = (name, w, h) => {
      const W = (w + PAD * 2) * PR, H = (h + PAD * 2) * PR;
      const draw = (fn) => {
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const x = cv.getContext('2d'); x.scale(PR, PR); x.fillStyle = '#fff'; fn(x);
        return x.getImageData(0, 0, W, H);
      };
      const pill = (x, inset) => {
        x.beginPath(); x.roundRect(PAD - inset, PAD - inset, w + inset * 2, h + inset * 2, Math.min(w / 2 + inset, 4 + inset)); x.fill();
      };
      map.addImage(name + '-halo', draw((x) => pill(x, 1.6)), { pixelRatio: PR });
      map.addImage(name, draw((x) => pill(x, 0)), { pixelRatio: PR, sdf: true });
      map.addImage(name + '-front', draw((x) => {
        x.beginPath(); x.moveTo(PAD + w / 2, PAD + 1.5); x.lineTo(PAD + w - 1.6, PAD + 1.5 + w * 0.45);
        x.lineTo(PAD + 1.6, PAD + 1.5 + w * 0.45); x.closePath(); x.fill();
      }), { pixelRatio: PR });
    };
    vehImg('ptm-bus', 9, 17);
    vehImg('ptm-train', 9, 44);

    map.addSource('bus-routes', { type: 'geojson', data: bus });
    map.addSource('rail', { type: 'geojson', data: rail });
    map.addSource('route-hi', { type: 'geojson', data: empty() });
    const st = { type: 'FeatureCollection', features: [] };
    for (let i = 0; i < net.stationName.length; i++) {
      // The feed also groups on-street bus stops under a parent. Only real stations and bus stations get the big marker.
      const raw = net.stationName[i];
      const big = (net.stationMode[i] & 2) || /(Bus Stn|Busport)$/.test(raw) ? 1 : 0;
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
      'line-color': BUS_COLOR,
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.1, 12, 0.15, 15, 0.32],
      'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.6, 12, 1, 15, 2.2],
    } }, firstSymbol);
    map.addLayer({ id: 'rail-casing', type: 'line', source: 'rail', layout: round, paint: {
      'line-color': '#ffffff', 'line-opacity': 0.9,
      'line-width': ['interpolate', ['linear'], ['zoom'], 8, 3, 12, 5.5, 15, 8],
    } }, firstSymbol);
    map.addLayer({ id: 'rail', type: 'line', source: 'rail', layout: round, paint: {
      'line-color': '#56677a',
      'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.5, 12, 3, 15, 4.5],
    } }, firstSymbol);
    map.addLayer({ id: 'route-hi-casing', type: 'line', source: 'route-hi', layout: round, paint: {
      'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 5, 12, 8, 15, 12],
    } }, firstSymbol);
    map.addLayer({ id: 'route-hi', type: 'line', source: 'route-hi', layout: round, paint: {
      'line-color': ['get', 'c'], 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 3, 12, 5, 15, 8],
    } }, firstSymbol);

    if (this.hasBuildings) {
      map.addLayer({ id: 'buildings-3d', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building',
        minzoom: 14, layout: { visibility: 'none' }, paint: {
          'fill-extrusion-color': '#d3dade',
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.6,
        } }, firstSymbol);
    }

    map.addLayer({ id: 'stops', type: 'circle', source: 'stops', minzoom: 14.6, paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 14.6, 2.4, 17, 5],
      'circle-color': '#ffffff', 'circle-stroke-color': BUS_COLOR, 'circle-stroke-width': 1.4,
    } });
    map.addLayer({ id: 'stations-minor', type: 'circle', source: 'stations', minzoom: 14.6, filter: ['==', ['get', 'big'], 0], paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 14.6, 2.4, 17, 5],
      'circle-color': '#ffffff', 'circle-stroke-color': BUS_COLOR, 'circle-stroke-width': 1.4,
    } });
    map.addLayer({ id: 'stations', type: 'circle', source: 'stations', minzoom: 8.6, filter: ['==', ['get', 'big'], 1], paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 8.6, 2.6, 12, 5.5, 15, 8],
      'circle-color': '#ffffff', 'circle-stroke-color': INK, 'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 8.6, 1.4, 12, 2.2],
    } });
    map.addLayer({ id: 'sel-ring', type: 'circle', source: 'sel', paint: {
      'circle-radius': 14, 'circle-color': 'rgba(10,108,116,0.14)', 'circle-stroke-color': ACCENT, 'circle-stroke-width': 3,
    } });
    map.addLayer({ id: 'me-dot', type: 'circle', source: 'me', paint: {
      'circle-radius': 7, 'circle-color': '#1a73e8', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3,
    } });

    const r = (a, b, c3) => ['interpolate', ['linear'], ['zoom'], 8, ['+', a, ['*', ['get', 't'], 1]], 12, ['+', b, ['*', ['get', 't'], 1.4]], 16, ['+', c3, ['*', ['get', 't'], 2.2]]];
    const vehSize = ['interpolate', ['linear'], ['zoom'], 8, 0.34, 12, 0.62, 15, 1.0, 17, 1.35];
    const vehIcon = (suffix) => ['case', ['==', ['get', 't'], 1], 'ptm-train' + suffix, 'ptm-bus' + suffix];
    const vehLayout = (suffix) => ({
      'icon-image': vehIcon(suffix), 'icon-size': vehSize, 'icon-rotate': ['get', 'b'],
      'icon-rotation-alignment': 'map', 'icon-pitch-alignment': 'map',
      'icon-allow-overlap': true, 'icon-ignore-placement': true,
      // trains draw above buses where they cross
      'symbol-sort-key': ['get', 't'],
    });
    map.addLayer({ id: 'veh-halo', type: 'symbol', source: 'veh', layout: vehLayout('-halo'), paint: {
      'icon-opacity': ['case', ['==', ['get', 'd'], 1], 0.18, 0.95],
    } });
    map.addLayer({ id: 'veh', type: 'symbol', source: 'veh', layout: vehLayout(''), paint: {
      'icon-color': ['get', 'c'], 'icon-opacity': ['case', ['==', ['get', 'd'], 1], 0.22, 1],
    } });
    map.addLayer({ id: 'veh-arrow', type: 'symbol', source: 'veh', minzoom: 13.5, layout: vehLayout('-front'), paint: {
      'icon-opacity': ['case', ['==', ['get', 'd'], 1], 0.2, 0.95],
    } });
    map.addLayer({ id: 'veh-sel', type: 'circle', source: 'veh', filter: ['==', ['get', 'vid'], -1], paint: {
      'circle-radius': r(8, 10, 14), 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-color': INK, 'circle-stroke-width': 2.5, 'circle-pitch-alignment': 'map',
    } });

    if (this.basemapOk) {
      map.addLayer({ id: 'stations-label', type: 'symbol', source: 'stations', minzoom: 11, filter: ['==', ['get', 'big'], 1], layout: {
        'text-field': ['get', 'n'], 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 11, 10, 15, 13],
        'text-anchor': 'top', 'text-offset': [0, 0.9], 'text-optional': true, 'text-max-width': 8,
      }, paint: { 'text-color': INK, 'text-halo-color': 'rgba(255,255,255,0.95)', 'text-halo-width': 1.6 } });
    }
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
      if (this.mode === 'bus' && v.type === 2) continue;
      if (this.mode === 'train' && v.type !== 2) continue;
      const route = net.routes[v.route];
      feats.push({ type: 'Feature', properties: {
        vid: v.id, t: v.type === 2 ? 1 : 0, c: routeColor(route), b: Math.round(v.bearing),
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
    this.map.getSource('sel').setData({ type: 'FeatureCollection', features: [
      { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [lon, lat] } }] });
    if (fly) this.map.easeTo({ center: [lon, lat], zoom: Math.max(this.map.getZoom(), 15), padding: this._pad(0), duration: 700 });
  }

  clearEntity() { this.map.getSource('sel').setData(empty()); }

  flyTo(lat, lon, zoom) { this.map.easeTo({ center: [lon, lat], zoom, padding: this._pad(0), duration: 700 }); }

  setPadding(p) { this.padding = p; }

  set3D(on) {
    const map = this.map;
    if (this.hasBuildings) map.setLayoutProperty('buildings-3d', 'visibility', on ? 'visible' : 'none');
    map.easeTo({ pitch: on ? 62 : 0, bearing: on ? -18 : 0, zoom: on ? Math.max(map.getZoom(), 14.4) : map.getZoom(), duration: 900 });
  }

  setLayerVisible(id, vis) {
    const ids = { bus: ['bus-routes'], stops: ['stops', 'stations-minor'], labels: ['stations-label'] }[id] || [];
    for (const l of ids) if (this.map.getLayer(l)) this.map.setLayoutProperty(l, 'visibility', vis ? 'visible' : 'none');
  }

  setMe(lat, lon) {
    this.map.getSource('me').setData(lat === null ? empty() : { type: 'FeatureCollection', features: [
      { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [lon, lat] } }] });
  }

  resize() { this.map.resize(); }
  zoomBy(d) { this.map.easeTo({ zoom: this.map.getZoom() + d, duration: 250 }); }
  resetNorth() { this.map.easeTo({ bearing: 0, pitch: this.map.getPitch(), duration: 400 }); }
}
