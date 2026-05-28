#!/usr/bin/env python3
"""Add noindex + canonical pointing to the live version on each archived page."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://learnwithadhi.com"

MAP = {
    "ai-capability-v2.html": "courses/ai/ai-capability-course.html",
    "carbon-accounting-v2.html": "courses/carbon-accounting/carbon-accounting-course.html",
    "code-for-non-coders-v2.html": "courses/coding/code-ecosystem-guide-complete-v1.html",
    "feifelusiac-safe-area-calculator-v3.html": "courses/tools/feifelusiac-safe-area-calculator-v4.html",
    "train_adventure-v1.html": None,
    "train_adventure-v2.html": None,
    "train_adventure-hub.html": None,
}

ARCHIVE = ROOT / "courses" / "_archive"

for fname, canonical in MAP.items():
    p = ARCHIVE / fname
    if not p.exists():
        print(f"  missing  {fname}")
        continue
    src = p.read_text(encoding="utf-8")
    if "robots" in src and "noindex" in src:
        print(f"  skipped  {fname}")
        continue
    parts = ['<meta name="robots" content="noindex" />']
    if canonical:
        parts.append(f'<link rel="canonical" href="{BASE}/{canonical}" />')
    block = "\n".join(parts) + "\n"
    new, n = re.subn(r"(</title>)", r"\1\n" + block, src, count=1)
    if n == 0:
        new, n = re.subn(r"(<head[^>]*>)", r"\1\n" + block, src, count=1)
    p.write_text(new, encoding="utf-8")
    print(f"  patched  {fname}")
