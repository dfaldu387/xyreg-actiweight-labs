// @ts-nocheck
import React, { useState, useCallback, useMemo, useRef, DragEvent, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
  NodeTypes,
  EdgeTypes,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Search, GripVertical, Save, Network, ChevronRight, ChevronDown } from 'lucide-react';
import { useSiblingGroupRelationships, useDeleteSiblingGroupRelationship } from '@/hooks/useSiblingGroupRelationships';
import { useProductAccessoryRelationships, useUpdateProductAccessoryRelationship } from '@/hooks/useProductRelationships';
import { useProductSiblingGroupRelationships } from '@/hooks/useProductSiblingGroupRelationships';
import { useSiblingGroupProductRelationships } from '@/hooks/useSiblingGroupProductRelationships';
import { RelationshipDefinitionDialog } from './RelationshipDefinitionDialog';
import { DistributionEditDialog } from './DistributionEditDialog';
import { SiblingGroupProductsDialog } from './SiblingGroupProductsDialog';
import { RelationshipDetailsDialog } from './RelationshipDetailsDialog';
import { PercentageEdge } from './PercentageEdge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArchitectureNodeComponent } from './ArchitectureNodeComponent';

const nodeTypes: NodeTypes = {
  architectureNode: ArchitectureNodeComponent,
};

const edgeTypes: EdgeTypes = {
  percentageEdge: PercentageEdge,
};

interface ProductRelationshipArchitectureMapperProps {
  companyId: string;
  products: any[];
}

function ProductRelationshipArchitectureMapperInner({ 
  companyId,
  products 
}: ProductRelationshipArchitectureMapperProps) {
  const { data: groupRelationships = [], refetch: refetchGroupRelationships } = useSiblingGroupRelationships(companyId);
  const { data: productRelationships = [], refetch: refetchProductRelationships } = useProductAccessoryRelationships(companyId);
  const { data: productSiblingGroupRelationships = [], refetch: refetchProductSiblingGroupRelationships } = useProductSiblingGroupRelationships(companyId);
  const { data: siblingGroupProductRelationships = [], refetch: refetchSiblingGroupProductRelationships } = useSiblingGroupProductRelationships(companyId);
  const updateProductRelationship = useUpdateProductAccessoryRelationship();
  const deleteRelationship = useDeleteSiblingGroupRelationship();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [distributionDialogOpen, setDistributionDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<any>(null);
  const [selectedConnection, setSelectedConnection] = useState<{
    mainGroupId?: string;
    accessoryGroupId?: string;
    mainIsProduct?: boolean;
    accessoryIsProduct?: boolean;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [siblingGroups, setSiblingGroups] = useState<any[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [placedItems, setPlacedItems] = useState<Set<string>>(new Set());
  const [layoutId, setLayoutId] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();
  const { screenToFlowPosition, getNodes, getEdges } = reactFlowInstance;

  // Fetch sibling groups
  React.useEffect(() => {
    const fetchSiblingGroups = async () => {
      const { data, error } = await supabase
        .from('product_sibling_groups')
        .select(`
          *,
          product_sibling_assignments (
            id,
            product_id,
            percentage,
            position,
            products (
              id,
              name,
              model_reference,
              trade_name
            )
          )
        `)
        .eq('company_id', companyId)
        .order('position', { ascending: true });

      if (!error && data) {
        // Sort product_sibling_assignments by position for each group
        const sortedData = data.map(group => ({
          ...group,
          product_sibling_assignments: group.product_sibling_assignments
            ? [...group.product_sibling_assignments].sort((a, b) => a.position - b.position)
            : []
        }));
        setSiblingGroups(sortedData);
      }
    };

    fetchSiblingGroups();
  }, [companyId]);

  // Cleanup effect to prevent cursor flickering
  useEffect(() => {
    const cleanup = () => {
      // Reset any stuck cursor states
      document.body.style.cursor = '';
      if (reactFlowWrapper.current) {
        reactFlowWrapper.current.style.cursor = '';
      }
    };

    // Cleanup on unmount
    return cleanup;
  }, []);

  // Filter groups and parent products based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return siblingGroups;
    const query = searchQuery.toLowerCase();
    return siblingGroups.filter(g => 
      g.name?.toLowerCase().includes(query) ||
      g.basic_udi_di?.toLowerCase().includes(query)
    );
  }, [siblingGroups, searchQuery]);

  // Get products that are not in any sibling group
  const productsInGroups = useMemo(() => {
    const productIds = new Set<string>();
    siblingGroups.forEach(group => {
      group.product_sibling_assignments?.forEach((assignment: any) => {
        if (assignment.product_id) {
          productIds.add(assignment.product_id);
        }
      });
    });
    return productIds;
  }, [siblingGroups]);

  const ungroupedProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      !p.parent_product_id &&
      !productsInGroups.has(p.id) &&
      (!searchQuery || 
        p.name?.toLowerCase().includes(query) ||
        p.model_reference?.toLowerCase().includes(query) ||
        p.trade_name?.toLowerCase().includes(query))
    );
  }, [products, productsInGroups, searchQuery]);

  // Create nodes only for items that have been placed on canvas (initially empty)
  const initialNodes: Node[] = useMemo(() => {
    return [];
  }, []);

  // Create edges from existing relationships between placed nodes (handlers added via useEffect)
  const createEdgesFromRelationships = useCallback((currentNodes: Node[]) => {
    const nodeIds = new Set(currentNodes.map(n => n.id));
    const newEdges: Edge[] = [];

    // Helper to check if both nodes exist
    const bothNodesExist = (sourceId: string, targetId: string) => 
      nodeIds.has(sourceId) && nodeIds.has(targetId);

    // Convert group-to-group relationships
    groupRelationships.forEach((rel: any) => {
      const sourceId = `group-${rel.main_sibling_group_id}`;
      const targetId = `group-${rel.accessory_sibling_group_id}`;
      if (bothNodesExist(sourceId, targetId)) {
        newEdges.push({
          id: rel.id,
          source: sourceId,
          target: targetId,
          type: 'percentageEdge',
          animated: true,
          reconnectable: 'target' as const,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
          style: { stroke: '#8b5cf6', strokeWidth: 3 },
          data: {
            percentage: rel.revenue_attribution_percentage || 50,
            relationship: rel,
          },
        });
      }
    });

    // Convert product-to-product relationships
    productRelationships.forEach((rel: any) => {
      const sourceId = `product-${rel.main_product_id}`;
      const targetId = `product-${rel.accessory_product_id}`;
      if (bothNodesExist(sourceId, targetId)) {
        newEdges.push({
          id: rel.id,
          source: sourceId,
          target: targetId,
          type: 'percentageEdge',
          animated: true,
          reconnectable: 'target' as const,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
          style: { stroke: '#3b82f6', strokeWidth: 3 },
          data: {
            percentage: rel.revenue_attribution_percentage || 50,
            relationship: rel,
          },
        });
      }
    });

    // Convert product-to-group relationships
    productSiblingGroupRelationships.forEach((rel: any) => {
      const sourceId = `product-${rel.main_product_id}`;
      const targetId = `group-${rel.accessory_sibling_group_id}`;
      if (bothNodesExist(sourceId, targetId)) {
        newEdges.push({
          id: rel.id,
          source: sourceId,
          target: targetId,
          type: 'percentageEdge',
          animated: true,
          reconnectable: 'target' as const,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
          style: { stroke: '#10b981', strokeWidth: 3 },
          data: {
            percentage: rel.revenue_attribution_percentage || 50,
            relationship: rel,
          },
        });
      }
    });

    // Convert group-to-product relationships
    siblingGroupProductRelationships.forEach((rel: any) => {
      const sourceId = `group-${rel.main_sibling_group_id}`;
      const targetId = `product-${rel.accessory_product_id}`;
      if (bothNodesExist(sourceId, targetId)) {
        newEdges.push({
          id: rel.id,
          source: sourceId,
          target: targetId,
          type: 'percentageEdge',
          animated: true,
          reconnectable: 'target' as const,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
          style: { stroke: '#f59e0b', strokeWidth: 3 },
          data: {
            percentage: rel.revenue_attribution_percentage || 50,
            relationship: rel,
          },
        });
      }
    });

    return newEdges;
  }, [
    groupRelationships,
    productRelationships,
    productSiblingGroupRelationships,
    siblingGroupProductRelationships,
  ]);

  // Initialize with empty edges
  const initialEdges: Edge[] = useMemo(() => {
    return [];
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Handle edge delete - defined here so it can be used in edge data
  const handleDeleteEdge = useCallback(async (edgeId: string) => {
    try {
      const edge = edges.find(e => e.id === edgeId);
      if (!edge) {
        toast.error('Cannot find edge to delete');
        return;
      }

      // Determine relationship type from source/target patterns
      const sourceIsGroup = edge.source.startsWith('group-');
      const targetIsGroup = edge.target.startsWith('group-');
      const sourceIsProduct = edge.source.startsWith('product-');
      const targetIsProduct = edge.target.startsWith('product-');
      
      // Try to delete from all possible tables
      if (sourceIsGroup && targetIsGroup) {
        await supabase.from('sibling_group_relationships').delete().eq('id', edgeId);
      } else if (sourceIsProduct && targetIsProduct) {
        await supabase.from('product_accessory_relationships').delete().eq('id', edgeId);
      } else if (sourceIsProduct && targetIsGroup) {
        await supabase.from('product_sibling_group_relationships').delete().eq('id', edgeId);
      } else if (sourceIsGroup && targetIsProduct) {
        await supabase.from('sibling_group_product_relationships').delete().eq('id', edgeId);
      }

      // Remove edge from state
      setEdges((eds) => eds.filter(e => e.id !== edgeId));
      
      toast.success('Relationship deleted');
      await Promise.all([
        refetchGroupRelationships(),
        refetchProductRelationships(),
        refetchProductSiblingGroupRelationships(),
        refetchSiblingGroupProductRelationships(),
      ]);
      
      // Save layout after delete
      setTimeout(() => saveLayout(), 300);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete relationship');
    }
  }, [edges, setEdges, refetchGroupRelationships, refetchProductRelationships, refetchProductSiblingGroupRelationships, refetchSiblingGroupProductRelationships]);

  // Handler functions for edges - defined at component level
  const handleEditPercentage = useCallback((edgeId: string) => {
    setEdges((currentEdges) => {
      const edge = currentEdges.find(e => e.id === edgeId);
      if (edge?.data?.relationship) {
        setSelectedRelationship(edge.data.relationship);
        setDetailsDialogOpen(true);
      } else {
        console.error('❌ No relationship data found on edge');
      }
      return currentEdges;
    });
  }, [setEdges]);

  // Add handlers to edges and update percentages from relationship data
  useEffect(() => {
    setEdges((eds) => eds.map(edge => {
      let updatedPercentage = edge.data?.percentage;
      let updatedRelationship = edge.data?.relationship;

      // Find the latest relationship data to get updated percentage
      const allRelationships = [
        ...groupRelationships,
        ...productRelationships,
        ...productSiblingGroupRelationships,
        ...siblingGroupProductRelationships,
      ];

      const latestRelationship = allRelationships.find(rel => rel.id === edge.id);
      if (latestRelationship) {
        updatedPercentage = latestRelationship.revenue_attribution_percentage || 50;
        updatedRelationship = latestRelationship;
      }

      return {
        ...edge,
        data: {
          ...edge.data,
          percentage: updatedPercentage,
          relationship: updatedRelationship,
          onDelete: handleDeleteEdge,
          onEditPercentage: handleEditPercentage,
        },
      };
    }));
  }, [handleDeleteEdge, handleEditPercentage, setEdges, groupRelationships, productRelationships, productSiblingGroupRelationships, siblingGroupProductRelationships]);

  // Load relationships as edges when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      const relationshipEdges = createEdgesFromRelationships(nodes);
      
      setEdges((currentEdges) => {
        // Keep manually created edges, add missing relationship edges
        const existingEdgeIds = new Set(currentEdges.map(e => e.id));
        const newEdges = relationshipEdges.filter(e => !existingEdgeIds.has(e.id));
        
        if (newEdges.length > 0) {
          return [...currentEdges, ...newEdges];
        }
        return currentEdges;
      });
    }
  }, [nodes, createEdgesFromRelationships, setEdges, groupRelationships, productRelationships, productSiblingGroupRelationships, siblingGroupProductRelationships]);

  // Delete node handler - also delete connected relationships
  const handleDeleteNode = useCallback(async (nodeId: string) => {
    // Find all edges connected to this node
    const connectedEdges = edges.filter(
      edge => edge.source === nodeId || edge.target === nodeId
    );
    
    // Delete relationships from database
    try {
      for (const edge of connectedEdges) {
        const rel = edge.data?.relationship;
        if (rel) {
          // Determine which table to delete from
          if (rel.main_sibling_group_id && rel.accessory_sibling_group_id) {
            await supabase
              .from('sibling_group_relationships')
              .delete()
              .eq('id', rel.id);
          } else if (rel.main_product_id && rel.accessory_product_id) {
            await supabase
              .from('product_accessory_relationships')
              .delete()
              .eq('id', rel.id);
          } else if (rel.main_product_id && rel.accessory_sibling_group_id) {
            await supabase
              .from('product_sibling_group_relationships')
              .delete()
              .eq('id', rel.id);
          } else if (rel.main_sibling_group_id && rel.accessory_product_id) {
            await supabase
              .from('sibling_group_product_relationships')
              .delete()
              .eq('id', rel.id);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting connected relationships:', error);
    }
    
    // Remove node from canvas
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    
    // Remove connected edges visually
    setEdges((eds) => eds.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    ));
    
    setPlacedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(nodeId);
      return newSet;
    });
    
    toast.success('Removed from canvas and deleted connected relationships');
    refetchGroupRelationships();
    refetchProductRelationships();
    refetchProductSiblingGroupRelationships();
    refetchSiblingGroupProductRelationships();
  }, [setNodes, edges, setEdges, refetchGroupRelationships, refetchProductRelationships, refetchProductSiblingGroupRelationships, refetchSiblingGroupProductRelationships]);

  // Node creation functions
  const createNodeFromGroup = useCallback((group: any, position: { x: number; y: number }): Node => {
    const productCount = group.product_sibling_assignments?.length || 0;
    const nodeId = `group-${group.id}`;
    return {
      id: nodeId,
      type: 'architectureNode',
      position,
      data: { 
        title: group.name,
        subtitle: group.basic_udi_di,
        info: `${group.distribution_pattern} • ${productCount} product${productCount !== 1 ? 's' : ''}`,
        nodeType: 'group',
        onDelete: () => handleDeleteNode(nodeId),
      },
      style: {
        background: 'hsl(var(--card))',
        color: 'hsl(var(--card-foreground))',
        border: '2px solid hsl(var(--primary) / 0.3)',
        borderRadius: '8px',
        width: 240,
      },
    };
  }, [handleDeleteNode]);

  const createNodeFromProduct = useCallback((product: any, position: { x: number; y: number }): Node => {
    const nodeId = `product-${product.id}`;
    return {
      id: nodeId,
      type: 'architectureNode',
      position,
      data: { 
        title: product.name,
        subtitle: product.model_reference || product.trade_name,
        info: 'Individual Product',
        nodeType: 'product',
        onDelete: () => handleDeleteNode(nodeId),
      },
      style: {
        background: 'hsl(var(--card))',
        color: 'hsl(var(--card-foreground))',
        border: '2px solid hsl(var(--accent))',
        borderRadius: '8px',
        width: 240,
      },
    };
  }, [handleDeleteNode]);
  
  // Filter edges to only show connections between existing nodes (but don't override manual changes)
  useEffect(() => {
    const nodeIds = new Set(nodes.map(n => n.id));
    const validEdges = initialEdges.filter(edge => 
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );
    
    // Only update if we don't have edges yet or if the number changed significantly
    setEdges((currentEdges) => {
      if (currentEdges.length === 0) {
        return validEdges;
      }
      // Keep current edges but filter out invalid ones
      return currentEdges.filter(edge => 
        nodeIds.has(edge.source) && nodeIds.has(edge.target)
      );
    });
  }, [nodes, setEdges]);
  
  // Removed conflicting useEffect that was overwriting manual edge reconnections

  // Load saved layout on mount
  useEffect(() => {
    const loadLayout = async () => {
      const { data, error } = await supabase
        .from('product_architecture_layouts')
        .select('*')
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setLayoutId(data.id);
        if (data.nodes && Array.isArray(data.nodes)) {
          const loadedNodes = (data.nodes as unknown as Node[]).map((node) => ({
            ...node,
            data: {
              ...node.data,
              onDelete: () => handleDeleteNode(node.id),
            },
          }));
          setNodes(loadedNodes);
          const placedSet = new Set<string>();
          loadedNodes.forEach((node) => placedSet.add(node.id));
          setPlacedItems(placedSet);
        }
      }
    };

    loadLayout();
  }, [companyId, setNodes, setEdges]);


  // Save layout using ReactFlow instance for latest state
  const saveLayout = useCallback(async () => {
    try {
      const currentNodes = getNodes();
      const currentEdges = getEdges();

      // Clean edge data before saving - only keep essential data
      const cleanedEdges = currentEdges.map(edge => ({
        ...edge,
        reconnectable: 'target' as const,
        data: {
          percentage: edge.data?.percentage || 50,
          // Don't save functions
        },
      }));

      const layoutData = {
        company_id: companyId,
        nodes: currentNodes,
        edges: cleanedEdges,
      };

      if (layoutId) {
        const { error } = await supabase
          .from('product_architecture_layouts')
          .update(layoutData)
          .eq('id', layoutId);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('product_architecture_layouts')
          .insert(layoutData)
          .select()
          .single();
        
        if (error) throw error;
        if (data) setLayoutId(data.id);
      }

    } catch (error) {
      console.error('❌ Error saving layout:', error);
      toast.error('Failed to save architecture');
    }
  }, [getNodes, getEdges, layoutId, companyId]);

  // Handle edge double-click to edit relationship
  const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    const rel = edge.data?.relationship;
    if (rel) {
      setSelectedRelationship(rel);
      setDialogOpen(true);
    }
  }, []);


  // Save layout when edges are deleted
  const onEdgesDelete = useCallback(() => {
    saveLayout();
  }, [saveLayout]);

  // Handle connection to create new relationship
  const onConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      // Detect if source/target are products or groups
      const sourceIsProduct = connection.source.startsWith('product-');
      const targetIsProduct = connection.target.startsWith('product-');
      
      const sourceId = connection.source.replace(/^(group-|product-)/, '');
      const targetId = connection.target.replace(/^(group-|product-)/, '');
      
      setSelectedConnection({
        mainGroupId: sourceId,
        accessoryGroupId: targetId,
        mainIsProduct: sourceIsProduct,
        accessoryIsProduct: targetIsProduct,
      });
      setSelectedRelationship(null);
      setDialogOpen(true);
    }
  }, []);

  // Simplified edge reconnection - always allow, update database accordingly
  const onReconnect = useCallback(async (oldEdge: Edge, newConnection: Connection) => {
    
    if (!newConnection.source || !newConnection.target) {
      // console.warn('❌ Invalid connection:', newConnection);
      return;
    }
    
    const rel = oldEdge.data?.relationship;
    if (!rel) {
      // console.error('❌ No relationship data on edge');
      toast.error('Cannot reconnect: missing relationship data');
      return;
    }

    const sourceIsProduct = newConnection.source.startsWith('product-');
    const targetIsProduct = newConnection.target.startsWith('product-');
    const sourceId = newConnection.source.replace(/^(group-|product-)/, '');
    const targetId = newConnection.target.replace(/^(group-|product-)/, '');

    const oldType = rel.main_sibling_group_id && rel.accessory_sibling_group_id ? 'group-group' :
                    rel.main_product_id && rel.accessory_product_id ? 'product-product' :
                    'product-group';
    const newType = !sourceIsProduct && !targetIsProduct ? 'group-group' :
                    sourceIsProduct && targetIsProduct ? 'product-product' :
                    'product-group';
    
    try {
      let newRelData: any;
      const commonData = {
        company_id: companyId,
        relationship_type: rel.relationship_type || 'accessory',
        revenue_attribution_percentage: rel.revenue_attribution_percentage || 0,
        typical_quantity: rel.typical_quantity || 1,
        is_required: rel.is_required || false,
        initial_multiplier: rel.initial_multiplier || 1,
        recurring_multiplier: rel.recurring_multiplier || 0,
        recurring_period: rel.recurring_period || 'none',
        lifecycle_duration_months: rel.lifecycle_duration_months || 0,
        seasonality_factors: rel.seasonality_factors || {},
      };

      // Delete old relationship
      const oldTable = oldType === 'group-group' ? 'sibling_group_relationships' :
                       oldType === 'product-product' ? 'product_accessory_relationships' :
                       'product_sibling_group_relationships';
      await supabase.from(oldTable).delete().eq('id', rel.id);

      // Create new relationship
      if (newType === 'group-group') {
        const { data, error } = await supabase.from('sibling_group_relationships')
          .insert({ ...commonData, main_sibling_group_id: sourceId, accessory_sibling_group_id: targetId })
          .select().single();
        if (error) throw error;
        newRelData = data;
      } else if (newType === 'product-product') {
        const { data, error } = await supabase.from('product_accessory_relationships')
          .insert({ 
            ...commonData, 
            main_product_id: sourceId, 
            accessory_product_id: targetId,
            has_variant_distribution: rel.has_variant_distribution || false,
            distribution_method: rel.distribution_method || 'equal_distribution',
          }).select().single();
        if (error) throw error;
        newRelData = data;
      } else {
        const { data, error } = await supabase.from('product_sibling_group_relationships')
          .insert({ ...commonData, main_product_id: sourceId, accessory_sibling_group_id: targetId })
          .select().single();
        if (error) throw error;
        newRelData = data;
      }

      const edgeColor = newType === 'group-group' ? '#8b5cf6' : newType === 'product-product' ? '#3b82f6' : '#10b981';

      // Update edge state immediately
      setEdges((eds) => eds.map((edge) => edge.id === oldEdge.id ? {
        ...edge,
        id: newRelData.id,
        source: newConnection.source,
        target: newConnection.target,
        reconnectable: 'target' as const,
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
        style: { stroke: edgeColor, strokeWidth: 3 },
        data: {
          ...edge.data,
          relationship: newRelData,
        },
      } : edge));

      toast.success('Relationship reconnected');
      
      await Promise.all([
        refetchGroupRelationships(),
        refetchProductRelationships(),
        refetchProductSiblingGroupRelationships(),
        refetchSiblingGroupProductRelationships(),
      ]);
      saveLayout();
    } catch (error) {
      // console.error('❌ Reconnection failed:', error);
      toast.error('Failed to reconnect');
      setEdges((eds) => eds.map((e) => e.id === oldEdge.id ? oldEdge : e));
    }
  }, [setEdges, companyId, refetchGroupRelationships, refetchProductRelationships, refetchProductSiblingGroupRelationships, refetchSiblingGroupProductRelationships, saveLayout]);

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedRelationship(null);
    setSelectedConnection(null);
    refetchGroupRelationships();
    refetchProductRelationships();
    refetchProductSiblingGroupRelationships();
    refetchSiblingGroupProductRelationships();
  };

  // Handle node double-click
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Check if this is a group node
    if (node.id.startsWith('group-')) {
      const groupId = node.id.replace('group-', '');
      const group = siblingGroups.find(g => g.id === groupId);
      if (group) {
        setSelectedNode(group);
        setDistributionDialogOpen(true);
      }
    } else {
      // For individual products, just show info for now
      toast.info('This is an individual product node. Distribution editing is only available for sibling groups.');
    }
  }, [siblingGroups]);


  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Save layout when node drag stops
  const onNodeDragStop = useCallback(() => {
    saveLayout();
  }, [saveLayout]);

  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow-type');
    const dataStr = event.dataTransfer.getData('application/reactflow-data');
    
    if (!type || !dataStr) return;

    const data = JSON.parse(dataStr);
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    let newNode: Node;
    if (type === 'group') {
      newNode = createNodeFromGroup(data, position);
      setPlacedItems(prev => new Set(prev).add(`group-${data.id}`));
    } else {
      newNode = createNodeFromProduct(data, position);
      setPlacedItems(prev => new Set(prev).add(`product-${data.id}`));
    }

    setNodes((nds) => [...nds, newNode]);
    saveLayout();
  }, [screenToFlowPosition, setNodes, createNodeFromGroup, createNodeFromProduct, saveLayout]);

  const onDragStart = useCallback((event: DragEvent, type: string, data: any) => {
    event.dataTransfer.setData('application/reactflow-type', type);
    event.dataTransfer.setData('application/reactflow-data', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  // Show all groups (even if placed), but filter ungrouped products
  const availableGroups = filteredGroups;
  const availableProducts = ungroupedProducts.filter(p => !placedItems.has(`product-${p.id}`));

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Sidebar */}
      <Card className="w-64 flex-shrink-0">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm mb-2">Available Components</h3>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
        </div>
        
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="p-4 space-y-4">
            {availableGroups.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Sibling Groups</div>
                <div className="space-y-2">
                  {availableGroups.map((group) => {
                    const isExpanded = expandedGroups.has(group.id);
                    return (
                      <div key={group.id} className="space-y-1">
                        <div className="flex items-stretch gap-0">
                          <button
                            onClick={() => toggleGroup(group.id)}
                            className="flex items-center justify-center w-6 hover:bg-accent/50 rounded-l transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            )}
                          </button>
                          <div
                            draggable
                            onDragStart={(e) => onDragStart(e, 'group', group)}
                            onDragEnd={(e) => {
                              e.dataTransfer.clearData();
                              e.currentTarget.style.cursor = '';
                              document.body.style.cursor = '';
                            }}
                            onDoubleClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedNode(group);
                              setDistributionDialogOpen(true);
                            }}
                            className="flex-1 p-2 border-2 border-primary/30 rounded-r cursor-move hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-3 w-3 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">{group.name}</div>
                                <div className="text-[10px] text-muted-foreground truncate">
                                  {group.distribution_pattern} • {group.product_sibling_assignments?.length || 0} products
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Show individual products within the group when expanded */}
                        {isExpanded && group.product_sibling_assignments && group.product_sibling_assignments.length > 0 && (
                          <div className="ml-4 pl-2 border-l-2 border-muted space-y-1">
                            {group.product_sibling_assignments.map((assignment: any) => {
                              const product = assignment.products;
                              if (!product) return null;
                              
                              return (
                                <div
                                  key={product.id}
                                  draggable
                                  onDragStart={(e) => onDragStart(e, 'product', product)}
                                  onDragEnd={(e) => {
                                    e.dataTransfer.clearData();
                                    e.currentTarget.style.cursor = '';
                                    document.body.style.cursor = '';
                                  }}
                                  className="p-1.5 border border-accent/50 rounded cursor-move hover:bg-accent/30 transition-colors"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <GripVertical className="h-2.5 w-2.5 text-muted-foreground" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[11px] font-medium truncate">{product.name}</div>
                                      <div className="text-[9px] text-muted-foreground truncate">
                                        {assignment.percentage}% • {product.model_reference || product.trade_name}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {availableProducts.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Ungrouped Products</div>
                <div className="space-y-2">
                  {availableProducts.map((product) => (
                    <div
                      key={product.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, 'product', product)}
                      onDragEnd={(e) => {
                        e.dataTransfer.clearData();
                        e.currentTarget.style.cursor = '';
                        document.body.style.cursor = '';
                      }}
                      className="p-2 border-2 border-accent rounded cursor-move hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{product.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {product.model_reference || product.trade_name}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {availableGroups.length === 0 && availableProducts.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-8">
                {searchQuery ? 'No items found' : 'All items placed on canvas'}
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Canvas */}
      <Card className="flex-1 p-6">
        <div className="space-y-4 h-full flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Product Relationship Architecture</h3>
              <p className="text-sm text-muted-foreground">
                Drag components from sidebar and connect them by dragging between nodes
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setSelectedConnection(null);
                  setSelectedRelationship(null);
                  setDialogOpen(true);
                }}
              >
                Define Relationship
              </Button>
              <Button onClick={saveLayout} variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save Architecture
              </Button>
            </div>
          </div>

          <div 
            ref={reactFlowWrapper}
            className="flex-1 bg-muted/30 rounded-lg relative"
            style={{ minHeight: '500px' }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onEdgesDelete={onEdgesDelete}
              onConnect={onConnect}
              onReconnect={onReconnect}
              onEdgeDoubleClick={onEdgeDoubleClick}
              onNodeDoubleClick={onNodeDoubleClick}
              onNodeDragStop={onNodeDragStop}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              connectionMode={ConnectionMode.Loose}
              snapToGrid={false}
              snapGrid={[15, 15]}
              defaultEdgeOptions={{
                type: 'percentageEdge',
                reconnectable: 'target',
                animated: true,
              }}
              fitView
            >
              <Background />
              <Controls />
            </ReactFlow>
            
            {/* Empty State Overlay */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center space-y-3 bg-background/95 border-2 border-dashed border-primary/30 rounded-lg p-8 max-w-md">
                  <Network className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold">Build Your Product Architecture</h3>
                  <p className="text-sm text-muted-foreground">
                    Drag sibling groups or individual products from the left sidebar onto this canvas to create your product architecture.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Then connect them by dragging between the connection points to define relationships.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" style={{ borderColor: 'hsl(var(--primary) / 0.3)', background: 'hsl(var(--card))' }} />
              <span>Sibling Groups</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" style={{ borderColor: 'hsl(var(--accent))', background: 'hsl(var(--card))' }} />
              <span>Individual Products</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5" style={{ background: 'hsl(var(--primary))' }} />
              <span>Relationships (drag to create, double-click to edit)</span>
            </div>
          </div>
        </div>
      </Card>

      <RelationshipDefinitionDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        companyId={companyId}
        initialData={{
          mainGroupId: selectedConnection?.mainGroupId || selectedRelationship?.main_sibling_group_id,
          accessoryGroupId: selectedConnection?.accessoryGroupId || selectedRelationship?.accessory_sibling_group_id,
          existingRelationship: selectedRelationship,
          mainIsProduct: selectedConnection?.mainIsProduct,
          accessoryIsProduct: selectedConnection?.accessoryIsProduct,
        }}
        siblingGroups={siblingGroups}
        products={products}
        onRelationshipCreated={(relationshipId, sourceId, targetId, percentage, sourceIsProduct, targetIsProduct) => {
          // Add edge to canvas when relationship is created
          const newEdge: Edge = {
            id: relationshipId,
            source: sourceIsProduct ? `product-${sourceId}` : `group-${sourceId}`,
            target: targetIsProduct ? `product-${targetId}` : `group-${targetId}`,
            type: 'percentageEdge',
            animated: true,
            reconnectable: 'target' as const,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: sourceIsProduct && targetIsProduct ? '#3b82f6' : '#8b5cf6',
            },
            style: {
              stroke: sourceIsProduct && targetIsProduct ? '#3b82f6' : '#8b5cf6',
              strokeWidth: 3,
            },
            data: {
              percentage,
            },
          };
          setEdges((eds) => [...eds, newEdge]);
          setTimeout(() => saveLayout(), 300);
        }}
      />

      <SiblingGroupProductsDialog
        open={distributionDialogOpen}
        onClose={() => {
          setDistributionDialogOpen(false);
          setSelectedNode(null);
        }}
        groupData={selectedNode}
      />

      <RelationshipDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        relationship={selectedRelationship}
        onEdit={() => {
          setDetailsDialogOpen(false);
          setSelectedRelationship(selectedRelationship);
          setDialogOpen(true);
        }}
        onSave={() => {
          // Refetch ALL relationship types to update edge percentages
          refetchGroupRelationships();
          refetchProductRelationships();
          refetchProductSiblingGroupRelationships();
          refetchSiblingGroupProductRelationships();
        }}
      />
    </div>
  );
}

export function ProductRelationshipArchitectureMapper(props: ProductRelationshipArchitectureMapperProps) {
  return (
    <ReactFlowProvider>
      <ProductRelationshipArchitectureMapperInner {...props} />
    </ReactFlowProvider>
  );
}
