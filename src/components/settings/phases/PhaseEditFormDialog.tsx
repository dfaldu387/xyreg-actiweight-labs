import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phase, PhaseCategory } from "./ConsolidatedPhaseDataService";
import {
  getLinearPreRevenueDefaults,
  getLinearPostRevenueDefaults
} from "@/utils/phaseCalculations";
import { Loader2, Layers, Plus, Check, ChevronsUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useComplianceSections } from "@/hooks/useComplianceSections";

interface PhaseEditFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phase: Phase | null;
  categories: PhaseCategory[];
  activePhases: Phase[];
  companyId?: string;
  onSubmit: (phaseId: string, updates: {
    name?: string;
    description?: string;
    categoryId?: string;
    subSectionId?: string;
    sectionIds?: string[];
    duration_days?: number;
  }) => Promise<boolean>;
  isSubmitting?: boolean;
  onCategoriesRefresh?: () => void;
}

export function PhaseEditFormDialog({
  open,
  onOpenChange,
  phase,
  categories,
  activePhases,
  companyId,
  onSubmit,
  isSubmitting = false,
  onCategoriesRefresh
}: PhaseEditFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: 'no-category',
    sectionIds: [] as string[],
    duration_days: 14
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [showCreateSubSection, setShowCreateSubSection] = useState(false);
  const [newSubSectionName, setNewSubSectionName] = useState("");
  const [isCreatingSubSection, setIsCreatingSubSection] = useState(false);
  const { sections, refetch: refreshSections, createSection } = useComplianceSections(companyId);

  // Only show sections that are unassigned or already belong to the current phase
  const availableSections = useMemo(() => {
    if (!phase) return sections;
    return sections.filter(s => {
      const sectionPhaseId = (s as any).phase_id;
      return !sectionPhaseId || sectionPhaseId === phase.id;
    });
  }, [sections, phase]);

  useEffect(() => {
    if (phase && open && !isFormInitialized) {
      const durationDays = phase.is_calculated && phase.calculated_end_day !== undefined && phase.calculated_start_day !== undefined
        ? phase.calculated_end_day - phase.calculated_start_day
        : (typeof phase.duration_days === 'number' && phase.duration_days > 0 ? phase.duration_days : 14);

      setFormData({
        name: phase.name || '',
        description: phase.description || '',
        categoryId: phase.category_id || 'no-category',
        sectionIds: sections.filter(s => (s as any).phase_id === phase.id).map(s => s.id),
        duration_days: durationDays
      });
      setValidationError(null);
      setIsFormInitialized(true);
    } else if (!open) {
      setIsFormInitialized(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase?.id, open, isFormInitialized]);

  // Refresh sections when dialog opens
  useEffect(() => {
    if (open) {
      refreshSections();
    }
  }, [open, refreshSections]);

  // Update sectionIds once when sections data arrives after async refetch
  const [sectionsSynced, setSectionsSynced] = useState(false);
  useEffect(() => {
    if (phase && open && isFormInitialized && !sectionsSynced && sections.length > 0) {
      const phaseSectionIds = sections.filter(s => (s as any).phase_id === phase.id).map(s => s.id);
      setFormData(prev => ({ ...prev, sectionIds: phaseSectionIds }));
      setSectionsSynced(true);
    }
  }, [sections, phase?.id, open, isFormInitialized, sectionsSynced]);
  // Reset sync flag when dialog closes
  useEffect(() => {
    if (!open) setSectionsSynced(false);
  }, [open]);

  useEffect(() => {
    if (!phase && activePhases.length > 0) {
      const defaults = getLinearPreRevenueDefaults(activePhases);
      setFormData({
        name: '',
        description: '',
        categoryId: 'no-category',
        sectionIds: [],
        duration_days: defaults.duration_days || 14
      });
      setValidationError(null);
    }
  }, [phase, activePhases.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!phase || !formData.name.trim()) {
      setValidationError('Phase name is required');
      return;
    }

    const durationValue = parseInt(formData.duration_days.toString());
    if (isNaN(durationValue) || durationValue <= 0) {
      setValidationError('Duration must be a positive number of days');
      return;
    }

    const updates = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      categoryId: formData.categoryId === 'no-category' ? undefined : formData.categoryId,
      sectionIds: formData.sectionIds,
      duration_days: durationValue
    };

    const success = await onSubmit(phase.id, updates);

    if (success) {
      setValidationError(null);
      onOpenChange(false);
    }
  };

  const handleCreateSubSection = async () => {
    if (!newSubSectionName.trim()) return;

    setIsCreatingSubSection(true);
    try {
      const result = await createSection(newSubSectionName.trim(), phase?.id);
      if (result) {
        setFormData(prev => ({ ...prev, sectionIds: [...prev.sectionIds, result.id] }));
        setNewSubSectionName("");
        setShowCreateSubSection(false);
      }
    } finally {
      setIsCreatingSubSection(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setFormData(prev => {
      const has = prev.sectionIds.includes(sectionId);
      return {
        ...prev,
        sectionIds: has
          ? prev.sectionIds.filter(id => id !== sectionId)
          : [...prev.sectionIds, sectionId]
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Phase</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {validationError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{validationError}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Phase Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (validationError) setValidationError(null);
              }}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Phase Category</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-category">No category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              Categorize this phase by its primary function (e.g., R&D, Regulatory Affairs, Clinical Trials)
            </div>
          </div>

          {/* Sections field - multi-select dropdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Sections</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setShowCreateSubSection(!showCreateSubSection)}
                disabled={isSubmitting}
              >
                <Plus className="h-3 w-3 mr-1" />
                New
              </Button>
            </div>
            <Popover modal={true}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                  disabled={isSubmitting}
                >
                  <span className="truncate">
                    {formData.sectionIds.length === 0
                      ? "Select sections..."
                      : `${formData.sectionIds.length} section${formData.sectionIds.length !== 1 ? 's' : ''} selected`}
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
            {formData.sectionIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {formData.sectionIds
                  .map((sectionId) => ({ sectionId, section: sections.find(s => s.id === sectionId) }))
                  .filter((item): item is { sectionId: string; section: NonNullable<typeof item.section> } => !!item.section)
                  .sort((a, b) => a.section.name.localeCompare(b.section.name, undefined, { numeric: true }))
                  .map(({ sectionId, section }) => (
                    <Badge key={sectionId} variant="secondary" className="flex items-center gap-1 pr-1">
                      <Layers className="h-3 w-3" />
                      {section.name}
                      <button
                        type="button"
                        className="ml-1 rounded-full hover:bg-muted p-0.5"
                        onClick={() => toggleSection(sectionId)}
                        disabled={isSubmitting}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Optional: Select one or more sections for this phase
            </div>
          </div>

          {showCreateSubSection && (
            <div className="p-3 border rounded-md bg-purple-50 space-y-2">
              <Label>New Section Name</Label>
              <div className="flex gap-2">
                <Input
                  value={newSubSectionName}
                  onChange={(e) => setNewSubSectionName(e.target.value)}
                  placeholder="e.g., Initial Review"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateSubSection();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateSubSection}
                  disabled={!newSubSectionName.trim() || isCreatingSubSection}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isCreatingSubSection ? "..." : "Add"}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (Days)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="9999"
              value={formData.duration_days}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value > 0) {
                  setFormData({ ...formData, duration_days: value });
                } else if (e.target.value === '') {
                  setFormData({ ...formData, duration_days: 1 });
                }
                if (validationError) setValidationError(null);
              }}
              disabled={isSubmitting}
              placeholder="Enter duration in days"
              required
            />
            <div className="text-xs text-muted-foreground">
              Expected duration of this phase in days
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Phase"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}