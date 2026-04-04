import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HierarchicalNode, HierarchicalBulkService } from "@/services/hierarchicalBulkService";
import { ChevronRight, ChevronDown, Package, Tag, Layers, Box, GripVertical, Search, X, Plus } from 'lucide-react';
import { VariantTags } from "@/components/ui/variant-tags";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { InlineCreationDialog } from './InlineCreationDialog';

interface HierarchyTreeViewProps {
  hierarchy: HierarchicalNode[];
  selectedNodes: HierarchicalNode[];
  onSelectionChange: (nodes: HierarchicalNode[]) => void;
  companyId: string;
  onHierarchyUpdate?: () => void;
  highlightedDevices?: string[][];
}

export function HierarchyTreeView({ hierarchy, selectedNodes, onSelectionChange, companyId, onHierarchyUpdate, highlightedDevices = [] }: HierarchyTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isDragDisabled, setIsDragDisabled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [creationDialogOpen, setCreationDialogOpen] = useState(false);
  
  // Helper function to check if a node should be auto-selected based on highlighted devices
  const shouldAutoSelectNode = (node: HierarchicalNode): boolean => {
    if (highlightedDevices.length === 0) return false;

    return highlightedDevices.some(devicePath => {
      // Skip "Product Portfolio" root level in paths - start from index 1
      const adjustedPath = devicePath.slice(1);
      
      // Check if this node's name appears anywhere in the adjusted device path
      return adjustedPath.some(pathPart => 
        pathPart.toLowerCase() === node.name.toLowerCase()
      );
    });
  };

  // Helper function to check if a node should be selected because it has selected children
  const shouldSelectAsParent = (node: HierarchicalNode): boolean => {
    if (!node.children || node.children.length === 0) return false;
    
    // Check if any child or descendant should be selected
    const hasSelectedDescendant = (nodes: HierarchicalNode[]): boolean => {
      return nodes.some(childNode => {
        if (shouldAutoSelectNode(childNode)) return true;
        if (childNode.children) return hasSelectedDescendant(childNode.children);
        return false;
      });
    };

    return hasSelectedDescendant(node.children);
  };

  // Auto-select nodes when highlightedDevices changes
  useEffect(() => {
    if (highlightedDevices.length > 0) {
      console.log('Auto-selecting nodes for highlighted devices:', highlightedDevices);
      
      // Find nodes to select based on highlighted device paths
      const nodesToSelect: HierarchicalNode[] = [];
      
      // Traverse hierarchy to find matching nodes
      const findMatchingNodes = (nodes: HierarchicalNode[]) => {
        nodes.forEach(node => {
          // Select if node is directly in the path OR if it should be selected as a parent
          const directMatch = shouldAutoSelectNode(node);
          const parentMatch = shouldSelectAsParent(node);
          
          if (directMatch || parentMatch) {
            console.log('Auto-selecting node:', node.name, { directMatch, parentMatch });
            nodesToSelect.push(node);
          }
          
          if (node.children) {
            findMatchingNodes(node.children);
          }
        });
      };
      
      findMatchingNodes(hierarchy);
      
      if (nodesToSelect.length > 0) {
        console.log('Setting selected nodes:', nodesToSelect.map(n => n.name));
        onSelectionChange(nodesToSelect);
      }
    }
  }, [highlightedDevices, hierarchy]);
  
  // Start with all nodes collapsed for better performance
  useEffect(() => {
    // Only auto-expand the top-level categories, not everything
    if (hierarchy.length > 0) {
      const topLevelIds = new Set(hierarchy.map(node => node.id));
      setExpandedNodes(topLevelIds);
    }
  }, [hierarchy]);
  
  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };
  
  const handleNodeSelection = (node: HierarchicalNode, checked: boolean) => {
    const newSelection = [...selectedNodes];
    
    if (checked) {
      // Add the node and all its children
      const nodesToAdd = [node];
      const addChildren = (n: HierarchicalNode) => {
        if (n.children) {
          n.children.forEach(child => {
            nodesToAdd.push(child);
            addChildren(child);
          });
        }
      };
      addChildren(node);
      
      nodesToAdd.forEach(n => {
        if (!newSelection.find(s => s.id === n.id)) {
          newSelection.push(n);
        }
      });
    } else {
      // Remove node and all children
      const nodesToRemove = [node];
      const removeChildren = (n: HierarchicalNode) => {
        if (n.children) {
          n.children.forEach(child => {
            nodesToRemove.push(child);
            removeChildren(child);
          });
        }
      };
      removeChildren(node);
      
      nodesToRemove.forEach(n => {
        const index = newSelection.findIndex(s => s.id === n.id);
        if (index !== -1) {
          newSelection.splice(index, 1);
        }
      });
    }
    
    onSelectionChange(newSelection);
  };
  
  const isNodeSelected = (node: HierarchicalNode): boolean => {
    return selectedNodes.some(s => s.id === node.id);
  };
  
  const isNodePartiallySelected = (node: HierarchicalNode): boolean => {
    if (!node.children) return false;
    
    const childrenSelected = node.children.filter(child => isNodeSelected(child));
    return childrenSelected.length > 0 && childrenSelected.length < node.children.length;
  };

  const handleSelectAllFiltered = () => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return;
    
    // Get all products from filtered hierarchy
    const collectAllProducts = (nodes: HierarchicalNode[]): HierarchicalNode[] => {
      const products: HierarchicalNode[] = [];
      
      const traverse = (nodeList: HierarchicalNode[]) => {
        nodeList.forEach(node => {
          if (node.type === 'product' && 
              node.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) {
            products.push(node);
          }
          if (node.children) {
            traverse(node.children);
          }
        });
      };
      
      traverse(nodes);
      return products;
    };
    
    const allFilteredProducts = collectAllProducts(filteredHierarchy);
    
    // Add all filtered products to selection (avoid duplicates)
    const newSelection = [...selectedNodes];
    allFilteredProducts.forEach(product => {
      if (!newSelection.find(s => s.id === product.id)) {
        newSelection.push(product);
      }
    });
    
    onSelectionChange(newSelection);
    
    toast.success(`Selected ${allFilteredProducts.length} products matching "${debouncedSearchTerm}"`);
  };
  
  const getNodeIcon = (type: HierarchicalNode['type']) => {
    switch (type) {
      case 'category': return Tag;
      case 'platform': return Layers;
      case 'model': return Box;
      case 'product': return Package;
    }
  };
  
  const handleDragEnd = async (result: DropResult) => {
    console.log('[HierarchyTreeView] 🚀 Drag operation:', {
      draggableId: result.draggableId,
      source: result.source,
      destination: result.destination
    });
    
    if (!result.destination) {
      console.log('[HierarchyTreeView] ❌ No destination - drag cancelled');
      return;
    }
    
    const { destination, source, draggableId } = result;
    
    // If dropped in the same position, do nothing
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      console.log('[HierarchyTreeView] ↩️ Dropped in same position - no change needed');
      return;
    }
    
    setIsDragDisabled(true);
    let loadingToast: string | number | null = null;
    
    try {
      loadingToast = toast.loading('Moving item...', { duration: 0 });
      
      // Parse draggable ID - handle contextual IDs
      const [nodeType, nodeId] = draggableId.split(':');
      
      // Extract original ID from contextual IDs
      let originalNodeId = nodeId;
      if (nodeType === 'platform' && nodeId.includes('-')) {
        // Extract platform UUID from "platformUUID-categoryUUID" format
        // UUID format: 8-4-4-4-12 characters
        const parts = nodeId.split('-');
        if (parts.length >= 6) {
          // Reconstruct the full platform UUID (first 5 parts)
          originalNodeId = parts.slice(0, 5).join('-');
        }
      } else if (nodeType === 'model' && nodeId.split('-').length >= 3) {
        // Extract model UUID from "modelUUID-platformUUID-categoryUUID" format
        const parts = nodeId.split('-');
        if (parts.length >= 15) {
          // Reconstruct the full model UUID (first 5 parts)
          originalNodeId = parts.slice(0, 5).join('-');
        }
      }
      
      console.log('[HierarchyTreeView] 📝 Drag source:', { 
        nodeType, 
        nodeId, 
        originalNodeId,
        contextualId: nodeId !== originalNodeId 
      });
      
      // Find the dragged node
      const findNode = (nodes: HierarchicalNode[], id: string): HierarchicalNode | null => {
        for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
            const found = findNode(node.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      
      const draggedNode = findNode(filteredHierarchy, nodeId);
      if (!draggedNode) {
        throw new Error(`Could not find dragged node: ${nodeId}`);
      }
      
      console.log('[HierarchyTreeView] 🎯 Dragged node found:', draggedNode.name);
      
      // For now, let's detect the target based on the drop position
      // In the new structure, we need to find what node the item was dropped near
      const flatList = createFlatNodeList(filteredHierarchy);
      const targetNodeData = flatList[destination.index];
      
      if (!targetNodeData) {
        throw new Error('Could not determine drop target');
      }
      
      const targetNode = targetNodeData.node;
      
      // Determine if this is a valid drop target
      const isValidTarget = ['category', 'platform', 'model'].includes(targetNode.type);
      
      if (!isValidTarget) {
        throw new Error(`Cannot drop on ${targetNode.type}. Drop on a category, platform, or model instead.`);
      }
      
      console.log('[HierarchyTreeView] 🔄 Moving:', {
        what: `${nodeType}: ${draggedNode.name}`,
        target: `${targetNode.type}: ${targetNode.name}`,
        targetType: targetNode.type,
        targetId: targetNode.id
      });
      
      // Perform the actual hierarchy update using original ID
      await HierarchicalBulkService.moveNodeInHierarchy(
        companyId,
        originalNodeId,  // Use the extracted original ID
        nodeType as any,
        targetNode.id,
        targetNode.type as any
      );
      
      toast.success(`Successfully moved ${draggedNode.name} to ${targetNode.name}`);
      
      // Refresh the hierarchy to reflect changes
      if (onHierarchyUpdate) {
        onHierarchyUpdate();
      }
      
      console.log('[HierarchyTreeView] ✅ Drag operation completed successfully');
      
    } catch (error: any) {
      console.error('[HierarchyTreeView] ❌ Drag failed:', error);
      toast.error(`Failed: ${error.message}`);
      
    } finally {
      // Always dismiss the loading toast and re-enable dragging
      if (loadingToast !== null) {
        toast.dismiss(loadingToast);
      }
      setIsDragDisabled(false);
    }
  };

  // Filter hierarchy based on search term
  const filteredHierarchy = useMemo(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
      return hierarchy;
    }

    const filterNodes = (nodes: HierarchicalNode[]): HierarchicalNode[] => {
      return nodes.reduce((filtered: HierarchicalNode[], node) => {
        // Check if current node matches search (for products) or if any children match
        const nodeMatches = node.type === 'product' && (
          node.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          (node.trade_name && node.trade_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
        );
        
        let filteredChildren: HierarchicalNode[] = [];
        if (node.children) {
          filteredChildren = filterNodes(node.children);
        }
        
        // Include node if it matches or has matching children
        if (nodeMatches || filteredChildren.length > 0) {
          filtered.push({
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : node.children
          });
        }
        
        return filtered;
      }, []);
    };

    return filterNodes(hierarchy);
  }, [hierarchy, debouncedSearchTerm]);

  // Auto-expand nodes when searching to show results
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
      // Expand all nodes to show search results
      const expandAll = (nodes: HierarchicalNode[]) => {
        const ids = new Set<string>();
        const traverse = (nodeArray: HierarchicalNode[]) => {
          nodeArray.forEach(node => {
            ids.add(node.id);
            if (node.children) {
              traverse(node.children);
            }
          });
        };
        traverse(nodes);
        return ids;
      };
      setExpandedNodes(expandAll(filteredHierarchy));
    }
  }, [debouncedSearchTerm, filteredHierarchy]);

  // Get total matching products count
  const getMatchingProductsCount = useMemo(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return 0;
    
    const countMatches = (nodes: HierarchicalNode[]): number => {
      return nodes.reduce((count, node) => {
        let nodeCount = 0;
        if (node.type === 'product' && 
            node.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) {
          nodeCount = 1;
        }
        if (node.children) {
          nodeCount += countMatches(node.children);
        }
        return count + nodeCount;
      }, 0);
    };
    
    return countMatches(hierarchy);
  }, [hierarchy, debouncedSearchTerm]);

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const getConfigurationStatus = (node: HierarchicalNode) => {
    if (node.hasIndividualConfig) {
      // Show more specific status for products
      if (node.type === 'product') {
        if (node.markets && (node.markets as any[]).length > 0) {
          return <Badge variant="default" className="text-xs">Markets Configured</Badge>;
        } else if (node.name) {
          return <Badge variant="outline" className="text-xs">Platform Assigned</Badge>;
        }
      }
      return <Badge variant="default" className="text-xs">Configured</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Inheriting</Badge>;
  };
  
  // Create a flat list of all nodes for proper indexing - ensure visibility
  const createFlatNodeList = (nodes: HierarchicalNode[], parentDepth = 0): Array<{node: HierarchicalNode, depth: number, globalIndex: number}> => {
    let flatList: Array<{node: HierarchicalNode, depth: number, globalIndex: number}> = [];
    let currentIndex = 0;
    
    const processNodes = (nodeArray: HierarchicalNode[], depth: number) => {
      for (const node of nodeArray) {
        // Always add the node itself
        flatList.push({ node, depth, globalIndex: currentIndex++ });
        
        // If expanded and has children, add them recursively
        if (expandedNodes.has(node.id) && node.children && node.children.length > 0) {
          processNodes(node.children, depth + 1);
        }
      }
    };
    
    processNodes(nodes, parentDepth);
    console.log('[HierarchyTreeView] Created flat list with', flatList.length, 'items for', nodes.length, 'root nodes');
    return flatList;
  };

  const renderNode = (nodeData: {node: HierarchicalNode, depth: number, globalIndex: number}) => {
    const { node, depth, globalIndex } = nodeData;
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const Icon = getNodeIcon(node.type);
    const isSelected = isNodeSelected(node);
    const isPartiallySelected = isNodePartiallySelected(node);
    const draggableId = `${node.type}:${node.id}`;
    
    // Platforms and models are now draggable, products remain draggable
    const isDraggable = ['platform', 'model', 'product'].includes(node.type);
    const isDropTarget = ['category', 'platform', 'model'].includes(node.type);
    
    return (
      <Draggable 
        key={node.id}
        draggableId={draggableId} 
        index={globalIndex}
        isDragDisabled={!isDraggable || isDragDisabled}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`${snapshot.isDragging ? 'z-50 rotate-2 scale-105' : ''}`}
          >
            <div 
              className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200 ${
                snapshot.isDragging 
                  ? 'bg-primary/30 border-2 border-primary shadow-xl' 
                  : isSelected 
                    ? 'bg-primary/10 border border-primary/20' 
                    : isDropTarget
                      ? 'hover:bg-muted/50 hover:shadow-sm border border-transparent hover:border-primary/30'
                      : 'hover:bg-muted/50 hover:shadow-sm border border-transparent'
              }`}
              style={{ marginLeft: `${depth * 20}px` }}
              data-drop-target={isDropTarget ? node.type : undefined}
              data-node-id={node.id}
            >
              {/* Drag Handle - For draggable platforms, models, and products */}
              {isDraggable && (
                <div 
                  {...provided.dragHandleProps} 
                  className="cursor-grab active:cursor-grabbing hover:bg-muted/50 p-1 rounded transition-colors"
                  title={`Drag to move this ${node.type}`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </div>
              )}
              
              {/* Expand/Collapse Button */}
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-muted/70"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(node.id);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <div className="w-6" />
              )}
              
              {/* Selection Checkbox */}
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => handleNodeSelection(node, !!checked)}
                className={isPartiallySelected ? "data-[state=unchecked]:bg-primary/20" : ""}
                onClick={(e) => e.stopPropagation()}
              />
              
              {/* Node Icon */}
              <Icon className="h-4 w-4 text-muted-foreground" />
              
              {/* Node Name */}
              <span className="font-medium flex-1">
                {node.type === 'product' ? (
                  <>
                    {highlightText(node.name, debouncedSearchTerm)}
                    {node.trade_name && node.trade_name !== node.name && (
                      <span className="text-muted-foreground ml-1">
                        ({typeof node.trade_name === 'string' ? node.trade_name : String(node.trade_name)})
                      </span>
                    )}
                  </>
                ) : node.name}
              </span>
              
              {/* Variant Tags - Show for products */}
              {node.type === 'product' && node.variants && node.variants.length > 0 && (
                <div className="ml-2">
                  <VariantTags variants={node.variants} size="sm" />
                </div>
              )}
              
              {/* Drop target indicator */}
              {isDropTarget && (
                <Badge variant="outline" className="text-xs opacity-50">
                  Drop Zone
                </Badge>
              )}
              
              {/* Product Count */}
              <Badge variant="outline" className="text-xs">
                {node.productCount} {node.productCount === 1 ? 'product' : 'products'}
              </Badge>
              
              {/* Configuration Status */}
              {getConfigurationStatus(node)}
              
              {/* Drag indicator when being dragged */}
              {snapshot.isDragging && (
                <div className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded">
                  Moving...
                </div>
              )}
            </div>
          </div>
        )}
      </Draggable>
    );
  };
  
  // Debug logging
  console.log('[HierarchyTreeView] Rendering with:', {
    hierarchyLength: hierarchy.length,
    filteredHierarchyLength: filteredHierarchy.length,
    selectedNodesLength: selectedNodes.length,
    searchTerm: debouncedSearchTerm,
    matchingProducts: getMatchingProductsCount,
    companyId
  });

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Product Hierarchy</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {hierarchy.reduce((total, node) => total + node.productCount, 0)} Products
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    Add New
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setCreationDialogOpen(true)}>
                    <Tag className="h-4 w-4 mr-2" />
                    Device Category
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCreationDialogOpen(true)}>
                    <Layers className="h-4 w-4 mr-2" />
                    Product Platform
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCreationDialogOpen(true)}>
                    <Box className="h-4 w-4 mr-2" />
                    Product Model
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCreationDialogOpen(true)}>
                    <Package className="h-4 w-4 mr-2" />
                    Variation Dimension
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="text-sm font-normal text-muted-foreground">
                {selectedNodes.length} selected
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products by name (e.g., LMGRN)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {debouncedSearchTerm && debouncedSearchTerm.length >= 2 && (
              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Found {getMatchingProductsCount} products matching "{debouncedSearchTerm}"
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectAllFiltered}
                  className="ml-2"
                >
                  Select All {getMatchingProductsCount}
                </Button>
              </div>
            )}
          </div>
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Drag & Drop:</strong> Drag platforms to categories, models to platforms, or products to models/platforms to reorganize your hierarchy. 
              Drop items directly on their target destination (highlighted drop zones will appear).
            </p>
          </div>
          
          {filteredHierarchy.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              {debouncedSearchTerm && debouncedSearchTerm.length >= 2 ? (
                <>
                  <p className="text-muted-foreground mb-2">
                    No products found matching "{debouncedSearchTerm}".
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try a different search term or browse the full hierarchy.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-2">
                    No hierarchy data available.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Create categories, platforms, and products to see the structure here.
                  </p>
                </>
              )}
            </div>
          ) : (
            <Droppable droppableId="hierarchy-root" type="HIERARCHY">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 min-h-[400px] p-4 border rounded-lg transition-colors ${
                    snapshot.isDraggingOver 
                      ? 'border-primary/50 bg-primary/5' 
                      : 'border-border'
                  }`}
                  style={{ 
                    maxHeight: '600px', 
                    overflowY: 'auto',
                    scrollBehavior: 'smooth'
                  }}
                >
                  <div className="space-y-1">
                    {createFlatNodeList(filteredHierarchy).map((nodeData) => renderNode(nodeData))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
          
          {selectedNodes.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                Selected {selectedNodes.length} items affecting{' '}
                {selectedNodes.reduce((total, node) => total + node.productCount, 0)} products
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectionChange([])}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <InlineCreationDialog
        open={creationDialogOpen}
        onOpenChange={setCreationDialogOpen}
        companyId={companyId}
        onSuccess={() => {
          onHierarchyUpdate?.();
        }}
      />
    </DragDropContext>
  );
}