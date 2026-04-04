/**
 * CompanyHelixMap - Company-Level QMS Foundation Map
 * 
 * Displays only Rungs 1 & 5 (Foundation & Feedback) for company-wide QMS infrastructure.
 * Light mode styling to match the rest of the application.
 */

import React, { useMemo, useCallback, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  type Node,
  type Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QMSRCompliancePackageExport } from './QMSRCompliancePackageExport';
import { useHelixPulseStatus, type HelixPulseData } from '@/hooks/useHelixPulseStatus';
import { HelixNodeLight, type HelixNodeLightData } from './HelixNodeLight';
import { HelixFlowEdge, type FlowEdgeStatus } from './HelixFlowEdge';
import { HelixMapLegendLight } from './HelixMapLegendLight';
import { RBRNodeDetailDrawer } from './RBRNodeDetailDrawer';

import { cn } from '@/lib/utils';
import { 
  HELIX_NODE_CONFIGS,
  TRACK_COLORS,
  STATUS_COLORS,
  type HelixNodeStatus,
} from '@/config/helixNodeConfig';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';


interface CompanyHelixMapProps {
  companyId: string;
  showHeader?: boolean;
  onNodeClick?: (nodeId: string, nodeType: string) => void;
  onViewInProduct?: () => void;
}

// Health indicator component - Light mode version
export function HealthIndicatorLight({ health }: { health: 'healthy' | 'attention' | 'critical' }) {
  const config = {
    healthy: { 
      icon: CheckCircle, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50', 
      border: 'border-emerald-200',
      label: 'System Healthy' 
    },
    attention: { 
      icon: Activity, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50', 
      border: 'border-amber-200',
      label: 'Needs Attention' 
    },
    critical: { 
      icon: AlertTriangle, 
      color: 'text-red-600', 
      bg: 'bg-red-50', 
      border: 'border-red-200',
      label: 'Critical Gaps' 
    },
  };

  const { icon: Icon, color, bg, border, label } = config[health];

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-full border',
      bg, border
    )}>
      <Icon className={cn('h-4 w-4', color)} />
      <span className={cn('text-xs font-semibold', color)}>{label}</span>
    </div>
  );
}

// Custom node types
const nodeTypes = {
  helixNode: HelixNodeLight,
};

// Custom edge types
const edgeTypes = {
  helixFlow: HelixFlowEdge,
};

// Get only company-level nodes (Rungs 1 & 5, level === 'company')
const getCompanyNodes = () => HELIX_NODE_CONFIGS.filter(n => 
  n.level === 'company' && (n.rung === 1 || n.rung === 5)
);

// Layout configuration for company-level 2-rung structure with device black box in middle
// Optimized for static (non-zoomable) display with proper spacing
const LAYOUT_CONFIG = {
  rungSpacing: 420,       // Spacing between rungs
  trackSpacing: 200,
  startX: 160,            // Enough left padding so track labels + nodes are fully visible
  startY: 80,
  // Device box centered between rung 1 and rung 5
  deviceBoxX: 480,        // Centered between Foundation and Feedback columns
  deviceBoxWidth: 180,
  deviceBoxHeight: 160,
  trackLabelX: 10,        // Track labels on left
  trackY: {
    // Vertical spacing so cards never overlap
    regulatory: 70,
    engineering: 310,
    management: 550,
  },
};

// Create nodes from pulse data (company-level only)
function createNodes(
  pulseData: HelixPulseData[],
  companyId: string,
  onNodeClick?: (nodeId: string) => void,
  onRBRClick?: (rbrType: string) => void,
  onViewInProduct?: () => void
): Node[] {
  const nodes: Node[] = [];
  const companyNodeConfigs = getCompanyNodes();
  const companyNodeIds = new Set(companyNodeConfigs.map(c => c.id));

  // Rung header labels (Foundation, Device Engine, and Feedback)
  const rungLabels = [
    { rung: 1, label: 'FOUNDATION', sublabel: 'Company Infrastructure', xOffset: 0 },
    { rung: 5, label: 'FEEDBACK', sublabel: 'Continuous Improvement', xOffset: 2 },
  ];

  rungLabels.forEach(({ rung, label, sublabel, xOffset }) => {
    const x = LAYOUT_CONFIG.startX + xOffset * LAYOUT_CONFIG.rungSpacing;
    nodes.push({
      id: `rung-label-${rung}`,
      type: 'default',
      position: { x: x - 10, y: 10 },
      data: { label },
      style: {
        background: 'transparent',
        border: 'none',
        color: 'hsl(280, 50%, 40%)',
        fontSize: '10px',
        fontWeight: '700',
        letterSpacing: '0.15em',
        textTransform: 'uppercase' as const,
        padding: '2px 8px',
        width: 'auto',
        minWidth: 140,
        textAlign: 'center' as const,
      },
      draggable: false,
    });
  });

  // Add Device Engine label in center
  nodes.push({
    id: 'device-engine-label',
    type: 'default',
    position: { x: LAYOUT_CONFIG.deviceBoxX - 10, y: 10 },
    data: { label: 'DEVICE ENGINE' },
    style: {
      background: 'transparent',
      border: 'none',
      color: 'hsl(215, 50%, 35%)',
      fontSize: '10px',
      fontWeight: '700',
      letterSpacing: '0.15em',
      textTransform: 'uppercase' as const,
      padding: '2px 8px',
      width: 'auto',
      minWidth: 140,
      textAlign: 'center' as const,
    },
    draggable: false,
  });

  // Track labels on the left — positioned to not overlap with node cards
  const trackLabels = [
    { track: 'regulatory', label: 'REG', color: TRACK_COLORS.regulatory },
    { track: 'engineering', label: 'ENG', color: TRACK_COLORS.engineering },
    { track: 'management', label: 'BUS/MGMT', color: TRACK_COLORS.management },
  ];

  trackLabels.forEach(({ track, label, color }) => {
    nodes.push({
      id: `track-${track}`,
      type: 'default',
      position: { x: LAYOUT_CONFIG.trackLabelX, y: LAYOUT_CONFIG.trackY[track as keyof typeof LAYOUT_CONFIG.trackY] + 30 },
      data: { label },
      style: {
        background: color.bg,
        border: `2px solid ${color.border}`,
        borderRadius: '8px',
        padding: '6px 10px',
        fontSize: '9px',
        fontWeight: '800',
        letterSpacing: '0.05em',
        color: color.text,
        minWidth: '80px',
        maxWidth: '110px',
        textAlign: 'center' as const,
      },
      draggable: false,
    });
  });

  // Add Device Black Box in the center - represents the Device Engine (Rungs 2-4)
  // Square shape, no connection handles
  const boxSize = LAYOUT_CONFIG.deviceBoxHeight;
  const boxCenterY = (LAYOUT_CONFIG.trackY.regulatory + LAYOUT_CONFIG.trackY.management) / 2 - boxSize / 2 + 40;
  
  nodes.push({
    id: 'device-black-box',
    type: 'default',
    position: { x: LAYOUT_CONFIG.deviceBoxX, y: boxCenterY },
    data: { label: '' },
    style: {
      background: 'linear-gradient(145deg, hsl(215, 30%, 20%), hsl(215, 35%, 12%))',
      border: '2px solid hsl(215, 40%, 30%)',
      borderRadius: '16px',
      padding: '0',
      width: boxSize,
      height: boxSize,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
    },
    className: 'no-handles',
    draggable: false,
    selectable: false,
  });

  // Add content label inside the device box - centered
  nodes.push({
    id: 'device-box-content',
    type: 'default',
    position: { x: LAYOUT_CONFIG.deviceBoxX + boxSize / 2 - 24, y: boxCenterY + 30 },
    data: { label: '🧬' },
    style: {
      background: 'transparent',
      border: 'none',
      fontSize: '48px',
      textAlign: 'center' as const,
      width: 48,
      padding: 0,
      pointerEvents: 'none' as const,
    },
    className: 'no-handles',
    draggable: false,
    selectable: false,
  });

  nodes.push({
    id: 'device-box-label',
    type: 'default',
    position: { x: LAYOUT_CONFIG.deviceBoxX + 15, y: boxCenterY + 95 },
    data: { label: 'Device Processes' },
    style: {
      background: 'transparent',
      border: 'none',
      color: 'hsl(215, 20%, 70%)',
      fontSize: '12px',
      fontWeight: '600',
      textAlign: 'center' as const,
      width: boxSize - 30,
      padding: 0,
      pointerEvents: 'none' as const,
    },
    className: 'no-handles',
    draggable: false,
    selectable: false,
  });

  nodes.push({
    id: 'device-box-sublabel',
    type: 'default',
    position: { x: LAYOUT_CONFIG.deviceBoxX + 15, y: boxCenterY + 115 },
    data: { label: 'Rungs 2-4' },
    style: {
      background: 'transparent',
      border: 'none',
      color: 'hsl(215, 15%, 50%)',
      fontSize: '9px',
      fontWeight: '500',
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      textAlign: 'center' as const,
      width: boxSize - 30,
      padding: 0,
      pointerEvents: 'none' as const,
    },
    className: 'no-handles',
    draggable: false,
    selectable: false,
  });

  // Clickable "View in Product" button
  nodes.push({
    id: 'device-box-hint',
    type: 'default',
    position: { x: LAYOUT_CONFIG.deviceBoxX + 15, y: boxCenterY + 145 },
    data: { 
      label: '→ View in Product',
      onClick: onViewInProduct,
    },
    style: {
      background: 'hsla(215, 30%, 40%, 0.5)',
      border: '1px solid hsla(215, 30%, 50%, 0.4)',
      borderRadius: '6px',
      color: 'hsl(215, 20%, 85%)',
      fontSize: '9px',
      fontWeight: '600',
      textAlign: 'center' as const,
      width: boxSize - 30,
      padding: '4px 8px',
      cursor: 'pointer',
    },
    className: 'no-handles nodrag nopan',
    draggable: false,
    selectable: true,
  });

  // Add QMSR nodes from pulse data (only company-level)
  pulseData.forEach((pulse) => {
    if (!companyNodeIds.has(pulse.nodeId)) return;
    
    const config = HELIX_NODE_CONFIGS.find(c => c.id === pulse.nodeId);
    if (!config) return;

    // Map rung to x position (rung 1 = 0 [left], rung 5 = 2 [right of device box])
    const xOffset = config.rung === 1 ? 0 : 2;
    const x = LAYOUT_CONFIG.startX + xOffset * LAYOUT_CONFIG.rungSpacing;
    const y = LAYOUT_CONFIG.trackY[config.track];

    nodes.push({
      id: pulse.nodeId,
      type: 'helixNode',
      position: { x, y },
      data: {
        id: pulse.nodeId,
        label: config.label,
        shortLabel: config.shortLabel,
        level: config.level,
        track: config.track,
        isoClause: config.isoClause,
        status: pulse.status,
        description: config.description,
        nestedRBR: pulse.nestedRBR,
        productCount: pulse.productCount,
        pendingCount: pulse.pendingCount,
        // Status Over Time fields
        daysSinceUpdate: pulse.daysSinceUpdate,
        lastUpdated: pulse.lastUpdated,
        // Escalation count (for CAPA node)
        escalatedCount: pulse.escalatedCount,
        // SOP Status fields
        sopStatus: pulse.sopStatus?.status,
        sopCounts: pulse.sopStatus?.counts,
        linkedSOPs: pulse.sopStatus?.linkedSOPs,
        companyId: companyId,
        onClick: onNodeClick,
        onRBRClick: onRBRClick,
      } as Record<string, unknown>,
      draggable: false,
    });
  });

  return nodes;
}

// Create edges for company-level nodes only
function createEdges(pulseData: HelixPulseData[]): Edge[] {
  const edges: Edge[] = [];
  const companyNodeConfigs = getCompanyNodes();
  const companyNodeIds = new Set(companyNodeConfigs.map(c => c.id));
  const nodeStatusMap = new Map(pulseData.map(p => [p.nodeId, p.status]));

  // Vertical connections within each rung
  const rungConnections = [
    // Rung 1 connections
    { from: 'mgmt-resp', to: 'resource-strategy' },
    { from: 'resource-strategy', to: 'infra-training' },
    // Rung 5 connections
    { from: 'pms', to: 'capa-loop' },
  ];

  rungConnections.forEach(({ from, to }) => {
    if (!companyNodeIds.has(from) || !companyNodeIds.has(to)) return;
    
    const fromStatus = nodeStatusMap.get(from);
    const toStatus = nodeStatusMap.get(to);
    if (fromStatus === undefined || toStatus === undefined) return;

    let edgeStatus: FlowEdgeStatus = 'sync';
    if (fromStatus === 'critical' || toStatus === 'critical') {
      edgeStatus = 'blocked';
    }

    edges.push({
      id: `rung-${from}-${to}`,
      source: from,
      target: to,
      sourceHandle: 'bottom',
      targetHandle: 'top',
      type: 'helixFlow',
      data: { status: edgeStatus, isSync: true },
      style: { strokeDasharray: '4,4' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 10,
        height: 10,
        color: edgeStatus === 'blocked' ? STATUS_COLORS.critical.primary :
               edgeStatus === 'sync' ? 'hsl(280, 70%, 60%)' : 
               'hsl(215, 20%, 60%)',
      },
    });
  });

  // Horizontal connections between rungs (simplified for company view)
  const horizontalConnections = [
    { from: 'mgmt-resp', to: 'pms', track: 'regulatory' },
    { from: 'resource-strategy', to: 'capa-loop', track: 'engineering' },
  ];

  horizontalConnections.forEach(({ from, to, track }) => {
    if (!companyNodeIds.has(from) || !companyNodeIds.has(to)) return;

    const fromStatus = nodeStatusMap.get(from);
    const toStatus = nodeStatusMap.get(to);
    if (fromStatus === undefined || toStatus === undefined) return;

    let edgeStatus: FlowEdgeStatus = 'dormant';
    if (fromStatus === 'critical' || toStatus === 'critical') {
      edgeStatus = 'blocked';
    } else if (fromStatus === 'validated' && toStatus !== 'dormant') {
      edgeStatus = 'active';
    } else if (fromStatus === 'active' || toStatus === 'active') {
      edgeStatus = 'active';
    }

    const trackColor = TRACK_COLORS[track as keyof typeof TRACK_COLORS].primary;

    edges.push({
      id: `${from}-${to}`,
      source: from,
      target: to,
      type: 'helixFlow',
      data: { status: edgeStatus },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 10,
        height: 10,
        color: edgeStatus === 'blocked' ? STATUS_COLORS.critical.primary :
               edgeStatus === 'active' ? STATUS_COLORS.active.primary : 
               'hsl(215, 20%, 60%)',
      },
    });
  });

  return edges;
}

// Zoom control buttons
function ZoomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  return (
    <Panel position="top-right" className="flex flex-col gap-1 !m-3">
      <Button variant="outline" size="icon" className="h-8 w-8 bg-white/90 shadow-sm hover:bg-white" onClick={() => zoomIn({ duration: 200 })} title="Zoom In">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="h-8 w-8 bg-white/90 shadow-sm hover:bg-white" onClick={() => zoomOut({ duration: 200 })} title="Zoom Out">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="h-8 w-8 bg-white/90 shadow-sm hover:bg-white" onClick={() => fitView({ padding: 0.08, duration: 200 })} title="Fit View">
        <Maximize2 className="h-3.5 w-3.5" />
      </Button>
    </Panel>
  );
}

function CompanyHelixMapInner({
  companyId,
  showHeader = true,
  onNodeClick,
  onViewInProduct
}: CompanyHelixMapProps) {
  const { data, isLoading, refetch } = useHelixPulseStatus(companyId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setIsDrawerOpen(true);
    onNodeClick?.(nodeId, nodeId);
  }, [onNodeClick]);

  const handleRBRClick = useCallback((_rbrType: string) => {
    // RBR click handled via node drawer
  }, []);

  // Filter pulse data to only company-level nodes
  const companyPulseData = useMemo(() => {
    if (!data?.pulseData) return [];
    const companyNodeConfigs = getCompanyNodes();
    const companyNodeIds = new Set(companyNodeConfigs.map(c => c.id));
    return data.pulseData.filter(p => companyNodeIds.has(p.nodeId));
  }, [data?.pulseData]);

  const nodes = useMemo(() => {
    if (!data?.pulseData) return [];
    return createNodes(data.pulseData, companyId, handleNodeClick, handleRBRClick, onViewInProduct);
  }, [data?.pulseData, companyId, handleNodeClick, handleRBRClick, onViewInProduct]);

  const edges = useMemo(() => {
    if (!data?.pulseData) return [];
    return createEdges(data.pulseData);
  }, [data?.pulseData]);

  const [nodesState, setNodes, onNodesChange] = useNodesState(nodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges);

  React.useEffect(() => {
    if (nodes.length > 0) {
      setNodes(nodes);
      setEdges(edges);
    }
  }, [nodes, edges, setNodes, setEdges]);

  // Calculate counts for legend (company-level only)
  const counts = useMemo(() => {
    if (!companyPulseData.length) return { critical: 0, active: 0, validated: 0, dormant: 0 };
    return {
      critical: companyPulseData.filter(p => p.status === 'critical').length,
      active: companyPulseData.filter(p => p.status === 'active').length,
      validated: companyPulseData.filter(p => p.status === 'validated').length,
      dormant: companyPulseData.filter(p => p.status === 'dormant').length,
    };
  }, [companyPulseData]);

  if (isLoading) {
    return (
      <div className="rounded-xl overflow-hidden bg-white border border-slate-200">
        <div className="p-4 border-b border-slate-100">
          <Skeleton className="h-6 w-48 bg-slate-100" />
        </div>
        <Skeleton className="h-[760px] w-full bg-slate-50" />
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  QMS Foundation
                </h2>
                <span className="text-lg text-slate-500 font-normal">(ISO 13485)</span>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest">
                Company-Level Infrastructure • Rungs 1 & 5
              </p>
            </div>
            {data && <HealthIndicatorLight health={data.overallHealth} />}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Map Canvas */}
      <div style={{ height: 760 }} className="w-full relative">
        {/* Light grid background */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        <ReactFlow
          nodes={nodesState}
          edges={edgesState}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.08 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.4}
          maxZoom={1}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          panOnDrag={true}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          onNodeClick={(_, node) => {
            // Handle "View in Product" button click
            if (node.id === 'device-box-hint') {
              onViewInProduct?.();
              return;
            }
            // Only handle actual helix nodes (not labels/decorative nodes)
            if (!node.id.startsWith('rung-') && !node.id.startsWith('track-') && !node.id.startsWith('device-')) {
              handleNodeClick(node.id);
            }
          }}
          onEdgeClick={(_, edge) => handleNodeClick(edge.target)}
          className="!bg-transparent"
        >
          <ZoomControls />
        </ReactFlow>
      </div>

      {/* Legend */}
      <HelixMapLegendLight
        overallHealth={data?.overallHealth || 'healthy'}
        criticalCount={counts.critical}
        activeCount={counts.active}
        validatedCount={counts.validated}
        dormantCount={counts.dormant}
        showLevelIndicators={false}
        onReviewCritical={() => {
          const critical = companyPulseData.find(p => p.status === 'critical');
          if (critical) {
            setSelectedNodeId(critical.nodeId);
            setIsDrawerOpen(true);
          }
        }}
        onExportPackage={() => setIsExportDialogOpen(true)}
      />

      {/* Export Package Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export QMS Compliance Package</DialogTitle>
          </DialogHeader>
          <QMSRCompliancePackageExport companyId={companyId} />
        </DialogContent>
      </Dialog>

      {/* Detail Drawer - No rationale buttons at company level */}
      <RBRNodeDetailDrawer
        pulse={selectedNodeId ? {
          nodeId: selectedNodeId,
          nodeType: 'RBR-ENG' as any,
          label: HELIX_NODE_CONFIGS.find(c => c.id === selectedNodeId)?.label || '',
          isoClause: HELIX_NODE_CONFIGS.find(c => c.id === selectedNodeId)?.isoClause || '',
          status: data?.pulseData.find(p => p.nodeId === selectedNodeId)?.status || 'dormant',
          count: data?.pulseData.find(p => p.nodeId === selectedNodeId)?.count || 0,
          pendingCount: data?.pulseData.find(p => p.nodeId === selectedNodeId)?.pendingCount || 0,
          approvedCount: data?.pulseData.find(p => p.nodeId === selectedNodeId)?.approvedCount || 0,
          lastUpdated: data?.pulseData.find(p => p.nodeId === selectedNodeId)?.lastUpdated || null,
          riskLevel: data?.pulseData.find(p => p.nodeId === selectedNodeId)?.riskLevel || 'low',
          track: (() => {
            const track = HELIX_NODE_CONFIGS.find(c => c.id === selectedNodeId)?.track;
            return track === 'management' ? 'business' : (track || 'engineering');
          })() as 'engineering' | 'regulatory' | 'business',
          stage: 'genesis',
          pendingItems: data?.pulseData.find(p => p.nodeId === selectedNodeId)?.pendingItems || [],
          approvedItems: data?.pulseData.find(p => p.nodeId === selectedNodeId)?.approvedItems || [],
          criticalIssues: data?.pulseData.find(p => p.nodeId === selectedNodeId)?.criticalIssues || [],
        } : null}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        companyId={companyId}
      />
    </div>
  );
}

export function CompanyHelixMap(props: CompanyHelixMapProps) {
  return (
    <ReactFlowProvider>
      <CompanyHelixMapInner {...props} />
    </ReactFlowProvider>
  );
}