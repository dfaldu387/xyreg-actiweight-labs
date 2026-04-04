
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { type PhaseCategory } from "@/services/categoryService";
import { MultiCategorySelector } from "./MultiCategorySelector";

interface PhaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description?: string; categoryIds?: string[] }) => Promise<boolean>;
  onCreateCategory?: (name: string) => Promise<void>;
  title: string;
  categories: PhaseCategory[];
  defaultValues?: { name: string; description?: string; categoryIds?: string[] };
  isSubmitting?: boolean;
}

export function PhaseFormDialog({
  open,
  onOpenChange,
  onSubmit,
  onCreateCategory,
  title,
  categories,
  defaultValues,
  isSubmitting = false
}: PhaseFormDialogProps) {
  const form = useForm({
    defaultValues: defaultValues || { name: "", description: "", categoryIds: [] },
  });

  React.useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name || "",
        description: defaultValues.description || "",
        categoryIds: defaultValues.categoryIds || []
      });
    }
  }, [defaultValues, form]);

  const handleSubmit = async (values: any) => {
    // Ensure name is provided before calling onSubmit
    if (!values.name.trim()) {
      return;
    }
    
    const submitData = {
      name: values.name.trim(),
      description: values.description?.trim(),
      categoryIds: values.categoryIds || [],
    };
    
    const success = await onSubmit(submitData);
    if (success) {
      form.reset();
      onOpenChange(false);
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
                      placeholder="e.g., Concept & Feasibility" 
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
              name="categoryIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categories</FormLabel>
                  <FormControl>
                    <MultiCategorySelector
                      categories={categories}
                      selectedCategoryIds={field.value || []}
                      onCategoryChange={field.onChange}
                      onCreateCategory={onCreateCategory}
                      placeholder="Select categories (optional)"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
