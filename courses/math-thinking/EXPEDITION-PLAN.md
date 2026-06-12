# The Proof Expedition — Series Build Plan (Expeditions 2–8)

**Audience of this doc:** any AI coding agent (Codex / Claude / etc.) or human continuing the series.
**Status:** Expedition 1 + Base Camp are SHIPPED. This plan specifies Expeditions 2–8 in enough
detail to build each one without re-deriving decisions.

---

## 0. Context — what this series is

We are converting the free 698-page book **"Everything You Always Wanted To Know About
Mathematics (*But didn't even know to ask)"** by Brendan W. Sullivan with John Mackey (CMU, 2013)
— located at **`dropzone/bws_book.pdf`** in this repo — into a series of fun, visual,
interactive single-file HTML courses for adults on learnwithadhi.com.

**Framing:** one mountain, 8 expeditions (one per book chapter). Each expedition is a
single scrollytelling HTML page made of "trail days" (sections). Each day = distilled
teaching prose + at least one **hands-on lab** (interactive widget) + a **checkpoint**
(quiz with explanation) + a **stamp button**. Stamping all days triggers confetti and
marks the course complete.

**Already shipped (use as reference implementations):**

| File | What it is |
|---|---|
| `courses/math-thinking/expedition-1-truth-v1.html` | **THE TEMPLATE.** Expedition 1 (book ch. 1), 7 days. Copy its CSS + shell JS verbatim for new expeditions. |
| `courses/math-thinking/expedition-basecamp.html` | Series hub / route map. Reads each expedition's localStorage key to show progress. |
| `courses/math-thinking/proof-expedition-v1.html` | The original 1-page "Highlights Trek" (whole book in 8 camps). Linked from Base Camp. Don't modify. |

**Chapter → page map of the PDF (printed page = PDF index + 1):**

| Book chapter | Printed pages | Expedition |
|---|---|---|
| 1 What Is Mathematics? | 13–100 | E1 ✅ shipped |
| 2 Mathematical Induction: "And so on…" | 101–148 | E2 |
| 3 Sets: Mathematical Foundations | 149–214 | E3 |
| 4 Logic: The Mathematical Language | 215–320 | E4 (biggest chapter — 8 days) |
| 5 Rigorous Mathematical Induction | 321–376 | E5 |
| 6 Relations and Modular Arithmetic | 377–466 | E6 |
| 7 Functions and Cardinality | 467–566 | E7 |
| 8 Combinatorics: Counting Stuff | 567–670 | E8 |

**Source-mining workflow:** extract chapter text with `pypdf`
(`pip install pypdf cffi`), e.g.:

```python
from pypdf import PdfReader
r = PdfReader('dropzone/bws_book.pdf')
text = "\n".join((r.pages[i].extract_text() or "") for i in range(100, 148))  # ch.2
```

Read the chapter's section headers and worked examples BEFORE writing a day's content;
the book is witty and example-driven — steal its best examples (and credit nothing;
it's the course's official companion text). Each expedition's summit section must link
to the chapter's page range in the PDF and to `expedition-basecamp.html`.

---

## 1. Hard conventions (apply to every expedition — DO NOT deviate)

### 1.1 File & naming
- One self-contained HTML file: `courses/math-thinking/expedition-<N>-<slug>-v1.html`
  - E2 `expedition-2-induction-v1.html` · E3 `expedition-3-sets-v1.html` ·
    E4 `expedition-4-logic-v1.html` · E5 `expedition-5-strong-induction-v1.html` ·
    E6 `expedition-6-relations-v1.html` · E7 `expedition-7-infinity-v1.html` ·
    E8 `expedition-8-counting-v1.html`
- Pure HTML/CSS/vanilla JS. No frameworks, no build step, no runtime network calls
  (Google Fonts is the only allowed external resource).
- `<html lang="en" data-course-id="proof-expedition-<N>">` — the id powers the site-wide
  "✓ Read" pill via `assets/js/progress.js` (include it with
  `<script src="../../assets/js/progress.js" defer></script>` before `</body>`).

### 1.2 Shell (copy from expedition-1 file)
Copy these blocks verbatim from `expedition-1-truth-v1.html` and adapt only the data:
- the **CSS** `<style>` block (tokens, hero, trail, passport, camp, lab, checkpoint,
  stamp, summit styles) — change only the per-day `--cN` accent palette if desired;
- the **shell JS**: `DAYS` array, stamps/localStorage, trail scrollspy
  (IntersectionObserver), passport show-on-scroll, checkpoint quiz handler,
  `confettiBurst()`.

Per-expedition substitutions:
- `DAYS` array — one entry per day: `['dayN','<emoji>','D<N> <short label>']`.
- localStorage key: **`lwa:expedition<N>`** (array of stamped day indices). The Base Camp
  hub already expects these exact keys and day counts — see §3.
- On all-days-stamped: add `proof-expedition-<N>` to the `lwa:completed` array (same
  code as E1), call `confettiBurst()`.

### 1.3 Page anatomy (per expedition)
1. **Hero** (dark): eyebrow links back to `expedition-basecamp.html`
   (`⛺ Base Camp · Expedition N of 8 · book chapter N (pages X–Y)`), big two-line title,
   1-sentence promise, CTA `🥾 Start Day 1`.
2. **Days** (`<section class="camp" id="dayN" style="--cc:var(--cX)">`): alternate
   `camp`/`camp alt` backgrounds. Each day:
   - watermark `D<N>`, badge w/ emoji flag + meta (`Day N · §x.y <book section name>` +
     one-line "what this day is about"),
   - title with one `<em>` accent word, lede,
   - 2–5 short teaching paragraphs (distilled from the book — write fresh prose, never
     paste the book's text verbatim beyond a quoted sentence),
   - ≥1 **lab** (`.lab` box) — see per-expedition specs in §2; labs must work with
     mouse AND touch, and never depend on network,
   - optionally a `.field-note` (boxed aside: a proof sketch, a historical anecdote,
     a warning),
   - exactly 1–3 **checkpoints** (`.checkpoint[data-quiz]`, 3 options, `data-ok="1"`
     marks the right one, `.cp-expl` explains WHY — the explanation teaches, it never
     just says "correct"),
   - **stamp row** with `data-stamp="<dayIndex>"` button + `next-link` anchor teaser.
3. **Summit** (dark): eyebrow shows `EXPEDITION N · k / D DAYS LOGGED`, congratulation
   copy naming the skills gained, **a teaser for the next expedition**, two
   `.book-card` links (Base Camp + the chapter's PDF pages), confetti canvas.

### 1.4 Voice & quality bar
- Tone: enthusiastic field-guide. Short sentences. Concrete before abstract. Jokes
  allowed, hand-waving not.
- Every abstract claim gets either a lab, a picture, or a worked micro-example.
- Math notation: use Unicode (∀ ∃ ∈ ⇒ ℕ ℤ ℚ ℝ ∎ ≡ ∘ ⌈⌉) — NO LaTeX/MathJax.
- Labs are the soul: prefer **manipulate-and-see** over watch-an-animation. A lab the
  learner can "lose" (Ramsey game) or "break" (Euler formula) teaches best.
- Verify before shipping: `node --check` the inline JS (extract `<script>` blocks),
  `python3 -c "import json;json.load(open('assets/courses.json'))"` after manifest edits,
  click-test every lab mentally for edge cases (slider extremes, double-clicks,
  re-entry after stamping).

### 1.5 Wiring checklist (every expedition, same commit)
1. `assets/courses.json` — add an entry (see the `proof-expedition-1` entry's shape):
   `id: "proof-expedition-<N>"`, `category: "Foundations"`, `n`: next free number,
   `tags: ["Beginner","Math","Interactive"]`, `path`, `duration: "~2 days"`.
2. `sitemap.xml` — add the page with today's lastmod.
3. `expedition-basecamp.html` — in the `EXPS` array, add `href:'expedition-<N>-….html'`
   to the matching entry (the day count is already correct there; if you change a day
   count, update it in BOTH files).
4. The PREVIOUS expedition's summit teaser — make its "next trail" line link to the new file.
5. `PROGRESS.md` — dated entry: what shipped, files touched, what's next.
6. Commit + push (small, descriptive message). One expedition per commit.

---

## 2. Per-expedition specifications

> Day splits below follow the book's own section structure. "Lab" entries are REQUIRED;
> "stretch" labs are optional if effort allows. Mine each chapter's *Questions & Exercises*
> blocks for checkpoint material.

### EXPEDITION 2 — "And So On…" (Induction) · ch. 2, pp. 101–148 · 6 days · key `lwa:expedition2`

The chapter is *informal* induction — intuition first (rigor returns in E5). Day plan:

- **D1 · Sums and patterns (§2.1–2.2).** The 1+2+⋯+n story retold as "noticing → conjecturing
  → proving". LAB **"Conjecture machine"**: show sums of consecutive odd numbers
  (1, 1+3, 1+3+5, …) as a growing square grid; learner slides n and is asked to GUESS the
  formula before a reveal button confirms 1+3+⋯+(2n−1)=n² with an L-shaped-layers
  visual. Checkpoint: guess the next pattern (sum of first n cubes is a square).
- **D2 · Lines on the plane (§2.2.2).** How many regions do n lines cut the plane into?
  LAB **"Plane slicer"**: SVG canvas; button "add a line" drops a random non-parallel,
  non-concurrent line, region count updates (formula 1+n(n+1)/2); table of values
  builds up alongside. Teach: find the RECURRENCE (each new line adds n regions) —
  that's the inductive step in disguise.
- **D3 · Defining induction: the domino analogy (§2.3).** Formal statement of the two
  ingredients (base case, inductive step) with the book's other analogies (ladders,
  chain letters). LAB: reuse/adapt E1-style domino run BUT with controls to toggle
  "base case proven" and "step proven" independently — 4 combinations, learner predicts
  which topple everything. Checkpoint on the k≥5 broken-chain trap.
- **D4 · Dominoes & tilings (§2.4.1).** Can a 2×n board be tiled by dominoes? How many
  ways? (Fibonacci!) LAB **"Tiling counter"**: render all tilings of 2×n for n=1..6 as
  little colored brick diagrams; count badge shows 1,2,3,5,8,13 and asks the learner to
  name the sequence. Field note: why the recurrence f(n)=f(n−1)+f(n−2) (last tile is
  vertical or two horizontals).
- **D5 · Winning strategies (§2.4.2).** Nim-style takeaway game: 21 stones, take 1–3,
  last stone wins. LAB **"Beat the robot"**: playable game vs an AI that plays the
  winning strategy (leave multiples of 4); learner discovers they can only win by
  moving first to a multiple of 4. Reveal: the strategy is proven by induction on
  "positions ≡ 0 mod 4 are losing". Checkpoint: which starting counts are winnable?
- **D6 · SUMMIT: Tower of Hanoi + recursion (§2.5).** LAB **"Hanoi machine"**: playable
  3-peg Hanoi with 3–6 discs (drag or click-to-move), move counter vs optimal 2ⁿ−1;
  "auto-solve" button animates the recursive solution. Tie-in: recursion = induction
  running forwards; the monks-moving-64-discs end-of-the-world legend (585 billion
  years) as the closing wow. Teaser → E3.

### EXPEDITION 3 — Sets · ch. 3, pp. 149–214 · 6 days · key `lwa:expedition3`

- **D1 · What's a set (§3.2–3.3).** Roster vs set-builder notation; ∈, ⊆, ∅, the
  difference between ∈ and ⊆ (the classic trap). LAB **"Set-builder translator"**:
  buttons toggle between `{2,4,6,8,…}` and `{x ∈ ℕ : x even}` style for ~6 sets; then a
  matching mini-game (drag descriptions onto rosters). Checkpoint: is ∅ ∈ {∅}? is ∅ ⊆ X?
- **D2 · Subsets & power sets (§3.4).** LAB **"Power-set explorer"**: pick elements of a
  3–4 element set with checkboxes; every subset you've discovered gets logged into a
  growing 2ⁿ tree/lattice diagram; counter shows 2ⁿ goal. Field note: why 2ⁿ
  (each element: in or out → product rule preview).
- **D3 · Set operations & algebra (§3.5).** Union/intersection/difference/complement +
  De Morgan's laws. LAB **"De Morgan verifier"**: interactive 2-circle Venn where the
  learner SHADES regions by clicking; two target expressions ((A∪B)ᶜ and Aᶜ∩Bᶜ) — shade
  both, see they're identical. (Reuse E1/Highlights Venn rendering code as a base.)
- **D4 · Indexed sets & partitions (§3.6).** Big unions/intersections over families.
  LAB **"Interval squeezer"**: visualize ⋂ₙ (0, 1/n) shrinking to ∅ and ⋃ₙ [1/n, 1]
  growing to (0,1] on an animated number line with an n slider. Checkpoint: partition
  or not (given 3 candidate splittings of {1..10}).
- **D5 · Cartesian products (§3.7).** LAB **"Product grid"**: choose |A| and |B| with
  sliders; A×B renders as a grid of ordered pairs; show (a,b) ≠ (b,a); |A×B|=|A||B|.
  Tie to coordinates: ℝ×ℝ is the plane they've known all along.
- **D6 · SUMMIT: building ℕ from nothing (§3.8).** The von Neumann construction:
  0=∅, 1={0}, 2={0,1}… LAB **"Number forge"**: a button repeatedly applies
  S(n) = n ∪ {n}, rendering each number as nested boxes (literal boxes-in-boxes
  visual, depth-limited to 5). Punchline: arithmetic stands on bags of nothing.
  Teaser → E4 (the language to talk about all of it precisely).

### EXPEDITION 4 — Logic · ch. 4, pp. 215–320 · **8 days** · key `lwa:expedition4`

The longest chapter and the book's engine room. This expedition may exceed the others
in length — that's fine.

- **D1 · Statements vs non-statements (§4.2–4.3).** What counts as a mathematical
  statement; variables & truth depends on context. LAB **"Statement sorter"**: ~10 cards
  ("x+2", "3 is odd", "this sentence is false", "every even ≥4 is a sum of 2 primes"…)
  to sort into Statement / Not — instant feedback with reasons.
- **D2 · Quantifiers (§4.4).** ∀ and ∃; domains matter; the Law of the Excluded Middle.
  LAB **"Quantifier hunter"**: a 6×6 dot grid with colored dots; claims like
  "∀ row ∃ a red dot" / "∃ column: all dots blue" — learner clicks TRUE/FALSE, the
  witnessing row/column/dot highlights to explain. Multiple rounds with regenerated grids.
- **D3 · Nested quantifiers — order matters (§4.4 cont.).** "∀x ∃y: y loves x" vs
  "∃y ∀x: y loves x". LAB: same grid engine, now with two-quantifier claims
  ("∀ row ∃ column such that…" vs "∃ column ∀ row…") where one is true and the
  swapped version false on the same grid. This is THE lab of the expedition — make it solid.
- **D4 · Connectives & truth tables (§4.5).** ∧ ∨ ¬ → ↔ formally. LAB **"Truth-table
  builder"**: learner FILLS IN an empty truth table for a compound expression (e.g.
  ¬P ∨ Q) by clicking T/F cells; check button grades it; 3 expressions of rising
  difficulty. (The Highlights Trek shows a passive table — this one the learner builds.)
- **D5 · Negation machine (§4.6 area).** Negating quantified statements mechanically:
  ¬∀ → ∃¬, ¬∃ → ∀¬, ¬(P→Q) = P∧¬Q. LAB **"Negation forge"**: step-by-step — given
  "∀x ∃y: P(x,y) → Q(y)", repeatedly click the outermost symbol to push ¬ inward,
  watching the formula rewrite until ¬ sits on atoms. Checkpoint: negate "every student
  passed some exam".
- **D6 · Logical equivalence & set duality (§4.6–4.7).** Tautologies, contrapositive ≡,
  De Morgan in logic mirroring E3-D3's sets. LAB **"Equivalence tester"**: pick two
  formulas from dropdowns, auto-generated side-by-side truth tables highlight matching/
  mismatching rows.
- **D7 · Proof strategies, formally (§4.8–4.9).** Direct, contrapositive, contradiction,
  cases — now justified BY the truth tables of D4–D6. LAB: expanded "strategy picker"
  (6 claims, 4 tools — upgrade of the Highlights version); each answer links the choice
  back to the relevant equivalence.
- **D8 · SUMMIT: read a real proof.** A complete short proof (e.g. "if n² is even then
  n is even", then "√2 irrational" revisited with full logical annotation). LAB
  **"Proof X-ray"**: the proof text with every step clickable — clicking reveals WHICH
  rule justified it (definition / contrapositive / algebra / contradiction). Closing:
  you can now READ the book's remaining 350 pages. Teaser → E5.

### EXPEDITION 5 — Rigorous Induction · ch. 5, pp. 321–376 · 6 days · key `lwa:expedition5`

- **D1 · Induction restated with logic (§5.1–5.2).** The principle as a formal
  implication; template for writing an induction proof. LAB **"Proof skeleton"**:
  drag-order the 5 parts of an induction proof (claim, base, hypothesis, step,
  conclusion) into the right order; then fill 2 blanks in a worked sum proof.
- **D2 · Other base cases & directions (§5.3).** Starting at n=4 (e.g. 2ⁿ < n!),
  backwards induction, evens/odds. LAB **"Domino playground v2"**: number line of
  dominoes where the learner chooses base case position and step size (+1, +2, −1);
  shows exactly which integers get proven. Checkpoint: which set does base=2 &
  step "+2" cover?
- **D3 · Strong induction (§5.4).** Why "all previous dominoes" sometimes needed.
  LAB **"Fundamental theorem factor tree"**: type any n ≤ 1000, watch it split into a
  prime factor tree — narration shows the strong-induction skeleton (n is prime, or
  n = a·b with both SMALLER → use the hypothesis on each).
- **D4 · Minimal criminal (§5.5).** Well-ordering: every nonempty set of naturals has a
  least element; proofs by "smallest counterexample". LAB **"Criminal hunt"**: the
  4¢/5¢-stamp style problem — a grid of n values 1..40 colored by "makeable/not";
  learner clicks the SMALLEST red cell, then walks the contradiction (if k is the
  least criminal, k−4 was makeable…).
- **D5 · Induction in the wild (§5.4.4 examples).** Fibonacci facts (e.g. F(n) < 2ⁿ),
  inequality proofs. LAB **"Fibonacci microscope"**: bar race of F(n) vs 2ⁿ on a log
  scale with n slider; plus the golden-ratio convergence F(n+1)/F(n) readout.
- **D6 · SUMMIT: the false-proof gallery.** Three induction "proofs" that all horses are
  the same color / everyone is the same age etc. LAB **"Spot the broken step"**: for
  each, click the line where the induction fails (the n=1→2 gap). Cements everything.
  Teaser → E6.

### EXPEDITION 6 — Relations & Modular Arithmetic · ch. 6, pp. 377–466 · 6 days · key `lwa:expedition6`

- **D1 · Relations as sets of pairs (§6.2).** R ⊆ A×A; visualizing as arrows and as a
  grid. LAB **"Relation grid"**: 5×5 clickable matrix for a relation on {1..5}; toggling
  cells draws/removes arrows on a node diagram live (two views, one object).
- **D2 · Properties (§6.3).** Reflexive/symmetric/transitive (+anti-symmetric). LAB:
  same grid engine with live property badges that light up/break as the learner edits
  the relation; 4 challenge rounds ("build a relation that is symmetric but NOT
  transitive", etc. — the lab verifies).
- **D3 · Equivalence relations & partitions (§6.4).** The big theorem: equivalence
  relation ⟺ partition. LAB **"Class sorter"**: 12 emoji items, learner picks a rule
  (same color / same animal-vs-vehicle / same first letter) and the items physically
  regroup into class buckets; then the reverse — given buckets, the grid fills itself.
- **D4 · Modular arithmetic (§6.5).** ≡ (mod n) as an equivalence relation; ℤₙ. LAB:
  the modular clock (port from Highlights Trek) UPGRADED with multiplication
  (a×b mod n walks the trail b times) and a ℤₙ addition table that the learner can
  generate for any n ≤ 12, with rows highlighting on hover.
- **D5 · Divisibility magic (§6.5.4).** Casting out nines: why digit sums detect
  divisibility by 9 and 3. LAB **"Nine detector"**: type any big number; animated
  digit-sum cascade (4839 → 24 → 6) with the mod-9 explanation; plus the
  check-digit-on-your-credit-card field note (Luhn as mod-10 flavor).
- **D6 · SUMMIT: ISBN forensics.** Real-world payoff: ISBN-10 check digits (mod 11).
  LAB **"Book detective"**: validate/repair an ISBN with one smudged digit — solve for
  the unknown digit using mod-11 arithmetic. (Secretly: solving linear congruences.)
  Teaser → E7.

### EXPEDITION 7 — Functions & Infinity · ch. 7, pp. 467–566 · 7 days · key `lwa:expedition7`

- **D1 · Functions properly defined (§7.2).** Domain/codomain/rule; functions as subsets
  of A×B; well-defined-ness. LAB **"Function or not"**: 6 arrow diagrams — learner marks
  each Function / Not (one input → two outputs; an input with no output…), with reasons.
- **D2 · Images & preimages (§7.3 area).** LAB **"Image projector"**: f(x)=x² on a
  two-number-line diagram; drag an interval on the domain line, watch its image appear
  on the codomain line; then drag on the codomain to see preimages (two branches!).
- **D3 · Injective / surjective / bijective (§7.4).** The three properties as
  "no collisions / no misses / perfect pairing". LAB **"Matchmaker"**: drag arrows from
  4 dots to 4 dots; live badges (injective? surjective?) update; challenge rounds
  ("make a function that's injective but not surjective" with |B|=5, etc.).
- **D4 · Composition & inverses (§7.5).** g∘f, when inverses exist (= bijection). LAB
  **"Pipeline"**: two machines in series with editable mappings; feed inputs through,
  see why a non-injective first stage destroys invertibility.
- **D5 · Cardinality & countability (§7.6–7.7).** Same-size = bijection; ℕ ~ evens ~ ℤ.
  LAB: Hilbert's Hotel ported from the Highlights Trek PLUS a third scenario:
  interleaving ℤ (…−2,−1,0,1,2… → one list) shown as a zigzag walk animation.
- **D6 · ℚ is countable (§7.7 cont.).** LAB **"The snake"**: the classic diagonal
  zigzag through the positive-rationals grid, animated step by step with a counter
  (skipping duplicates like 2/2 shown greyed). The learner advances it and watches
  every fraction get a number.
- **D7 · SUMMIT: Cantor's diagonal (§7.8 area).** LAB **"Diagonal saboteur"**: a mock
  "complete list" of 8 binary decimals; the learner builds the saboteur number by
  clicking each diagonal digit to flip it, then a search proves it's nowhere in the
  list; narration scales the argument to infinity. Closing: ℝ is uncountable, infinity
  has sizes, and you PROVED it. Teaser → E8.

### EXPEDITION 8 — Combinatorics · ch. 8, pp. 567–670 · 7 days · key `lwa:expedition8`

- **D1 · Sum & product rules (§8.2.1–8.2.2).** LAB **"Outfit counter"**: pick numbers of
  shirts/pants/shoes with steppers; a live tree diagram grows and the product updates;
  then a menu-choice example for the sum rule (choose pasta OR pizza).
- **D2 · Permutations & factorials (§8.2.3).** LAB **"Lineup machine"**: 4 emoji friends;
  generate-all button renders all 24 orderings in a grid; n! growth meter shows why 10!
  already exceeds 3.6M (with a "seconds to brute-force" readout).
- **D3 · Combinations (§8.2.3 cont.).** Teams vs lineups; C(n,k)=n!/(k!(n−k)!). LAB
  **"Team picker"**: choose 3 of 6 emoji people by clicking; every distinct TEAM gets
  logged once even if picked in a different order — the learner literally watches 120
  ordered picks collapse into 20 teams (÷3!).
- **D4 · Pascal & binomial theorem (§8.4 area).** Port the clickable Pascal triangle
  from the Highlights Trek; ADD the binomial payoff: a slider n=1..6 expands (x+y)ⁿ
  with coefficients lighting up the matching triangle row.
- **D5 · Counting arguments: poker (§8.3).** LAB **"Hand calculator"**: pick a hand type
  (pair / two pair / flush / full house / straight); the lab walks the counting recipe
  step-by-step (choose ranks → choose suits → multiply), assembling the formula with
  animated card graphics and the final probability.
- **D6 · Inclusion–exclusion (§8.5 area).** LAB **"Overlap auditor"**: 3-circle Venn
  with editable region counts; question "how many students take ≥1 subject?" — naive
  sum double-counts (shown in red), |A|+|B|+|C|−pairs+triple corrects it live.
- **D7 · SUMMIT: pigeonhole (§8.6 area).** The principle that closed E1's Ramsey proof —
  full circle. LAB **"Pigeon launcher"**: n pigeons into k holes animation; slider past
  n=k forces a doubled hole, always; then the two famous corollaries as field notes
  (two Londoners with the same hair count; same-birthday bounds). SERIES FINALE: summit
  copy celebrates completing the whole book; link back to Base Camp (which auto-detects
  8/8 and stamps `proof-expedition-series` complete).

---

## 3. Base Camp integration (already wired — just flip switches)

`expedition-basecamp.html` contains the `EXPS` array with all 8 expeditions, their
day counts (E1:7, E2:6, E3:6, E4:8, E5:6, E6:6, E7:7, E8:7) and localStorage keys.
When an expedition ships, add its `href` to its entry — the card flips from
"Route being mapped…" to "Route open", and progress bars work automatically.
**If you change a day count, change it in both the expedition file's `DAYS` array and
the Base Camp `EXPS` entry.**

## 4. Build order & cadence

Ship **one expedition per session/PR**, in numeric order (each summit teases the next).
E4 (logic) is double-length; consider splitting across two sessions but ship as one file.

## 5. QA checklist before each commit

- [ ] `node --check` passes on extracted inline JS
- [ ] every lab interacted with at slider extremes / repeated clicks
- [ ] all `data-stamp` indices unique & sequential from 0; passport grid columns = day count
- [ ] checkpoint `data-ok` marks exactly one right answer per quiz; explanation teaches
- [ ] hero back-link, summit Base-Camp link, PDF link (`../../dropzone/bws_book.pdf`) work
- [ ] manifest JSON valid; sitemap updated; Base Camp `href` flipped; previous summit teaser linked
- [ ] `PROGRESS.md` entry written
