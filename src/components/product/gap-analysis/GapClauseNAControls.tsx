import React, { useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Lightbulb } from "lucide-react";
import { GapNAJustification } from "./GapNAJustification";
import {
  updateGapItemStatus,
  updateGapItemNAReason,
} from "@/services/gapAnalysisService";
import { mapGapStatusToUI, mapUIStatusToGap } from "@/utils/statusUtils";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useGapNASuggestion,
  type GapNADeviceContext,
} from "@/hooks/useGapNASuggestion";
import { buildDeviceContextDeepLink } from "@/utils/annexIContextRules";

interface GapClauseNAControlsProps {
  itemId: string;
  /** Raw DB status value (e.g. "compliant", "non_compliant", "not_applicable"). */
  currentStatus?: string | null;
  /** Current saved justification (from gap_analysis_items.automatic_na_reason). */
  initialReason?: string | null;
  isAutoExcluded?: boolean;
  /** Invoked after a successful status flip so parent can refetch. */
  onStatusChanged?: (newUiStatus: "Open" | "Closed" | "N/A") => void;
  disabled?: boolean;
  /** Context used to compute an optional "Suggested N/A" chip. */
  framework?: string | null;
  clause?: string | null;
  itemTitle?: string | null;
  deviceContext?: GapNADeviceContext | null;
}

/**
 * Inline N/A control strip shown above the clause step form.
 * Radio-style button flips the whole clause between its previous non-N/A
 * status and N/A. When N/A is active, renders the required justification
 * textarea. A contextual "Suggested N/A" chip is shown only when the device
 * context yields a concrete reason.
 */
export function GapClauseNAControls({
  itemId,
  currentStatus,
  initialReason,
  isAutoExcluded = false,
  onStatusChanged,
  disabled = false,
  framework,
  clause,
  itemTitle,
  deviceContext,
}: GapClauseNAControlsProps) {
  const queryClient = useQueryClient();
  const uiStatus = mapGapStatusToUI((currentStatus || "non_compliant") as any);
  const isNA = uiStatus === "N/A";

  // Remember the last non-N/A UI status so toggling off restores it.
  const previousNonNAStatusRef = useRef<"Open" | "Closed">(
    uiStatus === "N/A" ? "Open" : (uiStatus as "Open" | "Closed")
  );
  if (!isNA) {
    previousNonNAStatusRef.current = uiStatus as "Open" | "Closed";
  }

  const [busy, setBusy] = useState(false);
  const [prefillReason, setPrefillReason] = useState<string | null>(null);
  const hasJustification = !!(
    (initialReason && initialReason.trim().length > 0) ||
    (prefillReason && prefillReason.trim().length > 0)
  );

  const suggestion = useGapNASuggestion({
    framework,
    clause,
    itemTitle,
    deviceContext,
  });
  const navigate = useNavigate();
  const { productId } = useParams();

  const applyNA = useCallback(
    async (pressed: boolean, suggestedReason?: string) => {
      if (busy || disabled) return;
      setBusy(true);
      const nextUi: "Open" | "Closed" | "N/A" = pressed
        ? "N/A"
        : previousNonNAStatusRef.current;

      // If turning on with a pre-filled reason and no current justification,
      // save it first so the justification textarea hydrates with it.
      if (
        pressed &&
        suggestedReason &&
        !(initialReason && initialReason.trim().length > 0)
      ) {
        await updateGapItemNAReason(itemId, suggestedReason);
        setPrefillReason(suggestedReason);
      }

      const dbStatus = mapUIStatusToGap(nextUi);
      const ok = await updateGapItemStatus(itemId, dbStatus);
      setBusy(false);
      if (ok) {
        queryClient.invalidateQueries({ queryKey: ["gap-analysis-item", itemId] });
        queryClient.invalidateQueries({
          queryKey: ["gap-analysis-items-framework"],
        });
        onStatusChanged?.(nextUi);
      }
    },
    [busy, disabled, itemId, onStatusChanged, queryClient, initialReason]
  );

  const handleToggle = useCallback(() => {
    applyNA(!isNA);
  }, [applyNA, isNA]);

  const statusBadge = !isNA ? (
    <Badge variant="outline" className="text-xs">
      {uiStatus}
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        hasJustification
          ? "bg-muted text-muted-foreground"
          : "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/60"
      )}
    >
      {hasJustification ? "N/A · justified" : "N/A · needs reason"}
    </Badge>
  );

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-muted-foreground">Status:</span>
          {statusBadge}

          {!isNA && suggestion.suggested && suggestion.reason && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => applyNA(true, suggestion.reason)}
                    disabled={busy || disabled}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                      "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100",
                      "dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/60 dark:hover:bg-amber-950/50",
                      (busy || disabled) && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <Lightbulb className="h-3 w-3" />
                    Suggested N/A — {suggestion.reason}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  Click to mark this clause N/A and pre-fill the justification
                  with this reason.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {!isNA && !suggestion.suggested && suggestion.needsContext && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      if (!productId || !suggestion.contextDeepLink) return;
                      // Use the shared builder so subtab + highlight params
                      // are preserved (consistent with the Annex I panel).
                      const url = buildDeviceContextDeepLink(
                        productId,
                        { status: "unknown_needs_context", contextDeepLink: suggestion.contextDeepLink },
                        "gap-analysis"
                      );
                      if (url) navigate(url);
                    }}
                    disabled={
                      disabled || !productId || !suggestion.contextDeepLink
                    }
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                      "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100",
                      "dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/60 dark:hover:bg-amber-950/50",
                      disabled && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Add:{" "}
                    {(suggestion.missingFields || []).join(", ") ||
                      "device context"}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  {suggestion.reason ||
                    "Device context is incomplete for this clause."}
                  {suggestion.contextDeepLink ? (
                    <span className="block mt-1 text-muted-foreground">
                      Opens: {suggestion.contextDeepLink.label}
                    </span>
                  ) : null}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Radio-style control */}
        <button
          type="button"
          role="radio"
          aria-checked={isNA}
          aria-label="Mark this clause as Not Applicable"
          onClick={handleToggle}
          disabled={busy || disabled}
          className={cn(
            "group inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm outline-none transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            (busy || disabled) && "opacity-60 cursor-not-allowed",
            !disabled && !busy && "hover:bg-muted/60"
          )}
        >
          <span
            className={cn(
              "inline-flex h-4 w-4 items-center justify-center rounded-full border transition-colors",
              isNA
                ? "border-amber-500 bg-amber-500/10 dark:border-amber-400"
                : "border-muted-foreground/50 group-hover:border-foreground/70"
            )}
          >
            {isNA && (
              <span className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400" />
            )}
          </span>
          <span
            className={cn(
              "font-medium",
              isNA
                ? "text-amber-700 dark:text-amber-300"
                : "text-muted-foreground"
            )}
          >
            N/A
          </span>
        </button>
      </div>

      {isNA && (
        <GapNAJustification
          itemId={itemId}
          initialReason={initialReason || prefillReason || ""}
          isAutoExcluded={isAutoExcluded}
          disabled={disabled}
        />
      )}
    </div>
  );
}