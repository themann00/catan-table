import type { Resource, Terrain } from "./rules";

/** Tailwind classes per resource, spelled out so the class scanner keeps them. */
export const RESOURCE_BG: Record<Resource, string> = {
  lumber: "bg-forest text-white",
  wool: "bg-pasture text-[#1c1917]",
  grain: "bg-fields text-[#1c1917]",
  brick: "bg-hills text-white",
  ore: "bg-mountains text-white",
};

/** Background class only, for bars. */
export const RESOURCE_BAR: Record<Resource, string> = {
  lumber: "bg-forest",
  wool: "bg-pasture",
  grain: "bg-fields",
  brick: "bg-hills",
  ore: "bg-mountains",
};

/** SVG fill classes per terrain for the board. */
export const TERRAIN_FILL: Record<Terrain, string> = {
  forest: "fill-forest",
  pasture: "fill-pasture",
  fields: "fill-fields",
  hills: "fill-hills",
  mountains: "fill-mountains",
  desert: "fill-desert",
};
