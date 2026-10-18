// ride.js: riding along with a train on the kids' page (pure logic, no DOM, so it is tested in Node).
import { DAY } from './sim.js?v=1.8';

// Vehicle ids carry their service day (see Network.vehicles): at midnight today's trips become
// yesterday's, so a train running past midnight gets this much added to its id.
export const DAY_ID = 2 ** 40;

/** The vehicle with this id, following it across midnight. Returns { v, id } or null when the trip is over. */
export function findVehicle(byId, id) {
  const v = byId.get(id);
  if (v) return { v, id };
  const w = byId.get(id + DAY_ID);
  return w ? { v: w, id: id + DAY_ID } : null;
}

/** Stops (positions along the trip) reached since the last update. Several at once when time jumps ahead. */
export function stopsReached(prevK, k) {
  const out = [];
  for (let i = prevK + 1; i <= k; i++) out.push(i);
  return out;
}

/**
 * The next trains and ferries leaving a station, for "Hop on another train?".
 * Each: { id (the vehicle id it will have), route, pattern, k (its stop position there), t, destination stop }.
 */
export function trainsFrom(net, station, ymd, sec, { limit = 3, horizon = 1800 } = {}) {
  const out = [];
  for (const d of net.departures(net.stationStops[station], ymd, sec, { limit: 24, horizon })) {
    const r = net.routes[d.route], pat = net.patterns[d.pattern];
    if (!(r.isTrain || r.isFerry) || d.t < sec) continue;
    out.push({
      id: (d.shift === -DAY ? DAY_ID : 0) + d.prof * 2 ** 20 + d.ti,
      route: d.route, pattern: d.pattern, k: d.k, t: d.t, last: pat.stops[pat.stops.length - 1],
    });
    if (out.length >= limit) break;
  }
  return out;
}
