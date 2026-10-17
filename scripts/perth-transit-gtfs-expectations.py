#!/usr/bin/env python3
"""Independent answer key: python3 -I scripts/perth-transit-gtfs-expectations.py feed.zip > expected.json.

Reads the original GTFS directly; never imports or reads the map's compiled data.
"""
import csv
import datetime
import io
import json
import sys
import zipfile


def main(path):
    with zipfile.ZipFile(path) as feed:
        def rows(name):
            with feed.open(name + '.txt') as raw:
                yield from csv.DictReader(io.TextIOWrapper(raw, encoding='utf-8-sig'), skipinitialspace=True)

        agencies = {r['agency_id'] for r in rows('agency') if r['agency_name'] == 'Transperth'}
        routes = {r['route_id']: [r['route_short_name'], r['route_long_name'], int(r['route_type'])]
                  for r in rows('routes') if r['agency_id'] in agencies and r['route_type'] in ('2', '3', '4')}
        trips = {r['trip_id']: r for r in rows('trips') if r['route_id'] in routes}
        first = {}
        for r in rows('stop_times'):
            tid, sequence = r['trip_id'], int(r['stop_sequence'])
            if tid in trips and (tid not in first or sequence < first[tid][0]):
                h, m, s = map(int, r['departure_time'].split(':'))
                first[tid] = sequence, h * 3600 + m * 60 + s
        calendar, exceptions = list(rows('calendar')), list(rows('calendar_dates'))
        answer = []
        for date in ['20261017', '20261018', '20261019']:
            weekday = datetime.datetime.strptime(date, '%Y%m%d').strftime('%A').lower()
            services = {r['service_id'] for r in calendar
                        if r['start_date'] <= date <= r['end_date'] and r[weekday] == '1'}
            for r in exceptions:
                if r['date'] == date:
                    if r['exception_type'] == '1':
                        services.add(r['service_id'])
                    else:
                        services.discard(r['service_id'])
            groups = {}
            for tid, trip in trips.items():
                key = json.dumps(routes[trip['route_id']], separators=(',', ':'))
                group = groups.setdefault(key, {'all': [0] * 30, 'trips': 0, 'first': None, 'last': None})
                if trip['service_id'] not in services:
                    continue
                sec = first[tid][1]
                group['all'][sec // 3600] += 1
                group['trips'] += 1
                group['first'] = min(sec, group['first']) if group['first'] is not None else sec
                group['last'] = max(sec, group['last']) if group['last'] is not None else sec
            answer.append({'date': int(date), 'routes': groups})
        json.dump(answer, sys.stdout)


if __name__ == '__main__':
    main(sys.argv[1])
