import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'react-flow-renderer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Users } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  model_reference?: string;
}

interface Relationship {
  id: string;
  main_product_id: string;
  accessory_product_id: string;
  relationship_type: string;
  initial_multiplier: number;
  recurring_multiplier: number;
  recurring_period: string;
  revenue_attribution_percentage: number;
  main_product?: Product;
  accessory_product?: Product;
}

interface ProductRelationshipVisualMapperProps {
  relationships: Relationship[];
  companyId: string;
}

// Custom node component
const ProductNode = ({ data }: any) => {
  const isGroup = data.type === 'group';
  
  return (
    <Card className="p-4 min-w-[200px] shadow-lg border-2" style={{ borderColor: data.color }}>
      <div className="flex items-start gap-2">
        {isGroup ? (
          <Users className="h-5 w-5 text-green-600 flex-shrink-0" />
        ) : (
          <Package className="h-5 w-5 text-blue-600 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{data.label}</div>
          {data.subtitle && (
            <div className="text-xs text-muted-foreground truncate">{data.subtitle}</div>
          )}
          {data.badge && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {data.badge}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};

const nodeTypes = {
  productNode: ProductNode,
};

export function ProductRelationshipVisualMapper({
  relationships,
  companyId,
}: ProductRelationshipVisualMapperProps) {
  // Transform relationships into nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodeMap = new Map<string, Node>();
    const edges: Edge[] = [];

    // Create nodes for all products involved
    relationships.forEach((rel, index) => {
      // Main product node
      if (!nodeMap.has(rel.main_product_id)) {
        nodeMap.set(rel.main_product_id, {
          id: rel.main_product_id,
          type: 'productNode',
          position: { x: 100, y: index * 150 },
          data: {
            label: rel.main_product?.name || 'Unknown Product',
            subtitle: rel.main_product?.model_reference,
            badge: 'Main Product',
            color: 'hsl(var(--primary))',
            type: 'product',
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      }

      // Accessory product node
      if (!nodeMap.has(rel.accessory_product_id)) {
        nodeMap.set(rel.accessory_product_id, {
          id: rel.accessory_product_id,
          type: 'productNode',
          position: { x: 500, y: index * 150 },
          data: {
            label: rel.accessory_product?.name || 'Unknown Product',
            subtitle: rel.accessory_product?.model_reference,
            badge: 'Accessory',
            color: 'hsl(var(--accent))',
            type: 'product',
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      }

      // Create edge
      const isRecurring = rel.recurring_multiplier > 0;
      const edgeLabel = [];
      
      if (rel.initial_multiplier > 0) {
        edgeLabel.push(`${rel.initial_multiplier}x initial`);
      }
      if (isRecurring) {
        edgeLabel.push(`${rel.recurring_multiplier}x/${rel.recurring_period}`);
      }
      if (rel.revenue_attribution_percentage > 0) {
        edgeLabel.push(`${rel.revenue_attribution_percentage}% rev`);
      }

      edges.push({
        id: rel.id,
        source: rel.main_product_id,
        target: rel.accessory_product_id,
        label: edgeLabel.join(' • '),
        type: isRecurring ? 'default' : 'straight',
        animated: isRecurring,
        style: {
          stroke: isRecurring ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
          strokeWidth: 2,
          strokeDasharray: isRecurring ? '5,5' : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isRecurring ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
        },
        labelStyle: {
          fill: 'hsl(var(--foreground))',
          fontSize: 12,
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: 'hsl(var(--background))',
          fillOpacity: 0.9,
        },
      });
    });

    // Apply auto-layout (simple hierarchical layout)
    const nodes = Array.from(nodeMap.values());
    const mainProducts = nodes.filter(n => 
      relationships.some(r => r.main_product_id === n.id)
    );
    const accessories = nodes.filter(n => 
      relationships.some(r => r.accessory_product_id === n.id) &&
      !mainProducts.includes(n)
    );

    // Position main products on the left
    mainProducts.forEach((node, i) => {
      node.position = { x: 100, y: i * 180 + 50 };
    });

    // Position accessories on the right
    accessories.forEach((node, i) => {
      node.position = { x: 600, y: i * 180 + 50 };
    });

    return {
      initialNodes: nodes,
      initialEdges: edges,
    };
  }, [relationships]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeDragStop = useCallback((event: any, node: Node) => {
    console.log('Node dragged:', node);
  }, []);

  if (relationships.length === 0) {
    return (
      <div className="h-[600px] border rounded-lg flex items-center justify-center bg-muted/10">
        <div className="text-center text-muted-foreground">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No relationships to visualize</p>
          <p className="text-sm">Create product relationships to see the architecture map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] border rounded-lg bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            return node.data.color || 'hsl(var(--muted))';
          }}
          maskColor="hsl(var(--background) / 0.8)"
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg">
        <div className="text-xs font-semibold mb-2">Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 rounded" style={{ borderColor: 'hsl(var(--primary))' }} />
            <span>Main Product</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 rounded" style={{ borderColor: 'hsl(var(--accent))' }} />
            <span>Accessory</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-muted-foreground" />
            <span>One-time</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-primary" style={{ backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0, currentColor 3px, transparent 3px, transparent 6px)' }} />
            <span>Recurring</span>
          </div>
        </div>
      </div>
    </div>
  );
}
