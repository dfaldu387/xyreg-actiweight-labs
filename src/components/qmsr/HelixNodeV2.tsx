import React, { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Hexagon, 
  HelpCircle, 
  X,
  Building2,
  Cpu
} from 'lucide-react';
import { NestedRBRIndicator } from './NestedRBRIndicator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { HelixNodeStatus, HelixLevel, HelixTrack } from '@/config/helixNodeConfig';
import { TRACK_COLORS, STATUS_COLORS } from '@/config/helixNodeConfig';

export interface HelixNodeData {
  id: string;
  label: string;
  shortLabel: string;
  level: HelixLevel;
  track: HelixTrack;
  isoClause: string;
  status: HelixNodeStatus;
  description: string;
  nestedRBR?: {
    type: string;
    label: string;
    status: HelixNodeStatus;
  };
  productCount?: number;
  pendingCount?: number;
  onClick?: (nodeId: string) => void;
  onRBRClick?: (rbrType: string) => void;
}

const statusConfig = {
  dormant: {
    icon: Hexagon,
    label: 'Dormant',
  },
  active: {
    icon: Clock,
    label: 'Active',
  },
  validated: {
    icon: CheckCircle,
    label: 'Validated',
  },
  critical: {
    icon: AlertTriangle,
    label: 'Critical',
  },
};

function HelixNodeV2Component({ data, id }: NodeProps) {
  const nodeData = data as unknown as HelixNodeData;
  const [helpOpen, setHelpOpen] = useState(false);
  
  const trackColor = TRACK_COLORS[nodeData.track];
  const statusColor = STATUS_COLORS[nodeData.status];
  const StatusIcon = statusConfig[nodeData.status].icon;

  const handleClick = (e: React.MouseEvent) => {
    // Only skip if clicking the help trigger specifically
    if ((e.target as HTMLElement).closest('[data-help-trigger]')) {
      return;
    }
    nodeData.onClick?.(nodeData.id);
  };

  const handleRBRClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeData.nestedRBR && nodeData.onRBRClick) {
      nodeData.onRBRClick(nodeData.nestedRBR.type);
    }
    // Also open the node drawer
    nodeData.onClick?.(nodeData.id);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative cursor-pointer transition-all duration-200 group nodrag nopan',
        'hover:z-50'
      )}
    >
      {/* Connection handles - hidden but functional */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-600 !border-slate-500 !w-2 !h-2 !opacity-0 pointer-events-none"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-600 !border-slate-500 !w-2 !h-2 !opacity-0 pointer-events-none"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!bg-slate-600 !border-slate-500 !w-2 !h-2 !opacity-0 pointer-events-none"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!bg-slate-600 !border-slate-500 !w-2 !h-2 !opacity-0 pointer-events-none"
      />

      {/* Card container - dark neon design */}
      <div
        className={cn(
          'relative rounded-lg border p-3',
          'min-w-[160px] max-w-[180px]',
          'transition-all duration-300',
          'bg-slate-900/95 backdrop-blur-sm'
        )}
        style={{
          borderColor: trackColor.border,
          boxShadow: nodeData.status !== 'dormant' 
            ? `0 0 20px ${statusColor.glow}40, 0 0 40px ${statusColor.glow}20`
            : `0 0 10px ${trackColor.glow}20`,
        }}
      >
        {/* Track-colored top accent bar with glow */}
        <div 
          className="absolute -top-[1px] left-3 right-3 h-1 rounded-b-full"
          style={{ 
            backgroundColor: trackColor.primary,
            boxShadow: `0 0 8px ${trackColor.glow}`,
          }}
        />

        {/* Status pulse indicator */}
        <div className="absolute -top-2 -right-2 flex items-center justify-center">
          <span 
            className={cn(
              'h-4 w-4 rounded-full border-2 border-slate-900',
              nodeData.status === 'active' && 'animate-pulse-slow',
              nodeData.status === 'critical' && 'animate-pulse-critical'
            )}
            style={{ backgroundColor: statusColor.primary }}
          />
        </div>

        {/* Level badge */}
        <div className="absolute -top-2 left-3">
          <Badge 
            variant="outline" 
            className={cn(
              'h-5 px-1.5 text-[9px] font-bold uppercase tracking-wider',
              'border-slate-700 bg-slate-900',
              nodeData.level === 'company' 
                ? 'text-purple-400' 
                : 'text-cyan-400'
            )}
          >
            {nodeData.level === 'company' ? (
              <Building2 className="h-2.5 w-2.5 mr-0.5" />
            ) : (
              <Cpu className="h-2.5 w-2.5 mr-0.5" />
            )}
            {nodeData.level}
          </Badge>
        </div>

        {/* Node content */}
        <div className="space-y-2 pt-2">
          {/* Header with track label and help */}
          <div className="flex items-center justify-between gap-1">
            <span 
              className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ 
                color: trackColor.text,
                backgroundColor: trackColor.bg,
              }}
            >
              {trackColor.label}
            </span>
            <div className="flex items-center gap-1">
              <Popover open={helpOpen} onOpenChange={setHelpOpen}>
                <PopoverTrigger asChild>
                  <span
                    data-help-trigger
                    role="button"
                    tabIndex={0}
                    className={cn(
                      'h-5 w-5 rounded-full flex items-center justify-center cursor-pointer',
                      'text-slate-500 hover:text-slate-300 hover:bg-slate-800',
                      'transition-colors nodrag nopan'
                    )}
                    onPointerDownCapture={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setHelpOpen(!helpOpen);
                    }}
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </span>
                </PopoverTrigger>
                <PopoverContent 
                  side="right" 
                  align="start"
                  className="w-72 p-0 bg-slate-900 border-slate-700 shadow-xl z-[9999]"
                  onPointerDown={(e) => e.stopPropagation()}
                  onWheel={(e) => e.stopPropagation()}
                >
                  <div className="p-3 border-b border-slate-800">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-100 text-sm">{nodeData.label}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-500 hover:text-slate-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHelpOpen(false);
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      ISO 13485 Clause {nodeData.isoClause}
                    </p>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {nodeData.description}
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
              <StatusIcon 
                className="h-4 w-4"
                style={{ color: statusColor.primary }}
              />
            </div>
          </div>

          {/* Label */}
          <h4 className="text-sm font-semibold text-slate-100 leading-tight">
            {nodeData.label}
          </h4>

          {/* ISO 13485 Clause reference */}
          <p className="text-[10px] text-slate-500 font-mono">
            ISO 13485 {nodeData.isoClause}
          </p>

          {/* Nested RBR indicator (if present) */}
          {nodeData.nestedRBR && (
            <div data-rbr-trigger className="pt-1">
              <NestedRBRIndicator
                label={nodeData.nestedRBR.label}
                status={nodeData.nestedRBR.status}
                onClick={handleRBRClick}
              />
            </div>
          )}

          {/* Stats row (for device-level nodes) */}
          {nodeData.level === 'device' && (nodeData.productCount !== undefined || nodeData.pendingCount !== undefined) && (
            <div className="flex items-center gap-3 pt-1.5 border-t border-slate-800">
              {nodeData.productCount !== undefined && (
                <div className="flex items-center gap-1">
                  <Cpu className="h-2.5 w-2.5 text-slate-500" />
                  <span className="text-[10px] text-slate-400">
                    {nodeData.productCount} products
                  </span>
                </div>
              )}
              {nodeData.pendingCount !== undefined && nodeData.pendingCount > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 text-amber-500" />
                  <span className="text-[10px] text-amber-400">{nodeData.pendingCount}</span>
                </div>
              )}
            </div>
          )}

          {/* Click indicator */}
          <div className="flex items-center justify-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[9px] text-slate-500">Click for details</span>
            <span className="text-[9px] text-slate-400">→</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const HelixNodeV2 = memo(HelixNodeV2Component);
