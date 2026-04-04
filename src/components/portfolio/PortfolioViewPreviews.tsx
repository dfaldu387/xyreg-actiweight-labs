import React from 'react';

// Mini SVG preview illustrations for each portfolio view type
// These provide visual context for what each view looks like

export function GenesisMiniPreview() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      {/* Quadrant lines */}
      <line x1="60" y1="10" x2="60" y2="70" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="2 2" />
      <line x1="10" y1="40" x2="110" y2="40" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="2 2" />
      
      {/* Dots in different quadrants */}
      <circle cx="85" cy="20" r="8" fill="hsl(142 76% 36%)" fillOpacity="0.8" /> {/* Top right - high potential */}
      <circle cx="30" cy="25" r="6" fill="hsl(45 93% 47%)" fillOpacity="0.8" /> {/* Top left - emerging */}
      <circle cx="90" cy="55" r="5" fill="hsl(221 83% 53%)" fillOpacity="0.8" /> {/* Bottom right - needs work */}
      <circle cx="25" cy="60" r="4" fill="currentColor" fillOpacity="0.3" /> {/* Bottom left - low priority */}
      <circle cx="75" cy="30" r="7" fill="hsl(142 76% 36%)" fillOpacity="0.6" />
    </svg>
  );
}

export function SunburstMiniPreview() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      <g transform="translate(60, 40)">
        {/* Inner ring */}
        <path d="M0,-15 A15,15 0 0,1 13,7.5 L0,0 Z" fill="hsl(221 83% 53%)" fillOpacity="0.8" />
        <path d="M13,7.5 A15,15 0 0,1 -13,7.5 L0,0 Z" fill="hsl(262 83% 58%)" fillOpacity="0.8" />
        <path d="M-13,7.5 A15,15 0 0,1 0,-15 L0,0 Z" fill="hsl(292 84% 61%)" fillOpacity="0.8" />
        
        {/* Outer ring */}
        <path d="M0,-30 A30,30 0 0,1 26,15 L13,7.5 A15,15 0 0,0 0,-15 Z" fill="hsl(221 83% 53%)" fillOpacity="0.5" />
        <path d="M26,15 A30,30 0 0,1 -26,15 L-13,7.5 A15,15 0 0,0 13,7.5 Z" fill="hsl(262 83% 58%)" fillOpacity="0.5" />
        <path d="M-26,15 A30,30 0 0,1 0,-30 L0,-15 A15,15 0 0,0 -13,7.5 Z" fill="hsl(292 84% 61%)" fillOpacity="0.5" />
      </g>
    </svg>
  );
}

export function PhasesMiniPreview() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      {/* Horizontal bars */}
      <rect x="10" y="12" width="90" height="10" rx="2" fill="hsl(142 76% 36%)" fillOpacity="0.8" />
      <rect x="10" y="28" width="70" height="10" rx="2" fill="hsl(221 83% 53%)" fillOpacity="0.8" />
      <rect x="10" y="44" width="50" height="10" rx="2" fill="hsl(45 93% 47%)" fillOpacity="0.8" />
      <rect x="10" y="60" width="30" height="10" rx="2" fill="hsl(0 84% 60%)" fillOpacity="0.8" />
    </svg>
  );
}

export function CardsMiniPreview() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      {/* 2x3 grid of cards */}
      <rect x="8" y="8" width="32" height="28" rx="3" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.3" />
      <rect x="44" y="8" width="32" height="28" rx="3" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.3" />
      <rect x="80" y="8" width="32" height="28" rx="3" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.3" />
      <rect x="8" y="44" width="32" height="28" rx="3" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.3" />
      <rect x="44" y="44" width="32" height="28" rx="3" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.3" />
      <rect x="80" y="44" width="32" height="28" rx="3" fill="currentColor" fillOpacity="0.15" stroke="hsl(221 83% 53%)" strokeWidth="2" />
    </svg>
  );
}

export function KanbanMiniPreview() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      {/* 3 columns with cards */}
      <rect x="8" y="8" width="32" height="64" rx="3" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.2" />
      <rect x="44" y="8" width="32" height="64" rx="3" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.2" />
      <rect x="80" y="8" width="32" height="64" rx="3" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.2" />
      
      {/* Cards in columns */}
      <rect x="12" y="16" width="24" height="12" rx="2" fill="hsl(262 83% 58%)" fillOpacity="0.6" />
      <rect x="12" y="32" width="24" height="12" rx="2" fill="hsl(262 83% 58%)" fillOpacity="0.6" />
      <rect x="48" y="16" width="24" height="12" rx="2" fill="hsl(45 93% 47%)" fillOpacity="0.6" />
      <rect x="84" y="16" width="24" height="12" rx="2" fill="hsl(142 76% 36%)" fillOpacity="0.6" />
      <rect x="84" y="32" width="24" height="12" rx="2" fill="hsl(142 76% 36%)" fillOpacity="0.6" />
    </svg>
  );
}

export function TimelineMiniPreview() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      {/* Timeline line */}
      <line x1="15" y1="40" x2="105" y2="40" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      
      {/* Milestone dots and labels */}
      <circle cx="25" cy="40" r="6" fill="hsl(142 76% 36%)" />
      <circle cx="50" cy="40" r="6" fill="hsl(142 76% 36%)" />
      <circle cx="75" cy="40" r="6" fill="hsl(45 93% 47%)" />
      <circle cx="100" cy="40" r="4" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="2 2" />
      
      {/* Connecting lines to labels */}
      <line x1="25" y1="32" x2="25" y2="20" stroke="currentColor" strokeOpacity="0.2" />
      <line x1="50" y1="48" x2="50" y2="60" stroke="currentColor" strokeOpacity="0.2" />
      <line x1="75" y1="32" x2="75" y2="20" stroke="currentColor" strokeOpacity="0.2" />
    </svg>
  );
}

export function TableMiniPreview() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      {/* Table header */}
      <rect x="8" y="8" width="104" height="14" rx="2" fill="currentColor" fillOpacity="0.1" />
      
      {/* Table rows */}
      <line x1="8" y1="30" x2="112" y2="30" stroke="currentColor" strokeOpacity="0.1" />
      <line x1="8" y1="46" x2="112" y2="46" stroke="currentColor" strokeOpacity="0.1" />
      <line x1="8" y1="62" x2="112" y2="62" stroke="currentColor" strokeOpacity="0.1" />
      
      {/* Column dividers */}
      <line x1="45" y1="8" x2="45" y2="72" stroke="currentColor" strokeOpacity="0.1" />
      <line x1="80" y1="8" x2="80" y2="72" stroke="currentColor" strokeOpacity="0.1" />
      
      {/* Status indicators */}
      <circle cx="92" cy="38" r="3" fill="hsl(142 76% 36%)" />
      <circle cx="92" cy="54" r="3" fill="hsl(45 93% 47%)" />
      <circle cx="92" cy="70" r="3" fill="hsl(221 83% 53%)" />
    </svg>
  );
}

export function NetworkMiniPreview() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      {/* Connection lines */}
      <line x1="60" y1="20" x2="30" y2="50" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <line x1="60" y1="20" x2="90" y2="50" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <line x1="30" y1="50" x2="45" y2="70" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <line x1="90" y1="50" x2="75" y2="70" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      
      {/* Nodes */}
      <circle cx="60" cy="20" r="10" fill="hsl(142 76% 36%)" fillOpacity="0.8" />
      <circle cx="30" cy="50" r="8" fill="hsl(221 83% 53%)" fillOpacity="0.8" />
      <circle cx="90" cy="50" r="8" fill="hsl(221 83% 53%)" fillOpacity="0.8" />
      <circle cx="45" cy="70" r="6" fill="hsl(262 83% 58%)" fillOpacity="0.8" />
      <circle cx="75" cy="70" r="6" fill="hsl(262 83% 58%)" fillOpacity="0.8" />
    </svg>
  );
}

export function HierarchyMiniPreview() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      {/* Vertical connecting lines */}
      <line x1="60" y1="22" x2="60" y2="35" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <line x1="30" y1="35" x2="90" y2="35" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <line x1="30" y1="35" x2="30" y2="48" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <line x1="90" y1="35" x2="90" y2="48" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      
      {/* Hierarchy nodes */}
      <rect x="45" y="8" width="30" height="14" rx="3" fill="hsl(292 84% 61%)" fillOpacity="0.8" />
      <rect x="15" y="48" width="30" height="14" rx="3" fill="hsl(338 76% 52%)" fillOpacity="0.8" />
      <rect x="75" y="48" width="30" height="14" rx="3" fill="hsl(338 76% 52%)" fillOpacity="0.8" />
      
      {/* Leaf nodes */}
      <line x1="30" y1="62" x2="30" y2="68" stroke="currentColor" strokeOpacity="0.2" />
      <line x1="90" y1="62" x2="90" y2="68" stroke="currentColor" strokeOpacity="0.2" />
      <circle cx="20" cy="72" r="4" fill="currentColor" fillOpacity="0.3" />
      <circle cx="40" cy="72" r="4" fill="currentColor" fillOpacity="0.3" />
      <circle cx="80" cy="72" r="4" fill="currentColor" fillOpacity="0.3" />
      <circle cx="100" cy="72" r="4" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}

export function BundleMiniPreview() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full">
      {/* Bundle container */}
      <rect x="15" y="10" width="90" height="60" rx="8" fill="currentColor" fillOpacity="0.05" stroke="hsl(262 83% 58%)" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="4 2" />
      
      {/* Grouped circles inside */}
      <circle cx="40" cy="35" r="14" fill="hsl(262 83% 58%)" fillOpacity="0.6" />
      <circle cx="70" cy="30" r="10" fill="hsl(221 83% 53%)" fillOpacity="0.6" />
      <circle cx="85" cy="50" r="8" fill="hsl(142 76% 36%)" fillOpacity="0.6" />
      <circle cx="55" cy="55" r="12" fill="hsl(45 93% 47%)" fillOpacity="0.6" />
    </svg>
  );
}

// Map view IDs to preview components
export const VIEW_PREVIEWS: Record<string, React.FC> = {
  genesis: GenesisMiniPreview,
  sunburst: SunburstMiniPreview,
  'phases-chart': PhasesMiniPreview,
  cards: CardsMiniPreview,
  phases: KanbanMiniPreview,
  timeline: TimelineMiniPreview,
  list: TableMiniPreview,
  relationships: NetworkMiniPreview,
  'hierarchy-graph': HierarchyMiniPreview,
  bundles: BundleMiniPreview,
};
