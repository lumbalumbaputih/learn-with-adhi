// Favourite places stay on this browser/device, separately from the timetable.
import { h } from './util.js?v=1.9.1';

export const PLACE_KEY = 'ptm-favourite-places-v1';
const validPoint = (p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lon)
  && p.lat >= -36 && p.lat <= -28 && p.lon >= 112 && p.lon <= 120;

export class PlaceStore {
  constructor(storage) {
    try { this.storage = storage === undefined ? globalThis.localStorage : storage; } catch { this.storage = null; }
    this.reload();
  }
  reload() {
    this.places = [];
    try {
      const data = JSON.parse(this.storage?.getItem(PLACE_KEY) || 'null');
      if (data?.version !== 1 || !Array.isArray(data.places)) return;
      const ids = new Set(), names = new Set();
      this.places = data.places.filter((p) => {
        if (!validPoint(p) || typeof p.id !== 'string' || !p.id || typeof p.name !== 'string'
            || !p.name.trim() || p.name.length > 40 || ids.has(p.id) || names.has(p.name.trim().toLowerCase())) return false;
        ids.add(p.id); names.add(p.name.trim().toLowerCase()); return true;
      }).map(({ id, name, lat, lon }) => ({ id, name: name.trim(), lat, lon }));
    } catch { /* unavailable or damaged storage must not prevent the timetable opening */ }
  }
  list() { return this.places.map((p) => ({ ...p })); }
  write(places) {
    try {
      if (!this.storage) throw new Error('Storage unavailable');
      this.storage.setItem(PLACE_KEY, JSON.stringify({ version: 1, places }));
    } catch { throw new Error('Could not save changes on this device. Check that browser storage is enabled, then try again.'); }
    this.places = places;
  }
  save({ id, name, lat, lon }) {
    name = String(name || '').trim();
    if (!name || name.length > 40) throw new Error('Enter a place name between 1 and 40 characters.');
    if (!validPoint({ lat, lon })) throw new Error('Choose a location in the Perth area.');
    if (id && !this.places.some((p) => p.id === id)) throw new Error('This place was removed. Add it again instead.');
    if (this.places.some((p) => p.id !== id && p.name.toLowerCase() === name.toLowerCase())) throw new Error('A place with this name already exists. Choose another name or edit that place.');
    const place = { id: id || crypto.randomUUID(), name, lat, lon };
    this.write(id ? this.places.map((p) => p.id === id ? place : p) : [...this.places, place]);
    return place;
  }
  remove(id) { this.write(this.places.filter((p) => p.id !== id)); }
}

export class FavouritePlaces {
  constructor({ view, onChange, onOpen, onMessage }) {
    this.store = new PlaceStore();
    this.view = view; this.onChange = onChange; this.onOpen = onOpen; this.onMessage = onMessage;
    this.dialog = h('dialog', { class: 'about place-dialog', 'aria-labelledby': 'place-title' });
    this.title = h('h2', { id: 'place-title' });
    this.name = h('input', { id: 'place-name', name: 'name', required: true, maxlength: 40, autocomplete: 'off', list: 'place-names' });
    this.source = h('select', { id: 'place-source', name: 'source' });
    this.pointText = h('p', { class: 'fine', id: 'place-point' });
    this.error = h('p', { class: 'place-error', role: 'alert', hidden: true });
    this.saveButton = h('button', { class: 'btn', type: 'submit', text: 'Save place' });
    this.deleteButton = h('button', { class: 'btn btn-quiet', type: 'button', text: 'Delete place', onclick: () => this.remove() });
    const form = h('form', { class: 'place-form', onsubmit: (e) => { e.preventDefault(); this.save(); } },
      this.title,
      h('label', { for: 'place-name', text: 'Place name' }), this.name,
      h('datalist', { id: 'place-names' }, h('option', { value: 'Home' }), h('option', { value: 'Work' })),
      h('label', { for: 'place-source', text: 'Location to save' }), this.source,
      this.pointText,
      h('p', { class: 'fine', text: 'Saved only in this browser on this device. Clearing browser data removes your places.' }),
      this.error,
      h('div', { class: 'btn-row place-actions' }, this.deleteButton,
        h('button', { class: 'btn btn-quiet', type: 'button', text: 'Cancel', onclick: () => this.dialog.close() }), this.saveButton));
    this.dialog.append(form); document.body.append(this.dialog);
    this.source.addEventListener('change', () => this.describePoint());
    this.dialog.addEventListener('close', () => { this.session = null; });
    window.addEventListener('storage', (e) => {
      if (e.key === PLACE_KEY || e.key === null) { this.store.reload(); this.onChange(this.store.list(), false); }
    });
  }
  list() { return this.store.list(); }
  open(id) { const place = this.list().find((p) => p.id === id); if (place) this.onOpen(place); }
  edit({ place = null, name = '', point = null } = {}) {
    this.session = {}; this.editing = place;
    this.savedPoint = place || point;
    const centre = this.view(); this.centre = { lat: centre.lat, lon: centre.lon };
    this.title.textContent = place ? 'Edit favourite place' : 'Add favourite place';
    this.name.value = place?.name || name;
    this.source.replaceChildren();
    if (this.savedPoint) this.source.append(h('option', { value: 'saved', text: place ? 'Keep saved location' : 'Selected stop or station' }));
    this.source.append(h('option', { value: 'centre', text: 'Map centre' }), h('option', { value: 'current', text: 'My current location' }));
    this.source.value = this.savedPoint ? 'saved' : 'centre';
    this.deleteButton.hidden = !place; this.error.hidden = true;
    this.name.disabled = false; this.source.disabled = false;
    this.saveButton.disabled = false; this.saveButton.textContent = 'Save place';
    this.describePoint(); this.dialog.showModal(); this.name.focus(); this.name.select();
  }
  describePoint() {
    const point = this.source.value === 'saved' ? this.savedPoint : this.centre;
    this.pointText.textContent = this.source.value === 'current'
      ? 'Your browser will ask for location access when you save.'
      : `${this.source.value === 'centre' ? 'Pan and zoom to your place before opening this form. Map centre' : 'Location'}: ${point.lat.toFixed(5)}, ${point.lon.toFixed(5)}.`;
  }
  showError(error) { this.error.textContent = error.message; this.error.hidden = false; }
  async save() {
    const session = this.session;
    const source = this.source.value;
    this.error.hidden = true; this.saveButton.disabled = true; this.saveButton.textContent = 'Saving…';
    this.name.disabled = true; this.source.disabled = true;
    try {
      let point = source === 'saved' ? this.savedPoint : this.centre;
      const name = this.name.value, id = this.editing?.id;
      if (source === 'current') {
        if (!navigator.geolocation) throw new Error('Location is unavailable in this browser. Use the map centre instead.');
        point = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
          () => reject(new Error('Could not get your location. Check location access or use the map centre instead.')),
          { timeout: 10000, maximumAge: 60000 }));
      }
      if (!this.dialog.open || this.session !== session) return;
      const place = this.store.save({ id, name, lat: point.lat, lon: point.lon });
      this.dialog.close(); this.onChange(this.list(), true); this.onMessage(`${place.name} saved.`);
    } catch (error) { if (this.dialog.open && this.session === session) this.showError(error); }
    finally {
      if (this.session === session) {
        this.name.disabled = false; this.source.disabled = false;
        this.saveButton.disabled = false; this.saveButton.textContent = 'Save place';
        if (!this.error.hidden) this.name.focus();
      }
    }
  }
  remove() {
    try {
      const name = this.editing.name;
      this.store.remove(this.editing.id); this.dialog.close(); this.onChange(this.list(), true); this.onMessage(`${name} removed.`);
    } catch (error) { this.showError(error); }
  }
}
