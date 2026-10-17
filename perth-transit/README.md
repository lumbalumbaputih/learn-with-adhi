# Perth Transit Map

A map of Perth's buses and trains moving through the day, in the style of a live transit map.

> **It is not live.** Vehicle positions are worked out from the published timetable. They are not tracked by GPS, so delays, cancellations and replacement buses are not shown. The page says this in the panel badge, in a "Simulated" label on the map and in the About dialog. Check the official journey planner for live times before you travel.

- **Live copy:** https://learn.tokocurahaustralia.com/perth-transit/ (folder `perth-transit/` in the Learn with Adhi repo, card T4 in the Tools category)
- **Built:** 2026-10-17, with Claude Code, for Adhi
- **Current version:** v1.2 (see section 12)
- **Timetable valid:** 2026-10-13 to 2027-01-11. After that the map shows a banner and no vehicles until the data is rebuilt.
- **Source of truth:** the build folder in Adhi's claco workspace (`2-claout/projects/perth-transit/`). v1.0 in this repo was a byte-for-byte copy of its `site/` folder. Change it there and re-copy it, do not hand-edit it here. **Exception:** v1.1 was edited directly in this repo (section 12), so copy `mapview.js`, `app.js`, `index.html`, `style.css` and this `README.md` back into claco before the next re-copy, or v1.1 will be lost.

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

- About 1,300 vehicles at the weekday morning peak, animated along the real route shapes (8 train lines, 341 bus routes).
- Trains drawn as long bars and buses as short pills, in the route colour, pointing the way they travel (since v1.1).
- A time scrubber for any day in the timetable, with a day-long chart of how many vehicles are running (5 minute bins), plus a Now button, previous and next day, and speed control. On phones the chart is hidden (since v1.2), so time there is changed with the buttons only.
- Tap a vehicle for its route, headsign, next stop and a Follow button.
- Routes, Stops and Map tabs with one search box. A stop or station page shows the next timetable departures.
- Near me (the location stays in the browser), a 3D buildings mode, layer toggles, and an About dialog with the data credit.
- A "What's new" version chip with a plain-language changelog (since v1.1).
- On phones, a bottom sheet with three heights (peek, half, full) and touch dragging.
- Shareable links: `?t=08:15&date=2026-10-19&speed=10` sets the moment, and the map position lives in the URL hash as `#@lat,lon,zoom`.

## 3. What it does not do

- No real-time anything. No delays, cancellations or replacement buses.
- No journey planner, fares or service alerts.
- No ferries. They were left out on purpose in v1.0: the compiler keeps route types 2 and 3 only. Adding them needs a data rebuild that keeps route type 4 (Adhi asked for ferries on 2026-10-17; not started).
- No dark mode.
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

The `scripts/` and `test/` folders live in the claco build folder only. They are not in this repo.

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

### 4.3 The interface

| File | Job |
|---|---|
| `app.js` | loads the data, builds the network, clock, map, panel and scrubber, runs a 100 ms tick, handles the bottom sheet, locate, the About dialog and the What's new chip |
| `mapview.js` | MapLibre map and layers (bus routes, rail, selected route, stops, stations, vehicles, front marks, 3D buildings), click handling, the vehicle GeoJSON update |
| `panel.js` | tabs, search, route and stop pages, vehicle card, departures board |
| `scrubber.js` | the day chart and draggable cursor |
| `clock.js` | the simulation clock (live follows Perth time, or runs from a chosen moment) |
| `colors.js`, `util.js` | line colours and text contrast, small DOM helpers |
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

- **Real name.** "Perth Transit Map" is a placeholder and must stay clear of the Authority's brand names.
- **Licence check** (section 9) is still open.
- **Timetable expiry** on 2027-01-11. The Authority can publish a new feed earlier. A scheduled rebuild is possible but would need approval.
- **Basemap tiles** come from a free community service. Check its usage terms if the site gets busy, or switch provider.
- **Service worker caching.** On the Learn with Adhi site, `sw.js` serves same-origin JS, CSS and JSON cache-first with a background refresh, so a visitor who has opened a kids page sees the previous version of this map's files once after a redeploy, then the new one on the next load. It was left alone because it is the kids' offline layer. After the v1.1 deploy such a visitor can get the new `index.html` with the old `app.js` once: the What's new chip then shows but does not open until the next load.
- **Real-device testing** on iPhone and Android, and in Safari and Firefox.
- **Ferries** (section 3): asked for, not started, needs a data rebuild in claco.
- **claco is behind this repo** until the v1.1 files are copied back (see Source of truth at the top).
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

## 12. Version history

The same history, in plain words, is in the What's new list on the page (`index.html`, `#whatsnew-log`). Add each new version there and here.

### v1.2 (2026-10-17)

- **Phones: day chart hidden.** Adhi found the time box took too much of a phone screen. At max-width 819 px `.scrub-chart` is now `display: none`, so the box is one row (date, time, previous/next day, speed, Now), about 53 px instead of about 110 px. The vehicles-through-the-day sentence was already hidden on phones. Lost on phones: dragging along the chart to pick a time of day. `scrubber.js` already skips drawing at zero width, and its ResizeObserver redraws the chart if the screen widens past 819 px. (`style.css`)

### v1.1 (2026-10-17)

- **Vehicle shapes.** Trains are long rounded bars and buses short pills, in the route colour with a white outline. Each is rotated to its direction of travel and gets a white front tip from zoom 13.5, and trains draw above buses. The old circle layers `veh-halo` and `veh` and the white `veh-arrow` symbol are now three symbol layers with the same ids, so the click handling (`queryRenderedFeatures` on `veh`), route dimming and the `veh-sel` ring did not change. (`mapview.js`)
- **What's new chip.** "v1.1 · What's new" opens a plain-language changelog on mouse hover, or on click or tap (it then stays open). It closes on mouse leave, a click outside, or Escape. Desktop: in the panel footer, bottom-left of the screen. Phones: top-left beside the Simulated badge, because the bottom sheet hides the panel footer there. `app.js` moves the element between the two places with a `matchMedia('(min-width: 820px)')` listener. (`index.html`, `style.css`, `app.js`)
- Edited in the Learn with Adhi repo, not claco (merged as lumbalumbaputih/learn-with-adhi#159).

### v1.0 (2026-10-17)

- First version, sections 1 to 11.
