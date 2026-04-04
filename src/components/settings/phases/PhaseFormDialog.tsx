
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CompanyPhaseIsolationService } from "@/services/companyPhaseIsolationService";
import { useComplianceSections } from "@/hooks/useComplianceSections";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Tag, Layers, Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Simplified category interface to accept both service types
interface CategoryOption {
  id: string;
  name: string;
  is_system_category?: boolean;
}

interface PhaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description?: string; categoryId?: string; subSectionId?: string; sectionIds?: string[] }) => Promise<boolean>;
  title: string;
  categories: CategoryOption[];
  defaultValues?: { name: string; description?: string; categoryId?: string; subSectionId?: string };
  isSubmitting?: boolean;
  companyId: string;
  onCategoriesRefresh: () => void;
}

export function PhaseFormDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
  categories,
  defaultValues,
  isSubmitting = false,
  companyId,
  onCategoriesRefresh
}: PhaseFormDialogProps) {
  const [showCreateCategory, setShowCreateCategory] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [isCreatingCategory, setIsCreatingCategory] = React.useState(false);
  const [showCreateSubSection, setShowCreateSubSection] = React.useState(false);
  const [newSubSectionName, setNewSubSectionName] = React.useState("");
  const [isCreatingSubSection, setIsCreatingSubSection] = React.useState(false);
  const [sectionIds, setSectionIds] = React.useState<string[]>([]);

  const { sections, refetch: refreshSections, createSection } = useComplianceSections(companyId);

  const form = useForm({
    defaultValues: defaultValues || { name: "", description: "", categoryId: "no-category", subSectionId: "no-subsection" },
  });

  const selectedCategoryId = form.watch("categoryId");

  const toggleSection = (sectionId: string) => {
    setSectionIds(prev =>
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  React.useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name || "",
        description: defaultValues.description || "",
        categoryId: defaultValues.categoryId || "no-category",
        subSectionId: defaultValues.subSectionId || "no-subsection",
      });
    }
  }, [defaultValues, form]);

  // Refresh sections when dialog opens
  React.useEffect(() => {
    if (open) {
      refreshSections();
    }
  }, [open, refreshSections]);

  const handleSubmit = async (values: any) => {
    if (!values.name.trim()) {
      return;
    }
    const submitData = {
      name: values.name.trim(),
      description: values.description?.trim(),
      categoryId: values.categoryId === "no-category" ? undefined : values.categoryId,
      sectionIds,
    };
    const success = await onSubmit(submitData);
    if (success) {
      form.reset();
      setSectionIds([]);
      onOpenChange(false);
    }
  };

  const handleCreateSubSection = async () => {
    if (!newSubSectionName.trim()) return;

    setIsCreatingSubSection(true);
    try {
      const result = await createSection(newSubSectionName.trim());
      if (result) {
        onCategoriesRefresh();
        setSectionIds(prev => [...prev, result.id]);
        setNewSubSectionName("");
        setShowCreateSubSection(false);
      }
    } finally {
      setIsCreatingSubSection(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setIsCreatingCategory(true);
    try {
      const result = await CompanyPhaseIsolationService.createCustomCategory(companyId, newCategoryName.trim());
      if (result.success && result.categoryId) {
        onCategoriesRefresh();
        form.setValue("categoryId", result.categoryId);
        setNewCategoryName("");
        setShowCreateCategory(false);
      }
    } finally {
      setIsCreatingCategory(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phase Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Design Review, Testing Phase"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this phase"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Select
                        value={field.value || "no-category"}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a category..." />
                        </SelectTrigger>
                        <SelectContent className="z-[10000] bg-popover">
                          <SelectItem value="no-category">
                            <span className="text-muted-foreground">No Category</span>
                          </SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                <Tag className="h-3 w-3" />
                                <span>{category.name}</span>
                                {!category.is_system_category && (
                                  <Badge variant="secondary" className="text-xs bg-accent text-accent-foreground">
                                    Custom
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowCreateCategory(!showCreateCategory)}
                      disabled={isSubmitting}
                      title="Create new category"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showCreateCategory && (
              <div className="p-3 border rounded-md bg-muted/50 space-y-2">
                <FormLabel>New Category Name</FormLabel>
                <div className="flex gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., Design Controls"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCategory();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim() || isCreatingCategory}
                  >
                    {isCreatingCategory ? "..." : "Add"}
                  </Button>
                </div>
              </div>
            )}

            {/* Sections field - multi-select dropdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Sections</FormLabel>
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
                      {sectionIds.length === 0
                        ? "Select sections..."
                        : `${sectionIds.length} section${sectionIds.length !== 1 ? 's' : ''} selected`}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[10000]" align="start" onWheel={(e) => e.stopPropagation()}>
                  <div className="max-h-[200px] overflow-y-auto overscroll-contain">
                    {sections.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-3">No sections available</p>
                    ) : (
                      sections.map((section) => {
                        const isSelected = sectionIds.includes(section.id);
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
              <div className="text-xs text-muted-foreground">
                Optional: Select one or more sections for this phase
              </div>
            </div>

            {showCreateSubSection && (
              <div className="p-3 border rounded-md bg-purple-50 space-y-2">
                <FormLabel>New Section Name</FormLabel>
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

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Phase"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
