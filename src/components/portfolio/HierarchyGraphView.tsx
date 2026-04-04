import React, { useMemo, useCallback } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  Position,
  BackgroundVariant
} from 'react-flow-renderer';
import { Package2, Layers, Box, Component } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface Product {
  id: string;
  name: string;
  device_category?: string;
  product_platform?: string;
  model_reference?: string;
  variants?: any[];
}

interface HierarchyGraphViewProps {
  products: Product[];
  onProductClick?: (productId: string) => void;
}

// Custom node types
const nodeTypes = {
  category: ({ data }: any) => (
    <Card className="p-4 bg-primary/10 border-primary min-w-48">
      <div className="flex items-center gap-2">
        <Package2 className="h-5 w-5 text-primary" />
        <div>
          <div className="font-semibold text-primary">{data.label}</div>
          <Badge variant="secondary" className="mt-1">{data.count} products</Badge>
        </div>
      </div>
    </Card>
  ),
  platform: ({ data }: any) => (
    <Card className="p-3 bg-secondary/10 border-secondary min-w-40">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-secondary-foreground" />
        <div>
          <div className="font-medium text-secondary-foreground">{data.label}</div>
          <Badge variant="outline" className="mt-1">{data.count} products</Badge>
        </div>
      </div>
    </Card>
  ),
  model: ({ data }: any) => (
    <Card className="p-3 bg-accent/10 border-accent min-w-36">
      <div className="flex items-center gap-2">
        <Box className="h-4 w-4 text-accent-foreground" />
        <div>
          <div className="font-medium text-accent-foreground">{data.label}</div>
          <Badge variant="outline" className="mt-1">{data.count} variants</Badge>
        </div>
      </div>
    </Card>
  ),
  product: ({ data }: any) => (
    <Card 
      className="p-2 bg-card border hover:border-primary cursor-pointer transition-colors min-w-32"
      onClick={() => data.onClick?.(data.productId)}
    >
      <div className="flex items-center gap-2">
        <Component className="h-3 w-3 text-muted-foreground" />
        <div className="text-sm font-medium truncate">{data.label}</div>
      </div>
    </Card>
  ),
};

export function HierarchyGraphView({ products, onProductClick }: HierarchyGraphViewProps) {
  // Process products into hierarchy with better org chart layout
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Group products by category -> platform -> model
    const hierarchy = products.reduce((acc, product) => {
      const category = product.device_category || 'Uncategorized';
      const platform = product.product_platform || 'No Platform';
      const model = product.model_reference || 'No Model';
      
      if (!acc[category]) acc[category] = {};
      if (!acc[category][platform]) acc[category][platform] = {};
      if (!acc[category][platform][model]) acc[category][platform][model] = [];
      
      acc[category][platform][model].push(product);
      return acc;
    }, {} as Record<string, Record<string, Record<string, Product[]>>>);

    let nodeId = 0;
    const categoryWidth = 300;
    const platformWidth = 250;
    const modelWidth = 200;
    const productWidth = 180;
    const levelSpacing = 300; // Increased spacing between levels
    const verticalSpacing = 120; // Increased vertical spacing
    
    // Calculate total width needed
    const categories = Object.keys(hierarchy);
    let globalYOffset = 0;
    
    // Create nodes for each level with org chart layout
    categories.forEach((category, catIndex) => {
      const categoryNodeId = `category-${nodeId++}`;
      const categoryProducts = Object.values(hierarchy[category]).flatMap(models => 
        Object.values(models).flatMap(products => products)
      );
      
      // Category node (root level)
      nodes.push({
        id: categoryNodeId,
        type: 'category',
        position: { x: 50, y: globalYOffset },
        data: { 
          label: category, 
          count: categoryProducts.length 
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
      
      const platforms = Object.keys(hierarchy[category]);
      let categoryHeight = 0;
      
      platforms.forEach((platform, platIndex) => {
        const platformNodeId = `platform-${nodeId++}`;
        const platformProducts = Object.values(hierarchy[category][platform]).flatMap(products => products);
        
        // Calculate platform Y position (centered under category)
        const platformY = globalYOffset + (platIndex * verticalSpacing) - ((platforms.length - 1) * verticalSpacing / 2);
        
        // Platform node
        nodes.push({
          id: platformNodeId,
          type: 'platform',
          position: { x: levelSpacing, y: platformY },
          data: { 
            label: platform, 
            count: platformProducts.length 
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
        
        // Edge from category to platform
        edges.push({
          id: `${categoryNodeId}-${platformNodeId}`,
          source: categoryNodeId,
          target: platformNodeId,
          type: 'smoothstep',
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
        });
        
        const models = Object.keys(hierarchy[category][platform]);
        
        models.forEach((model, modelIndex) => {
          const modelNodeId = `model-${nodeId++}`;
          const modelProducts = hierarchy[category][platform][model];
          
          // Calculate model Y position
          const modelY = platformY + (modelIndex * (verticalSpacing * 0.7)) - ((models.length - 1) * (verticalSpacing * 0.7) / 2);
          
          // Model node
          nodes.push({
            id: modelNodeId,
            type: 'model',
            position: { x: levelSpacing * 2, y: modelY },
            data: { 
              label: model, 
              count: modelProducts.length 
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
          });
          
          // Edge from platform to model
          edges.push({
            id: `${platformNodeId}-${modelNodeId}`,
            source: platformNodeId,
            target: modelNodeId,
            type: 'smoothstep',
            style: { stroke: 'hsl(var(--secondary))', strokeWidth: 2 },
          });
          
          // Product nodes arranged vertically under each model
          modelProducts.forEach((product, prodIndex) => {
            const productNodeId = `product-${nodeId++}`;
            const productY = modelY + (prodIndex * 60) - ((modelProducts.length - 1) * 60 / 2);
            
            nodes.push({
              id: productNodeId,
              type: 'product',
              position: { x: levelSpacing * 3, y: productY },
              data: { 
                label: product.name,
                productId: product.id,
                onClick: onProductClick
              },
              targetPosition: Position.Left,
            });
            
            // Edge from model to product
            edges.push({
              id: `${modelNodeId}-${productNodeId}`,
              source: modelNodeId,
              target: productNodeId,
              type: 'smoothstep',
              style: { stroke: 'hsl(var(--accent))', strokeWidth: 1 },
            });
          });
        });
        
        categoryHeight = Math.max(categoryHeight, Math.abs(platformY - globalYOffset) + 60);
      });
      
      globalYOffset += Math.max(categoryHeight + 100, verticalSpacing * Math.max(platforms.length, 1));
    });
    
    return { nodes, edges };
  }, [products, onProductClick]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((event: any, node: Node) => {
    if (node.type === 'product' && node.data.onClick) {
      node.data.onClick(node.data.productId);
    }
  }, []);

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <div className="text-center">
          <Package2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No products available for hierarchy view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[700px] border rounded-lg bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 100, maxZoom: 1.2 }}
        minZoom={0.1}
        maxZoom={3}
        defaultZoom={0.8}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
      </ReactFlow>
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-card border rounded-lg p-2">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded"></div>
            <span>Categories</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-secondary rounded"></div>
            <span>Platforms</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent rounded"></div>
            <span>Models</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-card border rounded"></div>
            <span>Products</span>
          </div>
        </div>
      </div>
    </div>
  );
}