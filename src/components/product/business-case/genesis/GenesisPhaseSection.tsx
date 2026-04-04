import React from 'react';
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

type ColorVariant = 'amber' | 'orange';

interface GenesisPhaSectionProps {
  phaseNumber: number;
  title: string;
  goal: string;
  completedCount: number;
  totalCount: number;
  children: React.ReactNode;
  className?: string;
  colorVariant?: ColorVariant;
}

export function GenesisPhaseSection({
  phaseNumber,
  title,
  goal,
  completedCount,
  totalCount,
  children,
  className,
  colorVariant = 'amber',
}: GenesisPhaSectionProps) {
  const { lang } = useTranslation();
  const isAllComplete = completedCount === totalCount;

  const colors = colorVariant === 'orange' ? {
    incomplete: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
  } : {
    incomplete: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
  };

  return (
    <section className={cn("space-y-3", className)}>
      {/* Phase Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold",
            isAllComplete
              ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
              : colors.incomplete
          )}>
            {phaseNumber}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {goal}
            </p>
          </div>
        </div>

        {/* Completion badge */}
        <span className={cn(
          "text-xs font-medium px-2 py-1 rounded-full",
          isAllComplete
            ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
            : "bg-muted text-muted-foreground"
        )}>
          {lang('ventureBlueprint.xOfYComplete').replace('{{completed}}', String(completedCount)).replace('{{total}}', String(totalCount))}
        </span>
      </div>

      {/* Steps */}
      <div className="space-y-2 pl-10">
        {children}
      </div>
    </section>
  );
}
