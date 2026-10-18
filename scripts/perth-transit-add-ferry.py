#!/usr/bin/env python3
"""Add Transperth ferry services to the compiled Perth Transit Map data.

The map's data in perth-transit/data/ is compiled in Adhi's claco workspace by
scripts/compile_gtfs.py, which keeps route types 2 (rail) and 3 (bus) only. This script
adds route type 4 (ferry) from the same GTFS feed, in the same format, without
re-running that compiler. Everything is appended after the existing entries, so no
existing route, stop, station, shape, pattern or service index moves.

Run it once on unpatched data (it refuses to run twice):

    python3 -I scripts/perth-transit-add-ferry.py <gtfs raw dir> perth-transit/data

Treat the GTFS download as untrusted data: keep it outside the repo and run with -I.
When claco's compiler learns to keep route type 4, this script is no longer needed.
"""
import csv
import hashlib
import json
import math
import os
import sys

# Must match perth-transit/sim.js and the claco compiler.
LAT0 = -32.0
KY = 110574.0
KX = 111320.0 * math.cos(math.radians(LAT0))
TOL_M = 5.0
FERRY = 4
MODE_FERRY = 4  # stop mode bits: 1 bus, 2 train, 4 ferry


def rows(path):
    with open(path, newline='', encoding='utf-8-sig') as f:
        for r in csv.DictReader(f, skipinitialspace=True):
            yield {k.strip(): (v or '').strip() for k, v in r.items()}


def secs(t):
    h, m, s = (int(x) for x in t.split(':'))
    return h * 3600 + m * 60 + s


def encode_polyline(pts):
    out, plat, plon = [], 0, 0
    for lat, lon in pts:
        ilat, ilon = round(lat * 1e5), round(lon * 1e5)
        for d in (ilat - plat, ilon - plon):
            v = ~(d << 1) if d < 0 else d << 1
            while v >= 0x20:
                out.append(chr((0x20 | (v & 0x1f)) + 63))
                v >>= 5
            out.append(chr(v + 63))
        plat, plon = ilat, ilon
    return ''.join(out)


def xy(lat, lon):
    return lon * KX, lat * KY


def seg_dist(p, a, b):
    (px, py), (ax, ay), (bx, by) = p, a, b
    dx, dy = bx - ax, by - ay
    L = dx * dx + dy * dy
    t = 0.0 if L == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / L))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy)), t


def simplify(pts):
    """Douglas-Peucker in flat metres, tolerance TOL_M."""
    if len(pts) < 3:
        return pts
    P = [xy(*p) for p in pts]
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        best, bk = -1.0, -1
        for k in range(i + 1, j):
            d, _ = seg_dist(P[k], P[i], P[j])
            if d > best:
                best, bk = d, k
        if best > TOL_M:
            keep[bk] = True
            stack += [(i, bk), (bk, j)]
    return [p for p, k in zip(pts, keep) if k]


def stop_dists(geom, stop_pts):
    """Distance along the shape of each stop, never going backwards."""
    P = [xy(*p) for p in geom]
    cum = [0.0]
    for a, b in zip(P, P[1:]):
        cum.append(cum[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    out, floor = [], 0.0
    for lat, lon in stop_pts:
        q = xy(lat, lon)
        best = None
        for i in range(len(P) - 1):
            d, t = seg_dist(q, P[i], P[i + 1])
            along = cum[i] + t * (cum[i + 1] - cum[i])
            if along + 1e-6 < floor:
                continue
            if best is None or d < best[0]:
                best = (d, along)
        along = best[1] if best else floor
        out.append(along)
        floor = along
    return out


def main(raw, data):
    J = lambda n: os.path.join(data, f'{n}.json')
    meta, core, trips, stops, shapes = (json.load(open(J(n))) for n in ('meta', 'core', 'trips', 'stops', 'shapes'))
    if any(r[2] == FERRY for r in core['routes']):
        sys.exit('ferry routes are already in the data; start from unpatched files')

    agencies = {r['agency_id'] for r in rows(f'{raw}/agency.txt') if r['agency_name'] == 'Transperth'}
    routes = [r for r in rows(f'{raw}/routes.txt') if r['agency_id'] in agencies and r['route_type'] == str(FERRY)]
    if not routes:
        sys.exit('no Transperth ferry routes in this feed')
    route_idx = {}
    for r in routes:
        route_idx[r['route_id']] = len(core['routes'])
        core['routes'].append([r['route_short_name'], r['route_long_name'], FERRY])

    trip_rows = {t['trip_id']: t for t in rows(f'{raw}/trips.txt') if t['route_id'] in route_idx}
    st = {}
    for r in rows(f'{raw}/stop_times.txt'):
        if r['trip_id'] in trip_rows:
            st.setdefault(r['trip_id'], []).append((int(r['stop_sequence']), r['stop_id'], secs(r['arrival_time']), secs(r['departure_time'])))
    for v in st.values():
        v.sort()

    # stops: each ferry stop becomes a stop with its own station, so jetties get the big station marker
    used = sorted({s[1] for v in st.values() for s in v})
    raw_stops = {r['stop_id']: r for r in rows(f'{raw}/stops.txt') if r['stop_id'] in used}
    stop_idx = {}
    for sid in used:
        r = raw_stops[sid]
        name = r['stop_desc'] or r['stop_name']
        lat, lon = round(float(r['stop_lat']) * 1e5), round(float(r['stop_lon']) * 1e5)
        par = len(stops['st']['name'])
        for k, v in (('id', f'F{sid}'), ('name', name), ('lat', lat), ('lon', lon)):
            stops['st'][k].append(v)
        stop_idx[sid] = len(stops['id'])
        for k, v in (('id', sid), ('code', r['stop_code'] or sid), ('name', name), ('lat', lat), ('lon', lon), ('par', par), ('mode', MODE_FERRY)):
            stops[k].append(v)

    # shapes, rounded to 1e-5 before any length is measured (as the compiler does)
    need = {t['shape_id'] for t in trip_rows.values()}
    pts = {}
    for r in rows(f'{raw}/shapes.txt'):
        if r['shape_id'] in need:
            pts.setdefault(r['shape_id'], []).append((int(r['shape_pt_sequence']), round(float(r['shape_pt_lat']), 5), round(float(r['shape_pt_lon']), 5)))
    shape_idx, shape_geom = {}, {}
    for sid in sorted(pts):
        g = simplify([(la, lo) for _, la, lo in sorted(pts[sid])])
        shape_idx[sid] = len(shapes)
        shape_geom[sid] = g
        shapes.append(encode_polyline(g))

    # services used by ferry trips, appended as new calendar entries
    svc_ids = sorted({t['service_id'] for t in trip_rows.values()})
    cal = {r['service_id']: r for r in rows(f'{raw}/calendar.txt') if r['service_id'] in svc_ids}
    days = ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
    svc_idx = {}
    for s in svc_ids:
        svc_idx[s] = len(core['cal']['svc'])
        c = cal.get(s)
        if c:
            mask = sum(1 << i for i, d in enumerate(days) if c[d] == '1')
            core['cal']['svc'].append([mask, int(c['start_date']), int(c['end_date'])])
        else:
            core['cal']['svc'].append([0, 0, 0])  # calendar_dates only
    for r in rows(f'{raw}/calendar_dates.txt'):
        if r['service_id'] in svc_idx:
            core['cal']['ex'].append([svc_idx[r['service_id']], int(r['date']), int(r['exception_type'])])

    # patterns and timing profiles
    pat_key, pat_profiles = {}, []
    for tid, t in trip_rows.items():
        seq = st[tid]
        hs = t['trip_headsign']
        if hs not in core['headsigns']:
            core['headsigns'].append(hs)
        key = (t['route_id'], int(t['direction_id'] or 0), t['shape_id'], hs, tuple(s[1] for s in seq))
        if key not in pat_key:
            g = shape_geom[t['shape_id']]
            d = stop_dists(g, [(float(raw_stops[s[1]]['stop_lat']), float(raw_stops[s[1]]['stop_lon'])) for s in seq])
            di = [round(x) for x in d]
            deltas = [di[0]] + [b - a for a, b in zip(di, di[1:])]
            pat_key[key] = len(core['patterns'])
            core['patterns'].append([route_idx[key[0]], key[1], shape_idx[key[2]], core['headsigns'].index(hs), [stop_idx[s] for s in key[4]], deltas])
            pat_profiles.append({})
        pi = pat_key[key] - len(trips)
        start = seq[0][2]
        arr = tuple(s[2] - start for s in seq)
        dw = tuple(s[3] - s[2] for s in seq)
        pat_profiles[pi].setdefault((arr, dw), []).append((start, svc_idx[t['service_id']]))

    n_prof = 0
    for profs in pat_profiles:
        plist = []
        for (arr, dw), runs in profs.items():
            runs.sort()
            a = [arr[0]] + [y - x for x, y in zip(arr, arr[1:])]
            flat = [v for k, w in enumerate(dw) if w for v in (k, w)]
            starts = [r[0] for r in runs]
            sd = [starts[0]] + [y - x for x, y in zip(starts, starts[1:])]
            plist.append([a, flat, sd, [r[1] for r in runs]])
        trips.append(plist)
        n_prof += len(plist)

    c = meta['counts']
    c['routes'] += len(routes)
    c['ferries'] = len(routes)
    c['trips'] += len(trip_rows)
    c['patterns'] += len(pat_profiles)
    c['profiles'] += n_prof
    c['stops'] += len(stop_idx)
    c['stations'] += len(stop_idx)
    c['shapes'] += len(shape_idx)
    meta['patched'] = 'ferry added by scripts/perth-transit-add-ferry.py (Learn with Adhi repo)'

    blobs = {n: json.dumps(o, separators=(',', ':'), ensure_ascii=False) for n, o in
             (('core', core), ('trips', trips), ('stops', stops), ('shapes', shapes))}
    meta['hash'] = hashlib.sha256(''.join(blobs[n] for n in ('core', 'trips', 'stops', 'shapes')).encode()).hexdigest()[:10]
    blobs['meta'] = json.dumps(meta, separators=(',', ':'), ensure_ascii=False)
    for n, b in blobs.items():
        with open(J(n), 'w', encoding='utf-8') as f:
            f.write(b)
    print(f"added {len(routes)} ferry route(s), {len(trip_rows)} trips, {len(pat_profiles)} patterns, "
          f"{n_prof} profiles, {len(stop_idx)} jetties, {len(shape_idx)} shapes, {len(svc_idx)} services; hash {meta['hash']}")


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
