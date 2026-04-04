import React, { useState } from 'react';
import { AIContextSourcesPanel } from '@/components/product/ai-assistant/AIContextSourcesPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Info, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/useTranslation';
import {
  UserNeedsAIService,
  type UserNeedSuggestion,
  type UserNeedsAIRequest
} from '@/services/userNeedsAIService';
import { supabase } from '@/integrations/supabase/client';
import { deduplicateSuggestions } from '@/utils/deduplicateSuggestions';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserNeedsSuggestionsProps {
  productId: string;
  companyId: string;
  productData: any;
  onAddUserNeed: (data: { description: string; status: 'Met' | 'Not Met'; category?: string }) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
}

export function UserNeedsSuggestions({
  productId,
  companyId,
  productData,
  onAddUserNeed,
  open,
  onOpenChange,
  isLoading: externalLoading
}: UserNeedsSuggestionsProps) {
  const { lang } = useTranslation();
  const [suggestions, setSuggestions] = useState<UserNeedSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [outputLanguage, setOutputLanguage] = useState('en');

  const categories = [
    { value: 'all', label: lang('userNeeds.categories.all') },
    { value: 'General', label: lang('userNeeds.categories.general') },
    { value: 'Performance', label: lang('userNeeds.categories.performance') },
    { value: 'Safety', label: lang('userNeeds.categories.safety') },
    { value: 'Usability', label: lang('userNeeds.categories.usability') },
    { value: 'Interface', label: lang('userNeeds.categories.interface') },
    { value: 'Design', label: lang('userNeeds.categories.design') },
    { value: 'Regulatory', label: lang('userNeeds.categories.regulatory') },
    { value: 'Market', label: lang('userNeeds.categories.market') },
  ];

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
      // Fetch existing user needs for deduplication
      const { data: existingNeeds } = await supabase
        .from('user_needs')
        .select('description')
        .eq('product_id', productId);
      const existingDescriptions = (existingNeeds || []).map(n => n.description).filter(Boolean);

      const purposeData = productData.intended_purpose_data || {};
      
      const request: UserNeedsAIRequest = {
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
          product_name: productData.name || '',
          markets: productData.markets || []
        },
        categories: selectedCategory === 'all' ? undefined : [selectedCategory],
        existingItems: existingDescriptions,
        additionalPrompt: additionalPrompt || undefined,
        outputLanguage: outputLanguage || undefined,
      } as any;

      const response = await UserNeedsAIService.generateUserNeedsSuggestions(request);

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
        await onAddUserNeed({
          description: suggestion.description,
          status: 'Not Met',
          category: suggestion.category || 'General'
        });
      }
      
      // Remove added suggestions from the list
      const remainingSuggestions = suggestions.filter((_, index) => !selectedSuggestions.has(index));
      setSuggestions(remainingSuggestions);
      setSelectedSuggestions(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user needs');
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
            {lang('userNeeds.suggestions.title')}
            {suggestions.length > 0 && <Badge variant="secondary">{suggestions.length} {lang('userNeeds.suggestions.suggestionsCount')}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category Selection */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">{lang('userNeeds.form.category')}:</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {suggestions.length === 0 && !isLoading && (
            <AIContextSourcesPanel
              productId={productId}
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
                  {lang('userNeeds.suggestions.analyzing')}
                </p>
              </div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {error || (selectedCategory !== 'all'
                  ? lang('userNeeds.suggestions.generateForCategory').replace('{category}', selectedCategory)
                  : lang('userNeeds.suggestions.generatePrompt'))}
              </p>
              <Button onClick={handleGenerateSuggestions}>
                <Sparkles className="h-4 w-4 mr-2" />
                {lang('userNeeds.suggestions.generateButton')}
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
                  {selectedSuggestions.size === suggestions.length ? lang('userNeeds.suggestions.deselectAll') : lang('userNeeds.suggestions.selectAll')}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleGenerateSuggestions}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {lang('userNeeds.suggestions.generateMore')}
                  </Button>
                  <Button
                    onClick={handleAddSelected}
                    disabled={selectedSuggestions.size === 0}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {lang('userNeeds.suggestions.addSelected')} ({selectedSuggestions.size})
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
                             <div className="flex-1">
                               <p className="text-sm font-medium leading-relaxed">
                                 {suggestion.description}
                               </p>
                               {suggestion.category && (
                                 <Badge variant="outline" className="mt-1 text-xs">
                                   {suggestion.category}
                                 </Badge>
                               )}
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
                                     <p>{lang('userNeeds.suggestions.confidenceScore')}</p>
                                   </TooltipContent>
                                 </Tooltip>
                               </TooltipProvider>
                             </div>
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