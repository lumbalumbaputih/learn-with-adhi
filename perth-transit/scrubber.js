// scrubber.js: the day's heartbeat. A chart of vehicles running through the Perth service day
// with a draggable cursor that sets the simulated time.
import { DAY, fmtClock, ymdParts } from './sim.js?v=1.11';

const SVGNS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else n.setAttribute(k, v);
  }
  for (const c of kids) if (c) n.append(c);
  return n;
};
const sv = (tag, attrs = {}) => {
  const n = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

export function dayLabel(ymd) {
  const [y, m, d] = ymdParts(ymd);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  });
}

const SPEEDS = [[0, 'Paused'], [1, 'Real time'], [10, '10×'], [60, '60×'], [300, '300×']];
const fmtN = (n) => n.toLocaleString('en-AU');

export class Scrubber {
  constructor(root, cb) {
    this.cb = cb;
    this.hb = null;
    this.sec = 0;
    this.root = root;

    this.dayEl = el('span', { class: 'scrub-day' });
    this.timeEl = el('input', { class: 'scrub-time', type: 'time', step: '60', 'aria-label': 'Simulation time' });
    const mk = (act, label, text) => el('button', { class: 'icon-btn', type: 'button', 'data-act': act, 'aria-label': label, text });
    this.prevBtn = mk('prev', 'Previous day', '‹');
    this.nextBtn = mk('next', 'Next day', '›');
    this.pauseBtn = mk('pause', 'Pause animation', 'Pause');
    this.speedSel = el('select', { class: 'speed', 'aria-label': 'Simulation speed' });
    for (const [v, label] of SPEEDS) this.speedSel.append(el('option', { value: v, text: label }));
    this.nowBtn = el('button', { class: 'now-btn', type: 'button', 'data-act': 'now', text: 'Now', 'aria-pressed': 'true' });

    this.chart = el('div', {
      class: 'scrub-chart', tabindex: '0', role: 'slider', 'aria-label': 'Time of day',
      'aria-valuemin': '0', 'aria-valuemax': '1439',
    });
    this.svg = sv('svg', { class: 'scrub-svg', 'aria-hidden': 'true' });
    this.tip = el('div', { class: 'scrub-tip', hidden: '' });
    this.chart.append(this.svg, this.tip);
    this.note = el('p', { class: 'scrub-note' });

    root.append(
      el('div', { class: 'scrub-top' },
        el('div', { class: 'scrub-clock' }, this.dayEl, this.timeEl),
        el('div', { class: 'scrub-actions' }, this.prevBtn, this.nextBtn, this.pauseBtn, this.speedSel, this.nowBtn)),
      this.chart, this.note,
    );

    root.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      const a = b.dataset.act;
      if (a === 'prev') cb.onDay(-1);
      else if (a === 'next') cb.onDay(1);
      else if (a === 'now') cb.onNow();
      else if (a === 'pause') cb.onPause();
    });
    this.timeEl.addEventListener('change', () => {
      if (!this.timeEl.value) return;
      const [hour, minute] = this.timeEl.value.split(':').map(Number);
      cb.onScrub(hour * 3600 + minute * 60);
    });
    this.speedSel.addEventListener('change', () => cb.onSpeed(Number(this.speedSel.value)));

    // pointer scrubbing
    const secAt = (e) => {
      const r = this.chart.getBoundingClientRect();
      const x = Math.min(Math.max(e.clientX - r.left, 0), r.width);
      return Math.min(DAY - 60, Math.round(((x / r.width) * DAY) / 60) * 60);
    };
    let dragging = false;
    this.chart.addEventListener('pointerdown', (e) => {
      dragging = true;
      this.chart.setPointerCapture(e.pointerId);
      cb.onScrub(secAt(e));
      this._tipAt(e);
    });
    this.chart.addEventListener('pointermove', (e) => {
      this._tipAt(e);
      if (dragging) cb.onScrub(secAt(e));
    });
    const end = (e) => { dragging = false; if (e.type === 'pointerleave' || e.type === 'pointercancel') this.tip.hidden = true; };
    this.chart.addEventListener('pointerup', end);
    this.chart.addEventListener('pointercancel', end);
    this.chart.addEventListener('pointerleave', (e) => { if (!dragging) this.tip.hidden = true; });
    this.chart.addEventListener('keydown', (e) => {
      const step = { ArrowLeft: -300, ArrowRight: 300, ArrowDown: -300, ArrowUp: 300, PageDown: -3600, PageUp: 3600 }[e.key];
      if (step !== undefined) { e.preventDefault(); cb.onScrub(Math.min(DAY - 60, Math.max(0, Math.floor(this.sec / 60) * 60 + step))); }
      else if (e.key === 'Home') { e.preventDefault(); cb.onScrub(0); }
      else if (e.key === 'End') { e.preventDefault(); cb.onScrub(DAY - 60); }
    });

    new ResizeObserver(() => this._draw()).observe(this.chart);
  }

  setHeartbeat(hb, covered) {
    this.hb = hb;
    this.covered = covered;
    this._draw();
  }

  /** state: { ymd, sec, live, speed, covered } */
  setTime(s) {
    this.sec = s.sec;
    this.dayEl.textContent = dayLabel(s.ymd);
    if (document.activeElement !== this.timeEl) this.timeEl.value = `${String(Math.floor(s.sec / 3600)).padStart(2, '0')}:${String(Math.floor(s.sec / 60) % 60).padStart(2, '0')}`;
    const paused = !s.live && s.speed === 0;
    this.pauseBtn.textContent = paused ? 'Play' : 'Pause';
    this.pauseBtn.setAttribute('aria-label', paused ? 'Resume animation' : 'Pause animation');
    this.nowBtn.setAttribute('aria-pressed', String(s.live));
    this.nowBtn.disabled = s.live;
    if (document.activeElement !== this.speedSel) this.speedSel.value = String(s.speed);
    this.chart.setAttribute('aria-valuenow', String(Math.floor(s.sec / 60)));
    this.chart.setAttribute('aria-valuetext', `${dayLabel(s.ymd)}, ${fmtClock(s.sec)}`);
    this._moveCursor();
  }

  moveTo(sec) { this.sec = sec; this._moveCursor(); }

  setNote(text) { this.note.textContent = text; }

  _tipAt(e) {
    if (!this.hb || !this.covered) return;
    const r = this.chart.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - r.left, 0), r.width);
    const b = Math.min(this.hb.total.length - 1, Math.floor(((x / r.width) * DAY) / this.hb.bin));
    this.tip.hidden = false;
    const fe = this.hb.ferry ? this.hb.ferry[b] : 0;
    this.tip.textContent = `${fmtClock(b * this.hb.bin)}: ${fmtN(this.hb.bus[b])} buses, ${fmtN(this.hb.train[b])} trains${fe ? `, ${fmtN(fe)} ${fe === 1 ? 'ferry' : 'ferries'}` : ''}`;
    const w = this.tip.offsetWidth;
    this.tip.style.left = `${Math.min(Math.max(x - w / 2, 0), r.width - w)}px`;
  }

  _draw() {
    const W = this.chart.clientWidth, H = this.chart.clientHeight;
    if (!W || !H) return;
    this.W = W; this.H = H;
    const svg = this.svg;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.replaceChildren();
    const padT = 6, padB = 18;
    this.plotH = H - padT - padB; this.padT = padT;
    const x = (s) => (s / DAY) * W;
    // hour guides
    for (const [h, label] of [[0, '12am'], [6, '6am'], [12, 'noon'], [18, '6pm'], [24, '']]) {
      const gx = Math.min(W - 0.5, Math.max(0.5, x(h * 3600)));
      svg.append(sv('line', { x1: gx, x2: gx, y1: padT, y2: padT + this.plotH, class: 'g-grid' }));
      if (label) {
        const t = sv('text', { x: h === 0 ? gx + 3 : gx, y: H - 4, class: 'g-axis', 'text-anchor': h === 0 ? 'start' : 'middle' });
        t.textContent = label;
        svg.append(t);
      }
    }
    svg.append(sv('line', { x1: 0, x2: W, y1: padT + this.plotH + 0.5, y2: padT + this.plotH + 0.5, class: 'g-base' }));
    if (this.hb && this.covered) {
      const { total, bin } = this.hb;
      const max = Math.max(...total, 1) * 1.1;
      this.max = max;
      const y = (v) => padT + this.plotH - (v / max) * this.plotH;
      let d = '';
      for (let b = 0; b < total.length; b++) d += `${b ? 'L' : 'M'}${x(b * bin).toFixed(1)} ${y(total[b]).toFixed(1)}`;
      d += `L${W} ${y(total[total.length - 1]).toFixed(1)}`;
      svg.append(sv('path', { d: `${d}L${W} ${padT + this.plotH}L0 ${padT + this.plotH}Z`, class: 'g-area' }));
      svg.append(sv('path', { d, class: 'g-line' }));
      let pk = 0;
      for (let b = 1; b < total.length; b++) if (total[b] > total[pk]) pk = b;
      this.note.textContent = `Vehicles running through the day. Busiest at ${fmtClock(pk * bin)} with ${fmtN(total[pk])}.`;
    } else {
      this.max = 1;
      this.note.textContent = 'There is no timetable for this day.';
    }
    this.cursor = sv('line', { class: 'g-cursor', y1: 0, y2: H - padB + 2 });
    this.knob = sv('circle', { class: 'g-knob', r: 5 });
    svg.append(this.cursor, this.knob);
    this._moveCursor();
  }

  _moveCursor() {
    if (!this.cursor || !this.W) return;
    const cx = Math.min(this.W - 1, Math.max(1, (this.sec / DAY) * this.W));
    this.cursor.setAttribute('x1', cx);
    this.cursor.setAttribute('x2', cx);
    let cy = this.padT + this.plotH;
    if (this.hb && this.covered) {
      const b = Math.min(this.hb.total.length - 1, Math.floor(this.sec / this.hb.bin));
      cy = this.padT + this.plotH - (this.hb.total[b] / this.max) * this.plotH;
    }
    this.knob.setAttribute('cx', cx);
    this.knob.setAttribute('cy', cy);
  }
}
