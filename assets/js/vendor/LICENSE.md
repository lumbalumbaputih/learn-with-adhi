# Vendored third-party libraries

## Three.js (r128) — `three.min.js`, `OrbitControls.js`
- Source: https://github.com/mrdoob/three.js (tag `r128`)
- Files: `build/three.min.js`, `examples/js/controls/OrbitControls.js`
- License: **MIT** — Copyright © 2010-2021 three.js authors
- Why local: the project guardrail prefers downloaded assets over CDN hotlinks so
  lessons/games never break on flaky wifi (and so the offline service worker can
  cache them). Used by `courses/games/eco-board-v1.html` (the 3D sustainability
  board game).
