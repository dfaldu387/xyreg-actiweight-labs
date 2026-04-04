import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Loader2, Users } from "lucide-react";
import { VVService } from "@/services/vvService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

const vvPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  version: z.string().min(1),
  description: z.string().optional(),
  scope: z.string().min(1, "Scope is required"),
  methodology: z.array(z.string()).min(1, "At least one methodology is required"),
  acceptance_criteria: z.string().optional(),
  test_levels: z.array(z.string()),
});

type VVPlanFormData = z.infer<typeof vvPlanSchema>;

interface RoleResponsibility {
  role: string;
  responsibility: string;
}

const DEFAULT_ROLES: RoleResponsibility[] = [
  { role: "Quality Assurance", responsibility: "Review and approve test protocols" },
  { role: "Software Engineering", responsibility: "Execute software verification tests" },
  { role: "Regulatory Affairs", responsibility: "Ensure compliance with standards" },
];

const METHODOLOGIES = [
  { value: "inspection", label: "Inspection" },
  { value: "analysis", label: "Analysis" },
  { value: "test", label: "Test" },
  { value: "demonstration", label: "Demonstration" },
];

const TEST_LEVELS = [
  { value: "unit", label: "Unit Testing" },
  { value: "integration", label: "Integration Testing" },
  { value: "system", label: "System Testing" },
  { value: "validation", label: "Validation Testing" },
];

export interface VVPlanInitialData {
  name?: string;
  version?: string;
  description?: string;
  scope?: string;
  methodology?: string[];
  acceptance_criteria?: string;
  test_levels?: string[];
  roles?: RoleResponsibility[];
  scope_type?: 'individual' | 'product_family';
}

interface CreateVVPlanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
  initialData?: VVPlanInitialData | null;
  editPlanId?: string | null;
  familyIdentifier?: string | null;
  defaultScopeType?: 'individual' | 'product_family';
}

export function CreateVVPlanSheet({
  open,
  onOpenChange,
  productId,
  companyId,
  initialData,
  editPlanId,
  familyIdentifier,
  defaultScopeType = 'individual',
}: CreateVVPlanSheetProps) {
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const [roles, setRoles] = useState<RoleResponsibility[]>(DEFAULT_ROLES);
  const scopeType = defaultScopeType;

  const form = useForm<VVPlanFormData>({
    resolver: zodResolver(vvPlanSchema),
    defaultValues: {
      name: "",
      version: "1.0",
      description: "",
      scope: "",
      methodology: [],
      acceptance_criteria: "",
      test_levels: ["unit", "integration", "system", "validation"],
    },
  });

  React.useEffect(() => {
    if (open && initialData) {
      form.reset({
        name: initialData.name || "",
        version: initialData.version || "1.0",
        description: initialData.description || "",
        scope: initialData.scope || "",
        methodology: initialData.methodology || [],
        acceptance_criteria: initialData.acceptance_criteria || "",
        test_levels: initialData.test_levels || ["unit", "integration", "system", "validation"],
      });
      if (initialData.roles?.length) setRoles(initialData.roles);
    } else if (open && !initialData && !editPlanId) {
      form.reset();
      setRoles(DEFAULT_ROLES);
    }
  }, [open, initialData, editPlanId]);

  const createMutation = useMutation({
    mutationFn: async (data: VVPlanFormData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      const planData: any = {
        name: data.name,
        version: data.version,
        description: data.description || null,
        scope: data.scope || null,
        methodology: data.methodology.join(", "),
        acceptance_criteria: data.acceptance_criteria || null,
        roles_responsibilities: roles,
        scope_type: scopeType,
        family_identifier: scopeType === 'product_family' ? familyIdentifier : null,
      };

      if (editPlanId) {
        return VVService.updateVVPlan(editPlanId, planData);
      }

      return VVService.createVVPlan({
        ...planData,
        company_id: companyId,
        product_id: productId,
        status: "draft",
        created_by: userData.user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vv-plans"] });
      toast.success(editPlanId ? "V&V Plan updated" : lang("verificationValidation.vvPlan.createDialog.success"));
      onOpenChange(false);
      form.reset();
      setRoles(DEFAULT_ROLES);
    },
    onError: (error) => {
      console.error("Failed to save V&V Plan:", error);
      toast.error(editPlanId ? "Failed to update V&V Plan" : "Failed to create V&V Plan");
    },
  });

  const addRole = () => {
    setRoles([...roles, { role: "", responsibility: "" }]);
  };

  const removeRole = (index: number) => {
    setRoles(roles.filter((_, i) => i !== index));
  };

  const updateRole = (index: number, field: keyof RoleResponsibility, value: string) => {
    const updated = [...roles];
    updated[index][field] = value;
    setRoles(updated);
  };

  const onSubmit = (data: VVPlanFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl w-full p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{editPlanId ? "Edit V&V Plan" : lang("verificationValidation.vvPlan.createDialog.title")}</SheetTitle>
          <SheetDescription>
            {lang("verificationValidation.vvPlan.createDialog.description")}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-6 pb-4">
                {/* Scope info */}
                {scopeType === 'product_family' && familyIdentifier && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 border text-sm">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      This plan will apply to <strong>all variants</strong> in this product family (Basic UDI-DI: {familyIdentifier}).
                    </p>
                  </div>
                )}

                {/* Plan Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground border-b pb-2">
                    {lang("verificationValidation.vvPlan.createDialog.sections.planInfo")}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{lang("verificationValidation.vvPlan.createDialog.fields.name")}</FormLabel>
                          <FormControl>
                            <Input placeholder={lang("verificationValidation.vvPlan.createDialog.fields.namePlaceholder")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="version"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{lang("verificationValidation.vvPlan.createDialog.fields.version")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{lang("verificationValidation.vvPlan.createDialog.fields.description")}</FormLabel>
                        <FormControl>
                          <Textarea className="min-h-[60px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Scope */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground border-b pb-2">
                    {lang("verificationValidation.vvPlan.createDialog.sections.scope")}
                  </h4>
                  <FormField
                    control={form.control}
                    name="scope"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{lang("verificationValidation.vvPlan.createDialog.fields.scope")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={lang("verificationValidation.vvPlan.createDialog.fields.scopePlaceholder")} 
                            className="min-h-[80px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Methodology */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground border-b pb-2">
                    {lang("verificationValidation.vvPlan.createDialog.sections.methodology")}
                  </h4>
                  <FormField
                    control={form.control}
                    name="methodology"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{lang("verificationValidation.vvPlan.createDialog.fields.methodology")}</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {METHODOLOGIES.map((method) => (
                            <Badge
                              key={method.value}
                              variant={field.value.includes(method.value) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => {
                                const newValue = field.value.includes(method.value)
                                  ? field.value.filter((v) => v !== method.value)
                                  : [...field.value, method.value];
                                field.onChange(newValue);
                              }}
                            >
                              {method.label}
                            </Badge>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Test Strategy */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground border-b pb-2">
                    {lang("verificationValidation.vvPlan.createDialog.sections.testStrategy")}
                  </h4>
                  <FormField
                    control={form.control}
                    name="test_levels"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-2 gap-2">
                          {TEST_LEVELS.map((level) => (
                            <div key={level.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={level.value}
                                checked={field.value.includes(level.value)}
                                onCheckedChange={(checked) => {
                                  const newValue = checked
                                    ? [...field.value, level.value]
                                    : field.value.filter((v) => v !== level.value);
                                  field.onChange(newValue);
                                }}
                              />
                              <label htmlFor={level.value} className="text-sm">
                                {level.label}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Acceptance Criteria */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground border-b pb-2">
                    {lang("verificationValidation.vvPlan.createDialog.sections.acceptanceCriteria")}
                  </h4>
                  <FormField
                    control={form.control}
                    name="acceptance_criteria"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder={lang("verificationValidation.vvPlan.createDialog.fields.acceptanceCriteriaPlaceholder")} 
                            className="min-h-[60px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Roles & Responsibilities */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-medium text-foreground">
                      {lang("verificationValidation.vvPlan.createDialog.sections.rolesResponsibilities")}
                    </h4>
                    <Button type="button" variant="outline" size="sm" onClick={addRole}>
                      <Plus className="h-4 w-4 mr-1" />
                      {lang("verificationValidation.vvPlan.createDialog.addRole")}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {roles.map((role, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <Input
                          placeholder={lang("verificationValidation.vvPlan.createDialog.fields.role")}
                          value={role.role}
                          onChange={(e) => updateRole(index, "role", e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder={lang("verificationValidation.vvPlan.createDialog.fields.responsibility")}
                          value={role.responsibility}
                          onChange={(e) => updateRole(index, "responsibility", e.target.value)}
                          className="flex-[2]"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRole(index)}
                          disabled={roles.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Pinned footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {lang("common.cancel")}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editPlanId ? "Update Plan" : lang("verificationValidation.vvPlan.createDialog.createButton")}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
