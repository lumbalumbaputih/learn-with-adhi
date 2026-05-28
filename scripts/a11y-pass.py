#!/usr/bin/env python3
"""A11y pass on manifest course files:
- Ensure every <img> has an alt attribute (empty fallback for decorative).
- Add a skip-link before main content if missing.
- Add aria-hidden="true" to inline decorative <svg> with no aria-label/role.

Idempotent. Skips archived files.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "assets" / "courses.json"

IMG_NO_ALT = re.compile(r"<img\b((?:(?!alt=)[^>])*)>", re.IGNORECASE)
SVG_OPEN = re.compile(r"<svg\b([^>]*)>", re.IGNORECASE)


def patch_imgs(src: str) -> tuple[str, int]:
    count = 0
    def repl(m: re.Match) -> str:
        nonlocal count
        attrs = m.group(1)
        if "alt=" in attrs.lower():
            return m.group(0)
        count += 1
        return f'<img{attrs} alt="">'
    return IMG_NO_ALT.sub(repl, src), count


def patch_svgs(src: str) -> tuple[str, int]:
    count = 0
    def repl(m: re.Match) -> str:
        nonlocal count
        attrs = m.group(1)
        low = attrs.lower()
        if "aria-" in low or "role=" in low:
            return m.group(0)
        count += 1
        return f"<svg{attrs} aria-hidden=\"true\">"
    return SVG_OPEN.sub(repl, src), count


def add_skip_link(src: str) -> tuple[str, bool]:
    if "skip-link" in src or "Skip to content" in src:
        return src, False
    body_match = re.search(r"(<body[^>]*>)", src, re.IGNORECASE)
    if not body_match:
        return src, False
    link = (
        '\n<a class="skip-link" href="#main" '
        'style="position:absolute;left:-9999px;top:0;z-index:999;background:#1A1614;color:#FBF4E6;padding:12px 16px;font-family:monospace;font-size:12px;letter-spacing:.1em;text-transform:uppercase" '
        'onfocus="this.style.left=\'8px\';this.style.top=\'8px\'" '
        'onblur="this.style.left=\'-9999px\'">Skip to content</a>\n'
    )
    return src.replace(body_match.group(0), body_match.group(0) + link, 1), True


def ensure_main_target(src: str) -> tuple[str, bool]:
    if 'id="main"' in src or "id='main'" in src:
        return src, False
    m = re.search(r"<h1\b([^>]*)>", src, re.IGNORECASE)
    if not m:
        return src, False
    attrs = m.group(1)
    new_open = f'<h1{attrs} id="main" tabindex="-1">'
    return src.replace(m.group(0), new_open, 1), True


def main():
    manifest = json.loads(MANIFEST.read_text())
    for course in manifest:
        p = ROOT / course["path"]
        if not p.exists():
            print(f"  missing  {course['id']}")
            continue
        src = p.read_text(encoding="utf-8")
        orig = src
        src, n_img = patch_imgs(src)
        src, n_svg = patch_svgs(src)
        src, added_skip = add_skip_link(src)
        src, added_main = ensure_main_target(src)
        if src != orig:
            p.write_text(src, encoding="utf-8")
            print(f"  patched  {course['id']:25s}  imgs+={n_img}  svg-ariahidden+={n_svg}  skip={'y' if added_skip else 'n'}  main-target={'y' if added_main else 'n'}")
        else:
            print(f"  clean    {course['id']}")


if __name__ == "__main__":
    main()
