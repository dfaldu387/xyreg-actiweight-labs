import React, { useState } from 'react';
import { showNoCreditDialog } from '@/context/AiCreditContext';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useLanguage } from '@/context/LanguageContext';
import { AIContextSourcesPanel } from '@/components/product/ai-assistant/AIContextSourcesPanel';
import type { VVPlanInitialData } from './CreateVVPlanSheet';

interface AIVVPlanSuggestionsDialogProps {
  productId: string;
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: (data: VVPlanInitialData) => void;
  scopeType?: 'individual' | 'product_family';
  familyIdentifier?: string | null;
}

interface GeneratedPlan {
  name: string;
  description: string;
  scope: string;
  methodology: string[];
  test_levels: string[];
  acceptance_criteria: string;
  roles: { role: string; responsibility: string }[];
}

export function AIVVPlanSuggestionsDialog({
  productId,
  companyId,
  open,
  onOpenChange,
  onAccept,
  scopeType = 'individual',
  familyIdentifier,
}: AIVVPlanSuggestionsDialogProps) {
  const { data: product } = useProductDetails(productId);
  const isFamily = scopeType === 'product_family' && !!familyIdentifier;

  // Fetch family products when in family mode
  const { data: familyProducts } = useQuery({
    queryKey: ['family-products-for-ai', familyIdentifier],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, class, intended_use, trade_name')
        .eq('basic_udi_di', familyIdentifier!);
      if (error) throw error;
      return data;
    },
    enabled: isFamily,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { language: appLanguage } = useLanguage();
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [outputLanguage, setOutputLanguage] = useState<string>(appLanguage);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedPlan(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-vv-plan-generator', {
        body: {
          companyId,
          scopeType: isFamily ? 'product_family' : 'individual',
          familyProducts: isFamily ? familyProducts?.map(p => ({
            name: p.name,
            device_class: p.class,
            intended_purpose: p.intended_use,
          })) : undefined,
          productData: {
            product_name: product?.name || '',
            device_class: product?.class || '',
            clinical_purpose: (product as any)?.intended_purpose_data?.clinicalPurpose || '',
            intended_purpose: (product as any)?.intended_purpose || '',
            markets: product?.markets || [],
            requirements_count: 0,
            hazards_count: 0,
          },
        },
      });

      if (fnError) throw new Error(fnError.message || 'Edge function error');
      if (data?.error === 'NO_CREDITS') {
        showNoCreditDialog();
        return;
      }
      if (!data?.success || !data?.plan) throw new Error(data?.error || 'No plan returned');

      setGeneratedPlan(data.plan);
    } catch (err: any) {
      if (err?.message === 'NO_CREDITS') return;
      setError(err instanceof Error ? err.message : 'Failed to generate V&V plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = () => {
    if (!generatedPlan) return;
    onAccept({
      name: generatedPlan.name,
      description: generatedPlan.description,
      scope: generatedPlan.scope,
      methodology: generatedPlan.methodology,
      test_levels: generatedPlan.test_levels,
      acceptance_criteria: generatedPlan.acceptance_criteria,
      roles: generatedPlan.roles,
    });
    setGeneratedPlan(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI V&V Plan Suggestions
            {isFamily && (
              <Badge variant="outline" className="gap-1 text-xs ml-2">
                <Users className="h-3 w-3" />
                Family
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Shared AI Context Sources Panel */}
          <AIContextSourcesPanel
            productId={productId}
            additionalSources={[
              ...(isFamily && familyProducts ? [`Family Variants (${familyProducts.length})`] : []),
              'Requirements',
              'Risk Hazards',
            ]}
            mode="select"
            onLanguageChange={setOutputLanguage}
            onPromptChange={setAdditionalPrompt}
          />

          {/* Generate / Results */}
          {isGenerating ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Generating V&V plan suggestion...</p>
              </div>
            </div>
          ) : !generatedPlan ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {error || 'Click Generate to create an AI-powered V&V plan based on your product data.'}
              </p>
              <Button onClick={handleGenerate}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate V&V Plan
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Plan Details */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <span className="text-sm font-medium text-foreground">Name</span>
                    <p className="text-sm text-muted-foreground">{generatedPlan.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">Description</span>
                    <p className="text-sm text-muted-foreground">{generatedPlan.description}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">Scope</span>
                    <p className="text-sm text-muted-foreground">{generatedPlan.scope}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">Methodology</span>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {generatedPlan.methodology.map((m) => (
                        <Badge key={m} variant="secondary">{m}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">Test Levels</span>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {generatedPlan.test_levels.map((t) => (
                        <Badge key={t} variant="outline">{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">Acceptance Criteria</span>
                    <p className="text-sm text-muted-foreground">{generatedPlan.acceptance_criteria}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">Roles & Responsibilities</span>
                    <div className="mt-1 space-y-1">
                      {generatedPlan.roles.map((r, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium text-foreground">{r.role}:</span>
                          <span className="text-muted-foreground ml-1">{r.responsibility}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleGenerate}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
                <Button onClick={handleAccept}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Use This Plan
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
