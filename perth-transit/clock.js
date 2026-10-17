// clock.js: the simulation clock. Live follows Perth time; otherwise it runs from a chosen moment.
import { perthLocal, perthOffsetMs, addDays, DAY } from './sim.js?v=1.7';

export class SimClock {
  constructor() {
    this.live = true;
    this.speed = 1;
    this._base = null;
    this._off = { ms: 0, off: 0 };
  }

  _offset(ms) {
    if (!this._off.ms || Math.abs(ms - this._off.ms) > 600000) this._off = { ms, off: perthOffsetMs(ms) };
    return this._off.off;
  }

  /** Current simulated moment: { ymd, sec, dow? } with sec in [0, 86400). */
  now() {
    if (this.live) {
      const ms = Date.now();
      const p = perthLocal(ms, this._offset(ms));
      return { ymd: p.ymd, sec: p.sec };
    }
    const total = this._base.sec + ((performance.now() - this._base.wall) / 1000) * this.speed;
    const days = Math.floor(total / DAY);
    return { ymd: addDays(this._base.ymd, days), sec: total - days * DAY };
  }

  setTime(ymd, sec) {
    this.live = false;
    this._base = { ymd, sec, wall: performance.now() };
  }

  setSpeed(speed) {
    const n = this.now();
    this.speed = speed;
    this.setTime(n.ymd, n.sec);
  }

  goLive() {
    this.live = true;
    this.speed = 1;
  }

  shiftDays(n) {
    const c = this.now();
    this.setTime(addDays(c.ymd, n), c.sec);
  }
}
