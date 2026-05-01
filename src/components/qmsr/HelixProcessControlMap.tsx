import React, { useMemo, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useHelixPulseStatus, type HelixPulseData } from '@/hooks/useHelixPulseStatus';
import { HelixNodeV2, type HelixNodeData } from './HelixNodeV2';
import { HelixFlowEdge, type FlowEdgeStatus } from './HelixFlowEdge';
import { HelixMapLegendV2 } from './HelixMapLegendV2';
import { RBRNodeDetailDrawer } from './RBRNodeDetailDrawer';
import { cn } from '@/lib/utils';
import { 
  HELIX_NODE_CONFIGS,
  TRACK_FLOW_CONNECTIONS,
  RUNG_CONNECTIONS,
  TRACK_COLORS,
  STATUS_COLORS,
  type HelixNodeStatus,
} from '@/config/helixNodeConfig';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';


interface HelixProcessControlMapProps {
  companyId: string;
  compact?: boolean;
  showHeader?: boolean;
  isFullscreen?: boolean;
  onNodeClick?: (nodeId: string, nodeType: string) => void;
}

// Health indicator component - exported for external use
export function HealthIndicator({ health }: { health: 'healthy' | 'attention' | 'critical' }) {
  const config = {
    healthy: { 
      icon: CheckCircle, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-900/30', 
      border: 'border-emerald-600/50',
      label: 'System Healthy' 
    },
    attention: { 
      icon: Activity, 
      color: 'text-amber-400', 
      bg: 'bg-amber-900/30', 
      border: 'border-amber-600/50',
      label: 'Needs Attention' 
    },
    critical: { 
      icon: AlertTriangle, 
      color: 'text-red-400', 
      bg: 'bg-red-900/30', 
      border: 'border-red-600/50',
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
  helixNode: HelixNodeV2,
};

// Custom edge types
const edgeTypes = {
  helixFlow: HelixFlowEdge,
};

// Layout configuration for 5-rung, 3-track structure - wider spacing to prevent overlap
const LAYOUT_CONFIG = {
  rungSpacing: 280,
  trackSpacing: 180,
  startX: 120,
  startY: 80,
  trackY: {
    regulatory: 80,
    engineering: 260,
    business: 440,
  },
};

// Create nodes from pulse data
function createNodes(
  pulseData: HelixPulseData[],
  onNodeClick?: (nodeId: string) => void,
  onRBRClick?: (rbrType: string) => void
): Node[] {
  const nodes: Node[] = [];

  // Rung header labels
  const rungLabels = [
    { rung: 1, label: 'FOUNDATION', sublabel: 'Company Level' },
    { rung: 2, label: 'UPSTREAM', sublabel: 'Device Planning' },
    { rung: 3, label: 'EXECUTION', sublabel: 'Design & Development' },
    { rung: 4, label: 'VERIFICATION', sublabel: 'Testing & Validation' },
    { rung: 5, label: 'FEEDBACK', sublabel: 'Post-Market' },
  ];

  rungLabels.forEach(({ rung, label, sublabel }) => {
    const x = LAYOUT_CONFIG.startX + (rung - 1) * LAYOUT_CONFIG.rungSpacing;
    nodes.push({
      id: `rung-label-${rung}`,
      type: 'default',
      position: { x: x - 10, y: 10 },
      data: { label },
      style: {
        background: 'transparent',
        border: 'none',
        color: rung === 1 || rung === 5 ? 'hsl(280, 60%, 70%)' : 'hsl(185, 70%, 65%)',
        fontSize: '10px',
        fontWeight: '700',
        letterSpacing: '0.15em',
        textTransform: 'uppercase' as const,
        padding: '2px 8px',
        width: 'auto',
        minWidth: 120,
        textAlign: 'center' as const,
      },
      draggable: false,
    });
  });

  // Track labels on the left
  const trackLabels = [
    { track: 'regulatory', label: 'REG', color: TRACK_COLORS.regulatory },
    { track: 'engineering', label: 'ENG', color: TRACK_COLORS.engineering },
    { track: 'management', label: 'BUS/MGMT', color: TRACK_COLORS.management },
  ];

  trackLabels.forEach(({ track, label, color }) => {
    nodes.push({
      id: `track-${track}`,
      type: 'default',
      position: { x: 10, y: LAYOUT_CONFIG.trackY[track as keyof typeof LAYOUT_CONFIG.trackY] + 20 },
      data: { label },
      style: {
        background: color.bg,
        border: `2px solid ${color.border}`,
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '12px',
        fontWeight: '800',
        letterSpacing: '0.05em',
        color: color.text,
        boxShadow: `0 0 15px ${color.glow}30`,
        minWidth: '50px',
        textAlign: 'center' as const,
      },
      draggable: false,
    });
  });

  // Add QMSR nodes from pulse data
  pulseData.forEach((pulse) => {
    const config = HELIX_NODE_CONFIGS.find(c => c.id === pulse.nodeId);
    if (!config) return;

    const x = LAYOUT_CONFIG.startX + (config.rung - 1) * LAYOUT_CONFIG.rungSpacing;
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
        onClick: onNodeClick,
        onRBRClick: onRBRClick,
      } as Record<string, unknown>,
      draggable: false,
    });
  });

  return nodes;
}

// Create edges with flow status
function createEdges(pulseData: HelixPulseData[]): Edge[] {
  const edges: Edge[] = [];
  const nodeStatusMap = new Map(pulseData.map(p => [p.nodeId, p.status]));

  // Horizontal track flow connections
  TRACK_FLOW_CONNECTIONS.forEach(({ from, to, track }) => {
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

    const trackColor = TRACK_COLORS[track].primary;

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
               'hsl(215, 20%, 40%)',
      },
    });
  });

  // Vertical rung connections (sync lines between tracks)
  RUNG_CONNECTIONS.forEach(({ rung, from, to }) => {
    const fromStatus = nodeStatusMap.get(from);
    const toStatus = nodeStatusMap.get(to);

    if (fromStatus === undefined || toStatus === undefined) return;

    let edgeStatus: FlowEdgeStatus = 'sync';
    if (fromStatus === 'critical' || toStatus === 'critical') {
      edgeStatus = 'blocked';
    }

    edges.push({
      id: `rung-${rung}-${from}-${to}`,
      source: from,
      target: to,
      sourceHandle: 'bottom',
      targetHandle: 'top',
      type: 'helixFlow',
      data: { status: edgeStatus, isSync: true },
      style: { strokeDasharray: '4,4' },
    });
  });

  return edges;
}

export function HelixProcessControlMap({ 
  companyId, 
  compact = false,
  showHeader = true,
  isFullscreen = false,
  onNodeClick 
}: HelixProcessControlMapProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const { data, isLoading, refetch } = useHelixPulseStatus(companyId);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedNodeId = searchParams.get('foundationNode');
  const isDrawerOpen = !!selectedNodeId;

  const setSelectedNodeId = useCallback((nodeId: string | null) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nodeId) next.set('foundationNode', nodeId);
        else next.delete('foundationNode');
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const setIsDrawerOpen = useCallback((open: boolean) => {
    if (!open) setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    onNodeClick?.(nodeId, nodeId);
  }, [onNodeClick, setSelectedNodeId]);

  const handleRBRClick = useCallback((rbrType: string) => {
    // Open the RBR-specific drawer/panel
    console.log('RBR clicked:', rbrType);
  }, []);

  const nodes = useMemo(() => {
    if (!data?.pulseData) return [];
    return createNodes(data.pulseData, handleNodeClick, handleRBRClick);
  }, [data?.pulseData, handleNodeClick, handleRBRClick]);

  const edges = useMemo(() => {
    if (!data?.pulseData) return [];
    return createEdges(data.pulseData);
  }, [data?.pulseData]);

  const [nodesState, setNodes, onNodesChange] = useNodesState(nodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges);

  // Update nodes when data changes
  React.useEffect(() => {
    if (nodes.length > 0) {
      setNodes(nodes);
      setEdges(edges);
    }
  }, [nodes, edges, setNodes, setEdges]);

  // Calculate counts for legend
  const counts = useMemo(() => {
    if (!data?.pulseData) return { critical: 0, active: 0, validated: 0, dormant: 0 };
    return {
      critical: data.pulseData.filter(p => p.status === 'critical').length,
      active: data.pulseData.filter(p => p.status === 'active').length,
      validated: data.pulseData.filter(p => p.status === 'validated').length,
      dormant: data.pulseData.filter(p => p.status === 'dormant').length,
    };
  }, [data?.pulseData]);

  if (isLoading) {
    return (
      <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
        <div className="p-4 border-b border-slate-800">
          <Skeleton className="h-6 w-48 bg-slate-800" />
        </div>
        <Skeleton className="h-[500px] w-full bg-slate-900" />
      </div>
    );
  }

  const mapHeight = isFullscreen ? '100%' : isExpanded ? 620 : 360;

  return (
    <div className={cn(
      "rounded-xl overflow-hidden bg-slate-950 border border-slate-800",
      isFullscreen && "h-full border-0 rounded-none"
    )}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 tracking-tight">
                QMS Process Control Map
              </h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                Helix OS • Triple-Helix Architecture
              </p>
            </div>
            {data && <HealthIndicator health={data.overallHealth} />}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Map Canvas */}
      <div style={{ height: mapHeight }} className="w-full relative">
        {/* Dark grid background */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
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
          fitViewOptions={{ padding: 0.25 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.3}
          maxZoom={2.0}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={[1, 2]}
          zoomOnScroll={true}
          onNodeClick={(_, node) => handleNodeClick(node.id)}
          onEdgeClick={(_, edge) => handleNodeClick(edge.target)}
          className="!bg-transparent"
        >
          <Controls 
            position="top-right"
            showInteractive={false}
            className="!bg-slate-900 !border-slate-700 !rounded-lg !shadow-xl [&>button]:!bg-slate-800 [&>button]:!border-slate-700 [&>button]:!text-slate-400 [&>button:hover]:!bg-slate-700 [&>button:hover]:!text-slate-200"
          />
        </ReactFlow>
      </div>

      {/* Legend */}
      <HelixMapLegendV2
        overallHealth={data?.overallHealth || 'healthy'}
        criticalCount={counts.critical}
        activeCount={counts.active}
        validatedCount={counts.validated}
        dormantCount={counts.dormant}
        onReviewCritical={() => {
          const critical = data?.pulseData.find(p => p.status === 'critical');
          if (critical) {
            setSelectedNodeId(critical.nodeId);
            setIsDrawerOpen(true);
          }
        }}
      />

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
      />
    </div>
  );
}
