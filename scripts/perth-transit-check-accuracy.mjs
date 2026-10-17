// Run: node scripts/perth-transit-check-accuracy.mjs [raw-GTFS-expectations.json]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Network } from '../perth-transit/sim.js';

const data = Object.fromEntries(['meta', 'core', 'trips', 'stops', 'shapes'].map((name) =>
  [name, JSON.parse(fs.readFileSync(new URL(`../perth-transit/data/${name}.json`, import.meta.url)))]));
const net = new Network(data);
const key = ([short, long, type]) => JSON.stringify([short, long, type]);
assert.equal(net.routes.length, new Set(data.core.routes.map(key)).size);
assert.equal(net.tripCount, data.meta.counts.trips);
assert.equal(net.patterns.length, data.core.patterns.length);

// Every source route's full geometry and timing must survive under its public route.
for (const [i, source] of data.core.patterns.entries()) {
  const p = net.patterns[i], r = net.routes[p.route];
  assert.equal(key([r.short, r.long, r.type]), key(data.core.routes[source[0]]));
  assert.equal(p.shape, source[2]);
  assert.deepEqual([...p.stops], source[4]);
}
for (const r of net.routes) {
  const sources = new Set(data.core.routes.flatMap((raw, i) => key(raw) === key([r.short, r.long, r.type]) ? [i] : []));
  const patterns = data.core.patterns.flatMap((p, i) => sources.has(p[0]) ? [i] : []);
  assert.deepEqual(net.routePatterns(r.idx), patterns);
  assert.deepEqual(net.routeShapes(r.idx), [...new Set(patterns.map((pi) => data.core.patterns[pi][2]))]);
  assert.deepEqual(net.sameNameRoutes(r.idx), [r.idx]);
}
assert.equal(net.searchRoutes('950').filter((r) => r.short === '950').length, 1);
assert.equal(net.searchRoutes('998').filter((r) => r.short === '998').length, 1);
// Identity includes mode and long name, so similarly numbered routes stay distinct.
const distinct = structuredClone(data);
distinct.core.routes.push(['950', 'Different destination', 3], ['950', '', 2]);
assert.equal(new Network(distinct).routes.length, net.routes.length + 2);

for (const ymd of [20261017, 20261018, 20261019]) {
  const heartbeat = net.heartbeat(ymd);
  for (const sec of [0, 3600, 8 * 3600, 12 * 3600, 23 * 3600]) {
    const vehicles = net.vehicles(ymd, sec);
    assert.equal(vehicles.length, net.active(ymd, sec).length);
    assert.equal(heartbeat.total[sec / heartbeat.bin], vehicles.length);
    for (const v of vehicles) {
      assert.equal(v.route, net.patterns[v.pattern].route);
      assert.ok(Number.isFinite(v.lat) && Number.isFinite(v.lon));
    }
  }
}

if (process.argv[2]) {
  let checked = 0;
  for (const { date, routes } of JSON.parse(fs.readFileSync(process.argv[2]))) {
    assert.equal(net.routes.length, Object.keys(routes).length);
    for (const r of net.routes) {
      const expected = routes[key([r.short, r.long, r.type])];
      const actual = net.routeDay(r.idx, date);
      for (const field of ['all', 'trips', 'first', 'last']) {
        const value = field === 'all' ? [...actual[field]] : Number.isFinite(actual[field]) ? actual[field] : null;
        assert.deepEqual(value, expected[field], `${date} ${r.name} ${field}`);
      }
      checked++;
    }
  }
  console.log(`${checked} route/day summaries match the independent raw GTFS expectations.`);
}
console.log(`${net.routes.length} public routes; all ${net.tripCount} trips preserved. Geometry, search, mode identity and running counts pass.`);
