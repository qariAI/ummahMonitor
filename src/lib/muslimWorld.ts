// Shared geo-filter for live data layers (earthquakes, flights, etc).
// Muslim-majority world approximated as a set of bounding boxes — coarse by
// design (a bbox, not real country polygons) since this only needs to filter
// "is this roughly in the Ummah's geography" for a live feed, not render
// precise borders. Boxes deliberately overlap rather than leave gaps.
//
// [minLon, minLat, maxLon, maxLat]
export const MUSLIM_WORLD_BBOXES: [number, number, number, number][] = [
  // North Africa (Morocco → Egypt)
  [-17, 20, 37, 37.5],
  // Sahel / West Africa Muslim belt (Mauritania, Mali, Niger, Nigeria north, Senegal, Chad, Sudan)
  [-17, 4, 40, 20],
  // Horn of Africa (Somalia, Djibouti, Eritrea, Sudan)
  [22, -2, 51, 20],
  // Levant + Iraq (Syria, Lebanon, Jordan, Iraq, Palestine)
  [34, 29, 48, 37.5],
  // Arabian Peninsula (Saudi, Yemen, Gulf states)
  [32, 12, 60, 32.5],
  // Turkey
  [25.5, 35.5, 45, 42.5],
  // Iran
  [44, 25, 63.5, 40],
  // Central Asia (Kazakhstan → Kyrgyzstan)
  [46, 35, 87.5, 55.5],
  // Afghanistan + Pakistan
  [60, 23, 77, 39],
  // Bangladesh
  [88, 20.5, 92.7, 26.7],
  // Maldives
  [72.5, -1, 74, 8],
  // Indonesia + Malaysia + Brunei (maritime SE Asia)
  [94, -11, 141, 7.5],
  // Balkans Muslim-significant areas (Bosnia, Kosovo, Albania)
  [15.5, 39, 23.5, 46.5],
];

/** Rough test: does a lat/lon fall inside the Muslim-world bbox union? */
export function isInMuslimWorld(lat: number, lon: number): boolean {
  return MUSLIM_WORLD_BBOXES.some(
    ([minLon, minLat, maxLon, maxLat]) =>
      lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat,
  );
}

/** Union bbox — cheap pre-filter for APIs that accept one bounding box (e.g. OpenSky). */
export function unionBbox(): [number, number, number, number] {
  const lons = MUSLIM_WORLD_BBOXES.flatMap(([a, , c]) => [a, c]);
  const lats = MUSLIM_WORLD_BBOXES.flatMap(([, b, , d]) => [b, d]);
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
}
