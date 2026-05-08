import React from 'react';
import { cn } from '@/lib/utils';

interface BlueprintSectionGroupProps {
  groupNumber: number;
  groupName: string;
  tagline?: string;
  completedCount: number;
  totalCount: number;
  children: React.ReactNode;
}

/**
 * Mirror of GapAnnexIISectionGroup — numbered section header with X/Y pill,
 * indented child rows.
 */
export function BlueprintSectionGroup({
  groupNumber,
  groupName,
  tagline,
  completedCount,
  totalCount,
  children,
}: BlueprintSectionGroupProps) {
  const isAllComplete = completedCount === totalCount && totalCount > 0;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold',
              isAllComplete
                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
            )}
          >
            {groupNumber}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground leading-tight">
              {groupName}
            </h3>
            {tagline && (
              <p className="text-xs text-muted-foreground mt-0.5">{tagline}</p>
            )}
          </div>
        </div>

        <span
          className={cn(
            'text-xs font-medium px-2 py-1 rounded-full',
            isAllComplete
              ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {completedCount}/{totalCount}
        </span>
      </div>

      <div className="space-y-2 pl-10">{children}</div>
    </section>
  );
}