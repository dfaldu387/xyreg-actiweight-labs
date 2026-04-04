import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Info, Check, X } from 'lucide-react';
import { HazardSuggestion } from '@/services/hazardAIService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HazardSuggestionsProps {
  suggestions: HazardSuggestion[];
  isLoading: boolean;
  onSuggestionsSelected: (selectedSuggestions: HazardSuggestion[]) => void;
  onGenerateMore: () => void;
  onClose: () => void;
}

const categoryColors = {
  materials_patient_contact: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  combination_with_other_products: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  human_factors: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  training_requirements: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  cleaning_maintenance: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  negative_air_pressure: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  electrical_energy: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  sterility_requirements: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  critical_data_storage: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  software_use: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  disposal: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
  manufacturing_residues: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  transport_storage: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  shelf_life: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  product_realization: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  customer_requirements: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  purchasing: 'bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-200',
  service_provision: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  monitoring_devices: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200',
};

const categoryLabels = {
  materials_patient_contact: 'Materials & Patient Contact',
  combination_with_other_products: 'Combination with Other Products',
  human_factors: 'Human Factors',
  training_requirements: 'Training Requirements',
  cleaning_maintenance: 'Cleaning & Maintenance',
  negative_air_pressure: 'Negative Air Pressure',
  electrical_energy: 'Electrical Energy',
  sterility_requirements: 'Sterility Requirements',
  critical_data_storage: 'Critical Data Storage',
  software_use: 'Software Use',
  disposal: 'Disposal',
  manufacturing_residues: 'Manufacturing & Residues',
  transport_storage: 'Transport & Storage',
  shelf_life: 'Shelf-life & In Use Life',
  product_realization: 'Product Realization',
  customer_requirements: 'Customer Requirements',
  purchasing: 'Purchasing',
  service_provision: 'Service Provision',
  monitoring_devices: 'Monitoring Devices',
};

export function HazardSuggestions({
  suggestions,
  isLoading,
  onSuggestionsSelected,
  onGenerateMore,
  onClose
}: HazardSuggestionsProps) {
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

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

  const handleAddSelected = () => {
    const selected = Array.from(selectedSuggestions).map(index => suggestions[index]);
    onSuggestionsSelected(selected);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.8) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generating AI Hazard Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">
                Analyzing your product definition to identify potential hazards...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI-Generated Hazard Suggestions
            <Badge variant="secondary">{suggestions.length} suggestions</Badge>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No suggestions could be generated. Please ensure your product definition includes sufficient detail.
            </p>
            <Button variant="outline" onClick={onGenerateMore}>
              <Sparkles className="h-4 w-4 mr-2" />
              Try Again
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
                {selectedSuggestions.size === suggestions.length ? 'Deselect All' : 'Select All'}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onGenerateMore}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate More
                </Button>
                <Button
                  onClick={handleAddSelected}
                  disabled={selectedSuggestions.size === 0}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Add Selected ({selectedSuggestions.size})
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
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-relaxed">
                            {suggestion.description}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className={`text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                                    {Math.round(suggestion.confidence * 100)}%
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Confidence Score</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Badge
                              variant="secondary"
                              className={categoryColors[suggestion.category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}
                            >
                              {categoryLabels[suggestion.category] || suggestion.category}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* AI-Generated Content Preview */}
                        <div className="space-y-2 text-xs">
                          {suggestion.hazardous_situation && (
                            <div>
                              <span className="font-medium text-red-600 dark:text-red-400">Hazardous Situation:</span>
                              <p className="text-muted-foreground leading-relaxed">{suggestion.hazardous_situation}</p>
                            </div>
                          )}
                          {suggestion.potential_harm && (
                            <div>
                              <span className="font-medium text-red-600 dark:text-red-400">Potential Harm:</span>
                              <p className="text-muted-foreground leading-relaxed">{suggestion.potential_harm}</p>
                            </div>
                          )}
                          {suggestion.foreseeable_sequence_events && (
                            <div>
                              <span className="font-medium text-muted-foreground">Sequence:</span>
                              <p className="text-muted-foreground leading-relaxed">{suggestion.foreseeable_sequence_events}</p>
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
      </CardContent>
    </Card>
  );
}