import React from 'react';
import { cn } from "@/lib/utils";

interface GapAnnexIISectionGroupProps {
  groupNumber: number;
  groupName: string;
  completedCount: number;
  totalCount: number;
  /** Optional label to show e.g. "3/11 sub-steps" */
  countLabel?: string;
  children: React.ReactNode;
}

export function GapAnnexIISectionGroup({
  groupNumber,
  groupName,
  completedCount,
  totalCount,
  children,
}: GapAnnexIISectionGroupProps) {
  const isAllComplete = completedCount === totalCount;

  return (
    <section className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold",
            isAllComplete
              ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
              : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
          )}>
            {groupNumber}
          </div>
          <h3 className="font-semibold text-sm text-foreground">
            {groupName}
          </h3>
        </div>

        <span className={cn(
          "text-xs font-medium px-2 py-1 rounded-full",
          isAllComplete
            ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
            : "bg-muted text-muted-foreground"
        )}>
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Step Rows */}
      <div className="space-y-2 pl-10">
        {children}
      </div>
    </section>
  );
}
