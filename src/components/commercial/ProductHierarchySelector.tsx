import React, { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, ChevronDown, Package, Tag, Layers, Box, Search, CheckSquare, Square } from 'lucide-react';
import { HierarchicalNode, HierarchicalBulkService } from "@/services/hierarchicalBulkService";
import { useDebounce } from "@/hooks/useDebounce";

interface ProductHierarchySelectorProps {
  companyId: string;
  selectedProductIds: string[];
  onSelectionChange: (productIds: string[]) => void;
  excludeProductId?: string; // Product to exclude from selection (e.g., main product)
}

export function ProductHierarchySelector({ 
  companyId, 
  selectedProductIds, 
  onSelectionChange, 
  excludeProductId 
}: ProductHierarchySelectorProps) {
  const [hierarchy, setHierarchy] = useState<HierarchicalNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    loadHierarchy();
  }, [companyId]);

  useEffect(() => {
    // Auto-expand top level categories and their immediate children (platforms) when hierarchy loads
    if (hierarchy.length > 0) {
      const autoExpandNodes = new Set<string>();
      
      // Expand top-level categories
      hierarchy.forEach(categoryNode => {
        autoExpandNodes.add(categoryNode.id);
        
        // Also expand platforms within categories to show models
        if (categoryNode.children) {
          categoryNode.children.forEach(platformNode => {
            if (platformNode.type === 'platform') {
              autoExpandNodes.add(platformNode.id);
            }
          });
        }
      });
      
      setExpandedNodes(autoExpandNodes);
    }
  }, [hierarchy]);

  const loadHierarchy = async () => {
    try {
      setLoading(true);
      const data = await HierarchicalBulkService.getCompanyHierarchy(companyId);
      setHierarchy(data);
    } catch (error) {
      console.error('Failed to load hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleProductSelection = (productId: string, checked: boolean) => {
    const newSelection = [...selectedProductIds];
    if (checked) {
      if (!newSelection.includes(productId)) {
        newSelection.push(productId);
      }
    } else {
      const index = newSelection.indexOf(productId);
      if (index !== -1) {
        newSelection.splice(index, 1);
      }
    }
    onSelectionChange(newSelection);
  };

  const getAllProductIdsInNode = (node: HierarchicalNode): string[] => {
    const productIds: string[] = [];
    
    if (node.type === 'product' && node.id !== excludeProductId) {
      productIds.push(node.id);
    }
    
    if (node.children) {
      node.children.forEach(child => {
        productIds.push(...getAllProductIdsInNode(child));
      });
    }
    
    return productIds;
  };

  const handleBulkSelection = (node: HierarchicalNode, selectAll: boolean) => {
    const nodeProductIds = getAllProductIdsInNode(node);
    const newSelection = [...selectedProductIds];
    
    if (selectAll) {
      // Add all products from this node that aren't already selected
      nodeProductIds.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
    } else {
      // Remove all products from this node
      nodeProductIds.forEach(id => {
        const index = newSelection.indexOf(id);
        if (index !== -1) {
          newSelection.splice(index, 1);
        }
      });
    }
    
    onSelectionChange(newSelection);
  };

  const getNodeSelectionState = (node: HierarchicalNode): 'none' | 'partial' | 'all' => {
    const nodeProductIds = getAllProductIdsInNode(node);
    if (nodeProductIds.length === 0) return 'none';
    
    const selectedCount = nodeProductIds.filter(id => selectedProductIds.includes(id)).length;
    
    if (selectedCount === 0) return 'none';
    if (selectedCount === nodeProductIds.length) return 'all';
    return 'partial';
  };

  const getNodeIcon = (type: HierarchicalNode['type']) => {
    switch (type) {
      case 'category': return Tag;
      case 'platform': return Layers;
      case 'model': return Box;
      case 'product': return Package;
    }
  };

  const isFiltered = (node: HierarchicalNode): boolean => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return true;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    
    // For products, check name and trade name match
    if (node.type === 'product') {
      const nameMatch = node.name.toLowerCase().includes(searchLower);
      const tradeNameMatch = node.trade_name?.toLowerCase().includes(searchLower);
      return nameMatch || tradeNameMatch || false;
    }
    
    // For other nodes (category, platform, model), check the node name and if they have matching children
    const nodeNameMatch = node.name.toLowerCase().includes(searchLower);
    
    if (node.children) {
      const hasMatchingChildren = node.children.some(child => isFiltered(child));
      return nodeNameMatch || hasMatchingChildren;
    }
    
    return nodeNameMatch;
  };

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

  const renderNode = (node: HierarchicalNode, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const Icon = getNodeIcon(node.type);
    const isExcluded = excludeProductId === node.id;
    const isSelected = selectedProductIds.includes(node.id);
    
    // Filter logic
    if (!isFiltered(node)) {
      return null;
    }

    // For products, show checkbox and name with trade name
    if (node.type === 'product') {
      if (isExcluded) return null; // Don't show excluded product
      
      return (
        <div 
          key={node.id} 
          className="flex items-center space-x-2 py-1"
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <Checkbox
            id={`product-${node.id}`}
            checked={isSelected}
            onCheckedChange={(checked) => handleProductSelection(node.id, checked as boolean)}
          />
          <Icon className="h-4 w-4 text-blue-600" />
          <label 
            htmlFor={`product-${node.id}`}
            className="text-sm cursor-pointer flex-1"
          >
            {highlightText(node.name, debouncedSearchTerm)}
            {node.trade_name && (
              <span className="text-muted-foreground"> ({node.trade_name})</span>
            )}
          </label>
        </div>
      );
    }

    // For categories, platforms, models - show as collapsible containers with bulk selection
    const selectionState = getNodeSelectionState(node);
    const nodeProductCount = getAllProductIdsInNode(node).length;
    
    return (
      <div key={node.id} style={{ marginLeft: `${depth * 16}px` }}>
        <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(node.id)}>
          <div className="flex items-center gap-2 py-1 hover:bg-muted/50 rounded px-2">
            <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )
              ) : (
                <div className="w-4" />
              )}
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{node.name}</span>
              {hasChildren && (
                <span className="text-xs text-muted-foreground ml-auto">
                  ({node.children.filter(child => isFiltered(child)).length})
                </span>
              )}
            </CollapsibleTrigger>
            
            {/* Bulk selection controls for nodes with products */}
            {nodeProductCount > 0 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBulkSelection(node, selectionState !== 'all');
                  }}
                >
                  {selectionState === 'all' ? (
                    <CheckSquare className="h-3 w-3 mr-1" />
                  ) : selectionState === 'partial' ? (
                    <Square className="h-3 w-3 mr-1 opacity-50" />
                  ) : (
                    <Square className="h-3 w-3 mr-1" />
                  )}
                  {selectionState === 'all' ? 'Unselect All' : 'Select All'}
                </Button>
              </div>
            )}
          </div>
          <CollapsibleContent>
            {hasChildren && node.children.map(child => renderNode(child, depth + 1))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-muted-foreground">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Hierarchy */}
      <div className="border rounded-md p-2 max-h-[400px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'hsl(var(--muted-foreground) / 0.3) transparent'
        }}
      >
        {hierarchy.length > 0 ? (
          hierarchy.map(node => renderNode(node))
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No products found
          </div>
        )}
      </div>

      {/* Selection summary */}
      {selectedProductIds.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {selectedProductIds.length} product(s) selected
        </p>
      )}
    </div>
  );
}