import { SunburstNode } from "@/types/charts";

// Base HSL colors for Technology Levels (semantic, professional palette)
// Chosen for clear differentiation; expressed as HSL to align with design system guidance
const BASE_TECH_COLORS: Record<string, { h: number; s: number; l: number }> = {
  Premium: { h: 250, s: 70, l: 50 }, // Indigo
  Advanced: { h: 200, s: 80, l: 45 }, // Sky
  Standard: { h: 160, s: 60, l: 40 }, // Teal/Green
  Basic: { h: 35, s: 90, l: 50 }, // Amber
};

export const TECH_LEVELS = ["Premium", "Advanced", "Standard", "Basic"] as const;
export type TechLevel = typeof TECH_LEVELS[number];

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function hslToString({ h, s, l }: { h: number; s: number; l: number }) {
  return `hsl(${h} ${s}% ${l}%)`;
}

export function getTechBaseColor(tech: string): string {
  const base = BASE_TECH_COLORS[tech] || { h: 220, s: 10, l: 50 }; // fallback neutral
  return hslToString(base);
}

// Return a progressively lighter shade based on depth (root children at depth 1)
export function shadeForDepth(tech: string, depth: number): string {
  const base = BASE_TECH_COLORS[tech] || { h: 220, s: 10, l: 50 };
  // increase lightness with depth; cap at 92% for contrast
  const l = clamp(base.l + depth * 10, 35, 92);
  return hslToString({ h: base.h, s: base.s, l });
}

// Given the path from root to node, determine color: base by Level 1 tech, shade by depth
export function colorForNodePath(path: string[], depth: number): string {
  // path[0] is root label; path[1] is Technology Level
  const tech = path[1] || "Standard";
  return shadeForDepth(tech, depth);
}

export const techLegend: Array<{ label: string; color: string }> = (
  Object.keys(BASE_TECH_COLORS) as Array<keyof typeof BASE_TECH_COLORS>
).map((k) => ({ label: k, color: hslToString(BASE_TECH_COLORS[k]) }));

// Fixed color palette ensuring each category gets a unique color
const CATEGORY_COLORS: Array<{ h: number; s: number; l: number }> = [
  { h: 220, s: 75, l: 55 },     // Blue - for Accessories  
  { h: 120, s: 65, l: 45 },     // Green - for Hearing Aids
  { h: 35, s: 85, l: 55 },      // Orange - for Tinnitus Solutions
  { h: 280, s: 70, l: 60 },     // Purple
  { h: 350, s: 80, l: 60 },     // Red
  { h: 160, s: 70, l: 45 },     // Teal
  { h: 200, s: 75, l: 50 },     // Light Blue
  { h: 310, s: 70, l: 55 },     // Magenta
];

// Fixed color palette for platforms ensuring distinct colors
const PLATFORM_COLORS: Array<{ h: number; s: number; l: number }> = [
  { h: 35, s: 85, l: 55 },      // Orange
  { h: 160, s: 70, l: 45 },     // Teal  
  { h: 280, s: 70, l: 60 },     // Purple
  { h: 350, s: 80, l: 60 },     // Red
  { h: 60, s: 75, l: 50 },      // Yellow-Green
  { h: 200, s: 75, l: 50 },     // Light Blue
  { h: 310, s: 70, l: 55 },     // Magenta
  { h: 120, s: 60, l: 40 },     // Dark Green
];

// Predefined mapping for known categories to ensure consistent coloring
const CATEGORY_COLOR_MAP: Record<string, number> = {
  "Accessories": 0,         // Blue
  "Hearing Aids": 1,        // Green  
  "Tinnitus Solutions": 2,  // Orange
};

// Predefined mapping for known platforms to ensure distinct coloring
const PLATFORM_COLOR_MAP: Record<string, number> = {
  "WIDEX Smart RIC": 0,     // Orange
  "WIDEX Evoke": 1,         // Teal
  "WIDEX Moment": 2,        // Purple
  "WIDEX CUSTOM": 3,        // Red
  "BTE (Behind-the-Ear)": 4, // Yellow-Green
  "ITE": 5,                 // Light Blue
  "CIC": 6,                 // Magenta
  "IIC": 7,                 // Dark Green
};

function platformShadeForDepth(baseColor: { h: number; s: number; l: number }, depth: number): string {
  // Adjust lightness: deeper levels get darker
  const l = clamp(baseColor.l - (depth - 1) * 12, 25, 85);
  return hslToString({ h: baseColor.h, s: baseColor.s, l });
}

export function categoryColorForNodePath(path: string[], depth: number): string {
  // Use the first level after root to determine color family
  if (path.length < 2) return "hsl(0 0% 70%)";
  
  const firstLevel = path[1];
  
  // Check if we have a predefined mapping first
  let colorIndex = CATEGORY_COLOR_MAP[firstLevel];
  
  if (colorIndex === undefined) {
    // Fall back to hash-based assignment for unknown categories
    let hash = 0;
    for (let i = 0; i < firstLevel.length; i++) {
      hash = firstLevel.charCodeAt(i) + ((hash << 5) - hash);
    }
    colorIndex = Math.abs(hash) % CATEGORY_COLORS.length;
  }
  
  const baseColor = CATEGORY_COLORS[colorIndex];
  return platformShadeForDepth(baseColor, depth);
}

// Generate dynamic legend based on data
export function generateDynamicLegend(data: SunburstNode): Array<{ label: string; color: string }> {
  if (!data.children) return [];
  
  console.log('[generateDynamicLegend] Processing data children:', data.children.map(c => ({ name: c.name, hasChildren: !!c.children })));
  
  return data.children.map((child, index) => {
    const categoryName = child.name;
    
    // Use the same logic as categoryColorForNodePath to ensure matching colors
    let colorIndex = CATEGORY_COLOR_MAP[categoryName];
    
    if (colorIndex === undefined) {
      // Fall back to hash-based assignment
      let hash = 0;
      for (let i = 0; i < categoryName.length; i++) {
        hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
      }
      colorIndex = Math.abs(hash) % CATEGORY_COLORS.length;
    }
    
    const baseColor = CATEGORY_COLORS[colorIndex];
    
    console.log('[generateDynamicLegend] Generated legend item:', { name: categoryName, colorIndex, color: hslToString(baseColor) });
    
    return {
      label: categoryName,
      color: hslToString(baseColor)
    };
  });
}

// Legacy category-based legend (for backward compatibility)
const BASE_CATEGORY_COLORS: Record<string, { h: number; s: number; l: number }> = {
  "Hearing Aids": { h: 220, s: 70, l: 50 },
  "Accessories": { h: 160, s: 60, l: 40 },
  "Tinnitus Solutions": { h: 35, s: 90, l: 50 },
};

export const categoryLegend: Array<{ label: string; color: string }> = (
  Object.keys(BASE_CATEGORY_COLORS) as Array<keyof typeof BASE_CATEGORY_COLORS>
).map((k) => ({ label: k, color: hslToString(BASE_CATEGORY_COLORS[k]) }));

// Export additional utilities needed by PortfolioSunburst
export { CATEGORY_COLORS, PLATFORM_COLORS, PLATFORM_COLOR_MAP, hslToString };