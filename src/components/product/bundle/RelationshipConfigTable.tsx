import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Package, HelpCircle, ChevronDown, ChevronRight, BarChart3, Edit, Users, Link2 } from 'lucide-react';
import type { BundleProduct } from './BundleBuildTab';
import { BundleGroupDistributionViewer } from './BundleGroupDistributionViewer';
import { EditGroupDistributionDialog } from './EditGroupDistributionDialog';
import { CreateDistributionGroupDialog } from './CreateDistributionGroupDialog';
import { DistributionPattern } from '@/types/siblingGroup';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { getDistributionGroups, suggestDistributionGroups } from '@/utils/bundleDistributionValidation';

interface RelationshipConfigTableProps {
  bundleProducts: BundleProduct[];
  onRemoveProduct: (productId: string) => void;
  onUpdateRelationship: (
    productId: string,
    relationshipType: BundleProduct['relationshipType'],
    multiplier: number,
    consumptionRate?: number,
    consumptionPeriod?: 'per_use' | 'per_procedure' | 'per_day' | 'per_week' | 'per_month' | 'per_year'
  ) => void;
  onUpdateAttachmentRate?: (productId: string, rate: number) => void;
  onUpdateDistributionGroup?: (productId: string, groupId: string | null, rate: number) => void;
}

const relationshipTypeLabels: Record<BundleProduct['relationshipType'], string> = {
  component: 'Component',
  accessory: 'Accessory',
  consumable: 'Consumable',
  required: 'Required',
  optional: 'Optional',
  replacement_part: 'Replacement Part',
};

export function RelationshipConfigTable({
  bundleProducts,
  onRemoveProduct,
  onUpdateRelationship,
  onUpdateAttachmentRate,
  onUpdateDistributionGroup
}: RelationshipConfigTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [distributionDialogOpen, setDistributionDialogOpen] = useState(false);
  const [editDistributionDialogOpen, setEditDistributionDialogOpen] = useState(false);
  const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
  const [selectedGroupForDistribution, setSelectedGroupForDistribution] = useState<BundleProduct | null>(null);
  const [selectedForGrouping, setSelectedForGrouping] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const allDistributionGroups = getDistributionGroups(
    bundleProducts.map(bp => ({
      id: bp.relationshipId || bp.product.id,
      bundle_id: '',
      relationship_type: bp.relationshipType,
      attachment_rate: bp.attachmentRate,
      distribution_group_id: bp.distributionGroupId,
      is_primary: false,
      position: 0,
      created_at: '',
    }))
  );

  // Create simple group name mapping (A, B, C, etc.)
  const uniqueGroupIds = Array.from(new Set(allDistributionGroups.map(g => g.groupId)));
  const groupNameMap = new Map(
    uniqueGroupIds.map((id, index) => [
      id, 
      String.fromCharCode(65 + index) // A, B, C, etc.
    ])
  );

  const getGroupLabel = (groupId: string | undefined) => {
    if (!groupId) return null;
    return groupNameMap.get(groupId) || groupId;
  };

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

  const handleViewDistribution = (bundleProduct: BundleProduct) => {
    setSelectedGroupForDistribution(bundleProduct);
    setDistributionDialogOpen(true);
  };

  const handleEditDistribution = (bundleProduct: BundleProduct) => {
    setSelectedGroupForDistribution(bundleProduct);
    setEditDistributionDialogOpen(true);
  };

  const handleToggleSelection = (productId: string) => {
    setSelectedForGrouping(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleCreateDistributionGroup = () => {
    const selected = bundleProducts.filter(bp => selectedForGrouping.has(bp.product.id));
    if (selected.length < 2) {
      return;
    }
    setCreateGroupDialogOpen(true);
  };

  const handleGroupCreated = (groupId: string, memberRates: { memberId: string; rate: number }[]) => {
    if (!onUpdateDistributionGroup) return;
    
    memberRates.forEach(({ memberId, rate }) => {
      onUpdateDistributionGroup(memberId, groupId, rate);
    });
    
    setSelectedForGrouping(new Set());
    setIsMultiSelectMode(false);
  };

  const handleToggleMultiSelect = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedForGrouping(new Set());
  };

  const suggestions = suggestDistributionGroups(
    bundleProducts
      .filter(bp => !bp.distributionGroupId)
      .map(bp => ({
        id: bp.relationshipId || bp.product.id,
        bundle_id: '',
        relationship_type: bp.relationshipType,
        attachment_rate: bp.attachmentRate,
        distribution_group_id: bp.distributionGroupId,
        is_primary: false,
        position: 0,
        created_at: '',
      }))
  );

  if (bundleProducts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg">
        <p className="text-sm">No products added to bundle yet</p>
        <p className="text-xs mt-1">Add products using the selector above</p>
      </div>
    );
  }

  return (
    <>
      {/* Multi-select toolbar */}
      {(suggestions.length > 0 || isMultiSelectMode) && (
        <div className="mb-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="font-semibold text-sm">Distribution Groups</span>
            </div>
            <Button
              variant={isMultiSelectMode ? "default" : "outline"}
              size="sm"
              onClick={handleToggleMultiSelect}
            >
              {isMultiSelectMode ? 'Cancel' : 'Create Group'}
            </Button>
          </div>
          
          {isMultiSelectMode ? (
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Select 2 or more items to group together. They will compete for distribution.
              </p>
              {selectedForGrouping.size >= 2 && (
                <Button size="sm" onClick={handleCreateDistributionGroup} className="mt-2">
                  <Link2 className="h-3 w-3 mr-2" />
                  Create Group ({selectedForGrouping.size} selected)
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {suggestions.length > 0 && `${suggestions.length} relationship type(s) with multiple items. `}
              Click "Create Group" to define distribution percentages.
            </p>
          )}
          
          {/* Show existing groups */}
          {allDistributionGroups.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-xs font-semibold">Existing Groups:</div>
              {allDistributionGroups.map((group, index) => (
                <div key={`${group.groupId}_${group.relationshipType}`} className="text-xs p-2 bg-background border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-semibold">
                      Group {String.fromCharCode(65 + index)}
                    </Badge>
                    <span className="text-muted-foreground">
                      {group.members.length} items ({group.relationshipType})
                    </span>
                    <span className={group.totalRate === 100 ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>
                      {Math.round(group.totalRate)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>Relationship Type</TableHead>
            <TableHead className="w-32">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help">
                      Quantity
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-1">For non-consumables:</p>
                    <p className="text-xs mb-2">How many units are included (e.g., 2 cables)</p>
                    <p className="font-semibold mb-1">For consumables:</p>
                    <p className="text-xs">Quantity used per single use/procedure (e.g., 1 electrode per use)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead className="w-56">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help">
                      Usage Frequency
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-1">For consumables only:</p>
                    <p className="text-xs">How often the consumable is used (e.g., 2 times per week)</p>
                    <p className="text-xs mt-2"><strong>Total consumption</strong> = Quantity × Frequency</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead className="w-24">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help">
                      Distribution %
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">Percentage allocation for items in distribution groups</p>
                    <p className="text-xs mt-1">Items in the same group compete and must sum to 100%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead className="w-16"></TableHead>
            {isMultiSelectMode && <TableHead className="w-16">Select</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bundleProducts.map((bundleProduct) => {
            const isExpanded = bundleProduct.isVariantGroup && expandedGroups.has(bundleProduct.variantGroupId!);
            
            return (
              <TableRow key={bundleProduct.isVariantGroup ? bundleProduct.variantGroupId : bundleProduct.product.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {bundleProduct.distributionGroupId && (
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {getGroupLabel(bundleProduct.distributionGroupId)}
                      </Badge>
                    )}
                    <div className="flex items-center gap-2">
                      {bundleProduct.isVariantGroup && (
                        <Collapsible
                          open={isExpanded}
                          onOpenChange={() => toggleGroup(bundleProduct.variantGroupId!)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </Collapsible>
                      )}
                      {bundleProduct.isVariantGroup && (
                        <Package className="h-4 w-4 text-primary" />
                      )}
                      <div className="font-medium">
                        {bundleProduct.isVariantGroup 
                          ? bundleProduct.variantGroupName || bundleProduct.product.name
                          : bundleProduct.product.tradeName || bundleProduct.product.name}
                      </div>
                      {bundleProduct.product.tradeName && !bundleProduct.isVariantGroup && (
                        <span className="text-xs text-muted-foreground">({bundleProduct.product.name})</span>
                      )}
                      {bundleProduct.isVariantGroup && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Group
                        </span>
                      )}
                      {bundleProduct.distributionGroupId && bundleProduct.attachmentRate !== undefined && (
                        <Badge variant="outline" className="text-xs font-semibold text-primary">
                          {Math.round(bundleProduct.attachmentRate)}%
                        </Badge>
                      )}
                      {/* Quantity indicator for non-consumables */}
                      {bundleProduct.relationshipType !== 'consumable' && bundleProduct.multiplier > 1 && (
                        <span className="text-xs font-semibold text-primary">
                          Qty: {bundleProduct.multiplier}
                        </span>
                      )}
                    </div>
                    
                    {bundleProduct.isVariantGroup && (
                      <Collapsible
                        open={isExpanded}
                        onOpenChange={() => toggleGroup(bundleProduct.variantGroupId!)}
                      >
                        <div className="text-xs text-muted-foreground mt-1 ml-6">
                          <span className="font-medium">{bundleProduct.variantCount}</span> variants included
                        </div>
                        
                        <CollapsibleContent className="ml-6 mt-2 space-y-2">
                          {bundleProduct.variantProducts && bundleProduct.variantProducts.length > 0 && (
                            <>
                              <div className="space-y-1 border-l-2 border-primary/20 pl-3">
                                {bundleProduct.variantProducts.map((product: any) => (
                                  <div key={product.id} className="flex items-start gap-2 text-xs py-1">
                                    <Package className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium">
                                          {product.trade_name || product.name}
                                        </div>
                                        {product.trade_name && (
                                          <div className="text-muted-foreground">
                                            ({product.name})
                                          </div>
                                        )}
                                        {product.description && (
                                          <div className="text-muted-foreground truncate">
                                            {product.description}
                                          </div>
                                        )}
                                      </div>
                                      {product.percentage != null && (
                                        <span className="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                                          {product.percentage}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDistribution(bundleProduct);
                                  }}
                                  className="flex-1"
                                >
                                  <BarChart3 className="h-3 w-3 mr-2" />
                                  View
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditDistribution(bundleProduct);
                                  }}
                                  className="flex-1"
                                >
                                  <Edit className="h-3 w-3 mr-2" />
                                  Edit Distribution
                                </Button>
                              </div>
                            </>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                    
                    {bundleProduct.product.description && !bundleProduct.isVariantGroup && (
                      <div className="text-xs text-muted-foreground truncate max-w-xs mt-1">
                        {bundleProduct.product.description}
                      </div>
                    )}
                  {/* Consumption calculation for consumables */}
                  {bundleProduct.relationshipType === 'consumable' && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded cursor-help">
                              Qty: {bundleProduct.multiplier}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Quantity per use</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {bundleProduct.consumptionRate && bundleProduct.consumptionPeriod && (
                        <>
                          <span className="text-xs text-muted-foreground">×</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 cursor-help">
                                  {bundleProduct.consumptionRate} {bundleProduct.consumptionPeriod.replace('per_', '/')}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Usage frequency</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span className="text-xs text-muted-foreground">=</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded cursor-help">
                                  {(bundleProduct.multiplier * bundleProduct.consumptionRate).toFixed(1)} {bundleProduct.consumptionPeriod.replace('per_', '/')}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs font-semibold">Total consumption per period</p>
                                <p className="text-xs mt-1">Qty per use × Usage frequency</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Select
                  value={bundleProduct.relationshipType}
                  onValueChange={(value) =>
                    onUpdateRelationship(
                      bundleProduct.product.id,
                      value as BundleProduct['relationshipType'],
                      bundleProduct.multiplier,
                      bundleProduct.consumptionRate,
                      bundleProduct.consumptionPeriod
                    )
                  }
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-background">
                    {Object.entries(relationshipTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="1"
                  value={bundleProduct.multiplier}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    onUpdateRelationship(
                      bundleProduct.product.id,
                      bundleProduct.relationshipType,
                      Math.max(1, value),
                      bundleProduct.consumptionRate,
                      bundleProduct.consumptionPeriod
                    );
                  }}
                  className="w-20"
                />
              </TableCell>
              <TableCell>
                {bundleProduct.relationshipType === 'consumable' ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={bundleProduct.consumptionRate || ''}
                      onChange={(e) => {
                        const rate = parseInt(e.target.value) || undefined;
                        onUpdateRelationship(
                          bundleProduct.product.id,
                          bundleProduct.relationshipType,
                          bundleProduct.multiplier,
                          rate,
                          bundleProduct.consumptionPeriod
                        );
                      }}
                      placeholder="Rate"
                      className="w-20"
                    />
                    <Select
                      value={bundleProduct.consumptionPeriod || ''}
                      onValueChange={(value: any) =>
                        onUpdateRelationship(
                          bundleProduct.product.id,
                          bundleProduct.relationshipType,
                          bundleProduct.multiplier,
                          bundleProduct.consumptionRate,
                          value
                        )
                      }
                    >
                      <SelectTrigger className="w-32 bg-background">
                        <SelectValue placeholder="Period" />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-background">
                        <SelectItem value="per_use">Per Use</SelectItem>
                        <SelectItem value="per_procedure">Per Procedure</SelectItem>
                        <SelectItem value="per_day">Per Day</SelectItem>
                        <SelectItem value="per_week">Per Week</SelectItem>
                        <SelectItem value="per_month">Per Month</SelectItem>
                        <SelectItem value="per_year">Per Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={bundleProduct.attachmentRate || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (onUpdateAttachmentRate && !isNaN(value) && value >= 0 && value <= 100) {
                      onUpdateAttachmentRate(bundleProduct.product.id, value);
                    } else if (onUpdateAttachmentRate && e.target.value === '') {
                      onUpdateAttachmentRate(bundleProduct.product.id, 0);
                    }
                  }}
                  placeholder="0"
                  className="w-20"
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveProduct(bundleProduct.product.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TableCell>
              {isMultiSelectMode && !bundleProduct.distributionGroupId && (
                <TableCell>
                  <Checkbox
                    checked={selectedForGrouping.has(bundleProduct.product.id)}
                    onCheckedChange={() => handleToggleSelection(bundleProduct.product.id)}
                  />
                </TableCell>
              )}
              {isMultiSelectMode && bundleProduct.distributionGroupId && (
                <TableCell>
                  <span className="text-xs text-muted-foreground">Grouped</span>
                </TableCell>
              )}
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>

    {/* Distribution Viewer Dialog (Read-only) */}
    <Dialog open={distributionDialogOpen} onOpenChange={setDistributionDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Group Distribution</DialogTitle>
          <DialogDescription>
            View how variants are distributed within {selectedGroupForDistribution?.variantGroupName}
          </DialogDescription>
        </DialogHeader>
        {selectedGroupForDistribution?.variantProducts && (
          <BundleGroupDistributionViewer
            groupName={selectedGroupForDistribution.variantGroupName || ''}
            distributionPattern={(selectedGroupForDistribution as any).distributionPattern || 'even'}
            products={selectedGroupForDistribution.variantProducts.map((p: any) => ({
              id: p.id,
              name: p.name,
              trade_name: p.trade_name,
              percentage: p.percentage || 0,
              position: p.position || 0,
            }))}
            totalPercentage={selectedGroupForDistribution.variantProducts.reduce((sum: number, p: any) => sum + (p.percentage || 0), 0)}
          />
        )}
      </DialogContent>
    </Dialog>

    {/* Distribution Editor Dialog */}
    {selectedGroupForDistribution?.isVariantGroup && (
      <EditGroupDistributionDialog
        open={editDistributionDialogOpen}
        onOpenChange={(open) => {
          setEditDistributionDialogOpen(open);
          if (!open) {
            // Clear selected group when dialog closes to ensure fresh data on next open
            setSelectedGroupForDistribution(null);
          }
        }}
        groupId={selectedGroupForDistribution.variantGroupId || ''}
        groupName={selectedGroupForDistribution.variantGroupName || ''}
        distributionPattern={(selectedGroupForDistribution as any).distributionPattern || 'even'}
        products={(selectedGroupForDistribution.variantProducts || []).map((p: any, index: number) => ({
          id: p.id,
          name: p.name,
          trade_name: p.trade_name,
          percentage: p.percentage || 0,
          position: p.position || index,
          assignmentId: p.assignmentId || '',
        }))}
        totalPercentage={selectedGroupForDistribution.variantProducts?.reduce((sum: number, p: any) => sum + (p.percentage || 0), 0) || 100}
      />
    )}

    {/* Create Distribution Group Dialog */}
    <CreateDistributionGroupDialog
      open={createGroupDialogOpen}
      onOpenChange={setCreateGroupDialogOpen}
      selectedMembers={bundleProducts.filter(bp => selectedForGrouping.has(bp.product.id))}
      onCreateGroup={handleGroupCreated}
    />
  </>
  );
}
