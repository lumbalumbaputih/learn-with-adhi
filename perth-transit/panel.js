// panel.js: tabs, search, route and stop pages, the vehicle card and the departures board.
import { DAY, fmtClock } from './sim.js';
import { routeColor } from './colors.js';
import { h, fmtN, prettyName, chip, distLabel, minsLabel } from './util.js';

const TABS = [['map', 'Map'], ['routes', 'Routes'], ['stops', 'Stops']];

function segmented(label, options, value, onChange) {
  const wrap = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': label });
  for (const [v, text] of options) {
    wrap.append(h('button', {
      class: 'seg-btn', type: 'button', role: 'radio', 'aria-checked': String(v === value), text,
      onclick: () => onChange(v),
    }));
  }
  return wrap;
}

export class Panel {
  constructor({ content, tabs, search, searchClear }, net, act) {
    this.net = net;
    this.act = act;
    this.content = content;
    this.tabsEl = tabs;
    this.input = search;
    this.clearBtn = searchClear;

    this.tab = 'map';
    this.detail = null;            // { kind: 'route', idx } | { kind: 'entity', e }
    this.query = '';
    this.mapMode = 'all';
    this.routeFilter = 'all';
    this.boardFilter = 'all';
    this.vehicleId = null;
    this.center = null;
    this.nearMe = null;
    this.last = null;              // last update payload
    this.r = {};

    for (const [id, label] of TABS) {
      tabs.append(h('button', {
        class: 'tab', type: 'button', role: 'tab', id: `tab-${id}`, 'aria-controls': 'content', 'data-tab': id, text: label,
        onclick: () => { this.query = ''; this.input.value = ''; this._clearDetail(); this.setTab(id); },
      }));
    }
    tabs.addEventListener('keydown', (e) => {
      const ids = TABS.map((t) => t[0]);
      let i = ids.indexOf(e.target.dataset ? e.target.dataset.tab : this.tab);
      if (i < 0) return;
      if (e.key === 'ArrowRight') i = (i + 1) % ids.length;
      else if (e.key === 'ArrowLeft') i = (i + ids.length - 1) % ids.length;
      else if (e.key === 'Home') i = 0;
      else if (e.key === 'End') i = ids.length - 1;
      else return;
      e.preventDefault();
      this.query = ''; this.input.value = ''; this._clearDetail(); this.setTab(ids[i]);
      tabs.children[i].focus();
    });
    this.input.addEventListener('input', () => { this.query = this.input.value.trim(); this.render(); });
    this.clearBtn.addEventListener('click', () => { this.input.value = ''; this.query = ''; this.render(); this.input.focus(); });
    this._syncTabs();
    this.render();
  }

  // ------------------------------------------------------------------ navigation
  setTab(tab) {
    this.tab = tab;
    this._syncTabs();
    this.render();
    this.act.onTab && this.act.onTab(tab);
  }

  _syncTabs() {
    for (const b of this.tabsEl.children) {
      const on = b.dataset.tab === this.tab;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    }
  }

  openRoute(idx) {
    this.query = ''; this.input.value = '';
    if (this.detail && this.detail.kind === 'entity') this._clearDetail();
    this.tab = 'routes'; this.detail = { kind: 'route', idx };
    this._syncTabs(); this.render();
    this.act.onRoute(idx);
  }

  openEntity(e, { fly = true } = {}) {
    this.query = ''; this.input.value = '';
    if (this.detail && this.detail.kind === 'route') this._clearDetail();
    this.tab = 'stops'; this.detail = { kind: 'entity', e };
    this.boardFilter = 'all';
    this._syncTabs(); this.render();
    this.act.onEntity(e, fly);
  }

  openVehicle(id) {
    this.query = ''; this.input.value = '';
    this.vehicleId = id; this.detail = null; this.tab = 'map';
    this._syncTabs(); this.render();
    this.act.onVehicle(id);
  }

  /** Leave a route or stop page and undo its effect on the map. */
  _clearDetail() {
    if (this.detail && this.detail.kind === 'route') this.act.onRouteClose();
    if (this.detail && this.detail.kind === 'entity') this.act.onEntityClose();
    this.detail = null;
  }

  back() {
    this._clearDetail();
    this.render();
  }

  closeVehicle() {
    this.vehicleId = null;
    this.act.onVehicleClose();
    this.render();
  }

  setCenter(lat, lon) {
    this.center = { lat, lon };
    if (this.tab === 'stops' && !this.detail && !this.query && !this.nearMe) this._renderNear();
  }

  // ------------------------------------------------------------------ rendering
  render() {
    const c = this.content;
    c.replaceChildren();
    this.r = {};
    this.clearBtn.hidden = !this.query;
    c.setAttribute('aria-labelledby', `tab-${this.tab}`);
    if (this.query) c.append(this._search());
    else if (this.detail && this.detail.kind === 'route') c.append(this._routePage());
    else if (this.detail && this.detail.kind === 'entity') c.append(this._entityPage());
    else if (this.tab === 'map') c.append(this._mapTab());
    else if (this.tab === 'routes') c.append(this._routesTab());
    else c.append(this._stopsTab());
    c.scrollTop = 0;
    if (this.last) this.update(this.last.now, this.last.vehicles);
  }

  _backBtn(label) {
    return h('button', { class: 'back', type: 'button', onclick: () => this.back() },
      h('span', { class: 'back-arrow', 'aria-hidden': 'true', text: '‹' }), label);
  }

  // ---- Map tab
  _mapTab() {
    const net = this.net;
    this.r.total = h('span', { class: 'num' });
    this.r.routes = h('span', { class: 'status-sub' });
    this.r.bus = h('span', { class: 'fig-num' });
    this.r.train = h('span', { class: 'fig-num' });
    this.r.ferry = h('span', { class: 'fig-num' });
    this.r.ferryLabel = h('span', { text: 'ferries' });
    this.r.vcard = h('div', { class: 'vcard-slot' });
    const status = h('section', { class: 'status', 'aria-live': 'polite' },
      h('div', { class: 'status-main' }, this.r.total, h('div', { class: 'status-label' }, h('strong', { text: 'vehicles running' }), this.r.routes)),
      h('div', { class: 'figs' },
        h('div', { class: 'fig' }, this.r.bus, h('span', { text: 'buses' })),
        h('div', { class: 'fig' }, this.r.train, h('span', { text: 'trains' })),
        h('div', { class: 'fig' }, this.r.ferry, this.r.ferryLabel)),
      h('p', { class: 'hint', text: 'Positions are estimated from the published timetable. Vehicles are not tracked by GPS, and delays or cancellations are not shown.' }));
    const seg = segmented('Show on the map', [['all', 'All'], ['train', 'Trains'], ['bus', 'Buses'], ['ferry', 'Ferry']], this.mapMode, (v) => {
      this.mapMode = v; this.act.onMode(v); this.render();
    });

    this.r.lineRows = new Map();
    const list = h('ul', { class: 'plain-list' });
    const ferries = h('ul', { class: 'plain-list' });
    for (const r of net.routes.filter((x) => x.isTrain || x.isFerry)) {
      const count = h('span', { class: 'row-count' });
      this.r.lineRows.set(r.idx, count);
      (r.isFerry ? ferries : list).append(h('li', {}, h('button', { class: 'row', type: 'button', onclick: () => this.openRoute(r.idx) },
        chip(r), h('span', { class: 'row-main' },
          h('span', { class: 'row-title', text: r.isFerry ? 'Swan River ferry' : r.long }), h('span', { class: 'row-sub', text: this._summary(r.idx) })), count)));
    }
    return h('div', { class: 'stack' }, this.r.vcard, status, seg,
      h('section', { class: 'block' }, h('h2', { class: 'h2', text: 'Train lines' }), list),
      ferries.childElementCount ? h('section', { class: 'block' }, h('h2', { class: 'h2', text: 'Ferry' }), ferries) : null);
  }

  _vehicleCard(v, sec) {
    const net = this.net;
    if (!v) {
      return h('section', { class: 'vcard vcard-gone' },
        h('p', { text: 'This trip has finished.' }),
        h('button', { class: 'btn', type: 'button', onclick: () => this.closeVehicle(), text: 'Close' }));
    }
    const d = net.describe(v, sec);
    let line;
    if (d.state === 'dwell') line = `At ${prettyName(d.stopName)}`;
    else if (d.state === 'move') line = `Next stop ${prettyName(d.nextStopName)}, due in ${minsLabel(d.etaSec)}`;
    else line = `Arriving at ${prettyName(d.destination)}`;
    const following = this.act.isFollowing();
    return h('section', { class: 'vcard' },
      h('div', { class: 'vcard-top' }, chip(d.route, { big: true }),
        h('div', { class: 'vcard-to' }, h('span', { class: 'muted', text: 'to' }), ` ${prettyName(d.headsign)}`)),
      h('p', { class: 'vcard-line', text: line }),
      h('div', { class: 'progress', role: 'img', 'aria-label': `Trip ${Math.round(d.progress * 100)} percent complete` },
        h('span', { style: { width: `${Math.round(d.progress * 100)}%`, background: routeColor(d.route) } })),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn', type: 'button', onclick: () => this.openRoute(d.route.idx), text: 'View route' }),
        h('button', { class: 'btn', type: 'button', 'aria-pressed': String(following), onclick: () => { this.act.onFollow(this.vehicleId, !following); this._refreshVehicleCard(); }, text: following ? 'Stop following' : 'Follow' }),
        h('button', { class: 'btn btn-quiet', type: 'button', onclick: () => this.closeVehicle(), text: 'Close' })),
      h('p', { class: 'fine', text: 'Simulated position from the timetable.' }));
  }

  _refreshVehicleCard() {
    if (!this.r.vcard || !this.last) return;
    const slot = this.r.vcard;
    if (this.vehicleId === null) { slot.replaceChildren(); return; }
    const v = this.last.vehicles.find((x) => x.id === this.vehicleId);
    const card = this._vehicleCard(v, this.last.now.sec);
    // The card refreshes every second; only swap it when something visible changed, and keep keyboard focus.
    const sig = `${card.textContent}|${card.querySelector('.progress span') ? card.querySelector('.progress span').style.width : ''}|${card.querySelector('[aria-pressed]') ? card.querySelector('[aria-pressed]').getAttribute('aria-pressed') : ''}`;
    if (slot.firstChild && slot.firstChild.dataset.sig === sig) return;
    card.dataset.sig = sig;
    const buttons = [...slot.querySelectorAll('button')];
    const focused = buttons.indexOf(document.activeElement);
    slot.replaceChildren(card);
    if (focused >= 0) { const b = card.querySelectorAll('button')[focused]; if (b) b.focus({ preventScroll: true }); }
  }

  // ---- Routes tab
  _summary(idx) {
    const hs = this.net.routeHeadsigns(idx);
    const seen = [];
    for (const x of hs) if (!seen.includes(prettyName(x.headsign))) seen.push(prettyName(x.headsign));
    return seen.slice(0, 2).join(' and ') || this.net.routes[idx].long;
  }

  _routeRows(routes) {
    const list = h('ul', { class: 'plain-list' });
    this.r.routeRows = this.r.routeRows || new Map();
    for (const r of routes) {
      const count = h('span', { class: 'row-count' });
      this.r.routeRows.set(r.idx, count);
      list.append(h('li', {}, h('button', { class: 'row', type: 'button', onclick: () => this.openRoute(r.idx) },
        chip(r), h('span', { class: 'row-main' }, h('span', { class: 'row-title', text: this._summary(r.idx) })), count)));
    }
    return list;
  }

  _routesTab() {
    const net = this.net;
    this.r.routeRows = new Map();
    const seg = segmented('Filter routes', [['all', 'All'], ['train', 'Trains'], ['bus', 'Buses'], ['ferry', 'Ferry']], this.routeFilter, (v) => {
      this.routeFilter = v; this.render();
    });
    const routes = net.routes.filter((r) => this.routeFilter === 'all' || r.mode === this.routeFilter);
    return h('div', { class: 'stack' }, seg,
      h('p', { class: 'meta', text: `${fmtN(routes.length)} ${routes.length === 1 ? 'route' : 'routes'}` }), this._routeRows(routes));
  }

  _routePage() {
    const net = this.net, idx = this.detail.idx, route = net.routes[idx];
    this.r.routeRunning = h('span', { class: 'meta-strong' });
    const hs = net.routeHeadsigns(idx);
    const dirs = h('div', { class: 'dirs' });
    // busiest pattern per direction, with its stop list
    const byDir = new Map();
    for (const pi of net.routePatterns(idx)) {
      const p = net.patterns[pi];
      const trips = net.patternProfiles[pi].reduce((a, q) => a + net.profiles[q].starts.length, 0);
      const cur = byDir.get(p.dir);
      if (!cur || trips > cur.trips) byDir.set(p.dir, { p, trips });
    }
    for (const [dir, { p }] of [...byDir.entries()].sort((a, b) => a[0] - b[0])) {
      const last = p.stops[p.stops.length - 1];
      const name = prettyName(net.headsigns[p.hs] || net.stopName[last]);
      const stops = h('ol', { class: 'stop-seq' });
      p.stops.forEach((s) => {
        const e = net.stopStation[s] >= 0 ? { kind: 'station', idx: net.stopStation[s] } : { kind: 'stop', idx: s };
        stops.append(h('li', {}, h('button', { class: 'link', type: 'button', onclick: () => this.openEntity(e), text: prettyName(net.entityName(e)) })));
      });
      dirs.append(h('details', { class: 'dir' },
        h('summary', {}, h('span', { class: 'muted', text: 'Towards ' }), h('strong', { text: name }), h('span', { class: 'muted', text: `, ${p.stops.length} stops` })), stops));
    }
    this.r.todayTrips = h('span', { class: 'meta' });
    return h('div', { class: 'stack' },
      this._backBtn('Routes'),
      h('header', { class: 'page-head' }, chip(route, { big: true }),
        h('h2', { class: 'page-title', text: route.isTrain ? route.long : this._summary(idx) })),
      h('p', { class: 'meta' }, this.r.routeRunning, this.r.todayTrips),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn', type: 'button', onclick: () => this.act.onRoute(idx), text: 'Show on map' })),
      hs.length ? h('section', { class: 'block' }, h('h3', { class: 'h3', text: 'Directions' }), dirs) : null);
  }

  // ---- Stops tab
  _stopsTab() {
    this.r.near = h('div', { class: 'near' });
    const top = h('div', { class: 'btn-row' },
      h('button', { class: 'btn', type: 'button', onclick: () => this.act.onLocate(), text: 'Near me' }),
      h('button', { class: 'btn btn-quiet', type: 'button', disabled: !this.nearMe, onclick: () => { this.nearMe = null; this._renderNear(); }, text: 'Use map centre' }));
    this.r.nearHead = h('h2', { class: 'h2' });
    const wrap = h('div', { class: 'stack' }, top, this.r.nearHead, this.r.near,
      h('p', { class: 'fine', text: 'Your location stays in your browser and is only used to sort nearby stops.' }));
    queueMicrotask(() => this._renderNear());
    return wrap;
  }

  setNearMe(lat, lon) { this.nearMe = lat === null ? null : { lat, lon }; if (this.tab === 'stops' && !this.detail) this.render(); }

  _renderNear() {
    if (!this.r.near) return;
    const src = this.nearMe || this.center;
    this.r.nearHead.textContent = this.nearMe ? 'Stops near you' : 'Stops near the map centre';
    this.r.near.replaceChildren();
    if (!src) return;
    const list = h('ul', { class: 'plain-list' });
    for (const e of this.net.nearestEntities(src.lat, src.lon, 12)) {
      list.append(h('li', {}, this._entityRow(e, distLabel(e.d))));
    }
    this.r.near.append(list);
  }

  _entityRow(e, trailing) {
    const net = this.net, mode = net.entityMode(e);
    const tags = [];
    if (mode & 2) tags.push('Train');
    if (mode & 1) tags.push('Bus');
    if (mode & 4) tags.push('Ferry');
    const g = mode & 2 ? ['train', 'T'] : mode & 4 ? ['ferry', 'F'] : ['bus', 'B'];
    const sub = e.kind === 'stop' ? `${tags.join(' and ')}, stop ${net.stopCode[e.idx]}`
      : mode === 4 ? 'Ferry jetty' : `Station, ${tags.join(' and ').toLowerCase()}`;
    return h('button', { class: 'row', type: 'button', onclick: () => this.openEntity(e) },
      h('span', { class: `glyph glyph-${g[0]}`, 'aria-hidden': 'true', text: g[1] }),
      h('span', { class: 'row-main' },
        h('span', { class: 'row-title', text: prettyName(net.entityName(e)) }),
        h('span', { class: 'row-sub', text: sub })),
      trailing ? h('span', { class: 'row-count', text: trailing }) : null);
  }

  _entityPage() {
    const net = this.net, e = this.detail.e;
    const stops = net.entityStops(e);
    const mode = net.entityMode(e);
    const routes = net.routesAt(stops);
    const chips = h('div', { class: 'chips' });
    routes.slice(0, 30).forEach((ri) => chips.append(h('button', { class: 'chip-btn', type: 'button', 'aria-label': `Route ${net.routes[ri].name}`, onclick: () => this.openRoute(ri) }, chip(net.routes[ri]))));
    if (routes.length > 30) chips.append(h('span', { class: 'meta', text: `and ${routes.length - 30} more` }));
    this.r.board = h('div', { class: 'board' });
    const here = [['train', 'Trains', 2], ['bus', 'Buses', 1], ['ferry', 'Ferry', 4]].filter((x) => mode & x[2]);
    const filters = here.length > 1
      ? segmented('Filter departures', [['all', 'All'], ...here.map(([v, t]) => [v, t])], this.boardFilter, (v) => { this.boardFilter = v; this._renderBoard(); this._syncBoardSeg(); })
      : null;
    this.r.boardSeg = filters;
    return h('div', { class: 'stack' },
      this._backBtn('Stops'),
      h('header', { class: 'page-head' }, h('h2', { class: 'page-title', text: prettyName(net.entityName(e)) })),
      h('p', { class: 'meta', text: e.kind === 'stop' ? `Stop ${net.stopCode[e.idx]}` : mode === 4 ? 'Ferry jetty' : 'Station' }),
      h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'button', onclick: () => this.act.onEntity(e, true), text: 'Show on map' })),
      routes.length ? h('section', { class: 'block' }, h('h3', { class: 'h3', text: 'Routes that stop here' }), chips) : null,
      h('section', { class: 'block' }, h('h3', { class: 'h3', text: 'Next departures' }), filters, this.r.board,
        h('p', { class: 'fine', text: 'Timetable times only. Delays and cancellations are not shown.' })));
  }

  _syncBoardSeg() {
    if (!this.r.boardSeg) return;
    for (const b of this.r.boardSeg.children) b.setAttribute('aria-checked', String(b.textContent.toLowerCase().startsWith(this.boardFilter === 'all' ? 'all' : this.boardFilter)));
  }

  _renderBoard() {
    if (!this.r.board || !this.last) return;
    const net = this.net, e = this.detail.e, { now } = this.last;
    const stops = net.entityStops(e);
    let deps = net.departures(stops, now.ymd, now.sec, { limit: 40, horizon: 5400 });
    if (this.boardFilter !== 'all') deps = deps.filter((d) => net.routes[d.route].mode === this.boardFilter);
    deps = deps.slice(0, 10);
    const b = this.r.board;
    const next = h('div', { class: 'board' });
    const station = e.kind === 'station' ? prettyName(net.stationName[e.idx]) : '';
    if (!deps.length) {
      next.append(h('p', { class: 'empty', text: this.boardFilter === 'all' ? 'No departures found for this stop.' : 'No departures of this type soon. Try All.' }));
    }
    for (const d of deps) {
      const route = net.routes[d.route];
      const mins = Math.floor((d.t - now.sec) / 60);
      const when = mins <= 0 ? 'Due' : mins < 60 ? `${mins} min` : fmtClock(d.t);
      let place = '';
      if (e.kind === 'station') {
        const nm = prettyName(net.stopName[d.stop]);
        place = nm.startsWith(station) ? nm.slice(station.length).trim() : nm;
      }
      next.append(h('div', { class: 'dep' },
        chip(route),
        h('div', { class: 'dep-main' }, h('span', { class: 'dep-to', text: prettyName(d.headsign) }), place ? h('span', { class: 'dep-sub', text: place }) : null),
        h('div', { class: 'dep-when' }, h('span', { class: 'dep-big', text: when }), mins > 0 && mins < 60 ? h('span', { class: 'dep-clock', text: fmtClock(d.t) }) : null)));
    }
    // Refreshes every second; only touch the DOM when the text changed, so selection and scroll stay put.
    if (b.textContent === next.textContent && b.childElementCount === next.childElementCount) return;
    b.replaceChildren(...next.childNodes);
  }

  // ---- Search results
  _search() {
    const net = this.net, q = this.query;
    const routes = net.searchRoutes(q, 8);
    const ents = net.searchEntities(q, 12);
    const wrap = h('div', { class: 'stack' });
    if (!routes.length && !ents.length) {
      wrap.append(h('p', { class: 'empty', text: `Nothing found for "${q}". Try a route number or part of a stop name.` }));
      return wrap;
    }
    if (routes.length) {
      const list = h('ul', { class: 'plain-list' });
      for (const r of routes) {
        list.append(h('li', {}, h('button', { class: 'row', type: 'button', onclick: () => this.openRoute(r.idx) },
          chip(r), h('span', { class: 'row-main' }, h('span', { class: 'row-title', text: this._summary(r.idx) })))));
      }
      wrap.append(h('section', { class: 'block' }, h('h2', { class: 'h2', text: 'Routes' }), list));
    }
    if (ents.length) {
      const list = h('ul', { class: 'plain-list' });
      for (const e of ents) list.append(h('li', {}, this._entityRow(e)));
      wrap.append(h('section', { class: 'block' }, h('h2', { class: 'h2', text: 'Stops and stations' }), list));
    }
    return wrap;
  }

  // ------------------------------------------------------------------ live refresh (about once a second)
  update(now, vehicles) {
    this.last = { now, vehicles };
    const net = this.net;
    let bus = 0, train = 0, ferry = 0;
    const perRoute = new Map();
    for (const v of vehicles) {
      if (v.type === 2) train++; else if (v.type === 4) ferry++; else bus++;
      perRoute.set(v.route, (perRoute.get(v.route) || 0) + 1);
    }
    if (this.r.total) {
      this.r.total.textContent = fmtN(bus + train + ferry);
      this.r.bus.textContent = fmtN(bus);
      this.r.train.textContent = fmtN(train);
      this.r.ferry.textContent = fmtN(ferry);
      this.r.ferryLabel.textContent = ferry === 1 ? 'ferry' : 'ferries';
      this.r.routes.textContent = `on ${fmtN(perRoute.size)} routes`;
    }
    if (this.r.lineRows) for (const [ri, el] of this.r.lineRows) { const n = perRoute.get(ri) || 0; el.textContent = n ? `${n} running` : 'not running'; el.classList.toggle('is-off', !n); }
    if (this.r.routeRows) for (const [ri, el] of this.r.routeRows) { const n = perRoute.get(ri) || 0; el.textContent = n ? `${n} running` : ''; }
    if (this.r.vcard && this.vehicleId !== null) this._refreshVehicleCard();
    if (this.r.routeRunning && this.detail && this.detail.kind === 'route') {
      const n = perRoute.get(this.detail.idx) || 0;
      this.r.routeRunning.textContent = n ? `${n} running now` : 'Not running now';
      if (!this.r.todayTrips.textContent) {
        const flags = net.serviceFlags(now.ymd);
        let trips = 0;
        for (const pi of net.routePatterns(this.detail.idx)) for (const q of net.patternProfiles[pi]) {
          const p = net.profiles[q];
          for (let i = 0; i < p.svc.length; i++) if (flags[p.svc[i]]) trips++;
        }
        this.r.todayTrips.textContent = `, ${fmtN(trips)} trips on this day`;
      }
    }
    if (this.r.board && this.detail && this.detail.kind === 'entity') this._renderBoard();
  }
}
