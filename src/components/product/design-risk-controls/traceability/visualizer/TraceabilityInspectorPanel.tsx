import React, { useCallback } from 'react';
import { X, Link2, AlertTriangle, CheckCircle2, XCircle, Circle, ExternalLink } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { TraceabilityNodeData } from './useTraceabilityGraph';
import { cn } from '@/lib/utils';

const TYPE_TO_ROUTE: Record<string, { tab: string; subTab: string }> = {
  bom_item: { tab: 'bom', subTab: '' },
  device_component: { tab: 'device-architecture', subTab: '' },
  feature: { tab: 'general', subTab: 'features' },
  user_need: { tab: 'requirement-specifications', subTab: 'user-needs' },
  system_requirement: { tab: 'requirement-specifications', subTab: 'system-requirements' },
  software_requirement: { tab: 'requirement-specifications', subTab: 'software-requirements' },
  hardware_requirement: { tab: 'requirement-specifications', subTab: 'hardware-requirements' },
  hazard: { tab: 'risk-management', subTab: 'hazard-traceability' },
  risk_control: { tab: 'risk-management', subTab: 'hazard-traceability' },
  test_case: { tab: 'verification-validation', subTab: 'test-cases' },
};

interface TraceabilityInspectorPanelProps {
  selectedNode: TraceabilityNodeData | null;
  onClose: () => void;
  chainItems: TraceabilityNodeData[];
}

const TYPE_LABELS: Record<string, string> = {
  bom_item: 'BOM Item',
  device_component: 'Device Component',
  feature: 'Key Feature',
  user_need: 'User Need',
  system_requirement: 'System Requirement',
  software_requirement: 'Software Requirement',
  hardware_requirement: 'Hardware Requirement',
  hazard: 'Hazard',
  risk_control: 'Risk Control',
  test_case: 'Test Case',
};

function StatusBadge({ status }: { status?: string }) {
  const config = {
    passed: { label: 'Passed', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    approved: { label: 'Approved', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    verified: { label: 'Verified', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    failed: { label: 'Failed', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  }[status || 'draft'] || { label: status || 'Unknown', className: 'bg-muted text-muted-foreground' };
  
  return <Badge variant="outline" className={cn('text-xs', config.className)}>{config.label}</Badge>;
}

export function TraceabilityInspectorPanel({
  selectedNode,
  onClose,
  chainItems
}: TraceabilityInspectorPanelProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const navigateToItem = useCallback((item: TraceabilityNodeData) => {
    const route = TYPE_TO_ROUTE[item.type];
    if (!route) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', route.tab);
    newParams.set('subTab', route.subTab);
    newParams.set('returnTo', 'visual');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  if (!selectedNode) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div className="space-y-2">
          <Link2 className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Click on a node to view details and its traceability chain
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{selectedNode.identifier}</h3>
            <StatusBadge status={selectedNode.status} />
          </div>
          <p className="text-xs text-muted-foreground">{TYPE_LABELS[selectedNode.type] || selectedNode.type}</p>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs text-primary gap-1"
            onClick={() => navigateToItem(selectedNode)}
          >
            <ExternalLink className="h-3 w-3" />
            Go to item
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Description */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">Description</h4>
            <p className="text-sm text-foreground break-words">
              {selectedNode.description || selectedNode.name || 'No description available'}
            </p>
          </div>

          {/* Orphan Warning */}
          {selectedNode.isOrphan && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Orphan Detected</p>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  This item has no traceability links. Consider linking it to maintain the "golden thread."
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Traceability Chain */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Traceability Chain</h4>
            {chainItems.length > 0 ? (
              <div className="space-y-2">
                {chainItems.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => navigateToItem(item)}
                    className={cn(
                      'p-2 rounded-md border text-sm cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all',
                      item.id === selectedNode.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-muted/50 border-border'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground flex items-center gap-1">
                        {item.identifier}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {TYPE_LABELS[item.type]?.split(' ')[0] || item.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 break-words">
                      {item.description || item.name}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No linked items in chain</p>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
