# Build Log – Learn with Adhi

Chronological log of what's been built, newest on top. Append a dated entry **every step** (see the Operating Procedure in `CLAUDE.md`). Keep `CLAUDE.md` "What's Already Built" in sync with this.

Legend: ✅ done & committed · 🔜 next · 🧪 needs testing on a real device

---

## Roadmap (the 4 phases) – live status

- **Phase 1 – Fix the first-impression cliff:** back-port the boss/sound/juice engine into the earliest courses (math Gr2–4 + coding v1), since those are the most bare and the ones Rayyan plays first.
- **Phase 2 – Retention layer (Track D):** streak, daily quest, badges + printable certificate, themed/unified world map.
- **Phase 3 – Make the promises real:** a safe live JS sandbox for "Mantra Kode" (coding v3); a keepable, replayable game for "Buat Game-mu" (coding v5).
- **Phase 4 – Polish:** unify the tutor name (Kai/Kapi), accessibility pass, stop idle animations when off-screen.

Each course/feature ships as its own commit. Update this file as each lands.

---

## 2026-06-14

- ✅ **NEW adult course: "AASB S2 Decoded: Climate-related Disclosures"** (`courses/aasb-s2/aasb-s2-climate-disclosures-v1.html`, id `aasb-s2-climate`, manifest `n:"15"`). Adhi dropped the full **AASB S2 September 2024** legislative standard (59-page PDF) into `dropzone/` and asked for a *fun-to-read* course that covers **the same things as the PDF — no shortcuts**, OK to be big, build in parts.
  - **Coverage = the whole standard, no skipping.** 10 chapters, one self-contained HTML file (mirrors the `design-principles`/`perth-architecture` adult-course engine: dark sidebar nav, per-chapter progress in localStorage, `data-course-id` + `lwa:completed` so the index "✓ Read" pill works, mobile hamburger, inline quizzes).
    - Ch1 Why it exists — Objective ¶1–2, Scope ¶3–4, the four TCFD pillars, S2/S1/IFRS family tree, application dates, the Australian modifications.
    - Ch2 Governance ¶5–7 + Aus7.1. · Ch3 Strategy I ¶8–14 (risks/opps, physical vs transition, time horizons, business model & value chain, transition plan). · Ch4 Strategy II ¶15–22 + B1–B18 (financial effects, the ¶19–21 reliefs, climate resilience & scenario analysis). · Ch5 Risk management ¶24–26 + Aus26.1. · Ch6 Metrics & Targets I ¶27–31, ¶29(a), B19–B57 (Scope 1/2/3, GHG Protocol, CO₂e/GWP, location-based Scope 2, the Scope 3 data-quality framework). · Ch7 Metrics & Targets II ¶29(b)–(g), B58–B71, ¶33–36 (six cross-industry metrics, financed emissions for asset mgrs/banks/insurers, targets, gross vs net, carbon-credit transparency). · Ch8 Appendix D rulebook (fair presentation, materiality, connected info, reporting entity, location/timing, comparatives, statement of compliance + the 2 exemptions, judgements/uncertainties/errors, qualitative characteristics). · Ch9 Appendix A glossary (all key defined terms, 7 GHG gases, 15 Scope 3 categories, NFP ¶AusA1) + Appendix C transition reliefs. · Ch10 Basis for Conclusions (why voluntary S1, consolidated-group choice, industry-metrics dropped to ~2030, GHG Protocol over NGER, keeping NF₃, AR6, market-based Scope 2 not mandated) + one-page recap.
    - "Fun to read" without dumbing down: plain-English ledes, analogies (pizza-shop scopes, smoke-detector integration, ship's captain/crew governance), `.para-ref` chips citing the exact paragraph for every claim, scope/pillar/flow diagrams, 28 inline self-check quizzes with explanations.
  - **Wired (adult course = manifest only):** added to `assets/courses.json` (Practice · Climate/ESG/Reporting · forest), added to `sitemap.xml`, bumped the index static hero fallback 14→15 (live count is manifest-derived). Source PDF left in `dropzone/`.
  - 🧪 Content is paraphrased from the standard for teaching; spot-checked against the PDF paragraph-by-paragraph, but a domain review before relying on it professionally is wise.

## 2026-06-13

- ✅ **NEW family game: "Ular Tangga 3D" 🎲 — the classic Snakes & Ladders, in 3D** (`courses/games/ular-tangga-v1.html`, id `ular-tangga-game`). Adhi's ask: *"a classic game that can be played together for kids and adults, designed in 3D to look nice."* Chose the most universally-known classic (Ular Tangga / Snakes & Ladders) — zero rules to teach, true cross-generation play.
  - **Real 3D** via the already-vendored **Three.js r128** (`assets/js/vendor/`, MIT — same as the eco-board, no new deps): a 10×10 numbered board (boustrophedon 1→100) on a slab over a dark floor, soft shadows, OrbitControls (drag-rotate / pinch-zoom, polar + distance clamped so the board can't be lost), plus a 🔭 top-down camera toggle. **7 ladders** built as arcing tube rails + rungs and **8 snakes** as wavy `TubeGeometry` bodies with little eyed/tongued heads; ladder-bottom / snake-head / finish tiles are ring-marked. A 3D dice tumbles in the air on each roll and settles.
  - **Play:** 2–4 players, local hotseat on one screen, color-coded pawns (Merah/Biru/Kuning/Hijau) that **hop tile-by-tile** then arc up ladders / slide down snakes; multiple pawns on a tile auto-offset so none hide. Classic rules: roll a **6 → roll again**, overshoot past 100 **bounces back**, first to exactly 100 wins → 🏆 modal + 3D confetti burst. Live turn banner + per-player position chips.
  - **Sound:** tiny procedural WebAudio `AX` module (roll rattle / step / ascending ladder / descending snake / win fanfare) with a 🔊/🔇 mute toggle, unlocked on first gesture. Bahasa Indonesia UI throughout.
  - **Wiring:** family game, not a per-kid star course → **manifest front door only** (`assets/courses.json`, category **"Play"**, id `ular-tangga-game`, `n` `G2`, accent `mawar`) — index derives card/chips/counts automatically. Deliberately **not** in `kids.html`/`sumStars`/`PROGRESS_KEYS_BY_TYPE`/`sw.js PRECACHE` (no star progress; matches the eco-board precedent). Home button returns to `kids.html`.
  - ✅ Verified: inline game JS passes `node --check`, `courses.json` valid; board-coordinate serpentine math + snake/ladder tables hand-checked. 🧪 Needs a real-browser/device pass for WebGL perf + touch feel on the tablet.

- ✅ **NEW family game: "Penyelamat Bumi" 🌍 — a 3D sustainability / climate board game** (`courses/games/eco-board-v1.html`, id `eco-board-game`). Adhi's ask: a 3D board game for kids→adults to enjoy *together*, themed on sustainability & the climate emergency, learning while playing, runs in a browser. Decisions (via AskUserQuestion): **Bahasa Indonesia** UI + **race-around-the-board** style.
  - **Real 3D** via **Three.js r128 (vendored locally**, see below): a square 24-tile ring board on a green "land" platform over water, a slowly-spinning **floating Earth** centerpiece, 3D dice that physically tumble and settle on the rolled face (precomputed face-up quaternions), 3D pawn tokens that hop tile-to-tile with an arc, soft shadows, OrbitControls (drag to rotate / pinch-zoom, panning + camera angles clamped so kids can't lose the board).
  - **Play:** 2–4 players, local hotseat (pass the device), editable names, choose game length (target 20/30/45 **Poin Bumi**). Roll → move → the tile you land on fires an event: **❓ Kuis** (18-question eco/climate quiz pool, +4 correct / +1 "still learned something" — *no penalty*, always shows the explanation), **🌱 Aksi Hijau** (+poin), **⚠️ Bencana Iklim** (−poin, each with a real cause + a tip), **💡 Tahukah** (+1 fact), **⭐ Bonus corners** (Daur Ulang / Energi Surya / Hutan Lindung, +5), **🏁 Lewati Mulai** (+2). First to the target wins → ranked medals + confetti "Bumi Selamat!". All content is original Bahasa-Indonesia sustainability material spanning kid→adult difficulty.
  - **Sound:** tiny WebAudio SFX module (roll / hop / correct / wrong / good / bad / win) with a 🔊/🔇 mute toggle; audio unlocked on the first user gesture (Start).
  - **Vendored Three.js:** `assets/js/vendor/three.min.js` + `OrbitControls.js` (r128, **MIT**) downloaded from the three.js GitHub mirror (jsDelivr/unpkg are blocked by this env's network allowlist; raw.githubusercontent.com is allowed). License noted in `assets/js/vendor/LICENSE.md`. Local (not CDN-hotlinked) per the Technical-Stack guardrail so it survives flaky wifi / offline.
  - **Wiring:** this is a *family* game, not a disguised per-kid star course, so it lives on the **manifest-driven front door** (`assets/courses.json`, new category **"Play"**, id `eco-board-game`) — index.html derives its card, chips, and counts automatically. Deliberately **not** added to `kids.html` (a per-kid Rayyan/Raya star-profile chooser) nor to `sumStars`/`PROGRESS_KEYS_BY_TYPE`/`sw.js PRECACHE` (it has no star progress and its 600 KB Three.js would bloat the kid-world offline install; its same-origin assets still get runtime-cached by the SW after first load). In-game "← Keluar" returns to index.html (where it's launched). Static hero fallback count bumped 11→14; live count is manifest-computed.
  - ✅ Verified: inline game JS parses via `new Function` (node), `courses.json` valid (19 items), the Euler/quaternion die-orientation table is hand-checked (opposite faces sum to 7). 🧪 Needs a real-browser/real-device pass for WebGL perf + touch feel on the tablet.

## 2026-06-12 (later)

- ✅ **Proof Expedition becomes a SERIES — full-book coverage begins.** Adhi: the 1-pager only skims the 698-page book; break it into smaller courses. Shipped: **(1) Base Camp hub** (`courses/math-thinking/expedition-basecamp.html`, id `proof-expedition-series`, manifest n=13) — dark route-map page with all 8 expeditions (one per book chapter, with page ranges), live per-expedition progress bars read from `lwa:expedition<N>` localStorage keys, locked "route being mapped" cards for unbuilt ones, link to the Highlights Trek. **(2) Expedition 1: "What Is Mathematics?"** (`expedition-1-truth-v1.html`, id `proof-expedition-1`, key `lwa:expedition1`) — deep course on book ch. 1 (pp. 13–100), 7 trail days: draggable-triangle 180° proof w/ parallel-line reveal · Goldbach machine (sieve, prime pairs up to 100k) · √2 contradiction proof stepper · find-the-illegal-line flaw hunt (2=1 "proof") · missing-dollar money trace + Gauss pairing arcs · playable Ramsey friendship game on K5 (winnable) / K6 (impossible) with mono-triangle detection · full Monty Hall (playable game + 1,000-game simulator). 7 checkpoints, passport stamps, confetti summit. **(3) `EXPEDITION-PLAN.md`** — detailed agent-executable build spec for Expeditions 2–8 (day-by-day content map mined from the actual PDF chapter structure, ~40 lab specs, hard conventions, wiring + QA checklists) so any model (Codex/Sonnet/Claude) can continue the series. Wired: courses.json (+1 entry, JSON valid), sitemap (+2), Highlights Trek hero now links to Base Camp. JS `node --check` passed on both new pages. **Next:** Expedition 2 (Induction, ch. 2) per the plan.

## 2026-06-12

- ✅ **NEW adult course: "The Proof Expedition"** (`courses/math-thinking/proof-expedition-v1.html`, id `proof-expedition`) — interactive companion to Brendan W. Sullivan's free 698-page CMU book *"Everything You Always Wanted To Know About Mathematics"* (now at `dropzone/bws_book.pdf`, moved from repo root). Deliberately NOT the sidebar course template (Adhi: "be as creative as you can"): a one-page scrollytelling **expedition up a mountain** — animated math-glyph hero canvas, 8 color-themed "camps" (ch1 proof vs evidence → logic → sets → induction → strategies → modular arithmetic → infinity (dark night-climb section) → combinatorics), a fixed metro-line trail nav, and a **stamp-collecting passport** (localStorage `lwa:proof-expedition`) instead of checkboxes; all 8 stamps → confetti summit + `lwa:completed` entry. Seven hands-on labs: Euler's n²+n+41 prime-breaker slider, live truth-table lever machine, Venn set-op lab (SVG), sabotage-able infinite domino run, Gauss staircase grid, modular clock (variable modulus), Hilbert's Hotel (+1 guest / infinite bus), clickable Pascal's triangle; 9 checkpoint quizzes with explanations. Wired: `assets/courses.json` (n=12, Foundations, manifest-driven index hub picks it up automatically) + `sitemap.xml`; uses `assets/js/progress.js` + `data-course-id` for the "✓ Read" pill. JSON validated; inline JS `node --check` passed.

---

## 2026-06-10

### Plan v4 · B1 — Offline/PWA layer 📴→📱 ✅
- **The gap:** every visit needed the network (fresh HTML fetch, fonts, Firebase) even though courses are single-file — flaky hotel wifi or the car = no learning. The "lesson must never break on flaky wifi" guardrail was only true *within* an already-loaded lesson.
- **`sw.js` (new):** precaches the whole kid world on install — **54 files**: 3 hubs, 14 Rayyan adventures + 2 games, 7 Raya courses + 1 game, 24 Kenney sprites, `auth.js`, icons. Routing is deliberately conservative so **online behavior never changes**: pages + `courses.json` are network-first (cache is offline-fallback only; uncached offline navigations land on `kids.html`); same-origin assets cache-first with background refresh; Google Fonts + Firebase compat libs cache-first; Firestore/auth APIs, `/api/`, `/_vercel/` never intercepted. Versioned cache (`lwa-v1`), old `lwa-*` caches purged on activate, `skipWaiting`+`clients.claim`, per-file `cache.add` so a single 404 can't void the install.
- **`manifest.webmanifest` (new):** `start_url: /kids.html`, standalone, paper theme, 32/512 icons → "Add to Home Screen" makes the kids' world feel like a real app on the tablet.
- **Wiring:** manifest `<link>` + SW registration on `kids.html`, `rayyan.html`, `raya.html` only (the SW covers the whole origin once active; adult-only visitors never pay the ~2 MB precache). **New wiring point** added to the checklists: new kid courses must also be added to `PRECACHE`.
- **Verified:** `node --check sw.js`; manifest JSON parses + both icons exist; **all 54 PRECACHE paths exist on disk**; all 3 hubs' script blocks still parse. 🧪 Remaining: DevTools-offline + Add-to-Home-Screen test on the real tablet (folded into B2).
- Files: `sw.js` (new), `manifest.webmanifest` (new), `kids.html`, `rayyan.html`, `raya.html`, `CLAUDE.md` (B1 ✅ + wiring checklists + tech stack), `PROGRESS.md`. Next: **A2+A3** (adult completion + README refresh).

### Plan v4 · C1 — "Perlu Latihan Bareng" weak-spots panel on the parent dashboard ✅
- **The gap:** `rayyanWeakSpots` (collected since plan-v2 Y3 to power the adaptive Misi Harian) was never shown to the parent — and it only lived in localStorage on the kid's device.
- **Sync (auth.js):** `pushKidProgress` now rides `rayyanWeakSpots` into the kid's Firestore doc as a top-level `weakSpots` field. Written via `update()` (full field replace) so topics the daily quest *heals* disappear from the cloud too; devices that never recorded weak spots have no localStorage key and skip the write entirely — a parent's phone can't clobber the kid's data. Only for `progressType === 'rayyan'`.
- **Panel (dashboard.html):** rayyan-type kid cards show "🎯 Perlu latihan bareng" between stats and per-course progress: top-3 topics by total misses (chapter ids → topics via a `WEAK_TOPIC_MAP` copy with a keep-in-sync comment; labels Penjumlahan/Pengurangan/Perkalian/Pembagian/Pecahan & Persen/Pola & Aljabar), each row = topic + "N× keliru" pill + "Ulangi: <adventure>" (the course with the most misses on that topic, names reused from `COURSE_NAMES`). Falls back to this device's localStorage when the cloud field is missing (same-device case). Kid with stars but zero struggles → "✨ Tidak ada kesulitan terdeteksi — lanjutkan!"; brand-new kid or Raya-type → no panel (her courses don't log weak spots).
- **Verified:** `node --check` on auth.js + the dashboard script block; the two `WEAK_TOPIC_MAP` literals diffed identical (18 entries); aggregation smoke-tested in node (multi-course topic totals, worst-course suggestion, healed/unknown-key entries ignored, top-3 cap, empty → hidden).
- Files: `assets/js/auth.js`, `dashboard.html`, `CLAUDE.md` (C1 ✅), `PROGRESS.md`. Next: **B1** (offline/PWA layer).

### Plan v4 · A1 — index.html front-page refresh + sitemap ✅
- **Bugs fixed:** the dead "Language" chip is gone — filter chips now render from the manifest's actual categories (with `aria-pressed`); empty filter/search results show a friendly empty-state instead of a blank grid; hero counts compute live from the manifest (static fallback corrected to "11 courses · 3 tools · 2 research reports"); the featured panel renders the manifest's `featured: true` item (hardcoded copy kept as no-JS fallback).
- **New:** client-side search (title/blurb/tags/category, term XSS-escaped in the empty-state); an **About** section (`#about` — who/why; wording carefully avoids any "disguise" leak); **Parents → dashboard.html** in nav + footer (the parent entry point didn't exist on the front page); compact mobile nav — Courses + Kids ✦ stay visible under 640px instead of the whole nav vanishing; skip-link + `:focus-visible` styles; JSON-LD (static WebSite + injected ItemList); kids strip now states concrete counts (14 petualangan · 7 kursus · 3 game) — ⚠️ new wiring point, added to the checklist in `CLAUDE.md`; hero shows "✓ N finished on this device" when any `lwa:completed` ids exist.
- **sitemap.xml:** added the 4 missing pages (design-principles, perth-architecture-by-train, both research reports), bumped `/` lastmod; XML validated.
- **Verified:** all inline `<script>` blocks pass `node --check`; JSON-LD parses; every JS-referenced id exists exactly once; chips/counts/featured/search logic smoke-tested in node against the real `courses.json` (chips = Foundations/Practice/Life/Tools/Research, search "perth" → 2 hits, gibberish → empty state); fetch-failure path still shows the error message (search guarded by a `loaded` flag).
- Files: `index.html`, `sitemap.xml`, `CLAUDE.md` (A1 ✅ + wiring checklist), `PROGRESS.md`. Next: **C1** (dashboard weak-spots panel).

### Improvement Plan v4 — Front Door, Resilience & the Parent Loop 📋 (planning step, no code)
- Adhi asked for a "make the site better" plan + a better index front page. Full-site audit (index.html, kids.html, manifest, sitemap, dashboard, README) surfaced: a dead **"Language" filter chip** (category doesn't exist → silently empty grid, no empty-state), stale hero counts ("12 courses" vs the real 11 + 3 tools + 2 reports), two dead nav links + **no parent entry point**, the **whole nav hidden on phones**, a hardcoded featured course drifting from the manifest's unused `featured` flag, "✓ Read" only writable by 2 of 11 adult courses, a stale sitemap (4 pages missing), a very stale README, `rayyanWeakSpots` never surfaced to the parent, and **no offline story** for the kids' tablet.
- Plan v4 written into `CLAUDE.md` (4 pillars): **A** front door & adult library (A1 index refresh 🔜 this session, A2 real completion tracking, A3 README), **B** kids resilience (B1 offline/PWA, B2 device pass, B3 sound settings, B4 Raya photos), **C** parent loop (C1 weak-spots panel — cheapest real win, C2 last-played/weekly), **D** content backlog (F5 story-quest, Raya "Berhitung Lanjut", Gr8/Python).
- Recommended order: A1 → C1 → B1 → A2+A3 → B3 → B2 → D. Next: ship A1.

### Plan v3 · F4 — "Masinis Kapi" 🚆 mission simulation ✅
- `courses/games/rayyan-masinis-v1.html`, key `rayyanMasinis`, 6 missions (Mission 6 = BOSS).
- Side-scrolling cab-view canvas scene (scrolling clouds, trees, rails, animated train with smoke puffs). Math IS the controls — fuel ÷ distance, passenger loading, time arithmetic, speed calculations — always in the context of running the train. Wrong answer = `consequence-overlay` flash (funny result), not a toast punishment; retry inline.
- 6 missions: Pilih Jalur (counting/multiplication/time) → Isi Bahan Bakar (division/ratio/rate) → Muat Penumpang (subtraction/fractions) → Jadwal Keberangkatan (time subtraction/speed/ordinal) → Rute Panjang (addition/multiplication/division) → BOSS Jadwal Penuh (percentages/ratios/large numbers). 3 steps per mission, mix of `choice` and number-input.
- Stars by mistake count (0=3★, ≤2=2★, else 1★). Wired in all 4 places, adventure count 13→14.

### Plan v3 · F3 — "Papan Tulis Ajaib" ✏️ letter-tracing ✅
- `courses/learning/raya-tracing-v1.html`, key `rayaTracing`, 4 chapters.
- Chapters: Vokal A-I-U-E-O → R-A-Y-A (her own name!) → B-C-D → H-K. Each letter: dotted dashed guide path + start dot (pink) + ghost overlay letter. Canvas pointer+touch events record stroke; ≥70% waypoint coverage within forgiving 13% radius = success.
- On success: celebrate popup with letter bounce, Suara says "Huruf X! Contoh: [word]", confetti. No fail state — every attempt is a learning rep. "Next letter" button always enabled (skip allowed). Stars by how many letters traced. Wired in all 4 places, Raya count 6→7.

### Plan v3 · F2 — "Timbangan Misteri" ⚖️ balance lab ✅
- `courses/math/rayyan-balance-v1.html`, key `rayyanBalance`, 6 levels (Level 6 = BOSS).
- SVG beam tilts in CSS via `transform: rotate(Ndeg)` — scale tipping IS the feedback. Drag-and-drop weights (desktop drag events + touch events with floating clone). Levels: numeric balance → mystery ❓ boxes (answer input) → drag to balance → remove-from-both-sides mechanic → mixed → BOSS two unknowns. Zero multiple choice on drag levels.
- Stars by attempt count, locked levels, confetti on level complete. Wired in all 4 places, Rayyan count 12→13.

### Plan v3 · F1 — "Buku Cerita Ajaib" 📖 Raya storybook ✅
- `courses/learning/raya-story-v1.html`, key `rayaStory`, 10 pages.
- Pilot story: Kiki si Kucing Naik Kereta 🐱🚂 — ties Raya's world to Rayyan's train biome (one family universe). 4 interaction types: tap-reveal (❓ → emoji), tap-find (spot the target), tap-count (tap each item, counter increments), choice (which color?). No fail state; every page ends in delight. Suara auto read-aloud per page + 🔊 Dengarkan button. Full 3 stars on book completion. Wired in all 4 places, Raya count 5→6.

### Improvement Plan v3 — Lesson-Format Diversification 📋 (planning step, no code)
- Adhi gave the green light to build lessons in **any format**, not just the 6-chapter quiz engine. Audit insight: all 17 courses share one DNA (question → answer → toast → stars) — even the "rich" interactions are quiz items. That format monoculture is now the quality ceiling for both kids.
- New plan (full spec in `CLAUDE.md` → "Improvement Plan v3"), five formats, build order **F1→F5**:
  - **F1 · Raya "Buku Cerita Ajaib" 📖** — no-fail tap-along read-aloud storybook (pilot: *Kiki si Kucing Naik Kereta* 🐱🚂, rides Rayyan's train = one family universe). `raya-story-v1.html`, key `rayaStory`.
  - **F2 · Rayyan "Timbangan Misteri" ⚖️** — equation-balance manipulative lab: solve-for-X by *feel* (drag weights/mystery boxes, scale tilt IS the feedback, zero multiple choice). `rayyan-balance-v1.html`, key `rayyanBalance`, Lab biome.
  - **F3 · Raya "Papan Tulis Ajaib" ✏️** — finger letter-tracing (pre-writing; vowels + R-A-Y-A's name letters first). `raya-tracing-v1.html`, key `rayaTracing`.
  - **F4 · Rayyan "Masinis Kapi" 🚆** — mission simulation where math is the *controls of the game* (fuel = rate×distance, timetables, passenger loading). `rayyan-masinis-v1.html`, key `rayyanMasinis`.
  - **F5 · stretch** — Rayyan branching story-quest with puzzle-gated plot.
- All formats keep: single-file HTML, disguise rules, 4-place wiring, the `{totalStars, progress}` localStorage shape (chapters may be pages/levels/missions), Raya audio from day one. New rules: no-fail formats never show a ❌; manipulative/sim formats never use "Salah!" toasts.
- Also retitled Plan v2 as shipped (only X1 device pass + X2 Raya photos remain open) and repointed the "next-up" note to v3. Files: `CLAUDE.md`, `PROGRESS.md`. Next: **F1**.

### Plan v2 · X2b/X2c — Medal cabinet art + space-boss UFO sprite ✅
- **Medal cabinet (`rayyan.html`):** earned badges now show a Kenney medal image (`medals/medal1–8.png`) with the badge's emoji as a small corner overlay (meaning preserved: 🔥 streak, 👑 master…); locked stays 🔒. `onerror` falls back to the plain emoji.
- **Gr4 space boss:** the 👽 boss enemy is now a Kenney UFO sprite (`space/ufoRed.png`, emoji fallback via `onerror`); the hit animation works unchanged since it animates the wrapper.
- Fits the disguise: richer game art, zero new text.

### Plan v2 · X2a — Kenney CC0 sprites: both runner games get real game art ✅
- **Assets:** `assets/img/kenney/` (148 KB, 24 files + LICENSE.md) — platformer obstacles/clouds/decor, space enemies/UFOs/meteor, 9 medals. Source: the GitHub mirror of Kenney's CC0 asset pack (github.com/iwenzhou/kenney — kenney.nl itself and all photo hosts are blocked by this env's network allowlist). License verified CC0 1.0 in the mirror; **every image visually reviewed** before adding.
- **Standalone runner** (`courses/tools/rayyan-train-run-v1.html`): cactus + rock obstacles and the 3 clouds now draw Kenney sprites; **vector art remains as automatic fallback** if images don't load (flaky wifi safe), hitboxes unchanged.
- **v5 in-course "Kereta Lari"**: obstacles are now sprite cactus/rock (random per spawn) instead of pink rectangles, same fallback + hitbox rules.
- Still blocked for X2: real CC0 *photos* for Raya (no reachable photo host). Next X2 steps: medal-cabinet images + space-boss sprite.

### Plan v2 · R4 — Housekeeping ✅ (dead code removed)
- Deleted `courses/learning/raya-learning-paud-v1.html` (never-wired near-duplicate of the visual course; its `rayaLearning` key was already purged from star lists on 2026-06-04) and `assets/js/sync.js` (duplicated `auth.js`, never initialized) + its lone `<script>` tag in `rayyan.html`. Verified: zero remaining references (`grep sync.js|raya-learning-paud` → 0). Per the SOP this deletion is flagged for Adhi's confirmation in the PR (#118) without blocking.

### Plan v2 · R3 — New Raya course: "Jelajah Dunia" 🌍 ✅ (world knowledge, her 5th course)
- `courses/learning/raya-world-v1.html` (key `rayaWorld`): 6 chapters × 5 questions — **Lawan Kata** (big/small, day/night, hot/cold, slow/fast, up/down) → **Tubuhku** (eyes/ears/nose/feet/mouth, parent guide says touch your own!) → **Makanan & Minuman** (fruit/veg/drink/sweet + cow→milk) → **Kendaraan** (sky/water/rails 🚂/two wheels/fire truck) → **Cuaca & Langit** (umbrella, sun, rainbow, stars, cap) → **BOSS Petualangan Dunia** (mixed). Same Raya engine as R2 with full audio from day one; answer positions varied.
- **Renamed from the planned "Dunia Raya"** — discovered `raya.html` (the hub) is itself titled "Dunia Raya"; the course is "Jelajah Dunia" to avoid the collision.
- ⚠️ **Emoji visuals instead of the planned CC0 photos:** this build environment's network allowlist blocks image hosts (Wikimedia/Openverse → 403 `host_not_allowed`). The photo upgrade (`assets/img/raya-world/`) is folded into X2 for a session with network access.
- Wired in all 4 places: `raya.html` (COURSES + pills 4→5), `kids.html` (starsKeys + pill), `assets/js/auth.js`, `dashboard.html`. Verified: `node --check` OK, zero leftover `rayaLogic`/🧩 strings in the new file.

### Plan v2 · Y4 — "Karya-mu" shelf on `rayyan.html` ✅ (ownership → return visits)
- **Persistence (the missing v5 piece):** Kereta Lari now saves his best score to `rayyanKeretaLari` `{best, when}` on game-over and shows "Rekor: N" on the game-over screen. (v4 `rayyanKanvasArt` and v3 `rayyanMantraLab` were already saving since the Y4-partial step.)
- **The shelf:** new 🖼️ **Karya-mu** section on `rayyan.html` (after the medal cabinet), hidden until at least one creation exists. Cards: 🎨 his last Kanvas-Bebas painting **re-rendered live** on a mini canvas (same Indonesian helper set as v4, 5000-shape guard, falls back to a 🎨 emoji if his code errors), ✨ his last typed spell as a code snippet (set via `textContent` — injection-safe), 🚂 his best runner score. Each card links back to its course.
- Files: `rayyan.html`, `courses/coding/rayyan-coding-v5.html`, `CLAUDE.md`, `PROGRESS.md`. Verified: `node --check` on all edited script blocks.

---

## 2026-06-09

### Hotfix — 🔊 Dengarkan button was silent on the real device ✅
- Adhi reported the read-aloud button did nothing. Root cause: two well-known Web Speech API pitfalls — Chrome/Android silently drops a `speechSynthesis.speak()` issued **in the same tick** as `cancel()`, and an utterance held in no variable can be garbage-collected before/while speaking.
- Fix in `Suara.speak()` (all 4 Raya courses): keep a reference (`this.u = u`) and defer `speak()` by 80 ms after `cancel()`, with `speechSynthesis.resume()` first to un-stick Chrome's paused engine state. Still fully `try/catch`-guarded (graceful no-op if unsupported).
- Files: `courses/math/raya-math-v1.html`, `courses/learning/raya-literacy-v1.html`, `courses/learning/raya-learning-visual-v1.html`, `courses/learning/raya-logic-v1.html`. 🧪 Needs a confirm on the actual tablet (X1 device pass still pending — id-ID voice availability varies by OS).

### Plan v2 · Y3 — Adaptive Misi Harian ✅ (Track E "revisit weak spots" promise, finally real)
- **Logging side:** all 6 math courses (Gr2–7) now record every wrong answer into localStorage `rayyanWeakSpots` as `{"<courseKey>:<chapterId>": {miss, last}}` — a tiny `logWeakSpot()` added to `showToast()` (Gr2–4 old engine) and `handleAnswer()`'s wrong branch (Gr5–7 rich engine). Fail-safe (`try/catch`), no behavior change in the courses.
- **Drill side (`rayyan.html`):** the 16 Misi-Harian QUESTS are now topic-tagged (`kali`/`bagi`/`tambah`/`kurang`/`pecahan`/`pola`); `WEAK_TOPIC_MAP` maps 18 known chapter ids → those topics; the daily question is picked with weight `1 + min(misses_on_topic, 8)` using a deterministic per-day seed (same quest all day, adapts day to day). Answering the quest correctly **heals one miss** on that topic — a real (if small) spaced-repetition loop.
- Files: `rayyan.html`, `courses/math/rayyan-math-grade{2-v1,3,4,5,6,7}.html`, `CLAUDE.md`, `PROGRESS.md`.

### Plan v2 · R2 — New Raya course: "Logika & Pola" 🧩 ✅ (early reasoning, her 4th course)
- New `courses/learning/raya-logic-v1.html` (key `rayaLogic`), built on the proven Raya engine (visual-only answers, `pick`, stars, parent guides) **with the R1 audio baked in from day one** (SFX + Suara read-aloud + 🔊 Dengarkan + auto-read).
- 6 chapters × 5 questions (30 q, answer positions varied):
  1. **Pola Apa Selanjutnya?** — AB / AAB / ABB what-comes-next patterns
  2. **Besar & Kecil** — compare size, length, height, weight
  3. **Mana yang Beda?** — odd-one-out by category + a color-dot round
  4. **Kelompokkan!** — which is edible / rain gear / lives in water / flies / vehicle
  5. **Urutan Cerita** — 2-step sequencing (😴→🪥, 🥚→🐣, 🐛→🦋, 🌱→🌳, 😋→🍚)
  6. **Petualangan Logika** — mixed review (pattern, compare, odd-one-out, sequence, counting 1-2-3-4)
- Wired in **all 4 places**: `raya.html` COURSES card (+pills 3→4 kursus), `kids.html` starsKeys + pill, `assets/js/auth.js` PROGRESS_KEYS_BY_TYPE.raya, `dashboard.html` COURSE_NAMES.
- Why: the 2026-06-04 gap analysis flagged early reasoning (patterns/sorting) as the next highest-leverage Raya skill after literacy.
- Files: `courses/learning/raya-logic-v1.html` (new), `raya.html`, `kids.html`, `assets/js/auth.js`, `dashboard.html`, `CLAUDE.md`, `PROGRESS.md`.

### Plan v2 · Y1 — Rich question types back-ported into math Gr2/Gr3/Gr4 ✅ (first-impression fix, complete)
- Ported Gr5's `drag-sort`, `number-line`, and `bar-fill` renderers into the three early math courses, adapted to their older engine (`S.`→`state.`, `Audio.play`→`SFX.play`, `handleAnswer`→inline score+history+`showToast`; no timer/lives). CSS block + `renderQ` dispatch extended in each file.
- Question conversions (answer keys hand-verified):
  - **Gr2** (patterns ch): drag-sort *urutkan 15,5,25,10,20 → 5…25* · number-line *pola ganjil → 9* (🚂 marker).
  - **Gr3:** drag-sort nilai-tempat *7.001 → 7.010 → 7.100* · bar-fill *1/2 dari 6 kotak = 3* · drag-sort pecahan *1/4 → 1/3 → 1/2* (🚂 marker).
  - **Gr4:** number-line pembulatan *67 → 70* (🚀 marker) · drag-sort bilangan besar *89.998 → 89.999 → 98.000 → 100.000* · bar-fill *3/4 dari 8 kotak = 6* (reinforces pecahan senilai).
- Gr2–4 are no longer MC/input-only — the courses Rayyan touches first now have the same tactile interactions as Gr5+.
- Files: `courses/math/rayyan-math-grade2-v1.html`, `courses/math/rayyan-math-grade3.html`, `courses/math/rayyan-math-grade4.html`, `CLAUDE.md`, `PROGRESS.md`.

### Plan v2 · Y2 — "Kanvas Bebas" free-draw sandbox in coding v4 ✅ (clears the last ⚠️ course)
- New `sKanvas` screen in `rayyan-coding-v4.html` (home button "🎨 Kanvas Bebas — Lukis Sendiri!"): a code `<textarea>` + white `<canvas>` + "🖌️ Lukis!" → `runKanvas()` executes the kid's real JS via `new Function` against an Indonesian helper API (`kotak`, `lingkaran`, `garis`, `tulis`, `acak`, `bersihkan`; 10 named colors), with a 5000-shape runaway-loop guard, success/error messages (real JS errors shown kid-friendly), a command cheat-sheet, and starter art including a `for`-loop. SoundFX 'correct' jingle on success.
- The kid now paints **his own** art with typed code — v4's "creative coding" promise is real. (localStorage art gallery → Y4.)
- Files: `courses/coding/rayyan-coding-v4.html`, `CLAUDE.md`, `PROGRESS.md`.

### Plan v2 · R1 — Suara untuk Raya: read-aloud + SFX in ALL 3 Raya courses ✅ (the audio gap, closed)
- Added to `raya-literacy-v1.html`, `raya-learning-visual-v1.html`, `raya-math-v1.html` (all additive, no engine rewrite):
  - **`SFX` module** (procedural Web Audio, ported from math Gr2–4): correct/wrong jingles on every answer + completion fanfare.
  - **`Suara` read-aloud module** (Web Speech API): picks an `id-ID` voice (graceful no-op if unsupported), question auto-read on render, **🔊 Dengarkan** button in the read-aloud bar, and spoken feedback after answering — in literacy this speaks the letter + example word ("Hebat! Huruf A! Contoh: Apel") = letter **sounds**, not just shapes.
  - `cleanSay()` strips emoji/symbols so TTS reads only words; `speechSynthesis.cancel()` before each utterance prevents queue pileup; parent notices updated ("Raya juga bisa bermain sendiri!").
- Why first: audit showed Raya's courses had **zero audio** — a pre-reader needed a parent narrator for every question. This unlocks her whole catalog for solo play.
- 🧪 Needs a real-device check (id-ID voice availability varies by OS — X1).
- Files: `courses/learning/raya-literacy-v1.html`, `courses/learning/raya-learning-visual-v1.html`, `courses/math/raya-math-v1.html`, `CLAUDE.md`, `PROGRESS.md`.

### Improvement Plan v2 written — the new build queue for both kids ✅ (planning step, no course code changed)
- Audited all 17 course files with greps (not just the docs) and wrote **"Improvement Plan v2"** into `CLAUDE.md` (supersedes the old "Next-up recommendation"; original Tracks A–E are ~done).
- **Key verified findings driving the plan:**
  - Raya's 3 courses have **zero audio** (no SFX, no `speechSynthesis`) — her literacy course teaches letter shapes but never letter *sounds*, and she can't use anything without a parent narrator.
  - Rayyan Gr2–4 are still **MC/input-only** (0 drag/number-line/canvas) while Gr5 has `drag-sort`/`number-line`/`bar-fill` — his first courses are his plainest.
  - Coding v4 remains the last ⚠️ course (kid never draws his own art); Misi Harian is random, not adaptive (misses are never recorded).
- **The queue (one SOP step each):** R1 Raya read-aloud+SFX (literacy → visual → math) → Y2 v4 "Kanvas Bebas" free-draw sandbox → Y1 rich-interaction back-port Gr2/3/4 → R2 new Raya "Logika & Pola" → Y3 adaptive Misi Harian (weak-spot logging + weighting) → R3 "Dunia Raya" → Y4 "Karya-mu" shelf → R4 cleanup (delete paud duplicate + sync.js) / X1 real-device pass → stretch (Gr8 · Python).
- **Decisions noted for Adhi (recs picked, not blocking):** Web Speech API for R1; delete `raya-learning-paud-v1.html`; Indonesian helper API (`kotak`/`lingkaran`) for Y2.
- Files: `CLAUDE.md`, `PROGRESS.md`. *(Merged as PR #113.)*

### Plan amendment: external images/APIs now allowed ✅ (Adhi's green light, same day)
- Adhi: "you are also welcome to add any api or any image from the internet to make all the courses richer."
- Updated the **Technical Stack** rules in `CLAUDE.md`: internet assets allowed with guardrails — **download CC0/free-license assets into `assets/`** (Pixabay/Pexels photos, Kenney.nl game sprites, OpenMoji) rather than hotlinking, browser-native APIs (speechSynthesis/Web Audio/Canvas) freely, runtime third-party APIs only with a full offline fallback, pre-vet every image, log sources here.
- Plan v2 updated: **R3 "Dunia Raya"** will use real photos (a real elephant beats 🐘 for a 3–4 yr old), and new cross-cutting item **X2 "Asset richness pass"** — real game sprites for Kereta Lari / bosses / v5, real photos in Raya's visual & literacy courses.
- Files: `CLAUDE.md`, `PROGRESS.md`.

## 2026-06-05

### Raya – literacy course expanded to the full 26-letter alphabet (9 chapters) ✅
- Adhi's feedback on the first cut (5 ch, ~6 letters): "there is 26 alphabet, please do better." Rebuilt `rayaLiteracy` into a complete alphabet ladder.
- **9 chapters, 66 questions:** (1) Vokal A-I-U-E-O · (2) Konsonan B-C-D-F-G · (3) H-J-K-L-M · (4) N-P-R-S-T · (5) Q-V-W-X-Y-Z — every letter introduced with an example word (A=Apel … Z=Zebra). Then (6) Bunyi Awal / beginning sounds (12q), (7) Besar & Kecil upper/lowercase drag-match across all 26 (8q), (8) Kata Pertama first words→picture (10q), (9) BOSS: Petualangan Huruf mixed review (10q).
- Same proven Raya engine (`'pick'` letter/emoji type + `drag-match`). Verified: inline engine `node --check` clean; all 66 answer keys logic-checked (every `pick` `ans`→correct option, every drag chip has a matching target) → 0 issues.
- Bumped `totalChapters` 5→9 in `raya.html` + `dashboard.html`. Updated CLAUDE.md.
- Files: `courses/learning/raya-literacy-v1.html`, `raya.html`, `dashboard.html`, `CLAUDE.md`, `PROGRESS.md`.

## 2026-06-04

### Track C – the "Bridge" course shipped ✅  (use code to DO math)
- New self-contained course `courses/coding/rayyan-bridge-v1.html` (key `rayyanBridge`, 6 chapters, ~1.6k lines), built by a dedicated Opus agent then verified + hardened by me.
- Chapters: ch1 Robot Penggambar Bentuk (live `<canvas>` polygon drawing — shapes & angles) · ch2 Mesin Pola Bilangan (rule chips generate live sequences) · ch3 Kalkulator Buatan Sendiri (order-of-operations) · ch4 Plot Peta Koordinat (live `<canvas>` x/y grid, plot points, `y=2x`) · ch5 Detektif X (solve 1-step linear equations) · ch6 BOSS: Visual Matematika (enemy + HP/lives/combo + celebration canvas).
- **QA done before merge:** `node --check` ✅; localStorage shape `{totalStars,progress:{chN:{stars}}}` under `rayyanBridge` ✅; disguise grep clean (no grade numbers, no "coding/programming") ✅; **all 36 questions math-verified** (22 MC `opts[ans]` correct + 14 typed-input correct); fixed the **MC answer-position bias** (originally all index 0 → now spread, plus a runtime shuffle so positions vary every session).
- **Wired (5 places):** `rayyan.html` ADVENTURES + biome tint + count pill, `kids.html` starsKeys + pill, `auth.js` PROGRESS_KEYS_BY_TYPE, `dashboard.html` COURSE_NAMES. Count bumped **11 → 12 adventures**.
- This completes the optional Track C. With Phases 0–4 + Track C, the whole roadmap is done.

### Phase 4 (polish) – tutor name unified to "Kapi" ✅
- Renamed the in-course guide to a single identity **"Kapi"** across the math ladder: Gr2 & Gr3 said "Kai", Gr4 said "Nova" → all now "Kapi" (Gr5–7 already used Kapi). Carefully avoided the "KAI" train brand (Gr3 line had both "kereta KAI" and "Kai si Kondektur" — only the tutor changed) and left internal CSS classes/ids (`kai-name`, `nova-msg`) untouched. `node --check` clean.
- Files: `courses/math/rayyan-math-grade2-v1.html`, `grade3.html`, `grade4.html`.
- This clears the last deferred Phase-4 item. Next: Track C "the Bridge" course (in progress — being built by a dedicated agent).

### Raya – new course "Belajar Huruf Bersama Raya 📖" (literacy) ✅  [closes Raya's biggest peer-gap]
- **Where Raya was:** 2 courses (`rayaMath` count/compare/add; `rayaVisual` colors/shapes/animals/matching) + 1 game. Solid on early numeracy + colors/shapes/animals, but **zero literacy** — the highest-leverage "ahead of peers" skill for a 3–4 yr old.
- **Built:** `courses/learning/raya-literacy-v1.html` (key `rayaLiteracy`), 5 chapters on the same proven Raya engine (parent read-aloud, stars, confetti, timer, tap + drag-and-drop, bug-report):
  1. **Kenali Huruf** 🔤 – letter recognition (tap the right letter)
  2. **Bunyi Awal** 🔊 – beginning sounds (🍎 Apel → A)
  3. **Besar & Kecil** 🅰️ – upper/lowercase matching via drag-and-drop (a→A; ch4 spells RAYA)
  4. **Kata Pertama** 📖 – first words → picture (IBU→👩, API→🔥, BOLA→⚽…)
  5. **Petualangan Huruf** 🏆 – mixed review (recognition + sounds + words)
- **Engine note:** added a generic `'pick'` question type (renders letter OR emoji options, optional `visual`), reusing the existing index-based `pickNum()` handler; `drag-match` reused as-is for case-matching. No new handlers needed.
- **Wired (all 4 places):** `raya.html` (COURSES card + 3-kursus pills), `kids.html` (starsKeys + pill), `assets/js/auth.js` (`PROGRESS_KEYS_BY_TYPE.raya`), `dashboard.html` (`COURSE_NAMES`).
- **Verified:** inline engine passes `node --check`; all 25 answer keys logic-checked (every `pick` `ans` index → correct option, every drag chip has a matching target) → 0 issues; no leftover `rayaMath`/math content; `auth.js` `node --check` clean.
- 🔜 Next candidate Raya courses (not built): **Logika & Pola** (patterns/sorting — early reasoning) · **Lawan Kata & Dunia** (opposites, body, food — world knowledge).
- Files: `courses/learning/raya-literacy-v1.html`, `raya.html`, `kids.html`, `assets/js/auth.js`, `dashboard.html`, `CLAUDE.md`, `PROGRESS.md`.

### Phase 4 (polish) – pause animations off-screen + v1 boss clarification ✅ / 🟡
- **Off-screen animation pause** ✅: added a safe, uniform snippet to math Gr5/6/7 — `body.anim-paused *{animation-play-state:paused}` CSS + a `visibilitychange` listener that toggles the class when the tab is hidden. Stops the perpetual bubble/light animations from burning battery when backgrounded. `node --check` clean.
- **Coding v1 boss** ✅ (clarified, no code change needed): inspected v1's ch6 — it's already a **full themed multi-step boss mission** (route stations JKT→SBY that progress, signal/passenger state, 5 unlocking steps, confetti victory), richer than the math HP-bar bosses. The old CLAUDE.md "label-only" note was inaccurate and has been corrected. Phase 1b is therefore complete across all early courses.
- 🟡 **Deferred (low-value, find/replace risk):** tutor-name unification (Kai/Kapi/Detektif Kapi). "Kai" (tutor) collides with "KAI" (the train brand) in many spots, so a blind global replace is unsafe — needs careful per-file review. Logged for a future focused pass.
- Files: `courses/math/rayyan-math-grade5.html`, `grade6.html`, `grade7.html`.

### Phase 3b – real playable game in v5 "Buat Game-mu" ✅  (makes "build a game" real)
- Added a "🎮 Mainkan Game-mu!" screen (reachable from v5's home) with a real **Kereta Lari** endless-runner: canvas + `requestAnimationFrame` loop, a 🚂 player, SPACE/tap to jump (gravity physics), spawning obstacles that speed up with score, AABB collision → game-over + restart, live score. Self-contained `Game` module; loop self-stops when the screen isn't active (no off-screen CPU). Verified: `node --check` clean + headless logic sim (spawn/collision/jump) works.
- The kid now ends with an actual playable, replayable game — the "publish your own game" payoff is real.
- Files: `courses/coding/rayyan-coding-v5.html`.
- 🔜 Remaining: coding v1 boss (Phase 1b); Phase 4 polish; (optional) Track C bridge.

### Phase 3a – real JS sandbox in v3 "Mantra Kode" ✅  (makes "type real code" real)
- Added a "✨ Lab Mantra Bebas" free-play screen (reachable from v3's home) with a real code editor: a `<textarea>` of JavaScript + a "Jalankan" button → `runSandbox()` captures `console.log` and executes the kid's code via `new Function('console', code)` inside a `try/catch`, showing live output or the real error message. Sandboxed (the kid's own code on their own page; no remote/untrusted input). Verified: `node --check` clean + simulated run produces correct output (vars, loops, log capture).
- This is additive — the existing fill-in-the-blank lessons are untouched; the sandbox is the new "real typing" payoff.
- Files: `courses/coding/rayyan-coding-v3.html`.
- 🔜 Next: v5 keepable game (Phase 3b); coding v1 boss (Phase 1b); Phase 4 polish.

### Phase 2 – themed world map ✅  → **Phase 2 / Track D complete**
- Added biome tints to the journey map: each upcoming ("next") stop circle previews its world's colour via a `BIOME` lookup + `--biome` CSS var. Status colours (completed = mango, active = tomato) are untouched — the rule only targets `.stop.next`, so it's fully additive. `node --check` clean.
- With this, the retention layer is functionally complete: streak + badges + certificate + daily quest/flash drill + themed map.
- Files: `rayyan.html`.
- 🔜 Remaining overall: Phase 1b coding v1 boss; Phase 3 (v3 real sandbox, v5 keepable game); Phase 4 polish.

### Phase 2 – daily quest (Misi Harian) ✅  [also covers Track E Flash Drills]
- Added a "⚡ Misi Harian" section to `rayyan.html`: a date-seeded daily challenge from a self-contained 16-question bank (quick mental math — times tables, +/−, simple fractions, patterns). Same quest all day (seeded by local date), MC with instant feedback, retry on wrong, marks done-for-today in `rayyanDailyQuest` localStorage and shows a "come back tomorrow" state. All 16 answers verified consistent; inline scripts pass `node --check`.
- This doubles as the **Track E "Latihan Kilat" Flash Drill** (60-second mixed mini-quiz) the roadmap called for.
- Files: `rayyan.html`.
- 🔜 Track D remaining: themed/unified world map (biomes). Then Phase 1b coding v1 boss; Phase 3 (v3 sandbox, v5 game); Phase 4 polish.

### Phase 2 – printable certificate ✅
- Added a "🏆 Lihat Sertifikatku" button (in the medal section) that opens a print-styled **Sertifikat Petualang** overlay showing Rayyan's name, total stars, adventures completed, streak, and the date (Indonesian format). `@media print` isolates the certificate so `window.print()` produces a clean printable page — the real-world reward Adhi can hand over. Inline scripts pass `node --check`.
- Files: `rayyan.html`.
- 🔜 Next Track D: daily quest, themed world map; plus coding v1 boss (Phase 1b).

### Phase 2 – medal cabinet (badges) ✅
- Added a "🏅 Lemari Medali" section to `rayyan.html` with **8 badges computed from real progress** (total stars, adventures completed, streak): earned = coloured (mango), locked = greyed with a 🔒. Recomputed on load and after each cloud-sync pull. All inline scripts pass `node --check`.
- Badges: Bintang Pertama (1⭐), Kolektor (25⭐), Raja (50⭐), Petualang (1 done), Penjelajah (5 done), Sang Master (all done), Semangat 3/7 Hari (streak).
- Files: `rayyan.html`.
- 🔜 Next Track D: daily quest, printable certificate, themed world map; plus coding v1 boss (Phase 1b).

### Phase 2 – daily streak counter ✅ (first Track D / retention feature)
- Added a 🔥 streak pill to `rayyan.html`'s hero + a self-contained `updateStreak()`: tracks `rayyanStreak` in localStorage (`{count, lastDate}`). On load: same day → unchanged; yesterday → +1; gap/first → reset to 1. Local date math (no UTC drift), no global name collisions, all inline scripts pass `node --check`.
- Semantics: a "day" = the kid opened his adventure hub that day (showing up keeps the streak). Local-only (not cloud-synced — it's a per-device motivator).
- Files: `rayyan.html`.
- 🔜 Next Track D: daily quest (pull a review question from a completed topic), badges + printable certificate, themed world map. Also still pending: coding v1 boss (Phase 1b).

### Phase 1b – boss battle on chapter 6: math Gr3 + Gr4 ✅
- Replicated the proven Gr2 lite-boss pattern to Gr3 (👹 "Bos Pecahan", ch6 = fractions) and Gr4 (👽 "Bos Bilangan", ch6 = KPK/FPB). Anchors matched Gr2 (Gr4 is minified – matched its exact strings). Both pass `node --check`; boss DOM ids + helper fns present.
- math Gr2–4 boss battles now all live. Coding v1 boss still pending (different block engine; already has sound).
- Files: `courses/math/rayyan-math-grade3.html`, `rayyan-math-grade4.html`.
- 🔜 Next: coding v1 boss, then Phase 2 (retention layer).

### Phase 1b – boss battle on chapter 6: math Gr2 ✅
- Added a **safe, additive lite-boss** to Gr2 chapter 6 ("Pola & Urutan"): an enemy (👾 "Bos Pola") with an HP bar that drains as the kid answers correctly (HP = total − score), a hit animation + `boss-hit` sound on each correct answer, and the existing fanfare/confetti as the victory. The boss only activates on the final chapter (`BOSS_IDX`); every other chapter and the core quiz flow are **untouched** (lowest blast radius). Passes `node --check`.
- "Lite" = HP + hit + victory; **no lives/timer/game-over yet** (those are the riskier parts — deferred so this ships safely without browser testing).
- Also confirmed **coding v1 already has a full sound system** (the `AX` module) → it needs no sound back-port, only the boss.
- Files: `courses/math/rayyan-math-grade2-v1.html`.
- 🔜 Next: replicate the boss pattern to math Gr3, Gr4, then coding v1; later optionally upgrade lite→full boss (lives/timer).

### Phase 1a – sound/juice in math Gr2–4 ✅
- Added a self-contained `SFX` module (procedural Web Audio – **no asset files**) to math Gr2, Gr3, Gr4, hooked at the single `showToast()` choke-point so every answer plays a correct/wrong cue, plus a `fanfare` on chapter completion (alongside the existing confetti).
- Copied the proven sound recipes from the Gr5 engine; named it `SFX` (not `Audio`) to avoid shadowing the native constructor. All three files pass `node --check`.
- Files: `courses/math/rayyan-math-grade2-v1.html`, `rayyan-math-grade3.html`, `rayyan-math-grade4.html`.
- 🔜 Next: coding v1 sound (block-based engine), then Phase 1b boss battle on chapter 6 for Gr2–4 + v1.

### Step 0 – Operating Procedure + this build log ✅
- Added a permanent **Operating Procedure (SOP)** section near the top of `CLAUDE.md` so every future session follows the small-step + document-as-you-go loop automatically (no need to re-explain each session).
- Created `PROGRESS.md` (this file) as the chronological build log.
- 🔜 Next: Phase 1, course by course — build a reusable inline "juice kit" (procedural Web-Audio sound + confetti) and a chapter-6 boss battle, starting with math Gr2.

### Phase 0 – audit fixes ✅ (PR #98, merged to main)
- Restored the disguise: stripped visible "Kelas N" grade numbers from the `<title>` + bug-report `courseName` in math Gr2–Gr5.
- Cleaned Raya wiring: removed the phantom `rayaLearning` key from `kids.html` / `auth.js` / `dashboard.html`; fixed Raya dashboard chapter totals (4 → 5 for both live courses).
- Refreshed `CLAUDE.md` "What's Already Built" to reflect all 11 shipped Rayyan adventures + 2 Raya courses, with honest status (Gr2–4 lack the boss engine; coding v3/v5 simulate the "real code/real game" payoff).
- Resolved a merge conflict from main's project-wide em-dash → en-dash sweep (kept content, matched en-dash convention).
