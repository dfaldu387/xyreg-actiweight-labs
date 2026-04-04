import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Cpu, Cog, Scale, AlertTriangle, FlaskConical, FileText, Loader2 } from 'lucide-react';
import { CircularProgress } from '@/components/common/CircularProgress';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GapClauseScopePopover } from '@/components/company/gap-analysis/GapClauseScopePopover';
import type { AnnexIISectionItem } from '@/config/gapAnnexIISections';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  device: Cpu,
  design: Cog,
  regulatory: Scale,
  risk: AlertTriangle,
  clinical: FlaskConical,
  evidence: FileText,
};

const COLOR_MAP: Record<string, string> = {
  device: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50',
  design: 'text-slate-600 bg-slate-50 dark:bg-slate-950/50',
  regulatory: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50',
  risk: 'text-red-600 bg-red-50 dark:bg-red-950/50',
  clinical: 'text-pink-600 bg-pink-50 dark:bg-pink-950/50',
  evidence: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50',
};

interface GapAnnexIIStepRowProps {
  config: AnnexIISectionItem;
  itemId?: string;
  isComplete: boolean;
  disabled?: boolean;
  completionPercentage?: number;
  framework?: string;
  /** Family sharing scope props */
  companyId?: string | null;
  productId?: string | null;
  isFrameworkShared?: boolean;
  clauseExcludedProductIds?: string[];
  onClauseExclusionChange?: (framework: string, section: string, excludedIds: string[]) => void;
}

export function GapAnnexIIStepRow({ config, itemId, isComplete, disabled = false, completionPercentage = 0, framework, companyId, productId: propProductId, isFrameworkShared = false, clauseExcludedProductIds = [], onClauseExclusionChange }: GapAnnexIIStepRowProps) {
  const navigate = useNavigate();
  const { productId: routeProductId } = useParams();
  const productId = propProductId || routeProductId;
  const [creating, setCreating] = useState(false);

  const handleClick = async () => {
    if (disabled || creating) return;

    // Always navigate to gap item detail (evidence behavior)
    if (itemId) {
      navigate(`/app/product/${productId}/gap-analysis/${itemId}`);
      return;
    }

    // No itemId — auto-create
    if (productId) {
      setCreating(true);
      try {
        const { data, error } = await supabase
          .from('gap_analysis_items')
          .insert({
            product_id: productId,
            requirement: config.title,
            framework: framework || 'MDR Annex II',
            section: config.section,
            clause_id: config.section,
            clause_summary: config.title,
            status: 'non_compliant',
            action_needed: '',
          })
          .select('id')
          .single();

        if (error) throw error;
        if (data) {
          navigate(`/app/product/${productId}/gap-analysis/${data.id}`);
        }
      } catch (err) {
        console.error('Failed to create gap item:', err);
        toast.error('Failed to create gap analysis item');
      } finally {
        setCreating(false);
      }
    }
  };

  const Icon = ICON_MAP[config.iconHint] || FileText;
  const resolvedFramework = framework || 'MDR_ANNEX_II';

  return (
    <div
      className={cn(
        "group flex items-center gap-4 px-4 py-3 rounded-lg border transition-all cursor-pointer",
        isComplete
          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50"
          : "bg-background border-border hover:border-primary/30 hover:bg-muted/30"
      )}
      onClick={handleClick}
    >
      {/* Section badge */}
      <div className={cn(
        "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold",
        isComplete
          ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
          : "bg-muted text-muted-foreground"
      )}>
        {config.section}
      </div>

      {/* Circular progress */}
      <div className="flex-shrink-0">
        <CircularProgress percentage={completionPercentage} size={36} />
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{config.title}</h4>
        <p className="text-xs text-muted-foreground line-clamp-2">
          Upload evidence document
        </p>
      </div>

      {/* Scope badge — right-aligned */}
      {companyId && productId && onClauseExclusionChange && (
        <div className="flex-shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
          <GapClauseScopePopover
            companyId={companyId}
            currentProductId={productId}
            framework={resolvedFramework}
            section={config.section}
            excludedProductIds={clauseExcludedProductIds}
            onExclusionChange={onClauseExclusionChange}
            isFrameworkShared={isFrameworkShared}
          />
        </div>
      )}

      {/* Loading indicator */}
      {creating && (
        <Loader2 className="h-4 w-4 animate-spin flex-shrink-0 text-muted-foreground" />
      )}
    </div>
  );
}
