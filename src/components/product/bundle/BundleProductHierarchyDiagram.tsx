import React, { useMemo } from 'react';
import { ReactFlow, Node, Edge, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BundleProductNode } from './BundleProductNode';

interface BundleMember {
  id: string;
  product_id?: string;
  sibling_group_id?: string;
  relationship_type: string;
  is_primary: boolean;
  multiplier?: number;
  quantity?: number;
  consumption_rate?: number;
  consumption_period?: string;
  products?: {
    id: string;
    name: string;
    image?: string;
    images?: string[];
  };
  product_sibling_groups?: {
    id: string;
    name: string;
    product_count?: number;
  };
}

interface BundleProductHierarchyDiagramProps {
  members: BundleMember[];
}

const nodeTypes = {
  bundleProduct: BundleProductNode,
};

// Calculate hierarchical positions using polar coordinates
function calculateNodePositions(members: BundleMember[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Separate primary and other members
  const primaryMembers = members.filter(m => m.is_primary);
  const nonPrimaryMembers = members.filter(m => !m.is_primary);

  const centerX = 500;
  const centerY = 350;

  // Place primary product in center
  if (primaryMembers.length > 0) {
    const primaryMember = primaryMembers[0];
    nodes.push({
      id: primaryMember.id,
      type: 'bundleProduct',
      position: {
        x: centerX - 60,
        y: centerY - 60,
      },
      data: {
        productId: primaryMember.product_id,
        name: primaryMember.products?.name || primaryMember.product_sibling_groups?.name || 'Unknown',
        image: primaryMember.products?.image || primaryMember.products?.images?.[0],
        relationshipType: primaryMember.relationship_type,
        isPrimary: primaryMember.is_primary,
        multiplier: primaryMember.multiplier,
        quantity: primaryMember.quantity,
        consumptionRate: primaryMember.consumption_rate,
        consumptionPeriod: primaryMember.consumption_period,
        isGroup: !!primaryMember.sibling_group_id,
        productCount: primaryMember.product_sibling_groups?.product_count,
      },
    });
  }

  // Place non-primary members in a circle around the center
  const radius = 280;
  const angleStep = (2 * Math.PI) / Math.max(nonPrimaryMembers.length, 1);

  nonPrimaryMembers.forEach((member, index) => {
    const angle = index * angleStep - Math.PI / 2; // Start from top
    
    const relationshipColor = 
      member.relationship_type === 'component' ? '#3b82f6' :
      member.relationship_type === 'consumable' ? '#f59e0b' : 
      member.relationship_type === 'accessory' ? '#10b981' : 
      member.relationship_type === 'required' ? '#ef4444' :
      member.relationship_type === 'optional' ? '#8b5cf6' :
      '#6b7280';
    
    nodes.push({
      id: member.id,
      type: 'bundleProduct',
      position: {
        x: centerX + radius * Math.cos(angle) - 40,
        y: centerY + radius * Math.sin(angle) - 40,
      },
      data: {
        productId: member.product_id,
        name: member.products?.name || member.product_sibling_groups?.name || 'Unknown',
        image: member.products?.image || member.products?.images?.[0],
        relationshipType: member.relationship_type,
        isPrimary: member.is_primary,
        multiplier: member.multiplier,
        quantity: member.quantity,
        consumptionRate: member.consumption_rate,
        consumptionPeriod: member.consumption_period,
        isGroup: !!member.sibling_group_id,
        productCount: member.product_sibling_groups?.product_count,
      },
    });

    // Create edge from primary to this member
    if (primaryMembers.length > 0) {
      edges.push({
        id: `${primaryMembers[0].id}-${member.id}`,
        source: primaryMembers[0].id,
        target: member.id,
        type: 'straight',
        style: { 
          stroke: relationshipColor, 
          strokeWidth: 2,
          strokeDasharray: member.relationship_type === 'optional' ? '5,5' : undefined,
        },
        animated: false,
      });
    }
  });

  return { nodes, edges };
}

export function BundleProductHierarchyDiagram({ members }: BundleProductHierarchyDiagramProps) {
  const { nodes, edges } = useMemo(() => calculateNodePositions(members), [members]);

  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px] text-muted-foreground">
        No products in this bundle
      </div>
    );
  }

  return (
    <div className="h-[700px] border rounded-lg overflow-hidden bg-muted/10">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        preventScrolling={false}
      >
        <Background gap={16} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
