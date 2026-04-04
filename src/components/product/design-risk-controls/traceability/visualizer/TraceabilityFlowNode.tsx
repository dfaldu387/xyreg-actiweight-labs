import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, XCircle, Circle } from 'lucide-react';
import { TraceabilityNodeData } from './useTraceabilityGraph';

const TYPE_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  bom_item: { bg: 'bg-stone-50 dark:bg-stone-950/30', border: 'border-stone-300 dark:border-stone-700', icon: '📦' },
  device_component: { bg: 'bg-sky-50 dark:bg-sky-950/30', border: 'border-sky-300 dark:border-sky-700', icon: '🔩' },
  feature: { bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-300 dark:border-purple-700', icon: '⭐' },
  user_need: { bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-300 dark:border-violet-700', icon: '🎯' },
  system_requirement: { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-300 dark:border-blue-700', icon: '📋' },
  software_requirement: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-300 dark:border-cyan-700', icon: '💻' },
  hardware_requirement: { bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-300 dark:border-teal-700', icon: '🔧' },
  hazard: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-300 dark:border-red-700', icon: '⚠️' },
  risk_control: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-300 dark:border-amber-700', icon: '🛡️' },
  test_case: { bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-300 dark:border-green-700', icon: '🧪' },
};

function StatusIcon({ status }: { status?: string }) {
  switch (status) {
    case 'passed':
    case 'approved':
    case 'verified':
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    case 'failed':
    case 'rejected':
      return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    case 'draft':
    case 'pending':
      return <Circle className="h-3.5 w-3.5 text-muted-foreground" />;
    default:
      return null;
  }
}

interface TraceabilityFlowNodeProps {
  data: TraceabilityNodeData;
  selected?: boolean;
}

export const TraceabilityFlowNode = memo(({ data, selected }: TraceabilityFlowNodeProps) => {
  const styles = TYPE_STYLES[data.type] || { bg: 'bg-muted', border: 'border-border', icon: '📄' };
  
  return (
    <div
      className={cn(
        'px-3 py-2 rounded-lg border-2 shadow-sm min-w-[200px] max-w-[240px] transition-all',
        styles.bg,
        styles.border,
        selected && 'ring-2 ring-primary ring-offset-2',
        data.isOrphan && 'border-dashed border-red-400 dark:border-red-600'
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground !w-2 !h-2" />
      
      <div className="flex items-start gap-2">
        <span className="text-base flex-shrink-0">{styles.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs text-foreground truncate">
              {data.identifier}
            </span>
            <StatusIcon status={data.status} />
            {data.isOrphan && (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
            {data.name || data.description || 'No description'}
          </p>
          {data.linkCount > 0 && (
            <span className="text-[9px] text-muted-foreground mt-1 block">
              {data.linkCount} link{data.linkCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground !w-2 !h-2" />
    </div>
  );
});

TraceabilityFlowNode.displayName = 'TraceabilityFlowNode';
