
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { type PhaseDocumentTemplate } from "@/services/refactoredPhaseService";
const AVAILABLE_MARKETS = ['US', 'EU', 'CA', 'AU', 'JP', 'BR', 'IN', 'CN'];
const DOCUMENT_TYPES = ['Standard', 'Regulatory', 'Technical', 'Clinical', 'Quality', 'Design', 'SOP'];
const DOCUMENT_STATUSES = ['Not Started', 'In Progress', 'Completed', 'Not Required'];
const TECH_APPLICABILITIES = ['All device types', 'Electrical devices', 'Software devices', 'Sterile devices', 'Active implantable devices', 'High-risk devices'];

interface DocumentTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<PhaseDocumentTemplate>) => Promise<boolean>;
  title: string;
  defaultValues?: PhaseDocumentTemplate | null;
  isSubmitting?: boolean;
}

export function DocumentTemplateFormDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
  defaultValues,
  isSubmitting = false
}: DocumentTemplateFormDialogProps) {
  const form = useForm({
    defaultValues: {
      name: defaultValues?.name || "",
      document_type: defaultValues?.document_type || "Standard",
      status: defaultValues?.status || "Not Started",
      tech_applicability: defaultValues?.tech_applicability || "All device types",
      markets: defaultValues?.markets || [],
    },
  });

  React.useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name,
        document_type: defaultValues.document_type,
        status: defaultValues.status,
        tech_applicability: defaultValues.tech_applicability,
        markets: defaultValues.markets,
      });
    }
  }, [defaultValues, form]);

  const handleSubmit = async (values: any) => {
    const success = await onSubmit({
      ...values,
      classes_by_market: defaultValues?.classes_by_market || {},
      document_scope: defaultValues?.document_scope || 'company_template',
    });
    if (success) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                  <FormLabel>Document Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Risk Management Plan" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="document_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DOCUMENT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tech_applicability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tech Applicability</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tech applicability" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TECH_APPLICABILITIES.map((applicability) => (
                        <SelectItem key={applicability} value={applicability}>
                          {applicability}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="markets"
              render={() => (
                <FormItem>
                  <FormLabel>Markets</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_MARKETS.map((market) => (
                      <FormField
                        key={market}
                        control={form.control}
                        name="markets"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={market}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(market)}
                                  onCheckedChange={(checked) => {
                                    const currentMarkets = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentMarkets, market]);
                                    } else {
                                      field.onChange(currentMarkets.filter((m) => m !== market));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {market}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
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
