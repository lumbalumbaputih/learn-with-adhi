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

## 2026-06-04

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
