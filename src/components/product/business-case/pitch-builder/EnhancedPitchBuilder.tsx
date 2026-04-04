import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Download, Share2, Eye, ChevronDown, ChevronRight,
  Gauge, FileText, LayoutGrid, Users, Map, Image,
  TrendingUp, DollarSign, FlaskConical, Flag, Cpu,
  Target, Shield, Factory, AlertTriangle, Banknote,
  Presentation, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { useInvestorShareSettings } from '@/hooks/useInvestorShareSettings';
import { useCompany } from '@/hooks/useCompany';
import { useInvestorPreview } from '@/contexts/InvestorPreviewContext';
import { getInvestorShareUrl, generateShareSlug } from '@/services/investorShareService';
import { exportPitchDeckToPDF } from '@/utils/pitchDeckPdfExport';
import { useProductDetails } from '@/hooks/useProductDetails';
import { supabase } from '@/integrations/supabase/client';

interface PitchSection {
  id: string;
  label: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  settingKey: string;
  description: string;
  descriptionKey: string;
  genesisStep?: number;
}

interface PitchPart {
  id: string;
  partNumber: string;
  title: string;
  titleKey: string;
  subtitle: string;
  subtitleKey: string;
  sections: PitchSection[];
}

const PITCH_PARTS: PitchPart[] = [
  {
    id: 'part-1',
    partNumber: 'I',
    title: 'Product & Technology Foundation',
    titleKey: 'genesis.pitchParts.productFoundation',
    subtitle: "The 'What' and the 'How.'",
    subtitleKey: 'genesis.pitchParts.productFoundationSub',
    sections: [
      { id: 'device_media', label: 'Device Media Gallery', labelKey: 'genesis.pitchSections.deviceMedia', icon: Image, settingKey: 'show_media_gallery', description: 'Product images and media', descriptionKey: 'genesis.pitchSections.deviceMediaDesc', genesisStep: 3 },
      { id: 'device_description', label: 'Device Description & Intended Use', labelKey: 'genesis.pitchSections.deviceDescription', icon: FileText, settingKey: 'show_device_description', description: 'Product overview and purpose', descriptionKey: 'genesis.pitchSections.deviceDescriptionDesc', genesisStep: 2 },
      { id: 'device_type', label: 'Device Type', labelKey: 'genesis.pitchSections.deviceType', icon: Cpu, settingKey: 'show_device_type', description: 'Device characteristics and invasiveness', descriptionKey: 'genesis.pitchSections.deviceTypeDesc', genesisStep: 5 },
      { id: 'trl_architecture', label: 'TRL & System Architecture', labelKey: 'genesis.pitchSections.trlArchitecture', icon: Cpu, settingKey: 'show_trl_architecture', description: 'Technology readiness and design', descriptionKey: 'genesis.pitchSections.trlArchitectureDesc', genesisStep: 6 },
      { id: 'technical_profile', label: 'Technical Profile (Classification)', labelKey: 'genesis.pitchSections.technicalProfile', icon: Shield, settingKey: 'show_technical_specs', description: 'Regulatory classification details', descriptionKey: 'genesis.pitchSections.technicalProfileDesc', genesisStep: 7 },
    ]
  },
  {
    id: 'part-2',
    partNumber: 'II',
    title: 'Market & Stakeholder Analysis',
    titleKey: 'genesis.pitchParts.marketAnalysis',
    subtitle: "The 'Who' and the 'Why.'",
    subtitleKey: 'genesis.pitchParts.marketAnalysisSub',
    sections: [
      { id: 'market_sizing', label: 'Market Sizing (TAM/SAM/SOM)', labelKey: 'genesis.pitchSections.marketSizing', icon: TrendingUp, settingKey: 'show_market_sizing', description: 'Addressable market analysis', descriptionKey: 'genesis.pitchSections.marketSizingDesc', genesisStep: 11 },
      { id: 'customer_segments', label: 'Customer Segments', labelKey: 'genesis.pitchSections.customerSegments', icon: Users, settingKey: 'show_customer_segments', description: 'User and buyer profiles', descriptionKey: 'genesis.pitchSections.customerSegmentsDesc', genesisStep: 8 },
      { id: 'competitor_analysis', label: 'Competitor Analysis', labelKey: 'genesis.pitchSections.competitorAnalysis', icon: Target, settingKey: 'show_competitor_analysis', description: 'Competitive landscape', descriptionKey: 'genesis.pitchSections.competitorAnalysisDesc', genesisStep: 12 },
    ]
  },
  {
    id: 'part-3',
    partNumber: 'III',
    title: 'Strategy & Evidence',
    titleKey: 'genesis.pitchParts.strategyEvidence',
    subtitle: "The 'Barriers' and the 'Validation.'",
    subtitleKey: 'genesis.pitchParts.strategyEvidenceSub',
    sections: [
      { id: 'clinical_evidence', label: 'Clinical Evidence Strategy', labelKey: 'genesis.pitchSections.clinicalEvidence', icon: FlaskConical, settingKey: 'show_clinical_evidence', description: 'Clinical study approach', descriptionKey: 'genesis.pitchSections.clinicalEvidenceDesc', genesisStep: 14 },
      { id: 'regulatory_timeline', label: 'Regulatory Timeline', labelKey: 'genesis.pitchSections.regulatoryTimeline', icon: Flag, settingKey: 'show_regulatory_timeline', description: 'Approval pathway and timing', descriptionKey: 'genesis.pitchSections.regulatoryTimelineDesc', genesisStep: 13 },
      { id: 'reimbursement', label: 'Reimbursement Strategy', labelKey: 'genesis.pitchSections.reimbursement', icon: DollarSign, settingKey: 'show_reimbursement_strategy', description: 'Payer and coding pathway', descriptionKey: 'genesis.pitchSections.reimbursementDesc', genesisStep: 16 },
      { id: 'gtm_strategy', label: 'Go-to-Market Strategy', labelKey: 'genesis.pitchSections.gtmStrategy', icon: Map, settingKey: 'show_gtm_strategy', description: 'Commercial launch plan', descriptionKey: 'genesis.pitchSections.gtmStrategyDesc', genesisStep: 18 },
    ]
  },
  {
    id: 'part-5',
    partNumber: 'V',
    title: 'Operational Execution & Logistics',
    titleKey: 'genesis.pitchParts.operationalExecution',
    subtitle: "The 'Action Plan.'",
    subtitleKey: 'genesis.pitchParts.operationalExecutionSub',
    sections: [
      { id: 'team', label: 'Team Composition', labelKey: 'genesis.pitchSections.team', icon: Users, settingKey: 'show_team_profile', description: 'Leadership and expertise', descriptionKey: 'genesis.pitchSections.teamDesc', genesisStep: 21 },
      { id: 'manufacturing', label: 'Manufacturing & Supply Chain', labelKey: 'genesis.pitchSections.manufacturing', icon: Factory, settingKey: 'show_manufacturing', description: 'Production strategy', descriptionKey: 'genesis.pitchSections.manufacturingDesc', genesisStep: 20 },
      { id: 'timeline', label: 'Execution Timeline', labelKey: 'genesis.pitchSections.timeline', icon: Map, settingKey: 'show_roadmap', description: 'Development milestones', descriptionKey: 'genesis.pitchSections.timelineDesc', genesisStep: 22 },
      { id: 'risk_assessment', label: 'Risk Assessment', labelKey: 'genesis.pitchSections.riskAssessment', icon: AlertTriangle, settingKey: 'show_risk_summary', description: 'Key risks and mitigations', descriptionKey: 'genesis.pitchSections.riskAssessmentDesc', genesisStep: 23 },
      { id: 'business_canvas', label: 'Business Model Canvas', labelKey: 'genesis.pitchSections.businessCanvas', icon: LayoutGrid, settingKey: 'show_business_canvas', description: '9-section business model', descriptionKey: 'genesis.pitchSections.businessCanvasDesc', genesisStep: 24 },
      { id: 'exit_strategy', label: 'Exit Strategy', labelKey: 'genesis.pitchSections.exitStrategy', icon: Target, settingKey: 'show_exit_strategy', description: 'Strategic horizon plan', descriptionKey: 'genesis.pitchSections.exitStrategyDesc', genesisStep: 25 },
      { id: 'use_of_proceeds', label: 'Funding & Use of Proceeds', labelKey: 'genesis.pitchSections.useOfProceeds', icon: Banknote, settingKey: 'show_use_of_proceeds', description: 'Capital allocation plan', descriptionKey: 'genesis.pitchSections.useOfProceedsDesc', genesisStep: 26 },
    ]
  },
  {
    id: 'part-4',
    partNumber: 'IV',
    title: 'Financial Overview',
    titleKey: 'genesis.pitchParts.financialOverview',
    subtitle: "Investment metrics and projections.",
    subtitleKey: 'genesis.pitchParts.financialOverviewSub',
    sections: [
      { id: 'viability_score', label: 'Viability Score Overview', labelKey: 'genesis.pitchSections.viabilityScore', icon: Gauge, settingKey: 'show_viability_score', description: 'Investment readiness score', descriptionKey: 'genesis.pitchSections.viabilityScoreDesc' },
      { id: 'revenue_chart', label: 'Revenue Lifecycle Chart', labelKey: 'genesis.pitchSections.revenueChart', icon: TrendingUp, settingKey: 'show_revenue_chart', description: 'Financial projections', descriptionKey: 'genesis.pitchSections.revenueChartDesc', genesisStep: 17 },
    ]
  },
];

// Flatten all sections for settings management
const ALL_SECTIONS = PITCH_PARTS.flatMap(part => part.sections);

// Default visibility settings
const DEFAULT_SETTINGS: Record<string, boolean> = {
  show_media_gallery: true,
  show_device_description: true,
  show_device_type: true,
  show_trl_architecture: true,
  show_technical_specs: true,
  show_market_sizing: true,
  show_customer_segments: true,
  show_competitor_analysis: true,
  show_clinical_evidence: true,
  show_regulatory_timeline: true,
  show_reimbursement_strategy: true,
  show_gtm_strategy: true,
  show_team_profile: true,
  show_manufacturing: true,
  show_roadmap: true,
  show_risk_summary: true,
  show_use_of_proceeds: true,
  show_viability_score: true,
  show_business_canvas: true,
  show_revenue_chart: true,
  show_exit_strategy: true,
};

interface EnhancedPitchBuilderProps {
  variant?: 'card' | 'embedded';
}

export function EnhancedPitchBuilder({ variant = 'card' }: EnhancedPitchBuilderProps) {
  const { productId } = useParams<{ productId: string }>();
  const { lang } = useTranslation();
  const { companyId } = useCompany();
  const { data: product } = useProductDetails(productId);
  const { settings, createOrUpdate, isUpdating } = useInvestorShareSettings(companyId);
  const { openPreview } = useInvestorPreview();
  
  const companyName = product?.company || '';
  
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set(PITCH_PARTS.map(p => p.id)));
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  
  const [visibilitySettings, setVisibilitySettings] = useState<Record<string, boolean>>(DEFAULT_SETTINGS);

  // Sync with saved settings
  useEffect(() => {
    if (settings) {
      const merged = { ...DEFAULT_SETTINGS };
      Object.keys(merged).forEach(key => {
        if ((settings as any)[key] !== undefined) {
          merged[key] = (settings as any)[key];
        }
      });
      setVisibilitySettings(merged);
    }
  }, [settings]);

  const togglePart = (partId: string) => {
    setExpandedParts(prev => {
      const next = new Set(prev);
      if (next.has(partId)) {
        next.delete(partId);
      } else {
        next.add(partId);
      }
      return next;
    });
  };

  const toggleSection = (key: string, value: boolean) => {
    setVisibilitySettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleEntirePart = (part: PitchPart, enable: boolean) => {
    const updates: Record<string, boolean> = {};
    part.sections.forEach(section => {
      updates[section.settingKey] = enable;
    });
    setVisibilitySettings(prev => ({ ...prev, ...updates }));
  };

  const isPartFullyEnabled = (part: PitchPart): boolean => {
    return part.sections.every(s => visibilitySettings[s.settingKey]);
  };

  const isPartPartiallyEnabled = (part: PitchPart): boolean => {
    const enabledCount = part.sections.filter(s => visibilitySettings[s.settingKey]).length;
    return enabledCount > 0 && enabledCount < part.sections.length;
  };

  const handleSaveSettings = async () => {
    if (!companyId) {
      toast.error('Company not found');
      return;
    }

    const saveData: Record<string, any> = {
      ...visibilitySettings,
      featured_product_id: productId || null,
    };

    // Auto-generate a share link if one doesn't exist yet
    if (!settings?.public_slug) {
      saveData.public_slug = generateShareSlug();
      saveData.is_active = true;
    }

    createOrUpdate(saveData);
  };

  const handlePreview = () => {
    openPreview();
  };

  const handleCopyLink = async () => {
    let slug = settings?.public_slug;
    
    if (!slug) {
      if (!companyId) {
        toast.error('Company not found');
        return;
      }
      
      setIsGeneratingLink(true);
      try {
        slug = generateShareSlug();

        // Check if a row already exists for this company
        const { data: existing } = await supabase
          .from('company_investor_share_settings')
          .select('id')
          .eq('company_id', companyId)
          .maybeSingle();

        let error;
        if (existing) {
          // Update existing row
          ({ error } = await supabase
            .from('company_investor_share_settings')
            .update({
              public_slug: slug,
              is_active: true,
              featured_product_id: productId || null,
              updated_at: new Date().toISOString(),
            })
            .eq('company_id', companyId));
        } else {
          // Insert new row
          ({ error } = await supabase
            .from('company_investor_share_settings')
            .insert({
              company_id: companyId,
              public_slug: slug,
              is_active: true,
              featured_product_id: productId || null,
              updated_at: new Date().toISOString(),
            }));
        }

        if (error) throw error;

        toast.success('Share link generated');
      } catch (error) {
        console.error('Error generating share link:', error);
        toast.error('Failed to generate share link');
        setIsGeneratingLink(false);
        return;
      }
      setIsGeneratingLink(false);
    }
    
    const url = getInvestorShareUrl(slug);
    navigator.clipboard.writeText(url);
    toast.success('Share link copied to clipboard');
  };

  const handleDownloadPDF = async () => {
    if (!product || !companyName) {
      toast.error('Product or company data not available');
      return;
    }

    setIsExporting(true);
    try {
      const enabledSections = ALL_SECTIONS
        .filter(s => visibilitySettings[s.settingKey])
        .map(s => s.id);

      await exportPitchDeckToPDF({
        companyName,
        productName: product.name,
        enabledSections,
        productId: productId!,
        companyId: companyId!,
      });
      toast.success('Pitch deck downloaded');
    } catch (error) {
      console.error('Error exporting pitch deck:', error);
      toast.error('Failed to generate pitch deck');
    } finally {
      setIsExporting(false);
    }
  };

  const enabledCount = Object.values(visibilitySettings).filter(Boolean).length;
  const totalCount = ALL_SECTIONS.length;

  const content = (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handlePreview} variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          {lang('genesis.preview')}
        </Button>
        <Button onClick={handleCopyLink} variant="outline" size="sm" disabled={isGeneratingLink}>
          {isGeneratingLink ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Share2 className="h-4 w-4 mr-2" />
          )}
          {lang('genesis.copyLink')}
        </Button>
        <Button onClick={handleDownloadPDF} size="sm" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {lang('genesis.downloadPdf')}
        </Button>
      </div>

      <Separator />

      {/* Part-based Section Configuration */}
      <div className="space-y-3">
        {PITCH_PARTS.map((part) => {
          const isExpanded = expandedParts.has(part.id);
          const fullyEnabled = isPartFullyEnabled(part);
          const partiallyEnabled = isPartPartiallyEnabled(part);
          const enabledInPart = part.sections.filter(s => visibilitySettings[s.settingKey]).length;

          return (
            <Collapsible key={part.id} open={isExpanded} onOpenChange={() => togglePart(part.id)}>
              <div className="border rounded-lg overflow-hidden">
                {/* Part Header */}
                <div className="flex items-center gap-3 p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-2 flex-1 text-left">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                          {lang('genesis.part')} {part.partNumber}
                        </p>
                        <p className="text-sm font-medium">{lang(part.titleKey)}</p>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  
                  <Badge variant={fullyEnabled ? 'default' : partiallyEnabled ? 'secondary' : 'outline'} className="text-xs">
                    {enabledInPart}/{part.sections.length}
                  </Badge>
                  
                  <Switch
                    checked={fullyEnabled}
                    onCheckedChange={(checked) => toggleEntirePart(part, checked)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                {/* Section Items */}
                <CollapsibleContent>
                  <div className="divide-y border-t">
                    {part.sections.map((section) => {
                      const Icon = section.icon;
                      const enabled = visibilitySettings[section.settingKey];

                      return (
                        <div
                          key={section.id}
                          className={`flex items-center gap-3 p-3 pl-8 ${
                            enabled ? 'bg-primary/5' : 'bg-background'
                          }`}
                        >
                          <div className={`p-1.5 rounded-md ${enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Icon className={`h-4 w-4 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {lang(section.labelKey)}
                              </p>
                              {section.genesisStep && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                  {lang('genesis.step')} {section.genesisStep}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{lang(section.descriptionKey)}</p>
                          </div>
                          
                          <Switch
                            checked={enabled}
                            onCheckedChange={(checked) => toggleSection(section.settingKey, checked)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      <Separator />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={isUpdating} size="sm">
          {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {lang('genesis.saveConfiguration')}
        </Button>
      </div>
    </div>
  );

  if (variant === 'embedded') {
    return content;
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <Presentation className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">{lang('genesis.pitchBuilder')}</CardTitle>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Beta</Badge>
              </div>
              <CardDescription>
                {lang('genesis.pitchBuilderDesc')}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary">
            {enabledCount}/{totalCount} {lang('genesis.sections')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
