import React from 'react';
import { Info } from 'lucide-react';

interface FamilyFieldBannerProps {
  hasValue: boolean;
  onEditFamily?: () => void;
}

/**
 * Small info banner shown below a field label when the field is in PF mode.
 * Indicates the value is shared across the product family.
 */
export function FamilyFieldBanner({ hasValue }: FamilyFieldBannerProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-pf-accent font-medium bg-pf-accent/8 border border-pf-accent/25 rounded-md px-3 py-1.5 mt-1 w-full">
      <Info className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="flex-1">
        Shared across product family — edits apply to all variants.
      </span>
    </div>
  );
}
