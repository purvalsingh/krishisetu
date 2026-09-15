export type Point = { lat: number; lng: number };

/** Great-circle distance in km. Road distance is approximated by a detour factor. */
export function haversineKm(a: Point, b: Point): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Straight-line distance understates road distance; 1.3 is the assumed detour factor. */
export const roadKm = (a: Point, b: Point) => haversineKm(a, b) * 1.3;
