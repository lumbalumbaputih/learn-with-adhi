#!/usr/bin/env python3
"""Record the spoken lines of Pawai Hewan (Raya's pattern game) as audio clips.

The game keeps every line it speaks in the <script id="voiceLines"> block of
courses/games/raya-pawai-v1.html. This script turns each line into an MP3 in
assets/audio/pawai/ and writes assets/audio/pawai/manifest.json. The game plays a
clip only when the manifest says it was recorded from the line's current text, so
an edited line falls back to the device voice until this script is run again.

Engines
  google  Google Cloud Text-to-Speech (official API, needs a key; the monthly free
          tier covers this game many times over: ~3,300 characters in total).
          Key: set GOOGLE_TTS_API_KEY, or run in a cloud session whose environment
          adds the X-Goog-Api-Key header for texttospeech.googleapis.com.
  edge    Microsoft Edge read-aloud voices via the edge-tts package
          (pip install edge-tts). Unofficial: not licensed for this use, may stop working.

Usage
  python3 scripts/pawai-voice-build.py voices                       # list Google id-ID voices
  python3 scripts/pawai-voice-build.py sample --out DIR --voice A --voice B [--text "..."]
  python3 scripts/pawai-voice-build.py build --voice id-ID-Chirp3-HD-Aoede [--rate 0.9] [--pitch 0]
  add --engine edge for the Microsoft voices (e.g. --voice id-ID-GadisNeural)

  build only records lines that are new or changed, unless the voice/engine/rate/pitch
  changed (then everything is re-recorded) or --force is given. Clips for lines that no
  longer exist are deleted.

  --rate: 1.0 = normal speed. --pitch: semitones for google, Hz for edge.
"""
import argparse
import base64
import datetime
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAME = os.path.join(ROOT, 'courses', 'games', 'raya-pawai-v1.html')
OUT = os.path.join(ROOT, 'assets', 'audio', 'pawai')
GOOGLE = 'https://texttospeech.googleapis.com/v1'
SAMPLE = 'Halo Raya! Ayo ikut pawai hewan bersama Kiki! Kucing, katak, kucing, katak... selanjutnya siapa? Hore! Pintar sekali!'


def lines():
    html = open(GAME, encoding='utf-8').read()
    m = re.search(r'<script type="application/json" id="voiceLines">(.*?)</script>', html, re.S)
    if not m:
        sys.exit('voiceLines block not found in ' + GAME)
    data = json.loads(m.group(1))
    for k, v in data.items():
        if not re.fullmatch(r'[a-z0-9_]+', k):
            sys.exit('bad line id: ' + k)
        if any(ord(ch) > 0xFFFF for ch in v):
            sys.exit('line %s has a character outside the BMP (the game hash would not match)' % k)
    return data


def line_hash(text):
    """Same djb2 hash as lineHash() in the game (UTF-16 code units == code points for BMP text)."""
    h = 5381
    for ch in text:
        h = (h * 33 + ord(ch)) & 0xFFFFFFFF
    return '%08x' % h


def _google_headers():
    h = {'Content-Type': 'application/json; charset=utf-8'}
    key = os.environ.get('GOOGLE_TTS_API_KEY')
    if key:
        h['X-Goog-Api-Key'] = key
    return h


def _google_call(url, body=None):
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None,
                                 headers=_google_headers(), method='POST' if body is not None else 'GET')
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        detail = e.read().decode('utf-8', 'replace')
        try:
            detail = json.loads(detail)['error']['message']
        except Exception:
            pass
        sys.exit('Google Text-to-Speech said %s: %s' % (e.code, detail))


def google_voices():
    return _google_call(GOOGLE + '/voices?languageCode=id-ID').get('voices', [])


def google_synth(text, voice, rate, pitch):
    cfg = {'audioEncoding': 'MP3', 'sampleRateHertz': 24000}
    if rate and abs(rate - 1.0) > 1e-6:
        cfg['speakingRate'] = rate
    if pitch:
        cfg['pitch'] = pitch
    body = {'input': {'text': text}, 'voice': {'languageCode': '-'.join(voice.split('-')[:2]), 'name': voice}, 'audioConfig': cfg}
    return base64.b64decode(_google_call(GOOGLE + '/text:synthesize', body)['audioContent'])


def edge_synth(text, voice, rate, pitch):
    import asyncio
    ca = os.environ.get('SSL_CERT_FILE')
    if ca and os.path.exists(ca):          # trust a proxy CA when one is configured (verification stays on)
        import certifi
        certifi.where = lambda: ca
    import edge_tts
    pct = int(round((rate - 1.0) * 100))
    hz = int(round(pitch or 0))

    async def go():
        chunks = []
        com = edge_tts.Communicate(text, voice, rate='%+d%%' % pct, pitch='%+dHz' % hz)
        async for ch in com.stream():
            if ch['type'] == 'audio':
                chunks.append(ch['data'])
        return b''.join(chunks)
    return asyncio.run(go())


def synth(engine, text, voice, rate, pitch):
    return (google_synth if engine == 'google' else edge_synth)(text, voice, rate, pitch)


def cmd_voices(a):
    for v in sorted(google_voices(), key=lambda v: v['name']):
        print('%-32s %-7s %s' % (v['name'], v.get('ssmlGender', ''), ','.join(v.get('languageCodes', []))))


def cmd_sample(a):
    os.makedirs(a.out, exist_ok=True)
    for v in a.voice:
        path = os.path.join(a.out, '%s.mp3' % v)
        with open(path, 'wb') as f:
            f.write(synth(a.engine, a.text or SAMPLE, v, a.rate, a.pitch))
        print('wrote', path)


def cmd_build(a):
    L = lines()
    os.makedirs(OUT, exist_ok=True)
    mpath = os.path.join(OUT, 'manifest.json')
    old = {}
    if os.path.exists(mpath):
        old = json.load(open(mpath, encoding='utf-8'))
    settings = {'engine': a.engine, 'voice': a.voice[0], 'rate': a.rate, 'pitch': a.pitch}
    same = all(old.get(k) == v for k, v in settings.items())
    clips = dict(old.get('clips', {})) if (same and not a.force) else {}
    todo = [k for k, t in L.items() if clips.get(k) != line_hash(t) or not os.path.exists(os.path.join(OUT, k + '.mp3'))]
    chars = sum(len(L[k]) for k in todo)
    print('%d lines, %d to record (%d characters), voice %s via %s' % (len(L), len(todo), chars, a.voice[0], a.engine))
    for i, k in enumerate(todo, 1):
        audio = synth(a.engine, L[k], a.voice[0], a.rate, a.pitch)
        if len(audio) < 500:
            sys.exit('suspiciously small audio for %s (%d bytes); stopping' % (k, len(audio)))
        tmp = os.path.join(OUT, k + '.mp3.tmp')
        with open(tmp, 'wb') as f:
            f.write(audio)
        os.replace(tmp, os.path.join(OUT, k + '.mp3'))
        clips[k] = line_hash(L[k])
        print('  [%d/%d] %s: %s' % (i, len(todo), k, L[k]))
        time.sleep(0.15)
    for fn in os.listdir(OUT):
        if fn.endswith('.mp3') and fn[:-4] not in L:
            os.remove(os.path.join(OUT, fn))
            print('  removed stale clip', fn)
    clips = {k: clips[k] for k in L if k in clips}
    man = dict(settings, generated=datetime.date.today().isoformat(), clips=clips)
    with open(mpath, 'w', encoding='utf-8') as f:
        json.dump(man, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write('\n')
    print('manifest: %d clips' % len(clips))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('command', choices=['voices', 'sample', 'build'])
    p.add_argument('--engine', choices=['google', 'edge'], default='google')
    p.add_argument('--voice', action='append', default=[])
    p.add_argument('--rate', type=float, default=1.0)
    p.add_argument('--pitch', type=float, default=0.0)
    p.add_argument('--text')
    p.add_argument('--out')
    p.add_argument('--force', action='store_true')
    a = p.parse_args()
    if a.command == 'sample' and (not a.out or not a.voice):
        p.error('sample needs --out and at least one --voice')
    if a.command == 'build' and len(a.voice) != 1:
        p.error('build needs exactly one --voice')
    {'voices': cmd_voices, 'sample': cmd_sample, 'build': cmd_build}[a.command](a)


if __name__ == '__main__':
    main()
