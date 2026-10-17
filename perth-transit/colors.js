// colors.js: line colours and text contrast.
// The eight line hues come from a categorical palette checked for colour-blind separation of
// neighbouring pairs. Several (yellow, aqua, pink) are light, so chips always carry the line name
// and pick dark or light text by contrast.

export const BUS_COLOR = '#2b3a47';
export const FERRY_COLOR = '#0a7ea4'; // river blue, apart from the eight line colours
export const INK = '#15222e';

// Buses and the ferry are drawn darker on the light map and lighter on the dark one; train lines keep their colours.
let theme = 'light';
const DARK = { bus: '#c3ced8', ferry: '#3fb4dc' };
export function setColorTheme(t) { theme = t; }
export const busColor = () => (theme === 'dark' ? DARK.bus : BUS_COLOR);
export const ferryColor = () => (theme === 'dark' ? DARK.ferry : FERRY_COLOR);

const LINE_COLORS = {
  'Fremantle Line': '#2a78d6',
  'Armadale Line': '#eda100',
  'Thornlie-Cockburn Line': '#6250d6',
  'Mandurah Line': '#eb6834',
  'Midland Line': '#e87ba4',
  'Airport Line': '#1baf7a',
  'Ellenbrook Line': '#e34948',
  'Yanchep Line': '#008300',
};
const SPARE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function routeColor(route) {
  if (route.isFerry) return ferryColor();
  if (!route.isTrain) return busColor();
  return LINE_COLORS[route.long] || SPARE[hash(route.long) % SPARE.length];
}

function luminance(hex) {
  const v = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}

/** Text colour (white or ink) with the better contrast on the given background. */
export function textOn(hex) {
  const l = luminance(hex);
  const white = 1.05 / (l + 0.05);
  const ink = (l + 0.05) / (luminance(INK) + 0.05);
  return white >= ink ? '#ffffff' : INK;
}

/** Label for a route chip: bus number, "Ferry", or the line name without the word "Line". */
export function chipLabel(route) {
  if (route.isFerry) return 'Ferry';
  return route.isTrain ? route.long.replace(/\s+Line$/i, '') : route.short || route.long;
}

function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function darken(hex, f) {
  const c = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - f)));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

/**
 * Colours for a route chip: the line colour with readable text. Where neither white nor ink text reaches
 * 4.5:1 on the exact line colour, the chip background is darkened a little (the map keeps the true colour).
 */
export function chipColors(route) {
  let bg = routeColor(route);
  let fg = textOn(bg);
  if (contrast(fg, bg) >= 4.5) return { bg, fg };
  for (let i = 0; i < 12 && contrast('#ffffff', bg) < 4.5; i++) bg = darken(bg, 0.04);
  return { bg, fg: '#ffffff' };
}
