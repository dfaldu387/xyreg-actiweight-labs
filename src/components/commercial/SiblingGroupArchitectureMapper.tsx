import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCompanyBasicUDIGroups } from '@/hooks/useCompanyBasicUDIGroups';
import { useSiblingGroupRelationships } from '@/hooks/useSiblingGroupRelationships';
import { TrendingUp, Package, Percent } from 'lucide-react';

interface SiblingGroupArchitectureMapperProps {
  companyId: string;
}

// Custom node component for sibling groups
const SiblingGroupNode = ({ data }: { data: any }) => {
  const getDistributionIcon = (pattern: string) => {
    switch (pattern) {
      case 'gaussian_curve':
        return '📊';
      case 'empirical_data':
        return '📈';
      case 'even':
      default:
        return '▬';
    }
  };

  return (
    <Card className="p-4 min-w-[200px] border-2 bg-card shadow-lg">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{data.groupName}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {getDistributionIcon(data.distributionPattern)} {data.distributionPattern}
          </Badge>
        </div>
        
        {data.basicUdiDi && (
          <div className="text-xs text-muted-foreground">
            UDI: {data.basicUdiDi}
          </div>
        )}
        
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            <span>{data.productCount} products</span>
          </div>
          {data.totalPercentage > 0 && (
            <div className="flex items-center gap-1">
              <Percent className="h-3 w-3" />
              <span>{data.totalPercentage.toFixed(0)}%</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const nodeTypes = {
  siblingGroup: SiblingGroupNode,
};

export function SiblingGroupArchitectureMapper({ companyId }: SiblingGroupArchitectureMapperProps) {
  const { data: udiGroups, isLoading: loadingGroups } = useCompanyBasicUDIGroups(companyId);
  const { data: relationships, isLoading: loadingRelationships } = useSiblingGroupRelationships(companyId);

  // Generate nodes from sibling groups
  const initialNodes: Node[] = useMemo(() => {
    if (!udiGroups) return [];

    const nodes: Node[] = [];
    let yOffset = 0;

    udiGroups.forEach((udiCluster, clusterIndex) => {
      const siblingGroups = udiCluster.siblingGroups || [];
      
      if (siblingGroups.length === 0) return;

      // Position groups in a grid layout by UDI cluster
      const xOffset = (clusterIndex % 3) * 400;
      const yStart = Math.floor(clusterIndex / 3) * 300;

      siblingGroups.forEach((group, groupIndex) => {
        nodes.push({
          id: group.id,
          type: 'siblingGroup',
          position: { 
            x: xOffset, 
            y: yStart + (groupIndex * 150) 
          },
          data: {
            groupName: group.name,
            basicUdiDi: udiCluster.basicUDI,
            distributionPattern: group.distribution_pattern,
            productCount: group.product_count || 0,
            totalPercentage: group.total_percentage || 0,
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      });
    });

    return nodes;
  }, [udiGroups]);

  // Generate edges from relationships
  const initialEdges: Edge[] = useMemo(() => {
    if (!relationships) return [];

    return relationships.map((rel) => ({
      id: rel.id,
      source: rel.main_sibling_group_id,
      target: rel.accessory_sibling_group_id,
      type: 'smoothstep',
      animated: rel.recurring_multiplier > 0,
      label: `${rel.initial_multiplier}x initial, ${rel.recurring_multiplier}x ${rel.recurring_period}`,
      labelStyle: { fill: 'hsl(var(--foreground))', fontSize: 10 },
      labelBgStyle: { fill: 'hsl(var(--background))' },
      style: { 
        stroke: rel.relationship_type === 'accessory' 
          ? 'hsl(var(--primary))' 
          : 'hsl(var(--accent))',
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: rel.relationship_type === 'accessory' 
          ? 'hsl(var(--primary))' 
          : 'hsl(var(--accent))',
      },
    }));
  }, [relationships]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when data changes
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  if (loadingGroups || loadingRelationships) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Card>
    );
  }

  if (!nodes.length) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          <Package className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold mb-2">No Sibling Groups Found</h3>
            <p className="text-muted-foreground text-sm">
              Create sibling groups for your products to visualize their commercial relationships and revenue patterns.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] bg-muted/30">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
      >
        <Background />
        <Controls />
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-card border rounded-lg p-4 shadow-lg z-10">
          <div className="text-xs font-semibold mb-2">Legend</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-primary" />
              <span>Accessory Relationship</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-accent" />
              <span>Other Relationship</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              <span>Animated = Recurring</span>
            </div>
            <div className="space-y-1 mt-2 pt-2 border-t">
              <div>📊 Gaussian Distribution</div>
              <div>📈 Empirical Data</div>
              <div>▬ Even Distribution</div>
            </div>
          </div>
        </div>
      </ReactFlow>
    </Card>
  );
}
