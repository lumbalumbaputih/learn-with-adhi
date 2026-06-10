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

## 2026-06-10

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
