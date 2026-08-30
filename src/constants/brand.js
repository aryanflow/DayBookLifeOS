/** Brand mark geometry - Pure Dot (Concept 1b). Tile is always ink; dot uses money accent. */
export const BRAND_TILE = "#1A1528";
export const BRAND_DOT_LIGHT = "#B8760A";
export const BRAND_DOT_DARK = "#F5B942";

export const MARK = {
  size: 32,
  rx: 8,
  /** Optically centered ~4% below mathematical center */
  dot: { cx: 16, cy: 17.25, r: 5.5 },
};

export function pureDotSvg({ tile = BRAND_TILE, dot = BRAND_DOT_LIGHT, size = 32, rx = 8 } = {}) {
  const { cx, cy, r } = MARK.dot;
  const scale = size / MARK.size;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="Daybook">
  <rect width="${size}" height="${size}" rx="${rx * scale}" fill="${tile}"/>
  <circle cx="${cx * scale}" cy="${cy * scale}" r="${r * scale}" fill="${dot}"/>
</svg>`;
}

/** Crisp favicon geometry tuned per raster size (tab icons blur if scaled from one master). */
export function faviconSvg(size, { tile = BRAND_TILE, dot = BRAND_DOT_LIGHT } = {}) {
  if (size <= 16) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" role="img" aria-label="Daybook">
  <rect width="16" height="16" rx="3" fill="${tile}"/>
  <circle cx="8" cy="8" r="4.5" fill="${dot}"/>
</svg>`;
  }
  if (size <= 32) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="Daybook">
  <rect width="32" height="32" rx="7" fill="${tile}"/>
  <circle cx="16" cy="16.5" r="6.5" fill="${dot}"/>
</svg>`;
  }
  const scale = size / MARK.size;
  const { cx, cy, r } = MARK.dot;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="Daybook">
  <rect width="${size}" height="${size}" rx="${8 * scale}" fill="${tile}"/>
  <circle cx="${cx * scale}" cy="${cy * scale}" r="${r * scale}" fill="${dot}"/>
</svg>`;
}
