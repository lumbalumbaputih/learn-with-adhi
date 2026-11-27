#!/usr/bin/env python3
"""Check the kids' courses against the two no-exception rules in CLAUDE.md.

1. Disguise: text a child can see must never reveal a grade level ("Kelas 3",
   "Grade 4", "SD", "SMP", ...) or call the activity "coding"/"programming"
   ("pemrograman", ...). Internal names (CSS classes, ids, file paths,
   localStorage keys, comments) are allowed and are not scanned.
2. Wiring: every kids' course progress key must be in every required place
   (CLAUDE.md "Wiring a new Rayyan (kids) course"), every kids' course file
   must be linked from a hub and precached in sw.js, and the count pills must
   match the number of wired courses.

Usage:
    python3 scripts/check-kids-courses.py            # check this repo
    python3 scripts/check-kids-courses.py --root DIR # check another copy
    python3 scripts/check-kids-courses.py --quiet    # print only on failure (Stop hook)

Exit code 0 = every check passed, 1 = at least one failure (each printed as
file:line). Standard library only, no dependencies.

What is scanned as "visible text":
  - HTML text nodes, including <title> (shown in the browser tab), with
    <script>/<style>/<template> contents, comments, tags and attribute values
    removed; except the attributes a child can see or hear: title, alt,
    placeholder, aria-label, and the value of input buttons.
  - String literals inside <script> blocks, because most child-facing text
    (questions, hints, hub cards) is built by JavaScript. HTML inside those
    strings is stripped the same way, and file paths, CSS selectors and
    single-word lowercase identifiers ('coding-card') are ignored.
"""

import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

# ── What counts as a kids' file ─────────────────────────────────────────────
HUBS = ['rayyan.html', 'raya.html', 'kids.html']
KID_FOLDERS = ['courses/math', 'courses/coding', 'courses/learning', 'courses/games']

# Family / front-door games: deliberately NOT wired into the kids' star system
# (CLAUDE.md "Games": manifest front door only; not in kids.html, sumStars,
# sw.js). They are excluded from both checks, and the wiring check fails if
# one of them turns up in a kids' hub or in PRECACHE.
FAMILY_GAMES = [
    'courses/games/eco-board-v1.html',
    'courses/games/ular-tangga-v1.html',
    'courses/games/robot-rapi-v1.html',
]
# Adult courses that live in a kids' folder are excluded automatically: any
# file listed in assets/courses.json (the adult front door) is not a kids' file.

# ── Forbidden visible words (CLAUDE.md "The disguise strategy") ─────────────
ROMAN = r'(?:XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)'
FORBIDDEN = [
    ('grade level', re.compile(r'\b(?i:kelas)\s*(?:\d{1,2}\b|' + ROMAN + r'\b)')),
    ('grade level', re.compile(r'\bkelas\s+(?:satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh)\b', re.I)),
    ('grade level', re.compile(r'\bgrade\s*(?:\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\b', re.I)),
    ('grade level', re.compile(r'\b(?:\d{1,2}(?:st|nd|rd|th)|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)[\s-]+grade\b', re.I)),
    ('grade level', re.compile(r'\bGr\.?\s?\d{1,2}\b')),
    ('school level', re.compile(r'\b(?:SD|SMP|SMA)\b')),
    ('"coding" word', re.compile(r'\b(?:coding|koding|ngoding|coders?)\b', re.I)),
    ('"programming" word', re.compile(r'\b(?:programm(?:ing|ers?)|programers?|pemrogram(?:an)?)\b', re.I)),
]

VISIBLE_ATTRS = {'title', 'alt', 'placeholder', 'aria-label'}
BUTTON_INPUTS = {'button', 'submit', 'reset'}


class VisibleText(HTMLParser):
    """Collects (line, text) for visible text, and (line, js_source) for scripts."""

    SKIP = {'style', 'template'}

    def __init__(self, line_offset=0):
        super().__init__(convert_charrefs=True)
        self.line_offset = line_offset
        self.chunks = []    # (line, text)
        self.scripts = []   # (line, source)
        self.stack = []

    def _line(self):
        return self.getpos()[0] + self.line_offset

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        for name in VISIBLE_ATTRS:
            if a.get(name):
                self.chunks.append((self._line(), a[name]))
        if tag == 'input' and (a.get('type') or '').lower() in BUTTON_INPUTS and a.get('value'):
            self.chunks.append((self._line(), a['value']))
        if tag in ('script', 'style', 'template'):
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        a = dict(attrs)
        for name in VISIBLE_ATTRS:
            if a.get(name):
                self.chunks.append((self._line(), a[name]))
        if tag == 'input' and (a.get('type') or '').lower() in BUTTON_INPUTS and a.get('value'):
            self.chunks.append((self._line(), a['value']))

    def handle_endtag(self, tag):
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()

    def handle_data(self, data):
        if not self.stack:
            self.chunks.append((self._line(), data))
        elif self.stack[-1] == 'script':
            self.scripts.append((self._line(), data))
        # style / template contents are skipped


# ── A small JavaScript tokenizer: finds string and template literals ────────
REGEX_PREFIX = set('(,=:[!&|?{};+-*%<>~^')
REGEX_KEYWORDS = {'return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new',
                  'delete', 'void', 'throw', 'instanceof', 'yield', 'await'}


def js_strings(src):
    """Return [(offset, text)] for every string literal in JS source.

    Template literals are returned whole, with each ${...} expression replaced
    by a space plus the newlines it contained, so line numbers stay right.
    """
    out = []
    _scan_code(src, 0, out, in_expr=False)
    return out


def _scan_code(src, i, out, in_expr):
    n = len(src)
    depth = 0
    prev = ''
    while i < n:
        c = src[i]
        if c in ' \t\r\n':
            i += 1
            continue
        if src.startswith('//', i):
            j = src.find('\n', i)
            i = n if j < 0 else j
            continue
        if src.startswith('/*', i):
            j = src.find('*/', i + 2)
            i = n if j < 0 else j + 2
            continue
        if c in '\'"':
            j = i + 1
            while j < n and src[j] != c and src[j] != '\n':
                j += 2 if src[j] == '\\' else 1
            out.append((i + 1, src[i + 1:j]))
            i, prev = j + 1, 'value'
            continue
        if c == '`':
            text, i = _scan_template(src, i + 1, out)
            prev = 'value'
            continue
        if c == '/':
            if prev == '' or prev in REGEX_PREFIX or prev in REGEX_KEYWORDS:
                j, in_class = i + 1, False
                while j < n and src[j] != '\n':
                    ch = src[j]
                    if ch == '\\':
                        j += 2
                        continue
                    if ch == '[':
                        in_class = True
                    elif ch == ']':
                        in_class = False
                    elif ch == '/' and not in_class:
                        break
                    j += 1
                j += 1
                while j < n and src[j].isalpha():
                    j += 1
                i, prev = j, 'value'
                continue
            i, prev = i + 1, '/'
            continue
        if c.isalnum() or c in '_$':
            j = i
            while j < n and (src[j].isalnum() or src[j] in '_$'):
                j += 1
            word = src[i:j]
            prev = word if word in REGEX_KEYWORDS else 'value'
            i = j
            continue
        if c == '{':
            depth += 1
        elif c == '}':
            if in_expr and depth == 0:
                return i + 1
            depth -= 1
        prev = c
        i += 1
    return i


def _scan_template(src, i, out):
    start, n, parts = i, len(src), []
    seg = i
    while i < n:
        c = src[i]
        if c == '\\':
            i += 2
            continue
        if c == '`':
            parts.append(src[seg:i])
            out.append((start, ''.join(parts)))
            return ''.join(parts), i + 1
        if src.startswith('${', i):
            parts.append(src[seg:i])
            j = _scan_code(src, i + 2, out, in_expr=True)
            parts.append(' ' + '\n' * src.count('\n', i, j))
            i = seg = j
            continue
        i += 1
    parts.append(src[seg:])
    out.append((start, ''.join(parts)))
    return ''.join(parts), n


# ── Disguise check ──────────────────────────────────────────────────────────
PATHLIKE = re.compile(
    r"[^\s'\"<>]*[/\\][^\s'\"<>]*"                                   # paths, URLs
    r"|[^\s'\"<>]+\.(?:html?|js|css|png|jpe?g|svg|json|mp3|wav)\b"   # file names
    r"|(?<![\w])[.#][A-Za-z_][\w-]*"                                 # .css-class / #id selectors
)
IDENTIFIER = re.compile(r'^[a-z0-9_$-]+$')


def visible_hits(text, line):
    """Yield (line, label, match, context) for forbidden words in visible text."""
    cleaned = PATHLIKE.sub(lambda m: re.sub(r'[^\n]', ' ', m.group(0)), text)
    for label, rx in FORBIDDEN:
        for m in rx.finditer(cleaned):
            hit_line = line + cleaned.count('\n', 0, m.start())
            ls = cleaned.rfind('\n', 0, m.start()) + 1
            le = cleaned.find('\n', m.end())
            le = len(cleaned) if le < 0 else le
            ctx = ' '.join(text[ls:le].split())
            if len(ctx) > 110:
                k = m.start() - ls
                ctx = ('…' if k > 50 else '') + ctx[max(0, k - 50):k + 60] + '…'
            yield hit_line, label, m.group(0), ctx


def scan_html(source, line_offset=0, depth=0):
    """Return [(line, label, match, context, where)] for one HTML document or fragment."""
    p = VisibleText(line_offset)
    try:
        p.feed(source)
        p.close()
    except Exception:  # malformed fragment: fall back to tag stripping
        p.chunks = [(line_offset + 1, re.sub(r'<[^>]*>', ' ', source))]
    hits = []
    for line, text in p.chunks:
        hits += [h + ('html' if depth == 0 else 'script',) for h in visible_hits(text, line)]
    for line, js in p.scripts:
        for off, s in js_strings(js):
            s_line = line + js.count('\n', 0, off)
            if not s.strip() or IDENTIFIER.match(s.strip()):
                continue  # internal identifier, key, class name
            if '<' in s and '>' in s and depth < 2:
                hits += [(l, lab, mt, ctx, 'script') for l, lab, mt, ctx, _ in
                         scan_html(s, s_line - 1, depth + 1)]
            else:
                hits += [h + ('script',) for h in visible_hits(s, s_line)]
    return hits


# ── Helpers for the wiring check ────────────────────────────────────────────
def line_of(text, index):
    return text.count('\n', 0, index) + 1


def find_array(text, name, path, failures):
    """Return (body, start_index) of `const NAME = [ ... ];`."""
    m = re.search(r'\bconst\s+' + re.escape(name) + r'\s*=\s*\[', text)
    if not m:
        failures.append(f'{path}: could not find `const {name} = [`. If the wording changed, update scripts/check-kids-courses.py.')
        return '', 0
    depth, i = 0, m.end() - 1
    for j in range(i, len(text)):
        if text[j] == '[':
            depth += 1
        elif text[j] == ']':
            depth -= 1
            if depth == 0:
                return text[i:j + 1], i
    failures.append(f'{path}: `const {name} = [` is never closed.')
    return '', 0


def hub_entries(text, name, path, failures):
    """Parse the objects in a hub array into dicts with href, progressKey, title, line."""
    body, start = find_array(text, name, path, failures)
    entries = []
    for m in re.finditer(r'\{(.*?)\n\s*\},?', body, re.S):
        obj = m.group(1)
        get = lambda k: (re.search(k + r"""\s*:\s*['"]([^'"]*)['"]""", obj) or [None, None])[1]
        entries.append({
            'title': get('title'),
            'href': get('href'),
            'key': get('progressKey'),
            'line': line_of(text, start + m.start()),
            'array': name,
        })
    if body and not entries:
        failures.append(f'{path}:{line_of(text, start)}: `{name}` has no entries the script can read.')
    return entries


def string_list(text):
    return re.findall(r"""['"]([^'"]+)['"]""", text)


def norm_href(href):
    return href.split('?')[0].split('#')[0].lstrip('/')


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--root', default=str(Path(__file__).resolve().parent.parent),
                    help='repository root to check (default: this repo)')
    ap.add_argument('--quiet', action='store_true',
                    help='print nothing when every check passes')
    args = ap.parse_args()
    root = Path(args.root).resolve()

    def read(rel):
        try:
            return (root / rel).read_text(encoding='utf-8')
        except FileNotFoundError:
            failures.append(f'{rel}: file not found.')
            return ''

    failures = []
    warnings = []

    # ── Collect the wiring ──────────────────────────────────────────────
    rayyan, raya, kids = read('rayyan.html'), read('raya.html'), read('kids.html')
    auth, dash, sw, index = read('assets/js/auth.js'), read('dashboard.html'), read('sw.js'), read('index.html')

    hubs = {
        'rayyan': {'path': 'rayyan.html', 'text': rayyan,
                   'courses': hub_entries(rayyan, 'ADVENTURES', 'rayyan.html', failures),
                   'games': hub_entries(rayyan, 'GAMES', 'rayyan.html', failures)},
        'raya': {'path': 'raya.html', 'text': raya,
                 'courses': hub_entries(raya, 'COURSES', 'raya.html', failures),
                 'games': hub_entries(raya, 'GAMES', 'raya.html', failures)},
    }

    try:
        manifest = json.loads(read('assets/courses.json') or '[]')
        manifest = manifest if isinstance(manifest, list) else manifest.get('courses', [])
        manifest_paths = {norm_href(c.get('path', '')) for c in manifest}
    except json.JSONDecodeError as e:
        failures.append(f'assets/courses.json: not valid JSON ({e}).')
        manifest_paths = set()

    # ── Which files are kids' files ─────────────────────────────────────
    hub_files = {}
    for kid, h in hubs.items():
        for e in h['courses'] + h['games']:
            if e['href'] and not re.match(r'^[a-z]+:', e['href']):
                hub_files.setdefault(norm_href(e['href']), []).append((kid, e))
    folder_files = set()
    for folder in KID_FOLDERS:
        for f in sorted((root / folder).glob('*.html')):
            rel = f.relative_to(root).as_posix()
            if rel not in FAMILY_GAMES and rel not in manifest_paths:
                folder_files.add(rel)
    for fam in FAMILY_GAMES:
        if not (root / fam).exists():
            warnings.append(f'{fam}: listed in FAMILY_GAMES but missing. Update the list in scripts/check-kids-courses.py.')
    kid_files = sorted(set(HUBS) | folder_files | {f for f in hub_files if (root / f).exists()})

    # ── 1. Disguise ─────────────────────────────────────────────────────
    disguise = []
    for rel in kid_files:
        text = read(rel)
        for line, label, match, ctx, where in scan_html(text):
            disguise.append(f'{rel}:{line}: {label} "{match}" ({where}) → {ctx}')
    disguise = sorted(set(disguise), key=lambda s: (s.split(':')[0], int(s.split(':')[1])))

    # ── 2. Wiring ───────────────────────────────────────────────────────
    wiring = []

    # Place lists
    m = re.search(r'PROGRESS_KEYS_BY_TYPE\s*=\s*\{(.*?)\};', auth, re.S)
    auth_keys = {}
    if m:
        for kid in hubs:
            km = re.search(kid + r'\s*:\s*\[(.*?)\]', m.group(1), re.S)
            auth_keys[kid] = set(string_list(km.group(1))) if km else None
    else:
        wiring.append('assets/js/auth.js: could not find `PROGRESS_KEYS_BY_TYPE = {...};`.')
    auth_line = line_of(auth, m.start()) if m else 0

    m = re.search(r'const\s+COURSE_NAMES\s*=\s*\{(.*?)\n\s*\};', dash, re.S)
    dash_keys = set(re.findall(r'^\s*([A-Za-z0-9_]+)\s*:', m.group(1), re.M)) if m else set()
    dash_line = line_of(dash, m.start()) if m else 0
    if not m:
        wiring.append('dashboard.html: could not find `const COURSE_NAMES = {...};`.')

    stars_keys, kids_cards, stars_line = {}, {}, {}
    for cm in re.finditer(r"href:\s*'(rayyan|raya)\.html'(.*?)cta:", kids, re.S):
        kid, block = cm.group(1), cm.group(2)
        sk = re.search(r'starsKeys:\s*\[(.*?)\]', block, re.S)
        stars_keys[kid] = set(string_list(sk.group(1))) if sk else None
        stars_line[kid] = line_of(kids, cm.start(2) + (sk.start() if sk else 0))
        kids_cards[kid] = (block, cm.start(2))

    m = re.search(r'const\s+PRECACHE\s*=\s*\[(.*?)\];', sw, re.S)
    precache = set(p.lstrip('/') for p in string_list(re.sub(r'/\*.*?\*/', '', m.group(1), flags=re.S))) if m else set()
    if not m:
        wiring.append('sw.js: could not find `const PRECACHE = [...];`.')
    pre_line = line_of(sw, m.start()) if m else 0

    all_hub_keys = set()
    for kid, h in hubs.items():
        hub_keys = set()
        for e in h['courses'] + h['games']:
            where = f"{h['path']}:{e['line']} ({e['array']} \"{e['title']}\")"
            if e['array'] in ('ADVENTURES', 'COURSES') and not e['key']:
                wiring.append(f'{where}: no progressKey. Every course on the map needs one.')
            if not e['href']:
                wiring.append(f'{where}: no href.')
                continue
            f = norm_href(e['href'])
            if re.match(r'^[a-z]+:', e['href']):
                continue
            if f in FAMILY_GAMES:
                wiring.append(f'{where}: {f} is a family/front-door game and must not be on a kids\' hub (CLAUDE.md).')
            if not (root / f).exists():
                wiring.append(f'{where}: links to {f}, which does not exist.')
                continue
            if f not in precache:
                wiring.append(f'{where}: {f} is not in PRECACHE in sw.js:{pre_line} (offline layer).')
            if e['key']:
                hub_keys.add(e['key'])
                if e['key'] not in read(f):
                    wiring.append(f"{where}: progressKey '{e['key']}' never appears in {f}. Typo?")
        all_hub_keys |= hub_keys

        for place, keys, line, fname in [
            (f'kids.html {kid.capitalize()} card starsKeys (the sumStars list)', stars_keys.get(kid), stars_line.get(kid, 0), 'kids.html'),
            (f'assets/js/auth.js PROGRESS_KEYS_BY_TYPE.{kid}', auth_keys.get(kid), auth_line, 'assets/js/auth.js'),
        ]:
            if keys is None:
                wiring.append(f'{fname}:{line}: could not find the {kid} list for {place}.')
                continue
            for k in sorted(hub_keys - keys):
                wiring.append(f"{fname}:{line}: '{k}' (on {h['path']}) is missing from {place}.")
            for k in sorted(keys - hub_keys):
                wiring.append(f"{fname}:{line}: '{k}' is in {place} but on no {h['path']} card. Stale key?")
    for k in sorted(all_hub_keys - dash_keys):
        wiring.append(f"dashboard.html:{dash_line}: '{k}' is missing from COURSE_NAMES (parent dashboard).")
    for k in sorted(dash_keys - all_hub_keys):
        wiring.append(f"dashboard.html:{dash_line}: '{k}' is in COURSE_NAMES but on no hub card. Stale key?")

    for f in sorted(folder_files - set(hub_files)):
        wiring.append(f'{f}: kids\' course file is not linked from rayyan.html or raya.html. Wire it in, or list it in assets/courses.json / FAMILY_GAMES if it is not a kids\' course.')
    for f in sorted(precache):
        if not (root / f).exists():
            wiring.append(f'sw.js:{pre_line}: PRECACHE lists /{f}, which does not exist.')
        if f in FAMILY_GAMES:
            wiring.append(f'sw.js:{pre_line}: PRECACHE lists the family game /{f}; CLAUDE.md keeps family games out of sw.js.')

    # ── 3. Counts ───────────────────────────────────────────────────────
    n = {
        'rayyan_courses': len(hubs['rayyan']['courses']), 'rayyan_games': len(hubs['rayyan']['games']),
        'raya_courses': len(hubs['raya']['courses']), 'raya_games': len(hubs['raya']['games']),
    }
    unique_games = {norm_href(e['href'] or '') for h in hubs.values() for e in h['games']}
    n['all_games'] = len(unique_games)

    def expect(path, text, pattern, want, what):
        found = list(re.finditer(pattern, text))
        if not found:
            wiring.append(f'{path}: could not find the {what} count (pattern {pattern!r}). If the wording changed, update scripts/check-kids-courses.py.')
        for fm in found:
            got = int(fm.group(1))
            if got != want:
                wiring.append(f'{path}:{line_of(text, fm.start())}: says "{fm.group(0).strip()}" but {what} is {want}.')

    expect('rayyan.html', rayyan, r'/\s*(\d+)\s+petualangan selesai', n['rayyan_courses'], 'the number of rayyan.html ADVENTURES')
    expect('rayyan.html', rayyan, r'(\d+)\s+game tersedia', n['rayyan_games'], 'the number of rayyan.html GAMES')
    expect('raya.html', raya, r'(\d+)\s+kursus\b', n['raya_courses'], 'the number of raya.html COURSES')
    expect('raya.html', raya, r'(\d+)\s+game\b', n['raya_games'], 'the number of raya.html GAMES')
    for kid, (block, off) in kids_cards.items():
        cw = 'petualangan' if kid == 'rayyan' else 'kursus'
        for pat, key, what in [(r'(\d+)\s+' + cw, f'{kid}_courses', f'the number of {kid}.html course cards'),
                               (r'(\d+)\s+game', f'{kid}_games', f'the number of {kid}.html GAMES')]:
            fm = re.search(pat, block)
            if not fm:
                wiring.append(f'kids.html: could not find the {kid.capitalize()} "{pat}" pill.')
            elif int(fm.group(1)) != n[key]:
                wiring.append(f'kids.html:{line_of(kids, off + fm.start())}: {kid.capitalize()} pill says "{fm.group(0)}" but {what} is {n[key]}.')
    for kid in hubs:
        if kid not in kids_cards:
            wiring.append(f"kids.html: could not find the {kid.capitalize()} card (href: '{kid}.html').")
    expect('index.html', index, r'(\d+)\s+petualangan Rayyan', n['rayyan_courses'], 'the number of rayyan.html ADVENTURES')
    expect('index.html', index, r'(\d+)\s+kursus Raya', n['raya_courses'], 'the number of raya.html COURSES')
    expect('index.html', index, r'(\d+)\s+game seru', n['all_games'], 'the number of different game files on both hubs')
    total = n['rayyan_courses'] + n['raya_courses'] + n['all_games']
    for fm in re.finditer(r'<b>(\d+)\+</b><span>kids', index):
        if int(fm.group(1)) < total - 5:
            warnings.append(f'index.html:{line_of(index, fm.start())}: About says "{fm.group(1)}+" kids\' adventures & games; there are {total} now (not a failure, "N+" is still true).')

    # ── Report ──────────────────────────────────────────────────────────
    wiring = failures + wiring
    bad = len(disguise) + len(wiring)
    if args.quiet and not bad:
        return 0
    print(f"Kids' course check: {len(kid_files)} files, "
          f"{len(all_hub_keys)} progress keys, root {root}")
    print(f'\nDisguise (visible text): {"PASS" if not disguise else f"{len(disguise)} FAIL"}')
    for d in disguise:
        print('  ' + d)
    print(f'\nWiring and counts: {"PASS" if not wiring else f"{len(wiring)} FAIL"}')
    for w in wiring:
        print('  ' + w)
    if warnings:
        print('\nWarnings (do not fail the check):')
        for w in warnings:
            print('  ' + w)
    print(f"\n{'OK: all checks passed.' if not bad else f'FAILED: {bad} problem(s). Fix them, or if a rule is wrong, change it in CLAUDE.md and this script together.'}")
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
