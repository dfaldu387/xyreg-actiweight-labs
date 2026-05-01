import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  formatSopDisplayId,
  getSopIsoClause,
  SOP_ISO_CLAUSE_ORDER,
  type SopTrigger,
} from '@/constants/sopAutoSeedTiers';

const TRIGGER_LABEL: Record<SopTrigger, string> = {
  always: 'Always',
  manufacturing: 'Manufacturing in scope',
  eu_mdr: 'EU MDR',
  eu_mdr_class_iia_plus: 'EU MDR Class IIa+',
  eu_clinical: 'Clinical pathway',
  physical_product: 'Physical product',
};

export interface BreakdownEntry {
  sop: string;
  reason: string;
  trigger?: SopTrigger;
}

interface SopBreakdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  intro: string;
  entries: readonly BreakdownEntry[];
}

export function SopBreakdownDialog({
  open,
  onOpenChange,
  title,
  intro,
  entries,
}: SopBreakdownDialogProps) {
  const grouped = new Map<string, BreakdownEntry[]>();
  for (const e of entries) {
    const clause = getSopIsoClause(e.sop);
    const arr = grouped.get(clause) ?? [];
    arr.push(e);
    grouped.set(clause, arr);
  }

  const orderedClauses = [
    ...SOP_ISO_CLAUSE_ORDER.filter((c) => grouped.has(c)),
    ...(grouped.has('Other / Cross-cutting') ? ['Other / Cross-cutting'] : []),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-xs">{intro}</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto pr-2 -mr-2 space-y-5">
          {orderedClauses.map((clause) => (
            <div key={clause} className="space-y-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-foreground border-b border-border pb-1">
                {clause}
              </h4>
              <ul className="grid gap-1.5 sm:grid-cols-2 text-xs">
                {grouped.get(clause)!.map((entry) => (
                  <li
                    key={entry.sop}
                    className="flex items-start gap-2 rounded border border-border/60 bg-muted/30 px-2 py-1.5"
                  >
                    <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                      {formatSopDisplayId(entry.sop)}
                    </Badge>
                    <div className="flex flex-col gap-0.5">
                      {entry.trigger && (
                        <span className="text-[10px] text-muted-foreground">
                          Trigger:{' '}
                          <span className="font-medium text-foreground">
                            {TRIGGER_LABEL[entry.trigger]}
                          </span>
                        </span>
                      )}
                      <span className="text-muted-foreground leading-snug">{entry.reason}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}