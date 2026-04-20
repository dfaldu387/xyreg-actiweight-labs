import React, { useMemo } from 'react';
import { Settings2, Sparkles, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QualityManualData } from '@/hooks/useQualityManual';
import { getHighestDeviceClass } from '@/config/classBasedExclusions';
import { useLanguage, type Language } from '@/context/LanguageContext';

export type DetailLevel = 'concise' | 'standard' | 'comprehensive';
export type CompanySize = 'startup' | 'sme' | 'enterprise';
export type RegulatoryMaturity = 'new' | 'existing' | 'certified';

export interface GenerationConfig {
  detailLevel: DetailLevel;
  companySize: CompanySize;
  regulatoryMaturity: RegulatoryMaturity;
  outputLanguage: Language;
  additionalInstructions: string;
}

const DETAIL_OPTIONS: { value: DetailLevel; label: string; desc: string; words: string }[] = [
  { value: 'concise', label: 'Concise', desc: 'Brief, essential coverage', words: '~150–200 words/section' },
  { value: 'standard', label: 'Standard', desc: 'Balanced detail and clarity', words: '~300–400 words/section' },
  { value: 'comprehensive', label: 'Comprehensive', desc: 'Full enterprise-level detail', words: '~500–700 words/section' },
];

const COMPANY_SIZE_OPTIONS: { value: CompanySize; label: string }[] = [
  { value: 'startup', label: 'Startup (1–20 people)' },
  { value: 'sme', label: 'SME (20–100 people)' },
  { value: 'enterprise', label: 'Enterprise (100+ people)' },
];

const MATURITY_OPTIONS: { value: RegulatoryMaturity; label: string }[] = [
  { value: 'new', label: 'New QMS — building from scratch' },
  { value: 'existing', label: 'Existing QMS — updating/improving' },
  { value: 'certified', label: 'Certified — maintaining compliance' },
];

export const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'fi', label: 'Suomi' },
];

function getSmartRecommendation(companyData?: QualityManualData): { detailLevel: DetailLevel; companySize: CompanySize; regulatoryMaturity: RegulatoryMaturity; reason: string } | null {
  if (!companyData?.company) return null;

  const personnelCount = companyData.personnel?.length || 0;
  const products = companyData.products || [];
  const riskClasses = products.map(p => p.risk_class).filter((rc): rc is string => !!rc);
  const highestClass = riskClasses.length > 0 ? getHighestDeviceClass(riskClasses) : null;

  let detailLevel: DetailLevel = 'standard';
  let companySize: CompanySize = 'sme';
  let regulatoryMaturity: RegulatoryMaturity = 'new';
  const reasons: string[] = [];

  if (personnelCount > 0 && personnelCount < 20) {
    companySize = 'startup';
    reasons.push(`${personnelCount} personnel → Startup`);
  } else if (personnelCount >= 100) {
    companySize = 'enterprise';
    reasons.push(`${personnelCount} personnel → Enterprise`);
  } else if (personnelCount >= 20) {
    companySize = 'sme';
    reasons.push(`${personnelCount} personnel → SME`);
  }

  if (highestClass === 'Class I' && personnelCount < 20) {
    detailLevel = 'concise';
    reasons.push(`${highestClass} + small team → Concise`);
  } else if (highestClass === 'Class III' || personnelCount >= 100) {
    detailLevel = 'comprehensive';
    reasons.push(`${highestClass || 'Large org'} → Comprehensive`);
  } else {
    reasons.push(`${highestClass || 'Standard risk'} → Standard`);
  }

  if (reasons.length === 0) return null;

  return { detailLevel, companySize, regulatoryMaturity, reason: reasons.join(' · ') };
}

export function getDefaultConfig(companyData?: QualityManualData, language?: Language): GenerationConfig {
  const rec = getSmartRecommendation(companyData);
  return {
    detailLevel: rec?.detailLevel || 'standard',
    companySize: rec?.companySize || 'sme',
    regulatoryMaturity: rec?.regulatoryMaturity || 'new',
    outputLanguage: language || 'en',
    additionalInstructions: '',
  };
}

/** Summary label for current config */
export function getConfigSummary(config: GenerationConfig): string {
  const detail = DETAIL_OPTIONS.find(d => d.value === config.detailLevel)?.label || config.detailLevel;
  const size = COMPANY_SIZE_OPTIONS.find(c => c.value === config.companySize)?.label?.split(' ')[0] || config.companySize;
  const lang = LANGUAGE_OPTIONS.find(l => l.value === config.outputLanguage)?.label || config.outputLanguage;
  return `${detail} · ${size} · ${lang}`;
}

interface QualityManualGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: GenerationConfig;
  onChange: (config: GenerationConfig) => void;
  companyData?: QualityManualData;
  onConfirm?: () => void;
  confirmLabel?: string;
}

export function QualityManualGenerationDialog({ open, onOpenChange, config, onChange, companyData, onConfirm, confirmLabel }: QualityManualGenerationDialogProps) {
  const recommendation = useMemo(() => getSmartRecommendation(companyData), [companyData]);

  const update = <K extends keyof GenerationConfig>(key: K, value: GenerationConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            AI Generation Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Smart Recommendation */}
          {recommendation && (
            <div className="flex items-start gap-2.5 p-3 rounded-md bg-primary/5 border border-primary/15">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-foreground">Smart Recommendation</p>
                <p className="text-xs text-muted-foreground mt-0.5">{recommendation.reason}</p>
              </div>
            </div>
          )}

          {/* Detail Level */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Detail Level</Label>
            <RadioGroup
              value={config.detailLevel}
              onValueChange={(v) => update('detailLevel', v as DetailLevel)}
              className="grid grid-cols-3 gap-2"
            >
              {DETAIL_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-colors text-center",
                    config.detailLevel === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <RadioGroupItem value={opt.value} className="sr-only" />
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground">{opt.words}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Company Size + Maturity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Company Size</Label>
              <Select value={config.companySize} onValueChange={(v) => update('companySize', v as CompanySize)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Regulatory Maturity</Label>
              <Select value={config.regulatoryMaturity} onValueChange={(v) => update('regulatoryMaturity', v as RegulatoryMaturity)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATURITY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Output Language */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Output Language</Label>
            <Select value={config.outputLanguage} onValueChange={(v) => update('outputLanguage', v as Language)}>
              <SelectTrigger className="h-9 text-xs w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Instructions */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Additional Instructions</Label>
            <Textarea
              value={config.additionalInstructions}
              onChange={(e) => update('additionalInstructions', e.target.value)}
              placeholder="e.g., Focus on software processes, We outsource sterilization, Emphasize design controls..."
              className="text-xs min-h-[60px] resize-none"
              rows={2}
            />
          </div>

          <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>These settings apply to all AI-generated sections. You can override per-section after generation.</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {onConfirm ? (
            <Button onClick={() => { onConfirm(); onOpenChange(false); }} className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {confirmLabel || 'Generate'}
            </Button>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}