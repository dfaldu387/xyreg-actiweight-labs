import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Save, Loader2, Plus, X, Globe, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useReimbursementStrategy } from "@/hooks/useReimbursementStrategy";
import { useProductDetails } from "@/hooks/useProductDetails";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { GenesisStepNotice } from "./GenesisStepNotice";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ReimbursementStrategyFormProps {
  productId: string;
  companyId: string;
}

interface ReimbursementCode {
  market: string;
  code: string;
  description: string;
  status: 'existing' | 'new_needed' | 'bundled';
}

interface MarketPayerMix {
  medicare?: number;
  medicaid?: number;
  private?: number;
  self_pay?: number;
}

interface PayerMixByMarket {
  [market: string]: MarketPayerMix;
}

interface ReimbursementMilestone {
  date: string;
  milestone: string;
  status: 'completed' | 'pending' | 'planned';
}

interface PayerMeeting {
  market: string;
  payer: string;
  date: string;
  outcome: 'positive' | 'neutral' | 'negative' | 'pending';
}

interface MarketValueDossier {
  status: 'not_started' | 'in_progress' | 'complete' | '';
  evidence: string;
}

interface ValueDossierByMarket {
  [market: string]: MarketValueDossier;
}

// Helper to extract target market codes from product
function getTargetMarketCodes(product: any): string[] {
  if (!product?.markets || !Array.isArray(product.markets)) return [];
  
  const codes: string[] = [];
  product.markets.forEach((m: any) => {
    // Only include explicitly selected markets
    if (m.selected === true) {
      const code = m.code || m.market_code || m.market;
      if (code) codes.push(code);
    }
  });
  return codes;
}

export function ReimbursementStrategyForm({ productId, companyId }: ReimbursementStrategyFormProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, save, isSaving } = useReimbursementStrategy(productId, companyId);
  const { data: product } = useProductDetails(productId);
  const { lang } = useTranslation();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const isInGenesisFlow = returnTo === 'genesis' || returnTo === 'venture-blueprint' || returnTo === 'investor-share';
  
  // Memoize target markets to avoid creating new array each render
  const targetMarkets = useMemo(() => getTargetMarketCodes(product), [product?.markets]);
  
  // Collapsible accordion state
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  // Track if we've done initial expansion (prevents re-expansion after manual collapse)
  const hasInitializedRef = useRef(false);
  
  const toggleCardExpansion = (marketCode: string) => {
    setExpandedCards(prev =>
      prev.includes(marketCode)
        ? prev.filter(code => code !== marketCode)
        : [...prev, marketCode]
    );
  };
  
  // Initialize expanded state ONCE when markets first load
  useEffect(() => {
    if (targetMarkets.length > 0 && !hasInitializedRef.current) {
      setExpandedCards([targetMarkets[0]]);
      hasInitializedRef.current = true;
    }
  }, [targetMarkets]);
  
  const [formData, setFormData] = useState({
    target_codes: [] as ReimbursementCode[],
    payer_mix_by_market: {} as PayerMixByMarket,
    coverage_status: "" as 'covered' | 'pending' | 'not_covered' | 'variable' | '',
    coverage_notes: "",
    reimbursement_timeline_months: "",
    key_milestones: [] as ReimbursementMilestone[],
    value_dossier_by_market: {} as ValueDossierByMarket,
    payer_meetings: [] as PayerMeeting[],
  });

  // State for new items - now needs to track per-market
  const [newCodeByMarket, setNewCodeByMarket] = useState<Record<string, ReimbursementCode>>({});
  const [newMilestone, setNewMilestone] = useState<ReimbursementMilestone>({ date: "", milestone: "", status: "planned" });
  const [newMeetingByMarket, setNewMeetingByMarket] = useState<Record<string, PayerMeeting>>({});

  // Auto-save refs
  const skipNextAutoSaveRef = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    if (data) {
      // Only sync formData from DB on initial load, not on post-save refetches
      if (initialLoadDoneRef.current) {
        return;
      }
      initialLoadDoneRef.current = true;

      let payerMixByMarket: PayerMixByMarket = {};

      if (data.payer_mix) {
        const rawPayerMix = data.payer_mix as any;
        if (rawPayerMix.US || rawPayerMix.EU || rawPayerMix.UK || rawPayerMix.JP || rawPayerMix.CA || rawPayerMix.AU) {
          payerMixByMarket = rawPayerMix as PayerMixByMarket;
        } else if (rawPayerMix.medicare !== undefined || rawPayerMix.medicaid !== undefined ||
                   rawPayerMix.private !== undefined || rawPayerMix.self_pay !== undefined) {
          payerMixByMarket = { US: rawPayerMix as MarketPayerMix };
        }
      }

      let valueDossierByMarket: ValueDossierByMarket = {};
      if (data.value_dossier_by_market) {
        valueDossierByMarket = data.value_dossier_by_market as ValueDossierByMarket;
      } else if (data.value_dossier_status || data.health_economics_evidence) {
        valueDossierByMarket = {
          US: {
            status: (data.value_dossier_status || '') as MarketValueDossier['status'],
            evidence: data.health_economics_evidence || '',
          }
        };
      }

      let payerMeetings = (data.payer_meetings as PayerMeeting[]) || [];
      payerMeetings = payerMeetings.map(meeting => ({
        ...meeting,
        market: meeting.market || 'US',
      }));

      setFormData({
        target_codes: (data.target_codes as ReimbursementCode[]) || [],
        payer_mix_by_market: payerMixByMarket,
        coverage_status: (data.coverage_status || "") as typeof formData.coverage_status,
        coverage_notes: data.coverage_notes || "",
        reimbursement_timeline_months: data.reimbursement_timeline_months?.toString() || "",
        key_milestones: (data.key_milestones as ReimbursementMilestone[]) || [],
        value_dossier_by_market: valueDossierByMarket,
        payer_meetings: payerMeetings,
      });
      skipNextAutoSaveRef.current = true;
    }
  }, [data]);

  const autoSave = useCallback(async () => {
    try {
      await save({
        target_codes: formData.target_codes,
        payer_mix: formData.payer_mix_by_market,
        coverage_status: formData.coverage_status || null,
        coverage_notes: formData.coverage_notes || null,
        reimbursement_timeline_months: formData.reimbursement_timeline_months
          ? parseInt(formData.reimbursement_timeline_months)
          : null,
        key_milestones: formData.key_milestones,
        value_dossier_by_market: formData.value_dossier_by_market,
        payer_meetings: formData.payer_meetings,
      });
      // Invalidate sidebar queries to update completion status
      queryClient.invalidateQueries({ queryKey: ["funnel-reimbursement", productId] });
      queryClient.invalidateQueries({ queryKey: ["funnel-product", productId] });
      // Invalidate viability score caches so the scorecard updates
      queryClient.invalidateQueries({ queryKey: ['investor-preview-data', productId] });
      queryClient.invalidateQueries({ queryKey: ['calculated-viability-score', productId] });
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }, [formData, save, queryClient, productId]);

  useEffect(() => {
    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 900);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, autoSave]);

  // Helper functions now take market as parameter
  const getPayerMix = (market: string) => formData.payer_mix_by_market[market] || { medicare: 0, medicaid: 0, private: 0, self_pay: 0 };
  
  const updatePayerMix = (market: string, field: keyof MarketPayerMix, value: number) => {
    const currentPayerMix = getPayerMix(market);
    setFormData({
      ...formData,
      payer_mix_by_market: {
        ...formData.payer_mix_by_market,
        [market]: {
          ...currentPayerMix,
          [field]: value,
        },
      },
    });
  };

  const getValueDossier = (market: string) => formData.value_dossier_by_market[market] || { status: '', evidence: '' };

  const updateValueDossier = (market: string, field: keyof MarketValueDossier, value: string) => {
    const currentValueDossier = getValueDossier(market);
    setFormData({
      ...formData,
      value_dossier_by_market: {
        ...formData.value_dossier_by_market,
        [market]: {
          ...currentValueDossier,
          [field]: value,
        },
      },
    });
  };

  const getMarketCompletionStatus = (market: string) => {
    const hasCodes = formData.target_codes.some(c => c.market === market);
    const payerMix = formData.payer_mix_by_market[market];
    const hasPayerMix = payerMix && (payerMix.medicare || 0) + (payerMix.medicaid || 0) + (payerMix.private || 0) + (payerMix.self_pay || 0) === 100;
    const valueDossier = formData.value_dossier_by_market[market];
    const hasValueDossier = valueDossier?.status === 'complete';
    
    const completedItems = [hasCodes, hasPayerMix, hasValueDossier].filter(Boolean).length;
    return { completedItems, total: 3, isComplete: completedItems === 3 };
  };

  const getNewCode = (market: string) => newCodeByMarket[market] || { market, code: "", description: "", status: "existing" as const };
  
  const addCode = (market: string) => {
    const newCode = getNewCode(market);
    if (!newCode.code.trim() && newCode.status !== 'new_needed') return;
    setFormData({ ...formData, target_codes: [...formData.target_codes, { ...newCode, market }] });
    setNewCodeByMarket({ ...newCodeByMarket, [market]: { market, code: "", description: "", status: "existing" } });
  };

  const removeCode = (index: number) => {
    setFormData({ ...formData, target_codes: formData.target_codes.filter((_, i) => i !== index) });
  };

  const addMilestone = () => {
    if (!newMilestone.milestone.trim()) return;
    setFormData({ ...formData, key_milestones: [...formData.key_milestones, newMilestone] });
    setNewMilestone({ date: "", milestone: "", status: "planned" });
  };

  const removeMilestone = (index: number) => {
    setFormData({ ...formData, key_milestones: formData.key_milestones.filter((_, i) => i !== index) });
  };

  const getNewMeeting = (market: string) => newMeetingByMarket[market] || { market, payer: "", date: "", outcome: "pending" as const };
  
  const addMeeting = (market: string) => {
    const newMeeting = getNewMeeting(market);
    if (!newMeeting.payer.trim()) return;
    setFormData({ ...formData, payer_meetings: [...formData.payer_meetings, { ...newMeeting, market }] });
    setNewMeetingByMarket({ ...newMeetingByMarket, [market]: { market, payer: "", date: "", outcome: "pending" } });
  };

  const removeMeeting = (index: number) => {
    setFormData({ ...formData, payer_meetings: formData.payer_meetings.filter((_, i) => i !== index) });
  };

  const handleSave = async () => {
    try {
      await save({
        target_codes: formData.target_codes,
        payer_mix: formData.payer_mix_by_market,
        coverage_status: formData.coverage_status || null,
        coverage_notes: formData.coverage_notes || null,
        reimbursement_timeline_months: formData.reimbursement_timeline_months 
          ? parseInt(formData.reimbursement_timeline_months) 
          : null,
        key_milestones: formData.key_milestones,
        value_dossier_by_market: formData.value_dossier_by_market,
        payer_meetings: formData.payer_meetings,
      });
      // Invalidate viability score caches so the scorecard updates
      queryClient.invalidateQueries({ queryKey: ['investor-preview-data', productId] });
      queryClient.invalidateQueries({ queryKey: ['calculated-viability-score', productId] });
      toast.success("Reimbursement strategy saved");
    } catch (error) {
      toast.error("Failed to save reimbursement strategy");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const statusColors: Record<string, string> = {
    existing: "bg-green-500 text-white",
    new_needed: "bg-yellow-500 text-black",
    bundled: "bg-blue-500 text-white",
  };

  const outcomeColors: Record<string, string> = {
    positive: "bg-green-500 text-white",
    neutral: "bg-muted text-muted-foreground",
    negative: "bg-destructive text-destructive-foreground",
    pending: "bg-yellow-500 text-black",
  };

  // Genesis flow completion checks
  const hasTargetCodes = formData.target_codes.length > 0;
  const hasPayerMix = Object.values(formData.payer_mix_by_market).some(mix => {
    const total = (mix.medicare || 0) + (mix.medicaid || 0) + (mix.private || 0) + (mix.self_pay || 0);
    return total === 100;
  });
  const hasCoverageStatus = Boolean(formData.coverage_status) && Boolean(formData.reimbursement_timeline_months) && Boolean(formData.coverage_notes?.trim());

  if (targetMarkets.length === 0) {
    return (
      <div className="space-y-4">
        <GenesisStepNotice stepNumber={12} stepName="Reimbursement & Market Access" />
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-amber-500" />
              <div>
                <h3 className="font-semibold text-lg">No Target Markets Selected</h3>
                <p className="text-muted-foreground mt-1">
                  Please select target markets in Device Information first to configure reimbursement strategy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GenesisStepNotice stepNumber={12} stepName="Reimbursement & Market Access" />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {lang('reimbursementStrategy.title')}
          </CardTitle>
          <CardDescription>
            {lang('reimbursementStrategy.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Market Cards - Collapsible Accordion */}
          {targetMarkets.map((market) => {
            const isExpanded = expandedCards.includes(market);
            const status = getMarketCompletionStatus(market);
            const marketCodes = formData.target_codes.filter(c => c.market === market);
            const marketMeetings = formData.payer_meetings.filter(m => m.market === market);
            const payerMix = getPayerMix(market);
            const valueDossier = getValueDossier(market);
            const newCode = getNewCode(market);
            const newMeeting = getNewMeeting(market);
            
            return (
              <Collapsible 
                key={market} 
                open={isExpanded}
                onOpenChange={() => toggleCardExpansion(market)}
              >
                <div className="border rounded-lg">
                  <CollapsibleTrigger asChild>
                    <button 
                      type="button"
                      className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-lg">{market}</span>
                        {status.completedItems > 0 && (
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-xs",
                              status.isComplete ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                            )}
                          >
                            {status.completedItems}/{status.total}
                          </Badge>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="p-4 pt-0 space-y-6 border-t">
                      {/* Target Codes */}
                      <div id="genesis-target-codes" className={`space-y-4 p-4 bg-secondary/30 rounded-lg ${isInGenesisFlow ? `transition-colors ${marketCodes.length > 0 ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}`}>
                        <h3 className="font-semibold">{lang('reimbursementStrategy.targetCodes.title')}</h3>
                        
                        <div className="grid grid-cols-4 gap-2 items-end">
                          <Input
                            value={newCode.code}
                            onChange={(e) => setNewCodeByMarket({ ...newCodeByMarket, [market]: { ...newCode, code: e.target.value } })}
                            placeholder={lang('reimbursementStrategy.targetCodes.codePlaceholder')}
                          />
                          <Input
                            value={newCode.description}
                            onChange={(e) => setNewCodeByMarket({ ...newCodeByMarket, [market]: { ...newCode, description: e.target.value } })}
                            placeholder={lang('reimbursementStrategy.targetCodes.descriptionPlaceholder')}
                          />
                          <Select value={newCode.status} onValueChange={(v: any) => setNewCodeByMarket({ ...newCodeByMarket, [market]: { ...newCode, status: v } })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="existing">{lang('reimbursementStrategy.targetCodes.status.existing')}</SelectItem>
                              <SelectItem value="new_needed">{lang('reimbursementStrategy.targetCodes.status.newNeeded')}</SelectItem>
                              <SelectItem value="bundled">{lang('reimbursementStrategy.targetCodes.status.bundled')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button type="button" onClick={() => addCode(market)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-2 mt-4">
                          {marketCodes.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">No codes added for {market}</p>
                          ) : (
                            marketCodes.map((code) => {
                              const originalIndex = formData.target_codes.findIndex(c => c === code);
                              return (
                                <div key={originalIndex} className="flex items-center justify-between p-2 bg-background rounded border">
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono font-medium">{code.code || '(New code needed)'}</span>
                                    <span className="text-muted-foreground">{code.description}</span>
                                    <Badge className={statusColors[code.status]}>{code.status.replace("_", " ")}</Badge>
                                  </div>
                                  <Button variant="ghost" size="sm" onClick={() => removeCode(originalIndex)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Payer Mix */}
                      <div id="genesis-payer-mix" className={`space-y-4 p-4 bg-secondary/30 rounded-lg ${isInGenesisFlow ? `transition-colors ${(payerMix.medicare || 0) + (payerMix.medicaid || 0) + (payerMix.private || 0) + (payerMix.self_pay || 0) === 100 ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}`}>
                        <div>
                          <h3 className="font-semibold">{lang('reimbursementStrategy.payerMix.title')}</h3>
                          <p className="text-sm text-muted-foreground">
                            {lang('reimbursementStrategy.payerMix.description')}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="space-y-2">
                            <Label>{market === 'US' ? lang('reimbursementStrategy.payerMix.medicareUS') : lang('reimbursementStrategy.payerMix.publicStatutory')}</Label>
                            <Input
                              type="number"
                              value={payerMix.medicare || ""}
                              onChange={(e) => updatePayerMix(market, 'medicare', parseFloat(e.target.value) || 0)}
                              placeholder={market === 'US' ? '40' : '70'}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>{market === 'US' ? lang('reimbursementStrategy.payerMix.medicaidUS') : lang('reimbursementStrategy.payerMix.privateSupplementary')}</Label>
                            <Input
                              type="number"
                              value={payerMix.medicaid || ""}
                              onChange={(e) => updatePayerMix(market, 'medicaid', parseFloat(e.target.value) || 0)}
                              placeholder={market === 'US' ? '20' : '20'}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>{lang('reimbursementStrategy.payerMix.commercialPrivate')}</Label>
                            <Input
                              type="number"
                              value={payerMix.private || ""}
                              onChange={(e) => updatePayerMix(market, 'private', parseFloat(e.target.value) || 0)}
                              placeholder="30"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>{lang('reimbursementStrategy.payerMix.selfPayOutOfPocket')}</Label>
                            <Input
                              type="number"
                              value={payerMix.self_pay || ""}
                              onChange={(e) => updatePayerMix(market, 'self_pay', parseFloat(e.target.value) || 0)}
                              placeholder="10"
                            />
                          </div>
                        </div>

                        {(() => {
                          const total = (payerMix.medicare || 0) + (payerMix.medicaid || 0) + (payerMix.private || 0) + (payerMix.self_pay || 0);
                          const isValid = total === 100;
                          const hasValues = total > 0;
                          
                          if (!hasValues) return null;
                          
                          return (
                            <div className={`flex items-center gap-2 text-sm ${isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                              <span className="font-medium">{lang('reimbursementStrategy.payerMix.total')}: {total}%</span>
                              {isValid ? <span>✓</span> : <span className="text-destructive">— {lang('reimbursementStrategy.payerMix.mustEqual100')}</span>}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Value Dossier */}
                      <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
                        <div>
                          <h3 className="font-semibold">{lang('reimbursementStrategy.valueDossier.title')}</h3>
                          <p className="text-sm text-muted-foreground">Market-specific value dossier status and evidence</p>
                        </div>

                        <div className="space-y-2">
                          <Label>{lang('reimbursementStrategy.valueDossier.statusLabel')}</Label>
                          <Select value={valueDossier.status} onValueChange={(v: any) => updateValueDossier(market, 'status', v)}>
                            <SelectTrigger>
                              <SelectValue placeholder={lang('reimbursementStrategy.valueDossier.statusPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_started">{lang('reimbursementStrategy.valueDossier.options.notStarted')}</SelectItem>
                              <SelectItem value="in_progress">{lang('reimbursementStrategy.valueDossier.options.inProgress')}</SelectItem>
                              <SelectItem value="complete">{lang('reimbursementStrategy.valueDossier.options.complete')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{lang('reimbursementStrategy.valueDossier.evidenceLabel')}</Label>
                          <Textarea
                            value={valueDossier.evidence}
                            onChange={(e) => updateValueDossier(market, 'evidence', e.target.value)}
                            placeholder={lang('reimbursementStrategy.valueDossier.evidencePlaceholder')}
                            rows={3}
                          />
                        </div>
                      </div>

                      {/* Payer Meetings */}
                      <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
                        <div>
                          <h3 className="font-semibold">{lang('reimbursementStrategy.payerMeetings.title')}</h3>
                          <p className="text-sm text-muted-foreground">Track payer engagement</p>
                        </div>

                        <div className="grid grid-cols-4 gap-2 items-end">
                          <Input
                            value={newMeeting.payer}
                            onChange={(e) => setNewMeetingByMarket({ ...newMeetingByMarket, [market]: { ...newMeeting, payer: e.target.value } })}
                            placeholder={lang('reimbursementStrategy.payerMeetings.payerPlaceholder')}
                          />
                          <Input
                            type="date"
                            value={newMeeting.date}
                            onChange={(e) => setNewMeetingByMarket({ ...newMeetingByMarket, [market]: { ...newMeeting, date: e.target.value } })}
                          />
                          <Select value={newMeeting.outcome} onValueChange={(v: any) => setNewMeetingByMarket({ ...newMeetingByMarket, [market]: { ...newMeeting, outcome: v } })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">{lang('reimbursementStrategy.payerMeetings.outcome.pending')}</SelectItem>
                              <SelectItem value="positive">{lang('reimbursementStrategy.payerMeetings.outcome.positive')}</SelectItem>
                              <SelectItem value="neutral">{lang('reimbursementStrategy.payerMeetings.outcome.neutral')}</SelectItem>
                              <SelectItem value="negative">{lang('reimbursementStrategy.payerMeetings.outcome.negative')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button type="button" onClick={() => addMeeting(market)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-2 mt-4">
                          {marketMeetings.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">No meetings scheduled for {market}</p>
                          ) : (
                            marketMeetings.map((meeting) => {
                              const originalIndex = formData.payer_meetings.findIndex(m => m === meeting);
                              return (
                                <div key={originalIndex} className="flex items-center justify-between p-2 bg-background rounded border">
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium">{meeting.payer}</span>
                                    <span className="text-muted-foreground">{meeting.date || lang('reimbursementStrategy.payerMeetings.tbd')}</span>
                                    <Badge className={outcomeColors[meeting.outcome]}>{meeting.outcome}</Badge>
                                  </div>
                                  <Button variant="ghost" size="sm" onClick={() => removeMeeting(originalIndex)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}

          {/* Coverage Status - Global (not market-specific) */}
          <div id="genesis-coverage-status" className={`space-y-4 p-4 bg-secondary/30 rounded-lg ${isInGenesisFlow ? `transition-colors ${hasCoverageStatus ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}`}>
            <h3 className="font-semibold">{lang('reimbursementStrategy.coverageStatus.title')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{lang('reimbursementStrategy.coverageStatus.statusLabel')}</Label>
                <Select value={formData.coverage_status} onValueChange={(v: any) => setFormData({ ...formData, coverage_status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder={lang('reimbursementStrategy.coverageStatus.statusPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="covered">{lang('reimbursementStrategy.coverageStatus.options.covered')}</SelectItem>
                    <SelectItem value="pending">{lang('reimbursementStrategy.coverageStatus.options.pending')}</SelectItem>
                    <SelectItem value="not_covered">{lang('reimbursementStrategy.coverageStatus.options.notCovered')}</SelectItem>
                    <SelectItem value="variable">{lang('reimbursementStrategy.coverageStatus.options.variable')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{lang('reimbursementStrategy.coverageStatus.timelineLabel')}</Label>
                <Input
                  type="number"
                  value={formData.reimbursement_timeline_months}
                  onChange={(e) => setFormData({ ...formData, reimbursement_timeline_months: e.target.value })}
                  placeholder="12"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{lang('reimbursementStrategy.coverageStatus.notesLabel')}</Label>
              <Textarea
                value={formData.coverage_notes}
                onChange={(e) => setFormData({ ...formData, coverage_notes: e.target.value })}
                placeholder={lang('reimbursementStrategy.coverageStatus.notesPlaceholder')}
                rows={2}
              />
            </div>
          </div>

{/*          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {lang('reimbursementStrategy.saveButton')}
            </Button>
          </div>*/}
        </CardContent>
      </Card>
    </div>
  );
}
