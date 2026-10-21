# Project & People — Series Build Plan

**Audience of this doc:** any AI coding agent (Claude/Codex/etc.) or human continuing this
series. Modeled on `courses/project-management/PMBOK8-PLAN.md`, itself modeled on
`courses/math-thinking/EXPEDITION-PLAN.md` — the site's precedent for a multi-file course series.

---

## 0. Context — what this series is

Adhi uploaded a 132-slide lecture deck, "Overview of Project & People" (unit PRJM6010 — a
postgraduate project-management unit's organisational-behaviour component), and asked for it to
become a course: "nice visualisation and easy to understand topic without changing the 'term'."

**"Without changing the term" = keep every technical/academic term from the source exactly as
named** (cognitive dissonance, bounded rationality, the Big Five, the Dark Triad, LMX, the Fiedler
Contingency Model, groupthink, distributive/integrative bargaining, etc.) — never rename, water
down, or substitute a "friendlier" synonym for the vocabulary. The job is to **explain** each term
clearly with visuals, examples and worked scenarios, not to replace it. This is an *adult*
audience (postgrad project managers) — unlike the Rayyan/Raya kids content elsewhere in this repo,
there is no "disguise" requirement here. Follow the site's **Adult Course Standard** (see
`CLAUDE.md` → "Adult Course Standard") for file structure, design tokens, and mandatory per-module
anatomy.

The source deck is organisational behaviour (OB) theory applied specifically to running projects
and project teams — 11 content modules (the deck's own "Module 2" through "Module 12"; slide 1 is
a title slide and slides 130–132 are a reflection prompt + exam logistics + closing, none of which
carry teachable content). This plan preserves that 11-module structure **one-to-one**: each
deck module becomes one part of this series, under its own original module title.

**Source material:** the full slide text + speaker notes were extracted once, at
`/tmp/claude-0/-home-user-learn-with-adhi/6e1db3b0-2373-52a3-92f9-fd00636a5b71/scratchpad/pptx_text.txt`
(1636 lines, `===== SLIDE N =====` headers, `--- NOTES ---` for speaker notes). That scratchpad path
is ephemeral (session-specific) — if it's gone in a future session, the original file is at
`/root/.claude/uploads/6e1db3b0-2373-52a3-92f9-fd00636a5b71/b1941c44-Overview_of_Topics.pptx` and
can be re-extracted with `python-pptx` (see extraction approach below) or by reading the PPTX
directly. The notes contain the richest explanatory material — most module prose in Parts 1–11
below draws on the notes, not just the terse slide bullets.

```python
from pptx import Presentation
prs = Presentation(path)
for i, slide in enumerate(prs.slides, start=1):
    for shape in slide.shapes:
        if shape.has_text_frame:
            for para in shape.text_frame.paragraphs:
                print("".join(r.text for r in para.runs))
    if slide.has_notes_slide:
        print(slide.notes_slide.notes_text_frame.text)
```

**Already shipped (use as reference implementations):**

| File | What it is |
|---|---|
| `project-people-hub.html` | Series hub / route map — same pattern as `pmbok8-hub.html` (reads each part's `<partId>:done` localStorage, shows progress, route-map UI). |
| `project-people-part1-attitudes-personality-values-v1.html` | **THE TEMPLATE.** Copy its CSS + JS shell verbatim for new parts — itself copied from `pmbok8-part1-foundations-v1.html` / `project-management-course-v1.html` (the site's reference Adult Course Standard implementation). |

---

## 1. Hard conventions (apply to every part — DO NOT deviate)

### 1.1 File & naming
- One self-contained HTML file per part: `courses/project-people/project-people-partN-<slug>-v1.html`
- Pure HTML/CSS/vanilla JS. No frameworks, no build step, no runtime network calls beyond Google
  Fonts (same guardrail as the rest of the site).
- `<html lang="en" data-course-id="project-people-partN">` — each part is its own progress
  namespace.
- **Not** wired into `assets/courses.json` individually — only the hub (manifest id
  `project-people`) is a manifest entry; parts are reached via the hub.

### 1.2 Shell (copy from `project-people-part1-attitudes-personality-values-v1.html`)
Copy verbatim and adapt only the data — full `<style>` block (sidebar, mobile header, module hero,
content typography, the 5 callout variants, stat cards, concept grid, demo boxes, `table.pm-table`,
quiz styles, checklist, resources/references, foot-nav, completion banner, responsive breakpoint)
and the shell JS (`COURSE_ID`/`TOTAL` consts, `getProgress`/`saveProgress`/`markCourseComplete`,
`renderProgress`, `goto`+`currentModule`, `setupQuizzes`, `setupChecklist`, `init()` wiring).

Per-part substitutions:
- `COURSE_ID` = `'project-people-partN'`; `TOTAL` = that part's module count (content modules + 1
  References module — see §2 for the exact count per part).
- Sidebar nav-item list + each `<section id="module-N">` must stay in lockstep with `TOTAL`.
- **Accent stays `mawar` (purple) across all 11 parts + the hub**, so the series reads as one
  visual family: `--acc:#7C3AED; --acc-dim:#6D28D9; --acc-bg:rgba(124,58,237,0.08);`. This is
  deliberately distinct from the PMBOK8 series (indigo) and the Builder's Guide (mango) — "Project
  & People" is the soft-skills/OB companion to those hard-process courses, and the colour should
  say so at a glance. The other callout/table accent tokens (`--tomato`/`--sea`/`--green`/`--mango`/
  `--indigo`/`--forest`) stay the shared design-system CSS vars, unchanged.
- Sidebar `.sb-series` link → `project-people-hub.html`, labelled `← Series map · Part N of 11`.
- `.sb-footer` link → `../../index.html`.

### 1.3 Page anatomy (per part) — the Adult Course Standard, applied
1. **Sidebar**: logo → `../../index.html`, series-map link, progress bar, one nav-item per
   module (last = always "References"), footer link.
2. **Modules 1..(TOTAL−1)**: full mandatory anatomy — eyebrow (`Module 0N / 0T`) → `h1.mod-title`
   with one `<span class="acc">` word → `p.mod-lede` (1–2 sentences) → `.mod-objectives` (3–5
   bullets) → prose (`h2.sh`/`h3.sub`) → **at least one hand-built inline SVG diagram** carrying
   real structural/quantitative info (no external image libraries — see Part 1's diagrams for the
   coordinate-math technique) → a `.stat-row` of 3 `.stat-card`s at least once per part where a
   genuine stat exists (e.g. the 55/38/7 rule in Part 6, the 33–45% poor-sleep stat in Part 2) →
   colour-coded callouts used correctly (default `--acc` = key insight, `.tomato` = warning/
   critical caveat, `.green` = positive outcome/good practice, `.blue` = factual/data point,
   `.mango` = nuance/"it depends") → an inline 3-question quiz testing *application* of the
   concept to a project-management scenario, not recall of the definition → `.foot-nav` prev/next
   + done button.
3. **Final module = References**, same structure as Part 1's: `.ref-group-label` groups (e.g.
   "Primary Theorists Cited in This Module" / "Applied to Project Management" / "Further Reading"),
   `.ref-item` with `.ref-citation` (Chicago-style) + `.ref-annotation` (2–3 sentences: what it
   contributes + any caveat) + `.ref-link`, closing `.callout.tomato` data-quality note, then
   `#completion-banner`.

### 1.4 Citing the source lecture material
The deck itself is unpublished teaching material (a university unit's slides), not a citable
public source — **don't cite "Overview of Project & People, PRJM6010" as a reference**. Instead,
cite the **named scholars and studies the deck itself cites** in its slide notes (Robbins & Judge's
*Organisational Behaviour* is the deck's own evident textbook base — most definitions trace to it)
plus the specific empirical studies named per slide (e.g. Tuuli & Rowlinson 2009; Tabrizi 2015;
Ericksen & Dyer 2004; Walker & Newcombe 2000; Hoegl & Muethel 2016; Pinto, Dawood & Pinto 2014).
Each part's reference list below names the theorists/studies that part should cite — verify/locate
real publication details for each (author, year, title, journal where findable) rather than
inventing citation details; where a precise citation can't be confirmed, cite the named theory
generically (e.g. "Herzberg, F. (1966). *Work and the Nature of Man*. Cleveland: World Publishing
Co.") using the well-established canonical citation for that theorist's seminal work, and flag
with a `.callout.tomato` "verify before professional/academic use" note in the References module,
matching PMBOK8 Part 1's precedent for sources that couldn't be directly verified.

---

## 2. The 11 parts — module breakdown & source mapping

Each part = the deck's own module, same title. Module counts below include the References module.

### Part 1 — Attitudes, Personality & Values (deck Module 2, slides 3–13) · 6 modules
File: `project-people-part1-attitudes-personality-values-v1.html` · **SHIPPED — the template.**
1. Attitudes: Components & Cognitive Dissonance — attitude definition, the 3 components
   (cognitive/affective/behavioural), cognitive dissonance, predicting behaviour from attitudes
2. Job Attitudes — psychological empowerment, organisational commitment, job satisfaction, job
   involvement (Tuuli & Rowlinson 2009 construction PM study)
3. Personality & the Big Five — personality defined, measuring personality (self-report vs.
   observer-ratings), the Big Five model
4. The Dark Triad & Project-Manager Fit — Machiavellianism, Narcissism, Psychopathy; person-
   organisation fit for PMs
5. Values: Terminal & Instrumental — values defined, terminal vs. instrumental values
6. References

### Part 2 — Emotions, Moods, Perception & Individual Decision Making (deck Module 3, slides
15–28) · 6 modules
File: `project-people-part2-emotions-perception-decisions-v1.html`
1. Emotions, Moods & Affect — definitions, how emotions differ from moods, sources of emotions/
   moods (personality, time of day, weather, stress, sleep, events)
2. Emotional Labour & Emotional Intelligence — surface vs. deep acting, burnout risk; EI defined,
   the for/against debate
3. Perception & Attribution Theory — perception defined, distinctiveness/consensus/consistency,
   internal vs. external attribution
4. Individual Decision Making & Bounded Rationality — the perception→problem→decision chain,
   bounded rationality, satisficing
5. Biases & Errors in Decision Making — hindsight, anchoring, confirmation, availability bias
6. References

### Part 3 — Motivation in Projects (deck Module 4, slides 30–38) · 6 modules
File: `project-people-part3-motivation-v1.html`
1. Defining Motivation & Maslow's Hierarchy of Needs — intensity/direction/persistence; lower- vs.
   higher-order needs
2. Herzberg's Two-Factor Theory — hygiene factors vs. motivators, the critique
3. McClelland's Learned Needs Theory — need for achievement/affiliation/power
4. Self-Efficacy — Bandura; mastery experience, vicarious experience, verbal persuasion,
   physiological state
5. Four-Drive, Reinforcement & Expectancy Theory — Acquire/Bond/Comprehend/Defend; Skinner's
   reinforcement theory; Vroom's expectancy theory
6. References

### Part 4 — Foundations of Group Behaviour (deck Module 5, slides 40–44) · 6 modules
File: `project-people-part4-group-behaviour-v1.html`
1. Defining & Classifying Groups — formal vs. informal groups
2. Why People Form Groups: Social Identity Theory — similarity, distinctiveness, status,
   uncertainty reduction
3. Stages of Group Development — Tuckman's forming/storming/norming/performing/adjourning
4. The Psychological Contract — relational vs. transactional contracts
5. Groupthink & Groupshift
6. References

### Part 5 — Understanding Project Teams (deck Module 6, slides 46–49) · 5 modules
File: `project-people-part5-project-teams-v1.html`
1. What Is a Team, and Why Did They Take Over? — work team defined, why teams became popular
2. Why Cross-Functional Teams Fail — and the Fix — Tabrizi 2015: governance, goal specificity,
   prioritisation, silos; the 4 fixes
3. Building a High-Performing Project Team — Ericksen & Dyer 2004: mobilisation strategy,
   competency-based staffing vs. politically-based staffing
4. Applying It: Attitudes, Motivation & Group Theory in Your Own Team — synthesis module tying
   Parts 1–4's theory to the practical job of standing up a project team (deliberately a capstone-
   style module, per the Adult Course Standard's "module 6 = synthesis" guidance, since this
   part's own source content is comparatively thin)
5. References

### Part 6 — Communications in Projects (deck Module 7, slides 51–59) · 6 modules
File: `project-people-part6-communications-v1.html`
1. Why We Communicate — the 4 functions: control, motivation, emotional expression, information
2. The Communication Process — and Why It Isn't Linear — sender/encoding/message/channel/decoding/
   receiver/noise/feedback; interruptions & context
3. Modes of Communication — oral, written, non-verbal; the 55/38/7 rule
4. Persuasion — Ethos, Pathos, Logos; automatic vs. controlled processing (interest level, prior
   knowledge, personality, message richness)
5. Barriers to Effective Communication — filtering, selective perception, information overload,
   emotions, language, silence, communication apprehension, lying
6. References

### Part 7 — Leadership in Projects (deck Module 8, slides 61–75) · 6 modules
File: `project-people-part7-leadership-v1.html`
1. Leadership vs. Management — Day & Antonakis 2012; the manager-vs-leader table; 7 traits
2. Early Theories: Traits & Behaviours — Big Five + narcissism/social dominance as predictors
   (Judge et al. 2002); task-/people-/change-oriented behaviour
3. Contingency Theories: Fiedler & LMX — the Fiedler Contingency Model (1964); Leader-Member
   Exchange, in-group/out-group (Green & Uhl-Bien 1995)
4. Charismatic & Transformational Leadership — Conger & Kanungo 1998; socialised charismatic
   leaders; the Full Range of Leadership Model (laissez-faire → transactional → transformational)
5. Shared Leadership — Hoegl & Muethel 2016, virtual & project teams; why leaders resist it
6. References

### Part 8 — Power and Politics in Project Management (deck Module 9, slides 77–85) · 5 modules
File: `project-people-part8-power-politics-v1.html`
1. What Is Power? — power, dependency, influence tactics, political behaviour defined; power vs.
   leadership
2. The Five Bases of Power — French & Raven 1959 (formal: coercive/reward/legitimate; personal:
   expert/referent); power in project management specifically (Walker & Newcombe 2000)
3. Responses to Influence & the Stakeholder Grid — Falbe & Yukl 1992 (opposition/compliance/
   commitment); the Stakeholder Interest & Influence Grid
4. Organisational Politics: Necessary Evil or Just Evil? — examples of political behaviour; the
   case that ethical politics is unavoidable (and sometimes necessary) under resource scarcity and
   ambiguity
5. References

### Part 9 — Conflict & Negotiation in Project Management (deck Module 10, slides 87–97) · 5
modules
File: `project-people-part9-conflict-negotiation-v1.html`
1. Views on Conflict — traditional vs. interactionist; task/relationship/process conflict; dyadic/
   intragroup/intergroup loci
2. The Conflict Process & Five Handling Intentions — the conflict process model; the Thomas-
   Kilmann five intentions (accommodating/avoiding/compromising/competing/collaborating)
3. Choosing the Right Conflict-Management Technique — power/influence and issue criticality;
   Sutterfield et al. 2007's technique-by-conflict-type guidance
4. Negotiation — distributive vs. integrative bargaining; the PM's 3 negotiation roles
   (negotiator/mediator/arbitrator); PMI's 3 negotiation stages
5. References

### Part 10 — Organisational Structure and Culture: Project-Based Organisations (deck Module 11,
slides 99–104) · 5 modules
File: `project-people-part10-culture-structure-v1.html`
1. The Seven Core Characteristics of Culture — innovation/risk-taking, attention to detail,
   outcome orientation, people orientation, team orientation, aggressiveness, stability
2. The Competing Values Framework — Cameron & Quinn 2005: Clan/Adhocracy/Market/Hierarchy, on the
   internal–external and stability–flexibility axes
3. Why Culture Matters, and How It Forms — boundaries, identity, commitment, social glue, control;
   founder philosophy → selection → socialisation
4. Dominant Culture, Subcultures & Project Culture — Zuo 2008's project-culture definition
5. References

### Part 11 — Organisational Change and Stress Management in Projects (deck Module 12, slides
106–129) · 7 modules
File: `project-people-part11-change-stress-v1.html`
1. Defining Change & the Forces Behind It — planned change, change agents; workforce/technology/
   economic/competitive/social forces
2. Resistance to Change — overt/implicit/immediate/deferred resistance; individual vs.
   organisational sources; the 8 strategies for overcoming it
3. Change Models: Lewin's Three Steps & Kotter's Eight — unfreezing/movement/refreezing; driving
   vs. restraining forces; Kotter's 8-step plan built on Lewin's model
4. Building a Change-Ready Culture — innovation (idea champions, structural variables) and
   learning organisations
5. Work Stress — challenge vs. hindrance stressors; environmental/organisational/personal sources;
   the Pinto, Dawood & Pinto 2014 project-manager findings
6. Burnout & Managing Stress in Projects — Maslach & Leiter 2008's definition; consequences
   (physiological/psychological/behavioural); individual, organisational & PM-practice approaches
   to managing it
7. References

---

## 3. Hub page (`project-people-hub.html`)

Copy `pmbok8-hub.html`'s structure (dark-theme route-map page, same CSS shell, same `PARTS` array
pattern reading `localStorage` progress per part). Substitutions:
- Title: "Project & People" with an accent word in the deck's own style.
- Architecture strip: 4 stat cards — e.g. **11** Modules, **~60** Theories & Models, **33**
  Quizzes (3 per content module × ~57 content modules — recompute once all parts ship), **1**
  Running Thread (projects, throughout).
- On-ramp card: none needed (no simpler "builder's guide" prerequisite exists for this series —
  omit the `#onramp` section entirely, or point it at `project-management-course-v1.html` as "new
  to projects generally? start there" if Adhi likes that cross-link).
- `--p1`..`--p11` colour variables: pick 11 distinct hues from the existing design-system palette
  (cycle through tomato/mango/forest/sea/mawar/indigo + a few intermediate shades) so each part's
  route-map "knot" is visually distinct, same technique as PMBOK8's `--p1`..`--p7`.
- `PARTS` array: 11 entries, `n`, `icon`, `cc`, `title` (exact deck module title), `dom` (one-line
  domain summary), `total` (module count from §2), `id` (`project-people-partN`), `href` (filename
  once shipped — omit `href` for parts not yet built so the hub shows them "Being built…", same
  locked-card pattern as PMBOK8's Part 6 before it shipped).

---

## 4. Manifest entry (`assets/courses.json`)

Add once the hub + Part 1 exist:
```json
{
  "id": "project-people",
  "n": "19",
  "title": "Project & People",
  "blurb": "The human side of running a project: attitudes, motivation, teams, leadership, power, conflict, culture and stress — 11 modules of organisational-behaviour theory applied directly to project management, with the terms kept intact and explained properly.",
  "category": "Practice",
  "tags": ["Series", "Leadership", "Teams"],
  "primitive": "wave",
  "accent": "mawar",
  "path": "courses/project-people/project-people-hub.html",
  "duration": "Series"
}
```
(`"n": "19"` is the next free sequence number as of 2026-10-21 — recheck `assets/courses.json`
for collisions before shipping if time has passed.)

Also add the hub's URL to `sitemap.xml` (the site's sitemap is already stale for several other
series — pmbok8-hub.html, cek-fakta-iklim, perth-transit among them — backfilling those is out of
scope for this series; just don't make it worse).

---

## 5. Build order & status

1. ✅ Plan (this doc)
2. ✅ Hub skeleton + Part 1 (reference implementation)
3. ⏳ Parts 2–11, in any order (no part depends on another being built first, though Part 5
   Module 4 "Applying It" references Parts 1–4's concepts by name and reads better once they
   exist)
4. Manifest entry + sitemap once hub + Part 1 are live
5. Final pass: open every part once, confirm sidebar nav counts match `TOTAL`, confirm the hub's
   `href`s all resolve, spot-check 2–3 quizzes per part for correct-answer wiring, update this plan's
   status table

| Part | File | Status |
|---|---|---|
| Hub | `project-people-hub.html` | ✅ shipped |
| 1 — Attitudes, Personality & Values | `project-people-part1-attitudes-personality-values-v1.html` | ✅ shipped |
| 2 — Emotions, Moods, Perception & Decision Making | `project-people-part2-emotions-perception-decisions-v1.html` | ⏳ |
| 3 — Motivation | `project-people-part3-motivation-v1.html` | ⏳ |
| 4 — Foundations of Group Behaviour | `project-people-part4-group-behaviour-v1.html` | ⏳ |
| 5 — Understanding Project Teams | `project-people-part5-project-teams-v1.html` | ⏳ |
| 6 — Communications in Projects | `project-people-part6-communications-v1.html` | ✅ shipped |
| 7 — Leadership in Projects | `project-people-part7-leadership-v1.html` | ✅ shipped |
| 8 — Power and Politics | `project-people-part8-power-politics-v1.html` | ✅ shipped |
| 9 — Conflict & Negotiation | `project-people-part9-conflict-negotiation-v1.html` | ✅ shipped |
| 10 — Organisational Structure & Culture | `project-people-part10-culture-structure-v1.html` | ⏳ |
| 11 — Organisational Change & Stress Management | `project-people-part11-change-stress-v1.html` | ⏳ |
