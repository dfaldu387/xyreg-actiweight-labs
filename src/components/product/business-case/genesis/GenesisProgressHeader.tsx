import React from 'react';
import { Crosshair, ArrowRight, Map, Send, Globe, SendHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

type ColorVariant = 'amber' | 'orange' | 'indigo';

interface GenesisProgressHeaderProps {
  completedCount: number;
  totalCount: number;
  nextStepTitle?: string;
  onShareInvestor?: () => void;
  onShareMarketplace?: () => void;
  onNextStep?: () => void;
  title?: string;
  subtitle?: string;
  colorVariant?: ColorVariant;
}

export function GenesisProgressHeader({
  completedCount,
  totalCount,
  nextStepTitle,
  onShareInvestor,
  onShareMarketplace,
  onNextStep,
  title = "XyReg Genesis",
  subtitle,
  colorVariant = 'amber',
}: GenesisProgressHeaderProps) {
  const { lang } = useTranslation();
  const percentage = Math.round((completedCount / totalCount) * 100);
  
  // Color based on progress
  const getProgressColor = () => {
    if (percentage >= 70) return 'text-emerald-500';
    if (percentage >= 30) {
      if (colorVariant === 'indigo') return 'text-indigo-600';
      if (colorVariant === 'orange') return 'text-orange-600';
      return 'text-amber-500';
    }
    return 'text-rose-500';
  };

  const getProgressBg = () => {
    if (percentage >= 70) return 'stroke-emerald-500';
    if (percentage >= 30) {
      if (colorVariant === 'indigo') return 'stroke-indigo-600';
      if (colorVariant === 'orange') return 'stroke-orange-600';
      return 'stroke-amber-500';
    }
    return 'stroke-rose-500';
  };

  // Color scheme based on variant
  const colors = colorVariant === 'indigo' ? {
    gradient: 'from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20',
    border: 'border-indigo-300 dark:border-indigo-800/50',
    iconBg: 'bg-indigo-200 dark:bg-indigo-800',
    iconText: 'text-indigo-700 dark:text-indigo-200',
    linkText: 'text-indigo-700 dark:text-indigo-400',
    buttonBorder: 'border-indigo-400 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50',
  } : colorVariant === 'orange' ? {
    gradient: 'from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20',
    border: 'border-orange-300 dark:border-orange-800/50',
    iconBg: 'bg-orange-200 dark:bg-orange-800',
    iconText: 'text-orange-700 dark:text-orange-200',
    linkText: 'text-orange-700 dark:text-orange-400',
    buttonBorder: 'border-orange-400 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/50',
  } : {
    gradient: 'from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800/50',
    iconBg: 'bg-amber-200 dark:bg-amber-800',
    iconText: 'text-amber-700 dark:text-amber-200',
    linkText: 'text-amber-700 dark:text-amber-400',
    buttonBorder: 'border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50',
  };

  // SVG circle parameters
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const IconComponent = colorVariant === 'orange' || colorVariant === 'indigo' ? Map : Crosshair;

  return (
    <div className={cn(
      "rounded-xl bg-gradient-to-br border p-6",
      colors.gradient,
      colors.border
    )}>
      <div className="flex items-center gap-6">
        {/* Progress Circle */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              className="stroke-muted fill-none"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={cn("fill-none transition-all duration-500", getProgressBg())}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-bold", getProgressColor())}>
              {percentage}%
            </span>
            <span className="text-xs text-muted-foreground">{lang('ventureBlueprint.complete')}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", colors.iconBg)}>
              <IconComponent className={cn("h-5 w-5", colors.iconText)} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{title}</h1>
              <p className="text-sm text-muted-foreground">
                {subtitle || lang('ventureBlueprint.modulesComplete').replace('{{completed}}', String(completedCount)).replace('{{total}}', String(totalCount))}
              </p>
            </div>
          </div>

          {/* Next step recommendation */}
          {nextStepTitle && percentage < 100 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{lang('ventureBlueprint.next')}</span>
              <button
                onClick={onNextStep}
                className={cn("hover:underline font-medium flex items-center gap-1", colors.linkText)}
              >
                {nextStepTitle}
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}

          {percentage === 100 && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ {lang('ventureBlueprint.businessCaseComplete')}
            </p>
          )}
        </div>

        {/* Share Buttons */}
        <div className="flex flex-col gap-4">
          <Button
            onClick={onShareInvestor}
            variant="outline"
            size="sm"
            className={cn("gap-2", colors.buttonBorder)}
          >
            <SendHorizontal className="h-4 w-4 mr-1" />
            {lang('genesis.shareWithInvestor')}
          </Button>
          <Button
            onClick={onShareMarketplace}
            variant="outline"
            size="sm"
            className={cn("gap-2", colors.buttonBorder)}
          >
            <Globe className="h-4 w-4" />
            {lang('genesis.shareOnMarketplace')}
          </Button>
        </div>
      </div>
    </div>
  );
}
