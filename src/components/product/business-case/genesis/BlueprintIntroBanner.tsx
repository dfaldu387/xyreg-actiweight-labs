import React from 'react';
import { ChevronRight, Compass } from 'lucide-react';

interface BlueprintIntroBannerProps {
  headerActions?: React.ReactNode;
}

/**
 * Indigo intro banner shown at the top of the Venture Blueprint tab.
 * Mirrors the Genesis landing-page intro: explains that this builds the
 * investor-ready narrative, and shows a small completion-color legend.
 */
export function BlueprintIntroBanner({ headerActions }: BlueprintIntroBannerProps) {
  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/50 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20 p-5">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-lg bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center flex-shrink-0">
          <Compass className="h-5 w-5 text-indigo-700 dark:text-indigo-200" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-foreground">
              Venture Blueprint — Investor Narrative
            </h2>
            {headerActions && <div className="ml-auto">{headerActions}</div>}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Build your complete investor-ready narrative. Each section maps
            directly to an input area — click any step to jump to the
            relevant editor, fill in the data, and track your progress.
          </p>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-indigo-700 dark:text-indigo-400">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-amber-400" />
              <span>Amber = incomplete</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Green = complete</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3" />
              <span>Click any step to fill in data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}