import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ANNEX_I_SECTIONS } from "@/config/gapAnnexISections";
import {
  resolveAnnexIClause,
  buildDeviceContextDeepLink,
  type AnnexIDeviceContext,
  type AnnexIRuleResult,
} from "@/utils/annexIContextRules";
import { useProductDeviceContext } from "@/hooks/useProductDeviceContext";
import {
  updateGapItemStatus,
  updateGapItemNAReason,
} from "@/services/gapAnalysisService";
import { mapGapStatusToUI } from "@/utils/statusUtils";
import type { GapAnalysisItem } from "@/types/client";

interface AnnexIContextPanelProps {
  items: GapAnalysisItem[];
  productId?: string | null;
  onRefresh?: () => void;
  disabled?: boolean;
}

interface BucketRow {
  section: string;
  title: string;
  result: AnnexIRuleResult;
  /** Matching gap item, if loaded. */
  item?: GapAnalysisItem;
}

/**
 * Device-context summary panel rendered above the GSPR list on the MDR Annex I
 * tab. Buckets the 23 GSPRs into:
 *   - Suggested N/A — context positively excludes (one-click bulk-apply)
 *   - Context missing — needs Device Definition input (deep-links provided)
 *   - Applies — silent count
 */
export function AnnexIContextPanel({
  items,
  productId,
  onRefresh,
  disabled = false,
}: AnnexIContextPanelProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { context, isLoading } = useProductDeviceContext(productId);
  const [busy, setBusy] = useState(false);

  // Index gap items by clause section for quick lookup.
  const itemsBySection = useMemo(() => {
    const map = new Map<string, GapAnalysisItem>();
    items.forEach((it) => {
      const sec = (it as any).section as string | undefined;
      if (!sec) return;
      // Prefer the first item if duplicates exist.
      if (!map.has(sec)) map.set(sec, it);
    });
    return map;
  }, [items]);

  const { suggestedNA, needsContext, appliesCount } = useMemo(() => {
    const suggestedNA: BucketRow[] = [];
    const needsContext: BucketRow[] = [];
    let appliesCount = 0;

    if (!context) {
      return { suggestedNA, needsContext, appliesCount };
    }

    ANNEX_I_SECTIONS.forEach((section) => {
      const result = resolveAnnexIClause(
        section.section,
        context as AnnexIDeviceContext
      );
      const item = itemsBySection.get(section.section);
      const row: BucketRow = {
        section: section.section,
        title: section.title,
        result,
        item,
      };
      if (result.status === "suggested_na") suggestedNA.push(row);
      else if (result.status === "unknown_needs_context")
        needsContext.push(row);
      else appliesCount += 1;
    });

    return { suggestedNA, needsContext, appliesCount };
  }, [context, itemsBySection]);

  const handleBulkApplyNA = async () => {
    if (busy || disabled) return;
    setBusy(true);

    let applied = 0;
    let kept = 0;

    for (const row of suggestedNA) {
      const item = row.item;
      if (!item) continue;
      const ui = mapGapStatusToUI(item.status as any);
      // Never overwrite explicit human decisions (Closed / N/A already set).
      if (ui === "Closed" || ui === "N/A") {
        kept += 1;
        continue;
      }
      const reason = row.result.reason || "Auto-classified N/A from device context";
      await updateGapItemNAReason(item.id, reason);
      const ok = await updateGapItemStatus(item.id, "not_applicable");
      if (ok) applied += 1;
    }

    queryClient.invalidateQueries({ queryKey: ["gap-analysis-items-framework"] });
    onRefresh?.();
    setBusy(false);

    // Lightweight feedback in the console — the surrounding list will refresh.
    if (kept > 0) {
      // eslint-disable-next-line no-console
      console.info(`[Annex I] Applied ${applied} N/A — kept ${kept} with explicit user status.`);
    }
  };

  const openDeepLink = (row: BucketRow) => {
    if (!productId) return;
    const url = buildDeviceContextDeepLink(
      productId,
      row.result,
      "gap-analysis"
    );
    if (url) navigate(url);
  };

  if (!productId) return null;

  if (isLoading) {
    return (
      <div className="mb-6 rounded-xl border bg-card p-4 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading device context…
      </div>
    );
  }

  if (!context) return null;

  const totalConsidered =
    suggestedNA.length + needsContext.length + appliesCount;

  return (
    <div className="mb-6 rounded-xl border bg-gradient-to-br from-card to-muted/40 p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold">
            Device context auto-applied to this analysis
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalConsidered} GSPRs evaluated against your device definition.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Bucket 1 — Suggested N/A */}
        {suggestedNA.length > 0 && (
          <section className="rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  Suggested N/A — {suggestedNA.length} GSPR{suggestedNA.length !== 1 ? "s" : ""}
                </h4>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={busy || disabled}
                onClick={handleBulkApplyNA}
                className="bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 border-emerald-300 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-100"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Applying…
                  </>
                ) : (
                  <>Apply all {suggestedNA.length} as N/A</>
                )}
              </Button>
            </div>
            <ul className="space-y-1.5">
              {suggestedNA.map((row) => (
                <li
                  key={row.section}
                  className="flex items-start gap-3 text-sm"
                >
                  <Badge
                    variant="outline"
                    className="bg-background text-xs font-mono shrink-0 mt-0.5"
                  >
                    GSPR {row.section}
                  </Badge>
                  <span className="flex-1 min-w-0">
                    <span className="font-medium text-foreground">
                      {row.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {row.result.reason}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Bucket 2 — Context missing */}
        {needsContext.length > 0 && (
          <section className="rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Context missing — {needsContext.length} GSPR
                {needsContext.length !== 1 ? "s" : ""} cannot be auto-classified
              </h4>
            </div>
            <p className="text-xs text-amber-800/80 dark:text-amber-200/70 mb-3 -mt-1">
              These clauses can't be auto-classified yet because the listed fields haven't been answered. Open Device Basics from any link below to fill them in — the panel updates automatically.
            </p>
            <ul className="space-y-3">
              {needsContext.map((row) => (
                <li key={row.section} className="text-sm">
                  <div className="flex items-start gap-3">
                    <Badge
                      variant="outline"
                      className="bg-background text-xs font-mono shrink-0 mt-0.5"
                    >
                      GSPR {row.section}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">
                        {row.title}
                      </div>
                      {row.result.missingFields && row.result.missingFields.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          → Add: {row.result.missingFields.join(", ")}
                        </div>
                      )}
                      {row.result.contextDeepLink && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1.5 h-7 px-2 text-xs text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                          onClick={() => openDeepLink(row)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1.5" />
                          {row.result.contextDeepLink.label}
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Bucket 3 — Applies */}
        <section
          className={cn(
            "flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground"
          )}
        >
          <ShieldCheck className="h-4 w-4 text-foreground/70" />
          <span>
            <strong className="text-foreground">{appliesCount}</strong> GSPR
            {appliesCount !== 1 ? "s" : ""} apply to this device based on
            current context.
          </span>
        </section>

        {suggestedNA.length === 0 && needsContext.length === 0 && (
          <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Device context is complete — no GSPRs are auto-excluded and nothing
            is missing for classification.
          </div>
        )}
      </div>
    </div>
  );
}