import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Folders, Package, Search, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSiblingGroups, useCreateSiblingGroup, useUpdateSiblingGroup, useDeleteSiblingGroup, useAddSiblingToGroup } from "@/hooks/useSiblingGroups";
import { useProductsByBasicUDI } from "@/hooks/useProductsByBasicUDI";
import { SiblingGroupCard } from "./SiblingGroupCard";
import { DistributionPattern } from "@/types/siblingGroup";
import type { SiblingInGroup } from "./SiblingGroupCard";
import { useTranslation } from '@/hooks/useTranslation';

interface ProductVariantManagerProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function ProductVariantManager({ productId, companyId, disabled = false }: ProductVariantManagerProps) {
  const { lang } = useTranslation();

  // Fetch current product data to get its basic_udi_di
  const { data: currentProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, basic_udi_di')
        .eq('id', productId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const { siblings } = useProductsByBasicUDI(companyId, currentProduct?.basic_udi_di);
  const { data: siblingGroups } = useSiblingGroups(currentProduct?.basic_udi_di);
  const createSiblingGroupMutation = useCreateSiblingGroup();
  const updateSiblingGroupMutation = useUpdateSiblingGroup();
  const deleteSiblingGroupMutation = useDeleteSiblingGroup();
  const addSiblingToGroupMutation = useAddSiblingToGroup();

  const [selectedSiblingIds, setSelectedSiblingIds] = useState<string[]>([]);
  const [showSiblingGroupDialog, setShowSiblingGroupDialog] = useState(false);
  const [showAddToExistingDialog, setShowAddToExistingDialog] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [siblingGroupName, setSiblingGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreateSiblingGroup = async () => {
    if (disabled) return;
    if (!siblingGroupName.trim() || !currentProduct?.basic_udi_di) {
      toast.error(lang('variantManager.toast.enterGroupName'));
      return;
    }

    if (selectedSiblingIds.length === 0) {
      toast.error(lang('variantManager.toast.selectProduct'));
      return;
    }

    try {
      // Get highest position number across all groups
      const positions = (siblingGroups || []).map(g => g.position || 0);
      const maxPosition = positions.length > 0 ? Math.max(...positions) : -1;
      
      // Create the group
      const newGroup = await createSiblingGroupMutation.mutateAsync({
        basic_udi_di: currentProduct.basic_udi_di,
        company_id: companyId,
        name: siblingGroupName.trim(),
        distribution_pattern: 'even' as DistributionPattern,
        position: maxPosition + 1,
      });

      // Add selected products to the group with even distribution
      const percentage = Math.floor(100 / selectedSiblingIds.length);
      await Promise.all(
        selectedSiblingIds.map((siblingId, index) =>
          addSiblingToGroupMutation.mutateAsync({
            siblingId,
            groupId: newGroup.id,
            percentage,
            position: index,
          })
        )
      );

      // Reset form
      setShowSiblingGroupDialog(false);
      setSiblingGroupName('');
      setSelectedSiblingIds([]);
      toast.success(lang('variantManager.toast.groupCreated'));
    } catch (error) {
      console.error('Error creating sibling group:', error);
      toast.error(lang('variantManager.toast.groupCreateFailed'));
    }
  };

  const handleDeleteSiblingGroup = (groupId: string) => {
    if (disabled || !currentProduct?.basic_udi_di) return;
    
    deleteSiblingGroupMutation.mutate({
      id: groupId,
      basicUdiDi: currentProduct.basic_udi_di,
      companyId,
    });
  };

  const handleUpdateDistributionPattern = (groupId: string, pattern: DistributionPattern) => {
    if (disabled || !currentProduct?.basic_udi_di) return;
    
    updateSiblingGroupMutation.mutate({
      id: groupId,
      basicUdiDi: currentProduct.basic_udi_di,
      companyId,
      data: { distribution_pattern: pattern },
    });
  };

  const handleAddToExistingGroup = async () => {
    if (disabled) return;
    if (!selectedGroupId || selectedSiblingIds.length === 0) {
      toast.error(lang('variantManager.toast.selectGroupAndProducts'));
      return;
    }

    try {
      // Get the selected group
      const group = siblingGroups?.find(g => g.id === selectedGroupId);
      if (!group) {
        toast.error(lang('variantManager.toast.groupNotFound'));
        return;
      }

      // Get current assignments in the group
      const existingAssignments = group.product_sibling_assignments || [];
      const maxPosition = existingAssignments.length > 0
        ? Math.max(...existingAssignments.map(a => a.position || 0))
        : -1;

      // Calculate percentage (even distribution for now)
      const totalProducts = existingAssignments.length + selectedSiblingIds.length;
      const percentage = Math.floor(100 / totalProducts);

      // Add selected products to the group
      await Promise.all(
        selectedSiblingIds.map((siblingId, index) =>
          addSiblingToGroupMutation.mutateAsync({
            siblingId,
            groupId: selectedGroupId,
            percentage,
            position: maxPosition + 1 + index,
          })
        )
      );

      // Reset form
      setShowAddToExistingDialog(false);
      setSelectedGroupId('');
      setSelectedSiblingIds([]);
      toast.success(lang('variantManager.toast.addedToGroup').replace('{count}', String(selectedSiblingIds.length)));
    } catch (error) {
      console.error('Error adding to group:', error);
      toast.error(lang('variantManager.toast.addToGroupFailed'));
    }
  };

  const handleToggleSiblingSelection = (siblingId: string) => {
    setSelectedSiblingIds((prev) =>
      prev.includes(siblingId)
        ? prev.filter((id) => id !== siblingId)
        : [...prev, siblingId]
    );
  };

  // Check if current product has a Basic UDI-DI
  if (!currentProduct?.basic_udi_di) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folders className="h-5 w-5" />
            {lang('variantManager.title')}
          </CardTitle>
          <CardDescription>
            {lang('variantManager.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-muted-foreground border rounded-lg">
            {lang('variantManager.needsBasicUdi')}
            <br />
            {lang('variantManager.addBasicUdiHint')}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if there are siblings
  if (siblings.length <= 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folders className="h-5 w-5" />
            {lang('variantManager.title')}
          </CardTitle>
          <CardDescription>
            {lang('variantManager.descriptionFull')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-muted-foreground border rounded-lg">
            {lang('variantManager.onlyProductWithUdi')}
            <br />
            <strong className="text-foreground">{currentProduct.basic_udi_di}</strong>
            <br />
            <br />
            {lang('variantManager.noSiblings')}
            <br />
            {lang('variantManager.createMoreProducts')}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get siblings not in any group
  const siblingsInGroups = new Set(
    (siblingGroups || []).flatMap(group =>
      group.product_sibling_assignments?.map(a => a.product_id) || []
    )
  );
  
  const unassignedSiblings = siblings.filter(s => !siblingsInGroups.has(s.id));
  
  // Filter siblings based on search
  const filteredSiblings = siblings.filter(sibling => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      sibling.name.toLowerCase().includes(search) ||
      sibling.trade_name?.toLowerCase().includes(search) ||
      sibling.udi_di?.toLowerCase().includes(search)
    );
  });

  const handleToggleAllSiblings = () => {
    if (selectedSiblingIds.length === unassignedSiblings.length) {
      setSelectedSiblingIds([]);
    } else {
      setSelectedSiblingIds(unassignedSiblings.map(s => s.id));
    }
  };

  const selectedCount = selectedSiblingIds.length;
  const hasSelection = selectedCount > 0;

  return (
    <div className={disabled ? 'opacity-60 pointer-events-none' : ''}>
      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* LEFT COLUMN: Sibling Products (Same Device Family) */}
        <Card className="border-2 border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle>{lang('variantManager.siblingProducts')}</CardTitle>
              <Badge variant="secondary">{siblings.length} {lang('variantManager.products')}</Badge>
            </div>
            <CardDescription>
              Basic UDI-DI: <strong className="text-foreground">{currentProduct.basic_udi_di}</strong>
              <br />
              {lang('variantManager.siblingProductsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={lang('variantManager.searchProducts')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Select All */}
            {unassignedSiblings.length > 0 && (
              <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                <Checkbox
                  checked={selectedSiblingIds.length === unassignedSiblings.length && unassignedSiblings.length > 0}
                  onCheckedChange={handleToggleAllSiblings}
                />
                <span className="text-sm font-medium">
                  {lang('variantManager.selectAll').replace('{count}', String(unassignedSiblings.length))}
                </span>
              </div>
            )}

            {/* Product List */}
            <div className="border rounded-lg max-h-[400px] overflow-y-auto">
              {filteredSiblings.map((sibling) => {
                const isInGroup = siblingsInGroups.has(sibling.id);
                const isSelected = selectedSiblingIds.includes(sibling.id);
                
                return (
                  <div
                    key={sibling.id}
                    className={`flex items-center gap-3 p-3 border-b last:border-b-0 ${
                      isInGroup 
                        ? 'bg-muted/30 opacity-60' 
                        : 'hover:bg-muted cursor-pointer'
                    }`}
                    onClick={() => !isInGroup && handleToggleSiblingSelection(sibling.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isInGroup}
                      onCheckedChange={() => handleToggleSiblingSelection(sibling.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {sibling.name}
                        {isInGroup && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {lang('variantManager.inGroup')}
                          </Badge>
                        )}
                      </div>
                      {sibling.trade_name && (
                        <div className="text-xs text-muted-foreground truncate">
                          {lang('variantManager.trade')}: {sibling.trade_name}
                        </div>
                      )}
                      {sibling.udi_di && (
                        <div className="text-xs text-muted-foreground truncate">
                          UDI-DI: {sibling.udi_di}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredSiblings.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {searchTerm ? lang('variantManager.noProductsMatch') : lang('variantManager.noSiblingsFound')}
                </div>
              )}
            </div>

            {/* Create Group / Add to Existing Buttons */}
            {hasSelection && (
              <div className="space-y-2">
                <Button
                  onClick={() => setShowSiblingGroupDialog(true)}
                  className="w-full"
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {lang('variantManager.createGroupWith').replace('{count}', String(selectedCount))}
                </Button>

                {siblingGroups && siblingGroups.length > 0 && (
                  <Button
                    onClick={() => setShowAddToExistingDialog(true)}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Folders className="h-4 w-4 mr-2" />
                    {lang('variantManager.addToExistingGroup')}
                  </Button>
                )}
              </div>
            )}

            {!hasSelection && unassignedSiblings.length > 0 && (
              <div className="text-center text-sm text-muted-foreground p-4 border rounded-lg bg-muted/20">
                {lang('variantManager.selectToCreate')}
              </div>
            )}

            {unassignedSiblings.length === 0 && siblings.length > 0 && (
              <div className="text-center text-sm text-muted-foreground p-4 border rounded-lg bg-muted/20">
                {lang('variantManager.allAssigned')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RIGHT COLUMN: Current Product's Groups */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Folders className="h-5 w-5 text-primary" />
              <CardTitle>{lang('variantManager.currentProductGroups')}</CardTitle>
              {siblingGroups && siblingGroups.length > 0 && (
                <Badge variant="secondary">{siblingGroups.length} {siblingGroups.length !== 1 ? lang('variantManager.groups') : lang('variantManager.group')}</Badge>
              )}
            </div>
            <CardDescription>
              {lang('variantManager.distributionPatterns')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {siblingGroups && siblingGroups.length > 0 ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {siblingGroups.map((group) => {
                  const groupSiblings: SiblingInGroup[] = (group.product_sibling_assignments || [])
                    .filter(a => a.product)
                    .map(a => ({
                      assignmentId: a.id,
                      productId: a.product!.id,
                      name: a.product!.name,
                      tradeName: a.product!.trade_name,
                      percentage: a.percentage || 0,
                      position: a.position || 0,
                    }))
                    .sort((a, b) => a.position - b.position);

                  return (
                    <SiblingGroupCard
                      key={group.id}
                      groupId={group.id}
                      groupName={group.name}
                      groupDescription={group.description || undefined}
                      distributionPattern={group.distribution_pattern as DistributionPattern}
                      siblings={groupSiblings}
                      onDelete={() => handleDeleteSiblingGroup(group.id)}
                      onUpdateDistributionPattern={(pattern) =>
                        handleUpdateDistributionPattern(group.id, pattern)
                      }
                      basicUdiDi={currentProduct.basic_udi_di || undefined}
                      companyId={companyId}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground border rounded-lg">
                {lang('variantManager.noGroupsYet')}
                <br />
                {lang('variantManager.selectAndCreate')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create sibling group dialog - simplified to just ask for name */}
      <Dialog open={showSiblingGroupDialog} onOpenChange={setShowSiblingGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang('variantManager.dialog.createTitle')}</DialogTitle>
            <DialogDescription>
              {lang('variantManager.dialog.createDescription').replace('{count}', String(selectedCount))}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{lang('variantManager.dialog.groupName')}</label>
              <Input
                value={siblingGroupName}
                onChange={(e) => setSiblingGroupName(e.target.value)}
                placeholder={lang('variantManager.dialog.groupNamePlaceholder')}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSiblingGroupDialog(false)}>
              {lang('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateSiblingGroup}
              disabled={disabled || !siblingGroupName.trim() || selectedSiblingIds.length === 0}
            >
              {lang('variantManager.dialog.createGroup')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to existing group dialog */}
      <Dialog open={showAddToExistingDialog} onOpenChange={setShowAddToExistingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang('variantManager.dialog.addToExistingTitle')}</DialogTitle>
            <DialogDescription>
              {lang('variantManager.dialog.addToExistingDescription').replace('{count}', String(selectedCount))}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{lang('variantManager.dialog.selectGroup')}</label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder={lang('variantManager.dialog.chooseGroup')} />
                </SelectTrigger>
                <SelectContent>
                  {siblingGroups?.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} ({group.product_sibling_assignments?.length || 0} {lang('variantManager.products')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddToExistingDialog(false)}>
              {lang('common.cancel')}
            </Button>
            <Button
              onClick={handleAddToExistingGroup}
              disabled={disabled || !selectedGroupId || selectedSiblingIds.length === 0}
            >
              {lang('variantManager.dialog.addToGroup')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
