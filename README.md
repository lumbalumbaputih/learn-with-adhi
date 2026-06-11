# Learn with Adhi

A static learning hub built with pure HTML, CSS, and vanilla JavaScript — no frameworks, no build step. Every course is a single self-contained `.html` file.

Live at **learnwithadhi.com** (hosted on Vercel). Two halves:

1. **Adult library** (`index.html`) — practical courses, tools, and research reports (AI, coding, climate, design, life). Free, no login. The hub renders everything from `assets/courses.json` — filter chips, hero counts, and the featured panel all derive from that manifest.
2. **Kids' world** (`kids.html` → `rayyan.html` / `raya.html`) — gamified learning adventures for Rayyan & Raya in Bahasa Indonesia: math & coding ladders, games, storybooks, tracing. Progress is stored in `localStorage` (stars per course) and optionally synced per kid to Firestore via the parent account (`login.html` / `dashboard.html`).

## Structure

```
learn-with-adhi/
├── index.html                – adult hub (manifest-driven course grid, search, about)
├── kids.html                 – kid chooser (Rayyan / Raya) + parent auth bar
├── rayyan.html / raya.html   – per-kid adventure hubs (world map, streak, badges, daily quest)
├── login.html / dashboard.html – parent account + progress/weak-spots dashboard
├── sw.js / manifest.webmanifest – offline layer: precaches the kid world, installable PWA
├── sitemap.xml / robots.txt
├── api/quotes.js             – Vercel edge function (stock quotes for the AI-boom report)
├── assets/
│   ├── courses.json          – the adult-library manifest (single source of truth)
│   ├── js/auth.js            – Firebase auth + per-kid Firestore progress sync
│   ├── js/progress.js        – scroll-completion tracker ("✓ Read" pills on the index)
│   ├── img/kenney/           – CC0 game sprites (see LICENSE.md there)
│   └── css/, course-template.html, icons
├── courses/
│   ├── ai/, architecture/, carbon-accounting/, clothing-textiles/,
│   │   design/, disaster-management/, health/, lca/   – adult courses
│   ├── math/, coding/, learning/, games/              – kids' courses
│   ├── tools/                – calculators + kid games
│   └── _archive/             – old versions, not linked
├── research/                 – deep-research reports
├── design-system/            – Adhi Design System reference
├── CLAUDE.md                 – project memory: SOP, build plans, wiring checklists
└── PROGRESS.md               – chronological build log (newest first)
```

## Design system

Reference: [`design-system/adhi-design-system.html`](design-system/adhi-design-system.html). Quick tokens:

| Token | Value | Usage |
|---|---|---|
| `--tomato` | `#FF5C39` | Primary accent, CTAs |
| `--mango` | `#FFC234` | Highlights, badges |
| `--forest` | `#1F9D55` | Success, nature topics |
| `--sea` | `#1FA9C7` | Water/ocean topics |
| `--mawar` | `#E84BA0` | Creative accents, Raya |
| `--indigo` | `#2E3192` | Parent/auth surfaces |
| `--ink` | `#1A1614` | Text, borders, shadows |
| `--paper` | `#FBF4E6` | Page background (warm cream) |

Fonts: **Bricolage Grotesque** (display), **Inter** (body), **JetBrains Mono** (labels/code). Interactive elements use bold 2px ink borders with a `translate(-4px,-4px)` + hard-shadow hover.

## Run locally

It's a static site — any web server works:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly also works, except the manifest `fetch` and the service worker need an HTTP origin.

## Conventions

- **One self-contained HTML file per course.** No shared runtime dependencies a course can break on; lessons must keep working on flaky wifi.
- **Adding an adult course:** add the file + an entry in `assets/courses.json` (the index derives everything) + `sitemap.xml`. Include `assets/js/progress.js` and a matching `data-course-id` so completion tracking works.
- **Adding a kids' course:** follow the wiring checklist in `CLAUDE.md` (hub arrays, star keys, auth sync, dashboard names, count pills, `sw.js` precache).
- `CLAUDE.md` holds the operating procedure and the current improvement plan; `PROGRESS.md` is the step-by-step build log. Keep both current with every change.
