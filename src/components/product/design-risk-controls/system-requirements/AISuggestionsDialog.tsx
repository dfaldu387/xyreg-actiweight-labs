import React, { useState } from "react";
import { AIContextSourcesPanel } from '@/components/product/ai-assistant/AIContextSourcesPanel';
import { Sparkles, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SystemRequirementsAIService } from "@/services/systemRequirementsAIService";
import { requirementSpecificationsService } from "@/services/requirementSpecificationsService";
import { useTranslation } from "@/hooks/useTranslation";
import { deduplicateSuggestions } from '@/utils/deduplicateSuggestions';

interface AISuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
}

interface Suggestion {
  description: string;
  category: string;
  rationale: string;
  traces_to: string;
  linked_risks: string;
  acceptance_criteria: string;
  confidence: number;
}

export function AISuggestionsDialog({
  open,
  onOpenChange,
  productId,
  companyId
}: AISuggestionsDialogProps) {
  const { lang } = useTranslation();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedContextKeys, setSelectedContextKeys] = useState<string[]>([]);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [outputLanguage, setOutputLanguage] = useState('en');
  const queryClient = useQueryClient();

  // Fetch product data
  const { data: product } = useQuery({
    queryKey: ['ai-sr-product', productId],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('name, class, description, intended_purpose_data, emdn_code, emdn_description')
        .eq('id', productId)
        .single();
      return data;
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user needs for this product
  const { data: userNeeds } = useQuery({
    queryKey: ['ai-sr-user-needs', productId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_needs')
        .select('id, user_need_id, description, category')
        .eq('product_id', productId)
        .order('user_need_id', { ascending: true });
      return data || [];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const buildRequest = () => {
    const keys = new Set(selectedContextKeys);
    const purposeData = (product?.intended_purpose_data || {}) as any;

    const productData: any = {};

    if (keys.has('product-name') && product?.name) {
      productData.product_name = product.name;
    }
    if (keys.has('device-class') && product?.class) {
      productData.device_class = product.class;
    }
    if (keys.has('description') && product?.description) {
      productData.description = product.description;
    }
    if (keys.has('intended-purpose')) {
      if (purposeData?.clinicalPurpose) productData.clinical_purpose = purposeData.clinicalPurpose;
      if (purposeData?.indications || purposeData?.indicationsForUse) {
        productData.indications_for_use = purposeData.indications || purposeData.indicationsForUse;
      }
      if (purposeData?.useEnvironment) productData.use_environment = purposeData.useEnvironment;
      if (purposeData?.durationOfUse) productData.duration_of_use = purposeData.durationOfUse;
    }
    if (keys.has('target-population')) {
      const tp = purposeData?.targetPopulation;
      productData.target_population = Array.isArray(tp) ? tp.join(', ') : tp;
    }

    const selectedUserNeeds = keys.has('user-needs') && userNeeds
      ? userNeeds.map(un => ({ id: un.id, user_need_id: un.user_need_id, description: un.description || '' }))
      : [];

    return {
      companyId,
      productData,
      userNeeds: selectedUserNeeds,
      selectedCategories: [] as string[],
    };
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const request = buildRequest();
      
      // Fetch existing system requirements for deduplication
      const existingReqs = await requirementSpecificationsService.getByProductAndType(productId, 'system');
      const existingDescriptions = existingReqs.map(r => r.description).filter(Boolean);

      console.log('[AISuggestionsDialog] Sending request with', {
        productDataKeys: Object.keys(request.productData),
        userNeedsCount: request.userNeeds.length,
        selectedContext: selectedContextKeys,
        existingItemsCount: existingDescriptions.length,
      });
      const response = await SystemRequirementsAIService.generateSystemRequirements({
        ...request,
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
          toast.success(`${removedCount} duplicate(s) filtered out`);
        }
        setSuggestions(filtered);
        toast.success(lang('systemRequirements.suggestions.generateSuccess').replace('{count}', String(filtered.length)));
      } else {
        toast.error(response.error || lang('systemRequirements.suggestions.generateError'));
      }
      setIsGenerating(false);
    },
    onError: (error) => {
      toast.error(lang('systemRequirements.suggestions.generateError'));
      console.error('AI suggestions error:', error);
      setIsGenerating(false);
    }
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const selectedItems = Array.from(selectedSuggestions).map(index => suggestions[index]);
      const results = [];

      for (const suggestion of selectedItems) {
        // Sanitize traces_to: only keep valid user need IDs (UN-* pattern)
        const sanitizedTracesTo = (suggestion.traces_to || '')
          .split(',')
          .map(s => s.trim())
          .filter(s => /^UN-/.test(s))
          .join(', ');

        const result = await requirementSpecificationsService.create(
          productId,
          companyId,
          {
            description: suggestion.description,
            category: suggestion.category,
            traces_to: sanitizedTracesTo,
            linked_risks: suggestion.linked_risks,
            verification_status: 'Not Started'
          },
          'system'
        );
        results.push(result);
      }

      return results;
    },
    onSuccess: (results) => {
      toast.success(lang('systemRequirements.suggestions.importSuccess').replace('{count}', String(results.length)));
      queryClient.invalidateQueries({ queryKey: ['requirement-specifications', productId, 'system'] });
      queryClient.invalidateQueries({ queryKey: ['linked-reqs-for-user-needs', productId] });
      onOpenChange(false);
      setSuggestions([]);
      setSelectedSuggestions(new Set());
    },
    onError: (error) => {
      toast.error(lang('systemRequirements.suggestions.importError'));
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
            {lang('systemRequirements.suggestions.title')}
          </DialogTitle>
          <DialogDescription>
            {lang('systemRequirements.suggestions.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {suggestions.length === 0 ? (
            <div className="flex-1 overflow-y-auto flex flex-col items-center gap-4 py-4">
              <AIContextSourcesPanel
                productId={productId}
                additionalSources={userNeeds && userNeeds.length > 0 ? [`User Needs (${userNeeds.length})`] : undefined}
                className="w-full max-w-lg"
                mode="select"
                onSelectionChange={setSelectedContextKeys}
                onPromptChange={setAdditionalPrompt}
                onLanguageChange={setOutputLanguage}
              />
              <div className="text-center space-y-4">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium">{lang('systemRequirements.suggestions.generateTitle')}</h3>
                  <p className="text-muted-foreground">
                    {lang('systemRequirements.suggestions.generatePrompt')}
                  </p>
                </div>
                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={isGenerating || selectedContextKeys.length === 0}
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {lang('systemRequirements.suggestions.generating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {lang('systemRequirements.suggestions.generateButton')}
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
                    {lang('systemRequirements.suggestions.suggestionsCount').replace('{count}', String(suggestions.length))}
                  </span>
                  <Badge variant="outline">
                    {lang('systemRequirements.suggestions.selectedCount').replace('{count}', String(selectedSuggestions.size))}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    {lang('systemRequirements.suggestions.selectAll')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={selectNone}>
                    {lang('systemRequirements.suggestions.selectNone')}
                  </Button>
                  <Button
                    onClick={() => generateMutation.mutate()}
                    disabled={isGenerating}
                    variant="outline"
                    size="sm"
                  >
                    {isGenerating ? (
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
                                variant={suggestion.confidence >= 0.9 ? "default" : "outline"}
                                className="text-xs"
                              >
                                {Math.round(suggestion.confidence * 100)}%
                              </Badge>
                            </div>
                          </div>

                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>
                              <span className="font-medium">{lang('systemRequirements.suggestions.rationale')}:</span> {suggestion.rationale}
                            </div>
                            {suggestion.traces_to && (
                              <div>
                                <span className="font-medium">{lang('systemRequirements.table.tracesTo')}:</span> {suggestion.traces_to}
                              </div>
                            )}
                            {suggestion.linked_risks && (
                              <div>
                                <span className="font-medium">{lang('systemRequirements.table.linkedRisks')}:</span> {suggestion.linked_risks}
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
                  {lang('systemRequirements.suggestions.importButton').replace('{count}', String(selectedSuggestions.size))}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
