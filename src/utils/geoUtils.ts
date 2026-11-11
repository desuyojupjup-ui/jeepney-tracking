// Geographic and Route Interpolation Utilities for PLMun-Alabang Jeepney Route

export interface RoutePosition {
  lat: number;
  lng: number;
  bearing: number;
  segmentIndex: number;
}

/**
 * Calculates initial geographic bearing from coordinate `from` to `to` in degrees [0, 360).
 */
export function calculateBearing(from: [number, number], to: [number, number]): number {
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const dLng = ((to[1] - from[1]) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Calculates straight line Euclidean / approx geodesic distance between two coordinates in km.
 */
export function getDistanceKm(coord1: [number, number], coord2: [number, number]): number {
  const R = 6371; // Earth radius in km
  const dLat = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const dLng = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1[0] * Math.PI) / 180) *
      Math.cos((coord2[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Computes cumulative distances along a polyline path.
 */
export function getPathDistances(path: [number, number][]): number[] {
  const distances: number[] = [0];
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const dist = getDistanceKm(path[i], path[i + 1]);
    total += dist;
    distances.push(total);
  }
  return distances;
}

/**
 * Interpolates an exact point and tangent bearing strictly along a polyline path given a progress factor (0.0 to 1.0).
 * If `reverse` is true (e.g. Alabang_to_PLMun), progress 0.0 is Alabang and 1.0 is PLMun, and bearing faces backward.
 */
export function interpolatePositionOnPath(
  path: [number, number][],
  progress: number, // 0.0 to 1.0
  direction: 'PLMun_to_Alabang' | 'Alabang_to_PLMun' = 'PLMun_to_Alabang'
): RoutePosition {
  if (path.length === 0) {
    return { lat: 0, lng: 0, bearing: 0, segmentIndex: 0 };
  }
  if (path.length === 1) {
    return { lat: path[0][0], lng: path[0][1], bearing: 0, segmentIndex: 0 };
  }

  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));
  
  // For Alabang_to_PLMun, effective path distance moves from end (1.0) to start (0.0)
  const effectiveProgress = direction === 'Alabang_to_PLMun' 
    ? 1 - clampedProgress 
    : clampedProgress;

  const cumDistances = getPathDistances(path);
  const totalDist = cumDistances[cumDistances.length - 1];
  const targetDist = effectiveProgress * totalDist;

  // Find the segment containing targetDist
  let segIndex = 0;
  for (let i = 0; i < cumDistances.length - 1; i++) {
    if (targetDist >= cumDistances[i] && targetDist <= cumDistances[i + 1]) {
      segIndex = i;
      break;
    }
  }

  const p1 = path[segIndex];
  const p2 = path[segIndex + 1] || path[segIndex];

  const segStartDist = cumDistances[segIndex];
  const segEndDist = cumDistances[segIndex + 1] || segStartDist + 0.0001;
  const segSpan = segEndDist - segStartDist;
  
  const t = segSpan > 0 ? (targetDist - segStartDist) / segSpan : 0;

  // Linear interpolation along road segment
  const lat = p1[0] + t * (p2[0] - p1[0]);
  const lng = p1[1] + t * (p2[1] - p1[1]);

  // Compute tangent road bearing along vehicle direction of travel
  let bearing: number;
  if (direction === 'PLMun_to_Alabang') {
    bearing = calculateBearing(p1, p2);
  } else {
    // Traveling backwards along the path (Alabang to PLMun)
    bearing = calculateBearing(p2, p1);
  }

  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    bearing: Math.round(bearing),
    segmentIndex: segIndex,
  };
}

/**
 * Finds the closest progress value (0.0 to 1.0) on the path for a given [lat, lng]
 */
export function findClosestProgressOnPath(
  path: [number, number][],
  lat: number,
  lng: number,
  direction: 'PLMun_to_Alabang' | 'Alabang_to_PLMun' = 'PLMun_to_Alabang'
): number {
  let closestDist = Infinity;
  let bestSeg = 0;
  let bestT = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];

    const dx = p2[1] - p1[1];
    const dy = p2[0] - p1[0];
    const lenSq = dx * dx + dy * dy;

    let t = lenSq === 0 ? 0 : ((lng - p1[1]) * dx + (lat - p1[0]) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const projLat = p1[0] + t * dy;
    const projLng = p1[1] + t * dx;

    const d = getDistanceKm([lat, lng], [projLat, projLng]);
    if (d < closestDist) {
      closestDist = d;
      bestSeg = i;
      bestT = t;
    }
  }

  const cumDistances = getPathDistances(path);
  const totalDist = cumDistances[cumDistances.length - 1];
  const segStartDist = cumDistances[bestSeg];
  const segEndDist = cumDistances[bestSeg + 1] || segStartDist;
  const currentDist = segStartDist + bestT * (segEndDist - segStartDist);

  const forwardProgress = totalDist > 0 ? currentDist / totalDist : 0;
  return direction === 'Alabang_to_PLMun' ? 1 - forwardProgress : forwardProgress;
}
