/**
 * Investor-Essential completion keys (DERIVED, not stored).
 *
 * Source of truth: `GENESIS_SECTIONS` in `src/config/genesisSections.ts`.
 * Anything covered by Genesis is considered required for an investor-ready
 * Venture Blueprint. Phase 3-6 steps from `blueprintStepMapping.ts` are
 * "full plan only" and not required for the investor track.
 *
 * The Venture Blueprint UI uses this set to:
 *   - Mark sub-steps with a small ★ Investor chip
 *   - Render an "Investor Essentials" vs "Full Plan" track toggle
 *   - Gate the Share-with-Investor / Marketplace actions
 */
import { GENESIS_SECTIONS } from './genesisSections';

export const INVESTOR_ESSENTIAL_COMPLETION_KEYS: ReadonlySet<string> = new Set(
  GENESIS_SECTIONS.flatMap((s) => s.subSteps.map((sub) => sub.completionKey)).filter(
    Boolean,
  ),
);

export const INVESTOR_ESSENTIAL_SUBSTEP_IDS: ReadonlySet<string> = new Set(
  GENESIS_SECTIONS.flatMap((s) => s.subSteps.map((sub) => sub.id)),
);

export const INVESTOR_ESSENTIAL_TOTAL = INVESTOR_ESSENTIAL_COMPLETION_KEYS.size;

export function isInvestorEssentialKey(completionKey: string): boolean {
  return INVESTOR_ESSENTIAL_COMPLETION_KEYS.has(completionKey);
}

export function isInvestorEssentialSubstep(substepId: string): boolean {
  return INVESTOR_ESSENTIAL_SUBSTEP_IDS.has(substepId);
}

export type BlueprintTrack = 'investor' | 'full';

export const BLUEPRINT_TRACK_PARAM = 'track';
export const DEFAULT_BLUEPRINT_TRACK: BlueprintTrack = 'investor';

export function parseBlueprintTrack(value: string | null | undefined): BlueprintTrack {
  return value === 'full' ? 'full' : 'investor';
}