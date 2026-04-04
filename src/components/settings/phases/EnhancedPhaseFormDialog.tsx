import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PhaseNameSyncService } from "@/services/phaseNameSyncService";
import { usePhaseDependencies } from "@/hooks/usePhaseDependencies";
import { PhaseDependencyDialog } from "./PhaseDependencyDialog";
import { ConsolidatedPhase } from "@/services/consolidatedPhaseService";
import { Button as UIButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, ArrowRight, Pencil, Trash2, Settings } from "lucide-react";
import { DependencySummary } from "./DependencySummary";
import { CompanyPhaseIsolationService } from "@/services/companyPhaseIsolationService";
import { useComplianceSections } from "@/hooks/useComplianceSections";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Layers, Plus as PlusIcon, Check, ChevronsUpDown, X } from "lucide-react";

interface Phase {
  id: string;
  name: string;
  description?: string | null;
  category_id?: string | null;
  sub_section_id?: string | null;
  company_id?: string | null;
  position?: number | null;
  is_predefined_core_phase?: boolean | null;
  is_deletable?: boolean | null;
  is_custom?: boolean | null;
}

interface PhaseCategory {
  id: string;
  name: string;
}

interface EnhancedPhaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phase: Phase | null;
  categories: PhaseCategory[];
  onSuccess: () => void;
  onCategoriesRefresh?: () => void;
  companyId: string;
  availablePhases?: ConsolidatedPhase[];
}

export function EnhancedPhaseFormDialog({
  open,
  onOpenChange,
  phase,
  categories,
  onSuccess,
  onCategoriesRefresh,
  companyId,
  availablePhases = []
}: EnhancedPhaseFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    sectionIds: [] as string[],
    position: 0,
    duration_days: undefined as number | undefined
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDependencyDialog, setShowDependencyDialog] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PhaseCategory | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<PhaseCategory | null>(null);
  const [phasesInCategory, setPhasesInCategory] = useState(0);
  const [showManageSections, setShowManageSections] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionName, setEditSectionName] = useState('');
  // Pending section names to create after phase is created (for new phase flow)
  const [pendingNewSections, setPendingNewSections] = useState<string[]>([]);

  const {
    getPhaseDependencies,
    getDependencyTypeLabel
  } = usePhaseDependencies(companyId);

  const { sections, refetch: refreshSections, createSection, updateSection, deleteSection } = useComplianceSections(companyId);

  // Only show sections that are unassigned or already belong to the current phase
  const availableSections = useMemo(() => {
    if (!phase) return sections.filter(s => !(s as any).phase_id);
    return sections.filter(s => {
      const sectionPhaseId = (s as any).phase_id;
      return !sectionPhaseId || sectionPhaseId === phase.id;
    });
  }, [sections, phase]);

  useEffect(() => {
    if (phase) {
      setFormData({
        name: phase.name,
        description: phase.description || '',
        category_id: phase.category_id || '',
        sectionIds: sections.filter(s => (s as any).phase_id === phase.id).map(s => s.id),
        position: phase.position || 0,
        duration_days: (phase as any).duration_days || undefined
      });
      setPendingNewSections([]);
    }
  }, [phase, companyId]);

  // Reset form every time dialog opens for creating a new phase
  useEffect(() => {
    if (open && !phase) {
      setFormData({
        name: '',
        description: '',
        category_id: '',
        sectionIds: [],
        position: 0,
        duration_days: 30
      });
      setPendingNewSections([]);
      setShowCreateSection(false);
      setNewSectionName('');
      setIsCreatingCategory(false);
      setNewCategoryName('');
      refreshSections();
    }
  }, [open]);

  const toggleSection = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      sectionIds: prev.sectionIds.includes(sectionId)
        ? prev.sectionIds.filter(id => id !== sectionId)
        : [...prev.sectionIds, sectionId]
    }));
  };

  const resetForm = async () => {
    // Get the next available position for new phases
    let nextPosition = 0;
    if (!phase) {
      try {
        const { data: existingPhases } = await supabase
          .from('phases')
          .select('position')
          .eq('company_id', companyId)
          .order('position', { ascending: false })
          .limit(1);

        if (existingPhases && existingPhases.length > 0) {
          nextPosition = (existingPhases[0].position || 0) + 1;
        }
      } catch (error) {
        console.error('[EnhancedPhaseFormDialog] Error getting next position:', error);
      }
    }

    setFormData({
      name: '',
      description: '',
      category_id: '',
      sectionIds: [],
      position: nextPosition,
      duration_days: 30
    });
    setPendingNewSections([]);
  };

  // Helper function to get next position within a category
  const getNextCategoryPosition = async (categoryId: string): Promise<number> => {
    if (!categoryId) return formData.position;
    
    try {
      const { data: phasesInCategory } = await supabase
        .from('company_phases')
        .select('position')
        .eq('company_id', companyId)
        .eq('category_id', categoryId)
        .order('position', { ascending: false })
        .limit(1);

      if (phasesInCategory && phasesInCategory.length > 0) {
        return (phasesInCategory[0].position || 0) + 1;
      }
      return 1; // First phase in category
    } catch (error) {
      console.error('Error getting next category position:', error);
      return 1;
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      // Check if category already exists
      const { data: existingCategory } = await supabase
        .from('phase_categories')
        .select('id')
        .eq('company_id', companyId)
        .ilike('name', newCategoryName.trim())
        .single();

      if (existingCategory) {
        toast.info('Category already exists, selecting it');
        setFormData({ ...formData, category_id: existingCategory.id, position: 1 });
        setNewCategoryName('');
        setIsCreatingCategory(false);
        return;
      }

      // Get the next position
      const { data: maxPosition } = await supabase
        .from('phase_categories')
        .select('position')
        .eq('company_id', companyId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = (maxPosition?.[0]?.position || 0) + 1;

      const { data, error } = await supabase
        .from('phase_categories')
        .insert({
          name: newCategoryName.trim(),
          company_id: companyId,
          position: nextPosition,
          is_system_category: false
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // New category has no phases yet, so position should be 1
      setFormData({ ...formData, category_id: data.id, position: 1 });
      setNewCategoryName('');
      setIsCreatingCategory(false);
      onCategoriesRefresh?.();
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    }
  };

  const handleCreateSectionInline = async () => {
    if (!newSectionName.trim()) return;

    if (!phase) {
      // New phase flow: store section name locally, will create after phase is created
      const trimmedName = newSectionName.trim();
      if (pendingNewSections.includes(trimmedName)) {
        toast.error(`Section "${trimmedName}" is already added`);
        return;
      }
      setPendingNewSections(prev => [...prev, trimmedName]);
      setNewSectionName('');
      setShowCreateSection(false);
      return;
    }

    // Existing phase: create section in DB immediately
    setIsCreatingSection(true);
    try {
      const result = await createSection(newSectionName.trim());
      if (result) {
        setFormData(prev => ({ ...prev, sectionIds: [...prev.sectionIds, result.id] }));
        setNewSectionName('');
        setShowCreateSection(false);
      }
    } finally {
      setIsCreatingSection(false);
    }
  };

  const handleEditSection = async () => {
    if (!editingSectionId || !editSectionName.trim()) return;
    const success = await updateSection(editingSectionId, editSectionName.trim());
    if (success) {
      setEditingSectionId(null);
      setEditSectionName('');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    const success = await deleteSection(sectionId);
    if (success) {
      // Remove from form selection if it was selected
      setFormData(prev => ({
        ...prev,
        sectionIds: prev.sectionIds.filter(id => id !== sectionId)
      }));
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('phase_categories')
        .update({ name: editCategoryName.trim() })
        .eq('id', editingCategory.id);
        
      if (error) throw error;
      
      toast.success('Category updated');
      setEditingCategory(null);
      setEditCategoryName('');
      onCategoriesRefresh?.();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategoryCheck = async (category: PhaseCategory) => {
    // Check how many phases use this category
    const { count } = await supabase
      .from('company_phases')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('category_id', category.id);
    
    setPhasesInCategory(count || 0);
    setDeletingCategory(category);
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    
    try {
      // If phases exist in this category, set their category_id to null
      if (phasesInCategory > 0) {
        await supabase
          .from('company_phases')
          .update({ category_id: null })
          .eq('company_id', companyId)
          .eq('category_id', deletingCategory.id);
      }
      
      const { error } = await supabase
        .from('phase_categories')
        .delete()
        .eq('id', deletingCategory.id);
        
      if (error) throw error;
      
      toast.success('Category deleted');

      // Clear selection if this category was selected
      if (formData.category_id === deletingCategory.id) {
        setFormData({ ...formData, category_id: '' });
      }

      setDeletingCategory(null);
      onCategoriesRefresh?.();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Phase name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (phase) {
        // Updating existing phase
        console.log('[EnhancedPhaseFormDialog] Updating phase:', phase.id);

        // Check if name is changing
        const nameChanged = formData.name !== phase.name;

        const { error } = await (supabase as any)
          .from('company_phases')
          .update({
            name: formData.name,
            description: formData.description || null,
            category_id: formData.category_id || null,
            position: parseInt(formData.position.toString()) || 0,
            duration_days: formData.duration_days || null
          })
          .eq('id', phase.id);

        if (error) throw error;

        // If name changed, trigger synchronization
        if (nameChanged) {
          console.log('[EnhancedPhaseFormDialog] Phase name changed, triggering sync');
          await PhaseNameSyncService.syncPhaseNamesAcrossAllTables(phase.id, formData.name);
        }

        toast.success('Phase updated successfully');
        onSuccess(); // Call onSuccess to refresh the phase list
      } else {
        // Creating new phase
        console.log('[EnhancedPhaseFormDialog] Creating new phase');
        try {
          console.log('[LifecyclePhasesSettings] Creating custom phase with isolation:', formData);
          const result = await CompanyPhaseIsolationService.createCustomPhase(companyId, formData.name, formData.description, formData.category_id === "no-category" ? undefined : formData.category_id);
          if (result.success) {
            // Link existing selected sections to the newly created phase via phase_id
            if (result.phaseId && formData.sectionIds.length > 0) {
              for (const sectionId of formData.sectionIds) {
                await (supabase as any).from('compliance_document_sections').update({ phase_id: result.phaseId }).eq('id', sectionId);
              }
            }
            // Create pending new sections with the new phase_id (silently, no individual toasts)
            if (result.phaseId && pendingNewSections.length > 0) {
              for (const sectionName of pendingNewSections) {
                await (supabase as any).from('compliance_document_sections').insert({
                  company_id: companyId,
                  user_id: (await supabase.auth.getUser()).data.user?.id,
                  name: sectionName.trim(),
                  phase_id: result.phaseId
                });
              }
              setPendingNewSections([]);
            }
            toast.success(`Phase "${formData.name}" created`);
            onSuccess(); // Call onSuccess to refresh the phase list
            onOpenChange(false); // Close the dialog
            return true;
          } else {
            toast.error(result.error || 'Failed to create custom phase');
            return false;
          }
        } catch (error) {
          console.error('[EnhancedPhaseFormDialog] Error in handleCreateCustomPhase:', error);
          toast.error('Failed to create custom phase');
          return false;
        }
        // const { error } = await supabase
        //   .from('phases')
        //   .insert({
        //     name: formData.name,
        //     description: formData.description || null,
        //     category_id: formData.category_id || null,
        //     company_id: companyId,
        //     position: parseInt(formData.position.toString()) || 0,
        //     is_custom: true,
        //     is_deletable: true
        //   });

        // if (error) throw error;

        // toast.success('Phase created successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('[EnhancedPhaseFormDialog] Error saving phase:', error);
      toast.error('Failed to save phase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && !phase) {
      // Reset synchronously before dialog renders to prevent flicker
      setFormData({
        name: '',
        description: '',
        category_id: '',
        sectionIds: [],
        position: 0,
        duration_days: 30
      });
      setPendingNewSections([]);
      setShowCreateSection(false);
      setNewSectionName('');
      setIsCreatingCategory(false);
      setNewCategoryName('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {phase ? 'Edit Phase' : 'Add New Phase'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Phase Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Phase Category</Label>
              {isCreatingCategory ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCategory();
                      }
                      if (e.key === 'Escape') {
                        setIsCreatingCategory(false);
                        setNewCategoryName('');
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim()}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsCreatingCategory(false);
                      setNewCategoryName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <Select
                    onValueChange={async (value) => {
                      // When category changes, update position to next available in that category
                      if (!phase) { // Only auto-update position for new phases
                        const nextPos = await getNextCategoryPosition(value);
                        setFormData({ ...formData, category_id: value, position: nextPos });
                      } else {
                        setFormData({ ...formData, category_id: value });
                      }
                    }}
                    value={formData.category_id}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1 mt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCreatingCategory(true)}
                      className="flex-1"
                    >
                      + Add New
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowManageCategories(true)}
                      className="flex-1"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Manage
                    </Button>
                  </div>
                </>
              )}
            </div>
            {/* Sections field - multi-select dropdown */}
            <div className="space-y-2">
              <Label>Sections</Label>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {(formData.sectionIds.length + pendingNewSections.length) === 0
                        ? "Select sections..."
                        : `${formData.sectionIds.length + pendingNewSections.length} section${(formData.sectionIds.length + pendingNewSections.length) !== 1 ? 's' : ''} selected`}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[10000]" align="start" onWheel={(e) => e.stopPropagation()}>
                  <div className="max-h-[200px] overflow-y-auto overscroll-contain">
                    {availableSections.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-3">No sections available</p>
                    ) : (
                      availableSections.map((section) => {
                        const isSelected = formData.sectionIds.includes(section.id);
                        return (
                          <button
                            key={section.id}
                            type="button"
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                            onClick={() => toggleSection(section.id)}
                          >
                            <Check className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                            <Layers className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span>{section.name}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {/* Show selected section tags */}
              {(formData.sectionIds.length > 0 || pendingNewSections.length > 0) && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {[
                    ...formData.sectionIds
                      .map((sectionId) => ({ type: 'existing' as const, sectionId, name: sections.find(s => s.id === sectionId)?.name }))
                      .filter((item): item is { type: 'existing'; sectionId: string; name: string } => !!item.name),
                    ...pendingNewSections.map((name, idx) => ({ type: 'pending' as const, idx, name }))
                  ]
                    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
                    .map((item) =>
                      item.type === 'existing' ? (
                        <Badge key={item.sectionId} variant="secondary" className="flex items-center gap-1 pr-1">
                          <Layers className="h-3 w-3" />
                          {item.name}
                          <button
                            type="button"
                            className="ml-1 rounded-full hover:bg-muted p-0.5"
                            onClick={() => toggleSection(item.sectionId)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : (
                        <Badge key={`pending-${item.idx}`} variant="secondary" className="flex items-center gap-1 pr-1">
                          <Layers className="h-3 w-3" />
                          {item.name}
                          <button
                            type="button"
                            className="ml-1 rounded-full hover:bg-muted p-0.5"
                            onClick={() => setPendingNewSections(prev => prev.filter((_, i) => i !== item.idx))}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    )}
                </div>
              )}
              <div className="flex gap-1 mt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateSection(!showCreateSection)}
                  className="flex-1"
                >
                  + Add New
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManageSections(true)}
                  className="flex-1"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Manage
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Optional: Select one or more sections for this phase
              </div>
            </div>

            {showCreateSection && (
              <div className="p-3 border rounded-md bg-purple-50 space-y-2">
                <Label>New Section Name</Label>
                <div className="flex gap-2">
                  <Input
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder="e.g., Initial Review"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateSectionInline();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateSectionInline}
                    disabled={!newSectionName.trim() || isCreatingSection}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isCreatingSection ? "..." : "Add"}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="position">Position {formData.category_id && '(within category)'}</Label>
              <Input
                type="number"
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                type="number"
                id="duration"
                placeholder="Optional"
                value={formData.duration_days || ''}
                onChange={(e) => setFormData({ ...formData, duration_days: e.target.value ? parseInt(e.target.value) : undefined })}
              />
            </div>

            {/* Dependencies Section */}
            {phase && (
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label>Dependencies</Label>
                  <UIButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDependencyDialog(true)}
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Manage Dependencies
                  </UIButton>
                </div>

                <DependencySummary phase={phase} getPhaseDependencies={getPhaseDependencies} getDependencyTypeLabel={getDependencyTypeLabel} />

              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (phase ? 'Update Phase' : 'Create Phase')}
            </Button>
          </div>
        </form>

        {/* Dependency Management Dialog */}
        {phase && (
          <PhaseDependencyDialog
            open={showDependencyDialog}
            onOpenChange={setShowDependencyDialog}
            phase={phase as ConsolidatedPhase}
            availablePhases={availablePhases}
            companyId={companyId}
            onDataChange={onSuccess}
          />
        )}

        {/* Manage Categories Dialog */}
        <Dialog open={showManageCategories} onOpenChange={setShowManageCategories}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Manage Categories</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No categories created yet</p>
              ) : (
                categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-2 rounded border">
                    {editingCategory?.id === category.id ? (
                      <div className="flex gap-2 flex-1">
                        <Input
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          className="h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditCategory();
                            if (e.key === 'Escape') setEditingCategory(null);
                          }}
                        />
                        <Button size="sm" onClick={handleEditCategory}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm">{category.name}</span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingCategory(category);
                              setEditCategoryName(category.name);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteCategoryCheck(category)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Manage Sections Dialog */}
        <Dialog open={showManageSections} onOpenChange={setShowManageSections}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Manage Sections</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {sections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No sections created yet</p>
              ) : (
                sections.map((section) => (
                  <div key={section.id} className="flex items-center justify-between p-2 rounded border">
                    {editingSectionId === section.id ? (
                      <div className="flex gap-2 flex-1">
                        <Input
                          value={editSectionName}
                          onChange={(e) => setEditSectionName(e.target.value)}
                          className="h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSection();
                            if (e.key === 'Escape') setEditingSectionId(null);
                          }}
                        />
                        <Button size="sm" onClick={handleEditSection}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingSectionId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm">{section.name}</span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingSectionId(section.id);
                              setEditSectionName(section.name);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteSection(section.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Category Confirmation */}
        <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category "{deletingCategory?.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                {phasesInCategory > 0 ? (
                  <>
                    <strong className="text-amber-600">Warning:</strong> {phasesInCategory} phase{phasesInCategory !== 1 ? 's' : ''} are in this category. 
                    They will be moved to "Uncategorized" if you delete this category.
                  </>
                ) : (
                  'This category has no phases and will be permanently deleted.'
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
