import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Info, Check, X, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  RequirementSpecsAIService,
  type RequirementSpecSuggestion,
  type RequirementSpecsAIRequest 
} from "@/services/requirementSpecsAIService";
import type { CreateRequirementSpecificationData } from "./types";
import { supabase } from '@/integrations/supabase/client';
import { deduplicateSuggestions } from '@/utils/deduplicateSuggestions';
import { toast } from 'sonner';

interface RequirementSpecsSuggestionsProps {
  productId: string;
  companyId: string;
  productData: any;
  userNeeds: Array<{
    id: string;
    user_need_id: string;
    description: string;
  }>;
  onAddRequirement: (data: CreateRequirementSpecificationData) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
}

const categoryColors = {
  system_use: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  safety: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  risk_control: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  usability: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  regulatory: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  lifetime: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  environmental: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  packaging: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  mechanical: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  electronics: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  software: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  user_documentation: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
};

export function RequirementSpecsSuggestions({
  productId,
  companyId,
  productData,
  userNeeds,
  onAddRequirement,
  open,
  onOpenChange,
  isLoading: externalLoading
}: RequirementSpecsSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<RequirementSpecSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [selectedUserNeeds, setSelectedUserNeeds] = useState<Set<string>>(new Set());
  const [showUserNeedSelection, setShowUserNeedSelection] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleUserNeedToggle = (userNeedId: string) => {
    const newSelected = new Set(selectedUserNeeds);
    if (newSelected.has(userNeedId)) {
      newSelected.delete(userNeedId);
    } else {
      newSelected.add(userNeedId);
    }
    setSelectedUserNeeds(newSelected);
  };

  const handleSelectAllUserNeeds = () => {
    if (selectedUserNeeds.size === userNeeds.length) {
      setSelectedUserNeeds(new Set());
    } else {
      setSelectedUserNeeds(new Set(userNeeds.map(need => need.id)));
    }
  };

  const handleGenerateSuggestions = async () => {
    if (userNeeds.length === 0) {
      setError("Please create some user needs first to generate requirements");
      return;
    }

    // Filter user needs based on selection
    const userNeedsToAnalyze = selectedUserNeeds.size > 0 
      ? userNeeds.filter(need => selectedUserNeeds.has(need.id))
      : userNeeds;

    if (userNeedsToAnalyze.length === 0) {
      setError("Please select at least one user need to analyze");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuggestions([]);

    try {
      // Fetch existing requirement specs for deduplication
      const { data: existingReqs } = await supabase
        .from('requirement_specifications')
        .select('description')
        .eq('product_id', productId);
      const existingDescriptions = (existingReqs || []).map(r => r.description).filter(Boolean);

      const purposeData = productData.intended_purpose_data || {};
      
      const request: RequirementSpecsAIRequest = {
        companyId,
        productData: {
          clinical_purpose: purposeData.clinicalPurpose || '',
          indications_for_use: purposeData.indications || '',
          target_population: Array.isArray(purposeData.targetPopulation) 
            ? purposeData.targetPopulation.join(', ') 
            : purposeData.targetPopulation || '',
          use_environment: Array.isArray(purposeData.useEnvironment) 
            ? purposeData.useEnvironment.join(', ') 
            : purposeData.useEnvironment || '',
          duration_of_use: purposeData.durationOfUse || '',
          device_class: productData.class || '',
          product_name: productData.name || ''
        },
        userNeeds: userNeedsToAnalyze,
        selectedCategories: [],
        existingItems: existingDescriptions,
      };

      const response = await RequirementSpecsAIService.generateRequirementSpecifications(request);

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
      
      for (const suggestion of selected) {
        await onAddRequirement({
          description: suggestion.description,
          traces_to: suggestion.traces_to,
          linked_risks: suggestion.linked_risks,
          verification_status: 'Not Started',
          category: suggestion.category
        });
      }
      
      // Remove added suggestions from the list
      const remainingSuggestions = suggestions.filter((_, index) => !selectedSuggestions.has(index));
      setSuggestions(remainingSuggestions);
      setSelectedSuggestions(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add requirements');
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
            AI Requirement Specifications Suggestions
            {suggestions.length > 0 && <Badge variant="secondary">{suggestions.length} suggestions</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Need Selection */}
          <Collapsible open={showUserNeedSelection} onOpenChange={setShowUserNeedSelection}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Select User Needs to Analyze
                  {selectedUserNeeds.size > 0 && (
                    <Badge variant="secondary">{selectedUserNeeds.size} selected</Badge>
                  )}
                </span>
                <Info className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Select specific user needs to generate targeted requirements (leave empty to use all)
                </p>
                <Button variant="outline" size="sm" onClick={handleSelectAllUserNeeds}>
                  {selectedUserNeeds.size === userNeeds.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="grid gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {userNeeds.map((need) => (
                  <div key={need.id} className="flex items-start gap-2">
                    <Checkbox
                      checked={selectedUserNeeds.has(need.id)}
                      onCheckedChange={() => handleUserNeedToggle(need.id)}
                    />
                    <div className="flex-1 text-sm">
                      <span className="font-medium text-primary">{need.user_need_id}</span>
                      <span className="text-muted-foreground ml-2">{need.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Analyzing {selectedUserNeeds.size > 0 ? selectedUserNeeds.size : userNeeds.length} user needs to generate comprehensive requirement specifications...
                </p>
              </div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {error || `Generate requirement specifications based on ${selectedUserNeeds.size > 0 ? selectedUserNeeds.size : userNeeds.length} user needs across all categories.`}
              </p>
              <Button onClick={handleGenerateSuggestions} disabled={userNeeds.length === 0}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Requirements
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
                  <Button variant="outline" onClick={handleGenerateSuggestions}>
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
                                className={categoryColors[suggestion.category] || categoryColors.system_use}
                              >
                                {suggestion.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-1">
                            <Info className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {suggestion.rationale}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="font-medium">Traces to: </span>
                              <span className="text-muted-foreground">{suggestion.traces_to}</span>
                            </div>
                            <div>
                              <span className="font-medium">Linked Risks: </span>
                              <span className="text-muted-foreground">{suggestion.linked_risks}</span>
                            </div>
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