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
| Petualangan Angka | Basic (no special theme) | Gr2 | `courses/math/rayyan-math-grade2-v1.html` | `rayyanMath` | ✅ Done |
| Petualangan KAI 🚂 | KAI Train Adventure | Gr3 | `courses/math/rayyan-math-grade3.html` | `rayyanMath3` | ✅ Done |
| Petualangan Antariksa 🚀 | Space/Rocket Adventure | Gr4 | `courses/math/rayyan-math-grade4.html` | `rayyanMath4` | ✅ Done |
| Laut Dalam 🌊 | Deep Ocean Adventure | Gr5 | `courses/math/rayyan-math-grade5.html` | `rayyanMath5` | ✅ Done |

→ Math ladder already reaches **Gr5 = ~3 years ahead** of his Gr2 placement.

### Coding Ladder (`rayyan.html` hub)
| Course (what Rayyan sees) | Theme | Hidden Concepts | File | Key | Status |
|---|---|---|---|---|---|
| Pabrik Robot KAI 🤖 | Train Robot Factory | Sequencing → Conditionals → Loops → Variables → Functions → Integration | `courses/coding/rayyan-coding-v1.html` | `rayyanCoding` | ✅ Done (6 ch) |

→ Coding foundations done (≈ Scratch/blocks level). This was old "Priority 1" – now shipped.

### Raya's Content (younger sibling, ~3–4 years old)
- Raya Math PAUD (visual, tap-to-count)
- Belajar Bersama Raya (visual learning: colors, shapes, animals)

### Games
- Petualangan Kereta (choose-your-own-adventure stories)
- Kereta Rayyan: Lari Cepat! (endless runner game)
- Cari Bersama Raya (find-it / Where's Waldo style)

---

## The Build Plan – Roadmap to "3–5 Years Ahead"

This is the master plan for which courses to build so Rayyan hits the goal: genuinely
loving + excelling at **both** math and coding, ~5 years ahead, with the disguise intact.

### Gap analysis – where he is vs. the target
- **Math:** ladder reaches **Gr5** (≈3 yrs ahead). Target is **Gr7 (SMP) – real algebra (≈5 yrs ahead)**. → 2 rungs left: **Gr6, Gr7**.
- **Coding:** foundations done (blocks: sequence→functions). Target is **typing real code + building his own game**. → 4 rungs left (+1 stretch).
- **Bridge:** not started. The math×coding crossover that proves he can *use* code to *do* math.
- **"Love it" layer:** the engagement/retention systems that make him come back voluntarily – the part that actually decides whether the goal is reached.

The content alone is ~half the job. A kid only gets 5 years ahead if he keeps showing up,
so the engagement layer (Track D) is a first-class deliverable, not polish.

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

### Suggested build order (phases)
1. **Phase 1 – finish the in-progress ladders:** A1 (Gr6 City) · B1 (Robot Antariksa).
2. **Phase 2 – the two big leaps:** A2 (Gr7 Lab Misteri X – algebra) · B2 (Mantra Kode – real typed JS).
3. **Phase 3 – make it real & joyful:** B3 (creative coding) · B4 (build a game) · C (the Bridge).
4. **Phase 4 – love/retention layer (start early, run ongoing):** unified map, daily quest/streak, badges, Flash Drills.
5. **Phase 5 – stretch:** B5 (Python) · Gr8 math.

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
- **Wiring a new Rayyan (kids) course:** update the `ADVENTURES`/`GAMES` array in `rayyan.html`, add its key to `sumStars([...])` in `kids.html`, and bump the count pills in both. (For *adult* courses instead, update `index.html` / `assets/courses.json`.)
