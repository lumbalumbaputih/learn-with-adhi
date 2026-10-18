// Run: node scripts/perth-transit-check-kids.mjs
// Checks the Perth Train Spotter logic that needs no browser (perth-transit/ride.js and the pretend day):
// riding a train to the end of its trip at different frame rates and across midnight, the trains
// offered by "Hop on another train?", and the typical day used outside the timetable.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Network, addDays, ymdToDow, DAY } from '../perth-transit/sim.js';
import { findVehicle, stopsReached, trainsFrom } from '../perth-transit/ride.js';

const data = Object.fromEntries(['meta', 'core', 'trips', 'stops', 'shapes'].map((name) =>
  [name, JSON.parse(fs.readFileSync(new URL(`../perth-transit/data/${name}.json`, import.meta.url)))]));
const net = new Network(data);
const YMD = 20261019; // a Monday
const at = (T) => (T >= DAY ? [addDays(YMD, 1), T - DAY] : [YMD, T]); // seconds after Monday midnight, may pass midnight
const byIdAt = (T) => new Map(net.vehicles(...at(T)).map((v) => [v.id, v]));

// ---- riding: the train is never lost before its trip ends, and every stop is reached exactly once, in order
let seed = 7;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const R = net.runsForDay(YMD);
const trainRuns = [];
for (let i = 0; i < R.n; i++) if (net.routes[net.patterns[net.profiles[R.prof[i]].pattern].route].isTrain) trainRuns.push(i);
const picked = new Set();
while (picked.size < 20) picked.add(trainRuns[Math.floor(rand() * trainRuns.length)]);
const overMidnight = trainRuns.filter((i) => R.start[i] < DAY && R.end[i] > DAY).slice(0, 3);
assert.ok(overMidnight.length > 0, 'some Monday trains run past midnight');
for (const i of overMidnight) picked.add(i);

let rides = 0;
for (const i of picked) {
  const prof = net.profiles[R.prof[i]], n = net.patterns[prof.pattern].stops.length;
  for (const step of [2, 6, 60]) { // 60x at 30, 10 and 1 frames a second
    let id = prof.idx * 2 ** 20 + R.ti[i], k = 0;
    const reached = [];
    let T = R.start[i];
    for (; T <= R.end[i] + step; T += step) {
      const f = findVehicle(byIdAt(T), id);
      if (!f) break;
      id = f.id;
      reached.push(...stopsReached(k, f.v.k));
      k = f.v.k;
    }
    assert.ok(T >= R.end[i], `run ${i} lost at ${T} before its end ${R.end[i]} (step ${step})`); // a trip is over at its end time (Network.active)
    reached.push(...stopsReached(k, n - 1)); // the trip is over: the last stops count as reached
    assert.deepEqual(reached, Array.from({ length: n - 1 }, (_, j) => j + 1), `run ${i} step ${step}`);
    rides++;
  }
}

// ---- "Hop on another train?": the offered id is the train that will be at that station at that time
const stationByName = (name) => net.stationName.findIndex((s) => s === name);
let offers = 0;
for (const name of ['Perth Stn', 'Fremantle Stn', 'Mandurah Stn', 'Elizabeth Quay Jetty', 'Midland Stn']) {
  const st = stationByName(name);
  assert.ok(st >= 0, name);
  for (const T of [8 * 3600, 23 * 3600 + 50 * 60]) {
    const list = trainsFrom(net, st, YMD, T, { limit: 3 });
    assert.ok(list.length > 0, `${name} has trains at ${T}`);
    for (const d of list) {
      assert.ok(d.t >= T);
      assert.ok(net.routes[d.route].isTrain || net.routes[d.route].isFerry);
      const f = findVehicle(byIdAt(d.t), d.id);
      assert.ok(f, `${name}: offered train ${d.id} exists at its departure time`);
      assert.equal(f.v.pattern, d.pattern);
      assert.ok(f.v.k === d.k || f.v.k === d.k - 1, `${name}: at or arriving at the station`);
      offers++;
    }
  }
}

// ---- pretend day: the covered day with the same weekday that runs the most trips (never a holiday)
const typical = [];
for (let off = 0; off < 7; off++) {
  const ymd = addDays(20270301, off), t = net.typicalDay(ymd);
  assert.ok(net.covers(t), `typical day for ${ymd}`);
  assert.equal(ymdToDow(t), ymdToDow(ymd));
  for (let d = net.meta.validFrom; d <= net.meta.validTo; d = addDays(d, 1)) {
    if (ymdToDow(d) === ymdToDow(t)) assert.ok(net.tripsOn(t) >= net.tripsOn(d), `${t} runs at least as many trips as ${d}`);
  }
  typical.push(t);
}
for (const holiday of [20261225, 20261226, 20270101]) assert.ok(!typical.includes(holiday), `${holiday} is never a pretend day`);

console.log(`Kids checks pass: ${rides} rides (${picked.size} trains incl. ${overMidnight.length} past midnight, at 3 frame rates), ${offers} "hop on another train" offers, 7 pretend days (${typical.join(', ')}).`);
