import React, { useState } from "react";
import { AIContextSourcesPanel } from '@/components/product/ai-assistant/AIContextSourcesPanel';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2, CheckCircle } from "lucide-react";
import { SoftwareRequirementsAIService, SoftwareRequirementSuggestion } from "@/services/softwareRequirementsAIService";
import { requirementSpecificationsService } from "@/services/requirementSpecificationsService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { deduplicateSuggestions } from '@/utils/deduplicateSuggestions';

interface Suggestion {
  description: string;
  category: string;
  rationale: string;
  traces_to: string;
  linked_risks: string;
  acceptance_criteria: string;
  confidence: number;
}

interface SoftwareAISuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
}

export function SoftwareAISuggestionsDialog({
  open,
  onOpenChange,
  productId,
  companyId
}: SoftwareAISuggestionsDialogProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();
  const { lang } = useTranslation();
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [outputLanguage, setOutputLanguage] = useState('en');

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Fetch system requirements first
      const systemRequirements = await requirementSpecificationsService.getByProductAndType(productId, 'system');
      
      // Fetch existing software requirements for deduplication
      const existingSWReqs = await requirementSpecificationsService.getByProductAndType(productId, 'software');
      const existingDescriptions = existingSWReqs.map(r => r.description).filter(Boolean);
      
      const productData = {};
      
      const response = await SoftwareRequirementsAIService.generateSoftwareRequirements({
        companyId,
        productData,
        systemRequirements: systemRequirements.map(sr => ({
          id: sr.id,
          requirement_id: sr.requirement_id,
          description: sr.description
        })),
        selectedCategories: [],
        existingItems: existingDescriptions,
      });
      return { response, existingDescriptions };
    },
    onSuccess: ({ response, existingDescriptions }) => {
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
        toast.success(lang('softwareRequirements.suggestions.generateSuccess', { count: filtered.length }));
      } else {
        toast.error(response.error || lang('softwareRequirements.suggestions.generateError'));
      }
      setIsGenerating(false);
    },
    onError: (error) => {
      toast.error(lang('softwareRequirements.suggestions.generateError'));
      console.error('AI suggestions error:', error);
      setIsGenerating(false);
    }
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const selectedItems = Array.from(selectedSuggestions).map(index => suggestions[index]);
      const results = [];
      
      // Process requirements sequentially to avoid ID conflicts
      for (const suggestion of selectedItems) {
        const result = await requirementSpecificationsService.create(
          productId,
          companyId,
          {
            description: suggestion.description,
            category: suggestion.category,
            traces_to: suggestion.traces_to,
            linked_risks: suggestion.linked_risks,
            verification_status: 'Not Started'
          },
          'software'
        );
        results.push(result);
      }
      
      return results;
    },

    onSuccess: (results) => {
      toast.success(lang('softwareRequirements.suggestions.importSuccess', { count: results.length }));
      queryClient.invalidateQueries({ queryKey: ['requirement-specifications', productId, 'software'] });
      onOpenChange(false);
      setSuggestions([]);
      setSelectedSuggestions(new Set());
    },
    onError: (error) => {
      toast.error(lang('softwareRequirements.suggestions.importError'));
      console.error('Import error:', error);
    }
  });

  const toggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const selectAll = () => {
    setSelectedSuggestions(new Set(suggestions.map((_, index) => index)));
  };

  const selectNone = () => {
    setSelectedSuggestions(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {lang('softwareRequirements.suggestions.title')}
          </DialogTitle>
          <DialogDescription>
            {lang('softwareRequirements.suggestions.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {suggestions.length === 0 ? (
            <div className="flex-1 overflow-y-auto flex flex-col items-center gap-4 py-4">
              <AIContextSourcesPanel
                productId={productId}
                additionalSources={['System Requirements']}
                className="w-full max-w-lg"
                mode="select"
                onPromptChange={setAdditionalPrompt}
                onLanguageChange={setOutputLanguage}
              />
              <div className="text-center space-y-4">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium">{lang('softwareRequirements.suggestions.generateTitle')}</h3>
                  <p className="text-muted-foreground">
                    {lang('softwareRequirements.suggestions.generatePrompt')}
                  </p>
                </div>
                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={isGenerating || generateMutation.isPending}
                  size="lg"
                >
                  {isGenerating || generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {lang('softwareRequirements.suggestions.generating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {lang('softwareRequirements.suggestions.generateButton')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {lang('softwareRequirements.suggestions.suggestionsCount', { count: suggestions.length })}
                  </span>
                  <Badge variant="outline">
                    {lang('softwareRequirements.suggestions.selectedCount', { count: selectedSuggestions.size })}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    {lang('softwareRequirements.suggestions.selectAll')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={selectNone}>
                    {lang('softwareRequirements.suggestions.selectNone')}
                  </Button>
                  <Button
                    onClick={() => generateMutation.mutate()}
                    disabled={isGenerating || generateMutation.isPending}
                    variant="outline"
                    size="sm"
                  >
                    {isGenerating || generateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className="transition-colors hover:bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedSuggestions.has(index)}
                          onCheckedChange={() => toggleSuggestion(index)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium leading-tight">
                              {suggestion.description}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant="secondary" className="text-xs">
                                {suggestion.category}
                              </Badge>
                              <Badge 
                                variant={suggestion.confidence >= 80 ? "default" : "outline"}
                                className="text-xs"
                              >
                                {suggestion.confidence}%
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>
                              <span className="font-medium">{lang('softwareRequirements.suggestions.rationale')}:</span> {suggestion.rationale}
                            </div>
                            {suggestion.traces_to && (
                              <div>
                                <span className="font-medium">Traces to:</span> {suggestion.traces_to}
                              </div>
                            )}
                            {suggestion.linked_risks && (
                              <div>
                                <span className="font-medium">Linked risks:</span> {suggestion.linked_risks}
                              </div>
                            )}
                            {suggestion.acceptance_criteria && (
                              <div>
                                <span className="font-medium">Acceptance criteria:</span> {suggestion.acceptance_criteria}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  {lang('common.cancel')}
                </Button>
                <Button
                  onClick={() => importMutation.mutate()}
                  disabled={selectedSuggestions.size === 0 || importMutation.isPending}
                >
                  {importMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {lang('softwareRequirements.suggestions.importButton', { count: selectedSuggestions.size })}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}