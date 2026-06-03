/* ─── Rayyan Progress Sync ──────────────────────────────────────────────────
   Firebase Firestore sync for Rayyan's course progress.

   SETUP (one-time, by Adhi):
   1. Go to https://console.firebase.google.com
   2. Create a project → Add a web app → copy the firebaseConfig values below
   3. In the Firebase console: Build → Firestore Database → Create database
      Choose "Start in test mode" → pick a region close to Indonesia (asia-southeast1)
   4. Replace every "REPLACE_..." value below with your actual config
   ────────────────────────────────────────────────────────────────────────── */

const SYNC = (() => {

  /* ── Firebase config – fill in after creating your project ── */
  const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyAGJbGZi8ifWGtKCe9wXA1_CFlYcr3Kthc",
    authDomain:        "learn-with-adhi.firebaseapp.com",
    projectId:         "learn-with-adhi",
    storageBucket:     "learn-with-adhi.firebasestorage.app",
    messagingSenderId: "378533937502",
    appId:             "1:378533937502:web:19db096311e7e7dc184fcf",
  };

  const PROGRESS_KEYS = [
    'rayyanMath', 'rayyanMath3', 'rayyanMath4', 'rayyanMath5',
    'rayyanMath6', 'rayyanMath7', 'rayyanCoding', 'rayyanCoding2',
    'rayyanCoding3', 'rayyanCoding4', 'rayyanCoding5',
  ];

  const FAMILY_CODE_STORAGE_KEY = 'lwa:familyCode';

  let db = null;
  let _ready = false;

  /* ── Public: is Firebase configured (not placeholder)? ── */
  function isConfigured() {
    return !FIREBASE_CONFIG.apiKey.startsWith('REPLACE');
  }

  function getFamilyCode() {
    return localStorage.getItem(FAMILY_CODE_STORAGE_KEY) || '';
  }

  function setFamilyCode(code) {
    localStorage.setItem(FAMILY_CODE_STORAGE_KEY, code.trim().toLowerCase());
  }

  /* ── Init Firebase ── */
  function init() {
    if (!isConfigured() || typeof firebase === 'undefined') return false;
    try {
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.firestore();
      _ready = true;
      return true;
    } catch (e) {
      console.warn('[sync] Firebase init failed:', e);
      return false;
    }
  }

  /* ── Merge two progress objects – always keep the best stars ── */
  function mergeProgress(local, remote) {
    if (!remote) return local;
    const result = { ...local };
    result.totalStars = Math.max(local.totalStars || 0, remote.totalStars || 0);
    const lp = local.progress || {};
    const rp = remote.progress || {};
    const allKeys = new Set([...Object.keys(lp), ...Object.keys(rp)]);
    result.progress = {};
    for (const k of allKeys) {
      result.progress[k] = { stars: Math.max((lp[k] || {}).stars || 0, (rp[k] || {}).stars || 0) };
    }
    return result;
  }

  /* ── Pull from Firestore → localStorage ── */
  async function pull() {
    if (!_ready || !getFamilyCode()) return false;
    const snap = await db.collection('families').doc(getFamilyCode()).get();
    if (!snap.exists) return false;
    const data = snap.data();
    let changed = false;
    for (const key of PROGRESS_KEYS) {
      if (!data[key]) continue;
      const local = JSON.parse(localStorage.getItem(key) || '{}');
      const merged = mergeProgress(local, data[key]);
      const mergedStr = JSON.stringify(merged);
      if (mergedStr !== JSON.stringify(local)) {
        localStorage.setItem(key, mergedStr);
        changed = true;
      }
    }
    return changed;
  }

  /* ── Push localStorage → Firestore ── */
  async function push() {
    if (!_ready || !getFamilyCode()) return false;
    const data = { lastSync: new Date().toISOString() };
    for (const key of PROGRESS_KEYS) {
      const val = localStorage.getItem(key);
      if (val) {
        try { data[key] = JSON.parse(val); } catch (_) {}
      }
    }
    await db.collection('families').doc(getFamilyCode()).set(data, { merge: true });
    return true;
  }

  /* ── Full sync: pull then push, call onStatus with progress ── */
  async function sync(onStatus) {
    if (!_ready) { onStatus?.('offline'); return false; }
    if (!getFamilyCode()) { onStatus?.('no-code'); return false; }
    try {
      onStatus?.('syncing');
      const changed = await pull();
      await push();
      onStatus?.('synced', changed);
      return changed;
    } catch (e) {
      console.warn('[sync] Sync failed:', e);
      onStatus?.('error');
      return false;
    }
  }

  return { init, isConfigured, getFamilyCode, setFamilyCode, sync, PROGRESS_KEYS };
})();
