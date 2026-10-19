# Perth Transit Map

A map of Perth's buses, trains and ferry moving through the day, in the style of a live transit map.

> **It is not live.** Vehicle positions are worked out from the published timetable. They are not tracked by GPS, so delays, cancellations and replacement buses are not shown. The page says this in the panel badge, in a "Simulated" label on the map and in the About dialog. Check the official journey planner for live times before you travel.

- **Live copy:** https://learn.tokocurahaustralia.com/perth-transit/ (folder `perth-transit/` in the Learn with Adhi repo, card T4 in the Tools category)
- **Built:** 2026-10-17, with Claude Code, for Adhi
- **Current version:** v1.11 — kids’ current-time and location controls; place-name search and map labels (section 5.1; previous release history in section 12).
- **Timetable valid:** 2026-10-13 to 2027-01-11. After that the map shows a banner and no vehicles until the data is rebuilt.
- **Source of truth:** **this repo** (Adhi's decision, 2026-10-18). Edit `perth-transit/` here. v1.0 was a byte-for-byte copy of the `site/` folder in Adhi's claco workspace (`2-claout/projects/perth-transit/`), and v1.1 to v1.9 were all made here, so **never re-copy claco's `site/` over this folder**: it would wipe the ferry and v1.1 onwards. claco still holds the original GTFS compiler (`scripts/compile_gtfs.py`), which a timetable rebuild needs (section 6). After a rebuild, copy only the five `data/*.json` files here and run `scripts/perth-transit-add-ferry.py` (the compiler still drops route type 4).

## 1. How this started

Adhi asked for a Perth version of a Jakarta live bus map, "using Perth data and Transperth real live API data".

The first job was to correct the premise. The Transperth timetable download has no vehicle positions, and there is no official Perth feed for them, so a genuinely live map was not possible from official data. Adhi then chose what to build, in two rounds of questions:

| Question | His choice |
|---|---|
| Where do vehicle positions come from? | Simulated from the timetable, clearly labelled |
| Which modes? | Trains and buses |
| Who is it for? | A public website |
| Live arrival times? | Phase 2, not version 1 |
| Download the official data? | Yes, and he accepted the licence |
| Visual design? | An independent, map-first look (not the Adhi design system tokens) |

The design choice was deliberate: this project does not use the Learn with Adhi colours or fonts.

## 2. What it does

- About 1,300 vehicles at the weekday morning peak, animated along the real route shapes (8 train lines, 329 public bus routes and, since v1.3, the Elizabeth Quay to Mends St ferry).
- Trains stop at each station for a short time and speed up and slow down between stations (since v1.8, estimated, see section 4.2).
- **Perth Train Spotter** (`kids.html`, since v1.8): a kids' page on the same engine and map, for any kid visiting (English, not tied to the Learn with Adhi star system). Trains and the ferry only, big outlined shapes on coloured lines, current Perth time at normal speed on opening, Now to reset the clock, optional Me to centre a one-shot device location, Pause/Slow/Fast/Rocket time, a "pretend day" when the date is outside the timetable, and a For grown-ups box. Reached from the yellow **Kids** button on the map. The full plan is in `KIDS-PLAN.md`.
- Trains drawn as long bars and buses as short pills, in the route colour, pointing the way they travel (since v1.1). From zoom 15 each bus becomes a tag with its route number and a direction pointer (since v1.5).
- A time scrubber for any day in the timetable, with a day-long chart of how many vehicles are running (5 minute bins), plus a Now button, previous and next day, and speed control. On phones the chart is hidden (since v1.2), so time there is changed with the buttons only.
- Tap a vehicle for its route, headsign, next stop and a Follow button.
- Routes, Stops and Map tabs with one search box. A stop or station page shows the next timetable departures.
- Favourite places in the Map and Stops tabs: save Home, Work or custom names from the map centre, current location or a selected stop/station. Open a place to see nearby stops; edit its name/location or delete it. Stored only in this browser on this device, with no account sync.
- Near me (the location stays in the browser), a 3D buildings mode, layer toggles, and an About dialog with the data credit.
- Dark mode (since v1.4): follows the device, with a moon/sun button to switch by hand; the choice is kept in the browser.
- "How busy is this line?" on every route page (since v1.4): trips per hour through the day, the busiest hour and how often it runs then, first and last trip. From the timetable only: it shows service frequency, not crowding.
- A "What's new" version chip with a plain-language changelog (since v1.1).
- On phones, a bottom sheet with three heights (peek, half, full) and touch dragging.
- Shareable links: `?t=08:15&date=2026-10-19&speed=10` sets the moment, and the map position lives in the URL hash as `#@lat,lon,zoom`.

## 3. What it does not do

- No real-time anything. No delays, cancellations or replacement buses.
- No journey planner, fares or service alerts.
- Ferries: left out on purpose in v1.0, **added in v1.3** (section 12) by patching the compiled data, not through the claco compiler.
- No passenger numbers or crowding: the timetable has none, so "How busy is this line?" is about how often the line runs.
- Not yet tried on a real iPhone, Android phone, Safari or Firefox. Real-device frame rate is unmeasured.

## 4. How it works

It is a static site. There is no server code, no build step for the site and no API keys.

```
official timetable (GTFS zip)
        |  scripts/compile_gtfs.py   (run once, offline)
        v
site/data/*.json   (about 4.9 MB raw, about 0.8 MB gzipped)
        |  site/sim.js               (engine, no DOM, also runs in Node)
        v
vehicle positions, departures, search   -->   MapLibre map, side panel, scrubber
```

The original compiler and raw-GTFS fixture scripts live in the claco build folder. This repo now includes the ferry patch, independent accuracy checks and browser regression checks in `scripts/`.

### 4.1 The compiler (`scripts/compile_gtfs.py`)

- Reads the official static timetable and keeps agency "Transperth", route type 2 (rail) and 3 (bus).
- Groups trips so that trips with the same stop times share one "timing profile". 55,081 trips become 17,174 profiles, which is what keeps the data small. Each profile lists its trip start times and service ids.
- Simplifies each route shape with a 5 m Douglas-Peucker tolerance and stores it as an encoded polyline (precision 5).
- Writes five minified JSON files:

| File | Contents | Size |
|---|---|---|
| `meta.json` | feed id, validity window, counts, build info, a content hash | 329 B |
| `core.json` | routes, headsigns, patterns, service calendar | 0.78 MB |
| `trips.json` | per pattern: timing profiles and trip start times | 2.59 MB |
| `stops.json` | stations (parents) and stops, stored as columns | 0.89 MB |
| `shapes.json` | simplified shapes | 0.64 MB |

Counts in this build: 349 routes (8 train lines and 341 bus routes), 55,081 trips, 17,174 timing profiles, 2,186 patterns, 12,493 stops, 116 stations, 1,964 shapes.

### 4.2 The engine (`site/sim.js`)

- Pure logic with no browser dependencies, so it is tested in Node against the raw feed.
- Geometry uses flat metres: `x = lon * KX`, `y = lat * KY` with `LAT0 = -32.0`. The compiler and the browser must use identical constants, and the compiler rounds shape points to 1e-5 degrees before computing any length.
- Time is seconds since Perth local midnight of the service day. Trips can run past midnight (GTFS times go up to about 27 hours), so yesterday's service day is checked as well.
- For any moment it finds the trips that are running, locates each one on its shape by interpolating between stops (including dwell at stops), and answers departure, search, nearest-stop and route queries.
- **Timing detail that matters:** the timetable only has whole minutes, so several stops can share one minute. For animation only, those stops are spread evenly across the minute (`smoothTimes()`), otherwise vehicles jump. Departure boards use the raw published times, never the smoothed ones.
- **Train and ferry motion (since v1.8, `MOTION` in `sim.js`, animation only):** the timetable gives trains almost no stopping time (11 of 1,690 train stop entries), so a literal reading glides through every station. Trains now stand at each station for up to 25 s, leave on the published minute, and speed up and slow down at 0.9 m/s² up to 130 km/h (the ferry: 0.25 m/s², up to 8 m/s). When a rounded minute is too tight (Kelmscott to Challis is 1.48 km in "1 minute"), the stop shrinks to 15 s and then the train leaves up to 30 s late and catches up (once that 30 s limit is reached the stop can be shorter still: 19 stops, as little as about 6 s, e.g. Shenton Park); it never leaves early and always reaches the last stop on time. Buses are unchanged: they stop only on request, so a stop at every bus stop would be wrong. All of these figures are **assumptions** (typical suburban electric train, slow harbour ferry), not Transperth data. Trip start/end, counts, departure boards and "How busy is this line?" are unchanged.

### 4.3 The interface

| File | Job |
|---|---|
| `app.js` | loads the data, builds the network, clock, map, panel and scrubber, schedules vehicle updates on display frames (up to 30 per second), refreshes text once per second, handles the bottom sheet, locate, the About dialog and the What's new chip |
| `mapview.js` | MapLibre map and layers (bus routes, rail, selected route, stops, stations, vehicles, front marks, 3D buildings), click handling, the vehicle GeoJSON update |
| `panel.js` | tabs, search, route and stop pages, vehicle card, departures board |
| `scrubber.js` | the day chart and draggable cursor |
| `favourites.js` | validated browser storage and the accessible add/edit place dialog |
| `clock.js` | the simulation clock (live follows Perth time, or runs from a chosen moment) |
| `colors.js`, `util.js` | line colours and text contrast, small DOM helpers |
| `ride.js` | riding a train on the kids' page, as pure logic tested in Node (`scripts/perth-transit-check-kids.mjs`): following a vehicle across midnight (its id changes then), stops reached since the last frame, and the next trains from a station with the vehicle id each will have |
| `sound.js` | the kids' page sounds, made with Web Audio (pop, whistle, ferry horn, station chime, end-of-line fanfare; no audio files), and the optional read-aloud voice (`speechSynthesis`; **on-device voices only**, English (Australia) first, never an online voice, and silent if the device has no English voice). Settings in `localStorage` `ptmKids` (`{sound, voice}`, effects on and voice off by default) |
| `kids.html`, `kids.js`, `kids.css` | Perth Train Spotter, the kids' page (since v1.8). Reuses `sim.js`, `clock.js` and `mapview.js`; `mapview.js` takes `init(..., { kids: true })` for bigger outlined vehicles, coloured train lines and train stations only, and `setMode()` accepts a list of modes |
| `style.css` | all styling, desktop two-column layout, phone layout at max-width 819 px, reduced-motion handling |
| `vendor/` | MapLibre GL JS 6.11.2, vendored so no script loads from a CDN |
| `fonts/` | Archivo variable font, self-hosted |

On desktop the left panel is 400 px wide. The basemap is OpenFreeMap (positron style), loaded at runtime. If it cannot be reached, the map falls back to a plain background and still works. Vehicle data is pushed to one GeoJSON source on every tick, which averaged about 1 ms in testing (headless Chromium, software rendering). That figure is from v1.0, when vehicles were circles. v1.1 draws them as rotated symbol icons, which is heavier, and has not been re-timed.

### 4.4 Design

- Cool white panel, slate text (`#15222e`), teal accent (`#0a6c74`), amber badge for "Simulated".
- The eight line colours were chosen for colour-blind separation of neighbouring lines. Several are light (yellow, aqua, pink), so chips always carry the line name and pick dark or light text by contrast.
- Vehicle shapes (v1.1): images drawn on a canvas at load time in `mapview.js` (`vehImg()`), not image files. Each type has three images: a white outline, an SDF body tinted with the route colour, and a white front tip shown from zoom 13.5. Train 9 by 44 px, bus 9 by 17 px, scaled by zoom.
- Accessibility: keyboard use throughout, keyboard focus survives the vehicle card refreshing, arrow keys move between tabs, and an axe-core scan found no violations on 10 screens (desktop and phone). The What's new chip (v1.1) works with the keyboard (Enter opens it, Escape closes it) but has not been through an axe-core scan.

## 5. Run it

```
cd perth-transit        # or site/ in the build folder
python3 -m http.server 8099
```

Then open http://localhost:8099/. Any static host works. The whole folder is about 6 MB.

### 5.1 Place-name search (v1.10)

The main map can search hotels, shops, restaurants, landmarks and suburbs by name or alternative name, alongside routes and stops. Results include the place category and its suburb/address when supplied by OpenStreetMap. Selecting a place opens nearby stops, a named map pin and a button to save the exact location as a favourite. Nearby distances are straight-line distances; polygon locations are approximate bounding-box centres, not guaranteed entrances.

`places.js` searches a same-origin static catalogue; queries never go to an external search service. The timetable opens independently of catalogue loading and remains usable if the catalogue fails. Search then offers a retry. The main map draws catalogue points and collision-managed labels from zoom 14; Place names in Map layers controls them. The selected pin uses DOM text, so its name remains readable without external map fonts. Dark/light switching restores the catalogue and layer preference. The kids' page does not load the catalogue. On phones, typing opens the results panel. Selecting a named or favourite place expands the panel before centring the map, so its name/pin stays above the panel and time controls (v1.10.1).

**Bundled data (20 October 2026):** 15,711 named places, including 104 hotels. The OpenStreetMap source timestamp is `2026-10-19T22:22:21Z`. The catalogue is about 2.12 MB raw / 0.44 MB gzip. Real searches for Duxton Hotel Perth and Pan Pacific Perth, their nearby timetables, live light/dark map labels and phone layout have passed the live-provider browser check. Coverage depends on OpenStreetMap; this is not a complete business directory.

Refresh the catalogue offline (normally monthly, or after known venue changes):

```bash
cd /workspace/learn-with-adhi
python3 -I scripts/perth-transit-build-places.py --raw-output /tmp/perth-places-overpass.json
node scripts/perth-transit-places-check.mjs --catalogue
```

The single Overpass request collects named venues within south/west/north/east bounds `-32.7,115.5,-31.35,116.5`. It does not run for visitors. The builder removes same-name duplicates within 30 metres while preserving chain branches, omits explicitly private venues and rejects partial/failed or unexpectedly small responses without replacing the previous catalogue. To reproduce a build without downloading again, use `--input /tmp/perth-places-overpass.json`. The catalogue includes provenance and is distributed under ODbL 1.0; preserve `data/places.LICENSE.md` and visible OpenStreetMap attribution. OpenStreetMap coverage varies and the site does not promise every business or current opening status. No paid API key or search subscription is required; existing site hosting still applies.

Checks from the repository root, with the root served on port 8099:

```bash
node scripts/perth-transit-places-check.mjs
python3 -I -B scripts/perth-transit-places-builder-check.py
npm install --prefix /tmp/perth-checks --cache /tmp/perth-npm-cache playwright@1.64.1 axe-core@4.14.0
NODE_PATH=/tmp/perth-checks/node_modules PERTH_CHROMIUM_PATH=/usr/bin/chromium node scripts/perth-transit-places-browser-check.cjs
```

To validate real data and the live map provider after a refresh:

```bash
NODE_PATH=/tmp/perth-checks/node_modules PERTH_CHROMIUM_PATH=/usr/bin/chromium node scripts/perth-transit-places-live-browser-check.cjs
```

Both browser suites accept `PERTH_TEST_ORIGIN` when using a port other than 8099. In the managed cloud environment, the live check uses the inherited proxy and routes real OpenFreeMap asset responses through Playwright's API client, which uses the supplied Node CA trust. TLS verification stays enabled; provider assets are not mocked. The current-instance live check loaded 26 real vector tiles and seven font responses. Keep the configured proxy and CA environment when running it.

`PERTH_CHROMIUM_PATH` is an optional system-Chromium override supported by the new and existing browser checks; omit it to use a Playwright-installed browser. Validated so far: search normalization/ranking, alternative names, suburb disambiguation, invalid catalogue handling; three builder checks for duplicate venues, partial results and safe replacement; browser loading/failure/retry, nearby timetable navigation, saving and reloading favourites, themes/layers, safe text rendering of source names, a visible destination label above the mobile sheet and two automated axe states. The existing main-map, favourite-place and Train Spotter browser suites also pass, including the kids layout matrix. The fixture suite verifies label-layer wiring with a test style. The live-provider check additionally verifies real hotel labels, vector tiles and fonts; physical devices remain untested.

## 6. Rebuild the timetable

The official source is the Transperth spatial data page (http://www.transperth.wa.gov.au/About/Spatial-Data-Access), where the licence must be accepted before download. This build used the MobilityData mirror of the same feed, `mdb-1086-202610160127`.

```
mkdir -p /tmp/gtfs && cd /tmp/gtfs
curl -LO https://files.mobilitydatabase.org/mdb-1086/mdb-1086-202610160127/mdb-1086-202610160127.zip
unzip mdb-1086-202610160127.zip -d raw
cd <build folder>
python3 -I scripts/compile_gtfs.py /tmp/gtfs/raw site/data mdb-1086-202610160127
python3 -I scripts/make_fixture.py /tmp/gtfs/raw test/fixture.json
node scripts/test_sim.mjs site test/fixture.json
```

Treat the downloaded files as untrusted data: keep them outside the project folder and run Python with `-I`. The feed covers all of Western Australia; the compiler keeps only agency "Transperth", rail and bus.

## 7. How it was tested

Three independent ways, all on 2026-10-17:

1. **Engine against an independent answer key.** `scripts/make_fixture.py` builds expected answers straight from the raw feed without reusing the compiler, and `scripts/test_sim.mjs` holds the engine to them. Result: 64 of 64 trips located, vehicle position within 24.7 m of the timetable interpolation at worst (median 5.7 m, 95th percentile 11 m), 60 of 60 departure queries and 35 of 35 running counts match a brute-force count, and the day chart matches the engine at every checked bin. One weakness: only one dwell-at-stop case was sampled.
2. **Browser behaviour.** 30 behaviour checks (click a vehicle, follow, search, route and stop pages, scrub, speed, layers, URL hash, About dialog, keyboard) and 8 phone checks (bottom sheet drag and snap, touch scrubbing, no horizontal scroll), in headless Chromium.
3. **Accessibility.** axe-core scan of 10 screens on desktop and phone: no violations.

After it was added to the Learn with Adhi site:

- The 30 behaviour checks and 8 phone checks pass from the `/perth-transit/` subfolder.
- 16 home-page checks pass for the new card at 1280 px and 390 px.
- The 30 behaviour checks pass against the production URL with no console errors.

v1.1 (in this repo, headless Chromium): screenshots at zooms 12.5, 14 and 15.6 on desktop and at 390 px; 9 of 9 What's new checks (hidden at start, hover opens, leaving closes, click pins it open, Escape closes, sits in the footer on desktop, tap opens on phone, fits on screen, tap outside closes); clicking a train and clicking a bus each open that vehicle's card; no console errors. **The 30 behaviour checks, 8 phone checks and axe-core scan were not re-run for v1.1**, because those scripts live in claco.

All browser testing was headless Chromium with software rendering. No real phone, Safari or Firefox.

## 8. Problems found and fixed during the build

- **Vehicles jumped** because the timetable has whole minutes only: 373 position checks failed. Fixed with `smoothTimes()` for animation. Positions are now within 24.7 m.
- **Map image name clash:** MapLibre reported "An image named 'arrow' already exists". The direction arrow was renamed `ptm-arrow`. (v1.1 images use the same `ptm-` prefix.)
- **On-street bus stops drawn as big labelled stations.** Added a `big` flag and a separate minor layer.
- **Station search missed "Perth Station"** because of the "Stn" abbreviation in the data. The search key now includes the "Station" spelling, and names are tidied (Stn becomes Station, "Mciver" becomes "McIver", the " Cat Id N" suffix is removed).
- **Phone layout:** the clock overlapped the previous-day button, and the expanded map attribution covered the controls. The clock is stacked and the attribution collapses after 4 seconds.
- **Colour contrast** of two line chips (red and blue) was below 4.5:1. Fixed with `chipColors()`.
- **Tab arrow keys** now follow the focused tab.
- **Test mistakes, not app bugs:** a wrong block selector, a missing wait after Escape, and a sheet-drag wait that was too short (the transition needs about 1.2 s).
- **v1.1:** the What's new chip first sat in the map's bottom-left corner on desktop, where it covered the start of the data credit that the licence requires. Moved into the panel footer.

## 9. Data licence and credit (read this)

The page carries the sentence the licence asks for: "This data is available free of charge from [www.transperth.wa.gov.au](https://www.transperth.wa.gov.au)." It also carries the credit "Timetable data from the Public Transport Authority of Western Australia", the OpenFreeMap and OpenStreetMap credit, and a statement that this is an independent project, not affiliated with or endorsed by the Authority or any operator.

My reading of the licence terms came from a summary of the download page, not from the legal text. **Please read the source page yourself.** Points to check:

- Redistribution appears to be allowed, but the right is non-exclusive, limited and revocable. The Authority can change or withdraw the data and the licence at any time without notice.
- Commercial use is neither granted nor excluded.
- The Authority's trademarks (the names of its brands and the SmartRider card) must not be used with the data, including confusingly similar variants. That is why this app is not named after any of them, and why the brand's web address appears only in the sentence the licence requires.
- The data is provided as is, with no warranty.

Other licences: MapLibre GL JS is BSD-3 (file in `vendor/`), the Archivo font is under the SIL Open Font Licence (file in `fonts/`), and the basemap is OpenFreeMap (free, credit required and shown on the map). To change the basemap provider, edit `STYLE_URL` in `mapview.js`.

## 10. Known limits and open items

- **Visitor numbers.** Since v1.4 the page loads Vercel Web Analytics (already on for the project, same snippet as the site's home page). Page views show under `/perth-transit/` in the Vercel dashboard (project learn-with-adhi, Analytics). The address is reduced to the path before sending (no `#@lat,lon`, no `?t=`), panning does not count as a new view, and automated browsers are ignored by Vercel's script.
- **Contract-specific route entries:** resolved in v1.6 at network load. Exact matches of short name, long name and mode share one public route; all their patterns and trips are retained. The stored feed counts remain 350 route entries; the interface has 338 public routes (329 bus, 8 rail, 1 ferry).
- **Real name.** "Perth Transit Map" is a placeholder and must stay clear of the Authority's brand names.
- **Licence check** (section 9) is still open.
- **Timetable expiry** on 2027-01-11. The Authority can publish a new feed earlier. A scheduled rebuild is possible but would need approval.
- **Basemap tiles** come from a free community service. Check its usage terms if the site gets busy, or switch provider.
- **Service worker caching.** Since v1.7, first-party module imports, module preloads, the app entry and CSS carry a release query (`?v=1.11`). This avoids mixing old cached modules with new ones while preserving cache-first warm loads in the existing kids-site service worker. Bump the release query consistently across these files for the next code release. Compiled data retains its existing content-hash URLs; no service-worker or kids-page behaviour was changed. A browser regression seeds stale unversioned modules and checks that the new app still starts.
- **Real-device testing** on iPhone and Android, and in Safari and Firefox.
- **Ferry data is a patch** (v1.3): the claco compiler still drops route type 4, so a fresh compile there loses the ferry until `compile_gtfs.py` keeps it or `scripts/perth-transit-add-ferry.py` is re-run.
- **claco's `site/` is out of date** (it stops at v1.0) and is no longer the source (see Source of truth at the top).
- **Kids' mode (Perth Train Spotter).** Phase 1 is done in v1.8: the page, the train card, the Hop on! ride-along, sounds and settings. Next is the real-kids test, then Spot it!, the Station Passport, races and day/night. Steps, risks and decisions are in `KIDS-PLAN.md` in this folder.
- **Phase 2, live arrivals (not started).** An unofficial live-times service exists. It is HTTP only, so a public HTTPS site would need a small server proxy. It is untested and its terms are unknown, so check that before building on it. The Transperth website's own per-station calls are rate limited, and bus calls need session cookies.

## 11. Build timeline

1. Brief received, premise corrected (no official live vehicle feed). Six decisions made by Adhi (section 1).
2. Official timetable downloaded after Adhi accepted the licence, and inspected (file structure, agency and route filtering, service calendar).
3. Compiler written, then the engine, tested against an independent fixture. The jumping vehicles were found and fixed here.
4. Interface built: map, panel, search, departures, scrubber, 3D mode, Near me, About dialog, phone bottom sheet.
5. Browser, phone and accessibility testing, with the fixes in section 8.
6. Delivered to Adhi's workspace with a README and four reference screenshots.
7. Pushed to the Learn with Adhi repo on a branch, with a new card (`assets/courses.json`, id `perth-transit-map`, n `T4`, category Tools), repo docs updated, and a draft pull request. Adhi merged it, and it was checked on the production site.
8. v1.1 built in the Learn with Adhi repo (not claco) and merged the same day (section 12).
9. v1.2 (phone layout) and v1.3 (ferry) also built in this repo the same day.

## 12. Version history

The same history, in plain words, is in the What's new list on the page (`index.html`, `#whatsnew-log`). Add each new version there and here.

### v1.11 (2026-10-20)

- **Kids’ Now and Me buttons.** Perth Train Spotter opens following the current Perth clock at normal speed (previously 10×). Now ends a ride and restores the current date/time. Shared time links still open at their chosen moment, and reduced motion still starts and resets paused. Outside the timetable window, a clearly labelled pretend day retains the same weekday and time; Now cannot provide a live timetable after expiry. The header still says “From the timetable, not live”: this adds current-time playback, not GPS vehicle tracking.
- **Optional location.** Me requests a single browser position only after a tap and permission, centres the map and shows a blue dot within the Perth area. It neither changes the clock nor saves coordinates in storage or links. OpenFreeMap receives map requests for the viewed area. Denied/unavailable/timed-out location has a friendly message and retry; a subsequent train selection or map drag takes priority over a late response. Updated the grown-ups privacy wording and KIDS-PLAN to reflect Adhi’s explicit location request.
- **Validation:** extended the existing browser suite for current Perth time from another viewer timezone, real-clock changes, keyboard Now/reset from a ride and pretend day, reduced motion, a browser-granted emulated position, location denial/timeouts/out-of-area results/retry/cancellation, no automatic location request or coordinate persistence, and accessible controls. The existing 8-size × 2-day card/ride layout matrix also checks the new 44px targets and clock clearance. Physical devices and Safari/Firefox remain untested. All first-party module/CSS release queries are `?v=1.11`.


### v1.9 (2026-10-18)

- **Trains stop at stations; trains and the ferry speed up and slow down.** Adhi asked for a more accurate simulation, "such as the train takes a moment to drop on and off passengers at the station". `sim.js`: `MOTION` settings, `Network._motion()` (per timing profile: arrive/depart time at each stop, acceleration and top speed for each run, computed once and cached as `prof.mo`) and `_movePosition()` (stands still during the stop, then a speed-up / steady / slow-down profile between stops via `runDistance()`). Buses take the old path unchanged. Model details and limits in section 4.2.
- **Results (all 125 train timing profiles):** every intermediate stop now has a stop: 1,122 of 1,440 the full 25 s and 307 between 6 and 25 s (the rest are 11 real stopping times kept from the timetable); 199 stops leave late, by at most 30 s; no run is modelled faster than 130 km/h or harder than 0.9 m/s². The first attempt (fixed stop, no lateness allowed) produced 187 km/h on such rounding-squeezed runs; allowing a short catch-up fixed that.
- **Checks:** new `scripts/perth-transit-check-motion.mjs` (stands still at the station mid-stop, never leaves before the published minute or more than 30 s after, last stop on time, never backwards, no jump over 70 m in a second, buses still use timetable interpolation). A one-off comparison with the v1.7 engine over 80,963 bus positions on a Monday, Saturday and Sunday found no differences; train positions move by up to 1.1 km, the distance 30 s covers at 130 km/h. `scripts/perth-transit-check-accuracy.mjs` and the browser check (seven axe states) still pass. A headless browser check followed one Fremantle Line train: it stops 25 s at North Fremantle and Victoria Street, 15 s at Mosman Park, and its card says "At North Fremantle Station" while stopped.
- **Interface:** release query `?v=1.9` on every first-party module and the stylesheet; What's new and the About dialog say stopping times and speeds are estimates.
- The claco engine test from section 7 (positions within 24.7 m of straight-line timetable interpolation) no longer applies to trains, by design.
- Source of truth moved to this repo (top of this file).
- **Perth Train Spotter, step K0.1** (`kids.html`, `kids.js`, `kids.css`, see `KIDS-PLAN.md`): full-screen map with trains and the ferry only, Pause/Slow/Fast/Rocket (1x, 10x, 60x; starts at 10x, paused with reduced motion), "64 trains and 2 boats are moving right now", a "Wake up the trains" button when none run (jumps to the first train, 4:30am on a Monday night), a labelled pretend day (`Network.typicalDay()`: the same weekday inside the timetable with the most trips, so never a public holiday) when the date is outside the timetable or time runs past its end, forgiving 28 px taps, `?t=`/`date=` links, and a For grown-ups dialog with the licence and privacy sentences. `mapview.js` kids options: vehicles about twice as big with a dark outline (light on the dark map) and the white front tip from zoom 9, train lines in their colours at half strength, no bus layers or bus stations. A first screenshot showed trains blending into their own coloured lines, hence the outline. The yellow **Kids** button on the map links to it. Browser check: new kids section (trains-only drawing, count text, speed radios and arrow keys, tap selects a train, pretend day, wake-up time, reduced motion, 320 px fit, axe on phone, grown-ups dialog and desktop dark: no violations).

- **Perth Train Spotter, step K1.1 (train card):** tapping a train opens a card: a header in the line colour ("Mandurah Line", "The ferry"), "Going to Mandurah" (station names without "Stn", "Station" or the platform), what it is doing now ("Next stop: Bull Creek, in about 2 minutes", "Stopped at Subiaco. People are getting on and off.", "Arrived at ...!", or "This trip is finished. Tap another train!"), and a scrollable **line strip** with one dot per stop, passed dots filled and a little train sliding between them by distance. Screen readers get "(passed)", "(the train is here)" and "(next stop)" on the strip; the status line is not a live region, so it doesn't talk every second at Rocket speed. The line is highlighted on the map and the map moves if the train is hidden behind the card. Phones: card above the dock; wide screens: top-left. Kids' mode no longer fades other vehicles when a line is selected (`mapview.js`), so every train stays tappable. Escape or the close button closes it.

- **Perth Train Spotter, step K1.2 (Hop on!):** a Hop on! button on the train card. The camera zooms in and follows the train (map padding keeps it clear of the card), a sunny bubble calls each station ("All aboard! Next stop: North Fremantle", "Cottesloe!"; a polite live region, one call per stop even when a slow frame jumps past several), and at the end: "You made it to Perth! 🎉", a small bounce (none with reduced motion), time pauses so the offers stay true, and up to three "Hop on another train?" choices (`ride.js` `trainsFrom()`). Choosing one waits at the station ("Waiting at Perth for the train to Claremont. It comes in about 1 minute.") and boards it when it gets there, carrying on at the earlier speed. A stray tap on the map doesn't end a ride; dragging shows "Find my train". Hopping on starts a paused clock at Fast, except with reduced motion. Rides survive midnight (vehicle ids change then). `sim.js` `departures()` results now carry `shift` (which service day); `typicalDay()` now picks the same weekday with the most trips (`tripsOn()`), because this feed has calendar exceptions on every date, so K0.1's `hasChanges()` test for an ordinary day was wrong and is removed.
- **Found and fixed in K1.2 testing:** (1) **an endless loop**: while following, the camera moves every frame and its `moveend` called `tick()` again (stack overflow on the first ride); the main map already guarded against this, the kids' page now does too; (2) the next-train offers went stale while time kept running on the arrival card (a test clicked a train that had left 30 minutes before), hence the arrival pause and a once-a-second refresh.
- **Checks:** `scripts/perth-transit-check-kids.mjs` (new, Node): 69 rides (23 trains, 3 of them past midnight, each at 2, 6 and 60 seconds per frame) never lose the train and reach every stop exactly once in order; 28 next-train offers point at the train that is really at that station then; pretend days are full-service days, never Christmas, Boxing Day or New Year's Day. Browser check: a full ride with station calls, the arrival pause, axe on the arrival card, waiting for the next train.

- **Perth Train Spotter, step K1.3 (sounds and settings):** a pop when picking a train, a toot-toot whistle (or a ferry horn) on hopping on, a ding-dong at each station, a little fanfare at the end of the line. A sound button in the dock and two switches in For grown-ups ("Sound effects", "Read station names aloud"), kept in this browser. Audio starts on the first tap (browser rule), and the first sound waits for the audio to wake rather than being lost. The voice reads the station calls; it is cancelled before each new line and spoken a moment later, the known fix for Chrome on Android swallowing speech after a cancel. Checks: the order of sounds over a ride (pop, whistle, a chime per station, fanfare), silence when switched off, choices kept after a reload, station calls read aloud when the voice is on, axe on the settings. Real voices and speakers are untested (headless browser).
- **Pre-merge review fixes (before merging to main):** an independent review of the whole PR (four reviewers from different angles, each serious finding checked by a skeptic) found no problems in the engine or the main map, and these on the kids' page, all fixed: (1) after a missed train (e.g. the tablet slept while waiting) every later train card was broken until Done was pressed; `riding()` now counts `ride.done`; (2) tapping your own train during a ride ended it; it now keeps the ride (and re-follows); (3) with reduced motion, the arrival pause never gave the speed back; it now restores the speed the viewer chose; (4) `mapview.js` tested the followed id for truthiness, so vehicle 0 (a weekday 7:49am Yanchep Line train) could not be followed on either map; now `!== null`; (5) no keyboard way to pick a train (WCAG 2.1.1): a "Pick a train" button (visible on focus, second tab stop) cycles through the trains in view and moves focus to the card, and focus moves to a visible button when the pressed one hides itself; (6) the kid-facing screen never said the trains are not live: "From the timetable, not live" under the title, and "should be moving" / "should come" wording; (7) the voice could be an online one (Edge), against the privacy text: on-device voices only; (8) the pretend label covered the map credit: moved into the dock; (9) the station bubble covered the card's close button on tablet portrait and the card header on small phones: repositioned, with room kept above the card; (10) phones held sideways hid the ridden train: side-card layout on short landscape screens, ride padding measured from the real top bar and clamped, and the ride buttons pinned to the bottom of the card; (11) docs said the shortest stop is 15 s, but 19 stops are shorter (about 6 s at Shenton Park once the 30 s lateness limit is hit); corrected. New regression checks for each in the browser check; the layout checks were confirmed to fail on the code before the fixes.
- **Second review round (of the fixes themselves):** it found that fix (9) had made things worse: to make room for the bubble the card had been capped lower, and on real phone browsers in portrait (about 550 to 665 px tall with the toolbars showing) that hid the line strip, the next-stop text and even Hop on! (confirmed by a skeptic). Reworked: the card is back to full height (its top stays just below the map credit), its buttons are a direct child of the card so they stay pinned to its bottom, the bubble is placed by `kids.js` just above the card or the dock instead, the pretend label sits inline beside the clock (no extra dock height), and while riding on short phones the card drops the destination and strip (`.card.riding`) so the train stays in view. Also from that round: the sideways layout starts at 640 px wide (below that the speed buttons did not fit), sits below the map credit and respects notch insets, and its bubble and hint use their full width; "Pick a train" keeps focus on itself and announces the train (so "press again" works), skips trains whose trip has ended and starts again where the map has moved; focus moves to Stop waiting after choosing a next train, and to the dock after Stop waiting closes the card. A layout matrix in the browser check (8 sizes, from 320x568 to 834x1112 including real browser heights and sideways phones, each on a normal and a pretend day) checks that the next-stop text, the first strip stop and Hop on! are visible, the speed buttons fit, the card leaves the map credit uncovered, the ridden train is in clear view, Hop off is visible and the station call stays on screen without covering the card head. It fails 16 times on the first fix commit and passes now.

### v1.8 (2026-10-17)

- **Favourite places:** a Favourites section in the Map and Stops tabs offers Home, Work and custom names. Choose the map centre (pan/zoom first), explicitly request the current device location, or use “Save this location” on a stop/station page. Selecting a saved place moves the map there and shows nearby stops with distances. Markers persist across light/dark map changes.
- **Manage places:** rename without moving, replace a location using the map centre or device location, or delete it in the edit dialog. Names are limited to 40 characters and duplicate names are rejected without regard to case. Locations must be within the same Perth-area bounds as Near me. Accessible labels, native dialog focus/Escape behaviour, status/error announcements and 44px favourite/form actions work on narrow screens.
- **Storage:** `ptm-favourite-places-v1` in localStorage holds versioned IDs, names and coordinates. Places survive reloads and update across tabs on the same browser/device; no account or cloud sync is added. Clearing site/browser data removes them. Storage or location-access errors leave existing places intact and report the problem; cancelling a pending location request cannot save it later. Malformed stored records are ignored so the timetable still opens.
- **Validation:** `node scripts/perth-transit-favourites-check.mjs` covers persistence, rename, duplicate/coordinate validation, deletion and failed storage. `scripts/perth-transit-favourites-browser-check.cjs` covers Home/Work/custom places, reload, nearby stops, GPS, denied access, cancellation, failed writes, saving a station, delete, theme/map markers, phone/keyboard and cross-tab updates. axe reports zero violations for add-place, dark saved places and 320px edit-place states. The existing seven-state accessibility/browser suite and engine regression suite also pass. Real devices/assistive technology remain untested.
- This release introduced `?v=1.8` module/CSS queries. The current source of truth is this repo; preserve `favourites.js` when rebuilding timetable data.

Use the browser-test setup under v1.7, then run:

```sh
NODE_PATH=/tmp/perth-checks/node_modules PLAYWRIGHT_BROWSERS_PATH=/tmp/perth-browsers node scripts/perth-transit-favourites-browser-check.cjs
```

### v1.7 (2026-10-17)

- **Smoother animation:** replace the 100 ms timer/100–250 ms throttle with display-synchronised scheduling capped at 30 vehicle updates per second. Text, departure boards and accessibility attributes refresh at most once per second during playback; the chart cursor follows vehicle frames. Animation work stops when paused or hidden and resumes on visibility/playback changes. Following a vehicle no longer continually restarts a 400 ms camera animation.
- **Less rendering work:** send only vehicles inside the map bounds plus a 10% margin to MapLibre. Preserve the full vehicle lookup for cards, counts and follow. Skip bus tag measurements below zoom 15 and cache static line geometry across theme changes. A CBD check at zoom 15.4 sends 34 of 631 vehicles to the map worker (the complete timetable remains available).
- **Earlier interaction:** start with local map styling and upgrade the external basemap in the background. Neither external tiles nor the optional font blocks timetable readiness. Load the module graph earlier and use consistent release-version URLs for safe warm caching. In a controlled local headless test with a 4-second basemap delay, readiness changed from 4.57 seconds to 0.54 seconds. This is a simulated dependency delay, not a general network or real-device speed claim.
- **Accessibility:** labelled pause/play and speed controls, an editable native time field on desktop and phones, paused startup for reduced motion (even for a shared playback link), automatic pause when the preference is enabled, keyboard skip links, arrow-key radio groups with a single tab stop, focus recovery after navigation, debounced search-result announcements, map keyboard guidance, larger coarse-pointer targets and a readable hourly-count table. Remove the broad `application` role and continuously updating live announcement from the map summary. Mobile time controls use two rows to fit narrow screens.
- **Validation:** the raw-GTFS/engine accuracy checks still pass. `scripts/perth-transit-browser-check.cjs` checks pending-basemap startup, pause and hidden-tab work, editable time, keyboard groups/focus, viewport culling, reduced motion, phone controls and stale service-worker modules. axe-core reports zero violations for the seven tested states: desktop route detail, expanded hourly table, dark route detail, map summary, station departures, About dialog and 320px phone. Checks cover WCAG 2 A/AA, WCAG 2.1 AA and axe best-practice rules; automated scans do not establish full accessibility conformance. Real assistive technology, Safari/Firefox and physical devices remain to be tested.

Run the browser check from the repository root with the static server already running on port 8099 (or set `PERTH_TEST_ORIGIN`):

```sh
npm install --prefix /tmp/perth-checks playwright axe-core
PLAYWRIGHT_BROWSERS_PATH=/tmp/perth-browsers /tmp/perth-checks/node_modules/.bin/playwright install chromium
NODE_PATH=/tmp/perth-checks/node_modules PLAYWRIGHT_BROWSERS_PATH=/tmp/perth-browsers node scripts/perth-transit-browser-check.cjs
```

### v1.6 (2026-10-17)

- Group identical public routes across operating contracts in `Network`, remapping pattern references once at load. Route lists, search, stop chips, running counts, directions, bounds and map selection now include the complete route. All 55,495 trips and 2,188 patterns are preserved; compiled JSON is unchanged.
- The peak-hour summary describes an average in the busiest direction, rather than claiming that rate applies each way. Explain that the count includes branches and short trips leaving their first stops, so it is not a headway guarantee at a particular stop. Label first/last trips after midnight “next day”.
- Reproducible checks (Node 24, no dependencies):

  ```sh
  node scripts/perth-transit-check-accuracy.mjs
  python3 -I scripts/perth-transit-gtfs-expectations.py /tmp/perth-gtfs.zip > /tmp/perth-expected.json
  node scripts/perth-transit-check-accuracy.mjs /tmp/perth-expected.json
  ```

  Use the original `mdb-1086-202610160127` download (section 6). The independent Python answer key reads raw GTFS, not compiled JSON. All 1,014 public-route/day summaries on Saturday 17, Sunday 18 and Monday 19 October match: hourly counts, daily totals, first and last departures. Regression checks cover route identity, preservation of every pattern and shape, route search, finite positions, and heartbeat/running counts at midnight, 1am, 8am, noon and 11pm on all three days.

- Headless Chromium checks at desktop and 390px phone width: route 998 selection includes all 22 running buses and 20 shapes at Monday 8am; route 950 uses the busiest-direction wording; an overnight route labels next-day departures; no phone horizontal overflow or page errors on dark switching. Real devices and Safari/Firefox remain untested.

### v1.5 (2026-10-17)

- **Route numbers on buses.** Adhi asked for bus numbers on the pills, after a Jakarta transit map he showed as a reference. From zoom 15 (`TAG_Z` in `mapview.js`) each bus is a tag: a pill in the bus colour with a theme-coloured outline, the route number (or CAT name, from `chipLabel()`) in Archivo bold, and a small outlined pointer just outside the tag's edge in the bus's on-screen direction of travel. Below zoom 15 buses keep the v1.1 shapes; trains and the ferry are unchanged and draw on top of the tags.
- **How:** each tag is one image (pill, outline and number together), drawn on a canvas the first time the map asks for it (`styleimagemissing`, `_tagImage()`), one per label, colour and theme. A first try drew the number as a MapLibre text label on a stretchable pill, but MapLibre draws all pills of a layer before all text, so overlapping tags showed each other's numbers; single images stack cleanly. The pointer's distance from the centre is worked out per bus from the measured tag width and its on-screen heading (`setVehicles()`, `_tagInfo()`). `TAG_Z` is a whole number because zoom rules in per-vehicle styles are evaluated at the tile's whole-number zoom (a 14.5 threshold showed nothing until zoom 15). Waits for the Archivo font before drawing. Clicking a tag opens that bus.
- **Tests (headless Chromium):** tags appear at zoom 15 and above only (0 at 14.9, 75 at 15.1 in the CBD), the tag label matches the bus's route, clicking a tag opens that bus's card, only buses are tagged, the Trains filter hides them, a dark/light switch redraws them with the dark images, and the v1.1 to v1.4 suites re-run. Frame rate and update time in headless Chromium (software rendering) were measured before and after; see `PROGRESS.md`.

### v1.4 (2026-10-17)

- **Dark mode.** `style.css` gains a dark token set under `:root[data-theme='dark']`, and hard-coded colours became tokens. An inline script in `index.html` sets `data-theme` before anything draws (saved choice in `localStorage` `ptm-theme`, else `prefers-color-scheme`). `app.js` keeps it in sync, adds the moon/sun button `#btn-theme` in the map controls, and follows device changes until the viewer picks. `mapview.js`: per-theme palette `PAL`, basemaps `STYLE_URLS` (OpenFreeMap positron / dark), and `setTheme()`, which swaps the basemap with `setStyle`, redraws this app's layers and puts back the selected route, stop, vehicle ring, Near-me dot, hidden layers and 3D buildings. `colors.js`: `setColorTheme()`, lighter bus `#c3ced8` and ferry `#3fb4dc` colours on the dark map (train line colours unchanged). Vehicle outlines are now SDF images tinted per theme.
- **"How busy is this line?"** `sim.js` `routeDay(routes, ymd)` counts trips leaving their first stop in each hour (both directions, plus the busiest single direction for the "about every N min" figure), with first and last trip; `sameNameRoutes()` groups the routes the feed lists more than once. `panel.js` draws the chart on route pages in the route colour, highlights the current hour, rebuilds when the day changes, and says it measures frequency, not crowding. The "trips on this day" and "running now" figures on route pages use the same grouping.
- **Visitor numbers.** Vercel Web Analytics snippet in `index.html` with a `beforeSend` hook that sends only the path. About dialog says visits are counted without cookies.
- **Tests:** dark mode 12/12 (device dark, dark basemap, all 7 app layers, button to light and back, route highlight and hidden layers kept, choice saved and beats the device after reload, vehicle click in dark); busy chart 10/10 in light and dark plus phone; per-hour counts match the raw timetable for the Fremantle Line, route 950 (both entries, 293 trips) and the ferry on a Monday; analytics sends one view for `/perth-transit/` with no hash or query, none on pan; earlier ferry, What's new, click and phone checks re-run.

### v1.3 (2026-10-17)

- **Ferry added.** Transperth's only ferry route (`PWT-FRY-3`, route type 4, Elizabeth Quay Jetty to Mends St Jetty, South Perth): 414 trips a week-cycle across 8 service calendars, about 8 minutes southbound and 10 minutes northbound, every 15 to 30 minutes.
- **Data:** added by `scripts/perth-transit-add-ferry.py` (repo root `scripts/`, not published with the map) from the same feed, `mdb-1086-202610160127`. The script appends to the five compiled files in the compiler's format, so every existing route, stop, station, shape, pattern and service keeps its index; it was checked that all existing entries are byte-for-byte unchanged. Each jetty becomes a stop with its own station (stop mode bit 4 = ferry). It refuses to run on data that already has a ferry. `meta.json` gets a new `hash`, a `ferries` count and a `patched` note. The unused Barrack St Jetty stop in the feed is not added.
- **Interface:** ferry route colour `#0a7ea4`; dashed `ferry-line` layer over the river; boat-shaped vehicle icon (`ptm-ferry`, pointed bow at the front); jetties use the big station marker and label; "Ferry" button in the Map and Routes filters and on mixed-mode departure boards; a ferries count in the panel; a "Ferry" block under Train lines; "Ferry jetty" on jetty pages and rows; F glyph; Near me includes jetties; the day chart tooltip counts ferries. Routes gained `isFerry` and `mode` in `sim.js`; `heartbeat()` returns a `ferry` array.
- **Trip progress bar fix (all vehicles):** the bar in the vehicle card now uses distance travelled instead of the last stop passed, so it moves smoothly. Before, a two-stop ferry trip sat at 0% the whole way.
- **Tests (headless Chromium + Node):** engine departures from both jetties match the raw timetable exactly on a Monday, a Saturday, a Sunday and Christmas Day; 1,098 ferry positions sampled through a Monday all lie on the river; the ferry draws, can be clicked, filtered, searched and has a working departures board; the bus and train figures at 08:15 Monday are unchanged (1,280 buses, 66 trains); the What's new, phone and vehicle-click checks from v1.1/v1.2 still pass; no console errors.

### v1.2 (2026-10-17)

- **Phones: day chart hidden.** Adhi found the time box took too much of a phone screen. At max-width 819 px `.scrub-chart` is now `display: none`, so the box is one row (date, time, previous/next day, speed, Now), about 53 px instead of about 110 px. The vehicles-through-the-day sentence was already hidden on phones. Lost on phones: dragging along the chart to pick a time of day. `scrubber.js` already skips drawing at zero width, and its ResizeObserver redraws the chart if the screen widens past 819 px. (`style.css`)

### v1.1 (2026-10-17)

- **Vehicle shapes.** Trains are long rounded bars and buses short pills, in the route colour with a white outline. Each is rotated to its direction of travel and gets a white front tip from zoom 13.5, and trains draw above buses. The old circle layers `veh-halo` and `veh` and the white `veh-arrow` symbol are now three symbol layers with the same ids, so the click handling (`queryRenderedFeatures` on `veh`), route dimming and the `veh-sel` ring did not change. (`mapview.js`)
- **What's new chip.** "v1.1 · What's new" opens a plain-language changelog on mouse hover, or on click or tap (it then stays open). It closes on mouse leave, a click outside, or Escape. Desktop: in the panel footer, bottom-left of the screen. Phones: top-left beside the Simulated badge, because the bottom sheet hides the panel footer there. `app.js` moves the element between the two places with a `matchMedia('(min-width: 820px)')` listener. (`index.html`, `style.css`, `app.js`)
- Edited in the Learn with Adhi repo, not claco (merged as lumbalumbaputih/learn-with-adhi#159).

### v1.0 (2026-10-17)

- First version, sections 1 to 11.
