import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package } from "lucide-react";
import { type CategoryUsageInfo, type CompanyDeviceCategory } from '@/services/companyDeviceCategoriesService';

interface CategoryDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CompanyDeviceCategory;
  categories: CompanyDeviceCategory[];
  onValidateUsage: (categoryName: string) => Promise<CategoryUsageInfo>;
  onBulkUpdate: (fromCategory: string, toCategory: string | null) => Promise<number>;
  onDelete: (categoryId: string) => Promise<void>;
}

export function CategoryDeleteDialog({
  open,
  onOpenChange,
  category,
  categories,
  onValidateUsage,
  onBulkUpdate,
  onDelete
}: CategoryDeleteDialogProps) {
  const [usageInfo, setUsageInfo] = useState<CategoryUsageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [reassignCategory, setReassignCategory] = useState<string>('none');
  const [step, setStep] = useState<'validate' | 'reassign' | 'confirm'>('validate');

  // Other categories for reassignment (excluding current category)
  const otherCategories = categories.filter(cat => cat.id !== category.id);

  useEffect(() => {
    if (open && step === 'validate') {
      validateUsage();
    }
  }, [open, category.name]);

  const validateUsage = async () => {
    setLoading(true);
    try {
      const usage = await onValidateUsage(category.name);
      setUsageInfo(usage);
      
      if (usage.productCount === 0) {
        setStep('confirm');
      } else {
        setStep('reassign');
      }
    } catch (error) {
      console.error('Error validating category usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReassignAndDelete = async () => {
    if (!usageInfo) return;

    setLoading(true);
    try {
      // First, reassign products if needed
      if (usageInfo.productCount > 0) {
        const targetCategory = reassignCategory === 'none' ? null : reassignCategory;
        await onBulkUpdate(category.name, targetCategory);
      }

      // Then delete the category
      await onDelete(category.id);
      onOpenChange(false);
      
      // Reset state
      setStep('validate');
      setReassignCategory('none');
      setUsageInfo(null);
    } catch (error) {
      console.error('Error during reassign and delete:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectDelete = async () => {
    setLoading(true);
    try {
      await onDelete(category.id);
      onOpenChange(false);
      
      // Reset state
      setStep('validate');
      setUsageInfo(null);
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setStep('validate');
    setReassignCategory('none');
    setUsageInfo(null);
  };

  if (step === 'validate' && loading) {
    return (
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Validating Category Usage</AlertDialogTitle>
          <AlertDialogDescription>
            Checking if any products are using this category...
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AlertDialogContent>
    );
  }

  if (step === 'confirm' && usageInfo?.productCount === 0) {
    return (
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Device Category</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the "{category.name}" device category?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <Package className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">
            No products are currently using this category. Safe to delete.
          </span>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDirectDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Deleting...' : 'Delete Category'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    );
  }

  if (step === 'reassign' && usageInfo) {
    return (
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Category In Use - Reassignment Required
          </AlertDialogTitle>
          <AlertDialogDescription>
            The "{category.name}" category is currently being used by {usageInfo.productCount} product{usageInfo.productCount > 1 ? 's' : ''}.
            You must choose what to do with these products before deleting the category.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Usage summary */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                {usageInfo.productCount} Products Using This Category
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {usageInfo.products.slice(0, 5).map((product) => (
                <Badge key={product.id} variant="secondary" className="text-xs">
                  {product.name}
                </Badge>
              ))}
              {usageInfo.products.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{usageInfo.products.length - 5} more
                </Badge>
              )}
            </div>
          </div>

          {/* Reassignment options */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Choose reassignment option:</label>
            <Select value={reassignCategory} onValueChange={setReassignCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select reassignment option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Set to "No Category"</SelectItem>
                {otherCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    Reassign to "{cat.name}"
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {reassignCategory === 'none' && (
              <p className="text-xs text-muted-foreground">
                Products will have their category set to empty/null.
              </p>
            )}
            {reassignCategory !== 'none' && reassignCategory && (
              <p className="text-xs text-muted-foreground">
                All {usageInfo.productCount} products will be moved to the "{reassignCategory}" category.
              </p>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReassignAndDelete}
            disabled={loading || !reassignCategory}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Processing...' : `Reassign Products & Delete Category`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    );
  }

  return null;
}
