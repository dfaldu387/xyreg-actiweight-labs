import React, { useMemo } from 'react';
import { Settings2, Sparkles, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

interface QualityManualGenerationConfigProps {
  config: GenerationConfig;
  onChange: (config: GenerationConfig) => void;
  companyData?: QualityManualData;
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

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
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

  // Company size
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

  // Detail level based on class
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

export function QualityManualGenerationConfig({ config, onChange, companyData }: QualityManualGenerationConfigProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const recommendation = useMemo(() => getSmartRecommendation(companyData), [companyData]);

  const update = <K extends keyof GenerationConfig>(key: K, value: GenerationConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="rounded-lg border bg-card">
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings2 className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-foreground">AI Generation Settings</h3>
                <p className="text-xs text-muted-foreground">
                  {DETAIL_OPTIONS.find(d => d.value === config.detailLevel)?.label} · {COMPANY_SIZE_OPTIONS.find(c => c.value === config.companySize)?.label} · {LANGUAGE_OPTIONS.find(l => l.value === config.outputLanguage)?.label}
                </p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{isOpen ? 'Collapse' : 'Configure'}</span>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-5 border-t pt-4">
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

              {/* Company Size + Maturity side by side */}
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
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
