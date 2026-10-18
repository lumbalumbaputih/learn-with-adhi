// Run: node scripts/perth-transit-check-motion.mjs
// Checks the modelled train and ferry motion in perth-transit/sim.js (MOTION): stops at stations,
// leaves on the published minute, never goes backwards or jumps, and leaves buses untouched.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Network, MOTION } from '../perth-transit/sim.js';

const data = Object.fromEntries(['meta', 'core', 'trips', 'stops', 'shapes'].map((name) =>
  [name, JSON.parse(fs.readFileSync(new URL(`../perth-transit/data/${name}.json`, import.meta.url)))]));
const net = new Network(data);

const stats = { train: newStats(), ferry: newStats() };
function newStats() { return { profiles: 0, stops: 0, fullDwell: 0, shortDwell: 0, noDwell: 0, lateStops: 0, maxLate: 0, hardRuns: 0, fastRuns: 0, runs: 0, maxSpeed: 0 }; }

let busProfiles = 0;
for (const prof of net.profiles) {
  const pat = net.patterns[prof.pattern];
  const mode = net.routes[pat.route].mode;
  const mo = net._motion(prof);
  if (mode === 'bus') { assert.equal(mo, null, 'buses keep timetable interpolation'); busProfiles++; continue; }
  const cfg = MOTION[mode], S = stats[mode], n = prof.arr.length, ta = net.animTimes(prof.idx);
  S.profiles++;
  const run = { prof: prof.idx, t0: 0 };
  const at = (tau) => net.position(run, tau);

  // trip ends: leaves the first stop at its time, reaches the last stop exactly on time
  assert.equal(mo.arrive[0], prof.arr[0]);
  assert.equal(mo.arrive[n - 1], prof.arr[n - 1]);
  const end = at(prof.arr[n - 1]);
  assert.equal(end.state, 'end');
  assert.equal(end.dist, pat.dist[n - 1]);

  for (let k = 1; k < n - 1; k++) {
    S.stops++;
    if (prof.dw[k] > 0) continue; // a real stopping time from the timetable: kept as published
    const dwell = mo.depart[k] - mo.arrive[k], lateBy = mo.depart[k] - ta[k];
    assert.ok(lateBy >= -1e-9, 'never leaves before the published (smoothed) minute');
    assert.ok(lateBy <= cfg.late + 1e-9, 'never more than the allowed lateness');
    assert.ok(dwell >= 0 && dwell <= cfg.dwell + 1e-9);
    if (dwell >= cfg.dwell - 1e-9) S.fullDwell++; else if (dwell > 0) S.shortDwell++; else S.noDwell++;
    if (lateBy > 1e-9) { S.lateStops++; S.maxLate = Math.max(S.maxLate, lateBy); }
    if (dwell > 1) {
      const p = at((mo.arrive[k] + mo.depart[k]) / 2);
      assert.equal(p.state, 'dwell');
      assert.equal(p.k, k);
      assert.equal(p.dist, pat.dist[k], 'stands at the station during the dwell');
    }
  }
  for (let k = 0; k < n - 1; k++) {
    if (mo.acc[k] > 0) {
      S.runs++;
      if (mo.acc[k] > cfg.acc + 1e-9) S.hardRuns++;
      if (mo.top[k] > cfg.top + 1e-9) S.fastRuns++;
      S.maxSpeed = Math.max(S.maxSpeed, mo.top[k]);
    }
  }

  // never backwards, never a jump: step through the whole trip in 1-second steps
  let prev = at(prof.arr[0]).dist;
  for (let tau = prof.arr[0] + 1; tau <= prof.arr[n - 1]; tau++) {
    const d = at(tau).dist;
    assert.ok(d >= prev - 1e-6, `profile ${prof.idx} goes backwards at ${tau}`);
    assert.ok(d - prev < 70, `profile ${prof.idx} jumps ${Math.round(d - prev)} m at ${tau}`);
    prev = d;
  }
}

const kmh = (ms) => Math.round(ms * 3.6);
for (const [mode, S] of Object.entries(stats)) {
  console.log(`${mode}: ${S.profiles} timing profiles, ${S.stops} intermediate stops: ${S.fullDwell} full ${MOTION[mode].dwell} s dwell, ${S.shortDwell} shortened, ${S.noDwell} none; ` +
    `${S.lateStops} leave late (at most ${Math.round(S.maxLate)} s); ` +
    `${S.runs} runs: ${S.fastRuns} faster than ${kmh(MOTION[mode].top)} km/h and ${S.hardRuns} harder than ${MOTION[mode].acc} m/s² to keep time; top modelled speed ${kmh(S.maxSpeed)} km/h`);
}
console.log(`buses: ${busProfiles} timing profiles unchanged (timetable interpolation)`);
console.log('Motion checks pass.');
