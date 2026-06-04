# Learn with Adhi – Project Memory

## Owner
Adhi (adhiazure@gmail.com) – building this for his kids, Rayyan and Raya.

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
| Petualangan Angka | Basic (no special theme) | Gr2 | `courses/math/rayyan-math-grade2-v1.html` | `rayyanMath` | ✅ Done (basic engine – no boss) |
| Petualangan KAI 🚂 | KAI Train Adventure | Gr3 | `courses/math/rayyan-math-grade3.html` | `rayyanMath3` | ✅ Done (basic engine – no boss) |
| Petualangan Antariksa 🚀 | Space/Rocket Adventure | Gr4 | `courses/math/rayyan-math-grade4.html` | `rayyanMath4` | ✅ Done (basic engine – no boss) |
| Laut Dalam 🌊 | Deep Ocean Adventure | Gr5 | `courses/math/rayyan-math-grade5.html` | `rayyanMath5` | ✅ Done (full boss + sound + rich interactions) |
| Kota Masa Depan 🏙️ | Future City builder | Gr6 | `courses/math/rayyan-math-grade6.html` | `rayyanMath6` | ✅ Done (full boss) |
| Lab Misteri X 🧪 | Mystery Lab (find the unknown X) | Gr7 | `courses/math/rayyan-math-grade7.html` | `rayyanMath7` | ✅ Done – **5-yrs-ahead algebra capstone** |

→ Math ladder now reaches **Gr7 = ~5 years ahead** (real algebra), fully disguised. **Math content target MET.**
→ ⚠️ Note (2026-06-04 audit): Gr2–4 use the *old basic engine* (MC/input only, no boss/sound) while Gr5–7 have the rich boss-battle engine. The courses he plays **first** are the least engaging – back-port the boss engine to Gr2–4.

### Coding Ladder (`rayyan.html` hub)
| Course (what Rayyan sees) | Theme | Hidden Concepts | File | Key | Status |
|---|---|---|---|---|---|
| Pabrik Robot KAI 🤖 | Train Robot Factory | Sequencing → Conditionals → Loops → Variables → Functions → Integration | `courses/coding/rayyan-coding-v1.html` | `rayyanCoding` | ✅ Done (drag-blocks; boss is label-only, no battle engine) |
| Robot Antariksa 🛰️ | Space Robots | Events, lists/arrays, nested loops, boolean logic, integration | `courses/coding/rayyan-coding-v2.html` | `rayyanCoding2` | ✅ Done (blocks + full boss) |
| Mantra Kode ✨ | Code Spells | `console.log`, variables, if/else, loops, functions | `courses/coding/rayyan-coding-v3.html` | `rayyanCoding3` | ⚠️ Shipped as **fill-in-the-blank** – output is pre-canned, code is NOT executed |
| Studio Pelukis Kode 🎨 | Code Painter (Canvas) | Coordinates, shapes, loops/patterns, randomness, animation | `courses/coding/rayyan-coding-v4.html` | `rayyanCoding4` | ⚠️ Shipped – real demo canvases, but exercises are fill-in-the-blank (kid doesn't draw his own) |
| Buat Game-mu Sendiri 🎮 | Make Your Own Game | Game loop, sprite/input, spawning, collision, score/state | `courses/coding/rayyan-coding-v5.html` | `rayyanCoding5` | ⚠️ Shipped – teaches game-loop via fill-in-the-blank; **kid does NOT end with a playable game he keeps** |

→ All 5 coding rungs shipped & wired. **Caveat (2026-06-04 audit):** v3/v4/v5 teach via fill-in-the-blank with pre-canned output, so the headline payoffs – "type real code" (B2) and "publish your own game" (B4) – are **simulated, not real**. See Track B notes + gap analysis.

### Raya's Content (younger sibling, ~3–4 years old)
- **Matematika Raya** (`courses/math/raya-math-v1.html`, key `rayaMath`) – visual, tap-to-count.
- **Belajar Bersama Raya** (`courses/learning/raya-learning-visual-v1.html`, key `rayaVisual`) – colors, shapes, animals, matching.
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
- **Coding:** ⚠️ all 5 rungs shipped *structurally*, but v3 ("type real code") and v5 ("build your game") are **faked with fill-in-the-blank** – no live code execution, no playable game the kid keeps. The two headline payoffs aren't real yet.
- **Bridge:** not started. The math×coding crossover that proves he can *use* code to *do* math.
- **"Love it" layer (Track D):** ❌ ~10–15% built. Confetti + per-course boss battles exist; **no streak, no daily quest, no badges/certificate, no Flash Drills, no themed world map.** This is the biggest gap and the thing that actually decides whether he reaches 5-years-ahead.

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

### TRACK C – The Bridge: "Robot Ahli Matematika" 🤖➗
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
2. ⚠️ **Phase 2 – the two big leaps:** A2 (Gr7 algebra) **DONE & solid** · B2 (Mantra Kode) **shipped but faked** – still needs a real (safe) JS sandbox so he actually types & runs code.
3. ⚠️ **Phase 3 – make it real & joyful:** B3 ✅ shipped · B4 (build a game) **shipped but no kept playable game** · C (the Bridge) **not started**.
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
- **2026-06-04 audit:** all 11 Rayyan adventures + 2 Raya courses are shipped & wired (this doc previously under-counted them). Math answers spot-checked correct. Fixed disguise leaks: the Gr2–5 `<title>` and bug-report `courseName` no longer show "Kelas N" (theme names only). Biggest remaining gaps: the Track D retention layer, and the faked "real code"/"real game" payoffs in coding v3/v5.
- **Dead code:** `assets/js/sync.js` (family-code sync) duplicates `assets/js/auth.js` (the live per-kid Firestore sync) and is never initialized – safe to delete; kept for now to avoid churn.
- **Tutor-name drift:** the in-course guide is "Kai" (Gr2–4) → "Kapi" (Gr5–6) → "Detektif Kapi" (Gr7). Pick one identity when next touching these.
