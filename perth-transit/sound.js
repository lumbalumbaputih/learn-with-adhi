// sound.js: little sounds and an optional voice for Perth Train Spotter. Everything is made in the
// browser (Web Audio tones, the device's own speech voices): no audio files, nothing downloaded.
// Sound effects are on and the voice is off by default; both choices are kept on this device only.
const KEY = 'ptmKids';

export function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { sound: s.sound !== false, voice: s.voice === true };
  } catch { return { sound: true, voice: false }; }
}

export function saveSettings(s) {
  try { localStorage.setItem(KEY, JSON.stringify({ sound: s.sound, voice: s.voice })); } catch { /* private mode: works for this visit */ }
}

export class Sound {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this._utter = null;
  }

  /** Browsers only allow audio after a tap or key press, so this runs on every one (it is cheap). */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  _tone(freq, start, dur, { type = 'sine', gain = 0.16, slide = 0 } = {}) {
    const c = this.ctx, t = c.currentTime + start;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** pop (pick a train), whistle (a train leaves), horn (the ferry leaves), chime (a station), yay (end of the line). */
  play(name) {
    if (!this.settings.sound || !this.ctx) return;
    if (this.ctx.state !== 'running') { // the first tap is still waking the audio up: play once it is
      this.ctx.resume().then(() => { if (this.ctx.state === 'running') this._play(name); }).catch(() => {});
      return;
    }
    this._play(name);
  }

  _play(name) {
    switch (name) {
      case 'pop': this._tone(620, 0, 0.12, { type: 'triangle', gain: 0.12, slide: 1.6 }); break;
      case 'chime': this._tone(659.25, 0, 0.55); this._tone(523.25, 0.3, 0.75); break; // ding-dong
      case 'whistle': // toot toot: two short chords
        for (const at of [0, 0.32]) { this._tone(466.16, at, 0.24, { type: 'triangle', gain: 0.1 }); this._tone(587.33, at, 0.24, { type: 'triangle', gain: 0.08 }); }
        break;
      case 'horn': this._tone(174.61, 0, 0.9, { type: 'sawtooth', gain: 0.04 }); this._tone(220, 0, 0.9, { gain: 0.08 }); break;
      case 'yay': [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this._tone(f, i * 0.11, 0.38, { type: 'triangle', gain: 0.12 })); break;
      default: break;
    }
  }

  get canSpeak() { return typeof window !== 'undefined' && 'speechSynthesis' in window; }

  /**
   * An English voice installed on this device (English (Australia) first), or null. Online voices
   * (localService false, e.g. Edge's "Online (Natural)" ones) are never used: they would send the
   * words to a speech service, and the grown-ups box promises nothing leaves the device.
   */
  localVoice() {
    if (!this.canSpeak) return null;
    const local = window.speechSynthesis.getVoices().filter((x) => x.localService);
    return local.find((x) => /^en[-_]AU$/i.test(x.lang)) || local.find((x) => /^en/i.test(x.lang)) || null;
  }

  /** Reads a short line aloud when the voice is switched on and the device has an English voice of its own. */
  speak(text) {
    if (!this.settings.voice || !this.canSpeak) return;
    const synth = window.speechSynthesis;
    if (!synth.getVoices().length) { // the list fills in a moment after the page loads: say the latest line then
      this._pending = text;
      if (!this._waiting) {
        this._waiting = true;
        const retry = () => { if (!this._waiting) return; this._waiting = false; const t = this._pending; this._pending = null; if (t && synth.getVoices().length) this.speak(t); };
        synth.addEventListener('voiceschanged', retry, { once: true });
        setTimeout(retry, 1500); // some browsers never fire voiceschanged
      }
      return;
    }
    const v = this.localVoice();
    if (!v) return; // no English voice on this device: stay quiet rather than use an online one
    const u = new SpeechSynthesisUtterance(text.replace(/\p{Extended_Pictographic}/gu, '').trim());
    u.lang = v.lang;
    u.voice = v;
    u.rate = 0.95;
    this._utter = u; // keep a reference: some browsers drop an utterance that is garbage-collected mid-sentence
    synth.cancel();
    setTimeout(() => synth.speak(u), 60); // Chrome on Android can swallow a speak() that follows cancel() at once
  }

  stopSpeaking() { if (this.canSpeak) window.speechSynthesis.cancel(); }
}
