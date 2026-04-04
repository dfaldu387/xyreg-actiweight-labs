import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TraceabilityFlowNode } from './TraceabilityFlowNode';
import { TraceabilityFlowEdge } from './TraceabilityFlowEdge';
import { TraceabilityInspectorPanel } from './TraceabilityInspectorPanel';
import { useTraceabilityGraph, getTraceabilityChain, extractLinksFromMatrix, TraceabilityNodeData, TraceabilityEdgeData } from './useTraceabilityGraph';
import { TraceabilityService } from '@/services/enhancedTraceabilityService';
import { TraceabilityLinksService } from '@/services/traceabilityLinksService';

interface TraceabilityVisualizerProps {
  productId: string;
  companyId: string;
}

// Use 'any' for nodeTypes/edgeTypes to avoid complex generic issues with React Flow v12
const nodeTypes: Record<string, React.ComponentType<any>> = {
  traceabilityNode: TraceabilityFlowNode,
};

const edgeTypes: Record<string, React.ComponentType<any>> = {
  traceabilityEdge: TraceabilityFlowEdge,
};

const ALL_TYPES = [
  'bom_item',
  'device_component',
  'feature',
  'user_need',
  'system_requirement', 
  'software_requirement',
  'hardware_requirement',
  'test_case',
  'hazard',
  'risk_control'
];

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

export function TraceabilityVisualizer({ productId, companyId }: TraceabilityVisualizerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());

  // Fetch all traceability data
  const { data: matrixData, isLoading: isLoadingMatrix } = useQuery({
    queryKey: ['traceability-visual', productId],
    queryFn: () => TraceabilityService.getTraceabilityMatrix(companyId, productId, ALL_TYPES, ALL_TYPES),
  });

  const { data: allLinks = [], isLoading: isLoadingLinks } = useQuery({
    queryKey: ['traceability-links', productId],
    queryFn: () => TraceabilityLinksService.getByProduct(productId),
  });

  // Transform data to graph
  const { nodes: graphNodes, edges: graphEdges } = useTraceabilityGraph(
    matrixData?.sourceItems || [],
    matrixData?.targetItems || [],
    matrixData?.matrix || {},
    allLinks
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Update nodes/edges when data changes
  useEffect(() => {
    // Cast to the expected types
    setNodes(graphNodes as unknown as Node[]);
    setEdges(graphEdges as unknown as Edge[]);
  }, [graphNodes, graphEdges, setNodes, setEdges]);

  // Handle node selection
  // Combine explicit + matrix-derived links for chain detection
  const combinedLinks = useMemo(() => {
    const matrixLinks = extractLinksFromMatrix(matrixData?.matrix || {});
    const map = new Map<string, typeof allLinks[0]>();
    [...allLinks, ...matrixLinks].forEach(link => {
      if (link.id.startsWith('reverse-') || link.id.startsWith('virtual-reverse-') || link.id.startsWith('transitive-')) return;
      const key = `${link.source_id}-${link.target_id}`;
      if (!map.has(key)) map.set(key, link);
    });
    return Array.from(map.values());
  }, [allLinks, matrixData?.matrix]);

  // Build node type lookup for type-aware chain traversal
  const nodeTypeMap = useMemo(() => {
    const map = new Map<string, { type: string }>();
    nodes.forEach(n => {
      const data = n.data as unknown as TraceabilityNodeData;
      if (data?.type) map.set(n.id, { type: data.type });
    });
    return map;
  }, [nodes]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    
    if (focusMode) {
      const chain = getTraceabilityChain(node.id, combinedLinks, 'both', nodeTypeMap);
      setHighlightedNodes(chain);
    }
  }, [focusMode, combinedLinks, nodeTypeMap]);

  // Handle background click to deselect
  const onPaneClick = useCallback(() => {
    if (focusMode) {
      setHighlightedNodes(new Set());
    }
    setSelectedNodeId(null);
  }, [focusMode]);

  // Handle double-click to navigate to item
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    const data = node.data as unknown as TraceabilityNodeData;
    const route = TYPE_TO_ROUTE[data?.type];
    if (!route) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', route.tab);
    newParams.set('subTab', route.subTab);
    newParams.set('returnTo', 'visual');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Toggle focus mode
  const toggleFocusMode = useCallback(() => {
    setFocusMode(prev => !prev);
    if (focusMode) {
      setHighlightedNodes(new Set());
    }
  }, [focusMode]);

  // Get selected node data
  const selectedNodeData = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = nodes.find(n => n.id === selectedNodeId);
    return (node?.data as unknown as TraceabilityNodeData) || null;
  }, [selectedNodeId, nodes]);

  // Get chain items for inspector
  const chainItems = useMemo(() => {
    if (!selectedNodeId) return [];
    const chain = getTraceabilityChain(selectedNodeId, combinedLinks, 'both', nodeTypeMap);
    return nodes
      .filter(n => chain.has(n.id))
      .map(n => n.data as unknown as TraceabilityNodeData)
      .sort((a, b) => {
        const order = ['bom_item', 'device_component', 'feature', 'user_need', 'system_requirement', 'software_requirement', 'hardware_requirement', 'hazard', 'risk_control', 'test_case'];
        return order.indexOf(a.type) - order.indexOf(b.type);
      });
  }, [selectedNodeId, nodes, combinedLinks]);

  // Apply focus mode styling to nodes
  const styledNodes = useMemo(() => {
    if (!focusMode || highlightedNodes.size === 0) return nodes;
    
    return nodes.map(node => ({
      ...node,
      style: {
        ...node.style,
        opacity: highlightedNodes.has(node.id) ? 1 : 0.2,
        transition: 'opacity 0.3s ease',
      }
    }));
  }, [nodes, focusMode, highlightedNodes]);

  // Apply focus mode styling to edges
  const styledEdges = useMemo(() => {
    if (!focusMode || highlightedNodes.size === 0) return edges;
    
    return edges.map(edge => ({
      ...edge,
      style: {
        ...edge.style,
        opacity: highlightedNodes.has(edge.source) && highlightedNodes.has(edge.target) ? 1 : 0.1,
        transition: 'opacity 0.3s ease',
      }
    }));
  }, [edges, focusMode, highlightedNodes]);

  const isLoading = isLoadingMatrix || isLoadingLinks;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading traceability graph...</p>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <CardContent className="text-center space-y-3">
          <p className="text-muted-foreground">No traceability data available</p>
          <p className="text-sm text-muted-foreground">
            Add requirements, test cases, and create links to visualize your traceability network
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex h-[700px] border border-border rounded-lg overflow-hidden bg-background">
      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={styledNodes}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            type: 'traceabilityEdge',
          }}
        >
          <Background gap={20} size={1} />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              const colors: Record<string, string> = {
                bom_item: '#78716c',
                device_component: '#0ea5e9',
                feature: '#a855f7',
                user_need: '#8b5cf6',
                system_requirement: '#3b82f6',
                software_requirement: '#06b6d4',
                hardware_requirement: '#14b8a6',
                test_case: '#22c55e',
                hazard: '#ef4444',
                risk_control: '#f59e0b',
              };
              const data = node.data as unknown as TraceabilityNodeData;
              return colors[data?.type] || '#6b7280';
            }}
            maskColor="rgba(0,0,0,0.1)"
          />
          
          {/* Top Controls Panel */}
          <Panel position="top-right" className="flex gap-2 mr-[320px]">
            <Button
              variant={focusMode ? "default" : "outline"}
              size="sm"
              onClick={toggleFocusMode}
              className="gap-1.5"
            >
              {focusMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              Focus Mode
            </Button>
          </Panel>

          {/* Legend Panel */}
          <Panel position="bottom-left" className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3">
            <p className="text-xs font-medium text-foreground mb-2">Legend</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-stone-500" />
                <span className="text-muted-foreground">BOM Items</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
                <span className="text-muted-foreground">Components</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                <span className="text-muted-foreground">Features</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-violet-500" />
                <span className="text-muted-foreground">User Needs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                <span className="text-muted-foreground">System Req.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
                <span className="text-muted-foreground">Software Req.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
                <span className="text-muted-foreground">Test Cases</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-border space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">Edge Status</p>
              <div className="flex gap-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.5 bg-gray-400" />
                  <span className="text-muted-foreground">Not Run</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.5 bg-green-500" />
                  <span className="text-muted-foreground">Passed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-0.5 bg-red-500" />
                  <span className="text-muted-foreground">Failed</span>
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Inspector Panel */}
      <div className="w-80 border-l border-border bg-card">
        <TraceabilityInspectorPanel
          selectedNode={selectedNodeData}
          onClose={() => setSelectedNodeId(null)}
          chainItems={chainItems}
        />
      </div>
    </div>
  );
}
