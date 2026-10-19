#!/usr/bin/env python3
"""Refresh the static Perth place catalogue from OpenStreetMap via Overpass.

Run offline, never per visitor. No API key or search subscription is needed.
Use --input to rebuild from a previously saved Overpass JSON response.
"""
import argparse
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import re
import tempfile
import unicodedata
from urllib.parse import urlencode
from urllib.request import Request, urlopen

BOUNDS = [-32.7, 115.5, -31.35, 116.5]  # south, west, north, east; Perth metropolitan transit area
TOURISM = 'hotel|motel|hostel|guest_house|apartment|camp_site|caravan_site|attraction|museum|gallery|viewpoint|zoo|aquarium|theme_park'
AMENITY = 'restaurant|cafe|fast_food|bar|pub|food_court|school|college|university|kindergarten|library|hospital|clinic|doctors|dentist|pharmacy|bank|post_office|community_centre|arts_centre|cinema|theatre|place_of_worship|townhall|courthouse|police|fire_station|marketplace|ferry_terminal|bus_station|social_facility'
LEISURE = 'park|garden|sports_centre|stadium|swimming_pool|golf_course|recreation_ground|fitness_centre|marina|nature_reserve'
SETTLEMENT = 'suburb|quarter|neighbourhood|town|city|village|locality'
SELECTIONS = [('tourism', TOURISM), ('amenity', AMENITY), ('shop', None), ('leisure', LEISURE), ('place', SETTLEMENT), ('historic', None)]


def query():
    bbox = ','.join(map(str, BOUNDS))
    clauses = [f'nwr["name"]["{key}"' + (f'~"^({values})$"' if values else '') + f']({bbox});' for key, values in SELECTIONS]
    return '[out:json][timeout:120];(' + ''.join(clauses) + ');out center tags;'


def normalise(value):
    value = unicodedata.normalize('NFKD', value.casefold())
    return re.sub(r'[^\w]+', ' ', ''.join(c for c in value if not unicodedata.combining(c))).strip()


def build(raw):
    # Overpass can return HTTP 200 with a timeout remark and partial results.
    if raw.get('remark') or not isinstance(raw.get('elements'), list):
        raise ValueError('Overpass returned incomplete data; the existing catalogue was kept.')
    timestamp = raw.get('osm3s', {}).get('timestamp_osm_base')
    if not isinstance(timestamp, str) or not timestamp:
        raise ValueError('Source data is missing its OpenStreetMap timestamp.')
    places, seen = [], {}
    for element in raw['elements']:
        tags = element.get('tags', {})
        name = tags.get('name', '').strip()
        if not name or tags.get('access') == 'private' or element.get('type') not in ('node', 'way', 'relation'):
            continue
        kind = None
        for key, values in SELECTIONS:
            value = tags.get(key)
            if value and value not in ('no', 'vacant') and (values is None or value in values.split('|')):
                kind = value if key != 'shop' else ('shopping_centre' if value == 'mall' else 'shop')
                break
        if not kind:
            continue
        point = element if element['type'] == 'node' else element.get('center', {})
        lat, lon = point.get('lat'), point.get('lon')
        if not all(isinstance(v, (float, int)) and not isinstance(v, bool) and math.isfinite(v) for v in (lat, lon)):
            continue
        if not (BOUNDS[0] <= lat <= BOUNDS[2] and BOUNDS[1] <= lon <= BOUNDS[3]):
            continue
        # A venue is often tagged both as a node and its containing building.
        # Keep identically named venues at other locations, including chain branches.
        key = normalise(name)
        duplicate = next((p for p in seen.get(key, []) if math.hypot((p['lat'] - lat) * 111200, (p['lon'] - lon) * 94300) < 30), None)
        if duplicate:
            continue
        locality = tags.get('addr:suburb') or tags.get('addr:city') or ''
        street = ' '.join(filter(None, [tags.get('addr:housenumber'), tags.get('addr:street')]))
        aliases = list(dict.fromkeys(s.strip() for key in ('alt_name', 'short_name', 'name:en', 'brand') for s in tags.get(key, '').split(';') if s.strip() and s.strip() != name))
        place = dict(id=f"{element['type']}/{element['id']}", name=name, kind=kind,
                     lat=round(lat, 6), lon=round(lon, 6), locality=locality, address=street)
        if aliases:
            place['aliases'] = aliases
        seen.setdefault(key, []).append(place)
        places.append(place)
    places.sort(key=lambda p: (normalise(p['name']), p['id']))
    return dict(version=1, generatedAt=datetime.now(timezone.utc).isoformat(), sourceTimestamp=timestamp,
                bounds=BOUNDS, attribution='© OpenStreetMap contributors', license='ODbL-1.0',
                source='https://www.openstreetmap.org/copyright', places=places)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, help='Previously downloaded Overpass JSON')
    parser.add_argument('--raw-output', type=Path, help='Save the source response outside the repository for reproducibility')
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'perth-transit/data/places.json')
    parser.add_argument('--min-places', type=int, default=1000, help='Reject unexpectedly small downloads (default: 1000)')
    args = parser.parse_args()
    if args.input:
        body = args.input.read_bytes()
    else:
        request = Request('https://overpass-api.de/api/interpreter', data=urlencode({'data': query()}).encode(),
                          headers={'User-Agent': 'PerthTransitMap-catalogue-builder/1.0', 'Accept': 'application/json'})
        with urlopen(request, timeout=180) as response:
            body = response.read(100_000_001)
        if len(body) > 100_000_000:
            raise ValueError('Source response exceeded the 100 MB limit; catalogue unchanged.')
    catalogue = build(json.loads(body))
    if len(catalogue['places']) < args.min_places:
        raise ValueError(f"Only {len(catalogue['places'])} places; existing catalogue kept. Check the source response.")
    if args.raw_output:
        args.raw_output.write_bytes(body)
    # Failed requests and validation must never replace the shipped catalogue.
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=args.output.parent, delete=False) as out:
        json.dump(catalogue, out, ensure_ascii=False, separators=(',', ':'))
        temporary = Path(out.name)
    temporary.replace(args.output)
    print(f"Saved {len(catalogue['places'])} named places to {args.output}; source {catalogue['sourceTimestamp']}.")


if __name__ == '__main__':
    main()
