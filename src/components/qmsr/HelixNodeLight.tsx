import React, { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Hexagon,
  HelpCircle,
  BookOpen,
  Building2,
  Cpu
} from 'lucide-react';
import { NestedRBRIndicator } from './NestedRBRIndicator';
import { TimeStatusBadge } from './TimeStatusBadge';
import { EscalationBadge } from './EscalationBadge';
import { ISO13485ClausePopover } from './ISO13485ClausePopover';
import { SOPStatusIndicator, type SOPStatus, type SOPStatusCount } from './SOPStatusIndicator';
import { NodeSOPRequirementsDialog } from './NodeSOPRequirementsDialog';
import { Badge } from '@/components/ui/badge';
import {
  NodeTooltip,
  NodeTooltipContent,
  NodeTooltipTrigger,
} from '@/components/node-tooltip';
import type { HelixNodeStatus, HelixLevel, HelixTrack } from '@/config/helixNodeConfig';
import { TRACK_COLORS, STATUS_COLORS } from '@/config/helixNodeConfig';
import { NODE_SOP_RECOMMENDATIONS, type SOPRecommendation } from '@/data/nodeSOPRecommendations';
import { useTranslation } from '@/hooks/useTranslation';

export interface HelixNodeLightData {
  id: string;
  label: string;
  shortLabel: string;
  level: HelixLevel;
  track: HelixTrack;
  qmsrClause: string;
  isoClause?: string;
  status: HelixNodeStatus;
  description: string;
  nestedRBR?: {
    type: string;
    label: string;
    status: HelixNodeStatus;
  };
  productCount?: number;
  pendingCount?: number;
  daysSinceUpdate?: number | null;
  lastUpdated?: string | null;
  escalatedCount?: number;
  // SOP Status fields
  sopStatus?: SOPStatus;
  sopCounts?: SOPStatusCount;
  companyId?: string;
  // Linked SOPs from database (populated by useHelixPulseStatus)
  linkedSOPs?: Array<{ id: string; name: string; status: string | null }>;
  onClick?: (nodeId: string) => void;
  onRBRClick?: (rbrType: string) => void;
}

const statusConfig = {
  dormant: {
    icon: Hexagon,
    labelKey: 'deviceProcessEngine.legendDormant',
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    border: 'border-slate-200',
  },
  active: {
    icon: Clock,
    labelKey: 'deviceProcessEngine.legendActive',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
  },
  validated: {
    icon: CheckCircle,
    labelKey: 'deviceProcessEngine.legendValidated',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
  },
  critical: {
    icon: AlertTriangle,
    labelKey: 'deviceProcessEngine.legendCritical',
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
  },
};

// Helper component to render SOP chips under the ISO clause
interface NodeSOPChipsProps {
  nodeId: string;
  linkedSOPs?: Array<{ id: string; name: string; status: string | null }>;
  sopStatus?: SOPStatus;
  sopCounts?: SOPStatusCount;
  onIndicatorClick: () => void;
}

function NodeSOPChips({ nodeId, linkedSOPs, sopStatus, sopCounts, onIndicatorClick }: NodeSOPChipsProps) {
  // If we have linked SOPs from DB, show them
  // Otherwise fall back to static recommendations
  const recommendations = NODE_SOP_RECOMMENDATIONS[nodeId] || [];
  const hasLinkedSOPs = linkedSOPs && linkedSOPs.length > 0;
  
  // Get SOPs to display (max 3, then show "+N more")
  const linkedToShow = hasLinkedSOPs ? linkedSOPs.slice(0, 3) : [];
  const recommendationsToShow = !hasLinkedSOPs ? recommendations.slice(0, 3) : [];
  const remainingCount = hasLinkedSOPs 
    ? Math.max(0, linkedSOPs.length - 3)
    : Math.max(0, recommendations.length - 3);

  if (linkedToShow.length === 0 && recommendationsToShow.length === 0) {
    // No recommendations for this node
    return (
      <SOPStatusIndicator
        status={sopStatus || 'na'}
        counts={sopCounts}
        onClick={onIndicatorClick}
      />
    );
  }

  return (
    <div className="space-y-1.5">
      {/* Status indicator row */}
      <SOPStatusIndicator
        status={sopStatus || (hasLinkedSOPs ? 'in-progress' : 'missing')}
        counts={sopCounts}
        onClick={onIndicatorClick}
      />
      
      {/* SOP chips row */}
      <div className="flex flex-wrap gap-1 max-w-[200px]">
        {hasLinkedSOPs ? (
          // Show actual linked SOPs from database
          linkedToShow.map((sop) => (
            <span
              key={sop.id}
              className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium',
                sop.status?.toLowerCase() === 'approved' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-50 text-slate-600 border border-slate-200'
              )}
              title={sop.name}
            >
              {sop.name.length > 12 ? sop.name.substring(0, 12) + '…' : sop.name}
            </span>
          ))
        ) : (
          // Show recommended SOPs (fallback)
          recommendationsToShow.map((rec) => (
            <span
              key={rec.sopNumber}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-50 text-slate-500 border border-dashed border-slate-300"
              title={`${rec.sopNumber}: ${rec.sopName}`}
            >
              {rec.sopNumber}
            </span>
          ))
        )}
        {remainingCount > 0 && (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] text-slate-400">
            +{remainingCount}
          </span>
        )}
      </div>
    </div>
  );
}

function HelixNodeLightComponent({ data }: NodeProps) {
  const nodeData = data as unknown as HelixNodeLightData;
  const { lang } = useTranslation();
  const [sopDialogOpen, setSopDialogOpen] = useState(false);

  const trackColor = TRACK_COLORS[nodeData.track];
  const statusStyle = statusConfig[nodeData.status];
  const StatusIcon = statusStyle.icon;

  const handleClick = (e: React.MouseEvent) => {
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
    nodeData.onClick?.(nodeData.id);
  };

  const handleSOPIndicatorClick = () => {
    setSopDialogOpen(true);
  };

  return (
    <>
    <NodeTooltip>
      <NodeTooltipTrigger
        onClick={handleClick}
        className={cn(
          'relative cursor-grab active:cursor-grabbing transition-all duration-200 group',
          'hover:z-50'
        )}
      >
          {/* Connection handles */}
          <Handle
            type="target"
            position={Position.Left}
            className="!bg-slate-300 !border-slate-400 !w-2 !h-2 !opacity-0 pointer-events-none"
          />
          <Handle
            type="source"
            position={Position.Right}
            className="!bg-slate-300 !border-slate-400 !w-2 !h-2 !opacity-0 pointer-events-none"
          />
          <Handle
            type="target"
            position={Position.Top}
            id="top"
            className="!bg-slate-300 !border-slate-400 !w-2 !h-2 !opacity-0 pointer-events-none"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="bottom"
            className="!bg-slate-300 !border-slate-400 !w-2 !h-2 !opacity-0 pointer-events-none"
          />

          {/* Card container - light mode design */}
          <div
            className={cn(
              'relative rounded-lg border bg-white p-3 shadow-sm',
              'min-w-[200px] max-w-[220px]',
              'transition-all duration-300',
              'hover:shadow-md',
              statusStyle.border
            )}
          >
            {/* Track-colored top accent bar */}
            <div
              className="absolute -top-[1px] left-3 right-3 h-1 rounded-b-full"
              style={{ backgroundColor: trackColor.primary }}
            />

            {/* Status pulse indicator */}
            <div className="absolute -top-2 -right-2 flex items-center justify-center">
              <span
                className={cn(
                  'h-4 w-4 rounded-full border-2 border-white shadow-sm',
                  nodeData.status === 'active' && 'animate-pulse',
                  nodeData.status === 'critical' && 'animate-pulse',
                  statusStyle.bg
                )}
                style={{ backgroundColor: STATUS_COLORS[nodeData.status].primary }}
              />
            </div>

            {/* Level badge */}
            <div className="absolute -top-2 left-3">
              <Badge
                variant="outline"
                className={cn(
                  'h-5 px-1.5 text-[9px] font-bold uppercase tracking-wider bg-white',
                  nodeData.level === 'company'
                    ? 'text-purple-600 border-purple-200'
                    : 'text-cyan-600 border-cyan-200'
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
                  <div
                    data-help-trigger
                    className={cn(
                      'h-5 w-5 rounded-full flex items-center justify-center cursor-pointer pointer-events-auto',
                      'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
                      'transition-colors'
                    )}
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </div>
                  <StatusIcon className={cn('h-4 w-4', statusStyle.text)} />
                </div>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-sm text-slate-900 leading-tight whitespace-nowrap">
                {nodeData.label}
              </h3>

              {/* ISO 13485 Clause reference */}
              <ISO13485ClausePopover
                clauseRef={nodeData.isoClause}
                nodeLabel={nodeData.label}
              >
                <div className="flex items-center gap-1 group/clause cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5 -ml-1 transition-colors">
                  <BookOpen className="h-3 w-3 text-purple-500 group-hover/clause:text-purple-700" />
                  <p className="text-[10px] text-slate-500 font-mono group-hover/clause:text-purple-700">
                    ISO 13485 {nodeData.isoClause}
                  </p>
                </div>
              </ISO13485ClausePopover>

              {/* SOP List and Status - for company-level nodes */}
              {nodeData.level === 'company' && (
                <NodeSOPChips
                  nodeId={nodeData.id}
                  linkedSOPs={nodeData.linkedSOPs}
                  sopStatus={nodeData.sopStatus}
                  sopCounts={nodeData.sopCounts}
                  onIndicatorClick={handleSOPIndicatorClick}
                />
              )}

              {/* Nested RBR indicator */}
              {nodeData.nestedRBR && (
                <NestedRBRIndicator
                  label={nodeData.nestedRBR.label}
                  status={nodeData.nestedRBR.status}
                  onClick={handleRBRClick}
                />
              )}

              {/* Status Over Time badge (for company-level nodes only) */}
              {nodeData.level === 'company' && nodeData.lastUpdated !== undefined && (
                <div className="pt-1">
                  <TimeStatusBadge
                    daysSinceUpdate={nodeData.daysSinceUpdate ?? null}
                    lastUpdated={nodeData.lastUpdated ?? null}
                  />
                </div>
              )}

              {/* Escalation badge (for company CAPA nodes) */}
              {nodeData.id === 'capa-loop' && nodeData.escalatedCount !== undefined && (
                <div className="pt-1">
                  <EscalationBadge count={nodeData.escalatedCount} />
                </div>
              )}

              {/* Stats row (for device-level nodes) */}
              {nodeData.level === 'device' && (nodeData.productCount !== undefined || nodeData.pendingCount !== undefined) && (
                <div className="flex items-center gap-3 pt-1.5 border-t border-slate-100">
                  {nodeData.productCount !== undefined && (
                    <div className="flex items-center gap-1">
                      <Cpu className="h-2.5 w-2.5 text-slate-400" />
                      <span className="text-[10px] text-slate-500">
                        {nodeData.productCount} {lang('deviceProcessEngine.products')}
                      </span>
                    </div>
                  )}
                  {nodeData.pendingCount !== undefined && nodeData.pendingCount > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5 text-amber-500" />
                      <span className="text-[10px] text-amber-600">{nodeData.pendingCount}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Click indicator */}
              <div className="flex items-center justify-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[9px] text-slate-400">{lang('deviceProcessEngine.clickForDetails')}</span>
                <span className="text-[9px] text-slate-300">→</span>
              </div>
            </div>
          </div>
        </NodeTooltipTrigger>
        <NodeTooltipContent>
          <p className="font-medium">{nodeData.label}</p>
          <p className="text-xs text-muted-foreground">{nodeData.description}</p>
        </NodeTooltipContent>
    </NodeTooltip>

    {/* SOP Requirements Dialog */}
    <NodeSOPRequirementsDialog
      open={sopDialogOpen}
      onOpenChange={setSopDialogOpen}
      nodeId={nodeData.id}
      nodeLabel={nodeData.label}
      isoClause={nodeData.isoClause}
      companyId={nodeData.companyId}
    />
    </>
  );
}

export const HelixNodeLight = memo(HelixNodeLightComponent);