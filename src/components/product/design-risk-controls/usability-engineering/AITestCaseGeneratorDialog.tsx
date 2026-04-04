import React, { useState, useEffect } from "react";
import { AIContextSourcesPanel } from '@/components/product/ai-assistant/AIContextSourcesPanel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { generateUsabilityTestCases, UsabilityTestSuggestion } from "@/services/usabilityTestAIService";
import { VVService } from "@/services/vvService";
import { TraceabilityLinksService } from "@/services/traceabilityLinksService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AITestCaseGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  companyId: string;
  hazards: any[];
}

export function AITestCaseGeneratorDialog({
  open,
  onOpenChange,
  productId,
  companyId,
  hazards,
}: AITestCaseGeneratorDialogProps) {
  const queryClient = useQueryClient();
  const [suggestions, setSuggestions] = useState<UsabilityTestSuggestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [outputLanguage, setOutputLanguage] = useState('en');

  useEffect(() => {
    if (open && hazards.length > 0 && suggestions.length === 0) {
      generate();
    }
  }, [open]);

  const generate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateUsabilityTestCases({
        hazards: hazards.map(h => ({
          hazard_id: h.hazard_id,
          description: h.description,
          hazardous_situation: h.hazardous_situation,
          potential_harm: h.potential_harm,
          risk_control_measure: h.risk_control_measure,
          initial_risk: h.initial_risk,
          severity: h.severity,
        })),
      });
      const sug = result.suggestions || [];
      setSuggestions(sug);
      setSelected(new Set(sug.map((_, i) => i)));
    } catch (err: any) {
      setError(err.message || 'Failed to generate');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelect = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === suggestions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(suggestions.map((_, i) => i)));
    }
  };

  const handleCreate = async () => {
    if (selected.size === 0) return;
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let created = 0;
      for (const idx of selected) {
        const s = suggestions[idx];
        const testCaseId = await VVService.getNextTestCaseId(companyId, 'validation');
        
        const testCase = await VVService.createTestCase({
          company_id: companyId,
          product_id: productId,
          test_case_id: testCaseId,
          name: s.name,
          description: s.description,
          test_type: 'validation',
          test_level: s.test_level,
          category: s.category,
          test_steps: s.test_steps,
          acceptance_criteria: s.acceptance_criteria,
          priority: s.priority,
          status: 'draft',
          created_by: user.id,
        });

        // Find the hazard record to link
        const hazard = hazards.find(h => h.hazard_id === s.hazard_id);
        if (hazard) {
          await TraceabilityLinksService.create({
            product_id: productId,
            company_id: companyId,
            source_type: 'test_case',
            source_id: testCase.id,
            target_type: 'hazard',
            target_id: hazard.id,
            link_type: 'verifies_control',
            rationale: `AI-generated validation test for usability hazard ${s.hazard_id}`,
          });
        }
        created++;
      }

      queryClient.invalidateQueries({ queryKey: ['test-cases'] });
      queryClient.invalidateQueries({ queryKey: ['traceability-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['traceability-visual'] });
      toast.success(`Created ${created} validation test case(s) with traceability links`);
      onOpenChange(false);
      setSuggestions([]);
      setSelected(new Set());
    } catch (err: any) {
      toast.error(err.message || 'Failed to create test cases');
    } finally {
      setIsCreating(false);
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isCreating) onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI-Generated Validation Test Cases
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            IEC 62366-1 aligned test cases generated from {hazards.length} usability hazard(s). Review and select which to create.
          </p>
        </DialogHeader>

        {!isGenerating && !error && suggestions.length === 0 && (
          <AIContextSourcesPanel
            productId={productId}
            additionalSources={[`${hazards.length} Usability Hazard(s)`]}
            mode="select"
            onPromptChange={setAdditionalPrompt}
            onLanguageChange={setOutputLanguage}
          />
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing hazards and generating test cases...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center py-8 gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={generate}>Retry</Button>
          </div>
        )}

        {!isGenerating && !error && suggestions.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-2">
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selected.size === suggestions.length ? 'Deselect All' : 'Select All'}
              </Button>
              <span className="text-sm text-muted-foreground">{selected.size} of {suggestions.length} selected</span>
            </div>

            <div className="space-y-3">
              {suggestions.map((s, i) => (
                <Card
                  key={i}
                  className={`p-3 cursor-pointer transition-colors ${selected.has(i) ? 'border-primary/50 bg-primary/5' : 'opacity-60'}`}
                  onClick={() => toggleSelect(i)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox checked={selected.has(i)} onCheckedChange={() => toggleSelect(i)} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm">{s.name}</span>
                        <Badge variant="outline" className="text-xs">{s.hazard_id}</Badge>
                        <Badge variant="outline" className="text-xs">{s.test_level}</Badge>
                        <Badge variant="outline" className="text-xs">{s.category.replace(/_/g, ' ')}</Badge>
                        <Badge className={`text-xs ${priorityColor(s.priority)}`} variant="secondary">{s.priority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{s.description}</p>
                      <p className="text-xs text-muted-foreground">{s.test_steps.length} step(s) · {s.acceptance_criteria}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {!isGenerating && !error && suggestions.length > 0 && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>Cancel</Button>
            <Button onClick={handleCreate} disabled={selected.size === 0 || isCreating}>
              {isCreating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" />Create {selected.size} Test Case(s)</>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
