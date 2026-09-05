import { hexCornerOffsets } from "@/lib/board-geometry";
import { geometryForBoard, spotAtCorner, type Board } from "@/lib/board";
import { TERRAIN_FILL } from "@/lib/resource-colors";
import { RESOURCE_LABEL, RESOURCE_TERRAIN, TERRAIN_LABEL, pipsFor } from "@/lib/rules";
import { cn } from "@/lib/utils";

interface HexBoardProps {
  board: Board;
  /** Tap a hex (used for locking). */
  onHexTap?: (index: number) => void;
  /** Tap an intersection (used to pick a spot for the Odds tab). */
  onCornerTap?: (cornerId: number) => void;
  selectedCorner?: number | null;
  className?: string;
  /** Accessible name for the whole board. */
  label?: string;
}

const CORNERS = hexCornerOffsets();
const HEX_POINTS = CORNERS.map(([x, y]) => `${(x * 0.97).toFixed(3)},${(y * 0.97).toFixed(3)}`).join(" ");

/**
 * SVG island. Coordinates come from board-geometry (hex circumradius 1), so
 * the drawing scales with its container and prints crisply.
 */
export const HexBoard = ({ board, onHexTap, onCornerTap, selectedCorner = null, className, label }: HexBoardProps) => {
  const g = geometryForBoard(board);
  const interactive = Boolean(onHexTap || onCornerTap);

  return (
    <svg
      viewBox={`${g.minX} ${g.minY} ${g.width} ${g.height}`}
      className={cn("h-auto w-full select-none", className)}
      role={interactive ? "group" : "img"}
      aria-label={label ?? `${board.layout === "base" ? "19" : "30"} hex Catan board, seed ${board.seed.toString(16)}`}
    >
      {/* Sea frame */}
      <rect x={g.minX} y={g.minY} width={g.width} height={g.height} rx="1" className="fill-sea" />

      {/* Hexes */}
      {g.hexes.map((cell) => {
        const h = board.hexes[cell.index];
        const desc = `${TERRAIN_LABEL[h.terrain]}${h.token !== null ? ` ${h.token}` : ""}${h.locked ? ", locked" : ""}`;
        const red = h.token === 6 || h.token === 8;
        const content = (
          <>
            <polygon points={HEX_POINTS} className={cn(TERRAIN_FILL[h.terrain], "stroke-[#5a3a1c]")} strokeWidth="0.06" strokeLinejoin="round" />
            {h.token !== null ? (
              <>
                <circle r="0.4" className="fill-[#f4ecd8] stroke-[#5a3a1c]" strokeWidth="0.04" />
                <text y="0.09" textAnchor="middle" fontSize={h.token >= 10 ? 0.4 : 0.46} fontWeight="700" fontFamily="Georgia, serif" fill={red ? "#b3261e" : "#2b1d12"}>
                  {h.token}
                </text>
                <g fill={red ? "#b3261e" : "#2b1d12"}>
                  {Array.from({ length: pipsFor(h.token) }, (_, i) => {
                    const n = pipsFor(h.token as number);
                    return <circle key={i} cx={(i - (n - 1) / 2) * 0.1} cy="0.23" r="0.033" />;
                  })}
                </g>
              </>
            ) : (
              <text y="0.12" textAnchor="middle" fontSize="0.28" fontFamily="Georgia, serif" fill="#6b4a2a">
                desert
              </text>
            )}
            {h.locked && (
              <g transform="translate(0.52 -0.62)" aria-hidden="true">
                <circle r="0.25" className="fill-[#2b1d12]" />
                <rect x="-0.11" y="-0.05" width="0.22" height="0.17" rx="0.03" fill="#f4ecd8" />
                <path d="M-0.07 -0.05 v-0.06 a0.07 0.07 0 0 1 0.14 0 v0.06" fill="none" stroke="#f4ecd8" strokeWidth="0.035" />
              </g>
            )}
          </>
        );
        return onHexTap ? (
          <g
            key={cell.index}
            transform={`translate(${cell.cx} ${cell.cy})`}
            role="button"
            tabIndex={0}
            aria-pressed={h.locked}
            aria-label={`${desc}. ${h.locked ? "Tap to unlock" : "Tap to lock"}`}
            onClick={() => onHexTap(cell.index)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onHexTap(cell.index);
              }
            }}
            className="cursor-pointer outline-none [&:focus-visible>polygon]:stroke-white [&:focus-visible>polygon]:stroke-[0.1]"
          >
            {content}
          </g>
        ) : (
          <g key={cell.index} transform={`translate(${cell.cx} ${cell.cy})`} role="img" aria-label={desc}>
            {content}
          </g>
        );
      })}

      {/* Harbors */}
      {board.harbors.map(({ edge, harbor }) => {
        const e = g.coastalEdges[edge];
        const ox = e.mx + e.nx * 0.55;
        const oy = e.my + e.ny * 0.55;
        const text = harbor.kind === "generic" ? "3:1" : `2:1`;
        const name = harbor.kind === "generic" ? "3:1 harbor" : `2:1 ${RESOURCE_LABEL[harbor.resource]} harbor`;
        const fill = harbor.kind === "generic" ? "#f4ecd8" : undefined;
        const fillClass = harbor.kind === "resource" ? TERRAIN_FILL[RESOURCE_TERRAIN[harbor.resource]] : "";
        const ink = harbor.kind === "resource" && (harbor.resource === "lumber" || harbor.resource === "brick" || harbor.resource === "ore") ? "#fff" : "#2b1d12";
        return (
          <g key={edge} role="img" aria-label={name}>
            <line x1={g.corners[e.cornerA].x} y1={g.corners[e.cornerA].y} x2={ox} y2={oy} stroke="#f4ecd8" strokeWidth="0.06" strokeLinecap="round" />
            <line x1={g.corners[e.cornerB].x} y1={g.corners[e.cornerB].y} x2={ox} y2={oy} stroke="#f4ecd8" strokeWidth="0.06" strokeLinecap="round" />
            <circle cx={ox} cy={oy} r="0.34" fill={fill} className={cn(fillClass, "stroke-[#5a3a1c]")} strokeWidth="0.04" />
            <text x={ox} y={oy + (harbor.kind === "generic" ? 0.1 : 0.02)} textAnchor="middle" fontSize="0.24" fontWeight="700" fontFamily="Helvetica, Arial, sans-serif" fill={ink}>
              {text}
            </text>
            {harbor.kind === "resource" && (
              <text x={ox} y={oy + 0.24} textAnchor="middle" fontSize="0.17" fontWeight="700" fontFamily="Helvetica, Arial, sans-serif" fill={ink}>
                {RESOURCE_LABEL[harbor.resource].slice(0, 1)}
              </text>
            )}
          </g>
        );
      })}

      {/* Intersections */}
      {onCornerTap &&
        g.corners.map((c) => {
          const spot = spotAtCorner(board, c.id);
          const desc =
            spot.tokens.length === 0
              ? "Intersection with no production"
              : `Intersection touching ${spot.tokens.map((t) => `${t.number} ${RESOURCE_LABEL[t.resource]}`).join(", ")}`;
          const selected = selectedCorner === c.id;
          return (
            <g
              key={c.id}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-label={desc}
              onClick={() => onCornerTap(c.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onCornerTap(c.id);
                }
              }}
              className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-white"
            >
              <circle cx={c.x} cy={c.y} r="0.36" fill="transparent" stroke={selected ? "#2b1d12" : "transparent"} strokeWidth="0.06" />
              <circle cx={c.x} cy={c.y} r={selected ? 0.22 : 0.12} fill={selected ? "#f4ecd8" : "rgba(43,29,18,0.55)"} stroke={selected ? "#2b1d12" : "none"} strokeWidth="0.05" />
            </g>
          );
        })}
    </svg>
  );
};
