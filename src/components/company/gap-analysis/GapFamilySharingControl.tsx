import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';
import { useGapFamilySharing } from '@/hooks/useGapFamilySharing';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Human-readable names for framework identifiers
const FRAMEWORK_LABELS: Record<string, string> = {
  MDR_ANNEX_I: 'MDR Annex I',
  MDR_ANNEX_II: 'MDR Annex II',
  MDR_ANNEX_III: 'MDR Annex III',
  IEC_62304: 'IEC 62304',
  IEC_60601_1: 'IEC 60601-1',
  IEC_60601_1_2: 'IEC 60601-1-2',
  IEC_60601_1_6: 'IEC 60601-1-6',
  IEC_20957: 'IEC 20957',
  ISO_14971_DEVICE: 'ISO 14971',
  ISO_13485: 'ISO 13485',
};

interface GapFamilySharingControlProps {
  productId: string;
  enabledFrameworks: Set<string>;
}

export function GapFamilySharingControl({ productId, enabledFrameworks }: GapFamilySharingControlProps) {
  const { sharedFrameworks, isFrameworkShared, toggleFrameworkSharing, isLoading } = useGapFamilySharing(productId);
  const [isOpen, setIsOpen] = React.useState(false);

  const frameworkList = Array.from(enabledFrameworks).sort();
  const sharedCount = sharedFrameworks.length;

  if (frameworkList.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-1 py-1">
        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")} />
        <Users className="h-3.5 w-3.5" />
        <span>Family Sharing</span>
        {sharedCount > 0 && (
          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
            {sharedCount} shared
          </span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-5 mt-2 space-y-2 border-l-2 border-muted pl-3">
        <p className="text-xs text-muted-foreground mb-2">
          Choose which standards to share across family members. Unshared standards are device-specific.
        </p>
        {frameworkList.map(fw => (
          <div key={fw} className="flex items-center justify-between gap-3 py-1">
            <Label htmlFor={`share-${fw}`} className="text-sm font-normal cursor-pointer">
              {FRAMEWORK_LABELS[fw] || fw}
            </Label>
            <Switch
              id={`share-${fw}`}
              checked={isFrameworkShared(fw)}
              onCheckedChange={(checked) => toggleFrameworkSharing(fw, checked)}
              disabled={isLoading}
            />
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
