// A static OpenStreetMap catalogue. Queries stay on this device; no geocoding API.
export const normalise = (s) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
  .replace(/&/g, ' and ').replace(/['’]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

const withinPerth = (p) => Number.isFinite(p.lat) && Number.isFinite(p.lon)
  && p.lat >= -32.7 && p.lat <= -31.35 && p.lon >= 115.5 && p.lon <= 116.5;

export class PlaceCatalogue {
  constructor(data) {
    if (data?.version !== 1 || !Array.isArray(data.places) || !data.places.length
        || typeof data.sourceTimestamp !== 'string' || !Number.isFinite(Date.parse(data.sourceTimestamp))) {
      throw new Error('Place catalogue unavailable');
    }
    this.updated = data.sourceTimestamp.slice(0, 10);
    this.byId = new Map();
    this.entries = data.places.map((p) => {
      if (typeof p.name !== 'string' || !p.name.trim() || !/^(node|way|relation)\/\d+$/.test(p.id)
          || this.byId.has(p.id) || !withinPerth(p) || typeof p.kind !== 'string'
          || typeof p.locality !== 'string' || typeof p.address !== 'string'
          || (p.aliases !== undefined && (!Array.isArray(p.aliases) || p.aliases.some((a) => typeof a !== 'string')))) {
        throw new Error('Invalid place catalogue');
      }
      const place = { ...p };
      this.byId.set(p.id, place);
      const names = [p.name, ...(p.aliases || [])].map(normalise);
      return { place, names, words: normalise([p.name, ...(p.aliases || []), p.locality].join(' ')).split(' ') };
    });
  }

  search(query, limit = 8, centre = null) {
    const q = normalise(query);
    if (q.length < 2) return [];
    const tokens = q.split(' ');
    const matches = [];
    for (const { place, names, words } of this.entries) {
      if (!tokens.every((token) => words.some((word) => word.startsWith(token)))) continue;
      const score = names.some((n) => n === q) ? 0 : names.some((n) => n.startsWith(q)) ? 1 : 2;
      const distance = centre ? Math.hypot(place.lat - centre.lat, (place.lon - centre.lon) * 0.85) : 0;
      matches.push({ place, score, distance });
    }
    return matches.sort((a, b) => a.score - b.score || a.distance - b.distance || a.place.name.localeCompare(b.place.name) || a.place.id.localeCompare(b.place.id))
      .slice(0, limit).map((m) => m.place);
  }

  geojson() {
    return { type: 'FeatureCollection', features: this.entries.map(({ place: p }) => ({
      type: 'Feature', properties: { id: p.id, name: p.name, rank: ['hotel', 'motel', 'hostel'].includes(p.kind) ? 0 : 1 },
      geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
    })) };
  }
}

export async function loadPlaceCatalogue(fetcher = globalThis.fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetcher('data/places.json?v=1.10.1', { signal: controller.signal, cache: 'no-cache' });
    if (!response.ok) throw new Error(`Place catalogue ${response.status}`);
    return new PlaceCatalogue(await response.json());
  } finally { clearTimeout(timer); }
}

export const placeDescription = (place) => [place.kind.replaceAll('_', ' '), place.locality || place.address].filter(Boolean).join(' · ');
