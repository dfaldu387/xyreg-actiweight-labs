
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface CategoryManagerProps {
  categories: Category[];
  companyId: string;
  onCategoriesChange: () => void;
}

export function CategoryManager({ categories, companyId, onCategoriesChange }: CategoryManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (newCategoryName.trim() === "Detailed Design Control Steps") {
      toast.error("This category name is reserved");
      return;
    }

    // Check for duplicate category names
    const existingCategory = categories.find(
      cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    
    if (existingCategory) {
      toast.error("A category with this name already exists");
      return;
    }

    setLoading(true);
    try {
      console.log("Creating category:", newCategoryName.trim(), "for company:", companyId);
      
      // Get the next position
      const { data: maxPosition } = await supabase
        .from('phase_categories')
        .select('position')
        .eq('company_id', companyId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = (maxPosition?.[0]?.position || 0) + 1;

      const { error } = await supabase
        .from('phase_categories')
        .insert({
          company_id: companyId,
          name: newCategoryName.trim(),
          position: nextPosition,
          is_system_category: false // Mark as custom category
        });

      if (error) {
        console.error("Error creating category:", error);
        throw error;
      }

      toast.success("Category created successfully");
      setNewCategoryName("");
      setShowCreateDialog(false);
      onCategoriesChange();
    } catch (error) {
      console.error("Error creating category:", error);
      if (error instanceof Error) {
        if (error.message.includes('permission denied') || error.message.includes('policy')) {
          toast.error("You don't have permission to create categories for this company");
        } else if (error.message.includes('unique')) {
          toast.error("A category with this name already exists");
        } else {
          toast.error(`Failed to create category: ${error.message}`);
        }
      } else {
        toast.error("Failed to create category");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (categoryName === "Detailed Design Control Steps") {
      toast.error("Cannot delete the Detailed Design Control Steps category");
      return;
    }

    if (!confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      return;
    }

    try {
      console.log("Deleting category:", categoryName, "ID:", categoryId);
      
      // First move all phases in this category to "No Category"
      const { error: phaseUpdateError } = await supabase
        .from('phases')
        .update({ category_id: null })
        .eq('category_id', categoryId);

      if (phaseUpdateError) {
        console.error("Error updating phases:", phaseUpdateError);
        throw phaseUpdateError;
      }

      // Then delete the category
      const { error: deleteError } = await supabase
        .from('phase_categories')
        .delete()
        .eq('id', categoryId);

      if (deleteError) {
        console.error("Error deleting category:", deleteError);
        throw deleteError;
      }

      toast.success("Category deleted successfully");
      onCategoriesChange();
    } catch (error) {
      console.error("Error deleting category:", error);
      if (error instanceof Error) {
        if (error.message.includes('permission denied') || error.message.includes('policy')) {
          toast.error("You don't have permission to delete this category");
        } else {
          toast.error(`Failed to delete category: ${error.message}`);
        }
      } else {
        toast.error("Failed to delete category");
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Categories</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="space-y-1">
        {categories.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No categories found. Create one to organize your phases.
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">{category.name}</span>
              {category.name !== "Detailed Design Control Steps" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCategory(category.id, category.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="z-50 bg-white">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new category to organize your phases.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading && newCategoryName.trim()) {
                    handleCreateCategory();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNewCategoryName("");
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={loading || !newCategoryName.trim()}
            >
              {loading ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
