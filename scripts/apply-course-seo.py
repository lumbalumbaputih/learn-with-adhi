#!/usr/bin/env python3
"""Apply SEO meta + JSON-LD + data-course-id to manifest courses.

Idempotent: skips files that already contain "og:title".
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "assets" / "courses.json"
BASE_URL = "https://learnwithadhi.com"
SOCIAL_IMG = f"{BASE_URL}/assets/on-indigo-512.png"


def seo_block(c: dict) -> str:
    title = c["title"]
    blurb = c["blurb"].replace('"', "&quot;")
    path = c["path"]
    url = f"{BASE_URL}/{path}"
    return f"""<meta name="description" content="{blurb}" />
<meta name="author" content="Adhi" />
<link rel="canonical" href="{url}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{blurb}" />
<meta property="og:url" content="{url}" />
<meta property="og:image" content="{SOCIAL_IMG}" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "{title}",
  "description": "{blurb}",
  "provider": {{ "@type": "Person", "name": "Adhi", "url": "{BASE_URL}" }}
}}
</script>
"""


def patch(path: Path, course: dict) -> str:
    src = path.read_text(encoding="utf-8")
    if "og:title" in src:
        return "skipped (already has OG tags)"

    # 1) add data-course-id to <html lang="en">
    src, n_html = re.subn(
        r'<html\s+lang="en"\s*>',
        f'<html lang="en" data-course-id="{course["id"]}">',
        src,
        count=1,
    )
    if n_html == 0:
        return "skipped (no <html lang=\"en\"> tag)"

    # 2) update <title> to include site suffix if not present
    src = re.sub(
        r"<title>([^<]+)</title>",
        lambda m: f"<title>{m.group(1).strip()} · Learn with Adhi</title>"
        if "Learn with Adhi" not in m.group(1)
        else m.group(0),
        src,
        count=1,
    )

    # 3) insert SEO block after the (now updated) </title>
    block = seo_block(course)
    src, n_title = re.subn(
        r"(</title>)",
        r"\1\n" + block,
        src,
        count=1,
    )
    if n_title == 0:
        return "skipped (no </title>)"

    path.write_text(src, encoding="utf-8")
    return "patched"


def main():
    manifest = json.loads(MANIFEST.read_text())
    for course in manifest:
        f = ROOT / course["path"]
        if not f.exists():
            print(f"  ??  {course['id']}: file not found ({course['path']})")
            continue
        result = patch(f, course)
        print(f"  {result:>10}  {course['id']}  ({course['path']})")


if __name__ == "__main__":
    main()
