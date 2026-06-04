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
→ ⚠️ Note (2026-06-04 audit + Phase 1 build): Gr2–4 used the *old basic engine*; Gr5–7 have the rich one. **Phase 1a ✅** added the `SFX` module (procedural Web Audio, hooked at `showToast()`) to Gr2–4 (coding v1 already had its own `AX` sound system). **Phase 1b (in progress):** a lite boss battle on chapter 6 (enemy + HP bar that drains with correct answers + hit anim + victory; no lives/timer yet) — **math Gr2–4 ✅ done** (enemies 👾/👹/👽), coding-v1 boss pending.

### Coding Ladder (`rayyan.html` hub)
| Course (what Rayyan sees) | Theme | Hidden Concepts | File | Key | Status |
|---|---|---|---|---|---|
| Pabrik Robot KAI 🤖 | Train Robot Factory | Sequencing → Conditionals → Loops → Variables → Functions → Integration | `courses/coding/rayyan-coding-v1.html` | `rayyanCoding` | ✅ Done (drag-blocks + `AX` sound; ch6 is a **full themed multi-step boss mission** — route stations that light up, signal/passenger state, 5 unlocking steps, confetti victory) |
| Robot Antariksa 🛰️ | Space Robots | Events, lists/arrays, nested loops, boolean logic, integration | `courses/coding/rayyan-coding-v2.html` | `rayyanCoding2` | ✅ Done (blocks + full boss) |
| Mantra Kode ✨ | Code Spells | `console.log`, variables, if/else, loops, functions | `courses/coding/rayyan-coding-v3.html` | `rayyanCoding3` | ✅ Lessons are fill-in-the-blank, **PLUS a real "Lab Mantra Bebas" JS sandbox** (type & run real JavaScript, live `console.log` output + real errors, sandboxed via `new Function`) — the "type real code" payoff is now real |
| Studio Pelukis Kode 🎨 | Code Painter (Canvas) | Coordinates, shapes, loops/patterns, randomness, animation | `courses/coding/rayyan-coding-v4.html` | `rayyanCoding4` | ⚠️ Shipped – real demo canvases, but exercises are fill-in-the-blank (kid doesn't draw his own) |
| Buat Game-mu Sendiri 🎮 | Make Your Own Game | Game loop, sprite/input, spawning, collision, score/state | `courses/coding/rayyan-coding-v5.html` | `rayyanCoding5` | ✅ Lessons fill-in-the-blank, **PLUS a real playable "Kereta Lari" game** (🎮 Mainkan Game-mu! — canvas, jump, spawning obstacles, collision, score, game-over/restart) the kid plays & replays — the "build a game" payoff is now real |
| Robot Ahli Matematika 🤖 (Track C Bridge) | Use code to DO math | Shapes & angles, number patterns, order-of-ops, coordinates + `y=2x`, solve-for-X | `courses/coding/rayyan-bridge-v1.html` | `rayyanBridge` | ✅ Done (4 interactive canvases + Gr7-style boss + celebration animation; MC de-biased) |

→ All 5 coding rungs **+ the Track C "Bridge"** shipped & wired — **Rayyan now has 12 adventures.** v3/v5 lessons are still fill-in-the-blank but now have the **real** JS sandbox + playable game alongside them; the Bridge proves he can use code to *do* math.

### Raya's Content (younger sibling, ~3–4 years old)
- **Matematika Raya** (`courses/math/raya-math-v1.html`, key `rayaMath`) – visual, tap-to-count.
- **Belajar Bersama Raya** (`courses/learning/raya-learning-visual-v1.html`, key `rayaVisual`) – colors, shapes, animals, matching.
- **Belajar Huruf Bersama Raya 📖** (`courses/learning/raya-literacy-v1.html`, key `rayaLiteracy`) – ✅ **literacy / pre-reading** (the big peer-gap closer): Kenali Huruf (letter recognition) → Bunyi Awal (beginning sounds, 🍎→A) → Besar & Kecil (upper/lowercase drag-match) → Kata Pertama (first words, IBU→👩) → Petualangan Huruf (mixed review). 5 chapters, same Raya engine (parent read-aloud, stars, confetti, tap/drag). Wired in all 4 places (`raya.html`, `kids.html`, `auth.js`, `dashboard.html`).

> **Raya gap analysis (2026-06-04):** she was solid on early numeracy + colors/shapes/animals but had **zero literacy** — the single highest-leverage "ahead of peers" skill for a 3–4 yr old. `rayaLiteracy` closes that. Next candidate Raya courses (not built): **Logika & Pola** (patterns/sorting / what-comes-next — early reasoning) and **Lawan Kata & Dunia** (opposites, body parts, food, transport — world knowledge).

- ⚠️ `courses/learning/raya-learning-paud-v1.html` (key `rayaLearning`) is a **near-duplicate** of the visual course (same title, 4/5 same chapters) and was **never wired into `raya.html`**. The phantom `rayaLearning` key was removed from the star lists (`kids.html` / `auth.js` / `dashboard.html`) on 2026-06-04 so the data model matches Raya's 2 live courses. The paud file stays on disk – if you prefer it, swap the `rayaVisual` href in `raya.html` rather than surfacing both.

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

**Next-up recommendation (post-audit):** (a) back-port boss/sound/juice into Gr2–4 + coding v1 so the first impression isn't the weakest; (b) build Track D (streak + badges + themed map); (c) give B2 a real mini code-runner and B4 a real keepable game he can re-open.

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
- No build tools, no frameworks, no external dependencies beyond Google Fonts
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
- **Dead code:** `assets/js/sync.js` (family-code sync) duplicates `assets/js/auth.js` (the live per-kid Firestore sync) and is never initialized – safe to delete; kept for now to avoid churn.
- **Tutor name:** ✅ unified to **"Kapi"** across all math courses (Gr2–4 were "Kai"/"Nova" → now Kapi; Gr5–7 already Kapi; Gr7 keeps the "Detektif Kapi" themed variant). The internal CSS classes/ids (`kai-name`, `nova-msg`, etc.) were left as-is (not visible to Rayyan).
