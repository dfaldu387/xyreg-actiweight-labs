import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getSopTier, type SopTier } from '@/constants/sopAutoSeedTiers';

interface TierBadgeProps {
  /** Either a canonical "SOP-NNN" id, or a full document name to parse. */
  source?: string | null;
  /** Pre-resolved tier — overrides `source` when provided. */
  tier?: SopTier | null;
  className?: string;
}

const TIER_META: Record<SopTier, { label: string; className: string; tooltip: string }> = {
  A: {
    label: 'Generic',
    className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600',
    tooltip:
      'Universal QMS boilerplate — identical across companies. Only [Company Name] is personalized.',
  },
  B: {
    label: 'Pathway',
    className: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-700',
    tooltip:
      'Pathway-conditional SOP — applies because of the regulatory framework you enabled (e.g. EU MDR, manufacturing).',
  },
  C: {
    label: 'Device-specific',
    className: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700',
    tooltip:
      'Device-specific SOP — requires real product or process detail. Author in Document Studio.',
  },
};

/**
 * Small chip surfaced next to the document type pill in QMS document lists,
 * indicating which Xyreg SOP tier (Generic / Pathway / Device-specific) the
 * row belongs to. Renders nothing for non-library documents.
 */
export const TierBadge: React.FC<TierBadgeProps> = ({ source, tier, className }) => {
  const resolved = tier ?? getSopTier(source);
  if (!resolved) return null;
  const meta = TIER_META[resolved];

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-xs ${meta.className} ${className ?? ''}`}>
            {meta.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {meta.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TierBadge;