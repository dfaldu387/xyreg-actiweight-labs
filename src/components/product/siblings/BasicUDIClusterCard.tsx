import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  ChevronDown, 
  ChevronRight, 
  Package, 
  Users, 
  Plus,
  Percent,
  CheckSquare,
  Square,
  Pencil,
  Check,
  X,
  UserPlus
} from 'lucide-react';
import { BasicUDICluster } from '@/hooks/useCompanyBasicUDIGroups';
import { SiblingGroupManager } from './SiblingGroupManager';
import { CreateSiblingGroupDialog } from './CreateSiblingGroupDialog';
import { useUpdateBasicUDIGroupName } from '@/hooks/useBasicUDIGroupMutations';
import { useAddSiblingToGroup } from '@/hooks/useSiblingGroups';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductWithBasicUDI } from '@/hooks/useProductsByBasicUDI';

interface BasicUDIClusterCardProps {
  cluster: BasicUDICluster;
  companyId: string;
}

export function BasicUDIClusterCard({ cluster, companyId }: BasicUDIClusterCardProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(cluster.groupName || '');
  
  const updateNameMutation = useUpdateBasicUDIGroupName();
  const addToGroupMutation = useAddSiblingToGroup();

  // Filter to only show truly ungrouped products
  const ungroupedProducts = cluster.products.filter(
    product => !cluster.groupedProductIds.has(product.id)
  );
  
  const completionPercentage = cluster.totalCount > 0 
    ? Math.round((cluster.groupedCount / cluster.totalCount) * 100)
    : 0;

  const getCompletionColor = () => {
    if (completionPercentage === 100) return 'text-green-600 bg-green-50 border-green-200';
    if (completionPercentage >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === ungroupedProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(ungroupedProducts.map(p => p.id)));
    }
  };

  const handleCreateGroup = () => {
    setShowCreateGroup(true);
  };

  const handleGroupCreated = () => {
    setSelectedProducts(new Set());
    setShowCreateGroup(false);
  };

  const handleSaveName = async () => {
    if (editedName.trim()) {
      await updateNameMutation.mutateAsync({
        groupId: cluster.groupId,
        basicUdiDi: cluster.basicUDI,
        companyId,
        name: editedName.trim(),
      });
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditedName(cluster.groupName || '');
    setIsEditingName(false);
  };

  const handleAddToGroup = async (productId: string, groupId: string) => {
    await addToGroupMutation.mutateAsync({
      siblingId: productId,
      groupId: groupId,
      percentage: 0,
      position: 999, // Will be reordered by user
    });
  };

  return (
    <>
      <Card className="border-2 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-6 w-6 p-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                
                <div className="flex-1 min-w-0">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="Enter group name..."
                        className="h-8 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSaveName}
                        className="h-7 w-7 p-0"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {cluster.groupName ? (
                        <CardTitle className="text-base">{cluster.groupName}</CardTitle>
                      ) : (
                        <CardTitle className="text-base text-muted-foreground italic">
                          Unnamed Group
                        </CardTitle>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingName(true)}
                        className="h-6 w-6 p-0"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <div className="text-xs font-mono text-muted-foreground mt-1">
                    {cluster.basicUDI}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 ml-8">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>{cluster.totalCount} product{cluster.totalCount !== 1 ? 's' : ''}</span>
                </div>
                
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{cluster.siblingGroups.length} group{cluster.siblingGroups.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge 
                variant="outline" 
                className={`${getCompletionColor()} font-semibold px-3 py-1`}
              >
                <Percent className="h-3 w-3 mr-1" />
                {completionPercentage}% Grouped
              </Badge>
              
              {cluster.ungroupedCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {cluster.ungroupedCount} ungrouped
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0 space-y-4">
            {/* Sibling Groups */}
            {cluster.siblingGroups.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    Sibling Groups
                  </h4>
                </div>
                
                <SiblingGroupManager
                  companyId={companyId}
                  basicUdiDi={cluster.basicUDI}
                />
              </div>
            )}

            {/* Ungrouped Products */}
            {cluster.ungroupedCount > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">
                      Ungrouped Products
                    </h4>
                    {selectedProducts.size > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedProducts.size} selected
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={toggleSelectAll}
                      className="h-7 text-xs"
                    >
                      {selectedProducts.size === ungroupedProducts.length ? (
                        <>
                          <CheckSquare className="h-3 w-3 mr-1" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <Square className="h-3 w-3 mr-1" />
                          Select All
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCreateGroup}
                      disabled={selectedProducts.size === 0}
                      className="h-7 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create Group ({selectedProducts.size})
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {ungroupedProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`flex items-center gap-2 p-2 rounded-md border transition-colors ${
                        selectedProducts.has(product.id)
                          ? 'bg-primary/10 border-primary'
                          : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div 
                          className="text-sm font-medium truncate cursor-pointer hover:text-primary hover:underline transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/app/product/${product.id}/device-information`);
                          }}
                        >
                          {product.name}
                        </div>
                        {product.trade_name && (
                          <div className="text-xs text-muted-foreground truncate">
                            {product.trade_name}
                          </div>
                        )}
                      </div>
                      
                      {/* Add to Group dropdown */}
                      {cluster.siblingGroups.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 flex-shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {cluster.siblingGroups.map((group) => (
                              <DropdownMenuItem
                                key={group.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToGroup(product.id, group.id);
                                }}
                              >
                                Add to {group.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action if no groups exist */}
            {cluster.siblingGroups.length === 0 && (
              <div className="text-center py-6 border rounded-lg bg-muted/20">
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  No sibling groups created yet
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowCreateGroup(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Group
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <CreateSiblingGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        companyId={companyId}
        basicUdiDi={cluster.basicUDI}
        availableProducts={ungroupedProducts}
        preSelectedProductIds={Array.from(selectedProducts)}
        onSuccess={handleGroupCreated}
      />
    </>
  );
}
