import React, { useState } from "react";
import { showNoCreditDialog } from '@/context/AiCreditContext';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sparkles, Check, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AIContextSourcesPanel } from "@/components/product/ai-assistant/AIContextSourcesPanel";

export interface HazardFillSuggestion {
  description: string;
  foreseeable_sequence_events: string;
  hazardous_situation: string;
  potential_harm: string;
  category: string;
  initial_severity: number;
  initial_probability: number;
  risk_control_measure: string;
  risk_control_type: string;
  residual_severity: number;
  residual_probability: number;
  verification_implementation: string;
  verification_effectiveness: string;
  rationale: string;
  confidence: number;
}

interface HazardAIFillPanelProps {
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
  onApplyField: (fieldName: string, value: string | number) => void;
  onApplyAll: (suggestion: HazardFillSuggestion) => void;
}

const FIELD_LABELS: Record<string, string> = {
  description: "Hazard Description",
  foreseeable_sequence_events: "Foreseeable Sequence of Events",
  hazardous_situation: "Hazardous Situation",
  potential_harm: "Potential Harm",
  category: "Category",
  initial_severity: "Initial Severity",
  initial_probability: "Initial Probability",
  risk_control_measure: "Risk Control Measure",
  risk_control_type: "Risk Control Type",
  residual_severity: "Residual Severity",
  residual_probability: "Residual Probability",
  verification_implementation: "Verification of Implementation",
  verification_effectiveness: "Verification of Effectiveness",
};

const CATEGORY_LABELS: Record<string, string> = {
  materials_patient_contact: "Materials & Patient Contact",
  combination_other_products: "Combination with Other Products",
  human_factors: "Human Factors",
  training_requirements: "Training Requirements",
  cleaning_maintenance: "Cleaning & Maintenance",
  negative_air_pressure: "Negative Air Pressure",
  electrical_energy: "Electrical Energy",
  sterility_requirements: "Sterility Requirements",
  critical_data_storage: "Critical Data Storage",
  software_use: "Software Use",
  disposal: "Disposal",
  manufacturing_residues: "Manufacturing Residues",
  transport_storage: "Transport & Storage",
  shelf_life: "Shelf Life",
  product_realization: "Product Realization",
  customer_requirements: "Customer Requirements",
  purchasing: "Purchasing",
  service_provision: "Service Provision",
  monitoring_devices: "Monitoring Devices",
};

const RISK_CONTROL_TYPE_LABELS: Record<string, string> = {
  design: "Design Control",
  protective_measure: "Protective Measure",
  information_for_safety: "Information for Safety",
};

const SEVERITY_LABELS: Record<number, string> = {
  1: "Negligible", 2: "Minor", 3: "Serious", 4: "Major", 5: "Catastrophic"
};

const PROBABILITY_LABELS: Record<number, string> = {
  1: "Very Rare", 2: "Rare", 3: "Occasional", 4: "Likely", 5: "Very Likely"
};

const SUGGESTABLE_FIELDS = [
  "description", "foreseeable_sequence_events", "hazardous_situation", "potential_harm",
  "category", "initial_severity", "initial_probability",
  "risk_control_measure", "risk_control_type",
  "residual_severity", "residual_probability",
  "verification_implementation", "verification_effectiveness",
];

function formatFieldValue(field: string, value: string | number): string {
  if (field === "category") return CATEGORY_LABELS[value as string] || String(value);
  if (field === "risk_control_type") return RISK_CONTROL_TYPE_LABELS[value as string] || String(value);
  if (field === "initial_severity" || field === "residual_severity") return `${value} - ${SEVERITY_LABELS[value as number] || ''}`;
  if (field === "initial_probability" || field === "residual_probability") return `${value} - ${PROBABILITY_LABELS[value as number] || ''}`;
  return String(value);
}

export function HazardAIFillPanel({
  companyId,
  productId,
  requirementDescription,
  requirementId,
  requirementCategory,
  existingHazardData,
  onApplyField,
  onApplyAll,
}: HazardAIFillPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<HazardFillSuggestion | null>(null);
  const [acceptedFields, setAcceptedFields] = useState<Set<string>>(new Set());
  const [rejectedFields, setRejectedFields] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [outputLanguage, setOutputLanguage] = useState('en');
  const [additionalPrompt, setAdditionalPrompt] = useState('');

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setSuggestion(null);
    setAcceptedFields(new Set());
    setRejectedFields(new Set());

    try {
      // Fetch product data for context (same pattern as HazardAISuggestionsDialog)
      const { data: product } = await supabase
        .from("products")
        .select("name, class, intended_purpose_data")
        .eq("id", productId)
        .single();

      const purposeData = (product?.intended_purpose_data || {}) as any;

      const { data, error } = await supabase.functions.invoke("ai-hazard-filler", {
        body: {
          companyId,
          requirementDescription,
          requirementId,
          requirementCategory,
          existingHazardData,
          productData: {
            product_name: product?.name || '',
            clinical_purpose: purposeData?.clinicalPurpose || '',
            indications_for_use: purposeData?.indications || '',
            target_population: Array.isArray(purposeData?.targetPopulation) ? purposeData.targetPopulation.join(', ') : purposeData?.targetPopulation || '',
            use_environment: Array.isArray(purposeData?.useEnvironment) ? purposeData.useEnvironment.join(', ') : purposeData?.useEnvironment || '',
            duration_of_use: purposeData?.durationOfUse || '',
            device_class: product?.class || '',
          },
        },
      });

      if (error) throw error;
      if (data?.error === 'NO_CREDITS') { showNoCreditDialog(); return; }
      if (!data?.success) throw new Error(data?.error || "AI generation failed");

      setSuggestion(data.suggestion);
      setIsExpanded(true);
    } catch (err: any) {
      console.error("[HazardAIFillPanel] Error:", err);
      if (err?.message !== 'NO_CREDITS') {
        toast.error("Failed to generate AI suggestions. Check your API key in Settings.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptField = (field: string) => {
    if (!suggestion) return;
    const value = (suggestion as any)[field];
    onApplyField(field, value);
    setAcceptedFields(prev => new Set(prev).add(field));
    setRejectedFields(prev => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  };

  const handleRejectField = (field: string) => {
    setRejectedFields(prev => new Set(prev).add(field));
    setAcceptedFields(prev => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  };

  const handleAcceptAll = () => {
    if (!suggestion) return;
    onApplyAll(suggestion);
    setAcceptedFields(new Set(SUGGESTABLE_FIELDS));
    setRejectedFields(new Set());
  };

  const pendingFields = SUGGESTABLE_FIELDS.filter(
    f => !acceptedFields.has(f) && !rejectedFields.has(f)
  );

  if (!suggestion) {
    return (
      <>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={isLoading}
            className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing requirement...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                AI Fill Hazard
              </>
            )}
          </Button>
          {!isLoading && (
            <span className="text-xs text-muted-foreground">
              Analyze the linked requirement and suggest all fields
            </span>
          )}
        </div>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                AI Fill Hazard
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Review the context sources that will be used for AI generation.
              </p>
            </DialogHeader>
            <AIContextSourcesPanel
              productId={productId}
              additionalSources={[
                `Requirement: ${requirementDescription?.substring(0, 60) || requirementId}`,
                ...(requirementCategory ? [`Category: ${requirementCategory}`] : []),
              ]}
              mode="select"
              onLanguageChange={setOutputLanguage}
              onPromptChange={setAdditionalPrompt}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button onClick={() => { setConfirmOpen(false); fetchSuggestions(); }}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">AI Suggestions</span>
          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
            {Math.round((suggestion.confidence || 0.85) * 100)}% confidence
          </Badge>
          {acceptedFields.size > 0 && (
            <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-300">
              {acceptedFields.size} accepted
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {pendingFields.length > 0 && (
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={handleAcceptAll}
              className="h-7 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Accept All ({pendingFields.length})
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 px-2"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setSuggestion(null);
              setAcceptedFields(new Set());
              setRejectedFields(new Set());
            }}
            className="h-7 px-2 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {suggestion.rationale && (
        <p className="text-xs text-amber-700 italic">{suggestion.rationale}</p>
      )}

      {isExpanded && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {SUGGESTABLE_FIELDS.map(field => {
            const value = (suggestion as any)[field];
            if (value === undefined || value === null) return null;
            const isAccepted = acceptedFields.has(field);
            const isRejected = rejectedFields.has(field);

            return (
              <div
                key={field}
                className={cn(
                  "flex items-start gap-3 p-2 rounded-md border text-sm",
                  isAccepted && "bg-emerald-50 border-emerald-200",
                  isRejected && "bg-gray-50 border-gray-200 opacity-50",
                  !isAccepted && !isRejected && "bg-white border-amber-200"
                )}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-muted-foreground block mb-0.5">
                    {FIELD_LABELS[field] || field}
                  </span>
                  <span className="text-sm break-words">
                    {formatFieldValue(field, value)}
                  </span>
                </div>
                {!isAccepted && !isRejected && (
                  <div className="flex gap-1 shrink-0 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAcceptField(field)}
                      className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRejectField(field)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                {isAccepted && (
                  <Badge className="shrink-0 text-xs bg-emerald-100 text-emerald-700 border-emerald-300">
                    <Check className="h-3 w-3 mr-0.5" /> Applied
                  </Badge>
                )}
                {isRejected && (
                  <Badge variant="outline" className="shrink-0 text-xs text-gray-500">
                    Skipped
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
