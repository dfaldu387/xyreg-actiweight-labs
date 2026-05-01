import React, { useEffect, useState } from 'react';
import { ListChecks, ChevronDown, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  listGlobalWIsForSop,
  materializeGlobalWIForCompany,
  type GlobalWI,
} from '@/services/globalWorkInstructionsService';

interface Props {
  /** Canonical foundational SOP key (e.g. "SOP-001"). */
  sopTemplateKey: string;
  companyId: string;
  /** Company phase id used to anchor a materialized per-company CI. */
  phaseId?: string | null;
  onOpened?: (ciId: string) => void;
}

/**
 * Configure-panel section shown for foundational SOPs. Lists the global
 * Work Instructions derived from this SOP. Opening one materializes a
 * per-company CI on first click and reuses it on subsequent opens.
 */
export function LinkedWorkInstructionsSection({
  sopTemplateKey,
  companyId,
  phaseId,
  onOpened,
}: Props) {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [wis, setWis] = useState<GlobalWI[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listGlobalWIsForSop(sopTemplateKey)
      .then((rows) => {
        if (!cancelled) setWis(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sopTemplateKey]);

  const handleOpen = async (wi: GlobalWI) => {
    if (!companyId || !phaseId) {
      toast.error('Cannot open WI — missing company or phase context');
      return;
    }
    setBusyId(wi.id);
    try {
      const ciId = await materializeGlobalWIForCompany({
        globalWiId: wi.id,
        companyId,
        phaseId,
      });
      if (!ciId) {
        toast.error('Failed to open Work Instruction');
        return;
      }
      if (onOpened) onOpened(ciId);
      else {
        window.dispatchEvent(
          new CustomEvent('xyreg:open-draft-by-id', { detail: { ciId } }),
        );
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border rounded-md bg-muted/30"
    >
      <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium hover:bg-muted/50 rounded-md">
        <span className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-purple-600" />
          <span>Linked Work Instructions</span>
          {!loading && wis.length > 0 && (
            <span className="text-[10px] font-normal text-muted-foreground">
              ({wis.length})
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 space-y-2">
        <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
          <Sparkles className="w-3 h-3 mt-0.5 text-purple-600 shrink-0" />
          <span>
            Foundational SOPs share the same Work Instructions across all
            companies. Open any one to load a per-company copy you can edit.
          </span>
        </p>

        {loading ? (
          <div className="flex items-center text-xs text-muted-foreground py-2">
            <Loader2 className="w-3 h-3 animate-spin mr-2" /> Loading…
          </div>
        ) : wis.length === 0 ? (
          <div className="text-[11px] text-muted-foreground italic py-2">
            No global Work Instructions seeded for this SOP yet.
          </div>
        ) : (
          <ul className="space-y-1">
            {wis.map((wi) => (
              <li
                key={wi.id}
                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded border bg-background text-xs"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    <span className="text-muted-foreground mr-1.5">
                      {wi.wi_number}
                    </span>
                    {wi.title}
                  </div>
                  {wi.focus && (
                    <div className="text-[10px] text-muted-foreground truncate">
                      {wi.focus}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 shrink-0"
                  onClick={() => handleOpen(wi)}
                  disabled={busyId === wi.id}
                >
                  {busyId === wi.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <ExternalLink className="w-3 h-3 mr-1" /> Open
                    </>
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}