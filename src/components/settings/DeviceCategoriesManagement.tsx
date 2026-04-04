import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCompanyDeviceCategories } from "@/hooks/useCompanyDeviceCategories";
import { ChevronDown, Trash2, Tag, Pencil, Plus, Package } from "lucide-react";
import { toast } from "sonner";
import { DeviceCategoryFormDialog } from "./DeviceCategoryFormDialog";
import { CategoryDeleteDialog } from "./CategoryDeleteDialog";
import { type CompanyDeviceCategory } from '@/services/companyDeviceCategoriesService';
import { useTranslation } from '@/hooks/useTranslation';
interface DeviceCategoriesManagementProps {
  companyId: string;
}
export function DeviceCategoriesManagement({
  companyId
}: DeviceCategoriesManagementProps) {
  const { lang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const {
    categories,
    loading,
    deleteCategory,
    createCategory,
    updateCategory,
    validateCategoryDeletion,
    bulkUpdateProductCategories,
    loadCategories
  } = useCompanyDeviceCategories(companyId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
    description?: string;
  } | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CompanyDeviceCategory | null>(null);

  // Load categories with usage information when component opens
  useEffect(() => {
    if (isOpen) {
      loadCategories(true); // Load with usage counts
    }
  }, [isOpen, loadCategories]);
  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
      toast.success(lang('settings.categories.deleteSuccess'));
      // Reload categories with updated usage counts
      loadCategories(true);
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error(lang('settings.categories.deleteError'));
    }
  };

  const handleOpenDeleteDialog = (category: CompanyDeviceCategory) => {
    setDeletingCategory(category);
    setIsDeleteOpen(true);
  };
  if (loading) {
    return <div className="flex items-center justify-center py-4">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>;
  }
  return <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  {lang('settings.categories.title')}
                </CardTitle>
                <CardDescription>
                  {lang('settings.categories.description', { count: categories.length })}
                </CardDescription>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">

            {/* Custom Categories Section */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{lang('settings.categories.sectionTitle')}</h4>
                <p className="text-sm text-muted-foreground">{lang('settings.categories.sectionDescription')}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> {lang('settings.categories.newCategory')}
              </Button>
            </div>

            {categories.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">{lang('settings.categories.noCategories')}</p>
                <p className="text-sm">{lang('settings.categories.noCategoriesHint')}</p>
              </div> : <div className="space-y-3">
                {categories.map(category => <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{category.name}</h4>
                          {(category as any).productCount !== undefined && (
                            <Badge variant={(category as any).productCount > 0 ? "default" : "secondary"} className="text-xs">
                              <Package className="h-3 w-3 mr-1" />
                              {lang('settings.categories.deviceCount', { count: (category as any).productCount })}
                            </Badge>
                          )}
                        </div>
                      {category.description && <p className="text-sm text-muted-foreground">{category.description}</p>}
                      <div className="text-xs text-muted-foreground">
                        {lang('settings.categories.createdAt', { date: new Date(category.created_at).toLocaleDateString() })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => {
                  setEditingCategory({
                    id: category.id,
                    name: category.name,
                    description: category.description
                  });
                  setIsEditOpen(true);
                }}>
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleOpenDeleteDialog(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>)}
              </div>}

            {/* Dialogs */}
            <DeviceCategoryFormDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} title={lang('settings.categories.createTitle')} onSubmit={async data => {
            try {
              await createCategory(data);
              toast.success(lang('settings.categories.createSuccess'));
            } catch (e) {
              toast.error(lang('settings.categories.createError'));
              throw e;
            }
          }} />

            <DeviceCategoryFormDialog open={isEditOpen} onOpenChange={setIsEditOpen} title={lang('settings.categories.editTitle')} defaultValues={{
            name: editingCategory?.name || '',
            description: editingCategory?.description || ''
          }} onSubmit={async data => {
            try {
              if (!editingCategory) return;
              await updateCategory(editingCategory.id, data);
              toast.success(lang('settings.categories.updateSuccess'));
              // Reload categories with updated usage counts
              loadCategories(true);
            } catch (e) {
              toast.error(lang('settings.categories.updateError'));
              throw e;
            } finally {
              setEditingCategory(null);
            }
          }} />

            {deletingCategory && (
              <CategoryDeleteDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                category={deletingCategory}
                categories={categories}
                onValidateUsage={validateCategoryDeletion}
                onBulkUpdate={bulkUpdateProductCategories}
                onDelete={handleDeleteCategory}
              />
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>;
}