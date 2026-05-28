#!/usr/bin/env python3
"""Generate sitemap.xml from assets/courses.json + a few static pages."""
import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://learnwithadhi.com"
STATIC = ["", "kids.html", "design-system/adhi-design-system.html"]

today = date.today().isoformat()
manifest = json.loads((ROOT / "assets" / "courses.json").read_text())

urls = [f"{BASE}/{p}" if p else f"{BASE}/" for p in STATIC]
urls += [f"{BASE}/{c['path']}" for c in manifest]

body = "\n".join(
    f"  <url><loc>{u}</loc><lastmod>{today}</lastmod></url>" for u in urls
)
xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{body}
</urlset>
"""
(ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")
print(f"Wrote sitemap.xml with {len(urls)} URLs")
