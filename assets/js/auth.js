/* ─── Auth & Kid Management ────────────────────────────────────────────────
   Firebase Auth (email/password) + Firestore kid profiles.

   Firestore structure:
     /accounts/{uid}              – parent profile
     /accounts/{uid}/kids/{kidId} – kid profile + progress
   ────────────────────────────────────────────────────────────────────────── */

const AUTH = (() => {

  const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyAGJbGZi8ifWGtKCe9wXA1_CFlYcr3Kthc",
    authDomain:        "learn-with-adhi.firebaseapp.com",
    projectId:         "learn-with-adhi",
    storageBucket:     "learn-with-adhi.firebasestorage.app",
    messagingSenderId: "378533937502",
    appId:             "1:378533937502:web:19db096311e7e7dc184fcf",
  };

  const PROGRESS_KEYS_BY_TYPE = {
    rayyan: [
      'rayyanMath','rayyanMath3','rayyanMath4','rayyanMath5',
      'rayyanMath6','rayyanMath7','rayyanCoding','rayyanCoding2',
      'rayyanCoding3','rayyanCoding4','rayyanCoding5','rayyanBridge',
    ],
    raya: ['rayaMath','rayaVisual','rayaLiteracy'],
  };

  const HUB_BY_TYPE = { rayyan: '/rayyan.html', raya: '/raya.html' };
  const ACTIVE_KID_KEY = 'lwa:activeKid';

  let _auth = null;
  let _db   = null;
  let _user = null;

  /* ── Init ── */
  function init() {
    if (typeof firebase === 'undefined') return false;
    try {
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      _auth = firebase.auth();
      _db   = firebase.firestore();
      _auth.onAuthStateChanged(u => { _user = u; });
      return true;
    } catch (e) {
      console.warn('[auth] init failed:', e);
      return false;
    }
  }

  function getUser()    { return _user; }
  function isLoggedIn() { return !!_user; }
  function onAuthChange(cb) { if (_auth) _auth.onAuthStateChanged(cb); }

  /* ── Account ── */
  async function signUp(email, password, name) {
    const cred = await _auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });
    await _db.collection('accounts').doc(cred.user.uid).set({
      name, email, createdAt: new Date().toISOString(),
    });
    _user = cred.user;
    return cred.user;
  }

  async function signIn(email, password) {
    const cred = await _auth.signInWithEmailAndPassword(email, password);
    _user = cred.user;
    return cred.user;
  }

  async function signOut() {
    localStorage.removeItem(ACTIVE_KID_KEY);
    return _auth.signOut();
  }

  async function resetPassword(email) {
    return _auth.sendPasswordResetEmail(email);
  }

  /* ── Active kid (localStorage) ── */
  function setActiveKid(kidId) { localStorage.setItem(ACTIVE_KID_KEY, kidId); }
  function getActiveKid()      { return localStorage.getItem(ACTIVE_KID_KEY) || ''; }

  /* ── Kids ── */
  async function getKids() {
    if (!_user) return [];
    const snap = await _db.collection('accounts').doc(_user.uid)
      .collection('kids').orderBy('createdAt').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function addKid(name, emoji, progressType) {
    if (!_user) throw new Error('Not logged in');
    const ref = _db.collection('accounts').doc(_user.uid).collection('kids').doc();
    await ref.set({ name, emoji, progressType, createdAt: new Date().toISOString(), lastActive: null });
    return ref.id;
  }

  async function deleteKid(kidId) {
    if (!_user) throw new Error('Not logged in');
    await _db.collection('accounts').doc(_user.uid).collection('kids').doc(kidId).delete();
  }

  /* ── Progress merge (take best stars per chapter) ── */
  function _mergeProgress(local, remote) {
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

  /* ── Pull Firestore → localStorage for a kid ── */
  async function pullKidProgress(kidId) {
    if (!_user || !kidId) return false;
    const snap = await _db.collection('accounts').doc(_user.uid)
      .collection('kids').doc(kidId).get();
    if (!snap.exists) return false;
    const stored = snap.data().progress || {};
    let changed = false;
    for (const [key, remote] of Object.entries(stored)) {
      const local  = JSON.parse(localStorage.getItem(key) || '{}');
      const merged = _mergeProgress(local, remote);
      const str    = JSON.stringify(merged);
      if (str !== JSON.stringify(local)) { localStorage.setItem(key, str); changed = true; }
    }
    return changed;
  }

  /* ── Push localStorage → Firestore for a kid ── */
  async function pushKidProgress(kidId, progressType) {
    if (!_user || !kidId) return false;
    const keys = PROGRESS_KEYS_BY_TYPE[progressType] || [];
    const progress = {};
    for (const key of keys) {
      const val = localStorage.getItem(key);
      if (val) { try { progress[key] = JSON.parse(val); } catch (_) {} }
    }
    await _db.collection('accounts').doc(_user.uid)
      .collection('kids').doc(kidId).set(
        { progress, lastActive: new Date().toISOString() },
        { merge: true }
      );
    return true;
  }

  /* ── Full sync for the active kid ── */
  async function syncActiveKid(onStatus) {
    if (!_user) { onStatus?.('offline'); return false; }
    const kidId = getActiveKid();
    if (!kidId) { onStatus?.('no-kid'); return false; }
    try {
      onStatus?.('syncing');
      const snap = await _db.collection('accounts').doc(_user.uid)
        .collection('kids').doc(kidId).get();
      if (!snap.exists) { onStatus?.('no-kid'); return false; }
      const { progressType } = snap.data();
      const changed = await pullKidProgress(kidId);
      await pushKidProgress(kidId, progressType || 'rayyan');
      onStatus?.('synced', changed);
      return changed;
    } catch (e) {
      console.warn('[auth] syncActiveKid failed:', e);
      onStatus?.('error');
      return false;
    }
  }

  return {
    init, getUser, isLoggedIn, onAuthChange,
    signUp, signIn, signOut, resetPassword,
    setActiveKid, getActiveKid,
    getKids, addKid, deleteKid,
    pullKidProgress, pushKidProgress, syncActiveKid,
    PROGRESS_KEYS_BY_TYPE, HUB_BY_TYPE,
  };
})();
