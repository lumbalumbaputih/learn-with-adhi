#!/usr/bin/env python3
"""Inject breadcrumb + prev/next pager + course-nav.js before </body>.

Idempotent: skips files that already include data-course-pager.
Skips tools — only operates on Foundations/Life/Practice courses where
prev/next within a category is meaningful.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "assets" / "courses.json"

SNIPPET = """
<nav class="lwa-breadcrumb" aria-label="Breadcrumb" data-course-breadcrumb style="max-width:760px;margin:32px auto 0;padding:0 24px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim,#6B6259)"></nav>
<nav class="lwa-pager" aria-label="Course pagination" data-course-pager style="max-width:760px;margin:32px auto 0;padding:32px 24px;display:grid;grid-template-columns:1fr 1fr;gap:16px;border-top:1px solid var(--border,rgba(26,22,20,.14));font-family:'JetBrains Mono',ui-monospace,monospace"></nav>
<style>
  .lwa-breadcrumb a:hover{color:var(--accent,#FF5C39)}
  .lwa-breadcrumb span[aria-hidden]{padding:0 8px;opacity:.5}
  .lwa-pager a,.lwa-pager>div{display:block;padding:16px;border:1px solid var(--border,rgba(26,22,20,.14));border-radius:12px;transition:border-color .2s,transform .2s;text-decoration:none;color:inherit}
  .lwa-pager a:hover{border-color:var(--accent,#FF5C39);transform:translateY(-2px)}
  .lwa-pager .pager-label{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim,#6B6259);margin-bottom:6px}
  .lwa-pager .pager-title{font-family:'Bricolage Grotesque','Arial Black',sans-serif;font-weight:700;font-size:17px;color:var(--text,#1A1614)}
  .lwa-pager .pager-next{text-align:right}
  .lwa-pager .pager-disabled{opacity:.4;pointer-events:none}
  @media (max-width:640px){.lwa-pager{grid-template-columns:1fr}.lwa-pager .pager-next{text-align:left}}
</style>
<script defer src="/assets/js/course-nav.js"></script>
"""


def patch(path: Path) -> str:
    src = path.read_text(encoding="utf-8")
    if "data-course-pager" in src:
        return "skipped (already has pager)"
    if "</body>" not in src:
        return "skipped (no </body>)"
    new_src = src.replace("</body>", SNIPPET + "\n</body>", 1)
    path.write_text(new_src, encoding="utf-8")
    return "patched"


def main():
    manifest = json.loads(MANIFEST.read_text())
    for course in manifest:
        if course["category"] == "Tools":
            print(f"  {'skipped (tool)':>22}  {course['id']}")
            continue
        f = ROOT / course["path"]
        if not f.exists():
            print(f"  {'missing':>22}  {course['id']}")
            continue
        print(f"  {patch(f):>22}  {course['id']}")


if __name__ == "__main__":
    main()
