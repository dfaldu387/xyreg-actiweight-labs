import React from 'react';
import { FileText, CheckCircle2, Clock, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WorkspaceItem } from '@/hooks/useFundingProgrammes';

interface WorkspaceStatus {
  id: string;
  status: 'not_started' | 'draft' | 'in_progress' | 'complete';
  notes?: string;
}

interface Props {
  items: WorkspaceItem[];
  statuses: WorkspaceStatus[];
  onStatusChange: (itemId: string, status: WorkspaceStatus['status']) => void;
  readOnly?: boolean;
}

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', icon: Circle, color: 'text-muted-foreground' },
  draft: { label: 'Draft', icon: Clock, color: 'text-amber-500' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-blue-500' },
  complete: { label: 'Complete', icon: CheckCircle2, color: 'text-emerald-600' },
};

const NEXT_STATUS: Record<string, WorkspaceStatus['status']> = {
  not_started: 'draft',
  draft: 'in_progress',
  in_progress: 'complete',
  complete: 'not_started',
};

export function FundingWorkspace({ items, statuses, onStatusChange, readOnly }: Props) {
  const getStatus = (itemId: string): WorkspaceStatus['status'] => {
    return statuses.find(s => s.id === itemId)?.status || 'not_started';
  };

  const completed = items.filter(i => getStatus(i.id) === 'complete').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Application Workspace</h3>
        <span className="text-xs text-muted-foreground">{completed}/{items.length} complete</span>
      </div>

      <div className="grid gap-2">
        {items.map(item => {
          const status = getStatus(item.id);
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg border p-3 bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.title}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {item.required && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 text-destructive border-destructive/30">
                      Required
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={readOnly}
                onClick={() => onStatusChange(item.id, NEXT_STATUS[status])}
                className={cn('gap-1.5 text-xs', config.color)}
              >
                <Icon className="h-3.5 w-3.5" />
                {config.label}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
