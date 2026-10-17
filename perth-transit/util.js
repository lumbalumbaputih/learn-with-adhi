// util.js: small DOM and text helpers shared by the interface modules.
import { chipColors, chipLabel } from './colors.js?v=1.7';

/** Create an element. attrs: class, text, dataset keys as data-*, on* handlers, style object. */
export function h(tag, attrs, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k === 'style') Object.assign(n.style, v);
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c !== null && c !== undefined && c !== false) n.append(c);
  return n;
}

export const fmtN = (n) => n.toLocaleString('en-AU');

/** "Perth Stn" becomes "Perth Station". */
export const prettyName = (s) => s
  .replace(/\bStn\b/g, 'Station')
  .replace(/\bMciver\b/g, 'McIver')
  .replace(/\s+Cat Id \d+$/i, '');   // feed suffix that only tells same-named stops apart; the stop code does that here

/** A route chip: bus number, or coloured line name. */
export function chip(route, { big = false } = {}) {
  const { bg, fg } = chipColors(route);
  // ferry chips use the wide line-name shape too
  return h('span', { class: `chip${route.isTrain || route.isFerry ? ' chip-train' : ''}${big ? ' chip-big' : ''}`,
    style: { background: bg, color: fg }, text: chipLabel(route) });
}

export function distLabel(m) {
  return m < 950 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(m < 9950 ? 1 : 0)} km`;
}

export function minsLabel(sec) {
  const m = Math.round(sec / 60);
  if (m < 1) return 'less than a minute';
  return m === 1 ? '1 min' : `${m} min`;
}
