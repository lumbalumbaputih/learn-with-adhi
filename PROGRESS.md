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
