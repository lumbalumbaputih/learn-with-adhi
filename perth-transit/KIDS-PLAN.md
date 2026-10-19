# Perth Transit Map: Kids Mode plan

- **Status:** building started 2026-10-18 (see Step status at the end). Adhi decided D1 (this repo), D2 (separate page) and D6 (name: **Perth Train Spotter**), and the other five go ahead on the recommendations.
- **Written:** 2026-10-18, at Adhi's request ("make a plan on how to make it better, and maybe fun to use for kids").
- **Scope he chose:** the Perth Transit Map (not the Learn with Adhi kids' world), for **any kid visiting** the site. That means English, and **not** tied to Rayyan's and Raya's star and progress system (`kids.html`, `auth.js`, `dashboard.html` stay untouched).
- **Read first:** `README.md` in this folder (how the map works) and section 8 below (decisions Adhi still has to make before building starts).

---

## 1. The honest starting point

The map is accurate and well tested, but right now it is **a tool for adults, not a toy for kids**:

- **Too much on screen.** About 1,300 small shapes at the morning peak, a panel full of timetable words ("headsign", "departures", "trips per hour") and a time scrubber.
- **Nothing to do.** No goal, no reward, no reason to come back. Watching dots move holds a kid for about two minutes.
- **Small targets.** Vehicles are 9 px wide, which is fine for a mouse and hard for a five-year-old's finger.

The good news is that the engine already has nearly everything a kids' mode needs. The work is mostly new screens, not new data:

| Already in the code | What a kids' mode can do with it |
|---|---|
| `net.vehicles()`: every vehicle's position, line, direction | Show only trains and the ferry, with big icons |
| `net.describe()`: next stop, minutes to it, progress along the trip (by distance, since v1.3) | A "where is my train?" card with a moving line strip |
| `mapView.follow()` | "Hop on!": ride along with one train |
| `net.departures()` | "Hop on another train" after you arrive |
| `net.routeDay()`, `net.heartbeat()` | "How many trains are moving right now?" counters, fact cards |
| `clock.setSpeed()` up to 600× | Make a 54-minute trip take about a minute |
| Line colours chosen to stay apart for colour-blind viewers | Colour-based "Spot it!" games (with care, see K2.1) |

**Facts from the data** (Monday 19 October 2026, worked out with `sim.js` in Node, so a kids' mode can say them truthfully):

| Fact | Value |
|---|---|
| Train lines | 8, plus the Swan River ferry |
| Train stations | 85 (plus 31 bus stations and 2 ferry jetties) |
| Trains running at 8am | 64 (and 2 ferries and 1,259 buses) |
| Trains running at 11pm | 16 |
| Longest line | Mandurah Line: 70.7 km, 54 minutes, Perth Underground to Mandurah |
| Shortest line | Midland Line: 16.4 km, 26 minutes |
| Ferry | 1.4 km, about 8 minutes, Elizabeth Quay to Mends St |
| Trains asleep | Monday 1:11am to 4:30am; Saturday 3:20am to 5:00am; Sunday 3:20am to 6:25am |

---

## 2. What "fun" means here (design rules)

1. **Something to do within 10 seconds.** The first screen asks the kid to do something ("Tap a train!"), not to read.
2. **Trains first.** Show the 8 coloured lines and the ferry: about 65 vehicles instead of 1,325. Buses are opt-in for older kids (K3.2). That is easier to read, and much lighter on an old tablet.
3. **Big, few, friendly.** Tap targets of at least 48 px, short sentences, rounded numbers ("in about 2 minutes", not "1 min 47 s").
4. **No fail state.** A wrong tap tells the kid what they tapped ("That's the Airport Line, it's green!") and lets them keep looking. Never "Wrong!".
5. **Honest, in kid words.** The map is not live. Kids' mode must still say so, in words a kid understands: "This shows where trains *should* be, from the timetable. Real trains can be a bit late."
6. **Safe by default.** No accounts, names or leaderboards. Location is optional: only pressing My location requests a one-shot browser position, after browser permission. It centres the map and shows a dot; coordinates are not saved or added to links. Map pictures for the viewed area come from OpenFreeMap and the existing page count sends only the path. Progress stays on the device. This replaces the original no-location rule at Adhi's explicit request on 2026-10-20.
7. **Always something moving.** If today has no timetable (after 2027-01-11) or it's the middle of the night, offer a clearly labelled "pretend day" instead of an empty map (K0.1, K2.4).
8. **Quiet unless asked.** Sound effects on, spoken announcements off by default (kids often play on a parent's phone in public). Both are switches, and the choice is remembered.

---

## 3. The shape of it

**A separate page, `perth-transit/kids.html`**, with its own `kids.js` and `kids.css`. It reuses the existing `sim.js`, `clock.js`, `colors.js` and `mapview.js`.

Why not a switch inside the main map:

- The main page has just been through a careful accessibility and speed pass (v1.7). Rebuilding its panel for kids would put that work at risk.
- Grown-ups don't load kids' code and kids don't load the grown-up panel.
- A separate address is easy to share ("send the kids to /perth-transit/kids").

The cost: `app.js` start-up code gets partly copied into `kids.js`. That's acceptable at this size. If it grows, move the shared start-up into a small `boot.js` later.

Rough screen layout (phone first):

```
+--------------------------------------+
| [logo] Perth Train Spotter [snd][?]  |  <- [?] = "For grown-ups"
|                                      |
|         full-screen map              |
|      trains + ferry, big icons       |
|                                      |
| [pretend day: a normal Monday]       |  <- only when used
|  64 trains are moving right now      |
+--------------------------------------+
|  [Spot it!]  [Hop on!]  [Passport]   |  <- three big buttons
|  speed: [slow]  [fast]  [rocket]     |
+--------------------------------------+
```

Links: a small "Kids" button on the main map's header, and a "Grown-up map" link back from the kids' page.

---

## 4. The steps

Each step below is **one SOP step**: build, check, update the docs, commit and push, then start the next. Every step leaves the main map working.

### Phase 0: foundation (nothing fun yet, but everything later stands on it)

**K0.1 · Kids page skeleton + "pretend day"**
- `kids.html` / `kids.js` / `kids.css`. Loads the same data. Shows trains and the ferry only, with bigger icons. Bus lines and bus stops are hidden, station names are shown.
- Small additions to `mapview.js`: `setMode()` accepts a set of modes (today it takes one, so "trains and ferry" isn't possible), plus a size option for vehicle icons. The main map's behaviour must not change.
- **Pretend day:** if today isn't covered by the timetable (`net.covers()` is false), replay the same weekday from inside the timetable window, labelled "Pretend day: a normal Monday". The timetable runs out on **2027-01-11, under 3 months from now**, so without this the kids' page goes blank in January unless the data is rebuilt.
- Starts at the real Perth time, at 1× speed (updated at Adhi's request, 2026-10-20). Now returns from a chosen time or ride to current Perth time; Me requests the device location and centres a blue dot within the Perth map area. With reduced motion turned on in the device settings it starts paused, like the main map.
- **Done when:** loads at 390 px and on desktop; about 64 trains and the ferry are visible at 8am on a Monday and no buses are; the existing `scripts/perth-transit-browser-check.cjs` still passes on the main map; axe-core finds no violations on the kids' page.

### Phase 1: the core toy (go/no-go gate at the end)

**K1.1 · Big train card + line strip**
- Tap a train and a big card slides up: a header in the line colour ("Mandurah Line"), "Going to Mandurah", "Next stop: Bull Creek, in about 2 minutes", and a **line strip**: every station of this trip as a dot, the ones passed filled in, and a little train sliding between them by `describe().progress`.
- Station names come from the parent station (`stopStation` to `stationName`) with "Stn" written as "Station" and the platform number dropped ("Perth Stn Platform 6" becomes "Perth").
- Forgiving taps: the nearest train within about 30 px counts.
- **Done when:** a tap on one train of each line shows the right line and destination; the strip position matches `describe().progress`; nothing overflows at 320 px.

**K1.2 · "Hop on!" (ride along)**
- A "Hop on!" button on the card. The camera follows the train, the strip stays pinned at the bottom, and at each station a chime plays and a bubble says "Next stop: Cottesloe" (spoken too, if the voice switch is on, using an English (Australia) voice where the device has one).
- Speed buttons: slow (1×), fast (10×), rocket (60×). At rocket speed the whole Mandurah Line takes under a minute.
- Arriving at the end: a small celebration, then "Hop on another train?" with the next trains leaving that station (`net.departures()`). "Hop off" works at any time.
- Edge cases to handle: the vehicle disappears when the trip ends (the run is over), and some trips start or end part-way along a line.
- **Done when:** a Node check rides 20 random trips at 60× from start to end and the train is never lost; each station announces exactly once; reduced motion means no camera glide and no confetti.

**K1.3 · Sounds, settings and the grown-ups box**
- Sound effects made in the browser (Web Audio: chime, train horn, ferry horn, sticker pop), so there are no audio files. Sound and voice switches, remembered in `localStorage` (`ptmKids`).
- A "For grown-ups" box: not live, don't use it to plan a trip, location only when My location is pressed and browser permission is granted; coordinates are not saved or put in links, progress stays on the device, and map pictures for the viewed area and a path-only page count use the internet. It also carries the licence credit sentence and the not-affiliated sentence, both required (see README section 9).

> **Gate after Phase 1.** Put it in front of 2 or 3 real kids for 10 minutes each (Rayyan is the obvious first tester) and watch, without helping. The question: **do they hop on a second train without being asked?** If not, fix Phase 1 before building anything in Phase 2. Games on top of a dull core won't save it.

### Phase 2: games on the real timetable

**K2.1 · "Spot it!" missions**
- One mission at a time, made from what is running right now: "Find the pink train" (Midland Line), "Find a train going to Fremantle", "Find the boat on the river", "Find a train at Perth Station". A right tap earns a sticker and a sound. A wrong tap says what it was and encourages another try. A hint button after 20 seconds pans the map to show one answer.
- **Rule:** only offer a mission if at least one matching vehicle will keep running for the next 60 seconds, so the answer can't vanish mid-search.
- **Colour care:** two lines are both green (Airport `#1baf7a`, Yanchep `#008300`), and Armadale is amber, not yellow. Colour missions always show the colour swatch **and** the line name, never "find a green train" on its own. Every mission set mixes in non-colour types, so colour-blind kids can always play.
- **Done when:** a Node check runs the mission maker every 5 minutes through a Monday, a Saturday and a Sunday and never produces a mission with no answer; browser checks cover the right-tap and wrong-tap paths.

**K2.2 · Station Passport**
- 85 train stations and 2 jetties to collect. A stamp is earned when a train you're riding (K1.2) stops at a station, not by tapping it (too easy). One page per line ("7 of 16 Fremantle Line stations") and a line badge when a line is complete. Interchanges like Perth count once.
- Saved in `localStorage` (`ptmKidsPassport`), keyed by the **GTFS station id** (`stops.st.id`), not by array position, because positions change when the data is rebuilt and the kid would lose their stamps.
- A reset button in the grown-ups box.
- **Done when:** stamps survive a reload; riding the Fremantle Line end to end stamps all 16 stations; stamps still map to the right stations after a test rebuild with re-ordered data.

**K2.3 · "Who gets there first?"**
- Pick a destination (Perth, Perth Underground or Elizabeth Quay). The game offers two trains on different lines heading there, the kid guesses the winner, and both are shown racing at 60×. The result explains itself with real numbers, for example "The Mandurah train travelled 23 km in 18 minutes" (sample wording; the real figures come from each race).
- Every number comes from the timetable. No made-up top speeds: the data has times and distances only.
- **Done when:** a Node check of 200 random races finds the predicted winner always matches the timetable arrival order.

**K2.4 · Day and night**
- The map gets a gentle sky tint by time of day (dawn, day, dusk, night), plus a big counter: "64 trains and 2 boats are moving right now".
- When no trains are running: "All the trains are asleep. The first one wakes up at 4:30am" (worked out from the timetable) and a "Wake them up" button that jumps time forward.
- **Done when:** the counter matches `net.vehicles()`; the wake-up time matches the first train found in the data for Monday, Saturday and Sunday.

### Phase 3: polish and reach

**K3.1 · "Did you know?" fact cards.** Longest line, most stations, shortest trip, trains run today. **Worked out from the data each time, never typed in**, so they stay true after a rebuild.

**K3.2 · Buses for older kids.** An opt-in "Show buses" switch. The route-number tags from v1.5 are already there; "Spot it!" gets bus missions ("Find bus 950"), which is good number practice. The 6 CAT routes (Blue, Green, Purple, Red, Surf, Yellow) make a natural "collect them all" set.

**K3.3 · Front door.** Decide how kids find it (decision D5): a card in `assets/courses.json`, the button on the main map only, or both. Add a What's new entry and a README section 12 entry.

**K3.4 · Real-device pass.** Required before calling kids' mode done: an iPad or Android tablet and a phone, including Safari. Check tap accuracy, which voices exist, sound after the first tap, and frame rate with 65 vehicles versus 1,300. Fix the top 3 problems found. The main map has never been on a real device either (README section 10), so this pass helps both pages.

**K3.5 (optional) · Bahasa Indonesia.** The wider site's audience is largely Indonesian. A language switch on the kids' page is cheap once the words live in one table. Only if Adhi wants it (decision D7).

---

## 5. How we'll know it worked

- **Tests can prove it's correct, not that it's fun.** Every step has Node checks (engine-based logic: missions, races, passport, counts) and headless Chromium checks (screens, taps, phone width, axe-core). Extend `scripts/perth-transit-browser-check.cjs` with a kids' section rather than starting a second script.
- **Fun is checked with kids.** The Phase 1 gate (above), and again after Phase 2.
- **Use over time:** the existing Vercel Web Analytics will show page views for `/perth-transit/kids.html` with no extra tracking. Return visits are the real signal. No per-child tracking will be added.

---

## 6. Risks, said plainly

| Risk | How bad | What we do about it |
|---|---|---|
| **Kids believe it's live** and wait at a station for a train that's late | Medium | "Pretend"/"should be" wording everywhere, the grown-ups box, and no Near me in kids' mode |
| **Timetable runs out 2027-01-11** | High (the page goes blank) | Pretend day (K0.1). A data rebuild is still needed for the main map |
| **Watching dots isn't fun** | High, it's the main risk | Phase 1 gate before building more games |
| ~~**Two copies of the code drift**~~ | Resolved 2026-10-18 | Adhi made this repo the source of truth (D1) |
| **Licence and trademarks:** the data licence bans the Authority's brand names | Medium | Line names are fine (they're in the data). No operator name in the kids' page title, no imitation of the real trains' paint or logos, and no mascot that looks like either |
| **Old tablets struggle** | Unknown (never measured on a real device) | Trains-only default (about 20 times fewer vehicles), and the real-device pass in K3.4 |
| **Children's privacy** | Low if the rules hold | Optional one-shot location only after a tap and browser permission; no stored/shared coordinates, accounts or leaderboards. Keep the grown-ups privacy wording in sync |

---

## 7. What this plan deliberately leaves out

- **Leaderboards, accounts, sharing scores:** privacy for children, and more moderation than this project needs.
- **Live positions:** still not available from official data (README section 1). The pretend wording is the honest answer.
- **A journey planner for kids:** kids shouldn't plan real trips from a simulated map.
- **Tying it to Rayyan's and Raya's stars:** Adhi said this is for any kid visiting. (If he changes his mind, it's six wiring points, listed in `CLAUDE.md`.)
- **Separate trains-only data files for faster loading:** the full data is about 0.8 MB gzipped, which is fine for now. It's worth doing only if the real-device pass shows slow loading, and it would mean changing the claco compiler.

---

## 8. Decisions for Adhi (before K0.1 starts)

Each has a recommendation. D1, D2 and D6 were decided by Adhi on 2026-10-18; the rest go ahead on the recommendations (he didn't object).

| # | Decision | Recommendation | Other option |
|---|---|---|---|
| D1 | Where does the site code live from now on? | ✅ **Decided: this repo** (claco keeps the compiler only) | |
| D2 | Separate kids' page or a switch in the main map? | ✅ **Decided: separate page** (section 3) | |
| D3 | Age range to design for | **About 5 to 10.** Big pictures, short words, voice optional for non-readers | Narrower (6 to 9) or wider |
| D4 | What shows by default | **Trains and ferry**, buses opt-in (K3.2) | Everything, like the main map |
| D5 | How kids find it | **Button on the main map now; a site card in the Play category after the Phase 1 gate** | Card straight away, or button only |
| D6 | Name (must not use the Authority's brand names) | ✅ **Decided: Perth Train Spotter** | |
| D7 | Bahasa Indonesia switch | **Later** (K3.5), only if wanted | Build it in from K0.1 |
| D8 | Sound by default | **Effects on, voice off**, both remembered | Everything off until turned on |

---

## 9. Per-step checklist (copy into each step)

1. Build the step on the assigned feature branch.
2. Node checks + headless Chromium checks for the step, plus the existing `scripts/perth-transit-browser-check.cjs` on the main map (no regressions).
3. Bump the release query (`?v=`) consistently on every first-party module and CSS link on the pages touched (README section 10, service-worker caching).
4. Update the What's new list (`index.html`, plain words, newest first; the kids' page gets its own short list if it has one), README section 12, this file's status line for the step, `PROGRESS.md`, and the Perth Transit Map entry in `CLAUDE.md`.
5. Commit and push. Every commit leaves both pages working.

## Step status

| Step | Status |
|---|---|
| K0.1 Kids page skeleton + pretend day | ✅ Done 2026-10-18 (also took the speed buttons from K1.2 and a basic For grown-ups dialog from K1.3, because pausing and the licence credit are needed from the start) |
| K1.1 Big train card + line strip | ✅ Done 2026-10-18 |
| K1.2 Hop on! | ✅ Done 2026-10-18 (plus: time pauses on arrival so the next-train offers stay true; waiting at the station for the chosen train) |
| K1.3 Sounds, settings, grown-ups box | ✅ Done 2026-10-18 |
| Pre-merge review fixes | ✅ Done 2026-10-18: keyboard "Pick a train", "From the timetable, not live" under the title (rule 5), on-device voices only, missed-train and own-train-tap fixes, layout fixes (see README section 12) |
| Current-time and location controls | ✅ Added 2026-10-20 at Adhi's request: current Perth time at 1×, Now reset, optional Me location, reduced-motion pause and pretend-day fallback |
| Phase 1 gate (real kids) | ⏳ Ready for Adhi: 2 or 3 kids, 10 minutes each, watch without helping. Do they hop on a second train unprompted? Also the first real-phone/tablet test (sound, voice, taps, speed) |
| K2.1 Spot it! | Not started |
| K2.2 Station Passport | Not started |
| K2.3 Who gets there first? | Not started |
| K2.4 Day and night | Not started |
| K3.1 to K3.5 | Not started |
