# Learn with Adhi — Project Memory

## Owner
Adhi (adhiazure@gmail.com) — building this for his kids, Rayyan and Raya.

---

## The Core Mission: Rayyan's Accelerated Learning

**The goal:** Make Rayyan genuinely love and excel at both math and coding — learning 3–5 years ahead of his actual grade level.

**The constraint (critical):** Rayyan must never feel like he's doing advanced or "too hard" work. The moment he feels that, he makes excuses to stop. Every course must feel like a game or adventure, not school. Never reveal grade levels to him, never frame content as "advanced."

**Rayyan's profile:**
- Currently in **Grade 2 SD (elementary)** in Indonesia (~7–8 years old)
- Loves trains, KAI, and adventure themes
- Responds well to gamification (stars, progress bars, boss battles)
- Needs visual/interactive learning — not text-heavy

**The disguise strategy:**
- Never say "Kelas 3/4/5" in a way Rayyan sees — use adventure themes instead
- Themes per grade: KAI Train (Gr3), Space/Rocket (Gr4), Deep Ocean (Gr5), etc.
- For coding: never say "programming" or "coding" — say "mengajari robot" (teaching the robot), "membuat petualangan" (making adventures)
- Language: **Bahasa Indonesia UI + English for code/commands** (mirrors real programming, teaches tech vocabulary naturally)

---

## What's Already Built

### Math Ladder (kids.html hub)
| Course | Theme | Grade Level | Status |
|--------|-------|-------------|--------|
| Matematika Kelas 2 SD | Basic (no special theme) | Gr2 | ✅ Done |
| Matematika Kelas 3 SD 🚂 | KAI Train Adventure | Gr3 | ✅ Done |
| Matematika Kelas 4 SD 🚀 | Space/Rocket Adventure | Gr4 | ✅ Done |
| Matematika Kelas 5 SD 🌊 | Deep Ocean Adventure | Gr5 | ✅ Done |

### Raya's Content (younger sibling, ~3–4 years old)
- Raya Math PAUD (visual, tap-to-count)
- Belajar Bersama Raya (visual learning: colors, shapes, animals)

### Games
- Petualangan Kereta (choose-your-own-adventure stories)
- Kereta Rayyan: Lari Cepat! (endless runner game)
- Cari Bersama Raya (find-it / Where's Waldo style)

---

## What's Next / Roadmap

### Priority 1: Coding Curriculum for Rayyan
**"Pabrik Robot Rayyan"** — KAI Train Robot Factory theme.
- Framing: "Kamu adalah insinyur yang mengajari robot kereta cara bekerja"
- Never say coding/programming to Rayyan
- Language: Indonesian UI + English code commands
- 6 chapters mapping to real CS concepts (hidden from Rayyan):

| Chapter (what Rayyan sees) | Actual CS concept |
|---|---|
| 1. Perintah Berurutan (Ordered Commands) | Algorithms / Sequencing |
| 2. Kalau… Maka… (If… Then…) | Conditionals |
| 3. Ulangi Terus (Keep Repeating) | Loops |
| 4. Kotak Memori (Memory Box) | Variables |
| 5. Resep Rahasia (Secret Recipe) | Functions/Procedures |
| 6. Boss Battle: Buat Mini-Game! | Integration project |

- Interactive: drag-and-drop or click-to-build commands, visual output
- Progress: same stars + localStorage system as math courses

### Priority 2: Grade 6 Math
Complete the primary school math ladder.
- Theme: TBD (maybe city-building / Feifelusia tie-in?)
- Topics: ratios, introduction to pre-algebra, geometry advanced, data/statistics

### Priority 3: Math + Coding Bridge
After both ladders exist, create a "crossover" where Rayyan uses code to solve math problems (e.g., "program the robot to calculate this pattern").

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
- Always keep the "disguise" intact — no grade numbers visible to Rayyan in the adventure courses
- The math and coding ladder should feel like ONE continuous adventure world, not separate subjects
- Raya is younger (PAUD) — her content is visual-only, minimal reading, tap/drag interactions
- When adding a new course, also update `kids.html` COURSES or GAMES array and `assets/courses.json` if it's an adult course
