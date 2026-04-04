import React, { useState } from 'react';
import { AIContextSourcesPanel } from '@/components/product/ai-assistant/AIContextSourcesPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Info, Check, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  HazardAIService,
  type HazardSuggestion,
  type HazardAIRequest
} from '@/services/hazardAIService';
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { deduplicateSuggestions } from '@/utils/deduplicateSuggestions';
import { toast } from 'sonner';

interface HazardAISuggestionsDialogProps {
  productId: string;
  companyId: string;
  onAddHazards: (suggestions: HazardSuggestion[]) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
}

const HAZARD_CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
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

const categoryColors: Record<string, string> = {
  'Use Error': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'Hardware Failure': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'Software Failure': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Environmental': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Energy Hazard': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'Biological': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'Material': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'User Interface': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  'Manufacturing': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export function HazardAISuggestionsDialog({
  productId,
  companyId,
  onAddHazards,
  open,
  onOpenChange,
  isLoading: externalLoading
}: HazardAISuggestionsDialogProps) {
  const { lang } = useTranslation();
  const [suggestions, setSuggestions] = useState<HazardSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [outputLanguage, setOutputLanguage] = useState('en');

  const handleSuggestionToggle = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedSuggestions.size === suggestions.length) {
      setSelectedSuggestions(new Set());
    } else {
      setSelectedSuggestions(new Set(suggestions.map((_, index) => index)));
    }
  };

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);
    setError(null);
    setSuggestions([]);

    try {
      const [productResponse, requirementsResponse, existingHazardsResponse] = await Promise.all([
        supabase
          .from('products')
          .select('name, class, intended_purpose_data')
          .eq('id', productId)
          .single(),
        supabase
          .from('requirement_specifications')
          .select('id, requirement_id, description, category, linked_risks')
          .eq('product_id', productId),
        supabase
          .from('hazards')
          .select('description')
          .eq('product_id', productId)
      ]);

      const { data: productData, error } = productResponse;
      const { data: requirements, error: reqError } = requirementsResponse;
      const existingDescriptions = (existingHazardsResponse.data || []).map(h => h.description).filter(Boolean);

      if (error) {
        throw new Error('Failed to fetch product data');
      }

      const purposeData = productData.intended_purpose_data || {};
      
      const request: HazardAIRequest = {
        companyId,
        categoryFilter: categoryFilter !== 'all' ? categoryFilter : undefined,
        productData: {
          clinical_purpose: (purposeData as any)?.clinicalPurpose || '',
          indications_for_use: (purposeData as any)?.indications || '',
          target_population: Array.isArray((purposeData as any)?.targetPopulation) 
            ? (purposeData as any).targetPopulation.join(', ') 
            : (purposeData as any)?.targetPopulation || '',
          use_environment: Array.isArray((purposeData as any)?.useEnvironment) 
            ? (purposeData as any).useEnvironment.join(', ') 
            : (purposeData as any)?.useEnvironment || '',
          duration_of_use: (purposeData as any)?.durationOfUse || '',
          device_class: productData.class || '',
          product_name: productData.name || ''
        },
        requirementSpecifications: requirements || [],
        existingItems: existingDescriptions,
        additionalPrompt: additionalPrompt || undefined,
        outputLanguage: outputLanguage || undefined,
      } as any;

      const response = await HazardAIService.generateHazardSuggestions(request);

      if (response.success && response.suggestions) {
        const { filtered, removedCount } = deduplicateSuggestions(
          response.suggestions,
          existingDescriptions,
          s => s.description
        );
        if (removedCount > 0) {
          toast.info(`${removedCount} duplicate suggestion(s) filtered out`);
        }
        setSuggestions(filtered);
      } else {
        throw new Error(response.error || 'Failed to generate suggestions');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate AI suggestions';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSelected = async () => {
    try {
      const selected = Array.from(selectedSuggestions).map(index => suggestions[index]);
      await onAddHazards(selected);
      
      const remainingSuggestions = suggestions.filter((_, index) => !selectedSuggestions.has(index));
      setSuggestions(remainingSuggestions);
      setSelectedSuggestions(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add hazards');
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.8) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const isLoading = externalLoading || isGenerating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {lang('riskManagement.aiDialog.title')}
            {suggestions.length > 0 && <Badge variant="secondary">{lang('riskManagement.aiDialog.suggestionsCount', { count: suggestions.length })}</Badge>}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {lang('riskManagement.aiDialog.description')}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category filter dropdown */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground whitespace-nowrap">Category:</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HAZARD_CATEGORY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {suggestions.length === 0 && !isLoading && (
            <AIContextSourcesPanel
              productId={productId}
              additionalSources={['Requirement Specifications']}
              mode="select"
              onPromptChange={setAdditionalPrompt}
              onLanguageChange={setOutputLanguage}
            />
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {lang('riskManagement.aiDialog.loadingState')}
                </p>
              </div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {error || lang('riskManagement.aiDialog.emptyState')}
              </p>
              <Button onClick={handleGenerateSuggestions}>
                <Sparkles className="h-4 w-4 mr-2" />
                {lang('riskManagement.aiDialog.generateHazards')}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedSuggestions.size === suggestions.length ? lang('riskManagement.aiDialog.deselectAll') : lang('riskManagement.aiDialog.selectAll')}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleGenerateSuggestions}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {lang('riskManagement.aiDialog.generateMore')}
                  </Button>
                  <Button
                    onClick={handleAddSelected}
                    disabled={selectedSuggestions.size === 0}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {lang('riskManagement.aiDialog.addSelected', { count: selectedSuggestions.size })}
                  </Button>
                </div>
              </div>

              <div className="grid gap-3">
                {suggestions.map((suggestion, index) => (
                  <Card
                    key={index}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedSuggestions.has(index) ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleSuggestionToggle(index)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedSuggestions.has(index)}
                          onChange={() => handleSuggestionToggle(index)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium leading-relaxed">
                                {suggestion.description}
                              </p>
                              <Badge
                                variant="outline"
                                className={`mt-1 text-xs ${categoryColors[suggestion.category] || categoryColors['Use Error']}`}
                              >
                                {suggestion.category}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className={`text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                                      {Math.round(suggestion.confidence * 100)}%
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{lang('riskManagement.aiDialog.confidenceScore')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>

                          <div className="grid gap-2 text-xs">
                            {suggestion.hazardous_situation && (
                              <div className="flex items-start gap-1">
                                <span className="font-medium text-orange-600 dark:text-orange-400 min-w-0 flex-shrink-0">{lang('riskManagement.aiDialog.hazardousSituation')}</span>
                                <span className="text-muted-foreground">{suggestion.hazardous_situation}</span>
                              </div>
                            )}
                            {suggestion.potential_harm && (
                              <div className="flex items-start gap-1">
                                <span className="font-medium text-red-600 dark:text-red-400 min-w-0 flex-shrink-0">{lang('riskManagement.aiDialog.potentialHarm')}</span>
                                <span className="text-muted-foreground">{suggestion.potential_harm}</span>
                              </div>
                            )}
                            {suggestion.foreseeable_sequence_events && (
                              <div className="flex items-start gap-1">
                                <span className="font-medium text-blue-600 dark:text-blue-400 min-w-0 flex-shrink-0">{lang('riskManagement.aiDialog.sequenceOfEvents')}</span>
                                <span className="text-muted-foreground">{suggestion.foreseeable_sequence_events}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-start gap-1">
                            <Info className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {suggestion.rationale}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}