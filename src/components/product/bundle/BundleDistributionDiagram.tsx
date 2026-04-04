import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MarkerType,
  Position,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BundleProductNode } from './BundleProductNode';
import { BundleDistributionEdge } from './BundleDistributionEdge';
import { getDistributionGroups } from '@/utils/bundleDistributionValidation';

interface BundleProduct {
  id: string;
  product_id?: string;
  sibling_group_id?: string;
  product_name?: string;
  group_name?: string;
  relationship_type: string;
  quantity: number;
  is_primary: boolean;
  product_image?: string;
  initial_multiplier?: number;
  recurring_multiplier?: number;
  recurring_period?: string;
  attachment_rate?: number;
  distribution_group_id?: string;
  distributionPattern?: string;
  variantProducts?: Array<{
    id: string;
    name: string;
    percentage?: number;
  }>;
}

interface BundleDistributionDiagramProps {
  products: BundleProduct[];
  onEditAttachmentRate?: (productId: string, rate: number) => void;
  onEditDistribution?: (groupId: string) => void;
}

const nodeTypes = {
  bundleProduct: BundleProductNode,
};

const edgeTypes = {
  distribution: BundleDistributionEdge,
};

function calculateDiagramLayout(products: BundleProduct[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Find primary product
  const primaryProduct = products.find(p => p.is_primary);
  
  if (!primaryProduct) {
    return { nodes, edges };
  }

  // Create primary product node at center
  nodes.push({
    id: primaryProduct.id,
    type: 'bundleProduct',
    position: { x: 400, y: 300 },
    data: {
      id: primaryProduct.product_id || primaryProduct.sibling_group_id || primaryProduct.id,
      name: primaryProduct.product_name || primaryProduct.group_name || 'Primary Product',
      image: primaryProduct.product_image,
      relationshipType: primaryProduct.relationship_type,
      quantity: primaryProduct.quantity,
      isPrimary: true,
      initialMultiplier: primaryProduct.initial_multiplier,
      recurringMultiplier: primaryProduct.recurring_multiplier,
      recurringPeriod: primaryProduct.recurring_period,
      attachmentRate: primaryProduct.attachment_rate,
      distributionGroupId: primaryProduct.distribution_group_id,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  });

  // Get distribution groups - map to ProductBundleMember format
  const mappedProducts = products.map(p => ({
    ...p,
    bundle_id: '',
    position: 0,
    created_at: '',
    relationship_type: p.relationship_type as 'component' | 'accessory' | 'consumable' | 'required' | 'optional' | 'replacement_part',
  }));
  const distributionGroups = getDistributionGroups(mappedProducts);
  const groupedProducts = new Set<string>();
  
  // Track items in groups for positioning
  distributionGroups.forEach(group => {
    group.members.forEach(m => groupedProducts.add(m.id));
  });

  // Layout other products
  const otherProducts = products.filter(p => !p.is_primary);
  const radius = 350;
  const angleStep = (2 * Math.PI) / Math.max(otherProducts.length, 1);

  // Position distribution groups
  let currentAngle = 0;
  let groupIndex = 0;

  distributionGroups.forEach((group) => {
    // Position group members in a cluster
    const groupCenterX = 400 + radius * Math.cos(currentAngle);
    const groupCenterY = 300 + radius * Math.sin(currentAngle);
    
    const groupRadius = 80;
    const memberAngleStep = (2 * Math.PI) / group.members.length;

    group.members.forEach((member, memberIndex) => {
      const product = otherProducts.find(p => p.id === member.id);
      if (!product) return;

      const memberAngle = memberIndex * memberAngleStep;
      const x = groupCenterX + groupRadius * Math.cos(memberAngle);
      const y = groupCenterY + groupRadius * Math.sin(memberAngle);

      nodes.push({
        id: product.id,
        type: 'bundleProduct',
        position: { x, y },
        data: {
          id: product.product_id || product.sibling_group_id || product.id,
          name: product.product_name || product.group_name || 'Product',
          image: product.product_image,
          relationshipType: product.relationship_type,
          quantity: product.quantity,
          isPrimary: false,
          initialMultiplier: product.initial_multiplier,
          recurringMultiplier: product.recurring_multiplier,
          recurringPeriod: product.recurring_period,
          attachmentRate: member.attachment_rate,
          distributionGroupId: group.groupId,
          distributionPattern: product.distributionPattern,
          variantProducts: product.variantProducts,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });

      // Create edge from primary to this product with distribution percentage
      const displayPercentage = Math.round(member.attachment_rate || 0);
      const edgeColor = getEdgeColorByRelationship(product.relationship_type);
      edges.push({
        id: `edge-${primaryProduct.id}-${product.id}`,
        source: primaryProduct.id,
        target: product.id,
        type: 'distribution',
        animated: false,
        style: { stroke: edgeColor, strokeWidth: 2 },
        data: {
          percentage: displayPercentage,
          color: edgeColor,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
        },
      });
    });

    currentAngle += angleStep * group.members.length;
    groupIndex++;
  });

  // Position ungrouped products
  otherProducts.forEach((product) => {
    if (groupedProducts.has(product.id)) return;

    const x = 400 + radius * Math.cos(currentAngle);
    const y = 300 + radius * Math.sin(currentAngle);

    nodes.push({
      id: product.id,
      type: 'bundleProduct',
      position: { x, y },
      data: {
        id: product.product_id || product.sibling_group_id || product.id,
        name: product.product_name || product.group_name || 'Product',
        image: product.product_image,
        relationshipType: product.relationship_type,
        quantity: product.quantity,
        isPrimary: false,
        initialMultiplier: product.initial_multiplier,
        recurringMultiplier: product.recurring_multiplier,
        recurringPeriod: product.recurring_period,
        attachmentRate: product.attachment_rate,
        distributionGroupId: product.distribution_group_id,
        distributionPattern: product.distributionPattern,
        variantProducts: product.variantProducts,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });

    // Create edge from primary to this product
    const displayPercentage = product.attachment_rate ? Math.round(product.attachment_rate) : 100;
    const edgeColor = getEdgeColorByRelationship(product.relationship_type);
    edges.push({
      id: `edge-${primaryProduct.id}-${product.id}`,
      source: primaryProduct.id,
      target: product.id,
      type: 'distribution',
      animated: false,
      style: { stroke: edgeColor, strokeWidth: 2 },
      data: {
        percentage: product.attachment_rate ? displayPercentage : undefined,
        color: edgeColor,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColor,
      },
    });

    currentAngle += angleStep;
  });

  return { nodes, edges };
}

function getEdgeColorByRelationship(relationshipType: string): string {
  switch (relationshipType) {
    case 'component':
      return 'hsl(221, 83%, 53%)'; // Blue
    case 'accessory':
      return 'hsl(142, 76%, 36%)'; // Green
    case 'consumable':
      return 'hsl(24, 95%, 53%)'; // Orange
    case 'required':
      return 'hsl(0, 72%, 51%)'; // Red
    case 'optional':
      return 'hsl(262, 83%, 58%)'; // Purple
    case 'replacement_part':
      return 'hsl(47, 96%, 53%)'; // Yellow
    default:
      return 'hsl(var(--muted-foreground))';
  }
}

const relationshipTypeLabels: Record<string, string> = {
  component: 'Component',
  accessory: 'Accessory',
  consumable: 'Consumable',
  required: 'Required',
  optional: 'Optional',
  replacement_part: 'Replacement Part',
};

export function BundleDistributionDiagram({
  products,
  onEditAttachmentRate,
  onEditDistribution 
}: BundleDistributionDiagramProps) {
  const { nodes, edges } = useMemo(
    () => calculateDiagramLayout(products),
    [products]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.data.distributionGroupId && onEditDistribution) {
        onEditDistribution(node.data.distributionGroupId as string);
      }
    },
    [onEditDistribution]
  );

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted/30 rounded-lg border border-dashed">
        <p className="text-muted-foreground">No device in bundle to visualize</p>
      </div>
    );
  }

  // Get unique relationship types from products
  const uniqueRelationships = Array.from(new Set(products.map(p => p.relationship_type)));

  return (
    <ReactFlowProvider>
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 p-4 border rounded-lg bg-muted/30">
          <div className="text-sm font-semibold text-foreground">Legend:</div>
          {uniqueRelationships.map((type) => (
            <div key={type} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getEdgeColorByRelationship(type) }}
              />
              <span className="text-sm text-foreground">
                {relationshipTypeLabels[type] || type}
              </span>
            </div>
          ))}
        </div>

        {/* Diagram */}
        <div className="h-[600px] border rounded-lg bg-background">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.5}
            maxZoom={1.5}
            defaultEdgeOptions={{
              type: 'distribution',
            }}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
