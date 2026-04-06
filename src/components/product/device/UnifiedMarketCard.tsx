import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProductLaunchPhaseService } from '@/services/productLaunchPhaseService';
import { ChevronDown, ChevronRight, Info, Calendar, CheckCircle2, Clock, Building, Users, FileCheck, Building2, Handshake, Stethoscope } from 'lucide-react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { EnhancedProductMarket } from "@/types/client";
import { MarketPartnerEntry } from "@/utils/enhancedMarketRiskClassMapping";
import { MarketSpecificForm } from "./MarketSpecificForm";
import { PartnerCategoryForm, PARTNER_CATEGORIES } from "./MarketPartnerForm";
import { NotifiedBodySearchDropdown } from "@/components/settings/NotifiedBodySearchDropdown";
import { NotifiedBodyDisplay } from "@/components/settings/NotifiedBodyDisplay";
import { NotifiedBodyDiscoveryTool } from "@/components/settings/NotifiedBodyDiscoveryTool";
import { NotifiedBody } from "@/types/notifiedBody";
import { InvestorVisibleBadge } from '@/components/ui/investor-visible-badge';
import { getMarketCurrency } from "@/utils/marketCurrencyUtils";
import { getRiskClassesForMarket } from "@/utils/marketRiskClassMapping";
import { getMarketLaunchStatus } from "@/utils/launchStatusUtils";
import { CONFORMITY_ROUTES, getSuggestedConformityRoute, CONFORMITY_ROUTE_DESCRIPTIONS } from '@/utils/conformityRouteUtils';
import { ConditionalClassificationTrigger } from "@/components/classification/ConditionalClassificationTrigger";
import { FDAClassificationTrigger } from "@/components/classification/FDAClassificationTrigger";
import { FDAIVDClassificationTrigger } from "@/components/classification/FDAIVDClassificationTrigger";
import { CanadaClassificationTrigger } from "@/components/classification/CanadaClassificationTrigger";
import { CanadaIVDClassificationTrigger } from "@/components/classification/CanadaIVDClassificationTrigger";
import { AustraliaClassificationTrigger } from "@/components/classification/AustraliaClassificationTrigger";
import { AustraliaIVDClassificationTrigger } from "@/components/classification/AustraliaIVDClassificationTrigger";
import { UKClassificationTrigger } from "@/components/classification/UKClassificationTrigger";
import { UKIVDRClassificationTrigger } from "@/components/classification/UKIVDRClassificationTrigger";
import { JapanClassificationTrigger } from "@/components/classification/JapanClassificationTrigger";
import { JapanIVDClassificationTrigger } from "@/components/classification/JapanIVDClassificationTrigger";
import { BrazilClassificationTrigger } from "@/components/classification/BrazilClassificationTrigger";
import { BrazilIVDClassificationTrigger } from "@/components/classification/BrazilIVDClassificationTrigger";
import { SouthKoreaClassificationTrigger } from "@/components/classification/SouthKoreaClassificationTrigger";
import { SouthKoreaIVDClassificationTrigger } from "@/components/classification/SouthKoreaIVDClassificationTrigger";
import { ChinaClassificationTrigger } from "@/components/classification/ChinaClassificationTrigger";
import { ChinaIVDClassificationTrigger } from "@/components/classification/ChinaIVDClassificationTrigger";
import IndiaClassificationTrigger from "@/components/classification/IndiaClassificationTrigger";
import { IndiaIVDClassificationTrigger } from "@/components/classification/IndiaIVDClassificationTrigger";
import { SwitzerlandClassificationTrigger } from "@/components/classification/SwitzerlandClassificationTrigger";
import { SwissIVDClassificationTrigger } from "@/components/classification/SwissIVDClassificationTrigger";
import { ClassificationRuleCard, ClassificationRuleInfo } from "@/components/classification/ClassificationRuleCard";
import { ComponentRiskClassificationSection } from "./ComponentRiskClassificationSection";
import { ClassificationResult, DeviceClass } from "@/types/classification";
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { InheritanceExclusionPopover } from '@/components/shared/InheritanceExclusionPopover';
import { ItemExclusionScope } from '@/hooks/useInheritanceExclusion';

interface FieldExclusionHook {
  getExclusionScope: (itemId: string) => ItemExclusionScope;
  setExclusionScope: (itemId: string, scope: ItemExclusionScope) => Promise<void> | void;
}

interface UnifiedMarketCardProps {
  market: EnhancedProductMarket;
  onMarketChange: (market: EnhancedProductMarket) => void;
  isLoading?: boolean;
  companyId?: string;
  hasEudamedData?: boolean;
  disabledByLimit?: boolean;
  disabled?: boolean;
  autoExpand?: boolean;
  isFirstSelectedMarket?: boolean;
  primaryRegulatoryType?: string;
  keyTechnologyCharacteristics?: any;
  onKeyTechnologyCharacteristicsChange?: (value: any) => void;
  productId?: string;
  projectedLaunchDate?: string | null;
  showClassificationHighlight?: boolean;
  showEconomicBuyerHighlight?: boolean;
  showStrategicPartnersHighlight?: boolean;
  belongsToFamily?: boolean;
  familyProductIds?: string[];
  fieldExclusion?: FieldExclusionHook;
  valueMatchingProductIds?: string[];
}

// Market Entry Information with bureaucracy steps
const getMarketEntryInfo = (marketCode: string) => {
  const marketEntryData: Record<string, { flag: string; name: string; bureaucracy: string[] }> = {
    'EU': {
      flag: '🇪🇺',
      name: 'European Union (EU)',
      bureaucracy: [
        'Appoint EU Authorized Representative (if non-EU)',
        'Notify a Notified Body (Class IIa+ devices)',
        'Register in EUDAMED',
        'Prepare technical documentation'
      ]
    },
    'USA': {
      flag: '🇺🇸',
      name: 'United States (FDA)',
      bureaucracy: [
        'Appoint US Agent (if foreign)',
        'Submit IDE for trials (if needed)',
        'Register facility with FDA',
        'Submit premarket submission (510(k), PMA, etc.)'
      ]
    },
    'JP': {
      flag: '🇯🇵',
      name: 'Japan (PMDA)',
      bureaucracy: [
        'Appoint Marketing Authorization Holder (MAH)',
        'Local clinical trial often required',
        'J-GMP audit required',
        'Submit to PMDA for evaluation'
      ]
    },
    'CN': {
      flag: '🇨🇳',
      name: 'China (NMPA)',
      bureaucracy: [
        'Appoint China Legal Agent',
        'Translate all documentation into Chinese',
        'Local testing in China',
        'Submit dossier to NMPA'
      ]
    },
    'CA': {
      flag: '🇨🇦',
      name: 'Canada (Health Canada)',
      bureaucracy: [
        'Submit device license (Class II–IV)',
        'Appoint importer (if foreign)',
        'Must meet Canadian Medical Device Regulations (CMDR)'
      ]
    },
    'AU': {
      flag: '🇦🇺',
      name: 'Australia (TGA)',
      bureaucracy: [
        'Appoint Australian Sponsor',
        'Submit to TGA with CE/FDA evidence',
        'Complete ARTG registration'
      ]
    },
    'BR': {
      flag: '🇧🇷',
      name: 'Brazil (ANVISA)',
      bureaucracy: [
        'Appoint Brazilian Registration Holder (BRH)',
        'Translate and submit dossier to ANVISA',
        'GMP audit or certification'
      ]
    },
    'IN': {
      flag: '🇮🇳',
      name: 'India (CDSCO)',
      bureaucracy: [
        'Apply for Import License',
        'Register with CDSCO',
        'Local clinical data may be needed'
      ]
    },
    'UK': {
      flag: '🇬🇧',
      name: 'United Kingdom (MHRA)',
      bureaucracy: [
        'Appoint UK Responsible Person (if non-UK)',
        'Register with MHRA',
        'UKCA marking required (or CE until deadline)'
      ]
    },
    'CH': {
      flag: '🇨🇭',
      name: 'Switzerland (Swissmedic)',
      bureaucracy: [
        'Appoint CH-REP (if non-CH)',
        'Register with Swissmedic',
        'MRA recognition may apply'
      ]
    },
    'KR': {
      flag: '🇰🇷',
      name: 'South Korea (MFDS)',
      bureaucracy: [
        'Appoint Korean Registration Holder',
        'Local testing may be required',
        'Submit to MFDS for review'
      ]
    }
  };

  return marketEntryData[marketCode] || null;
};

// Helper to normalize classification result
const normalizeClassificationResult = (deviceClass: string): string => {
  if (deviceClass.includes('Class I') && (
    deviceClass.includes('(Sterile)') || 
    deviceClass.includes('(Measuring)') || 
    deviceClass.includes('(Reusable')
  )) {
    return 'I';
  }
  let normalized = deviceClass.replace(/^Class\s+/i, '').trim();
  normalized = normalized.replace(/\s*\([^)]*\)\s*$/, '').trim();
  return normalized;
};

export function UnifiedMarketCard({
  market,
  onMarketChange,
  isLoading = false,
  companyId,
  hasEudamedData = false,
  disabledByLimit = false,
  disabled = false,
  autoExpand = false,
  isFirstSelectedMarket = false,
  primaryRegulatoryType,
  keyTechnologyCharacteristics,
  productId,
  showClassificationHighlight = false,
  showEconomicBuyerHighlight = false,
  showStrategicPartnersHighlight = false,
  belongsToFamily = false,
  familyProductIds,
  fieldExclusion,
  valueMatchingProductIds,
}: UnifiedMarketCardProps) {
  const { lang } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(autoExpand && market.selected);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  
  const marketInfo = getMarketEntryInfo(market.code);
  const marketCurrency = getMarketCurrency(market.code);
  const isIVD = primaryRegulatoryType === 'In Vitro Diagnostic (IVD)';
  const riskClasses = getRiskClassesForMarket(market.code, isIVD);
  const isSiMD = keyTechnologyCharacteristics?.isSoftwareMobileApp === true;

  useEffect(() => {
    if (autoExpand && market.selected) {
      setIsExpanded(true);
    }
  }, [autoExpand, market.selected]);

  // Auto-expand buyer section when showing economic buyer highlight and scroll to it
  useEffect(() => {
    if (showEconomicBuyerHighlight) {
      if (!expandedSections.includes('buyer')) {
        setExpandedSections(prev => [...prev, 'buyer']);
      }
      // Scroll to economic buyer section after a short delay to allow expansion
      const timer = setTimeout(() => {
        const element = document.getElementById(`economic-buyer-section-${market.code}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showEconomicBuyerHighlight, market.code]);

  // Auto-expand strategic partners section when showing highlight and scroll to it
  useEffect(() => {
    if (showStrategicPartnersHighlight) {
      if (!expandedSections.includes('partners')) {
        setExpandedSections(prev => [...prev, 'partners']);
      }
      // Scroll to partners section after a short delay to allow expansion
      const timer = setTimeout(() => {
        const element = document.getElementById(`strategic-partners-section-${market.code}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showStrategicPartnersHighlight, market.code]);

  const [showEudamedConfirm, setShowEudamedConfirm] = useState(false);

  const handleSelectionChange = (checked: boolean) => {
    // Show confirmation when deselecting EU with EUDAMED data
    if (market.code === 'EU' && hasEudamedData && !checked) {
      setShowEudamedConfirm(true);
      return;
    }
    // Auto-set launched when selecting EU on EUDAMED device
    if (market.code === 'EU' && hasEudamedData && checked) {
      onMarketChange({
        ...market,
        selected: true,
        marketLaunchStatus: 'launched' as const,
        actualLaunchDate: market.actualLaunchDate || new Date().toISOString(),
      });
      return;
    }
    onMarketChange({ ...market, selected: checked });
  };

  const handleLaunchStatusChange = (checked: boolean) => {
    const actualLaunchDate = checked ? (market.actualLaunchDate || new Date().toISOString()) : undefined;
    onMarketChange({
      ...market,
      marketLaunchStatus: checked ? 'launched' as const : 'planned' as const,
      actualLaunchDate
    });

    // Auto-complete development phases when product is first launched
    if (checked && productId && companyId && actualLaunchDate) {
      const dateStr = typeof actualLaunchDate === 'string' ? actualLaunchDate : actualLaunchDate.toISOString();
      ProductLaunchPhaseService.completePhasesOnLaunch(productId, companyId, dateStr);
    }
  };

  const handleRiskClassChange = (value: string) => {
    onMarketChange({ ...market, riskClass: value });
  };

  const handleConformityRouteChange = (value: string) => {
    onMarketChange({ ...market, conformityAssessmentRoute: value });
  };

  // Generic handler for classification triggers
  const handleClassificationComplete = (deviceClass: DeviceClass | string, result?: ClassificationResult | any) => {
    const classStr = typeof deviceClass === 'string' ? deviceClass : String(deviceClass);
    const normalizedClass = normalizeClassificationResult(classStr);
    const allowedClasses = getRiskClassesForMarket(market.code, isIVD);
    const matchingValue = allowedClasses.find(c => c.value.toLowerCase() === normalizedClass.toLowerCase());
    
    if (matchingValue) {
      const updates: Partial<EnhancedProductMarket> = {
        riskClass: matchingValue.value,
      };

      if (result) {
        updates.classificationRule = {
          rule: result.rule || result.rationale || '',
          description: result.description || result.productCodeName || '',
          determinedBy: 'assistant',
          ruleText: result.ruleText,
          ruleSource: result.ruleSource,
          decisionPath: result.decisionPath ? {
            path: result.decisionPath.map((d: any) => d.questionId || d),
            answers: result.decisionPath.reduce ?
              Object.fromEntries(result.decisionPath.map((d: any) => [d.questionId || d, d.selectedOptionId || ''])) :
              {}
          } : undefined
        };
      }

      onMarketChange({ ...market, ...updates });
    }
  };

  const launchStatus = getMarketLaunchStatus(market);
  const isLaunched = launchStatus.isLaunched;
  const suggestedRoute = market.code === 'EU' ? getSuggestedConformityRoute(market.riskClass || '') : null;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  // Render classification assistant based on market
  const renderClassificationAssistant = () => {
    if (market.code === 'EU') {
      return (
        <ConditionalClassificationTrigger
          onClassificationSelected={handleClassificationComplete}
          primaryRegulatoryType={primaryRegulatoryType}
          keyTechnologyCharacteristics={keyTechnologyCharacteristics}
        />
      );
    }

    if (market.code === 'USA') {
      return isIVD ? (
        <FDAIVDClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      ) : (
        <FDAClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      );
    }

    if (market.code === 'CA') {
      return isIVD ? (
        <CanadaIVDClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      ) : (
        <CanadaClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      );
    }

    if (market.code === 'AU') {
      return isIVD ? (
        <AustraliaIVDClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      ) : (
        <AustraliaClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      );
    }

    if (market.code === 'UK') {
      return isIVD ? (
        <UKIVDRClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      ) : (
        <UKClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      );
    }

    if (market.code === 'JP') {
      return isIVD ? (
        <JapanIVDClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      ) : (
        <JapanClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      );
    }

    if (market.code === 'BR') {
      return isIVD ? (
        <BrazilIVDClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      ) : (
        <BrazilClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      );
    }

    if (market.code === 'CN') {
      return isIVD ? (
        <ChinaIVDClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      ) : (
        <ChinaClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      );
    }

    if (market.code === 'IN') {
      return isIVD ? (
        <IndiaIVDClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      ) : (
        <IndiaClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      );
    }

    if (market.code === 'KR') {
      return isIVD ? (
        <SouthKoreaIVDClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      ) : (
        <SouthKoreaClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      );
    }

    if (market.code === 'CH') {
      return isIVD ? (
        <SwissIVDClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      ) : (
        <SwitzerlandClassificationTrigger onClassificationSelected={handleClassificationComplete} />
      );
    }

    return null;
  };

  // Convert market classificationRule to ClassificationRuleInfo format
  const ruleInfo: ClassificationRuleInfo | null = market.classificationRule ? {
    rule: market.classificationRule.rule,
    description: market.classificationRule.description,
    determinedBy: market.classificationRule.determinedBy,
    ruleText: market.classificationRule.ruleText,
    ruleSource: market.classificationRule.ruleSource,
    decisionPath: market.classificationRule.decisionPath
  } : null;

  return (
    <>
    <Card 
      data-market-code={market.code}
      className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-md"
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <Checkbox
                  id={`market-${market.code}`}
                  checked={market.selected}
                  onCheckedChange={handleSelectionChange}
                  disabled={isLoading || disabledByLimit || disabled}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <Label htmlFor={`market-${market.code}`} className="font-medium cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      {marketInfo?.flag} {market.name}
                    </Label>
                    {/* {market.code === 'EU' && hasEudamedData && (
                      <Badge variant="default" className="text-xs bg-primary">
                        Auto-selected (EUDAMED)
                      </Badge>
                    )} */}
                    {disabledByLimit && (
                      <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                        Limit reached
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {marketCurrency.symbol} {marketCurrency.code}
                    </Badge>
                    {market.riskClass && (
                      <Badge variant="secondary" className="text-xs">
                        Class {market.riskClass}
                      </Badge>
                    )}
                    {isLaunched && (
                      <Badge variant="default" className="text-xs bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Launched
                      </Badge>
                    )}
                    {market.selected && !isLaunched && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                        <Clock className="h-3 w-3 mr-1" />
                        Planned
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {marketInfo && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={(e) => e.stopPropagation()}>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <span className="text-2xl">{marketInfo.flag}</span>
                          <span>Market Entry Steps - {marketInfo.name}</span>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Required Bureaucratic Steps:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {marketInfo.bureaucracy.map((item, index) => (
                              <li key={index} className="text-sm text-muted-foreground">{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {companyId && productId && fieldExclusion && (
                  <InheritanceExclusionPopover
                    companyId={companyId}
                    currentProductId={productId}
                    itemId={`market_${market.code}`}
                    exclusionScope={fieldExclusion.getExclusionScope(`market_${market.code}`)}
                    onScopeChange={(id, scope) => fieldExclusion.setExclusionScope(id, scope)}
                    defaultCurrentDeviceOnly
                    familyProductIds={familyProductIds}
                    valueMatchingProductIds={valueMatchingProductIds}
                  />
                )}
                <div className="transform transition-transform duration-300 ease-in-out">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent className="transition-all duration-300 ease-in-out">
          <CardContent className="pt-0 space-y-4">
            {/* Section 1: Market Entry */}
            <Collapsible open={expandedSections.includes('entry')} onOpenChange={() => toggleSection('entry')}>
              <CollapsibleTrigger className="flex items-center w-full py-2 px-3 bg-muted/50 rounded-md hover:bg-muted">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium text-sm flex-1 text-left">Market Entry</span>
                {expandedSections.includes('entry') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 pl-6 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`launch-${market.code}`}
                    checked={isLaunched}
                    onCheckedChange={handleLaunchStatusChange}
                    disabled={isLoading || disabled}
                  />
                  <Label htmlFor={`launch-${market.code}`} className="text-sm font-medium cursor-pointer">
                    Launched in Market
                  </Label>
                </div>
                {/* {isEULaunchedByEudamed ? (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 ml-6">
                    ✓ Automatically marked as launched (EUDAMED data)
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground ml-6">
                    Check when the device is commercially available. This triggers PMS requirements.
                  </p>
                )} */}
                {market.actualLaunchDate && (
                  <div className="flex items-center ml-6 text-sm gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Launch Date:</span>
                    <input
                      type="date"
                      value={market.actualLaunchDate ? new Date(market.actualLaunchDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        onMarketChange({
                          ...market,
                          actualLaunchDate: e.target.value ? new Date(e.target.value).toISOString() : undefined
                        });
                      }}
                      disabled={isLoading}
                      className="text-sm font-medium border rounded px-2 py-0.5 bg-background"
                    />
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Section 2: Classification & Compliance */}
            <Collapsible open={expandedSections.includes('classification')} onOpenChange={() => toggleSection('classification')}>
              <CollapsibleTrigger className="flex items-center w-full py-2 px-3 bg-muted/50 rounded-md hover:bg-muted">
                <FileCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium text-sm flex-1 text-left">Classification & Compliance</span>
                {expandedSections.includes('classification') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 pl-6 space-y-4">
                {/* Risk Class Selection */}
                {(() => {
                  const hasValidRiskClass = isSiMD
                    ? Boolean(market.componentClassification?.overallRiskClass && market.componentClassification.overallRiskClass !== 'TBD')
                    : Boolean(market.riskClass && market.riskClass !== 'Not yet determined' && market.riskClass !== 'TBD' && market.riskClass.trim() !== '');

                  return (
                <div className={cn(
                  "space-y-2 p-3 rounded-lg transition-colors",
                  showClassificationHighlight && (
                    hasValidRiskClass
                      ? "border-2 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20"
                      : "border-2 border-amber-400 bg-amber-50/30 dark:bg-amber-950/20"
                  )
                )}>
                  {isSiMD ? (
                    <ComponentRiskClassificationSection
                      marketCode={market.code}
                      marketName={market.name}
                      componentClassification={market.componentClassification}
                      onComponentClassificationChange={(marketCode, classification) => {
                        onMarketChange({
                          ...market,
                          riskClass: classification.overallRiskClass || '',
                          componentClassification: classification,
                        });
                      }}
                      deviceType="simd"
                      isLoading={isLoading}
                      primaryRegulatoryType={primaryRegulatoryType}
                      keyTechnologyCharacteristics={keyTechnologyCharacteristics}
                      compactMode={true}
                    />
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Risk Class</Label>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Select
                          value={market.riskClass || ''}
                          onValueChange={handleRiskClassChange}
                          disabled={isLoading || disabled}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {riskClasses.map((rc) => (
                              <SelectItem key={rc.value} value={rc.value}>
                                {rc.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {renderClassificationAssistant()}
                      </div>
                    </>
                  )}
                  {ruleInfo && (
                    <div className="mt-2">
                      <ClassificationRuleCard
                        ruleInfo={ruleInfo}
                        marketCode={market.code}
                        riskClass={market.riskClass}
                        marketName={market.name}
                      />
                    </div>
                  )}
                </div>
                  );
                })()}

                {/* Conformity Assessment Route (EU only) */}
                {market.code === 'EU' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Conformity Assessment Route</Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={market.conformityAssessmentRoute || ''}
                        onValueChange={handleConformityRouteChange}
                        disabled={isLoading || disabled}
                      >
                        <SelectTrigger className="w-full max-w-md">
                          <SelectValue placeholder="Select route" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONFORMITY_ROUTES.map((route) => (
                            <SelectItem key={route.value} value={route.value}>
                              {route.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {suggestedRoute && !market.conformityAssessmentRoute && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConformityRouteChange(suggestedRoute)}
                          disabled={disabled}
                        >
                          <Badge variant="secondary" className="mr-2">Suggested</Badge>
                          Apply {suggestedRoute}
                        </Button>
                      )}
                    </div>
                    {market.conformityAssessmentRoute && CONFORMITY_ROUTE_DESCRIPTIONS[market.conformityAssessmentRoute] && (
                      <p className="text-xs text-muted-foreground">
                        {CONFORMITY_ROUTE_DESCRIPTIONS[market.conformityAssessmentRoute]}
                      </p>
                    )}
                  </div>
                )}

                {/* Clinical/PMCF toggles */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`clinical-${market.code}`}
                      checked={(market as any).clinicalInvestigationRequired || false}
                      onCheckedChange={(checked) => onMarketChange({ ...market, clinicalInvestigationRequired: checked } as EnhancedProductMarket)}
                      disabled={isLoading || disabled}
                    />
                    <Label htmlFor={`clinical-${market.code}`} className="text-sm">
                      Clinical Investigation Required
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`pmcf-${market.code}`}
                      checked={(market as any).pmcfRequired || false}
                      onCheckedChange={(checked) => onMarketChange({ ...market, pmcfRequired: checked } as EnhancedProductMarket)}
                      disabled={isLoading || disabled}
                    />
                    <Label htmlFor={`pmcf-${market.code}`} className="text-sm">
                      PMCF Required
                    </Label>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Section 3: Agents & Representatives */}
            <Collapsible open={expandedSections.includes('agents')} onOpenChange={() => toggleSection('agents')}>
              <CollapsibleTrigger className="flex items-center w-full py-2 px-3 bg-muted/50 rounded-md hover:bg-muted">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium text-sm flex-1 text-left">Agents & Representatives</span>
                {expandedSections.includes('agents') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 pl-6">
                <MarketSpecificForm
                  market={market}
                  onMarketChange={onMarketChange}
                  isLoading={isLoading}
                  companyId={companyId}
                  isFirstSelectedMarket={isFirstSelectedMarket}
                />
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Section 4: Economic Buyer Profile */}
            <Collapsible open={expandedSections.includes('buyer')} onOpenChange={() => toggleSection('buyer')}>
              <CollapsibleTrigger
                id={`economic-buyer-section-${market.code}`}
                className="flex items-center w-full py-2 px-3 bg-muted/50 rounded-md hover:bg-muted"
              >
                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium text-sm flex-1 text-left">Economic Buyer Profile</span>
                {expandedSections.includes('buyer') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 pl-6 space-y-3">
                {(() => {
                  // Check if economic buyer profile is complete (both budgetType AND buyerType set)
                  const hasValidEconomicBuyer = market.budgetType && market.buyerType;

                  return (
                <div className={cn(
                  "p-3 rounded-lg transition-colors",
                  showEconomicBuyerHighlight && (
                    hasValidEconomicBuyer
                      ? "border-2 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20"
                      : "border-2 border-amber-400 bg-amber-50/30 dark:bg-amber-950/20"
                  )
                )}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Budget Type</Label>
                      <Select
                        value={market.budgetType || ''}
                        onValueChange={(value) => onMarketChange({ ...market, budgetType: value })}
                        disabled={isLoading || disabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="capex">CapEx (Capital Expenditure)</SelectItem>
                          <SelectItem value="opex">OpEx (Operational Expenditure)</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Buyer Type</Label>
                      <Select
                        value={market.buyerType || ''}
                        onValueChange={(value) => onMarketChange({ ...market, buyerType: value })}
                        disabled={isLoading || disabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select buyer type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hospital">Hospital</SelectItem>
                          <SelectItem value="clinic">Clinic</SelectItem>
                          <SelectItem value="laboratory">Laboratory</SelectItem>
                          <SelectItem value="distributor">Distributor</SelectItem>
                          <SelectItem value="government">Government</SelectItem>
                          <SelectItem value="private">Private Practice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                  );
                })()}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Reimbursement Code</Label>
                  <Input
                    placeholder="Enter reimbursement code (e.g., CPT, DRG)"
                    value={market.reimbursementCode || ''}
                    onChange={(e) => onMarketChange({ ...market, reimbursementCode: e.target.value })}
                    disabled={isLoading || disabled}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Section 5: Strategic Partners */}
            {(() => {
              // Check if this market has at least 2 partners total (for Genesis completion)
              const totalPartners = (market.distributionPartners?.length ?? 0) +
                (market.clinicalPartners?.length ?? 0) +
                (market.regulatoryPartners?.length ?? 0);
              const isComplete = totalPartners >= 2;
              
              return (
                <Collapsible open={expandedSections.includes('partners')} onOpenChange={() => toggleSection('partners')}>
                  <CollapsibleTrigger 
                    id={`strategic-partners-section-${market.code}`}
                    className={cn(
                      "flex items-center w-full py-2 px-3 rounded-md hover:bg-muted transition-colors",
                      showStrategicPartnersHighlight
                        ? isComplete
                          ? "border-2 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20"
                          : "border-2 border-amber-400 bg-amber-50/30 dark:bg-amber-950/20"
                        : "bg-muted/50"
                    )}
                  >
                    <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium text-sm flex-1 text-left">Strategic Partners</span>
                    <InvestorVisibleBadge />
                    {expandedSections.includes('partners') ? <ChevronDown className="h-4 w-4 ml-2" /> : <ChevronRight className="h-4 w-4 ml-2" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className={cn(
                    "pt-3 pl-6 space-y-4",
                    showStrategicPartnersHighlight && (
                      isComplete
                        ? "border-2 border-t-0 border-emerald-500 rounded-b-lg -mt-1 px-3 pb-3"
                        : "border-2 border-t-0 border-amber-400 rounded-b-lg -mt-1 px-3 pb-3"
                    )
                  )}>
                {/* Distribution Partners */}
                <PartnerCategoryForm
                  category={PARTNER_CATEGORIES.find(c => c.key === 'distribution')!}
                  partners={market.distributionPartners || []}
                  onChange={(partners: MarketPartnerEntry[]) => 
                    onMarketChange({ ...market, distributionPartners: partners })
                  }
                  isLoading={isLoading}
                />

                {/* Clinical Partners */}
                <PartnerCategoryForm
                  category={PARTNER_CATEGORIES.find(c => c.key === 'clinical')!}
                  partners={market.clinicalPartners || []}
                  onChange={(partners: MarketPartnerEntry[]) => 
                    onMarketChange({ ...market, clinicalPartners: partners })
                  }
                  isLoading={isLoading}
                />

                {/* Regulatory Partners (includes EU Notified Body for EU markets) */}
                <div className="space-y-3">
                  <PartnerCategoryForm
                    category={PARTNER_CATEGORIES.find(c => c.key === 'regulatory')!}
                    partners={market.regulatoryPartners || []}
                    onChange={(partners: MarketPartnerEntry[]) => 
                      onMarketChange({ ...market, regulatoryPartners: partners })
                    }
                    isLoading={isLoading}
                  />

                  {/* EU Notified Body - Read-only, managed at Company level */}
                  {market.code === 'EU' && (
                    <Collapsible 
                      open={expandedSections.includes('notifiedBody')} 
                      onOpenChange={() => toggleSection('notifiedBody')}
                    >
                      <CollapsibleTrigger className="flex items-center w-full py-2 px-3 border rounded-lg bg-muted/30 hover:bg-muted/50">
                        <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium text-sm">EU Notified Body</span>
                        {market.notifiedBody && (
                          <Badge variant="secondary" className="text-xs ml-2">
                            {(market.notifiedBody as NotifiedBody).name?.split(' ').slice(0, 2).join(' ')}...
                          </Badge>
                        )}
                        <div className="flex-1" />
                        {expandedSections.includes('notifiedBody') ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3 pl-4">
                        <div className="space-y-3">
                          <div className="p-3 rounded-lg bg-muted/50 border border-dashed">
                            <p className="text-sm text-muted-foreground">
                              The Notified Body is managed at the company level in{' '}
                              <span className="font-medium text-foreground">Settings → Company Profile</span>.
                              It applies to all EU products.
                            </p>
                          </div>
                          {market.notifiedBody && (
                            <NotifiedBodyDisplay notifiedBody={market.notifiedBody as NotifiedBody} />
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
              );
            })()}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>

      {/* EUDAMED override confirmation dialog */}
      <AlertDialog open={showEudamedConfirm} onOpenChange={setShowEudamedConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deselect EU Market?</AlertDialogTitle>
            <AlertDialogDescription>
              This product has EUDAMED data (Basic UDI-DI / risk class) associated with the EU market.
              Deselecting the EU market will not delete the EUDAMED data, but it will no longer appear as a target market.
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              onMarketChange({
                ...market,
                selected: false,
                marketLaunchStatus: 'planned' as const,
                actualLaunchDate: undefined,
              });
              setShowEudamedConfirm(false);
            }}>
              Yes, deselect EU
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
