import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Paperclip, FileText, Shield, Users, Package, BarChart2, Loader2 } from 'lucide-react';
import { CircularProgress } from '@/components/common/CircularProgress';
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ISO13485SectionItem } from '@/config/gapISO13485Sections';
import type { GenericSectionItem } from './GenericGapLaunchView';
import { GapClauseScopePopover } from './GapClauseScopePopover';
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  qms: Shield,
  management: Users,
  resources: Users,
  realization: Package,
  measurement: BarChart2,
  evidence: FileText,
};

const COLOR_MAP: Record<string, string> = {
  qms: 'text-green-600 bg-green-50 dark:bg-green-950/50',
  management: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50',
  resources: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50',
  realization: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50',
  measurement: 'text-orange-600 bg-orange-50 dark:bg-orange-950/50',
  evidence: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50',
};

interface GapISO13485StepRowProps {
  config: ISO13485SectionItem | GenericSectionItem;
  itemId?: string;
  isComplete: boolean;
  disabled?: boolean;
  completionPercentage?: number;
  framework?: string;
  productId?: string | null;
  companyId?: string | null;
  baseUrl?: string;
  isInherited?: boolean;
  inheritedFromName?: string;
  /** Family sharing scope props */
  isFrameworkShared?: boolean;
  clauseExcludedProductIds?: string[];
  onClauseExclusionChange?: (framework: string, section: string, excludedIds: string[]) => void;
}

export function GapISO13485StepRow({ config, itemId, isComplete, disabled = false, completionPercentage = 0, framework, productId, companyId, baseUrl, isInherited = false, inheritedFromName, isFrameworkShared = false, clauseExcludedProductIds = [], onClauseExclusionChange }: GapISO13485StepRowProps) {
  const navigate = useNavigate();
  const { companyName } = useParams();
  const resolvedBaseUrl = baseUrl || `/app/company/${companyName}`;
  const [creating, setCreating] = useState(false);

  const handleClick = async () => {
    if (disabled || creating) return;

    if (config.type === 'navigate' && 'route' in config && config.route) {
      navigate(`${resolvedBaseUrl}/${config.route}?returnTo=gap-analysis`);
      return;
    }

    // Evidence type — navigate to existing item or auto-create
    if (itemId) {
      navigate(`${resolvedBaseUrl}/gap-analysis/${itemId}`);
      return;
    }

    // No itemId — auto-create gap_analysis_items row
    if (config.type === 'evidence' && framework) {
      setCreating(true);
      try {
        const { data, error } = await supabase
          .from('gap_analysis_items')
          .insert({
            product_id: productId || null,
            requirement: config.title,
            framework,
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
          navigate(`${resolvedBaseUrl}/gap-analysis/${data.id}`);
        }
      } catch (err) {
        console.error('Failed to create gap item:', err);
        toast.error('Failed to create gap analysis item');
      } finally {
        setCreating(false);
      }
    }
  };

  const iconHint = ('iconHint' in config ? config.iconHint : undefined) || 'evidence';
  const Icon = ICON_MAP[iconHint] || FileText;
  const colorClass = COLOR_MAP[iconHint] || COLOR_MAP.evidence;
  const description = ('description' in config ? config.description : undefined) as string | undefined;

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
        <h4 className="font-medium text-sm truncate flex items-center gap-2">
          {config.title}
          {isInherited && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 uppercase tracking-wider flex-shrink-0">
              Shared
            </span>
          )}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {isInherited && inheritedFromName
            ? `Inherited from ${inheritedFromName}`
            : description || (config.type === 'navigate' ? 'Auto-detected from module' : 'Upload evidence document')}
        </p>
      </div>

      {/* Scope badge — right-aligned */}
      {framework && companyId && productId && onClauseExclusionChange && (
        <div className="flex-shrink-0 ml-auto">
          <GapClauseScopePopover
            companyId={companyId}
            currentProductId={productId}
            framework={framework}
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
