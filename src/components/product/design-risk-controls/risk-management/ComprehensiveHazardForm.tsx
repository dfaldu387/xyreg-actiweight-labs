import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/settings/document-control/MultiSelect";
import { RiskMatrix } from "./RiskMatrix";
import { CreateHazardInput, SeverityLevel, ProbabilityLevel, RiskControlType, MitigationType } from "./types";
import { RequirementSpecification } from "../requirement-specifications/types";
import { AIApprovalField } from "@/components/ai/AIApprovalField";
import { HazardAIFillPanel, HazardFillSuggestion } from "./HazardAIFillPanel";
import { HazardProductScope, HazardProductScopeData } from "./HazardProductScope";

const HAZARD_CATEGORIES = [
  { value: "mechanical_energy", label: "Mechanical / Structural" },
  { value: "thermal_energy", label: "Thermal Energy" },
  { value: "electrical_energy", label: "Electrical Energy" },
  { value: "radiation", label: "Radiation (Ionizing & Non-Ionizing)" },
  { value: "acoustic_energy", label: "Acoustic Energy" },
  { value: "chemical_hazards", label: "Chemical Hazards" },
  { value: "biocompatibility", label: "Biocompatibility" },
  { value: "materials_patient_contact", label: "Materials & Patient Contact" },
  { value: "combination_other_products", label: "Combination with Other Products" },
  { value: "human_factors", label: "Human Factors" },
  { value: "training_requirements", label: "Training Requirements" },
  { value: "cleaning_maintenance", label: "Cleaning & Maintenance" },
  { value: "negative_air_pressure", label: "Negative Air Pressure" },
  { value: "sterility_requirements", label: "Sterility Requirements" },
  { value: "critical_data_storage", label: "Critical Data Storage" },
  { value: "software_use", label: "Software Use" },
  { value: "disposal", label: "Disposal" },
  { value: "manufacturing_residues", label: "Manufacturing Residues" },
  { value: "transport_storage", label: "Transport & Storage" },
  { value: "shelf_life", label: "Shelf Life" },
  { value: "product_realization", label: "Product Realization" },
  { value: "customer_requirements", label: "Customer Requirements" },
  { value: "purchasing", label: "Purchasing" },
  { value: "service_provision", label: "Service Provision" },
  { value: "monitoring_devices", label: "Monitoring Devices" },
];

const comprehensiveHazardSchema = z.object({
  // Basic hazard identification
  description: z.string().min(1, "Hazard description is required"),
  category: z.string().optional(),

  // Comprehensive risk analysis chain
  foreseeable_sequence_events: z.string().optional(),
  hazardous_situation: z.string().optional(),
  potential_harm: z.string().optional(),

  // Initial risk assessment (required for ISO 14971 compliance)
  initial_severity: z.number({ message: "Severity is required" }).min(1, "Severity is required").max(5),
  initial_probability: z.number({ message: "Probability is required" }).min(1, "Probability is required").max(5),
  initial_risk: z.enum(["Low", "Medium", "High", "Very High"]).optional(),

  // Risk control measures (optional - user can register hazard first, add mitigation later)
  risk_control_measure: z.string().optional(),
  risk_control_type: z.enum(["design", "protective_measure", "information_for_safety"]).optional(),
  mitigation_measure: z.string().optional(), // Legacy compatibility
  mitigation_link: z.string().optional(),

  // Residual risk assessment (optional - filled after mitigation is defined)
  residual_severity: z.number().min(1).max(5).optional(),
  residual_probability: z.number().min(1).max(5).optional(),
  residual_risk: z.enum(["Low", "Medium", "High", "Very High"] as const).optional(),

  // Verification and validation
  verification_implementation: z.string().optional(),
  verification_effectiveness: z.string().optional(),

  // Traceability
  linked_requirements: z.string().optional(),
  traceability_requirements: z.string().optional(),
});

interface ComprehensiveHazardFormProps {
  requirements: any[];
  onSubmit: (input: CreateHazardInput, requirementIds: string[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<CreateHazardInput>;
  aiData?: {
    hazardous_situation?: string;
    potential_harm?: string;
    foreseeable_sequence_events?: string;
    confidence?: number;
  };
  // AI Fill context (for draft hazards linked from requirements)
  aiFillContext?: {
    companyId: string;
    productId: string;
    requirementDescription: string;
    requirementId: string;
    requirementCategory?: string;
    existingHazardData?: {
      hazardous_situation?: string;
      potential_harm?: string;
      foreseeable_sequence_events?: string;
    };
  };
  deleteButton?: React.ReactNode;
  // Product scope props
  companyId?: string;
  productId?: string;
}

type FormData = z.infer<typeof comprehensiveHazardSchema>;

export function ComprehensiveHazardForm({
  requirements,
  onSubmit,
  onCancel,
  isLoading,
  initialData,
  deleteButton,
  aiData,
  aiFillContext,
  companyId,
  productId,
}: ComprehensiveHazardFormProps) {
  const { lang } = useTranslation();
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>(
    initialData?.linked_requirements?.split(',').map(id => id.trim()).filter(Boolean) || []
  );

  // Product scope state
  const effectiveCompanyId = companyId || aiFillContext?.companyId;
  const effectiveProductId = productId || aiFillContext?.productId;
  const [productScope, setProductScope] = useState<HazardProductScopeData>(
    initialData?.productScope || {
      categoryNames: [],
      productIds: effectiveProductId ? [effectiveProductId] : [],
    }
  );

  // AI approval states
  const [aiApprovalStates, setAiApprovalStates] = useState({
    hazardous_situation: false,
    potential_harm: false,
    foreseeable_sequence_events: false,
  });

  const form = useForm<FormData, any, FormData>({
    resolver: zodResolver(comprehensiveHazardSchema),
    defaultValues: {
      description: initialData?.description || "",
      category: initialData?.category || "",
      foreseeable_sequence_events: initialData?.foreseeable_sequence_events || aiData?.foreseeable_sequence_events || "",
      hazardous_situation: initialData?.hazardous_situation || aiData?.hazardous_situation || "",
      potential_harm: initialData?.potential_harm || aiData?.potential_harm || "",
      initial_severity: initialData?.initial_severity,
      initial_probability: initialData?.initial_probability,
      initial_risk: initialData?.initial_risk,
      risk_control_measure: initialData?.risk_control_measure || "",
      risk_control_type: initialData?.risk_control_type,
      mitigation_measure: initialData?.mitigation_measure || "",
      // mitigation_type removed - not in schema
      mitigation_link: initialData?.mitigation_link || "",
      residual_severity: initialData?.residual_severity,
      residual_probability: initialData?.residual_probability,
      residual_risk: initialData?.residual_risk,
      verification_implementation: initialData?.verification_implementation || "",
      verification_effectiveness: initialData?.verification_effectiveness || "",
      linked_requirements: initialData?.linked_requirements || "",
      traceability_requirements: initialData?.traceability_requirements || "",
    },
  });

  // Set initial AI data if provided
  React.useEffect(() => {
    if (aiData) {
      // Set AI-generated values if form fields are empty
      if (!form.watch('foreseeable_sequence_events') && aiData.foreseeable_sequence_events) {
        form.setValue('foreseeable_sequence_events', aiData.foreseeable_sequence_events);
      }
      if (!form.watch('hazardous_situation') && aiData.hazardous_situation) {
        form.setValue('hazardous_situation', aiData.hazardous_situation);
      }
      if (!form.watch('potential_harm') && aiData.potential_harm) {
        form.setValue('potential_harm', aiData.potential_harm);
      }
    }
  }, [aiData, form]);

  const requirementOptions = requirements.map(req => ({
    value: req.requirement_id,
    label: `${req.requirement_id}: ${req.description.substring(0, 60)}${req.description.length > 60 ? '...' : ''}`
  }));

  // Auto-calculate risk level from severity × probability
  const calculateRiskLevel = (severity?: number, probability?: number): "Low" | "Medium" | "High" | "Very High" | undefined => {
    if (!severity || !probability) return undefined;
    const riskScore = severity * probability;
    if (riskScore <= 4) return "Low";
    if (riskScore <= 9) return "Medium";
    if (riskScore <= 15) return "High";
    return "Very High";
  };

  // Map risk_control_type to legacy mitigation_type (required NOT NULL field)
  const mapRiskControlToMitigationType = (riskControlType?: string): MitigationType => {
    switch (riskControlType) {
      case 'design': return 'Design Control';
      case 'protective_measure': return 'Protective Measure';
      case 'information_for_safety': return 'Information for Safety';
      default: return 'Information for Safety';
    }
  };

  const handleSubmit = (values: FormData) => {
    // Auto-calculate risk levels from severity × probability
    const initialRisk = calculateRiskLevel(values.initial_severity, values.initial_probability);
    const residualRisk = calculateRiskLevel(values.residual_severity, values.residual_probability);

    const updatedValues: CreateHazardInput = {
      ...values,
      category: values.category || undefined,
      // Cast number types to SeverityLevel/ProbabilityLevel
      initial_severity: values.initial_severity as SeverityLevel,
      initial_probability: values.initial_probability as ProbabilityLevel,
      initial_risk: initialRisk, // Auto-calculated
      residual_severity: values.residual_severity as SeverityLevel,
      residual_probability: values.residual_probability as ProbabilityLevel,
      residual_risk: residualRisk, // Auto-calculated
      // Map new field to legacy required field
      mitigation_type: mapRiskControlToMitigationType(values.risk_control_type),
      mitigation_measure: values.mitigation_measure || '', // Ensure not null
      linked_requirements: selectedRequirements.join(', '),
      productScope,
    };
    onSubmit(updatedValues, selectedRequirements);
  };

  const handleAIFillField = (fieldName: string, value: string | number) => {
    form.setValue(fieldName as any, value, { shouldDirty: true });
  };

  const handleAIFillAll = (suggestion: HazardFillSuggestion) => {
    form.setValue("description", suggestion.description, { shouldDirty: true });
    if (suggestion.category) {
      form.setValue("category", suggestion.category, { shouldDirty: true });
    }
    form.setValue("foreseeable_sequence_events", suggestion.foreseeable_sequence_events, { shouldDirty: true });
    form.setValue("hazardous_situation", suggestion.hazardous_situation, { shouldDirty: true });
    form.setValue("potential_harm", suggestion.potential_harm, { shouldDirty: true });
    form.setValue("initial_severity", suggestion.initial_severity, { shouldDirty: true });
    form.setValue("initial_probability", suggestion.initial_probability, { shouldDirty: true });
    form.setValue("risk_control_measure", suggestion.risk_control_measure, { shouldDirty: true });
    if (suggestion.risk_control_type) {
      form.setValue("risk_control_type", suggestion.risk_control_type as RiskControlType, { shouldDirty: true });
    }
    form.setValue("residual_severity", suggestion.residual_severity, { shouldDirty: true });
    form.setValue("residual_probability", suggestion.residual_probability, { shouldDirty: true });
    if (suggestion.verification_implementation) {
      form.setValue("verification_implementation", suggestion.verification_implementation, { shouldDirty: true });
    }
    if (suggestion.verification_effectiveness) {
      form.setValue("verification_effectiveness", suggestion.verification_effectiveness, { shouldDirty: true });
    }
  };

  const riskControlTypes: { value: RiskControlType; label: string }[] = [
    { value: "design", label: lang('riskManagement.form.riskControlTypes.designControl') },
    { value: "protective_measure", label: lang('riskManagement.form.riskControlTypes.protectiveMeasure') },
    { value: "information_for_safety", label: lang('riskManagement.form.riskControlTypes.informationForSafety') },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* AI Fill Panel - shown for draft hazards linked from requirements */}
        {aiFillContext && (
          <HazardAIFillPanel
            companyId={aiFillContext.companyId}
            productId={aiFillContext.productId}
            requirementDescription={aiFillContext.requirementDescription}
            requirementId={aiFillContext.requirementId}
            requirementCategory={aiFillContext.requirementCategory}
            existingHazardData={aiFillContext.existingHazardData}
            onApplyField={handleAIFillField}
            onApplyAll={handleAIFillAll}
          />
        )}

        {/* Two-column grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN: Hazard Identification + Traceability */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{lang('riskManagement.form.sections.hazardIdentification')}</h3>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang('riskManagement.form.labels.hazardDescription')} *</FormLabel>
                  <FormDescription>
                    {lang('riskManagement.form.descriptions.hazardDescription')}
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder={lang('riskManagement.form.placeholders.hazardDescription')}
                      className="min-h-[60px] resize-none"
                      style={{ fieldSizing: 'content' } as React.CSSProperties}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => {
                const selectedLabel = HAZARD_CATEGORIES.find(c => c.value === field.value)?.label;
                return (
                  <FormItem>
                    <FormLabel>ISO 14971 Hazard Category</FormLabel>
                    <FormDescription>
                      Select the hazard category per ISO 14971 Annex C / ISO 13485 Clause 7
                    </FormDescription>
                    <Popover>
                      <FormControl>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          >
                            <span className={selectedLabel ? "" : "text-muted-foreground"}>
                              {selectedLabel || "Select a hazard category..."}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </button>
                        </PopoverTrigger>
                      </FormControl>
                      <PopoverContent className="w-[520px] p-2 z-[200]" align="start">
                        <p className="text-xs text-muted-foreground mb-2 px-2">Categories per ISO 14971 Annex C & ISO 13485 Clause 7</p>
                        <div className="grid grid-cols-2 gap-1">
                          {HAZARD_CATEGORIES.map((cat) => (
                            <button
                              key={cat.value}
                              type="button"
                              className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors ${field.value === cat.value ? "bg-accent font-medium" : ""}`}
                              onClick={() => field.onChange(cat.value)}
                            >
                              <Check className={`h-3.5 w-3.5 shrink-0 ${field.value === cat.value ? "opacity-100" : "opacity-0"}`} />
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="foreseeable_sequence_events"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <AIApprovalField
                      label={lang('riskManagement.form.labels.foreseeableSequenceOfEvents')}
                      description={lang('riskManagement.form.descriptions.foreseeableSequenceOfEvents')}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder={lang('riskManagement.form.placeholders.foreseeableSequenceOfEvents')}
                      isAIGenerated={!!aiData?.foreseeable_sequence_events && !aiApprovalStates.foreseeable_sequence_events}
                      aiConfidence={aiData?.confidence}
                      isApproved={aiApprovalStates.foreseeable_sequence_events}
                      onApprove={() => setAiApprovalStates(prev => ({ ...prev, foreseeable_sequence_events: true }))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hazardous_situation"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <AIApprovalField
                      label={lang('riskManagement.form.labels.hazardousSituation')}
                      description={lang('riskManagement.form.descriptions.hazardousSituation')}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder={lang('riskManagement.form.placeholders.hazardousSituation')}
                      isAIGenerated={!!aiData?.hazardous_situation && !aiApprovalStates.hazardous_situation}
                      aiConfidence={aiData?.confidence}
                      isApproved={aiApprovalStates.hazardous_situation}
                      onApprove={() => setAiApprovalStates(prev => ({ ...prev, hazardous_situation: true }))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="potential_harm"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <AIApprovalField
                      label={lang('riskManagement.form.labels.potentialHarm')}
                      description={lang('riskManagement.form.descriptions.potentialHarm')}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder={lang('riskManagement.form.placeholders.potentialHarm')}
                      isAIGenerated={!!aiData?.potential_harm && !aiApprovalStates.potential_harm}
                      aiConfidence={aiData?.confidence}
                      isApproved={aiApprovalStates.potential_harm}
                      onApprove={() => setAiApprovalStates(prev => ({ ...prev, potential_harm: true }))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Applicability Section */}
            {effectiveCompanyId && effectiveProductId && (
              <div className="pt-2">
                <HazardProductScope
                  companyId={effectiveCompanyId}
                  currentProductId={effectiveProductId}
                  value={productScope}
                  onChange={setProductScope}
                />
              </div>
            )}

            {/* Traceability Section - in left column */}
            <h3 className="text-lg font-medium pt-2">{lang('riskManagement.form.sections.traceability')}</h3>

            <FormItem>
              <FormLabel>{lang('riskManagement.form.labels.linkedRequirements')}</FormLabel>
              <FormDescription>
                {lang('riskManagement.form.descriptions.linkedRequirements')}
              </FormDescription>
              <FormControl>
                <MultiSelect
                  options={requirementOptions}
                  selected={selectedRequirements}
                  onChange={setSelectedRequirements}
                  placeholder={lang('riskManagement.form.placeholders.linkedRequirements')}
                />
              </FormControl>
            </FormItem>
          </div>

          {/* RIGHT COLUMN: Risk Assessment + Controls + Verification */}
          <div className="space-y-4">
            {/* Initial Risk Assessment */}
            <h3 className="text-lg font-medium">{lang('riskManagement.form.sections.initialRiskAssessment')}</h3>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="initial_severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{lang('riskManagement.form.labels.severity')} *</FormLabel>
                    <FormDescription>Rate before applying risk controls</FormDescription>
                    <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={lang('riskManagement.form.placeholders.selectSeverity')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 - {lang('riskManagement.form.severity.negligible')}</SelectItem>
                        <SelectItem value="2">2 - {lang('riskManagement.form.severity.minor')}</SelectItem>
                        <SelectItem value="3">3 - {lang('riskManagement.form.severity.serious')}</SelectItem>
                        <SelectItem value="4">4 - {lang('riskManagement.form.severity.major')}</SelectItem>
                        <SelectItem value="5">5 - {lang('riskManagement.form.severity.catastrophic')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initial_probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{lang('riskManagement.form.labels.probability')} *</FormLabel>
                    <FormDescription>Rate before applying risk controls</FormDescription>
                    <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={lang('riskManagement.form.placeholders.selectProbability')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 - {lang('riskManagement.form.probability.veryRare')}</SelectItem>
                        <SelectItem value="2">2 - {lang('riskManagement.form.probability.rare')}</SelectItem>
                        <SelectItem value="3">3 - {lang('riskManagement.form.probability.occasional')}</SelectItem>
                        <SelectItem value="4">4 - {lang('riskManagement.form.probability.likely')}</SelectItem>
                        <SelectItem value="5">5 - {lang('riskManagement.form.probability.veryLikely')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <RiskMatrix
              selectedSeverity={form.watch("initial_severity") as SeverityLevel}
              selectedProbability={form.watch("initial_probability") as ProbabilityLevel}
              onCellClick={(severity, probability) => {
                form.setValue("initial_severity", severity);
                form.setValue("initial_probability", probability);
              }}
            />

            {/* Risk Control Measures */}
            <h3 className="text-lg font-medium pt-2">{lang('riskManagement.form.sections.riskControlMeasures')}</h3>

            <FormField
              control={form.control}
              name="risk_control_measure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang('riskManagement.form.labels.riskControlMeasure')} *</FormLabel>
                  <FormDescription>
                    {lang('riskManagement.form.descriptions.riskControlMeasure')}
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder={lang('riskManagement.form.placeholders.riskControlMeasure')}
                      className="min-h-[60px] resize-none"
                      style={{ fieldSizing: 'content' } as React.CSSProperties}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="risk_control_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang('riskManagement.form.labels.typeOfRiskControl')} *</FormLabel>
                  <FormDescription>Per ISO 14971: Design → Protective Measure → Information for Safety (priority order)</FormDescription>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={lang('riskManagement.form.placeholders.selectRiskControlType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {riskControlTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Residual Risk Assessment */}
            <h3 className="text-lg font-medium pt-2">{lang('riskManagement.form.sections.residualRiskAssessment')}</h3>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="residual_severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{lang('riskManagement.form.labels.residualSeverity')} *</FormLabel>
                    <FormDescription>Rate after risk controls are implemented</FormDescription>
                    <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={lang('riskManagement.form.placeholders.selectSeverity')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 - {lang('riskManagement.form.severity.negligible')}</SelectItem>
                        <SelectItem value="2">2 - {lang('riskManagement.form.severity.minor')}</SelectItem>
                        <SelectItem value="3">3 - {lang('riskManagement.form.severity.serious')}</SelectItem>
                        <SelectItem value="4">4 - {lang('riskManagement.form.severity.major')}</SelectItem>
                        <SelectItem value="5">5 - {lang('riskManagement.form.severity.catastrophic')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="residual_probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{lang('riskManagement.form.labels.residualProbability')} *</FormLabel>
                    <FormDescription>Rate after risk controls are implemented</FormDescription>
                    <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={lang('riskManagement.form.placeholders.selectProbability')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 - {lang('riskManagement.form.probability.veryRare')}</SelectItem>
                        <SelectItem value="2">2 - {lang('riskManagement.form.probability.rare')}</SelectItem>
                        <SelectItem value="3">3 - {lang('riskManagement.form.probability.occasional')}</SelectItem>
                        <SelectItem value="4">4 - {lang('riskManagement.form.probability.likely')}</SelectItem>
                        <SelectItem value="5">5 - {lang('riskManagement.form.probability.veryLikely')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <RiskMatrix
              selectedSeverity={form.watch("residual_severity") as SeverityLevel}
              selectedProbability={form.watch("residual_probability") as ProbabilityLevel}
              onCellClick={(severity, probability) => {
                form.setValue("residual_severity", severity);
                form.setValue("residual_probability", probability);
              }}
            />

            {/* Verification and Validation */}
            <h3 className="text-lg font-medium pt-2">{lang('riskManagement.form.sections.verificationValidation')}</h3>

            <FormField
              control={form.control}
              name="verification_implementation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang('riskManagement.form.labels.verificationOfImplementation')}</FormLabel>
                  <FormDescription>
                    {lang('riskManagement.form.descriptions.verificationOfImplementation')}
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder={lang('riskManagement.form.placeholders.verificationOfImplementation')}
                      className="min-h-[60px] resize-none"
                      style={{ fieldSizing: 'content' } as React.CSSProperties}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="verification_effectiveness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{lang('riskManagement.form.labels.verificationOfEffectiveness')}</FormLabel>
                  <FormDescription>
                    {lang('riskManagement.form.descriptions.verificationOfEffectiveness')}
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder={lang('riskManagement.form.placeholders.verificationOfEffectiveness')}
                      className="min-h-[60px] resize-none"
                      style={{ fieldSizing: 'content' } as React.CSSProperties}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-between pt-4">
          {deleteButton || <div />}
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              {lang('riskManagement.form.buttons.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? lang('riskManagement.form.buttons.saving') : lang('riskManagement.form.buttons.saveHazard')}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}