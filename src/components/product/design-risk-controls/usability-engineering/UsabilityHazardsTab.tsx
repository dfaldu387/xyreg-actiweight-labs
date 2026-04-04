import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ExternalLink, Info, Plus, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ComprehensiveHazardForm } from "../risk-management/ComprehensiveHazardForm";
import { CreateHazardInput } from "../risk-management/types";
import { hazardsService } from "@/services/hazardsService";
import { requirementSpecificationsService } from "@/services/requirementSpecificationsService";

const getCategoryDisplay = (category: string) => {
  const categoryMap: Record<string, string> = {
    'materials_patient_contact': 'Materials & Patient Contact',
    'combination_other_products': 'Combination with Other Products',
    'human_factors': 'Human Factors',
    'training_requirements': 'Training Requirements',
    'cleaning_maintenance': 'Cleaning & Maintenance',
    'negative_air_pressure': 'Negative Air Pressure',
    'electrical_energy': 'Electrical Energy',
    'sterility_requirements': 'Sterility Requirements',
    'critical_data_storage': 'Critical Data Storage',
    'software_use': 'Software Use',
    'disposal': 'Disposal',
    'manufacturing_residues': 'Manufacturing Residues',
    'transport_storage': 'Transport & Storage',
    'shelf_life': 'Shelf Life',
    'product_realization': 'Product Realization',
    'customer_requirements': 'Customer Requirements',
    'purchasing': 'Purchasing',
    'service_provision': 'Service Provision',
    'monitoring_devices': 'Monitoring Devices',
  };
  return categoryMap[category] || category;
};
import { toast } from "sonner";
import { UsabilityHazardAISuggestionsDialog } from "./UsabilityHazardAISuggestionsDialog";

interface UsabilityHazardsTabProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function UsabilityHazardsTab({ productId, companyId, disabled }: UsabilityHazardsTabProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);

  // Fetch registered hazards from hazards table
  const { data: registeredHazards, isLoading } = useQuery({
    queryKey: ['usability-hazards', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hazards')
        .select('*')
        .eq('product_id', productId)
        .or('hazard_id.ilike.HAZ-USE%,category.eq.human_factors')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const usabilityHazards = registeredHazards || [];

  // Fetch requirements for the hazard form
  const { data: requirements = [] } = useQuery({
    queryKey: ["requirement-specifications", productId],
    queryFn: () => requirementSpecificationsService.getByProductId(productId),
    enabled: isCreateDialogOpen && !!productId,
  });

  const handleNavigateToRiskManagement = (hazardId?: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', 'risk-management');
    newParams.set('riskSubTab', 'detailed');
    newParams.set('returnTo', 'usability-hazards');
    newParams.delete('subTab');
    if (hazardId) {
      newParams.set('highlightHazard', hazardId);
    }
    navigate(`?${newParams.toString()}`);
  };

  const handleCreateHazard = async (input: CreateHazardInput, requirementIds: string[]) => {
    setIsCreating(true);
    try {
      const usabilityInput = { ...input, category: 'human_factors' };
      const hazard = await hazardsService.createHazard(productId, companyId, usabilityInput, 'USE');
      
      if (requirementIds.length > 0) {
        const { traceabilityService } = await import('@/services/traceabilityService');
        await traceabilityService.updateHazardRequirementLinks(hazard.hazard_id, requirementIds);
      }

      queryClient.invalidateQueries({ queryKey: ['usability-hazards', productId] });
      queryClient.invalidateQueries({ queryKey: ['hazards', productId] });
      setIsCreateDialogOpen(false);
      toast.success(`Usability hazard ${hazard.hazard_id} created`);
    } catch (error) {
      console.error('Error creating usability hazard:', error);
      toast.error('Failed to create usability hazard');
    } finally {
      setIsCreating(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'catastrophic':
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'serious':
      case 'major':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'minor':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const existingDescriptions = usabilityHazards.map((h: any) => h.description || '').filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Usability-Related Hazards</h3>
          <p className="text-sm text-muted-foreground">
            IEC 62366-1 Clauses 5.3-5.4 - Hazard-Related Use Scenarios & User Interface Evaluation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsAIDialogOpen(true)}
            disabled={disabled}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Suggestions
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)} disabled={disabled}>
            <Plus className="h-4 w-4 mr-2" />
            Create Usability Hazard
          </Button>
          <Button variant="outline" onClick={() => handleNavigateToRiskManagement()} disabled={disabled}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Risk Management
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <Alert variant="default" className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
          This view shows usability-related hazards (HAZ-USE) per IEC 62366-1. These hazards are also tracked in the full{' '}
          <button onClick={() => handleNavigateToRiskManagement()} className="underline font-medium hover:text-blue-900 dark:hover:text-blue-200">
            Hazard Traceability Matrix
          </button>{' '}
          under Risk Management.
        </AlertDescription>
      </Alert>

      {/* Hazards List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : usabilityHazards.length > 0 ? (
        <div className="space-y-2">
          {usabilityHazards.map((hazard: any) => (
            <Card key={hazard.id} className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                  <span className="font-semibold text-sm">{hazard.hazard_id || 'Unnamed Hazard'}</span>
                  {hazard.description && (
                    <span className="text-sm text-muted-foreground truncate">{hazard.description}</span>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0 items-center">
                  {hazard.category && (
                    <Badge variant="outline" className="text-xs">
                      {getCategoryDisplay(hazard.category)}
                    </Badge>
                  )}
                  {hazard.severity && (
                    <Badge className={getSeverityColor(hazard.severity)} variant="secondary">
                      {hazard.severity}
                    </Badge>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleNavigateToRiskManagement(hazard.id)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View in Risk Management</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              {(hazard.potential_harm || hazard.initial_risk || hazard.hazardous_situation || hazard.foreseeable_sequence_events || hazard.risk_control_measure) && (
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm pl-6">
                  {hazard.foreseeable_sequence_events && (
                    <div><span className="font-medium text-muted-foreground">{hazard.foreseeable_sequence_events}</span></div>
                  )}
                  {hazard.hazardous_situation && (
                    <div><span className="font-medium text-muted-foreground">Root Cause:</span> <span>{hazard.hazardous_situation}</span></div>
                  )}
                  {hazard.potential_harm && (
                    <div><span className="font-medium text-muted-foreground">Harm:</span> <span>{hazard.potential_harm}</span></div>
                  )}
                  {hazard.initial_risk && (
                    <div><span className="font-medium text-muted-foreground">Initial Risk:</span> <span>{hazard.initial_risk}</span></div>
                  )}
                  {hazard.risk_control_measure && (
                    <div><span className="font-medium text-muted-foreground">Risk Control:</span> <span>{hazard.risk_control_measure}</span></div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No Usability-Related Hazards</h4>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              No hazards related to use errors or usability have been identified yet.
              Use AI Suggestions or create them manually.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} disabled={disabled}>
              <Plus className="h-4 w-4 mr-2" />
              Create Usability Hazard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Hazard Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Usability Hazard</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Create a HAZ-USE hazard for use errors and human factors issues per IEC 62366-1.
            </p>
          </DialogHeader>
          <ComprehensiveHazardForm
            requirements={requirements}
            onSubmit={handleCreateHazard}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={isCreating}
            initialData={{ category: 'human_factors' }}
          />
        </DialogContent>
      </Dialog>

      {/* AI Suggestions Dialog */}
      <UsabilityHazardAISuggestionsDialog
        open={isAIDialogOpen}
        onOpenChange={setIsAIDialogOpen}
        productId={productId}
        companyId={companyId}
        existingHazardDescriptions={existingDescriptions}
      />
    </div>
  );
}
