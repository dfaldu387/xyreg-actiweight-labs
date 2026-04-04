
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X } from "lucide-react";
import { CategoryManager } from "./CategoryManager";

interface AddCustomPhaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (phaseInfo: {
    name: string;
    description?: string;
    categoryId?: string;
    documents?: string[];
  }) => void;
  companyId: string;
  initialData?: {
    id: string;
    name: string;
    description?: string;
    categoryId?: string;
  } | null;
}

export function AddCustomPhaseDialog({
  open,
  onOpenChange,
  onSave,
  companyId,
  initialData
}: AddCustomPhaseDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("no-category");
  const [documents, setDocuments] = useState<string[]>([]);
  const [newDocument, setNewDocument] = useState("");
  const [categories, setCategories] = useState<{id: string; name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  useEffect(() => {
    if (open && companyId) {
      loadCategories();
    }
  }, [open, companyId]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || "");
      setCategoryId(initialData.categoryId || "no-category");
    } else {
      setName("");
      setDescription("");
      setCategoryId("no-category");
      setDocuments([]);
    }
  }, [initialData, open]);

  const loadCategories = async () => {
    if (!companyId) return;
    try {
      console.log("Loading categories for company:", companyId);
      
      // Ensure detailed design category exists
      const { error: categoryError } = await supabase.rpc('ensure_detailed_design_category', {
        company_id_param: companyId
      });
      
      if (categoryError) {
        console.warn("Error ensuring detailed design category:", categoryError);
      }

      const { data, error } = await supabase
        .from('phase_categories')
        .select('id, name')
        .eq('company_id', companyId)
        .order('name');
      
      if (error) {
        console.error("Error fetching categories:", error);
        console.warn("Continuing with empty categories list");
        setCategories([]);
        return;
      }
      
      console.log("Loaded categories:", data);
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Could not load categories');
      setCategories([]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Phase name is required');
      return;
    }

    if (!companyId) {
      toast.error('Company ID not available');
      return;
    }

    setLoading(true);
    try {
      const finalCategoryId = categoryId === "no-category" ? undefined : categoryId;
      
      if (initialData) {
        // Editing existing phase
        await onSave({
          name: name.trim(),
          description: description.trim() || undefined,
          categoryId: finalCategoryId,
          documents: documents.filter(doc => doc.trim() !== '')
        });
      } else {
        // Creating new custom phase - call onSave which should handle the creation
        await onSave({
          name: name.trim(),
          description: description.trim() || undefined,
          categoryId: finalCategoryId,
          documents: documents.filter(doc => doc.trim() !== '')
        });
      }
      
      // Reset form only on successful save
      if (!initialData) {
        setName("");
        setDescription("");
        setCategoryId("no-category");
        setDocuments([]);
        setNewDocument("");
      }
      
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error saving phase:', error);
      
      // Enhanced error handling with specific messages
      if (error instanceof Error) {
        if (error.message.includes('unique_company_phase_position')) {
          toast.error('A phase with this position already exists. Please try again.');
        } else if (error.message.includes('Phase') && error.message.includes('not found')) {
          toast.error('Phase configuration error. Please refresh and try again.');
        } else {
          toast.error(`Failed to save phase: ${error.message}`);
        }
      } else {
        toast.error('Failed to save phase. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const addDocument = () => {
    if (newDocument.trim() && !documents.includes(newDocument.trim())) {
      setDocuments([...documents, newDocument.trim()]);
      setNewDocument("");
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newDocument.trim()) {
      e.preventDefault();
      addDocument();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Phase' : 'Add Custom Phase'}
          </DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Update the phase information below.'
              : 'Create a new custom phase for your company.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phase-name">Phase Name</Label>
            <Input
              id="phase-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter phase name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phase-description">Description (Optional)</Label>
            <Textarea
              id="phase-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter phase description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="phase-category">Category</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCategoryManager(!showCategoryManager)}
              >
                Manage Categories
              </Button>
            </div>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category (optional)" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-white">
                <SelectItem value="no-category">No Category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showCategoryManager && (
            <CategoryManager
              categories={categories}
              companyId={companyId}
              onCategoriesChange={loadCategories}
            />
          )}

          {!initialData && (
            <div className="space-y-2">
              <Label>Documents (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  value={newDocument}
                  onChange={(e) => setNewDocument(e.target.value)}
                  placeholder="Enter document name"
                  onKeyPress={handleKeyPress}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addDocument}
                  disabled={!newDocument.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {documents.length > 0 && (
                <div className="space-y-1">
                  {documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <span className="text-sm">{doc}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !name.trim()}>
            {loading ? "Saving..." : (initialData ? "Update Phase" : "Add Phase")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
