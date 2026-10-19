The place catalogue (`places.json`) is derived from OpenStreetMap and made
available under the Open Database Licence (ODbL) 1.0:
https://opendatacommons.org/licenses/odbl/1-0/

© OpenStreetMap contributors — https://www.openstreetmap.org/copyright

Individual contents are available under the Database Contents Licence:
https://opendatacommons.org/licenses/dbcl/1-0/

The catalogue records its source timestamp, geographic bounds and generation
time. Coordinates for ways and relations are bounding-box centres, which can
be approximate. It is a periodically refreshed extract, not a live business
directory or a complete list of Perth destinations.

The download/compilation process is in `scripts/perth-transit-build-places.py`.
The rest of the application's code is separate from this database.
