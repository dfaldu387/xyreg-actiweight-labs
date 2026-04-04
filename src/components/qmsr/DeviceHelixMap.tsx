/**
 * DeviceHelixMap - Device-Level Process Engine Map
 * 
 * Displays Rungs 2-5 (Upstream, Execution, Verification, Feedback) for a specific product.
 * Optional toggle to show company-level context (Rung 1 & company Rung 5 nodes).
 * Light mode styling to match the rest of the application.
 */

import React, { useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QMSRCompliancePackageExport } from './QMSRCompliancePackageExport';
import { useDeviceHelixPulseStatus, type DeviceHelixPulseData } from '@/hooks/useDeviceHelixPulseStatus';
import { HelixNodeLight, type HelixNodeLightData } from './HelixNodeLight';
import { HelixFlowEdge, type FlowEdgeStatus } from './HelixFlowEdge';
import { HelixMapLegendLight } from './HelixMapLegendLight';
import { RBRNodeDetailDrawer } from './RBRNodeDetailDrawer';
import { GatekeeperWarningBanner } from './GatekeeperWarningBanner';

import { cn } from '@/lib/utils';
import { 
  HELIX_NODE_CONFIGS,
  TRACK_COLORS,
  STATUS_COLORS,
  RUNG_CONNECTIONS,
  TRACK_FLOW_CONNECTIONS,
  type HelixNodeStatus,
} from '@/config/helixNodeConfig';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Cpu,
  Building2,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/useTranslation';

interface DeviceHelixMapProps {
  productId: string;
  productName?: string;
  companyId?: string;
  showHeader?: boolean;
  onNodeClick?: (nodeId: string, nodeType: string) => void;
}

// Health indicator component - Light mode version
function HealthIndicatorLight({ health, lang }: { health: 'healthy' | 'attention' | 'critical'; lang: (key: string) => string }) {
  const config = {
    healthy: {
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      labelKey: 'deviceProcessEngine.onTrack'
    },
    attention: {
      icon: Activity,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      labelKey: 'deviceProcessEngine.needsAttention'
    },
    critical: {
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      labelKey: 'deviceProcessEngine.criticalGaps'
    },
  };

  const { icon: Icon, color, bg, border, labelKey } = config[health];
  const label = lang(labelKey);

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

// Get device-level nodes only (Rungs 2-5) or all nodes when showing company context
// When showing company context: include Foundation (rung 1) company nodes only
// Device PMS (rung 5, device-level) is kept; Company CAPA (rung 5, company-level) is excluded
const getVisibleNodeConfigs = (showCompanyContext: boolean) => {
  if (showCompanyContext) {
    return HELIX_NODE_CONFIGS.filter(n =>
      n.level === 'device' || (n.level === 'company' && n.rung === 1)
    );
  }
  return HELIX_NODE_CONFIGS.filter(n => n.level === 'device');
};

// Layout configuration - adjusts based on company context
// Cards are 160-180px wide, so rungSpacing must be > 200 to prevent touching
const getLayoutConfig = (showCompanyContext: boolean) => ({
  rungSpacing: showCompanyContext ? 230 : 250,
  trackSpacing: 220,
  startX: showCompanyContext ? 150 : 160,
  startY: 80,
  trackLabelX: 10,
  trackY: {
    regulatory: 70,
    engineering: 310,
    management: 550,
  },
});

// Create nodes from pulse data
function createNodes(
  pulseData: DeviceHelixPulseData[],
  showCompanyContext: boolean,
  lang: (key: string) => string,
  onNodeClick?: (nodeId: string) => void,
  onRBRClick?: (rbrType: string) => void
): Node[] {
  const nodes: Node[] = [];
  const visibleNodeConfigs = getVisibleNodeConfigs(showCompanyContext);
  const visibleNodeIds = new Set(visibleNodeConfigs.map(c => c.id));
  const LAYOUT_CONFIG = getLayoutConfig(showCompanyContext);

  // Rung header labels
  const rungLabels = showCompanyContext
    ? [
        { rung: 1, label: lang('deviceProcessEngine.rungFoundation'), xOffset: 0 },
        { rung: 2, label: lang('deviceProcessEngine.rungUpstream'), xOffset: 1 },
        { rung: 3, label: lang('deviceProcessEngine.rungExecution'), xOffset: 2 },
        { rung: 4, label: lang('deviceProcessEngine.rungVerification'), xOffset: 3 },
        { rung: 5, label: lang('deviceProcessEngine.rungFeedback'), xOffset: 4 },
      ]
    : [
        { rung: 2, label: lang('deviceProcessEngine.rungUpstream'), xOffset: 0 },
        { rung: 3, label: lang('deviceProcessEngine.rungExecution'), xOffset: 1 },
        { rung: 4, label: lang('deviceProcessEngine.rungVerification'), xOffset: 2 },
        { rung: 5, label: lang('deviceProcessEngine.rungFeedback'), xOffset: 3 },
      ];

  rungLabels.forEach(({ rung, label, xOffset }) => {
    const x = LAYOUT_CONFIG.startX + xOffset * LAYOUT_CONFIG.rungSpacing;
    nodes.push({
      id: `rung-label-${rung}`,
      type: 'default',
      position: { x: x - 10, y: 10 },
      data: { label },
      style: {
        background: 'transparent',
        border: 'none',
        color: 'hsl(185, 60%, 35%)',
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
    { track: 'regulatory', label: lang('deviceProcessEngine.trackReg'), color: TRACK_COLORS.regulatory },
    { track: 'engineering', label: lang('deviceProcessEngine.trackEng'), color: TRACK_COLORS.engineering },
    { track: 'management', label: lang('deviceProcessEngine.trackBusMgmt'), color: TRACK_COLORS.management },
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

  // Add QMSR nodes from pulse data
  pulseData.forEach((pulse) => {
    if (!visibleNodeIds.has(pulse.nodeId)) return;
    
    const config = HELIX_NODE_CONFIGS.find(c => c.id === pulse.nodeId);
    if (!config) return;

    // Calculate x position based on rung
    const baseRung = showCompanyContext ? 1 : 2;
    const xOffset = config.rung - baseRung;
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
        pendingCount: pulse.pendingCount,
        // Status Over Time fields
        daysSinceUpdate: pulse.daysSinceUpdate,
        lastUpdated: pulse.lastUpdated,
        onClick: onNodeClick,
        onRBRClick: onRBRClick,
      } as Record<string, unknown>,
    });
  });

  return nodes;
}

// Create edges
function createEdges(pulseData: DeviceHelixPulseData[], showCompanyContext: boolean): Edge[] {
  const edges: Edge[] = [];
  const visibleNodeConfigs = getVisibleNodeConfigs(showCompanyContext);
  const visibleNodeIds = new Set(visibleNodeConfigs.map(c => c.id));
  const nodeStatusMap = new Map(pulseData.map(p => [p.nodeId, p.status]));

  // Filter TRACK_FLOW_CONNECTIONS to only visible nodes
  const visibleFlowConnections = TRACK_FLOW_CONNECTIONS.filter(
    conn => visibleNodeIds.has(conn.from) && visibleNodeIds.has(conn.to)
  );

  visibleFlowConnections.forEach(({ from, to, track }) => {
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

  // Filter RUNG_CONNECTIONS to only visible nodes
  const visibleRungConnections = RUNG_CONNECTIONS.filter(
    conn => visibleNodeIds.has(conn.from) && visibleNodeIds.has(conn.to)
  );

  visibleRungConnections.forEach(({ rung, from, to }) => {
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

// Zoom control buttons
function ZoomControls({ lang }: { lang: (key: string) => string }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  return (
    <Panel position="top-right" className="flex flex-col gap-1 !m-3">
      <Button variant="outline" size="icon" className="h-8 w-8 bg-white/90 shadow-sm hover:bg-white" onClick={() => zoomIn({ duration: 200 })} title={lang('deviceProcessEngine.zoomIn')}>
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="h-8 w-8 bg-white/90 shadow-sm hover:bg-white" onClick={() => zoomOut({ duration: 200 })} title={lang('deviceProcessEngine.zoomOut')}>
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="h-8 w-8 bg-white/90 shadow-sm hover:bg-white" onClick={() => fitView({ padding: 0.08, duration: 200 })} title={lang('deviceProcessEngine.fitView')}>
        <Maximize2 className="h-3.5 w-3.5" />
      </Button>
    </Panel>
  );
}

function DeviceHelixMapInner({
  productId,
  productName,
  companyId,
  showHeader = true,
  onNodeClick
}: DeviceHelixMapProps) {
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const { data, isLoading, refetch } = useDeviceHelixPulseStatus(productId, companyId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [showCompanyContext, setShowCompanyContext] = useState(false);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setIsDrawerOpen(true);
    onNodeClick?.(nodeId, nodeId);
  }, [onNodeClick]);

  const handleRBRClick = useCallback((_rbrType: string) => {
    // RBR click handled via node drawer
  }, []);

  const nodes = useMemo(() => {
    if (!data?.pulseData) return [];
    return createNodes(data.pulseData, showCompanyContext, lang, handleNodeClick, handleRBRClick);
  }, [data?.pulseData, showCompanyContext, lang, handleNodeClick, handleRBRClick]);

  const edges = useMemo(() => {
    if (!data?.pulseData) return [];
    return createEdges(data.pulseData, showCompanyContext);
  }, [data?.pulseData, showCompanyContext]);

  const [nodesState, setNodes, onNodesChange] = useNodesState(nodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges);

  // Update nodes/edges when data changes - always update to sync state
  React.useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  // Calculate counts for legend
  const counts = useMemo(() => {
    if (!data?.pulseData?.length) return { critical: 0, active: 0, validated: 0, dormant: 0 };
    return {
      critical: data.pulseData.filter(p => p.status === 'critical').length,
      active: data.pulseData.filter(p => p.status === 'active').length,
      validated: data.pulseData.filter(p => p.status === 'validated').length,
      dormant: data.pulseData.filter(p => p.status === 'dormant').length,
    };
  }, [data?.pulseData]);

  // Canvas height adjusts when showing company context
  const canvasHeight = showCompanyContext ? 780 : 760;

  if (isLoading) {
    return (
      <div className="rounded-xl overflow-hidden bg-card border border-border">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-[480px] w-full" />
      </div>
    );
  }

  return (
      <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm">
        {/* Gatekeeper Warning Banner */}
        {data?.foundationBlocked && (
          <GatekeeperWarningBanner
            onViewCompanyDashboard={() => navigate('/company-dashboard')}
            criticalNodeCount={data.foundationCriticalCount || 1}
            className="m-4 mb-0"
          />
        )}

        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">
                    {lang('deviceProcessEngine.title')}
                  </h2>
                  <span className="text-lg text-muted-foreground font-normal">{lang('deviceProcessEngine.iso13485')}</span>
                  {productName && (
                    <Badge variant="outline" className="text-xs text-cyan-600 border-cyan-200 bg-cyan-50">
                      <Cpu className="h-3 w-3 mr-1" />
                      {productName}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                  {showCompanyContext ? lang('deviceProcessEngine.fullQmsContext') : lang('deviceProcessEngine.deviceLevelExecution')}
                </p>
              </div>
              {data && <HealthIndicatorLight health={data.overallHealth} lang={lang} />}
            </div>
            <div className="flex items-center gap-4">
              {/* Company Context Toggle */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="company-context" className="text-xs font-medium text-muted-foreground cursor-pointer">
                  {lang('deviceProcessEngine.companyContext')}
                </Label>
                <Switch
                  id="company-context"
                  checked={showCompanyContext}
                  onCheckedChange={setShowCompanyContext}
                  className="scale-75"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

      {/* Map Canvas */}
      <div style={{ height: canvasHeight }} className="w-full relative">
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
          minZoom={0.3}
          maxZoom={1}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          panOnDrag={true}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          onNodeClick={(_, node) => {
            // Only handle actual helix nodes (not labels/decorative nodes)
            if (!node.id.startsWith('rung-') && !node.id.startsWith('track-')) {
              handleNodeClick(node.id);
            }
          }}
          onEdgeClick={(_, edge) => handleNodeClick(edge.target)}
          className="!bg-transparent"
        >
          <ZoomControls lang={lang} />
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
          const critical = data?.pulseData.find(p => p.status === 'critical');
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
            <DialogTitle>{lang('deviceProcessEngine.exportDialogTitle')}</DialogTitle>
          </DialogHeader>
          <QMSRCompliancePackageExport companyId={companyId || ''} productId={productId} />
        </DialogContent>
      </Dialog>

      {/* Detail Drawer */}
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
          // Map 'management' back to 'business' for legacy compatibility
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
        onCreateRationale={() => {
          setIsDrawerOpen(false);
          navigate(`/app/product/${productId}/design-risk-controls?tab=verification-validation&subTab=qmsr-rationale`);
        }}
        onViewAll={() => {
          setIsDrawerOpen(false);
          navigate(`/app/product/${productId}/design-risk-controls?tab=verification-validation&subTab=qmsr-rationale`);
        }}
        productId={productId}
        companyId={companyId}
        onEscalated={() => refetch()}
      />
    </div>
  );
}

export function DeviceHelixMap(props: DeviceHelixMapProps) {
  return (
    <ReactFlowProvider>
      <DeviceHelixMapInner {...props} />
    </ReactFlowProvider>
  );
}
