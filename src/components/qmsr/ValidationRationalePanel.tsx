import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, FileText, CheckCircle, Clock, AlertTriangle, Link2, Info, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGenerateRationale, useProcessValidationRationales, useCreateProcessValidationRationale, useGenerateDocumentId } from "@/hooks/useRationales";
import { toast } from "sonner";
import type { 
  SeverityOfHarm, 
  ProbabilityOfOccurrence, 
  ProcessType,
  ValidationRigor,
  ValidationDetermination 
} from "@/types/riskBasedRationale";
import { mapSeverityToHarm, mapProbabilityToOccurrence, getRecommendedRigor, getRecommendedConfidenceInterval } from "@/types/riskBasedRationale";
import type { Hazard } from "@/components/product/design-risk-controls/risk-management/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ValidationRationalePanelProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function ValidationRationalePanel({ productId, companyId, disabled = false }: ValidationRationalePanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [showExistingRationales, setShowExistingRationales] = useState(false);
  
  // Form state
  const [activityDescription, setActivityDescription] = useState("");
  const [processType, setProcessType] = useState<ProcessType>("design_verification");
  const [selectedHazardId, setSelectedHazardId] = useState<string>("");
  const [hazardDescription, setHazardDescription] = useState("");
  const [severityOfHarm, setSeverityOfHarm] = useState<SeverityOfHarm>("Major");
  const [probability, setProbability] = useState<ProbabilityOfOccurrence>("Occasional");
  const [generatedRationale, setGeneratedRationale] = useState("");
  const [validationRigor, setValidationRigor] = useState<ValidationRigor>("Medium");
  const [confidenceInterval, setConfidenceInterval] = useState("90/90");
  const [determination, setDetermination] = useState<ValidationDetermination>("Proceed with Standard Verification");

  // Fetch hazards for this product
  const { data: hazards = [] } = useQuery({
    queryKey: ['hazards', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hazards')
        .select('*')
        .eq('product_id', productId)
        .order('hazard_id', { ascending: true });
      
      if (error) throw error;
      return data as Hazard[];
    },
  });

  // Fetch existing rationales
  const { data: existingRationales = [], isLoading: isLoadingRationales } = useProcessValidationRationales(companyId, productId);

  const generateRationale = useGenerateRationale();
  const createRationale = useCreateProcessValidationRationale();
  const generateDocId = useGenerateDocumentId();

  // When hazard is selected, auto-fill severity/probability
  const handleHazardSelect = (hazardId: string) => {
    setSelectedHazardId(hazardId);
    const hazard = hazards.find(h => h.id === hazardId);
    if (hazard) {
      setHazardDescription(hazard.description);
      if (hazard.initial_severity) {
        setSeverityOfHarm(mapSeverityToHarm(hazard.initial_severity));
      }
      if (hazard.initial_probability) {
        setProbability(mapProbabilityToOccurrence(hazard.initial_probability));
      }
      // Auto-update recommended rigor
      const rigor = getRecommendedRigor(
        mapSeverityToHarm(hazard.initial_severity || 3),
        mapProbabilityToOccurrence(hazard.initial_probability || 3)
      );
      setValidationRigor(rigor);
      setConfidenceInterval(getRecommendedConfidenceInterval(rigor));
    }
  };

  // Update rigor when severity/probability changes
  const handleSeverityChange = (value: SeverityOfHarm) => {
    setSeverityOfHarm(value);
    const rigor = getRecommendedRigor(value, probability);
    setValidationRigor(rigor);
    setConfidenceInterval(getRecommendedConfidenceInterval(rigor));
  };

  const handleProbabilityChange = (value: ProbabilityOfOccurrence) => {
    setProbability(value);
    const rigor = getRecommendedRigor(severityOfHarm, value);
    setValidationRigor(rigor);
    setConfidenceInterval(getRecommendedConfidenceInterval(rigor));
  };

  const handleGenerateRationale = async () => {
    if (!activityDescription || !hazardDescription) {
      toast.error("Please fill in activity description and hazard information");
      return;
    }

    try {
      const result = await generateRationale.mutateAsync({
        type: 'validation',
        context: {
          activity_description: activityDescription,
          process_type: processType,
          hazard_identified: hazardDescription,
          severity_of_harm: severityOfHarm,
          probability_of_occurrence: probability,
        },
        companyId,
      });

      setGeneratedRationale(result.rationale_text);
      if (result.validation_rigor) setValidationRigor(result.validation_rigor);
      if (result.confidence_interval) setConfidenceInterval(result.confidence_interval);
      if (result.determination && (result.determination === 'Proceed with High Rigor Validation' || result.determination === 'Proceed with Standard Verification')) {
        setDetermination(result.determination);
      }
      
      toast.success("AI rationale generated successfully");
    } catch (error) {
      console.error("Failed to generate rationale:", error);
    }
  };

  const handleSaveRationale = async () => {
    if (!generatedRationale) {
      toast.error("Please generate a rationale first");
      return;
    }

    try {
      // Generate document ID
      const documentId = await generateDocId.mutateAsync({
        prefix: 'RBR-ENG',
        companyId,
      });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      await createRationale.mutateAsync({
        document_id: documentId,
        product_id: productId,
        company_id: companyId,
        activity_description: activityDescription,
        process_type: processType,
        hazard_identified: hazardDescription,
        linked_hazard_id: selectedHazardId || undefined,
        severity_of_harm: severityOfHarm,
        probability_of_occurrence: probability,
        rationale_text: generatedRationale,
        validation_rigor: validationRigor,
        confidence_interval: confidenceInterval,
        qmsr_clause_reference: "7.1",
        determination,
        created_by: user?.id || '',
        status: 'Draft',
      });

      // Reset form
      setIsCreating(false);
      setActivityDescription("");
      setHazardDescription("");
      setGeneratedRationale("");
      setSelectedHazardId("");
    } catch (error) {
      console.error("Failed to save rationale:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case 'Pending Approval':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" /> Draft</Badge>;
    }
  };

  const getRigorBadge = (rigor: ValidationRigor) => {
    switch (rigor) {
      case 'High':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> High Rigor</Badge>;
      case 'Medium':
        return <Badge variant="secondary" className="gap-1">Medium Rigor</Badge>;
      default:
        return <Badge variant="outline">Low Rigor</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                QMSR Process Validation Rationale
              </CardTitle>
              <CardDescription>
                Document risk-based justification for validation rigor per QMSR Clause 7.1. Link hazards from your Risk Management File to justify testing sample sizes and confidence intervals.
              </CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-sm">
                    Under QMSR (effective Feb 2, 2026), you must document <strong>why</strong> the validation effort is proportionate to the risk. This panel auto-generates FDA-compliant rationale text.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button onClick={() => setIsCreating(!isCreating)} disabled={disabled}>
              <Sparkles className="h-4 w-4 mr-2" />
              {isCreating ? "Cancel" : "Create New Rationale"}
            </Button>
            {existingRationales.length > 0 && (
              <Button variant="outline" onClick={() => setShowExistingRationales(!showExistingRationales)}>
                <FileText className="h-4 w-4 mr-2" />
                View Existing ({existingRationales.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create New Rationale Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Process Validation Rationale</CardTitle>
            <CardDescription>Document ID will be auto-generated as RBR-ENG-XXXX</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Activity Description */}
            <div className="space-y-2">
              <Label>Activity Description *</Label>
              <Textarea
                placeholder="e.g., Performance testing of the automated ultrasonic welder"
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {/* Process Type */}
            <div className="space-y-2">
              <Label>Process Type</Label>
              <Select value={processType} onValueChange={(v) => setProcessType(v as ProcessType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manufacturing">Manufacturing Process</SelectItem>
                  <SelectItem value="design_verification">Design Verification</SelectItem>
                  <SelectItem value="test_method">Test Method</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Link to Hazard */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Link to Hazard (Optional)
              </Label>
              <Select value={selectedHazardId} onValueChange={handleHazardSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hazard from Risk Management File..." />
                </SelectTrigger>
                <SelectContent>
                  {hazards.map((hazard) => (
                    <SelectItem key={hazard.id} value={hazard.id}>
                      {hazard.hazard_id}: {hazard.description.substring(0, 50)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hazards.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hazards found. Add hazards in the Risk Management module to link them here.
                </p>
              )}
            </div>

            {/* Hazard Description */}
            <div className="space-y-2">
              <Label>Hazard Identified *</Label>
              <Textarea
                placeholder="e.g., Weak bond leading to hermetic seal failure"
                value={hazardDescription}
                onChange={(e) => setHazardDescription(e.target.value)}
              />
            </div>

            {/* Risk Classification */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Severity of Harm</Label>
                <Select value={severityOfHarm} onValueChange={(v) => handleSeverityChange(v as SeverityOfHarm)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="Major">Major</SelectItem>
                    <SelectItem value="Minor">Minor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Probability of Occurrence</Label>
                <Select value={probability} onValueChange={(v) => handleProbabilityChange(v as ProbabilityOfOccurrence)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Frequent">Frequent</SelectItem>
                    <SelectItem value="Occasional">Occasional</SelectItem>
                    <SelectItem value="Remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Recommended Values Preview */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Recommended Based on Risk Classification:</p>
              <div className="flex gap-4 text-sm">
                <span>Validation Rigor: <strong>{validationRigor}</strong></span>
                <span>Confidence Interval: <strong>{confidenceInterval}</strong></span>
              </div>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerateRationale} 
              disabled={generateRationale.isPending || !activityDescription || !hazardDescription}
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {generateRationale.isPending ? "Generating..." : "Generate QMSR-Compliant Rationale"}
            </Button>

            {/* Generated Rationale */}
            {generatedRationale && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Generated Rationale Text</Label>
                  <Textarea
                    value={generatedRationale}
                    onChange={(e) => setGeneratedRationale(e.target.value)}
                    className="min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground">QMSR Clause Reference: 7.1</p>
                </div>

                {/* Determination */}
                <div className="space-y-2">
                  <Label>Determination</Label>
                  <Select value={determination} onValueChange={(v) => setDetermination(v as ValidationDetermination)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Proceed with High Rigor Validation">Proceed with High Rigor Validation</SelectItem>
                      <SelectItem value="Proceed with Standard Verification">Proceed with Standard Verification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Save Button */}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSaveRationale} 
                    disabled={createRationale.isPending}
                  >
                    {createRationale.isPending ? "Saving..." : "Save Rationale as Draft"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Existing Rationales */}
      <Collapsible open={showExistingRationales} onOpenChange={setShowExistingRationales}>
        <CollapsibleContent className="space-y-4">
          {isLoadingRationales ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              </CardContent>
            </Card>
          ) : existingRationales.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No validation rationales created yet for this product.
              </CardContent>
            </Card>
          ) : (
            existingRationales.map((rationale) => (
              <Card key={rationale.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {rationale.document_id}
                      </CardTitle>
                      <CardDescription>{rationale.activity_description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getRigorBadge(rationale.validation_rigor as ValidationRigor)}
                      {getStatusBadge(rationale.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Hazard:</span>
                      <span className="text-muted-foreground ml-2">{rationale.hazard_identified}</span>
                    </div>
                    <div>
                      <span className="font-medium">Severity:</span>
                      <span className="text-muted-foreground ml-2">{rationale.severity_of_harm}</span>
                    </div>
                    <div>
                      <span className="font-medium">Confidence Interval:</span>
                      <span className="text-muted-foreground ml-2">{rationale.confidence_interval}</span>
                    </div>
                    <div>
                      <span className="font-medium">Determination:</span>
                      <span className="text-muted-foreground ml-2">{rationale.determination}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{rationale.rationale_text}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    QMSR Clause: {rationale.qmsr_clause_reference} | Created: {new Date(rationale.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
