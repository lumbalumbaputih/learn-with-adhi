import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PlaceCatalogue, loadPlaceCatalogue } from '../perth-transit/places.js';

const place = (id, name, extra = {}) => ({ id: `node/${id}`, name, kind: 'hotel', lat: -31.95, lon: 115.86, locality: 'Perth', address: '', ...extra });
const data = { version: 1, sourceTimestamp: '2026-10-19T00:00:00Z', places: [
  place(1, 'Example Hotel', { aliases: ['Old Example Inn'] }),
  place(2, 'Example Hotel Riverside', { locality: 'Fremantle', lat: -32.05, lon: 115.75 }),
  place(3, 'Café D’Example', { kind: 'cafe' }),
  place(4, 'Example Hotel', { locality: 'Mandurah', lat: -32.53, lon: 115.72 }),
  place(5, 'Example Restaurant & Bar', { kind: 'restaurant' }),
] };
const catalogue = new PlaceCatalogue(data);
assert.deepEqual(catalogue.search('cafe dexample').map((p) => p.id), ['node/3'], 'Accent and apostrophe variants find the cafe');
assert.equal(catalogue.search('old example inn')[0].id, 'node/1', 'An alternative venue name works');
assert.equal(catalogue.search('example hotel mand')[0].id, 'node/4', 'Name plus suburb disambiguates a chain');
assert.equal(catalogue.search('EXAMPLE HOTEL', 8, { lat: -32.53, lon: 115.72 })[0].id, 'node/4', 'Nearby exact matches rank before farther branches and partial matches');
assert.equal(catalogue.search('restaurant and bar')[0].id, 'node/5', 'Ampersand and and are interchangeable');
assert.equal(catalogue.search('example hot')[0].id, 'node/1', 'Partial words work');
assert.equal(catalogue.search('hotel example frem')[0].id, 'node/2', 'Word order and locality work');
assert.equal(catalogue.search('not a real match').length, 0);
assert.equal(catalogue.search('e').length, 0);
assert.equal(catalogue.search('example', 2).length, 2);
assert.equal(catalogue.geojson().features.length, data.places.length);
assert.throws(() => new PlaceCatalogue({ ...data, places: [...data.places, data.places[0]] }), /Invalid/);
assert.throws(() => new PlaceCatalogue({ ...data, places: [place(9, 'Outside Perth', { lat: 51 })] }), /Invalid/);
assert.throws(() => new PlaceCatalogue({ ...data, places: [place(9, 'Broken ID', { id: 'javascript:alert(1)' })] }), /Invalid/);
assert.throws(() => new PlaceCatalogue({ ...data, places: [] }), /unavailable/);
assert.throws(() => new PlaceCatalogue({ ...data, sourceTimestamp: 'unknown' }), /unavailable/);
assert.equal((await loadPlaceCatalogue(async () => ({ ok: true, json: async () => data }))).search('old example inn')[0].id, 'node/1');
await assert.rejects(loadPlaceCatalogue(async () => ({ ok: false, status: 404 })), /404/);
await assert.rejects(loadPlaceCatalogue(async () => ({ ok: true, json: async () => ({}) })), /unavailable/);
console.log('Place search: names, aliases, accents, partial words, suburbs, ranking, catalogue validation and load failures pass.');

if (process.argv.includes('--catalogue')) {
  const shipped = new PlaceCatalogue(JSON.parse(fs.readFileSync(new URL('../perth-transit/data/places.json', import.meta.url))));
  assert.ok(shipped.entries.length >= 1000, 'A full Perth catalogue must be generated before publication');
  const hotels = shipped.entries.filter(({ place }) => place.kind === 'hotel');
  assert.ok(hotels.length >= 20, 'Catalogue includes Perth hotels');
  assert.ok(hotels.some(({ place }) => shipped.search(place.name).some((p) => p.id === place.id)), 'Real hotel names are searchable');
  console.log(`Shipped catalogue: ${shipped.entries.length} places, ${hotels.length} hotels; source ${shipped.updated}.`);
}
