/**
 * Resolves the highest (most stringent) risk class from selected markets,
 * considering market.riskClass AND individual component risk classes.
 * 
 * This avoids relying on a potentially stale `overallRiskClass` field.
 */

import { formatDeviceClassCode } from './deviceClassUtils';

const RISK_ORDER = ['I', 'Is', 'Im', 'Ir', 'IIa', 'IIb', 'III'];

function riskRank(cls: string): number {
  const idx = RISK_ORDER.indexOf(cls);
  return idx >= 0 ? idx : -1;
}

interface MarketLike {
  selected?: boolean;
  riskClass?: string;
  componentClassification?: {
    overallRiskClass?: string;
    components?: Array<{ riskClass?: string; isSelected?: boolean }>;
  };
}

/**
 * Derive the most stringent risk class across all selected markets.
 * Priority per market: individual component classes > market.riskClass > overallRiskClass (legacy).
 */
export function resolveHighestRiskClass(markets?: MarketLike[]): string | undefined {
  if (!markets) return undefined;

  let highest: string | undefined;

  for (const m of markets) {
    if (!m.selected) continue;

    // Collect all candidate class strings for this market
    const candidates: string[] = [];

    // 1) Individual component classes (most accurate, freshly computed)
    const comps = m.componentClassification?.components;
    if (comps) {
      for (const c of comps) {
        if (c.isSelected !== false && c.riskClass) {
          candidates.push(c.riskClass);
        }
      }
    }

    // 2) Market-level riskClass
    if (m.riskClass) candidates.push(m.riskClass);

    // 3) Legacy overallRiskClass (fallback only)
    if (m.componentClassification?.overallRiskClass) {
      candidates.push(m.componentClassification.overallRiskClass);
    }

    // Pick highest from candidates
    for (const raw of candidates) {
      const cls = formatDeviceClassCode(raw);
      if (!cls) continue;
      if (!highest || riskRank(cls) > riskRank(highest)) {
        highest = cls;
      }
    }
  }

  return highest;
}
