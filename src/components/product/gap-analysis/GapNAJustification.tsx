import React, { useEffect, useMemo, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { debounce } from "@/utils/debounce";
import { updateGapItemNAReason } from "@/services/gapAnalysisService";

interface GapNAJustificationProps {
  itemId: string;
  initialReason?: string | null;
  isAutoExcluded?: boolean;
  disabled?: boolean;
  onSaved?: (reason: string) => void;
}

/**
 * Required justification panel shown whenever a gap item is N/A.
 * Saves to gap_analysis_items.automatic_na_reason (debounced 600ms).
 */
export function GapNAJustification({
  itemId,
  initialReason,
  isAutoExcluded = false,
  disabled = false,
  onSaved,
}: GapNAJustificationProps) {
  const [value, setValue] = useState<string>(initialReason ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const lastSaved = useRef<string>(initialReason ?? "");

  // Sync if a different item / new initial reason flows in
  useEffect(() => {
    setValue(initialReason ?? "");
    lastSaved.current = initialReason ?? "";
    setStatus("idle");
  }, [itemId, initialReason]);

  const debouncedSave = useMemo(
    () =>
      debounce(async (next: string) => {
        const trimmed = next.trim();
        if (trimmed === lastSaved.current.trim()) {
          setStatus("idle");
          return;
        }
        setStatus("saving");
        const ok = await updateGapItemNAReason(itemId, trimmed);
        if (ok) {
          lastSaved.current = trimmed;
          setStatus("saved");
          onSaved?.(trimmed);
          // Auto-fade saved indicator
          setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1500);
        } else {
          setStatus("error");
        }
      }, 600),
    [itemId, onSaved]
  );

  useEffect(() => () => debouncedSave.cancel(), [debouncedSave]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setValue(next);
    debouncedSave(next);
  };

  const isMissing = value.trim().length === 0;

  return (
    <div
      className={`mt-3 rounded-md border p-3 ${
        isMissing
          ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/60"
          : "border-border bg-muted/30"
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor={`na-reason-${itemId}`}
          className="text-sm font-medium text-foreground"
        >
          Why is this requirement not applicable? <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-h-[1rem]">
          {status === "saving" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </>
          )}
          {status === "saved" && (
            <>
              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Saved
            </>
          )}
          {status === "error" && (
            <>
              <AlertCircle className="h-3 w-3 text-destructive" /> Save failed
            </>
          )}
        </div>
      </div>
      <Textarea
        id={`na-reason-${itemId}`}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={
          isAutoExcluded
            ? "Auto-suggested by the platform — review and edit if needed."
            : "e.g. Device contains no software, so IEC 62304 §5.x does not apply."
        }
        className="min-h-[72px] text-sm"
      />
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        This justification is visible to reviewers, Notified Body and auditors.
        {isMissing && (
          <span className="ml-1 text-amber-700 dark:text-amber-400 font-medium">
            A reason is required while this item is marked N/A.
          </span>
        )}
      </p>
    </div>
  );
}