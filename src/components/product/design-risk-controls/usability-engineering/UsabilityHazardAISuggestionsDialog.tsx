import React, { useState } from 'react';
import { AIContextSourcesPanel } from '@/components/product/ai-assistant/AIContextSourcesPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Info, Check, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HazardSuggestion } from '@/services/hazardAIService';
import { generateUsabilityHazardSuggestions } from '@/services/usabilityHazardAIService';
import { hazardsService } from '@/services/hazardsService';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UsabilityHazardAISuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
  existingHazardDescriptions: string[];
}

export function UsabilityHazardAISuggestionsDialog({
  open,
  onOpenChange,
  productId,
  companyId,
  existingHazardDescriptions,
}: UsabilityHazardAISuggestionsDialogProps) {
  const queryClient = useQueryClient();
  const [suggestions, setSuggestions] = useState<HazardSuggestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusCategory, setFocusCategory] = useState('all');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [outputLanguage, setOutputLanguage] = useState('en');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setSuggestions([]);
    try {
      const { data: productData } = await supabase
        .from('products')
        .select('name, class, intended_purpose_data')
        .eq('id', productId)
        .single();

      const purposeData = (productData?.intended_purpose_data || {}) as any;

      // Fetch UI characteristics from the UEF
      const { data: uefData } = await supabase
        .from('usability_engineering_files')
        .select('ui_characteristics')
        .eq('product_id', productId)
        .maybeSingle();

      const uiChars = Array.isArray(uefData?.ui_characteristics)
        ? (uefData.ui_characteristics as { feature: string; category?: string; safety_relevance?: string; description?: string }[])
        : [];

      const response = await generateUsabilityHazardSuggestions({
        productData: {
          product_name: productData?.name || '',
          device_class: productData?.class || '',
          clinical_purpose: purposeData?.clinicalPurpose || '',
          indications_for_use: purposeData?.indications || '',
          target_population: Array.isArray(purposeData?.targetPopulation)
            ? purposeData.targetPopulation.join(', ')
            : purposeData?.targetPopulation || '',
          use_environment: Array.isArray(purposeData?.useEnvironment)
            ? purposeData.useEnvironment.join(', ')
            : purposeData?.useEnvironment || '',
          duration_of_use: purposeData?.durationOfUse || '',
        },
        existingHazardDescriptions,
        ...(uiChars.length > 0 ? { uiCharacteristics: uiChars } : {}),
        ...(focusCategory !== 'all' ? { focusCategory } : {}),
        ...(additionalPrompt ? { additionalPrompt } : {}),
        ...(outputLanguage ? { outputLanguage } : {}),
      });

      if (response.suggestions) {
        // Dedup: filter out suggestions that match existing hazard descriptions
        const normalizedExisting = existingHazardDescriptions.map(d => d.toLowerCase().trim());
        const unique = response.suggestions.filter(s => {
          const desc = s.description.toLowerCase().trim();
          return !normalizedExisting.some(existing =>
            existing.includes(desc) || desc.includes(existing) || existing === desc
          );
        });
        const dupsRemoved = response.suggestions.length - unique.length;
        if (dupsRemoved > 0) {
          toast.info(`${dupsRemoved} duplicate suggestion(s) filtered out`);
        }
        setSuggestions(unique);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggle = (index: number) => {
    const next = new Set(selected);
    next.has(index) ? next.delete(index) : next.add(index);
    setSelected(next);
  };

  const handleSelectAll = () => {
    if (selected.size === suggestions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(suggestions.map((_, i) => i)));
    }
  };

  const handleAddSelected = async () => {
    setIsAdding(true);
    try {
      const toAdd = Array.from(selected).map(i => suggestions[i]);
      for (const s of toAdd) {
        await hazardsService.createHazard(productId, companyId, {
          description: `Draft – ${s.description}`,
          hazardous_situation: s.hazardous_situation,
          potential_harm: s.potential_harm,
          foreseeable_sequence_events: s.foreseeable_sequence_events,
          category: focusCategory !== 'all' ? focusCategory : 'human_factors',
        }, 'USE');
      }
      queryClient.invalidateQueries({ queryKey: ['usability-hazards', productId] });
      queryClient.invalidateQueries({ queryKey: ['hazards', productId] });
      toast.success(`${toAdd.length} usability hazard(s) created`);
      const remaining = suggestions.filter((_, i) => !selected.has(i));
      setSuggestions(remaining);
      setSelected(new Set());
      if (remaining.length === 0) onOpenChange(false);
    } catch (err) {
      toast.error('Failed to add hazards');
    } finally {
      setIsAdding(false);
    }
  };

  const getConfidenceColor = (c: number) => {
    if (c >= 0.9) return 'text-green-600';
    if (c >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Usability Hazard Suggestions
            {suggestions.length > 0 && <Badge variant="secondary">{suggestions.length} suggestions</Badge>}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            AI-generated usability hazards based on IEC 62366-1 human factors analysis.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {suggestions.length === 0 && !isGenerating && (
            <AIContextSourcesPanel
              productId={productId}
              additionalSources={['Existing Hazards', 'UI Characteristics']}
              mode="select"
              onPromptChange={setAdditionalPrompt}
              onLanguageChange={setOutputLanguage}
            />
          )}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium whitespace-nowrap">Category:</label>
            <Select value={focusCategory} onValueChange={setFocusCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-[9999]">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="materials_patient_contact">Materials & Patient Contact (C.1)</SelectItem>
                <SelectItem value="combination_other_products">Combination with Other Products (C.2)</SelectItem>
                <SelectItem value="human_factors">Human Factors (C.3)</SelectItem>
                <SelectItem value="training_requirements">Training Requirements (C.4)</SelectItem>
                <SelectItem value="cleaning_maintenance">Cleaning & Maintenance (C.5)</SelectItem>
                <SelectItem value="negative_air_pressure">Negative Air Pressure (C.6)</SelectItem>
                <SelectItem value="electrical_energy">Electrical Energy (C.7)</SelectItem>
                <SelectItem value="sterility_requirements">Sterility Requirements (C.8)</SelectItem>
                <SelectItem value="critical_data_storage">Critical Data Storage (C.9)</SelectItem>
                <SelectItem value="software_use">Software Use (C.10)</SelectItem>
                <SelectItem value="disposal">Disposal (C.11)</SelectItem>
                <SelectItem value="manufacturing_residues">Manufacturing Residues (C.12)</SelectItem>
                <SelectItem value="transport_storage">Transport & Storage (C.13)</SelectItem>
                <SelectItem value="shelf_life">Shelf Life (C.14)</SelectItem>
                <SelectItem value="product_realization">Product Realization (C.15)</SelectItem>
                <SelectItem value="customer_requirements">Customer Requirements (C.16)</SelectItem>
                <SelectItem value="purchasing">Purchasing (C.17)</SelectItem>
                <SelectItem value="service_provision">Service Provision (C.18)</SelectItem>
                <SelectItem value="monitoring_devices">Monitoring Devices (C.19)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isGenerating ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Analyzing product for usability hazards…</p>
              </div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {error || 'Click below to generate usability hazard suggestions.'}
              </p>
              <Button onClick={handleGenerate}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Suggestions
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selected.size === suggestions.length ? 'Deselect All' : 'Select All'}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleGenerate}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate More
                  </Button>
                  <Button onClick={handleAddSelected} disabled={selected.size === 0 || isAdding}>
                    <Check className="h-4 w-4 mr-2" />
                    Add Selected ({selected.size})
                  </Button>
                </div>
              </div>

              <div className="grid gap-3">
                {suggestions.map((s, index) => (
                  <Card
                    key={index}
                    className={`cursor-pointer transition-all hover:shadow-md ${selected.has(index) ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => handleToggle(index)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox checked={selected.has(index)} className="mt-1" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium">{s.description}</p>
                            <div className="flex items-center gap-2 shrink-0">
                              {focusCategory !== 'all' && (
                                <Badge variant="outline" className="text-xs">
                                  {({
                                    materials_patient_contact: 'Materials (C.1)',
                                    combination_other_products: 'Combination (C.2)',
                                    human_factors: 'Human Factors (C.3)',
                                    training_requirements: 'Training (C.4)',
                                    cleaning_maintenance: 'Cleaning (C.5)',
                                    negative_air_pressure: 'Air Pressure (C.6)',
                                    electrical_energy: 'Electrical (C.7)',
                                    sterility_requirements: 'Sterility (C.8)',
                                    critical_data_storage: 'Data Storage (C.9)',
                                    software_use: 'Software (C.10)',
                                    disposal: 'Disposal (C.11)',
                                    manufacturing_residues: 'Residues (C.12)',
                                    transport_storage: 'Transport (C.13)',
                                    shelf_life: 'Shelf Life (C.14)',
                                    product_realization: 'Realization (C.15)',
                                    customer_requirements: 'Customer (C.16)',
                                    purchasing: 'Purchasing (C.17)',
                                    service_provision: 'Service (C.18)',
                                    monitoring_devices: 'Monitoring (C.19)',
                                  } as Record<string, string>)[focusCategory] || focusCategory}
                                </Badge>
                              )}
                              <span className={`text-xs font-medium ${getConfidenceColor(s.confidence)}`}>
                                {Math.round(s.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                          <div className="grid gap-1 text-xs">
                            {s.hazardous_situation && (
                              <div><span className="font-medium text-orange-600">Root Cause: </span><span className="text-muted-foreground">{s.hazardous_situation}</span></div>
                            )}
                            {s.potential_harm && (
                              <div><span className="font-medium text-red-600">Harm: </span><span className="text-muted-foreground">{s.potential_harm}</span></div>
                            )}
                            {s.foreseeable_sequence_events && (
                              <div><span className="font-medium text-blue-600">Sequence: </span><span className="text-muted-foreground">{s.foreseeable_sequence_events}</span></div>
                            )}
                          </div>
                          <div className="flex items-start gap-1">
                            <Info className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-muted-foreground">{s.rationale}</p>
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
