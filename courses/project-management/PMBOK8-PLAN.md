# PMBOK 8, Field-Tested — Series Build Plan

**Audience of this doc:** any AI coding agent (Codex / Claude / etc.) or human continuing this
series. **Status:** Hub + Part 1 shipped. This plan specifies Parts 2–7 in enough detail to
build each one without re-deriving decisions. Modeled on
`courses/math-thinking/EXPEDITION-PLAN.md`, the site's precedent for a multi-file course series.

---

## 0. Context — what this series is

Adhi asked for a detailed project-management course based on "The Standard for Project
Management and A Guide to the PMBOK Guide." Research at build time (2026-08-04) found that PMI
had shipped the **8th edition** (paperback Jan 2026) and the **PMP exam aligned to it on
July 9, 2026** — weeks before this build. PMBOK 8 restructures the whole standard: 12
principles → **6**, 8 performance domains → **7**, process groups renamed to **5 Focus Areas**,
and **40 non-prescriptive processes** (down from 49). Per Adhi's decision, this series teaches
**PMBOK 8 only** — no 7th-edition crosswalk — as a **7-part series** behind a hub, **practitioner-
first but exam-aware** (PMP/CAPM formulas and scenario questions folded into the relevant
modules, not bolted on as a separate cram track).

The existing `courses/project-management/project-management-course-v1.html` ("Project
Management: A Builder's Guide", manifest id `project-management`) stays untouched as the
friendly 4-day on-ramp (predates PMBOK 8, deliberately teaches the classic 5-phase framing as a
teaching scaffold — see its own References module for that explicit caveat). This series is the
deep standard; cross-link both ways, don't merge or replace.

**PMBOK 8 structure (verified against 5+ independent sources, 2026-08-04):**

| Layer | Count | Names |
|---|---|---|
| Principles | 6 | Adopt a Holistic View · Focus on Value · Embed Quality Into Processes and Deliverables · Be an Accountable Leader · Integrate Sustainability Within All Project Areas · Build an Empowered Culture |
| Mindset dimensions (group the 6 principles) | 3 | Proactive (Holistic View, Embed Quality) · Ownership (Accountable Leader, Empowered Culture) · Value-Driven (Focus on Value, Sustainability) |
| Performance Domains | 7 | Governance · Scope · Schedule · Finance · Stakeholders · Resources · Risk |
| Focus Areas (renamed process groups) | 5 | Initiating · Planning · Executing · Monitoring & Controlling · Closing |
| Processes | 40 | Distributed across the 7 domains — see §2 below for the per-domain list used while writing |

**Already shipped (use as reference implementations):**

| File | What it is |
|---|---|
| `pmbok8-hub.html` | Series hub / route map. Reads each part's `<partId>:done` localStorage object, shows per-part + series progress, cross-links the Builder's Guide both ways. |
| `pmbok8-part1-foundations-v1.html` | **THE TEMPLATE.** Copy its CSS + JS shell verbatim for new parts — it was itself copied verbatim from `courses/project-management/project-management-course-v1.html` (the newest/most complete Adult Course Standard implementation on the site: stat cards, `ref-item`/`ref-citation`/`ref-annotation`/`ref-link`, `table.pm-table` for RACI-style tables, `.foot-nav` prev/next, inline hand-built SVG diagrams). |

**Running case study** (threads through worked examples in Parts 3–6, fully assembled as the
Part 7 capstone): **relaunching a public library as a community tech hub.** Civic, relatable,
plausible sustainability angle (ties Principle 5), and deliberately distinct from the site's
other metaphors (Builder's Guide = house; kids' courses = train/space/ocean; Perth course =
rail). Adhi can swap it freely — it's plain content, not load-bearing infrastructure.

---

## 1. Hard conventions (apply to every part — DO NOT deviate)

### 1.1 File & naming
- One self-contained HTML file per part: `courses/project-management/pmbok8-partN-<slug>-v1.html`
  - Part 2 `pmbok8-part2-principles-v1.html` · Part 3 `pmbok8-part3-governance-v1.html` ·
    Part 4 `pmbok8-part4-scope-schedule-v1.html` · Part 5 `pmbok8-part5-finance-resources-v1.html` ·
    Part 6 `pmbok8-part6-stakeholders-risk-v1.html` · Part 7 `pmbok8-part7-capstone-v1.html`
- Pure HTML/CSS/vanilla JS. No frameworks, no build step, no runtime network calls beyond
  Google Fonts (same guardrail as the rest of the site).
- `<html lang="en" data-course-id="pmbok8-partN">` — each part is its own progress namespace.
  **Not** wired into `assets/courses.json` individually — only the hub (`pmbok8-guide`) is a
  manifest entry; parts are reached via the hub, same pattern as the Proof Expedition series.

### 1.2 Shell (copy from `pmbok8-part1-foundations-v1.html`, which itself came from
`project-management-course-v1.html`)
Copy verbatim and adapt only the data:
- The full `<style>` block — sidebar, mobile header, module hero, content typography, the 5
  callout variants, stat cards, concept grid, demo boxes, `table.pm-table` + `.raci-*` classes
  (reuse for governance/RACI-style tables in later parts even where not strictly RACI — the
  table styling generalizes to any labelled-role or scored table), quiz styles, checklist,
  resources/references, foot-nav, completion banner, responsive breakpoint.
- The shell JS: `COURSE_ID`/`TOTAL` consts, `getProgress`/`saveProgress`/`markCourseComplete`,
  `renderProgress`, `goto` + `currentModule`, `setupQuizzes`, `setupChecklist`, `init()` wiring
  nav-items + done-btns + foot-nav prev/next + mobile hamburger.

Per-part substitutions:
- `COURSE_ID` = `'pmbok8-partN'`; `TOTAL` = module count (6 content modules + 1 References = 7,
  matching the existing PM course's pattern, unless a part's content genuinely needs 5 or 8 —
  stay in the 5–8 range per the Adult Course Standard).
- Sidebar nav-item list + each `<section id="module-N">` must stay in lockstep with `TOTAL`.
- Accent (`--acc`/`--acc-dim`/`--acc-bg`): keep **indigo** (`#1C5DDC`/`#1650B8`/`rgba(28,93,220,.08)`)
  across all 7 parts + hub so the series reads as one visual family (distinct from the Builder's
  Guide's mango). Vary only the `--tomato`/`--sea`/`--green`/`--mango` accents already defined
  as CSS vars for callouts/RACI tables — those stay the shared design-system tokens.

### 1.3 Page anatomy (per part)
1. **Sidebar**: logo → `../../index.html`, progress bar, one nav-item per module (last = always
   "References"), footer link back to `../../index.html`. Add a second footer-style link (or a
   line under the logo block) pointing to `pmbok8-hub.html` ("← Back to series map") — parts are
   reached through the hub, so don't strand the reader at the site root only.
2. **Modules 1..(TOTAL-1)**: full Adult Course Standard anatomy —
   eyebrow (`Module 0N / 0T`) → `h1.mod-title` with one `<span class="acc">` word → `p.mod-lede`
   (1–2 sentences) → `.mod-objectives` (3–5 bullets) → prose sections (`h2.sh`/`h3.sub`) → **at
   least one hand-built inline SVG diagram carrying real structural/quantitative info** (copy the
   coordinate-math technique from Part 1's power/interest-grid-style diagrams — no external
   image libraries) → a `.stat-row` of 3 `.stat-card`s somewhere in the part if there's a genuine
   stat to show (not mandatory every module, but at least once per part) → colour-coded callouts
   used correctly (default `--acc` = key insight, `.tomato` = warning/critical caveat, `.green` =
   positive outcome/good practice, `.blue` = factual/data point, `.mango` = nuance/"it depends") →
   an inline 3-question `.quiz-section` testing *application* (scenario-style, exam-flavored where
   natural) → `.foot-nav` (prev/next + done button).
3. **References module (module TOTAL, always last)**: `.mod-eyebrow` = `References` (no number),
   grouped `.ref-item`s under `.ref-group-label`s, each with `.ref-citation` (Chicago 17th),
   `.ref-annotation` (2–3 sentences: contribution + caveat), `.ref-link`. Close with a
   `.callout.tomato` "Data quality note" naming this part's evidence-base caveats. End with
   `#completion-banner` (hidden until all modules done) + the final `.foot-nav` (next disabled).

### 1.4 Content sourcing & accuracy
- PMBOK 8 is a paywalled PMI standard — no source PDF in this repo (checked `dropzone/`, only
  `AASBS2_09-24.pdf` and `bws_book.pdf` live there). Content is written from verified public
  reporting (PMI's own site, multiple independent PMP-prep publishers cross-checked against each
  other) plus well-established, edition-stable PM theory (project/program/portfolio/operations
  definitions, EVM formulas, network diagram mechanics, stakeholder grids, motivation theory)
  that has not changed across PMBOK editions. **Never state a specific process name, count, or
  domain assignment without it being corroborated by at least 2 independent sources** — if only
  one weak source has a claim (e.g. an exact process list within a domain), hedge the phrasing
  ("PMI groups roughly N processes under Scope, including...") rather than presenting an
  uncertain enumeration as gospel.
- The References module for each part must cite real, verifiable sources: PMI's own PMBOK 8
  product/standards pages, the Agile Manifesto / Scrum Guide (stable canonical sources, reused
  from the Builder's Guide's reference list where relevant), and reputable PMP-prep publishers
  for the 7→8 structural change reporting — annotated honestly, the same way the Builder's Guide
  annotates the CHAOS Report controversy.

### 1.5 Voice & quality bar
- Same as the Adult Course Standard in `/CLAUDE.md`: warm but direct, first-person plural, no
  corporate hedging, teach the real thing not a watered-down version, every concept needs a "so
  what," 8–15 minutes of reading per module.
- Exam-aware ≠ exam-obsessed: formulas (EVM: CPI/SPI/EAC/ETC/CV/SV, PERT, EMV) and ECO mapping
  belong inside the module where the concept naturally lives (Finance & Resources for EVM,
  Stakeholders & Risk for EMV/decision trees), framed as "here's the practitioner tool, and yes,
  it's tested" — not a separate drill section bolted onto the end of every part. Part 7 is where
  exam mechanics (situational-question technique, ECO task mapping, a comprehensive scenario
  review) get their own dedicated space.
- Keep the running case (library relaunch) present in Parts 3–6's demo boxes/worked examples so
  the series feels like one continuous project, not 7 disconnected textbook chapters.

---

## 2. Per-domain process lists used while writing (for internal consistency across parts — cite
as "PMI groups these under X," hedge if a single source's exact wording can't be corroborated)

- **Governance** (~9 processes, old "Integration Management" territory): initiate project/phase
  · integrate & align plans · plan sourcing/procurement · manage execution · manage quality
  assurance · manage knowledge · monitor & control performance · assess & implement changes ·
  close project/phase.
- **Scope** (~6): plan scope management · elicit & analyze requirements · define scope · develop
  scope structure (WBS) · monitor & control scope · validate scope.
- **Schedule** (~3): plan schedule management · develop schedule · monitor & control schedule.
- **Finance** (~4): plan financial management · estimate costs · develop budget · monitor &
  control finances.
- **Stakeholders** (~7): identify stakeholders · plan engagement · plan communications · manage
  engagement · manage communications · monitor engagement · monitor communications.
- **Resources** (~5): plan resource management · estimate resources · acquire resources · lead
  the team · monitor & control resourcing.
- **Risk** (~6): plan risk management · identify risks · perform risk analysis · plan risk
  responses · implement risk responses · monitor risks.

(~40 total — treat the exact per-process wording as illustrative/pedagogical, not a verbatim PMI
quote, per §1.4's sourcing rule.)

## 3. Part-by-part module plan (Parts 2–7)

**Part 2 — The Six Principles** (`pmbok8-part2-principles-v1.html`)
1. The Mindset Layer: intro + the 3 dimensions (Proactive/Ownership/Value-Driven) + why 12→6
2. Adopt a Holistic View
3. Focus on Value
4. Embed Quality Into Processes and Deliverables
5. Be an Accountable Leader
6. Integrate Sustainability Within All Project Areas
7. Build an Empowered Culture — *fold in a short "principles working together" synthesis at the
   end of module 6 rather than a separate module 7, since References must be the true last
   module (7 content + References would be 8 total — acceptable per the 5–8 range, OR compress
   to 6 content modules by merging module 1's "why 12→6" into module 2's opening and merging two
   thematically adjacent principles into one module if 8 sections feels long. Decide at build
   time based on actual word count.)

**Part 3 — Governance** (`pmbok8-part3-governance-v1.html`)
1. Starting a Project: chartering, the business case, initiating
2. Integration: aligning plans across domains (the "system" view — this is where the Holistic
   View principle becomes concrete)
3. Sourcing & Procurement
4. Executing & Quality Assurance
5. Change Control & Performance Monitoring
6. Closing a Project or Phase
7. References

**Part 4 — Scope & Schedule** (`pmbok8-part4-scope-schedule-v1.html`)
1. Requirements: eliciting & analyzing what's actually needed
2. Defining Scope & Building the WBS
3. Validating & Controlling Scope (scope creep, change requests)
4. Schedule Management & Network Diagrams
5. The Critical Path & PERT (three-point estimating)
6. Monitoring & Controlling the Schedule (schedule variance, fast-tracking vs. crashing)
7. References

**Part 5 — Finance & Resources** (`pmbok8-part5-finance-resources-v1.html`)
1. Cost Estimating & the Cost Baseline
2. Budgeting & the S-Curve
3. Earned Value Management (PV/EV/AC, CPI/SPI, CV/SV, EAC/ETC — the exam-heaviest module in the
   series; needs the most worked-number examples)
4. Resource Planning & Estimating
5. Acquiring & Building the Team
6. Leading the Team (motivation theory — Maslow/Herzberg/McGregor — conflict resolution, Tuckman's
   stages) & Monitoring Resourcing
7. References

**Part 6 — Stakeholders & Risk** (`pmbok8-part6-stakeholders-risk-v1.html`)
1. Identifying & Analyzing Stakeholders (power/interest grid — can cross-reference Part 1's
   library case for a fresh worked example distinct from the Builder's Guide's house example)
2. Engagement & Communications Planning
3. Managing & Monitoring Engagement and Communications
4. Risk Planning & Identification
5. Qualitative & Quantitative Risk Analysis (probability/impact matrix, EMV, decision trees)
6. Risk Response Planning & Monitoring
7. References

**Part 7 — Delivery Approaches & the Exam Bridge** (`pmbok8-part7-capstone-v1.html`)
1. Predictive vs. Adaptive vs. Hybrid in Practice (Agile/Scrum/Kanban basics mapped onto the 7
   domains — reuses/cross-links the Builder's Guide's Agile module rather than duplicating it)
2. Tailoring Workshop (how to choose an approach for a given project)
3. Artifacts & Documents Library (charter/WBS/RACI/risk register templates, summarized)
4. The PMP/CAPM Exam Bridge (ECO mapping, formula cheat-sheet, situational-question technique)
5. Capstone Case Study: the library relaunch worked end-to-end across all 7 domains
6. Comprehensive Scenario Review (a denser mixed quiz section, still framed as application not
   recall)
7. References

Adjust module counts ±1 at build time if a part's real content naturally wants a different
split — the 5–8 range in the Adult Course Standard is the hard constraint, not exactly 7.

## 4. Hub (`pmbok8-hub.html`) requirements
- Reads all 7 parts' `pmbok8-partN:done` localStorage keys (same shape as any adult course:
  `{moduleIndex: true}`), computes each part's `doneCount/partTotal`, renders a progress bar per
  part + an overall "X / 7 parts complete" total (mirror `expedition-basecamp.html`'s pattern of
  reading multiple independent localStorage keys into one hub view).
- When **every** part is fully done, add the manifest id `pmbok8-guide` to `lwa:completed` (same
  mechanism `expedition-basecamp.html` uses for `proof-expedition-series`) so the site-wide "✓
  Read" pill lights up on `index.html` for the series as a whole.
- Cross-link: a callout/card linking to `project-management-course-v1.html` ("New to PM? Start
  with the Builder's Guide"), and confirm the Builder's Guide gets a reciprocal callout added
  near its top linking back to this hub once Part 1 ships (small edit to an existing file — do
  it in the same step as shipping the hub, not a separate step).
- Manifest: only `pmbok8-guide` (the hub) is a `courses.json` entry — id `pmbok8-guide`,
  category `Practice`, tags `["Intermediate","Career","PMP"]`, accent `indigo`, primitive
  `slab`, duration `Series`, path `courses/project-management/pmbok8-hub.html`.

## 5. Verification checklist (every step)
- `python3 -c "import json;json.load(open('assets/courses.json'))"` after manifest edits.
- Extract each part's inline `<script>` and run `node --check` on it.
- Confirm `data-course-id` is unique per part and matches what the hub reads.
- Confirm sidebar nav-item count == number of `<section id="module-N">` == `TOTAL` in the JS.
- Confirm References is always the last module and includes the closing `.callout.tomato`.
- Grep relative asset paths (`../../assets/...`, `../../index.html`) resolve correctly from
  `courses/project-management/`.

## 6. Build order / status
1. ✅ Hub + Part 1 (Foundations & the Value Delivery System) — shipped 2026-08-04.
2. ⏳ Part 2 (Six Principles) — next.
3. ⏳ Part 3 (Governance)
4. ⏳ Part 4 (Scope & Schedule)
5. ⏳ Part 5 (Finance & Resources)
6. ⏳ Part 6 (Stakeholders & Risk)
7. ⏳ Part 7 (Delivery Approaches & Exam Bridge)

Each ships as its own SOP step: build → verify → update `CLAUDE.md` "What's Already Built" +
`PROGRESS.md` → commit → push. This doc is the source of truth for what's left — a future
session can start straight at whichever part is next without re-reading this whole plan's
derivation, just the "Part-by-part module plan" entry for that part.
