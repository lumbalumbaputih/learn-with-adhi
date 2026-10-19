"""Check the catalogue refresh against synthetic OSM fixtures, never live data."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('perth-transit-build-places.py')
spec = importlib.util.spec_from_file_location('builder', SCRIPT)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def node(id, lat=-31.95, **tags):
    return dict(type='node', id=id, lat=lat, lon=115.86, tags={'name': 'Example Hotel', 'tourism': 'hotel', **tags})


def source(elements):
    return dict(osm3s={'timestamp_osm_base': '2026-10-19T00:00:00Z'}, elements=elements)


class CatalogueBuilderChecks(unittest.TestCase):
    def test_named_venues_duplicate_buildings_and_chain_branches(self):
        original = node(1, alt_name='Old Example Inn;Example Hotel')
        building = dict(type='way', id=2, center={'lat': -31.95001, 'lon': 115.86}, tags=original['tags'])
        result = builder.build(source([original, building, node(3, lat=-32.05), node(4, access='private'), node(5, lat=0)]))
        self.assertEqual([p['id'] for p in result['places']], ['node/1', 'node/3'])
        self.assertEqual(result['places'][0]['aliases'], ['Old Example Inn'])
        self.assertEqual(result['license'], 'ODbL-1.0')

    def test_partial_and_undated_responses_are_rejected(self):
        with self.assertRaises(ValueError):
            builder.build({**source([node(1)]), 'remark': 'timeout'})
        with self.assertRaises(ValueError):
            builder.build({'elements': [node(1)]})

    def test_failed_refresh_keeps_existing_data(self):
        with tempfile.TemporaryDirectory() as folder:
            raw, output = Path(folder) / 'source.json', Path(folder) / 'places.json'
            raw.write_text(json.dumps(source([node(1)])))
            output.write_text('existing catalogue')
            result = subprocess.run([sys.executable, '-I', str(SCRIPT), '--input', str(raw), '--output', str(output)], capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(output.read_text(), 'existing catalogue')
            result = subprocess.run([sys.executable, '-I', str(SCRIPT), '--input', str(raw), '--output', str(output), '--min-places', '1'], capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(len(json.loads(output.read_text())['places']), 1)
            self.assertEqual(output.stat().st_mode & 0o777, 0o644)


if __name__ == '__main__':
    unittest.main()
