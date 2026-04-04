import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { vvService } from "@/services/vvService";
import { TraceabilityLinksService } from "@/services/traceabilityLinksService";
import { SystemRequirementsService } from "@/services/systemRequirementsService";
import { SoftwareRequirementsService } from "@/services/softwareRequirementsService";
import { HardwareRequirementsService } from "@/services/hardwareRequirementsService";
import { UserNeedsService } from "@/services/userNeedsService";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { PrefillData } from "@/utils/ueToVvPrefill";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  test_level: z.string().min(1, { message: "Test level is required" }),
  category: z.string().optional(),
  test_method: z.string().optional(),
  preconditions: z.string().optional(),
  expected_results: z.string().optional(),
  acceptance_criteria: z.string().optional(),
  priority: z.string(),
  estimated_duration: z.string().optional(),
  sample_size: z.string().optional(),
  test_steps: z.array(z.object({
    step: z.string(),
    expected: z.string()
  })),
  linked_requirements: z.array(z.string())
});

type FormData = z.infer<typeof formSchema>;

interface CreateTestCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
  testType: "verification" | "validation";
  prefillData?: PrefillData;
  editTestCase?: any;
}

export function CreateTestCaseDialog({
  open,
  onOpenChange,
  productId,
  companyId,
  testType,
  prefillData,
  editTestCase,
}: CreateTestCaseDialogProps) {
  const isEditMode = !!editTestCase;
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      test_level: "",
      category: "",
      test_method: "",
      preconditions: "",
      expected_results: "",
      acceptance_criteria: "",
      priority: "medium",
      estimated_duration: "",
      test_steps: [],
      linked_requirements: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "test_steps"
  });

  // Apply prefill or edit data when dialog opens
  useEffect(() => {
    if (open && editTestCase) {
      const steps = Array.isArray(editTestCase.test_steps) ? editTestCase.test_steps : [];
      form.reset({
        name: editTestCase.name || "",
        description: editTestCase.description || "",
        test_level: editTestCase.test_level || "",
        category: editTestCase.category || "",
        test_method: editTestCase.test_method || "",
        preconditions: editTestCase.preconditions || "",
        expected_results: editTestCase.expected_results || "",
        acceptance_criteria: editTestCase.acceptance_criteria || "",
        priority: editTestCase.priority || "medium",
        estimated_duration: editTestCase.estimated_duration?.toString() || "",
        sample_size: editTestCase.sample_size?.toString() || "",
        test_steps: steps,
        linked_requirements: [],
      });
    } else if (open && prefillData) {
      form.reset({
        name: prefillData.name || "",
        description: prefillData.description || "",
        test_level: prefillData.test_level || "",
        category: prefillData.category || "",
        test_method: "",
        preconditions: prefillData.preconditions || "",
        expected_results: "",
        acceptance_criteria: prefillData.acceptance_criteria || "",
        priority: "high",
        estimated_duration: "",
        test_steps: prefillData.test_steps || [],
        linked_requirements: [],
      });
    }
  }, [open, prefillData, editTestCase]);

  // Fetch requirements for linking (including User Needs for IEC 62366 traceability)
  const { data: requirements = [] } = useQuery({
    queryKey: ["all-requirements-for-linking", productId],
    queryFn: async () => {
      const [un, sr, swr, hwr] = await Promise.all([
        UserNeedsService.getUserNeeds(productId),
        SystemRequirementsService.getByProductId(productId),
        SoftwareRequirementsService.getByProductId(productId),
        HardwareRequirementsService.getByProductId(productId)
      ]);

      return [
        ...un.map(r => ({ id: r.id, label: `${r.user_need_id} - ${r.description?.slice(0, 50) || 'No description'}`, type: "user_needs" as const })),
        ...sr.map(r => ({ id: r.id, label: `${r.requirement_id} - ${r.description?.slice(0, 50) || 'No description'}`, type: "system_requirements" as const })),
        ...swr.map(r => ({ id: r.id, label: `${r.requirement_id} - ${r.description?.slice(0, 50) || 'No description'}`, type: "software_requirements" as const })),
        ...hwr.map(r => ({ id: r.id, label: `${r.requirement_id} - ${r.description?.slice(0, 50) || 'No description'}`, type: "hardware_requirements" as const }))
      ];
    },
    enabled: open
  });

  const selectedRequirements = form.watch("linked_requirements");

  const toggleRequirement = (reqId: string) => {
    const current = form.getValues("linked_requirements");
    if (current.includes(reqId)) {
      form.setValue("linked_requirements", current.filter(id => id !== reqId));
    } else {
      form.setValue("linked_requirements", [...current, reqId]);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        toast.error("You must be logged in");
        return;
      }

      if (isEditMode) {
        // Update existing test case
        await vvService.updateTestCase(editTestCase.id, {
          name: data.name,
          description: data.description || undefined,
          test_level: data.test_level,
          category: data.category || undefined,
          test_method: data.test_method || undefined,
          preconditions: data.preconditions || undefined,
          test_steps: data.test_steps.length > 0 ? data.test_steps : [],
          expected_results: data.expected_results || undefined,
          acceptance_criteria: data.acceptance_criteria || undefined,
          priority: data.priority,
          estimated_duration: data.estimated_duration ? Number(data.estimated_duration) : undefined,
          sample_size: data.sample_size ? Number(data.sample_size) : 1,
        });

        toast.success(`Test case ${editTestCase.test_case_id} updated successfully`);
      } else {
        // Generate test case ID
        const testCaseId = await vvService.getNextTestCaseId(companyId, testType);

        // Create the test case
        const testCase = await vvService.createTestCase({
          company_id: companyId,
          product_id: productId,
          test_case_id: testCaseId,
          name: data.name,
          description: data.description || undefined,
          test_type: testType,
          test_level: data.test_level,
          category: data.category || undefined,
          test_method: data.test_method || undefined,
          preconditions: data.preconditions || undefined,
          test_steps: data.test_steps.length > 0 ? data.test_steps : [],
          expected_results: data.expected_results || undefined,
          acceptance_criteria: data.acceptance_criteria || undefined,
          priority: data.priority,
          estimated_duration: data.estimated_duration ? Number(data.estimated_duration) : undefined,
          sample_size: data.sample_size ? Number(data.sample_size) : 1,
          status: "draft",
          created_by: userId
        });

        // Create traceability links for linked requirements
        if (data.linked_requirements.length > 0) {
          await Promise.all(
            data.linked_requirements.map(reqId => {
              const req = requirements.find(r => r.id === reqId);
              if (!req) return Promise.resolve();
              
              return TraceabilityLinksService.create({
                product_id: productId,
                company_id: companyId,
                source_type: req.type,
                source_id: reqId,
                target_type: "test_case",
                target_id: testCase.id,
                link_type: "verifies"
              });
            })
          );
        }

        toast.success(`Test case ${testCaseId} created successfully`);
      }

      queryClient.invalidateQueries({ queryKey: ["test-cases"] });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving test case:", error);
      toast.error(isEditMode ? "Failed to update test case" : "Failed to create test case");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ISO 62366-1 aligned test levels for validation tests
  const testLevelOptions = testType === "verification"
    ? [
        { value: "unit", label: lang("verificationValidation.testCases.unit") },
        { value: "integration", label: lang("verificationValidation.testCases.integration") },
        { value: "system", label: lang("verificationValidation.testCases.system") }
      ]
    : [
        { value: "formative", label: lang("verificationValidation.testCases.formative") },
        { value: "summative", label: lang("verificationValidation.testCases.summative") },
        { value: "clinical", label: lang("verificationValidation.testCases.clinical") }
      ];

  // ISO 62366-1 aligned category options for validation tests
  const categoryOptions = testType === "verification"
    ? [
        { value: "software", label: lang("verificationValidation.testCases.software") },
        { value: "hardware", label: lang("verificationValidation.testCases.hardware") },
        { value: "usability", label: lang("verificationValidation.testCases.usability") }
      ]
    : [
        { value: "use_error_analysis", label: lang("verificationValidation.testCases.useErrorAnalysis") },
        { value: "hazard_related_use_scenario", label: lang("verificationValidation.testCases.hazardRelatedUseScenario") },
        { value: "simulated_use", label: lang("verificationValidation.testCases.simulatedUse") },
        { value: "actual_use", label: lang("verificationValidation.testCases.actualUse") },
        { value: "heuristic", label: lang("verificationValidation.testCases.heuristic") },
        { value: "cognitive_walkthrough", label: lang("verificationValidation.testCases.cognitiveWalkthrough") }
      ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? `Edit ${editTestCase?.test_case_id || 'Test Case'}`
              : testType === "verification"
                ? lang("verificationValidation.testCases.createVerificationTest")
                : lang("verificationValidation.testCases.createValidationTest")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update test case details" : "Define test case details, steps, and link to requirements"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-4">
          <Form {...form}>
            <form className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Basic Information</h4>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Case Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter test case name" {...field} />
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
                        <Textarea placeholder="Describe the purpose of this test" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="test_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test Level *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {testLevelOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {testType === "validation" && field.value && (
                          <FormDescription className="text-xs text-muted-foreground">
                            {field.value === "formative" 
                              ? lang("verificationValidation.testCases.formativeDescription")
                              : field.value === "summative"
                                ? lang("verificationValidation.testCases.summativeDescription")
                                : null}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoryOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="test_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="inspection">Inspection</SelectItem>
                            <SelectItem value="analysis">Analysis</SelectItem>
                            <SelectItem value="test">Test</SelectItem>
                            <SelectItem value="demonstration">Demonstration</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimated_duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Est. Duration (min)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sample_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sample Size / Repetitions</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" placeholder="1" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Number of test runs for statistical significance
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Test Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Test Details</h4>

                <FormField
                  control={form.control}
                  name="preconditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preconditions</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Prerequisites before running this test" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expected_results"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Results</FormLabel>
                      <FormControl>
                        <Textarea placeholder="What should happen when the test passes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acceptance_criteria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Acceptance Criteria</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Criteria that must be met for this test to pass" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Test Steps */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">Test Steps</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ step: "", expected: "" })}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Step
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No steps added yet. Click "Add Step" to define test steps.</p>
                ) : (
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-start p-3 border rounded-md bg-muted/30">
                        <span className="text-sm font-medium text-muted-foreground mt-2">{index + 1}.</span>
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Step action/description"
                            {...form.register(`test_steps.${index}.step`)}
                          />
                          <Input
                            placeholder="Expected result for this step"
                            {...form.register(`test_steps.${index}.expected`)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Requirement Linking */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium text-foreground">Link to Requirements</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Select requirements this test case verifies. Links will be created automatically.
                </p>

                {requirements.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No requirements found for this product.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                    {requirements.map(req => (
                      <Badge
                        key={req.id}
                        variant={selectedRequirements.includes(req.id) ? "default" : "outline"}
                        className="cursor-pointer hover:opacity-80"
                        onClick={() => toggleRequirement(req.id)}
                      >
                        {req.label}
                      </Badge>
                    ))}
                  </div>
                )}
                {selectedRequirements.length > 0 && (
                  <p className="text-xs text-muted-foreground">{selectedRequirements.length} requirement(s) selected</p>
                )}
              </div>
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : "Create Test Case")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
