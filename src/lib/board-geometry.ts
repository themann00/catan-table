import type { RuleSet } from "./rules";

/**
 * Hex grid geometry for a row-based Catan island (3-4-5-4-3 or
 * 3-4-5-6-5-4-3). Pointy-top hexes with circumradius 1; the SVG scales.
 * Everything here is derived once per layout and cached.
 */
export interface HexCell {
  index: number;
  row: number;
  col: number;
  cx: number;
  cy: number;
}

/** An intersection where 1 to 3 hexes meet. Settlements sit here. */
export interface Corner {
  id: number;
  x: number;
  y: number;
  hexes: number[];
}

/** A hex edge with sea on the other side. Harbors sit here. */
export interface CoastalEdge {
  id: number;
  hex: number;
  cornerA: number;
  cornerB: number;
  mx: number;
  my: number;
  /** Unit vector pointing out to sea. */
  nx: number;
  ny: number;
}

export interface BoardGeometry {
  hexes: HexCell[];
  /** neighbors[i] = indexes of hexes sharing an edge with hex i. */
  neighbors: number[][];
  corners: Corner[];
  /** Ordered around the perimeter. */
  coastalEdges: CoastalEdge[];
  /** Rings from the outside in, each ordered counter-clockwise from a corner hex. */
  rings: number[][];
  /** Bounding box in hex units, with a margin for the sea frame. */
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export const HEX_W = Math.sqrt(3);
export const HEX_ROW_H = 1.5;

/** Pointy-top corners, starting at the top and going clockwise on screen. */
export const hexCornerOffsets = (): Array<[number, number]> =>
  [0, 1, 2, 3, 4, 5].map((k) => {
    const angle = (Math.PI / 180) * (60 * k - 90);
    return [Math.cos(angle), Math.sin(angle)];
  });

/** Rounds to 3 decimals and folds -0 into 0 so shared corners hash alike. */
const snap = (v: number): number => {
  const n = Math.round(v * 1000) / 1000;
  return n === 0 ? 0 : n;
};
const key = (x: number, y: number) => `${snap(x)},${snap(y)}`;

const cache = new Map<string, BoardGeometry>();

export function boardGeometry(rules: RuleSet): BoardGeometry {
  const cacheKey = rules.hexRows.join("-");
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const hexes: HexCell[] = [];
  rules.hexRows.forEach((n, row) => {
    for (let col = 0; col < n; col++) {
      hexes.push({ index: hexes.length, row, col, cx: (col - (n - 1) / 2) * HEX_W, cy: row * HEX_ROW_H });
    }
  });

  // Neighbors: centers one hex-width apart.
  const neighbors = hexes.map((h) =>
    hexes.filter((o) => o !== h && Math.hypot(o.cx - h.cx, o.cy - h.cy) < HEX_W + 0.01).map((o) => o.index),
  );

  // Corners shared by rounding coordinates.
  const offsets = hexCornerOffsets();
  const cornerByKey = new Map<string, Corner>();
  const corners: Corner[] = [];
  const hexCornerIds: number[][] = hexes.map(() => []);
  for (const h of hexes) {
    for (const [dx, dy] of offsets) {
      const x = h.cx + dx;
      const y = h.cy + dy;
      const k = key(x, y);
      let c = cornerByKey.get(k);
      if (!c) {
        c = { id: corners.length, x, y, hexes: [] };
        cornerByKey.set(k, c);
        corners.push(c);
      }
      c.hexes.push(h.index);
      hexCornerIds[h.index].push(c.id);
    }
  }

  // Edges: pairs of consecutive corners. Coastal when only one hex owns them.
  const edgeOwners = new Map<string, { hex: number; a: number; b: number }[]>();
  for (const h of hexes) {
    const ids = hexCornerIds[h.index];
    for (let i = 0; i < 6; i++) {
      const a = ids[i];
      const b = ids[(i + 1) % 6];
      const k = a < b ? `${a}-${b}` : `${b}-${a}`;
      const list = edgeOwners.get(k) ?? [];
      list.push({ hex: h.index, a, b });
      edgeOwners.set(k, list);
    }
  }
  const unordered: Omit<CoastalEdge, "id">[] = [];
  for (const owners of edgeOwners.values()) {
    if (owners.length !== 1) continue;
    const { hex, a, b } = owners[0];
    const h = hexes[hex];
    const mx = (corners[a].x + corners[b].x) / 2;
    const my = (corners[a].y + corners[b].y) / 2;
    const len = Math.hypot(mx - h.cx, my - h.cy);
    unordered.push({ hex, cornerA: a, cornerB: b, mx, my, nx: (mx - h.cx) / len, ny: (my - h.cy) / len });
  }

  // Walk the perimeter so consecutive edges share a corner.
  const byCorner = new Map<number, number[]>();
  unordered.forEach((e, i) => {
    for (const c of [e.cornerA, e.cornerB]) byCorner.set(c, [...(byCorner.get(c) ?? []), i]);
  });
  const ordered: CoastalEdge[] = [];
  const used = new Set<number>();
  // Start at the top-most edge so encodings are stable across runs.
  let current = unordered.reduce((best, e, i) => (e.my < unordered[best].my || (e.my === unordered[best].my && e.mx < unordered[best].mx) ? i : best), 0);
  let exitCorner = unordered[current].cornerB;
  while (!used.has(current)) {
    used.add(current);
    const e = unordered[current];
    ordered.push({ ...e, id: ordered.length });
    const next = (byCorner.get(exitCorner) ?? []).find((i) => !used.has(i));
    if (next === undefined) break;
    const n = unordered[next];
    exitCorner = n.cornerA === exitCorner ? n.cornerB : n.cornerA;
    current = next;
  }

  // Rings by peeling: hexes with fewer than six remaining neighbors form the outer ring.
  const rings: number[][] = [];
  let remaining = new Set(hexes.map((h) => h.index));
  const centerX = 0;
  const centerY = ((rules.hexRows.length - 1) * HEX_ROW_H) / 2;
  let startAngle: number | null = null;
  while (remaining.size > 0) {
    const ring =
      remaining.size <= 1
        ? [...remaining]
        : [...remaining].filter((i) => neighbors[i].filter((n) => remaining.has(n)).length < 6);
    const angle = (i: number) => Math.atan2(hexes[i].cy - centerY, hexes[i].cx - centerX);
    // Counter-clockwise on screen (y grows downward) means decreasing atan2.
    const sorted = ring.slice().sort((a, b) => angle(b) - angle(a));
    let startIdx = 0;
    if (startAngle === null) {
      // Outer ring: begin at the top-right corner hex (the first corner going counter-clockwise from the top).
      startIdx = sorted.findIndex((i) => neighbors[i].length <= 3);
      if (startIdx < 0) startIdx = 0;
    } else {
      // Inner rings: continue from the hex nearest the previous ring's last angle.
      let best = 0;
      let bestDiff = Infinity;
      sorted.forEach((i, idx) => {
        let d = Math.abs(angle(i) - startAngle!);
        d = Math.min(d, 2 * Math.PI - d);
        if (d < bestDiff) {
          bestDiff = d;
          best = idx;
        }
      });
      startIdx = best;
    }
    const rotated = [...sorted.slice(startIdx), ...sorted.slice(0, startIdx)];
    rings.push(rotated);
    startAngle = angle(rotated[rotated.length - 1]);
    remaining = new Set([...remaining].filter((i) => !ring.includes(i)));
  }

  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const margin = 1.25;
  const minX = Math.min(...xs) - margin;
  const minY = Math.min(...ys) - margin;
  const geometry: BoardGeometry = {
    hexes,
    neighbors,
    corners,
    coastalEdges: ordered,
    rings,
    minX,
    minY,
    width: Math.max(...xs) - Math.min(...xs) + 2 * margin,
    height: Math.max(...ys) - Math.min(...ys) + 2 * margin,
  };
  cache.set(cacheKey, geometry);
  return geometry;
}

/** Spiral order for token placement: outer ring first, from corner `start` (0-5), then inward. */
export function spiralOrder(geometry: BoardGeometry, start: number): number[] {
  const outer = geometry.rings[0];
  // Corner hexes on the outer ring have three neighbors.
  const cornerPositions = outer.map((h, idx) => ({ h, idx })).filter(({ h }) => geometry.neighbors[h].length <= 3);
  const from = cornerPositions[((start % cornerPositions.length) + cornerPositions.length) % cornerPositions.length]?.idx ?? 0;
  const rotatedOuter = [...outer.slice(from), ...outer.slice(0, from)];
  // Re-derive inner rings' starting points relative to this rotation.
  const result = [...rotatedOuter];
  let lastHex = rotatedOuter[rotatedOuter.length - 1];
  for (let r = 1; r < geometry.rings.length; r++) {
    const ring = geometry.rings[r];
    // Start at the ring hex adjacent to (or nearest) the last placed hex.
    let bestIdx = 0;
    let bestDist = Infinity;
    ring.forEach((h, idx) => {
      const d = Math.hypot(geometry.hexes[h].cx - geometry.hexes[lastHex].cx, geometry.hexes[h].cy - geometry.hexes[lastHex].cy);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = idx;
      }
    });
    const rotated = [...ring.slice(bestIdx), ...ring.slice(0, bestIdx)];
    result.push(...rotated);
    lastHex = rotated[rotated.length - 1];
  }
  return result;
}
