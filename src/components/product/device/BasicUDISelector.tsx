import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link2, Plus, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useBasicUDIDI } from "@/hooks/useBasicUDIDI";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface BasicUDISelectorProps {
  companyId: string;
  productId: string;
  currentBasicUdiDi?: string;
  onAssigned?: (basicUdiDi: string) => void;
  onCreateNew?: () => void;
}

export function BasicUDISelector({
  companyId,
  productId,
  currentBasicUdiDi,
  onAssigned,
  onCreateNew
}: BasicUDISelectorProps) {
  const queryClient = useQueryClient();
  const { basicUDIGroups, products, isLoading, refresh } = useBasicUDIDI(companyId);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Get company prefix from existing groups
  const companyPrefix = basicUDIGroups[0]?.company_prefix || '';

  // Count products per group
  const getProductCount = (groupBasicUdiDi: string) => {
    return products.filter(p => p.basic_udi_di === groupBasicUdiDi).length;
  };

  // Check if current product has a temporary Basic UDI-DI
  const isTemporary = currentBasicUdiDi?.startsWith('tmp-');

  // Find matching group for current Basic UDI-DI
  const currentGroup = basicUDIGroups.find(g => g.basic_udi_di === currentBasicUdiDi);

  const handleAssign = async () => {
    if (!selectedGroupId) return;

    const group = basicUDIGroups.find(g => g.id === selectedGroupId);
    if (!group) return;

    setIsAssigning(true);
    try {
      // Update legacy field (still used elsewhere for compatibility)
      const { error } = await supabase
        .from('products')
        .update({ basic_udi_di: group.basic_udi_di })
        .eq('id', productId);

      if (error) throw error;

      // === SSOT: persist assignment row for Overview display ===
      // Delete any existing assignment for this product
      await supabase
        .from('product_basic_udi_assignments')
        .delete()
        .eq('product_id', productId);

      // Insert the new assignment
      const { error: assignmentError } = await supabase
        .from('product_basic_udi_assignments')
        .insert({ product_id: productId, basic_udi_di_group_id: group.id });

      if (assignmentError) {
        console.error('Failed to insert SSOT assignment:', assignmentError);
        toast.warning('Basic UDI-DI saved, but Overview linkage may not update immediately.');
      }

      // Invalidate useProductUDI cache so DeviceOverviewHeader refreshes
      queryClient.invalidateQueries({ queryKey: ['product-udi', productId] });

      toast.success(`Assigned to Basic UDI-DI: ${group.internal_reference}`);
      onAssigned?.(group.basic_udi_di);
      await refresh();
      setSelectedGroupId('');
    } catch (err: any) {
      toast.error('Failed to assign Basic UDI-DI');
      console.error(err);
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Assign Basic UDI-DI</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="p-3 rounded-lg bg-muted/50">
          <Label className="text-sm text-muted-foreground">Current Basic UDI-DI</Label>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-sm font-mono">{currentBasicUdiDi || 'Not assigned'}</code>
            {isTemporary && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                <AlertCircle className="h-3 w-3 mr-1" />
                Temporary
              </Badge>
            )}
            {currentGroup && (
              <Badge variant="secondary">
                <CheckCircle className="h-3 w-3 mr-1" />
                {currentGroup.internal_reference}
              </Badge>
            )}
          </div>
        </div>

        {/* Select Existing */}
        {basicUDIGroups.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Existing Basic UDI-DI</Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a Basic UDI-DI group..." />
              </SelectTrigger>
              <SelectContent>
                {basicUDIGroups.map(group => {
                  const productCount = getProductCount(group.basic_udi_di);
                  const isCurrentlyAssigned = group.basic_udi_di === currentBasicUdiDi;
                  
                  return (
                    <SelectItem 
                      key={group.id} 
                      value={group.id}
                      disabled={isCurrentlyAssigned}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{group.internal_reference}</span>
                        <span className="text-muted-foreground">•</span>
                        <code className="text-xs text-muted-foreground">{group.basic_udi_di}</code>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {productCount} {productCount === 1 ? 'device' : 'devices'}
                        </Badge>
                        {isCurrentlyAssigned && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Button 
              onClick={handleAssign} 
              disabled={!selectedGroupId || isAssigning}
              className="w-full"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign Selected'
              )}
            </Button>
          </div>
        )}

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            OR
          </span>
        </div>

        {/* Create New */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Create New Basic UDI-DI</Label>
          {companyPrefix && (
            <p className="text-sm text-muted-foreground">
              New codes will start with prefix: <code className="font-mono bg-muted px-1 rounded">{companyPrefix}</code>
            </p>
          )}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onCreateNew}
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate New Basic UDI-DI
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
