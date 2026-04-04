import React from 'react';
import { GSPR } from '@/data/annexIRequirements';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GSPRListItemProps {
  gspr: GSPR;
  onToggleComplete: (id: string) => void;
  onToggleApplicable: (id: string) => void;
}

export function GSPRListItem({ gspr, onToggleComplete, onToggleApplicable }: GSPRListItemProps) {
  return (
    <div className={cn(
      "p-4 border rounded-lg transition-all duration-200",
      gspr.isComplete ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" : "bg-card border-border",
      !gspr.isApplicable && "opacity-50 bg-muted"
    )}>
      <div className="flex items-start gap-3">
        {/* Applicable toggle */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Switch
            checked={gspr.isApplicable}
            onCheckedChange={() => onToggleApplicable(gspr.id)}
          />
          <span className="text-xs text-muted-foreground">
            Applicable
          </span>
        </div>

        {/* GSPR content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-mono font-medium text-primary">
                  {gspr.id}
                </span>
                {gspr.isComplete && (
                  <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
                )}
              </div>
              <p className={cn(
                "text-sm leading-relaxed",
                gspr.isComplete && "text-muted-foreground",
                !gspr.isApplicable && "line-through text-muted-foreground"
              )}>
                {gspr.text}
              </p>
            </div>

            {/* Complete checkbox */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Checkbox
                checked={gspr.isComplete}
                onCheckedChange={() => onToggleComplete(gspr.id)}
                disabled={!gspr.isApplicable}
              />
              <span className="text-xs text-muted-foreground">
                Complete
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}