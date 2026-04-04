import React, { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import type { RBRPulseStatus } from '@/hooks/useRBRPulseStatus';
import { AlertTriangle, CheckCircle, Clock, Zap, Hexagon, HelpCircle, X } from 'lucide-react';
import { getRBRNodeHelp } from './RBRNodeHelpDescriptions';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface RBRPulseNodeData {
  pulse: RBRPulseStatus;
  onClick?: (nodeId: string) => void;
}

const statusConfig = {
  dormant: {
    bgColor: 'bg-white',
    borderColor: 'border-gray-300',
    pulseColor: 'bg-gray-400',
    textColor: 'text-gray-500',
    accentColor: 'text-gray-600',
    icon: Hexagon,
    label: 'Dormant',
  },
  active: {
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
    pulseColor: 'bg-amber-500',
    textColor: 'text-amber-700',
    accentColor: 'text-amber-600',
    icon: Clock,
    label: 'Active',
  },
  validated: {
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-400',
    pulseColor: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    accentColor: 'text-emerald-600',
    icon: CheckCircle,
    label: 'Validated',
  },
  critical: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-400',
    pulseColor: 'bg-red-500',
    textColor: 'text-red-700',
    accentColor: 'text-red-600',
    icon: AlertTriangle,
    label: 'Critical',
  },
};

// Track accent colors for top bar
const trackAccentColors = {
  engineering: 'bg-cyan-500',
  regulatory: 'bg-purple-500',
  business: 'bg-orange-500',
};

function RBRPulseNodeComponent({ data, id }: NodeProps) {
  const nodeData = data as unknown as RBRPulseNodeData;
  const { pulse, onClick } = nodeData;
  const config = statusConfig[pulse.status];
  const StatusIcon = config.icon;
  const [helpOpen, setHelpOpen] = useState(false);
  const help = getRBRNodeHelp(pulse.nodeType);

  const toggleHelp = () => {
    setHelpOpen((v) => !v);
  };

  const closeHelp = (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setHelpOpen(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking the help button
    if ((e.target as HTMLElement).closest('[data-help-trigger]')) {
      return;
    }
    onClick?.(pulse.nodeId);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative cursor-pointer transition-all duration-200 group',
        'hover:scale-105 hover:z-50'
      )}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-gray-400 !border-gray-300 !w-2 !h-2 !opacity-50 group-hover:!opacity-100"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-gray-400 !border-gray-300 !w-2 !h-2 !opacity-50 group-hover:!opacity-100"
      />

      {/* Card container - clean light design */}
      <div
        className={cn(
          'relative rounded-lg border-2 p-3',
          'shadow-sm hover:shadow-md transition-shadow duration-200',
          'min-w-[150px] max-w-[170px]',
          config.bgColor,
          config.borderColor
        )}
      >
        {/* Track-colored top accent bar */}
        <div 
          className={cn(
            'absolute -top-[2px] left-3 right-3 h-1 rounded-b-full',
            trackAccentColors[pulse.track]
          )}
        />

        {/* Status indicator dot */}
        <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center">
          <span className={cn(
            'h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm',
            config.pulseColor
          )} />
        </div>

        {/* Node content */}
        <div className="space-y-2">
          {/* Header with type badge and help icon */}
          <div className="flex items-center justify-between gap-1">
            <span className={cn(
              'text-[10px] font-mono font-bold uppercase tracking-wider',
              'px-1.5 py-0.5 rounded',
              'bg-gray-100',
              config.textColor
            )}>
              {pulse.nodeType}
            </span>
            <div className="flex items-center gap-1">
              {help && (
                <Popover open={helpOpen} onOpenChange={setHelpOpen}>
                  <PopoverTrigger asChild>
                    <span
                      data-help-trigger
                      role="button"
                      tabIndex={0}
                      className={cn(
                        'h-5 w-5 rounded-full flex items-center justify-center cursor-pointer',
                        'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                        'transition-colors',
                        // Prevent ReactFlow pan/drag from intercepting.
                        'nodrag nopan'
                      )}
                      onPointerDownCapture={(e) => {
                        // Stop ReactFlow's pan/drag listeners before they see this event.
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleHelp();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleHelp();
                        }
                      }}
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                    </span>
                  </PopoverTrigger>
                  <PopoverContent 
                    side="right" 
                    align="start"
                    className="w-80 p-0 bg-white border-gray-200 shadow-lg z-[9999]"
                    // If you click/scroll inside the popover, don't let ReactFlow pan/drag.
                    onPointerDown={(e) => e.stopPropagation()}
                    onWheel={(e) => e.stopPropagation()}
                  >
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 text-sm">{help.title}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-400 hover:text-gray-600"
                          onPointerDown={closeHelp}
                          onClick={closeHelp}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{help.shortDescription}</p>
                    </div>
                    <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
                      <div>
                        <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Why It Matters</h5>
                        <p className="text-xs text-gray-600 leading-relaxed">{help.whyItMatters}</p>
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">QMS Connection</h5>
                        <p className="text-xs text-gray-600 leading-relaxed">{help.qmsConnection}</p>
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Example Decisions</h5>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {help.exampleDecisions.slice(0, 2).map((ex, i) => (
                            <li key={i} className="flex gap-1.5">
                              <span className="text-gray-400">•</span>
                              <span>{ex}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                      <p className="text-[10px] text-gray-500 text-center">
                        Click card for full details and rationale documents
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <StatusIcon className={cn('h-4 w-4', config.accentColor)} />
            </div>
          </div>

          {/* Label */}
          <h4 className="text-sm font-semibold text-gray-900 leading-tight">
            {pulse.label}
          </h4>

          {/* ISO 13485 Clause reference */}
          <p className="text-[10px] text-gray-500 font-mono">
            ISO 13485 {pulse.isoClause}
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-3 pt-1.5 border-t border-gray-200">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-500">Total:</span>
              <span className="text-xs font-bold text-gray-700">{pulse.count}</span>
            </div>
            {pulse.pendingCount > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-2.5 w-2.5 text-amber-500" />
                <span className="text-[10px] font-medium text-amber-600">{pulse.pendingCount}</span>
              </div>
            )}
            {pulse.approvedCount > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-2.5 w-2.5 text-emerald-500" />
                <span className="text-[10px] font-medium text-emerald-600">{pulse.approvedCount}</span>
              </div>
            )}
          </div>

          {/* Linked CAPA indicator */}
          {pulse.linkedCAPA && (
            <div className={cn(
              'flex items-center gap-1.5 pt-1.5 px-2 py-1 -mx-1 rounded-md',
              'bg-red-100 border border-red-200'
            )}>
              <Zap className="h-3 w-3 text-red-500" />
              <span className="text-[10px] font-mono font-bold text-red-600 truncate">
                {pulse.linkedCAPA}
              </span>
            </div>
          )}

          {/* Click indicator */}
          <div className="flex items-center justify-center gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[9px] text-gray-400">Click for details</span>
            <span className="text-[9px] text-gray-500">→</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const RBRPulseNode = memo(RBRPulseNodeComponent);
