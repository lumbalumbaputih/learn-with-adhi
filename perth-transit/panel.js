// panel.js: tabs, search, route and stop pages, the vehicle card and the departures board.
import { DAY, fmtClock } from './sim.js?v=1.11';
import { routeColor } from './colors.js?v=1.11';
import { h, fmtN, prettyName, chip, distLabel, minsLabel } from './util.js?v=1.11';
import { dayLabel } from './scrubber.js?v=1.11';
import { placeDescription } from './places.js?v=1.11';

const TABS = [['map', 'Map'], ['routes', 'Routes'], ['stops', 'Stops']];

function segmented(label, options, value, onChange) {
  const wrap = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': label });
  for (const [v, text] of options) {
    wrap.append(h('button', {
      class: 'seg-btn', type: 'button', role: 'radio', 'aria-checked': String(v === value), text,
      tabindex: v === value ? 0 : -1,
      onclick: () => {
        onChange(v);
        const group = [...document.querySelectorAll('[role="radiogroup"]')].find((g) => g.getAttribute('aria-label') === label);
        group?.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true });
      },
    }));
  }
  wrap.addEventListener('keydown', (e) => {
    const buttons = [...wrap.children];
    const i = buttons.indexOf(document.activeElement);
    if (i < 0) return;
    let next;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % buttons.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i + buttons.length - 1) % buttons.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    else return;
    e.preventDefault();
    buttons[next].click();
  });
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
    this.catalogue = null;
    this.catalogueState = 'loading';

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
    this.input.addEventListener('input', () => {
      this.query = this.input.value.trim();
      if (this.query) this.act.onSearch?.();
      this.render();
      clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => {
        const status = document.getElementById('search-status');
        if (status) status.textContent = this.query
          ? `Showing ${this.catalogue?.search(this.query, 8, this.center).length || 0} places, ${this.net.searchRoutes(this.query, 8).length} routes and ${this.net.searchEntities(this.query, 12).length} stops or stations for ${this.query}.`
          : '';
      }, 250);
    });
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
    this.content.focus({ preventScroll: true });
  }

  openEntity(e, { fly = true } = {}) {
    this.query = ''; this.input.value = '';
    if (this.detail && this.detail.kind === 'route') this._clearDetail();
    this.tab = 'stops'; this.detail = { kind: 'entity', e };
    this.boardFilter = 'all';
    this._syncTabs(); this.render();
    this.act.onEntity(e, fly);
    this.content.focus({ preventScroll: true });
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
    this.content.focus({ preventScroll: true });
  }

  closeVehicle() {
    this.vehicleId = null;
    this.act.onVehicleClose();
    this.render();
    this.content.focus({ preventScroll: true });
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
    if (!this.query) {
      const status = document.getElementById('search-status');
      if (status?.textContent) status.textContent = '';
    }
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
  _favourites() {
    const places = this.act.getPlaces();
    const list = h('ul', { class: 'plain-list' });
    for (const place of places) {
      list.append(h('li', { class: 'place-row' },
        h('button', { class: 'row', type: 'button', onclick: () => this.act.onPlace(place), 'aria-label': `Show stops near ${place.name}` },
          h('span', { class: 'place-mark', 'aria-hidden': 'true', text: '★' }),
          h('span', { class: 'row-main' }, h('span', { class: 'row-title', text: place.name }),
            h('span', { class: 'row-sub', text: 'Show nearby stops' }))),
        h('button', { class: 'btn btn-quiet', type: 'button', text: 'Edit', 'aria-label': `Edit ${place.name}`, onclick: () => this.act.onSavePlace({ place }) })));
    }
    const buttons = h('div', { class: 'btn-row' });
    for (const name of ['Home', 'Work']) if (!places.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      buttons.append(h('button', { class: 'btn btn-quiet', type: 'button', text: `Save ${name}`, onclick: () => this.act.onSavePlace({ name }) }));
    }
    buttons.append(h('button', { class: 'btn', type: 'button', text: 'Add a place', onclick: () => this.act.onSavePlace() }));
    return h('section', { class: 'block favourites', 'aria-label': 'Favourite places' },
      h('h2', { class: 'h2', text: 'Favourites' }), list, buttons,
      h('p', { class: 'fine', text: 'Save Home, Work or another place on this device.' }));
  }

  refreshPlaces(places) {
    if (this.nearMe?.placeId) {
      const place = places.find((p) => p.id === this.nearMe.placeId);
      this.nearMe = place ? { ...place, placeId: place.id } : null;
    }
    this.render();
  }

  showPlace(place, { catalogue = false } = {}) {
    this._clearDetail(); this.query = ''; this.input.value = ''; this.vehicleId = null;
    this.nearMe = { ...place, ...(catalogue ? { catalogueId: place.id } : { placeId: place.id }) };
    this.setTab('stops');
    this.content.focus({ preventScroll: true });
  }

  _mapTab() {
    const net = this.net;
    this.r.total = h('span', { class: 'num' });
    this.r.routes = h('span', { class: 'status-sub' });
    this.r.bus = h('span', { class: 'fig-num' });
    this.r.train = h('span', { class: 'fig-num' });
    this.r.ferry = h('span', { class: 'fig-num' });
    this.r.ferryLabel = h('span', { text: 'ferries' });
    this.r.vcard = h('div', { class: 'vcard-slot' });
    const status = h('section', { class: 'status' },
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
    return h('div', { class: 'stack' }, this.r.vcard, status, seg, this._favourites(),
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
    this.r.busy = h('div', { class: 'busy-wrap' });
    this.r.busyYmd = null;
    return h('div', { class: 'stack' },
      this._backBtn('Routes'),
      h('header', { class: 'page-head' }, chip(route, { big: true }),
        h('h2', { class: 'page-title', text: route.isTrain ? route.long : this._summary(idx) })),
      h('p', { class: 'meta' }, this.r.routeRunning, this.r.todayTrips),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn', type: 'button', onclick: () => this.act.onRoute(idx), text: 'Show on map' })),
      h('section', { class: 'block' }, h('h3', { class: 'h3', text: 'How busy is this line?' }), this.r.busy),
      hs.length ? h('section', { class: 'block' }, h('h3', { class: 'h3', text: 'Directions' }), dirs) : null);
  }

  /** "How busy is this line?": trips per hour through the day, the busiest hour, first and last trip. */
  _renderBusy(now) {
    const net = this.net, idx = this.detail.idx, route = net.routes[idx];
    const group = net.sameNameRoutes(idx);
    const d = net.routeDay(group, now.ymd);
    this.r.busyYmd = now.ymd;
    this.r.busyBars = [];
    this.r.todayTrips.textContent = `, ${fmtN(d.trips)} ${d.trips === 1 ? 'trip' : 'trips'} on this day`;
    const wrap = this.r.busy;
    if (!d.trips) {
      wrap.replaceChildren(h('p', { class: 'empty', text: `No trips on ${dayLabel(now.ymd)}.` }));
      return;
    }
    const hrLabel = (hr) => (hr % 24 === 0 ? 'midnight' : hr % 24 === 12 ? 'noon' : `${hr % 12 || 12}${hr % 24 < 12 ? 'am' : 'pm'}`);
    let peak = 0;
    for (let hr = 1; hr < d.all.length; hr++) if (d.all[hr] > d.all[peak]) peak = hr;
    const from = Math.floor(d.first / 3600), to = Math.floor(d.last / 3600);
    const gap = d.oneWay[peak] ? Math.round(60 / d.oneWay[peak]) : 0;
    const often = gap <= 1 ? 'an average of about one trip per minute' : `an average of about one trip per ${gap} min`;
    const each = d.dirs > 1 ? ' in the busiest direction' : '';
    const head = h('p', { class: 'busy-head' },
      h('strong', { text: `Busiest ${hrLabel(peak)} to ${hrLabel(peak + 1)}` }),
      `: ${fmtN(d.all[peak])} ${d.all[peak] === 1 ? 'trip' : 'trips'}, ${often}${each}.`);
    const tripTime = (t) => `${fmtClock(t)}${t >= DAY ? ' next day' : ''}`;
    const span = h('p', { class: 'meta', text: `First trip ${tripTime(d.first)}, last trip ${tripTime(d.last)}.` });
    const color = routeColor(route);
    const bars = h('div', { class: 'busy-bars', role: 'img',
      'aria-label': `Trips per hour on ${dayLabel(now.ymd)}, from ${hrLabel(from)} to ${hrLabel(to + 1)}. Busiest ${hrLabel(peak)} to ${hrLabel(peak + 1)} with ${d.all[peak]} trips.` });
    const axis = h('div', { class: 'busy-axis', 'aria-hidden': 'true' });
    const rows = h('tbody', {});
    for (let hr = from; hr <= to; hr++) {
      const n = d.all[hr];
      rows.append(h('tr', {},
        h('th', { scope: 'row', text: `${hrLabel(hr)}${hr >= 24 ? ' next day' : ''}` }),
        h('td', { text: fmtN(n) })));
      const bar = h('span', { class: 'busy-bar', title: `${hrLabel(hr)}: ${n} ${n === 1 ? 'trip' : 'trips'}`,
        style: { height: `${n ? Math.max(4, Math.round((n / d.all[peak]) * 100)) : 0}%`, background: color } });
      bar.dataset.hr = String(hr);
      this.r.busyBars.push(bar);
      bars.append(bar);
      axis.append(h('span', { text: hr % 3 === 0 ? (hr % 24 === 0 ? '12am' : hrLabel(hr)) : '' })); // short, so the right edge is not cut off
    }
    wrap.replaceChildren(head, span, bars, axis,
      h('p', { class: 'fine', text: `Trips leaving their first stop per hour on ${dayLabel(now.ymd)}, from the timetable. Branches and short trips are included; spacing at your stop may differ. This shows service frequency, not how full it is.` }),
      h('details', { class: 'hourly-data' },
        h('summary', { text: 'Hourly timetable counts' }),
        h('table', {}, h('caption', { class: 'sr-only', text: `Trips by hour on ${dayLabel(now.ymd)}` }),
          h('thead', {}, h('tr', {}, h('th', { scope: 'col', text: 'Hour' }), h('th', { scope: 'col', text: 'Trips' }))), rows)));
    this.r.busyNow = null;
  }

  // ---- Stops tab
  _stopsTab() {
    this.r.near = h('div', { class: 'near' });
    const top = h('div', { class: 'btn-row' },
      h('button', { class: 'btn', type: 'button', onclick: () => this.act.onLocate(), text: 'Near me' }),
      h('button', { class: 'btn btn-quiet', type: 'button', disabled: !this.nearMe, onclick: () => {
        this.nearMe = null; this.act.onNamedPlaceClose(); this.render();
      }, text: 'Use map centre' }));
    this.r.nearHead = h('h2', { class: 'h2' });
    const place = this.nearMe?.catalogueId ? this.nearMe : null;
    const selected = place ? h('section', { class: 'block selected-place', 'aria-label': 'Selected place' },
      h('h2', { class: 'h2', text: place.name }),
      h('p', { class: 'fine', text: placeDescription(place) }),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn', type: 'button', text: 'Save this place', onclick: () => this.act.onSavePlace({ name: place.name.slice(0, 40), point: place }) }),
        h('a', { class: 'btn btn-quiet', href: `https://www.openstreetmap.org/${place.id}`, target: '_blank', rel: 'noopener noreferrer', text: 'View on OpenStreetMap' }))) : null;
    const wrap = h('div', { class: 'stack' }, selected, place ? null : this._favourites(), top, this.r.nearHead, this.r.near,
      h('p', { class: 'fine', text: 'Distances are in a straight line, not walking routes. Your location stays in your browser.' }));
    queueMicrotask(() => this._renderNear());
    return wrap;
  }

  setNearMe(lat, lon) { this.nearMe = lat === null ? null : { lat, lon }; if (this.tab === 'stops' && !this.detail) this.render(); }

  _renderNear() {
    if (!this.r.near) return;
    const src = this.nearMe || this.center;
    this.r.nearHead.textContent = this.nearMe?.name ? `Stops near ${this.nearMe.name}` : this.nearMe ? 'Stops near you' : 'Stops near the map centre';
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
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn', type: 'button', onclick: () => this.act.onEntity(e, true), text: 'Show on map' }),
        h('button', { class: 'btn btn-quiet', type: 'button', text: 'Save this location', onclick: () => this.act.onSavePlace({
          name: prettyName(net.entityName(e)).slice(0, 40), point: { lat: net.entityLat(e), lon: net.entityLon(e) },
        }) })),
      routes.length ? h('section', { class: 'block' }, h('h3', { class: 'h3', text: 'Routes that stop here' }), chips) : null,
      h('section', { class: 'block' }, h('h3', { class: 'h3', text: 'Next departures' }), filters, this.r.board,
        h('p', { class: 'fine', text: 'Timetable times only. Delays and cancellations are not shown.' })));
  }

  _syncBoardSeg() {
    if (!this.r.boardSeg) return;
    for (const b of this.r.boardSeg.children) {
      const on = b.textContent.toLowerCase().startsWith(this.boardFilter === 'all' ? 'all' : this.boardFilter);
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    }
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
  setCatalogue(catalogue, state = 'ready') {
    this.catalogue = catalogue;
    this.catalogueState = state;
    if (this.query) {
      const active = this.content.contains(document.activeElement) ? document.activeElement : null;
      // Async loading should not remove a keyboard-focused transit result.
      if (active) this.content.addEventListener('focusout', () => requestAnimationFrame(() => {
        if (this.query && !this.content.contains(document.activeElement)) this.render();
      }), { once: true });
      else this.render();
      const status = document.getElementById('search-status');
      if (status) status.textContent = state === 'ready'
        ? `Places loaded. ${catalogue.search(this.query, 8, this.center).length} place results for ${this.query}.`
        : state === 'error' ? 'Place search is unavailable. Routes and stops can still be searched.' : 'Loading places.';
    }
  }

  _search() {
    const net = this.net, q = this.query;
    const routes = net.searchRoutes(q, 8);
    const ents = net.searchEntities(q, 12);
    const places = this.catalogue?.search(q, 8, this.center) || [];
    const wrap = h('div', { class: 'stack' });
    const placeList = h('ul', { class: 'plain-list' });
    for (const place of places) {
      placeList.append(h('li', {}, h('button', { class: 'row named-place-result', type: 'button', onclick: () => this.act.onNamedPlace(place), 'aria-label': `Show stops near ${place.name}${place.locality ? `, ${place.locality}` : ''}` },
        h('span', { class: 'place-mark', 'aria-hidden': 'true', text: '⌖' }),
        h('span', { class: 'row-main' }, h('span', { class: 'row-title', text: place.name }),
          h('span', { class: 'row-sub', text: placeDescription(place) })))));
    }
    const placeSection = h('section', { class: 'block', 'aria-label': 'Place search results' }, h('h2', { class: 'h2', text: 'Places' }), placeList);
    if (this.catalogueState === 'loading') placeSection.append(h('p', { class: 'fine', text: 'Loading places… Routes and stops are available below.' }));
    else if (this.catalogueState === 'error') placeSection.append(
      h('p', { class: 'fine', text: 'Could not load places. Check your connection and try again.' }),
      h('button', { class: 'btn btn-quiet', type: 'button', text: 'Retry place search', onclick: () => this.act.onRetryPlaces() }));
    else {
      if (!places.length) placeSection.append(h('p', { class: 'fine', text: q.length < 2 ? 'Type at least two letters to find a place.' : `No places found for “${q}”. Try another name or suburb. Some places are missing from OpenStreetMap.` }));
      placeSection.append(h('p', { class: 'fine' }, 'Perth places · ', h('a', { href: 'https://www.openstreetmap.org/copyright', target: '_blank', rel: 'noopener noreferrer', text: '© OpenStreetMap contributors' }), ` · Updated ${this.catalogue.updated}`));
    }
    wrap.append(placeSection);
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
    if (!routes.length && !ents.length) wrap.append(h('p', { class: 'fine', text: 'No matching routes or stops. Try a route number or part of a stop name.' }));
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
      const n = net.sameNameRoutes(this.detail.idx).reduce((a, ri) => a + (perRoute.get(ri) || 0), 0); // same total as the chart
      this.r.routeRunning.textContent = n ? `${n} running now` : 'Not running now';
      if (this.r.busyYmd !== now.ymd) this._renderBusy(now); // also when the day is changed with the time controls
      const hr = String(Math.floor(now.sec / 3600));
      if (this.r.busyNow !== hr) {
        this.r.busyNow = hr;
        for (const b of this.r.busyBars || []) b.classList.toggle('is-now', b.dataset.hr === hr);
      }
    }
    if (this.r.board && this.detail && this.detail.kind === 'entity') this._renderBoard();
  }
}
