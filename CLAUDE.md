# Learn with Adhi – Project Memory

## Owner
Adhi (adhiazure@gmail.com) – building this for his kids, Rayyan and Raya.

---

## ⚙️ Operating Procedure (SOP) – READ FIRST, follow every session

This project is built in **small, fully-shippable steps**. The #1 rule: **never end a session with half-finished work in the tree, and never let this doc go stale.** Both have bitten us before.

**The loop for EVERY change (no exceptions):**
1. **One small step at a time.** A "step" = one self-contained, working increment (e.g. *one* course gets the boss engine; *one* Track-D feature). Don't batch unrelated work into a giant commit.
2. **Verify it works** before moving on: grep your change, sanity-check the JS, confirm the disguise rules + wiring are intact (open it mentally / check the obvious failure modes).
3. **Update the docs in the SAME step** (non-negotiable – this is why the doc went stale before):
   - Move shipped items into **"What's Already Built"** and update their **Status** column.
   - Append a dated entry to **`PROGRESS.md`** (what changed, files touched, what's next).
4. **Commit + push** the step. Small, descriptive message. Every commit must leave the tree in a *working* state so a dropped session never loses or half-bakes anything.
5. Only then start the next step.

**Definition of Done** for any course/feature = it works **+** disguise intact **+** wired in all required places (see the wiring checklist below) **+** docs updated **+** committed & pushed. "Done" is never just "code written."

**Sources of truth:** this CLAUDE.md "What's Already Built" + Status = the current high-level state. `PROGRESS.md` = the chronological build log (newest on top). Keep BOTH current, every step.

**Branch/PR:** work on the assigned feature branch; open a **draft PR** early so each pushed step is saved & preview-deployed; keep the disguise + single-file rules below.

---

## The Core Mission: Rayyan's Accelerated Learning

**The goal:** Make Rayyan genuinely love and excel at both math and coding – learning 3–5 years ahead of his actual grade level.

**The constraint (critical):** Rayyan must never feel like he's doing advanced or "too hard" work. The moment he feels that, he makes excuses to stop. Every course must feel like a game or adventure, not school. Never reveal grade levels to him, never frame content as "advanced."

**Rayyan's profile:**
- Currently in **Grade 2 SD (elementary)** in Indonesia (~7–8 years old)
- Loves trains, KAI, and adventure themes
- Responds well to gamification (stars, progress bars, boss battles)
- Needs visual/interactive learning – not text-heavy

**The disguise strategy:**
- Never say "Kelas 3/4/5" in a way Rayyan sees – use adventure themes instead
- Themes per grade: KAI Train (Gr3), Space/Rocket (Gr4), Deep Ocean (Gr5), etc.
- For coding: never say "programming" or "coding" – say "mengajari robot" (teaching the robot), "membuat petualangan" (making adventures)
- Language: **Bahasa Indonesia UI + English for code/commands** (mirrors real programming, teaches tech vocabulary naturally)

---

## What's Already Built

### Math Ladder (`rayyan.html` hub)
| Course (what Rayyan sees) | Theme | Hidden Level | File | Key | Status |
|---|---|---|---|---|---|
| Petualangan Angka | Basic (no special theme) | Gr2 | `courses/math/rayyan-math-grade2-v1.html` | `rayyanMath` | ✅ Done (sound + boss battle 👾) |
| Petualangan KAI 🚂 | KAI Train Adventure | Gr3 | `courses/math/rayyan-math-grade3.html` | `rayyanMath3` | ✅ Done (sound + boss battle) |
| Petualangan Antariksa 🚀 | Space/Rocket Adventure | Gr4 | `courses/math/rayyan-math-grade4.html` | `rayyanMath4` | ✅ Done (sound + boss battle) |
| Laut Dalam 🌊 | Deep Ocean Adventure | Gr5 | `courses/math/rayyan-math-grade5.html` | `rayyanMath5` | ✅ Done (full boss + sound + rich interactions) |
| Kota Masa Depan 🏙️ | Future City builder | Gr6 | `courses/math/rayyan-math-grade6.html` | `rayyanMath6` | ✅ Done (full boss) |
| Lab Misteri X 🧪 | Mystery Lab (find the unknown X) | Gr7 | `courses/math/rayyan-math-grade7.html` | `rayyanMath7` | ✅ Done – **5-yrs-ahead algebra capstone** |

→ Math ladder now reaches **Gr7 = ~5 years ahead** (real algebra), fully disguised. **Math content target MET.**
→ ⚠️ Note (2026-06-04 audit + Phase 1 build): Gr2–4 used the *old basic engine*; Gr5–7 have the rich one. **Phase 1a ✅** added the `SFX` module (procedural Web Audio, hooked at `showToast()`) to Gr2–4 (coding v1 already had its own `AX` sound system). **Phase 1b (in progress):** a lite boss battle on chapter 6 (enemy + HP bar that drains with correct answers + hit anim + victory; no lives/timer yet) — **math Gr2–4 ✅ done** (enemies 👾/👹/👽), coding-v1 boss pending. **Plan-v2 Y1 ✅ (2026-06-09):** Gr2–4 also got Gr5's rich question types (`drag-sort`/`number-line`/`bar-fill`) back-ported, so the early courses are no longer MC/input-only.

### Coding Ladder (`rayyan.html` hub)
| Course (what Rayyan sees) | Theme | Hidden Concepts | File | Key | Status |
|---|---|---|---|---|---|
| Pabrik Robot KAI 🤖 | Train Robot Factory | Sequencing → Conditionals → Loops → Variables → Functions → Integration | `courses/coding/rayyan-coding-v1.html` | `rayyanCoding` | ✅ Done (drag-blocks + `AX` sound; ch6 is a **full themed multi-step boss mission** — route stations that light up, signal/passenger state, 5 unlocking steps, confetti victory) |
| Robot Antariksa 🛰️ | Space Robots | Events, lists/arrays, nested loops, boolean logic, integration | `courses/coding/rayyan-coding-v2.html` | `rayyanCoding2` | ✅ Done (blocks + full boss) |
| Mantra Kode ✨ | Code Spells | `console.log`, variables, if/else, loops, functions | `courses/coding/rayyan-coding-v3.html` | `rayyanCoding3` | ✅ Lessons are fill-in-the-blank, **PLUS a real "Lab Mantra Bebas" JS sandbox** (type & run real JavaScript, live `console.log` output + real errors, sandboxed via `new Function`) — the "type real code" payoff is now real |
| Studio Pelukis Kode 🎨 | Code Painter (Canvas) | Coordinates, shapes, loops/patterns, randomness, animation | `courses/coding/rayyan-coding-v4.html` | `rayyanCoding4` | ✅ Lessons fill-in-the-blank, **PLUS a real "Kanvas Bebas" free-draw sandbox** (type `kotak`/`lingkaran`/`garis`/`tulis` commands → live canvas, real errors) — he paints his own art now |
| Buat Game-mu Sendiri 🎮 | Make Your Own Game | Game loop, sprite/input, spawning, collision, score/state | `courses/coding/rayyan-coding-v5.html` | `rayyanCoding5` | ✅ Lessons fill-in-the-blank, **PLUS a real playable "Kereta Lari" game** (🎮 Mainkan Game-mu! — canvas, jump, spawning obstacles, collision, score, game-over/restart) the kid plays & replays — the "build a game" payoff is now real |
| Robot Ahli Matematika 🤖 (Track C Bridge) | Use code to DO math | Shapes & angles, number patterns, order-of-ops, coordinates + `y=2x`, solve-for-X | `courses/coding/rayyan-bridge-v1.html` | `rayyanBridge` | ✅ Done (4 interactive canvases + Gr7-style boss + celebration animation; MC de-biased) |

→ All 5 coding rungs **+ the Track C "Bridge"** shipped & wired — **Rayyan now has 12 adventures.** v3/v5 lessons are still fill-in-the-blank but now have the **real** JS sandbox + playable game alongside them; the Bridge proves he can use code to *do* math.

### Raya's Content (younger sibling, ~3–4 years old)
- **Matematika Raya** (`courses/math/raya-math-v1.html`, key `rayaMath`) – visual, tap-to-count.
- **Belajar Bersama Raya** (`courses/learning/raya-learning-visual-v1.html`, key `rayaVisual`) – colors, shapes, animals, matching.
- **Logika & Pola Raya 🧩** (`courses/learning/raya-logic-v1.html`, key `rayaLogic`) – ✅ **early reasoning** (2026-06-09): 6 chapters × 5 q — patterns (what-comes-next) → size compare → odd-one-out → categories → 2-step sequencing → mixed review. Audio built-in from day one.
- **Jelajah Dunia 🌍** (`courses/learning/raya-world-v1.html`, key `rayaWorld`) – ✅ **world knowledge** (2026-06-10): 6 chapters × 5 q — Lawan Kata (opposites) → Tubuhku (body parts) → Makanan & Minuman → Kendaraan → Cuaca & Langit → BOSS mixed review. Emoji visuals for now (CC0-photo upgrade = X2; build env blocked image hosts). Renamed from "Dunia Raya" to avoid colliding with the hub page title.
- 🔊 **All 5 Raya courses have sound (2026-06-09/10):** SFX jingles + Web-Speech read-aloud (`id-ID`) with a "🔊 Dengarkan" button, auto-read questions, and spoken answer feedback — Raya can now play without a parent narrating. (Hardened 2026-06-09: deferred `speak()` after `cancel()` + utterance ref, fixing silent playback on Chrome/Android.)
- **Belajar Huruf Bersama Raya 📖** (`courses/learning/raya-literacy-v1.html`, key `rayaLiteracy`) – ✅ **literacy / pre-reading** (the big peer-gap closer): **9 chapters covering all 26 letters** — Vokal A-I-U-E-O → Konsonan B-G → H-M → N-T → Q-Z (recognition, each with an example word) → Bunyi Awal (beginning sounds, 🍎→A, 12q) → Besar & Kecil (upper/lowercase drag-match, all 26) → Kata Pertama (first words, IBU→👩, 10q) → BOSS Petualangan Huruf (mixed review). 66 questions, same Raya engine (parent read-aloud, stars, confetti, tap/drag). Wired in all 4 places (`raya.html`, `kids.html`, `auth.js`, `dashboard.html`).

> **Raya gap analysis (2026-06-04):** she was solid on early numeracy + colors/shapes/animals but had **zero literacy** — the single highest-leverage "ahead of peers" skill for a 3–4 yr old. `rayaLiteracy` closes that. ✅ **Logika & Pola** shipped 2026-06-09 (`rayaLogic`). ✅ **Jelajah Dunia** (world knowledge, = plan-v2 R3) shipped 2026-06-10 (`rayaWorld`) — her content ladder is now complete; remaining work is quality (X2 real photos).

- ~~`courses/learning/raya-learning-paud-v1.html`~~ — the never-wired near-duplicate of the visual course was **deleted 2026-06-10** (plan-v2 R4; its phantom `rayaLearning` key was already removed from the star lists on 2026-06-04).

### Games
- Petualangan Kereta (choose-your-own-adventure stories)
- Kereta Rayyan: Lari Cepat! (endless runner game)
- Cari Bersama Raya (find-it / Where's Waldo style)

---

## The Build Plan – Roadmap to "3–5 Years Ahead"

This is the master plan for which courses to build so Rayyan hits the goal: genuinely
loving + excelling at **both** math and coding, ~5 years ahead, with the disguise intact.

### Gap analysis – where he is vs. the target *(updated 2026-06-04 audit)*
- **Math:** ✅ ladder now reaches **Gr7** (real algebra, ≈5 yrs ahead). Content target **MET**. Remaining: back-port the boss/sound/rich-interaction engine into Gr2–4 (the earliest courses are the most bare – bad first impression).
- **Coding:** ✅ all 5 rungs shipped, and the two headline payoffs are now **real**: v3 has a live JS sandbox ("Lab Mantra Bebas") and v5 has a real playable game ("Kereta Lari"). (The chapter *lessons* in v3/v4/v5 are still fill-in-the-blank, but the real-code / real-game experiences now exist alongside them.) v1's ch6 turned out to be a full multi-step boss mission already (the old "label-only" note was wrong) — so all coding rungs now have real boss/payoff experiences.
- **Bridge:** ✅ **shipped** — Track C "Robot Ahli Matematika" (key `rayyanBridge`): the math×coding crossover where he uses code to draw shapes/angles, generate number patterns, evaluate order-of-operations, plot coordinates (incl. `y=2x`), and solve for X — capped by a boss + celebration canvas.
- **"Love it" layer (Track D):** ✅ **functionally complete**. Confetti + per-course boss battles + a daily streak (🔥 `rayyanStreak`) + a medal cabinet (🏅 8 badges) + a printable certificate (🏆 `window.print`) + a daily quest (⚡ Misi Harian, also the Track-E Flash Drill) + a **biome-tinted world map** (upcoming stops preview their region's colour) — all live on `rayyan.html` (Phase 2). Remaining big-ticket gaps are now in coding: the v1 boss and the Phase 3 "real code / real game" payoffs.

The content rungs are ~done; the job is now (1) make the *start* as fun as the rest, (2) make the "real code / real game" promises real, and (3) build the retention layer. A kid only gets 5 years ahead if he keeps showing up, so Track D is a first-class deliverable, not polish.

---

### TRACK A – Math Ladder: finish the climb to algebra
Same engine as existing math courses (6 chapters, ch6 = BOSS, stars, localStorage). New biomes
extend the one continuous adventure world.

**A1 · Math Gr6 – "Kota Masa Depan" 🏙️** (Future City builder · key `rayyanMath6`)
*Hidden: Kelas 6 SD. Theme ties to Adhi's Feifelusia city vision – build, measure & run a city.*
| Ch | What Rayyan sees | Hidden topic |
|---|---|---|
| 1 | Suhu & Lantai Kota | Integers / negative numbers (operations) |
| 2 | Campur Bahan Bangunan | Ratio & proportion, scale |
| 3 | Roda Raksasa & Pipa | Circle – circumference & area (π) |
| 4 | Gedung Pencakar Langit | Volume & surface area (prisma, tabung, limas, kerucut, bola) |
| 5 | Peta Grid Kota | Coordinate plane (x/y, quadrants) |
| 6 | BOSS: Pusat Data Kota | Statistics (mean/median/mode, charts) + debit/rate |

**A2 · Math Gr7 – "Lab Misteri X" 🧪** (Mystery Lab: find the unknown X · key `rayyanMath7`) – **THE 5-YEARS-AHEAD CAPSTONE**
*Hidden: SMP Kelas 7 – the algebra leap. Reframed as a detective lab where every puzzle hides a secret "X" to uncover – abstraction disguised as mystery-solving, so it feels like the most exciting course, not the hardest.*
| Ch | What Rayyan sees | Hidden topic |
|---|---|---|
| 1 | Kotak Petunjuk | Sets / himpunan (union, intersection, Venn) |
| 2 | Mesin Hitung Lab | Integer & fraction operations, intro powers/roots |
| 3 | Bahasa Rahasia | Algebraic expressions (variables, terms, simplify, substitute) |
| 4 | Temukan X! | Linear equations & inequalities, 1 variable – *solve for the unknown* |
| 5 | Uang & Skala Misi | Social arithmetic (profit/discount/interest) + ratio/scale |
| 6 | BOSS: Bukti Akhir | Lines, angles, triangles/quadrilaterals + mixed-mystery boss |

> ⚠️ Gr7 is dense. If 6 chapters feel cramped, split into **7a (Bilangan & Aljabar)** and **7b (Geometri & Data)**. Decide during build.

*(Stretch, optional: Gr8 – linear functions/graphs, Pythagoras, probability – only if he's flying.)*

---

### TRACK B – Coding Ladder: blocks → real typed code → his own game
Each is a single-file course, 6 chapters, BOSS finale, same stars/localStorage engine. Keep the
disguise: "mengajari robot", "membuat petualangan" – never "coding/programming". Indonesian UI + English code.

**B1 · "Robot Antariksa" 🛰️** (Space Robots · key `rayyanCoding2`) – intermediate block logic
| Ch | What Rayyan sees | Hidden CS |
|---|---|---|
| 1 | Tombol & Sinyal | Events ("when pressed / when arrived") |
| 2 | Daftar Muatan | Lists / arrays (add, remove, count, loop) |
| 3 | Ulang di Dalam Ulang | Nested loops (rows × columns) |
| 4 | Logika AND / OR / NOT | Boolean & compound conditions, operators |
| 5 | Robot Pintar | Combine variables + lists + logic to decide |
| 6 | BOSS: Misi Mars | Multi-step autonomous mission |

**B2 · "Mantra Kode" ✨💻** (Code Spells · key `rayyanCoding3`) – **the leap from drag-blocks to TYPING real code**
*Recommended language: **JavaScript** (matches this whole site; lets him eventually edit/build his own pages). Alt: Python. Frame typed code as "magic words you spell out".*
| Ch | What Rayyan sees | Hidden CS |
|---|---|---|
| 1 | Mantra Pertama | `console.log`, run code, fix typos (syntax) |
| 2 | Kotak Ajaib | Real variables (`let`, numbers/strings) |
| 3 | Mantra Bercabang | `if / else`, comparisons |
| 4 | Mantra Berulang | `for` / `while` loops |
| 5 | Resep Mantra | Real `function`s with params & return |
| 6 | BOSS: Mantra Gabungan | A small typed program (guessing/fortune game) |

**B3 · "Studio Pelukis Kode" 🎨** (Code Painter · key `rayyanCoding4`) – creative coding (Canvas)
*Visible output = huge motivation. Also secretly reinforces coordinates/angles from math.*
| Ch | What Rayyan sees | Hidden CS |
|---|---|---|
| 1 | Titik & Garis | Coordinates, draw primitives |
| 2 | Bentuk & Warna | Shapes, color, fill |
| 3 | Pola Ajaib | Loops → repeating patterns/spirals |
| 4 | Acak! | Randomness / generative art |
| 5 | Gerak! | Animation loop (frame by frame) |
| 6 | BOSS: Kartu Animasi | Animated scene (a moving KAI train!) |

**B4 · "Buat Game-mu Sendiri" 🎮** (Make Your Own Game · key `rayyanCoding5`) – capstone
*He builds what he already plays (mirrors the train-runner game). Strongest possible payoff.*
| Ch | What Rayyan sees | Hidden CS |
|---|---|---|
| 1 | Panggung Game | Game loop + canvas setup |
| 2 | Sang Pahlawan | Sprite + keyboard/tap input |
| 3 | Rintangan | Spawning & moving obstacles |
| 4 | Tabrakan! | Collision detection, lives |
| 5 | Skor & Bintang | Score, win/lose state |
| 6 | BOSS: Rilis Game-mu | Polish + "publish" his own playable page |

**B5 (stretch) · "Penjinak Data" 🐍** (Data Tamer · key `rayyanCoding6`) – intro Python + simple algorithms (sorting/searching as "taming data creatures"). Only after B4.

---

### TRACK C – The Bridge: "Robot Ahli Matematika" 🤖➗ — ✅ SHIPPED (`courses/coding/rayyan-bridge-v1.html`, key `rayyanBridge`)
*key `rayyanBridge`. Build **after B3 (needs drawing) + Gr6 (coordinates/geometry)**. Proves he can use code to DO math – cements both ladders into one skill.*
| Ch | What Rayyan sees | Links to |
|---|---|---|
| 1 | Robot Penggambar Bentuk | Turtle/Canvas polygons → angles & shapes |
| 2 | Mesin Pola Bilangan | Loops generate sequences (multiples, patterns) |
| 3 | Kalkulator Buatan Sendiri | Operations + order of operations |
| 4 | Plot Peta Koordinat | Plot points/lines; gentle `y = 2x` graph |
| 5 | Detektif X | Code that solves for X → links to Gr7 algebra |
| 6 | BOSS: Visual Matematika | Animate a math idea end-to-end |

---

### TRACK D – "Make Him Love It" engagement layer (decides success)
Build alongside content. These keep him returning, which is what actually compounds into 5 years ahead.
- **Unified World Map** – upgrade `rayyan.html` so math + coding read as ONE connected world (two rails of one journey, or regions of one map), not separate subjects.
- **Daily Quest + Streak** – one small daily challenge pulling from already-completed topics (localStorage streak counter). Doubles as spaced-repetition review.
- **Badge / Medal Cabinet + Certificate** – collectible rewards per milestone; a printable "graduation" certificate at big bosses (real-world reward Adhi can hand over).
- **Boss battles between worlds + a Grand Boss** at the end of each ladder.
- **Fluency mini-games** (see Track E) surfaced as "Ayo Main!" games, not drills.
- Polish: sound, confetti/celebration, big tap targets, fast load.

### TRACK E – Foundation maintenance (no holes)
Going 5 years ahead is only safe if earlier skills stay sharp.
- **"Latihan Kilat" (Flash Drills)** – 60-second mixed mini-quizzes (times tables, mental math, past topics) framed as a game/race. Adaptive: revisit weak spots. Ties into the daily streak.

---

### Suggested build order (phases) – *status updated 2026-06-04*
1. ✅ **Phase 1 – finish the in-progress ladders:** A1 (Gr6 City) · B1 (Robot Antariksa). **DONE.**
2. ✅ **Phase 2 – the two big leaps:** A2 (Gr7 algebra) **DONE & solid** · B2 (Mantra Kode) now has a **real JS sandbox** ("Lab Mantra Bebas") so he actually types & runs code. **DONE.**
3. ✅ **Phase 3 – make it real & joyful:** B3 ✅ shipped · B4 now ends with a **real playable game** ("Kereta Lari") · v3 has a **real JS sandbox**. Track C "the Bridge" ✅ **now shipped too**.
4. ❌ **Phase 4 – love/retention layer (THE priority now):** unified/themed map, daily quest/streak, badges + printable certificate, Flash Drills. Barely started.
5. **Phase 5 – stretch:** B5 (Python) · Gr8 math.

**Next-up recommendation:** superseded by the **Improvement Plan v2** below (2026-06-09) — the original Tracks A–E are essentially done; v2 is the new prioritized queue.

---

## Improvement Plan v2 – 2026-06-09 (the current build queue)

> Planning audit of all 17 course files (not just the docs). The original roadmap is ~complete:
> content ladders ✅, retention layer ✅, real sandbox/game payoffs ✅. What's left is **quality
> asymmetry**: Raya's courses are silent, and Rayyan's *first* courses are his plainest.
> Each item below = one SOP step (ship → verify → docs → commit/push). Ordered by leverage.

### Verified gaps this plan is built on (grepped 2026-06-09)
- **Raya has ZERO audio.** No SFX, no read-aloud in any of her 3 courses (`grep AudioContext|new Audio|speechSynthesis` → 0). A *literacy* course that never plays a letter **sound**, for a kid who can't read the prompts — every session requires a parent narrator.
- **Rayyan Gr2–4 are MC/input-only.** They got SFX + lite boss (Phase 1), but have 0 drag/canvas/number-line interactions, while Gr5 has `drag-sort`, `number-line`, `bar-fill`. His easiest courses are his most boring — backwards for a kid who quits when bored.
- **Coding v4 is the last ⚠️ course:** real demo canvases but the kid never draws his own art.
- **Misi Harian is random, not adaptive:** Track E promised "revisit weak spots" — wrong answers are never recorded anywhere.

### RAYA queue (bigger gaps, and she can't work around them herself)
**R1 · Suara untuk Raya 🔊 — read-aloud + SFX in all 3 Raya courses** — ✅ **DONE (2026-06-09)**
- All 3 Raya courses (`rayaLiteracy`, `rayaVisual`, `rayaMath`) now have: the `SFX` module (correct/wrong jingles + completion fanfare), a `Suara` read-aloud module (Web Speech API, `id-ID` voice, graceful no-op if unsupported), a **🔊 Dengarkan** button on every question, auto-read on question render, and spoken feedback (the `ok` line — e.g. "Hebat! Huruf A! Contoh: Apel" — letter *sounds*, not just shapes). Parent notices updated. Emoji are stripped from TTS via `cleanSay()`.

**R2 · New course: "Logika & Pola" 🧩** (key `rayaLogic`, `courses/learning/raya-logic-v1.html`) — ✅ **DONE (2026-06-09)**
- Shipped with 6 chapters × 5 questions (30 q): Pola Apa Selanjutnya? (AB/AAB/ABB patterns) → Besar & Kecil (size/length/height/weight compare) → Mana yang Beda? (odd-one-out incl. a color-dot round) → Kelompokkan! (categories) → Urutan Cerita (2-step sequencing: 🥚→🐣, 🐛→🦋) → Petualangan Logika (mixed review). Same Raya `pick` engine, R1 audio (SFX + Suara read-aloud + 🔊 Dengarkan) from day one, answer positions varied. Wired in all 4 places + count pills bumped (Raya now 4 courses).

**R3 · New course: "Jelajah Dunia" 🌍** (key `rayaWorld`, `courses/learning/raya-world-v1.html`) — ✅ **DONE (2026-06-10)**
- Shipped: 6 chapters × 5 q (30 q) — Lawan Kata (opposites) → Tubuhku (body parts) → Makanan & Minuman → Kendaraan (incl. 🚂 di rel!) → Cuaca & Langit → BOSS Petualangan Dunia (mixed). Same Raya engine + audio, wired in all 4 places, pills bumped (Raya now 5 courses).
- **Renamed from the planned "Dunia Raya"** — `raya.html` (the hub) was already titled "Dunia Raya", so the course name would have collided.
- ⚠️ Shipped with **emoji visuals, not the planned CC0 photos**: the build environment's network allowlist blocks image hosts (Wikimedia/Openverse tested 403). Photo upgrade (`assets/img/raya-world/`) moved into **X2** — needs a session with image-host network access (or Adhi drops photos into the repo).

**R4 · Raya housekeeping** — ✅ **DONE (2026-06-10)**
- Deleted the never-wired duplicate `courses/learning/raya-learning-paud-v1.html` and the dead `assets/js/sync.js` (+ its unused `<script>` tag in `rayyan.html`). Flagged for Adhi's confirmation in the PR per the SOP.

### RAYYAN queue
**Y1 · Rich interactions back-ported to Gr2–4** *(finish the first-impression fix properly)* — ✅ **DONE (2026-06-09)**
- Gr5's rich question types now live in all three early courses (renderers adapted to the old `state`/`showToast` engine, CSS ported, dispatch extended):
  - **Gr2:** `drag-sort` (urutkan 5,10,15,20,25) + `number-line` (🚂 marker, odd-number pattern → 9) in the *patterns* chapter.
  - **Gr3:** all 3 types — place-value `drag-sort` (7.001/7.010/7.100), pecahan `bar-fill` (1/2 of 6 kotak), pecahan `drag-sort` (1/4 → 1/3 → 1/2). 🚂 marker.
  - **Gr4:** all 3 types — rounding `number-line` (🚀 marker, 67 → 70), big-number `drag-sort` (89.998 → 100.000), tangki-roket `bar-fill` (3/4 of 8 = 6, sneaks in pecahan senilai).

**Y2 · v4 "Studio Pelukis Kode": let him paint 🎨** — ✅ **DONE (2026-06-09)**
- Added the **"Kanvas Bebas"** free-play screen (home button → `sKanvas`): type real JS drawing commands against an Indonesian helper API — `kotak(x,y,w,h,'merah')`, `lingkaran`, `garis`, `tulis`, `acak`, `bersihkan` — run via `new Function` with a 5000-shape guard, live `<canvas>` render, real error messages, command cheat-sheet, starter art (incl. a `for`-loop). Stretch (localStorage gallery) deferred to Y4.

**Y3 · Adaptive Misi Harian (finish Track E)** — ✅ **DONE (2026-06-09)**
- (a) All 6 math courses (Gr2–7) log wrong answers into localStorage `rayyanWeakSpots` (`{"<courseKey>:<chapterId>": {miss,last}}`) via a `logWeakSpot()` hook in `showToast` (old engine) / `handleAnswer` (rich engine). (b) `rayyan.html` Misi Harian: QUESTS are topic-tagged (kali/bagi/tambah/kurang/pecahan/pola), `WEAK_TOPIC_MAP` maps chapter ids → topics, daily pick is weighted `1 + min(misses,8)` (deterministic per day), and a correct review **heals** one miss on that topic.

**Y4 · "Karya-mu" shelf on `rayyan.html`** — ✅ **DONE (2026-06-10)**
- All three creations persist on success: v4 Kanvas Bebas → `rayyanKanvasArt` `{code,shapes,when}` (restored into the editor on reopen), v3 Lab Mantra → `rayyanMantraLab` `{code,when}` (idem), v5 Kereta Lari → `rayyanKeretaLari` `{best,when}` (game-over screen now also shows "Rekor: N").
- New **🖼️ Karya-mu** section on `rayyan.html` (after the medal cabinet, hidden until ≥1 creation exists): his last painting **re-rendered live** on a mini canvas (same `kotak`/`lingkaran`/… helper set as v4), his last typed spell as a code snippet (`textContent`, injection-safe), and his best runner score — each card links back to its course.

**Y5 · Stretch (only if he's flying):** Gr8 math biome · B5 Python "Penjinak Data".

### Cross-cutting
**X1 · Real-device pass 📱** — one session on the actual tablet/phone: tap-target sizes, speech-synthesis voice availability on the real device (id-ID voices vary by OS), Web-Audio-after-gesture, load time. Log findings in PROGRESS.md and fix the top 3.

**X2 · Asset richness pass 🖼️** *(unlocked by Adhi 2026-06-09: internet images/APIs allowed)* — upgrade visuals where it adds real learning/joy value, one course per step:
- ✅ **(2026-06-10) Kenney CC0 sprites downloaded** into `assets/img/kenney/` (platformer obstacles/clouds, space enemies/UFOs/meteor, 9 medals) from the GitHub mirror of the Kenney pack (kenney.nl itself + photo hosts are blocked by the env's network allowlist; mirror license verified CC0, every image visually vetted; see `assets/img/kenney/LICENSE.md`).
- ✅ **(2026-06-10) Both runner games upgraded:** the standalone `rayyan-train-run-v1.html` (sprite cactus/rock obstacles + sprite clouds) and v5's in-course "Kereta Lari" (sprite obstacles). All sprite drawing **falls back to the original vector/rect art if images fail** — hitboxes untouched.
- ✅ **(2026-06-10) Medal cabinet + Gr4 boss:** earned badges on `rayyan.html` show Kenney medal art (emoji corner-overlay keeps meaning, `onerror` emoji fallback); the Gr4 space boss 👽 is now a Kenney UFO sprite (same fallback).
- **Raya visual & literacy:** real CC0 photos for animals/objects (emoji → photo where recognition matters) — ⏳ still blocked: no reachable photo host in this env (Pixabay/Pexels/Wikimedia/Openverse all 403). Needs a different env or photos dropped into the repo.
- Follow the Technical Stack guardrails: download into `assets/`, license-check, never let a lesson depend on live network.

### Recommended order
`R1a (literacy audio)` → `R1b/R1c (other 2 Raya courses)` → `Y2 (v4 canvas)` → `Y1 (Gr2→3→4, one per step)` → `R2 (Logika & Pola)` → `Y3 (adaptive drill)` → `R3` → `Y4` → `R4/X1` → stretch.
*Rationale: R1 unlocks Raya's entire existing catalog for solo use (one mechanism, 3 courses); Y2 is the last broken promise; Y1 fixes what Rayyan actually touches first; new content (R2/R3) only after existing content is at full quality.*

### Decisions for Adhi (per SOP: pick the rec, note it, don't block)
- **R1 voice:** Web Speech API (free, offline-ish, instant) — recommended — vs. pre-recorded MP3s (consistent voice but heavy + violates single-file rule).
- **R4:** delete `raya-learning-paud-v1.html` (rec) vs. keep on disk.
- **Y2 command names:** Indonesian helper API (`kotak`, `lingkaran` — rec for age 7) vs. raw canvas JS.

### Per-course build spec (every new Rayyan course MUST follow)
- **One self-contained HTML file**, vanilla HTML/CSS/JS, design-system tokens, mobile-first, big tap targets, minimal text, instant visual/audio feedback.
- **6 chapters**, chapter 6 = BOSS. Star rating per chapter.
- **localStorage shape:** `{ totalStars, progress: { <chapterId>: { stars } } }` (matches `getProgress()` in `rayyan.html`). Use the keys assigned above.
- **File naming:** math → `courses/math/rayyan-math-gradeN.html`; coding → `courses/coding/rayyan-<theme>-vN.html`.
- **Wire it up (3 places):** add to `ADVENTURES` (or `GAMES`) in `rayyan.html` (emoji, title, blurb, href, progressKey, totalChapters); add the new key to the `sumStars([...])` list in `kids.html`; bump the "X petualangan" pill + "/ N petualangan selesai" counts in `kids.html` and `rayyan.html`.
- **Disguise rules (non-negotiable):** no grade numbers Rayyan can see; adventure framing only; for coding say "mengajari robot / membuat petualangan", never "coding/programming". Indonesian UI + English code.
- **One world:** new themes must connect to the existing biomes (train → space → ocean → city → lab), so it feels like one journey.

### Definition of Done – the goal is reached when…
- **Math:** Gr6 + Gr7 shipped → ladder = ~5 yrs ahead (real algebra), disguised, Rayyan earns stars through the Gr7 boss.
- **Coding:** B1–B4 shipped → he goes from blocks to typing real code to **publishing a game he built himself**.
- **Bridge** shipped → he uses code to solve/visualize math.
- **Engagement layer** live → unified map, daily streak, badges, Flash Drills.
- **Behavioral proof:** Rayyan returns voluntarily, holds a streak, and never frames any of it as "hard" or "advanced."

### Decisions to confirm with Adhi (don't block – pick the rec, note it)
- Gr6 theme: **Future City** (recommended, ties to Feifelusia) vs. another biome (jungle/mountain/arctic).
- Gr7: keep **6 chapters** vs. split into **7a/7b**.
- First real language in B2: **JavaScript** (recommended) vs. Python.

---

## Technical Stack
- Pure HTML + CSS + Vanilla JS, single-file per course
- No build tools, no frameworks
- **External resources (Adhi's green light, 2026-06-09):** internet images/APIs ARE allowed to make courses richer. Guardrails:
  - **Prefer downloaded assets over hotlinks:** fetch free-license images/sprites/sounds (CC0/free: Pixabay, Pexels, Kenney.nl game assets, OpenMoji/Twemoji SVGs) into `assets/img/` / `assets/audio/` and reference locally — richness without runtime network risk (kid on a tablet, lesson must never break on flaky wifi). Hotlinking a stable CDN (jsDelivr) is acceptable as a fallback.
  - **Browser-native APIs freely:** `speechSynthesis` (read-aloud), Web Audio, Canvas — no network needed.
  - **Runtime third-party APIs only with a graceful offline fallback** (course must still be fully playable without it). Pre-vet every image — nothing dynamically fetched and unreviewed should ever render in front of the kids.
  - License-check everything (CC0 / explicit free license); note the source in PROGRESS.md when adding assets.
- Hosted on Vercel (learn-with-adhi project)
- Progress stored in localStorage (per-course keys: `rayyanMath`, `rayyanMath3`, etc.)
- Hub page: `kids.html`
- All kids courses in: `courses/math/`, `courses/coding/`, `courses/games/`, `courses/learning/`

## Design System
- Font display: Bricolage Grotesque (bold, playful)
- Font body: Nunito or Inter (readable for kids)
- Colors: --tomato, --mango, --forest, --sea, --mawar, --indigo
- Background: --paper (#FBF4E6 warm cream)
- Interactive: bold borders (2px solid var(--ink)), hover = translate(-4px,-4px) + box-shadow
- Card pattern: emoji thumb + card-body with title, blurb, progress
- Stars counter in header (localStorage-persisted)

## Notes for Future Claude Sessions
- **"The Build Plan" section above is the source of truth** for what to build next for Rayyan, in what order, with assigned themes/keys/chapters. Update it as courses ship (move them into "What's Already Built").
- Always keep the "disguise" intact – no grade numbers visible to Rayyan in the adventure courses
- The math and coding ladder should feel like ONE continuous adventure world, not separate subjects
- Raya is younger (PAUD) – her content is visual-only, minimal reading, tap/drag interactions
- **Wiring a new Rayyan (kids) course:** update the `ADVENTURES`/`GAMES` array in `rayyan.html`, add its key to `sumStars([...])` in `kids.html` AND to `PROGRESS_KEYS_BY_TYPE` in `assets/js/auth.js` (for cloud sync) AND to `COURSE_NAMES` in `dashboard.html` (for the parent view), and bump the count pills. (For *adult* courses instead, update `index.html` / `assets/courses.json`.)
- **2026-06-04 audit:** all 12 Rayyan adventures (incl. the Track C Bridge) + 2 Raya courses are shipped & wired (this doc previously under-counted them). Math answers spot-checked correct. Fixed disguise leaks: the Gr2–5 `<title>` and bug-report `courseName` no longer show "Kelas N" (theme names only). Biggest remaining gaps: the Track D retention layer, and the faked "real code"/"real game" payoffs in coding v3/v5.
- **Dead code:** ~~`assets/js/sync.js`~~ **deleted 2026-06-10** (plan-v2 R4) — it duplicated `assets/js/auth.js` (the live per-kid Firestore sync) and was never initialized; its lone `<script>` tag in `rayyan.html` was removed with it.
- **Tutor name:** ✅ unified to **"Kapi"** across all math courses (Gr2–4 were "Kai"/"Nova" → now Kapi; Gr5–7 already Kapi; Gr7 keeps the "Detektif Kapi" themed variant). The internal CSS classes/ids (`kai-name`, `nova-msg`, etc.) were left as-is (not visible to Rayyan).
