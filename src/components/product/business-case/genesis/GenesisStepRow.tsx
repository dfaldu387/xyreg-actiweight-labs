import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Circle, ChevronRight, Star, Cpu, FlaskConical, AlertTriangle, LayoutGrid, Flag, Users, Shield, Scale, Factory, Cog } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

// Module color and icon mapping (matches "Powered by XyReg OS" section)
const MODULE_STYLES: Record<string, { icon: React.ComponentType<{ className?: string }>; colorClass: string }> = {
  // Device-related (blue)
  'Device Definition': { icon: Cpu, colorClass: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50' },
  'Device Info': { icon: Cpu, colorClass: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50' },
  // Clinical-related (pink)
  'Clinical Trials': { icon: FlaskConical, colorClass: 'text-pink-600 bg-pink-50 dark:bg-pink-950/50' },
  'Clinical Evidence': { icon: FlaskConical, colorClass: 'text-pink-600 bg-pink-50 dark:bg-pink-950/50' },
  'Clinical Evidence Plan': { icon: FlaskConical, colorClass: 'text-pink-600 bg-pink-50 dark:bg-pink-950/50' },
  // Risk-related (red)
  'Risk Management': { icon: AlertTriangle, colorClass: 'text-red-600 bg-red-50 dark:bg-red-950/50' },
  'Risk Analysis': { icon: AlertTriangle, colorClass: 'text-red-600 bg-red-50 dark:bg-red-950/50' },
  // Business Case umbrella (amber)
  'Business Case': { icon: LayoutGrid, colorClass: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
  'Market Analysis': { icon: LayoutGrid, colorClass: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
  'Reimbursement': { icon: LayoutGrid, colorClass: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
  'Reimbursement Strategy': { icon: LayoutGrid, colorClass: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
  'GTM Strategy': { icon: LayoutGrid, colorClass: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
  'Use of Proceeds': { icon: LayoutGrid, colorClass: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
  // Milestones/Gates (rose)
  'Milestones': { icon: Flag, colorClass: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50' },
  'Essential Gates': { icon: Flag, colorClass: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50' },
  'Essential Gates & Timeline': { icon: Flag, colorClass: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50' },
  // Team (cyan)
  'Team': { icon: Users, colorClass: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50' },
  'Team Profile': { icon: Users, colorClass: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50' },
  // IP (purple)
  'IP Portfolio': { icon: Shield, colorClass: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50' },
  'IP Management': { icon: Shield, colorClass: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50' },
  // Regulatory (indigo)
  'Regulatory Pathway': { icon: Scale, colorClass: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' },
  'Regulatory': { icon: Scale, colorClass: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' },
  // Manufacturing/Operations (teal)
  'Manufacturing & Operations': { icon: Factory, colorClass: 'text-teal-600 bg-teal-50 dark:bg-teal-950/50' },
  'Manufacturing': { icon: Factory, colorClass: 'text-teal-600 bg-teal-50 dark:bg-teal-950/50' },
  // Design Controls (slate)
  'Design Controls': { icon: Cog, colorClass: 'text-slate-600 bg-slate-50 dark:bg-slate-950/50' },
};

interface GenesisStepRowProps {
  stepId: string;
  stepNumber: number;
  title: string;
  description: string;
  route: string;
  moduleLabel: string;
  isComplete: boolean;
  isNew?: boolean;
  disabled?: boolean;
  returnTo?: 'genesis' | 'venture-blueprint';
  onCustomClick?: () => void;
}

export function GenesisStepRow({
  stepId,
  stepNumber,
  title,
  description,
  route,
  moduleLabel,
  isComplete,
  isNew,
  disabled = false,
  returnTo = 'venture-blueprint',
  onCustomClick,
}: GenesisStepRowProps) {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const { productId } = useParams();

  const handleNavigate = () => {
    if (disabled) return;
    if (onCustomClick) {
      onCustomClick();
      return;
    }
    const separator = route.includes('?') ? '&' : '?';
    const fullRoute = `/app/product/${productId}/${route}${separator}returnTo=${returnTo}`;
    navigate(fullRoute);
  };

  const getDisplayNumber = () => {
    if (Number.isInteger(stepNumber)) {
      return stepNumber.toString();
    }
    const intPart = Math.floor(stepNumber);
    const decimalPart = Math.round((stepNumber % 1) * 10);
    if (decimalPart === 1) return `${intPart}a`;
    if (decimalPart === 2) return `${intPart}b`;
    if (decimalPart === 3) return `${intPart}c`;
    return intPart.toString();
  };
  const displayNumber = getDisplayNumber();

  // Get module styling
  const moduleName = moduleLabel.split(' → ')[0];
  const moduleStyle = MODULE_STYLES[moduleName] || { icon: LayoutGrid, colorClass: 'text-muted-foreground bg-muted/50' };
  const ModuleIcon = moduleStyle.icon;

  return (
    <div
      className={cn(
        "group flex items-center gap-4 px-4 py-3 rounded-lg border transition-all cursor-pointer",
        isComplete
          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50"
          : "bg-background border-border hover:border-primary/30 hover:bg-muted/30"
      )}
      onClick={handleNavigate}
    >
      {/* Step number badge */}
      <div className={cn(
        "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold",
        isComplete
          ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
          : "bg-muted text-muted-foreground"
      )}>
        {displayNumber}
      </div>

      {/* Completion icon */}
      <div className="flex-shrink-0">
        {isComplete ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground/50" />
        )}
      </div>

      {/* Title & Description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={cn(
            "font-medium text-sm truncate",
            isComplete ? "text-foreground" : "text-foreground"
          )}>
            {title}
          </h4>
          {isNew && (
            <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
              <Star className="h-2.5 w-2.5" />
              {lang('ventureBlueprint.new')}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {description}
        </p>
      </div>

      {/* Module source badge with color */}
      <span className={cn(
        "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium",
        moduleStyle.colorClass
      )}>
        <ModuleIcon className="h-3 w-3" />
        {moduleName}
      </span>

      {/* Action */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
          isComplete && "text-emerald-600"
        )}
        disabled={disabled}
      >
        {isComplete ? lang('ventureBlueprint.review') : lang('ventureBlueprint.start')}
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
