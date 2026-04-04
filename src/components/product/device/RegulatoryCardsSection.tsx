import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Info, RefreshCw, Loader2, Check, HelpCircle, Shield, Plus } from "lucide-react";
import { CONFORMITY_ROUTES, getSuggestedConformityRoute, CONFORMITY_ROUTE_DESCRIPTIONS } from '@/utils/conformityRouteUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { marketData, REAUDIT_TIMELINE_OPTIONS, getFutureDate, getRiskClassesForMarket } from "@/utils/marketRiskClassMapping";
import { EnhancedProductMarket } from "@/utils/enhancedMarketRiskClassMapping";
import { ConditionalClassificationTrigger } from "@/components/classification/ConditionalClassificationTrigger";
import { FDAClassificationTrigger } from "@/components/classification/FDAClassificationTrigger";
import { FDAIVDClassificationTrigger } from "@/components/classification/FDAIVDClassificationTrigger";
import { CanadaClassificationTrigger } from "@/components/classification/CanadaClassificationTrigger";
import { CanadaIVDClassificationTrigger } from "@/components/classification/CanadaIVDClassificationTrigger";
import { AustraliaClassificationTrigger } from "@/components/classification/AustraliaClassificationTrigger";
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
import { AustraliaIVDClassificationTrigger } from "@/components/classification/AustraliaIVDClassificationTrigger";
import { SwitzerlandClassificationTrigger } from "@/components/classification/SwitzerlandClassificationTrigger";
import { SwissIVDClassificationTrigger } from "@/components/classification/SwissIVDClassificationTrigger";
import { ClassificationRuleCard } from "@/components/classification/ClassificationRuleCard";
import { ivdrClassificationQuestions } from "@/data/ivdrClassificationRules";
import { ProductUpdateService } from '@/services/productUpdateService';
import { DeviceClass, ClassificationResult } from "@/types/classification";
import { toast } from 'sonner';
import { TabHeader } from "./TabHeader";
import { ComponentRiskClassification } from "@/types/deviceComponents";
import { mapEudamedRiskClass } from "@/utils/deviceClassUtils";
import { useTranslation } from '@/hooks/useTranslation';
import { ComponentRiskClassificationSection } from "./ComponentRiskClassificationSection";

interface RegulatoryCardsSectionProps {
  markets: EnhancedProductMarket[];
  onMarketsChange: (markets: EnhancedProductMarket[]) => void;
  isLoading?: boolean;
  primaryRegulatoryType?: string;
  keyTechnologyCharacteristics?: any;
  onKeyTechnologyCharacteristicsChange?: (value: any) => void; // Callback to update key technology characteristics
  onMarketComponentClassificationChange?: (marketCode: string, classification: ComponentRiskClassification) => void;
  deviceComponents?: Array<{ name: string; description: string; }>; // Components from Product Definition
  productId?: string; // Add productId for syncing with milestones
  projectedLaunchDate?: string | null; // Add projected launch date from milestones
  productData?: any; // Add product data for EUDAMED information
}

// Store classification rules for each market (extended to support decision path and rule text)
interface MarketClassificationRule {
  rule: string;
  description: string;
  determinedBy: 'assistant' | 'manual';
  ruleText?: string;
  ruleSource?: string;
  decisionPath?: {
    path: string[];
    answers: Record<string, string>;
  };
}

// Save status type
type SaveStatus = 'idle' | 'saving' | 'saved';

// Auto-save status indicator component - floating version
function AutoSaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all duration-300 ${status === 'saving'
      ? 'bg-white dark:bg-gray-800 text-muted-foreground border border-gray-200 dark:border-gray-700'
      : 'bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700'
      }`}>
      {status === 'saving' ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Saving...</span>
        </>
      ) : (
        <>
          <div className="flex items-center justify-center w-5 h-5 bg-green-100 dark:bg-green-800 rounded-full">
            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm font-medium">Saved</span>
        </>
      )}
    </div>
  );
}

// Helper function to normalize classification result to dropdown value
// Handles both MDR (I, IIa, IIb, III, Is, Im, Ir) and IVDR (A, B, C, D) and numeric (1, 2, 3, 4)
const normalizeClassificationResult = (deviceClass: string): string => {
  // Handle Class I subcategories specially - they should map to base "I"
  // E.g., "Class Is (Sterile), Class Im (Measuring), Class Ir (Reusable surgical)" -> "I"
  if (deviceClass.includes('Class I') && (
    deviceClass.includes('(Sterile)') || 
    deviceClass.includes('(Measuring)') || 
    deviceClass.includes('(Reusable')
  )) {
    return 'I';
  }
  
  // Strip "Class " prefix if present
  let normalized = deviceClass.replace(/^Class\s+/i, '').trim();
  
  // Handle special cases with parenthetical descriptions
  // e.g., "Is (Sterile)" -> "Is", "Im (Measuring)" -> "Im"
  normalized = normalized.replace(/\s*\([^)]*\)\s*$/, '').trim();
  
  // Return the normalized value (e.g., "IIa", "C", "3", "I")
  return normalized;
};

// Helper function to get tooltip content based on market and switch type
const getTooltipContent = (marketCode: string, switchType: 'clinical' | 'pmcf'): string => {
  const tooltipContent = {
    'USA': {
      clinical: 'Required for most Class III and De Novo devices. Class I and many Class II devices are exempt unless otherwise specified. Requires FDA IDE approval.',
      pmcf: 'FDA requires post-market surveillance for some devices under 522 studies. Also includes adverse event reporting and recall capability.'
    },
    'EU': {
      clinical: 'Required for Class III, implantables, and novel devices. Can be waived if clinical data from equivalent devices is sufficient. Based on MDR Article 61 and Annex XIV.',
      pmcf: 'Required unless adequately justified. PMCF is a continuous process to update the clinical evaluation post-market. Must include a PMCF plan and evaluation report.'
    },
    'JP': {
      clinical: 'Usually required for Class III and IV devices under Shonin approval. Local trials are often mandatory unless foreign data meets J-GCP and is population-justified.',
      pmcf: 'Includes mandatory re-examination for high-risk devices and vigilance activities.'
    },
    'CN': {
      clinical: 'Local trials are required for most Class III and some Class II devices unless on the NMPA exemption list.',
      pmcf: 'NMPA mandates annual reports and potential PMCF studies for high-risk devices.'
    },
    'CA': {
      clinical: 'Required for Class III and IV devices. Health Canada may accept foreign clinical data if conducted according to ICH-GCP.',
      pmcf: 'Health Canada requires post-market surveillance including incident reporting and device problem reporting.'
    },
    'AU': {
      clinical: 'Required for Class III and active implantable devices. TGA may accept overseas clinical data if appropriate to Australian population.',
      pmcf: 'TGA requires post-market monitoring including adverse event reporting and recalls as needed.'
    },
    'BR': {
      clinical: 'Required for Class III and IV devices. ANVISA may accept foreign clinical data with proper justification.',
      pmcf: 'ANVISA requires technovigilance activities including adverse event reporting and post-market studies for high-risk devices.'
    },
    'IN': {
      clinical: 'Required for Class C and D devices. CDSCO may accept foreign clinical data if the study population is representative.',
      pmcf: 'CDSCO requires post-market surveillance including adverse event reporting and periodic safety updates.'
    }
  };

  return tooltipContent[marketCode]?.[switchType] || 'Regulatory requirements vary by market. Consult local regulations for specific details.';
};

export function RegulatoryCardsSection({
  markets = [],
  onMarketsChange,
  isLoading = false,
  primaryRegulatoryType,
  keyTechnologyCharacteristics,
  onKeyTechnologyCharacteristicsChange,
  onMarketComponentClassificationChange,
  deviceComponents = [],
  productId,
  projectedLaunchDate,
  productData
}: RegulatoryCardsSectionProps) {
  const { lang } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check if in Genesis flow for visual indicators
  const returnTo = searchParams.get('returnTo');
  const isInGenesisFlow = returnTo === 'genesis' || returnTo === 'venture-blueprint' || returnTo === 'investor-share' || returnTo === 'gap-analysis';

  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  
  // Initialize classification rules from persisted market data
  const initialClassificationRules = useMemo(() => {
    const rules: Record<string, MarketClassificationRule> = {};
    markets.forEach(market => {
      if (market.classificationRule) {
        rules[market.code] = market.classificationRule;
      }
    });
    return rules;
  }, []);
  
  const [classificationRules, setClassificationRules] = useState<Record<string, MarketClassificationRule>>(initialClassificationRules);

  // Sync classification rules when markets change (e.g., on initial load)
  useEffect(() => {
    const persistedRules: Record<string, MarketClassificationRule> = {};
    markets.forEach(market => {
      if (market.classificationRule) {
        persistedRules[market.code] = market.classificationRule;
      }
    });
    
    // Only update if we have persisted rules and current state is empty
    if (Object.keys(persistedRules).length > 0 && Object.keys(classificationRules).length === 0) {
      setClassificationRules(persistedRules);
    }
  }, [markets]);

  // Auto-save status tracking
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevLoadingRef = useRef(isLoading);

  // Track save status based on isLoading changes
  useEffect(() => {
    // When isLoading changes from false to true, show "Saving..."
    if (isLoading && !prevLoadingRef.current) {
      setSaveStatus('saving');
      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    }

    // When isLoading changes from true to false, show "Saved" then hide
    if (!isLoading && prevLoadingRef.current) {
      setSaveStatus('saved');
      // Hide the "Saved" indicator after 2 seconds
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }

    prevLoadingRef.current = isLoading;

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isLoading]);

  // Keep expandedCards in sync when new markets are selected
  // Removed auto-expansion logic - markets now stay collapsed by default

  // Get selected markets only with defensive check
  const selectedMarkets = useMemo(() => {
    const filtered = markets.filter(market => {
      const isSelected = Boolean(market.selected);
      return isSelected;
    });

    return filtered;
  }, [markets]);

  // Determine if we're in IVD mode (used for rendering classification rule cards)
  const isIVD = primaryRegulatoryType === 'In Vitro Diagnostic (IVD)';

  // Check if this is an EUDAMED product and auto-populate risk classification
  const hasEudamedData = !!(productData?.eudamed_risk_class || productData?.basic_udi_di);
  const productClass = productData?.class || productData?.eudamed_risk_class;

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (selectedMarkets.length === 0) return 0;

    let totalFields = 0;
    let completedFields = 0;

    selectedMarkets.forEach(market => {
      // Essential fields for each market (using actual properties)
      const essentialFields = [
        market.riskClass,
        market.conformityAssessmentRoute,
        market.regulatoryStatus
      ];

      totalFields += essentialFields.length;
      completedFields += essentialFields.filter(field => field && field.toString().trim().length > 0).length;

      // Additional fields with lower weight (using actual properties)
      const additionalFields = [
        market.certificateNumber,
        market.launchDate,
        market.customRequirements
      ];

      totalFields += additionalFields.length * 0.5; // Half weight for optional fields
      completedFields += additionalFields.filter(field => field && field.toString().trim().length > 0).length * 0.5;
    });

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  }, [selectedMarkets]);

  const toggleCardExpansion = (marketCode: string) => {
    setExpandedCards(prev =>
      prev.includes(marketCode)
        ? [] // Collapse if already expanded
        : [marketCode] // Expand only this one, collapse others
    );
  };

  const handleFieldChange = (code: string, field: keyof EnhancedProductMarket, value: any) => {
    const updatedMarkets = markets.map(market =>
      market.code === code ? { ...market, [field]: value } : market
    );
    onMarketsChange(updatedMarkets);
  };

  // Batch update handler for multiple fields at once (avoids state batching issues)
  const handleBatchFieldChange = (code: string, updates: Partial<EnhancedProductMarket>) => {
    const updatedMarkets = markets.map(market =>
      market.code === code ? { ...market, ...updates } : market
    );
    onMarketsChange(updatedMarkets);
  };

  // Field change handler with save status indicator
  const handleFieldChangeWithStatus = (code: string, field: keyof EnhancedProductMarket, value: any) => {
    // Show saving indicator
    setSaveStatus('saving');

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Update the field
    handleFieldChange(code, field, value);

    // Show saved after delay (simulating auto-save completion)
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saved');
      // Hide after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  };

  // Auto-populate EUDAMED risk classification and regulatory status when component loads
  useEffect(() => {
    if (hasEudamedData && selectedMarkets.length > 0) {
      const euMarket = selectedMarkets.find(market => market.code === 'EU');
      if (euMarket) {
        // Auto-populate risk class if available and not already set
        if (productClass && !euMarket.riskClass) {
          const mappedClass = mapEudamedRiskClass(productClass);
          if (mappedClass) {
            handleFieldChange('EU', 'riskClass', mappedClass);
          }
        }

        // Auto-populate regulatory status to CE_MARKED if not already set
        if (!euMarket.regulatoryStatus) {
          handleFieldChange('EU', 'regulatoryStatus', 'CE_MARKED');
        }
      }
    }
  }, [hasEudamedData, productClass, selectedMarkets.length]); // Use length to avoid infinite loops

  const handleClassificationSelected = (marketCode: string, deviceClass: DeviceClass, result?: ClassificationResult) => {
    // Normalize the classification result to match dropdown values
    const normalizedClass = normalizeClassificationResult(deviceClass);

    // Determine if we're in IVD mode
    const isIVD = primaryRegulatoryType === 'In Vitro Diagnostic (IVD)';

    // Validate against allowed values for this market/mode
    const allowedClasses = getRiskClassesForMarket(marketCode, isIVD);
    const allowedValues = allowedClasses.map(c => c.value);

    // Case-insensitive check for robustness
    const normalizedLower = normalizedClass?.toLowerCase();
    const matchingValue = allowedValues.find(v => v.toLowerCase() === normalizedLower);

    if (matchingValue) {

      // Build the update object with riskClass and optionally classificationRule
      const updates: Partial<EnhancedProductMarket> = {
        riskClass: matchingValue
      };

      // Store the classification rule if provided by assistant
      if (result) {
        const extendedResult = result as any;
        const ruleInfo: MarketClassificationRule = {
          rule: result.rule,
          description: result.description,
          determinedBy: 'assistant' as const,
          ruleText: result.ruleText,
          ruleSource: result.ruleSource,
          decisionPath: extendedResult.decisionPath
        };

        // Update local state for display
        setClassificationRules(prev => ({
          ...prev,
          [marketCode]: ruleInfo
        }));

        // Include in batch update
        updates.classificationRule = ruleInfo;
      }

      // Show saving indicator
      setSaveStatus('saving');
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Single batch update for all fields - avoids React state batching issues
      handleBatchFieldChange(marketCode, updates);

      // Show saved after delay
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 800);

      toast.success(`Classification applied: Class ${matchingValue}`);
    } else {
      toast.error(`Unable to apply classification "${deviceClass}" - not valid for current regulatory type`);
    }
  };

  const handleManualRiskClassChange = (marketCode: string, value: string) => {
    handleFieldChangeWithStatus(marketCode, 'riskClass', value);

    // Remove classification rule when manually changed
    setClassificationRules(prev => {
      const updated = { ...prev };
      delete updated[marketCode];
      return updated;
    });
  };

  // Helper for classification assistant callbacks - batch updates riskClass and classificationRule together
  const handleAssistantClassification = (marketCode: string, riskClass: string, result: any) => {
    const ruleInfo: MarketClassificationRule = {
      rule: result.rule,
      description: result.description,
      determinedBy: 'assistant' as const,
      ruleText: result.ruleText,
      ruleSource: result.ruleSource,
      decisionPath: result.decisionPath
    };

    // Update local state for display
    setClassificationRules(prev => ({
      ...prev,
      [marketCode]: ruleInfo
    }));

    // Show saving indicator
    setSaveStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Single batch update for both riskClass and classificationRule
    handleBatchFieldChange(marketCode, {
      riskClass: riskClass,
      classificationRule: ruleInfo
    });

    // Show saved after delay
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);

    toast.success(`Classification applied: Class ${riskClass}`);
  };

  const handleDateChange = (code: string, field: keyof EnhancedProductMarket, date: Date | undefined) => {
    if (!date) return;

    // Show saving indicator
    setSaveStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const updatedMarkets = markets.map(market =>
      market.code === code ? { ...market, [field]: date } : market
    );
    onMarketsChange(updatedMarkets);

    // Show saved after delay
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  };

  const handleReauditTimelineOptionChange = (code: string, timelineOption: string) => {
    // Show saving indicator
    setSaveStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    let reauditTimeline: Date | string | undefined;
    const isCustom = timelineOption === "custom";

    if (!isCustom) {
      const option = REAUDIT_TIMELINE_OPTIONS.find(opt => opt.value === timelineOption);
      if (option) {
        reauditTimeline = getFutureDate(option.days);
      }
    }

    const updatedMarkets = markets.map(market =>
      market.code === code ? {
        ...market,
        customReauditTimeline: isCustom,
        reauditTimeline: isCustom ? market.reauditTimeline : reauditTimeline
      } : market
    );

    onMarketsChange(updatedMarkets);

    // Show saved after delay
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  };

  const getTimelineOptionFromDate = (market: EnhancedProductMarket): string => {
    if (market.customReauditTimeline) return "custom";
    if (!market.reauditTimeline) return "";

    const today = new Date();
    const reauditDate = new Date(market.reauditTimeline);
    const diffDays = Math.round((reauditDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    for (const option of REAUDIT_TIMELINE_OPTIONS) {
      if (option.value === "custom") continue;
      if (Math.abs(diffDays - option.days) <= 30) {
        return option.value;
      }
    }

    return "custom";
  };

  // Sync launch dates with milestones
  const syncWithMilestones = async () => {
    if (!productId || !projectedLaunchDate) {
      console.warn('⚠️ Missing productId or projectedLaunchDate');
      return;
    }

    try {
      const selectedMarkets = markets.filter(market => market.selected);

      const updatedMarkets = markets.map(market =>
        market.selected
          ? { ...market, launchDate: new Date(projectedLaunchDate) }
          : market
      );

      onMarketsChange(updatedMarkets);
      toast.success('Launch dates synchronized with milestones');
    } catch (error) {
      console.error('❌ Error syncing dates:', error);
      toast.error('Failed to sync launch dates');
    }
  };

  const syncToMilestones = async () => {
    if (!productId) {
      console.warn('⚠️ Missing productId');
      return;
    }

    // Find the earliest launch date from selected markets
    const launchDates = selectedMarkets
      .map(market => market.launchDate)
      .filter(date => date)
      .map(date => new Date(date));

    if (launchDates.length === 0) {
      console.warn('⚠️ No launch dates found in selected markets');
      toast.error('No launch dates found in regulatory sections');
      return;
    }

    const earliestLaunchDate = new Date(Math.min(...launchDates.map(date => date.getTime())));

    try {
      await ProductUpdateService.updateProductField(
        productId,
        'projected_launch_date',
        earliestLaunchDate.toISOString(),
        undefined // company_id will be handled by the service
      );
      toast.success('Milestones launch date updated from regulatory information');
    } catch (error) {
      console.error('❌ Error updating milestones:', error);
      toast.error('Failed to update milestones launch date');
    }
  };

  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return "Not set";
    return date instanceof Date ? format(date, "PPP") : format(new Date(date), "PPP");
  };

  const renderDatePicker = (market: EnhancedProductMarket, field: keyof EnhancedProductMarket, label: string) => {
    const dateValue = market[field] as (Date | string | undefined);
    const dateString = dateValue ? (dateValue instanceof Date ? dateValue.toISOString().split('T')[0] : new Date(dateValue).toISOString().split('T')[0]) : '';

    return (
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        <Input
          type="date"
          value={dateString}
          onChange={(e) => {
            const newDate = e.target.value ? new Date(e.target.value) : undefined;
            handleDateChange(market.code, field, newDate);
          }}
          className="mt-1"
          disabled={isLoading}
        />
      </div>
    );
  };

  if (selectedMarkets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <TabHeader
            title={lang('regulatory.info.title')}
            subtitle={lang('regulatory.info.noMarketsSubtitle')}
            completionPercentage={0}
            isLoading={isLoading}
            isEudamedTab={true}
            isProgress={false}
          />
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="!pb-0">
        <div className="flex items-start justify-between">
          <TabHeader
            title={lang('regulatory.info.title')}
            subtitle={lang('regulatory.info.subtitle')}
            completionPercentage={completionPercentage}
            isLoading={isLoading}
            isEudamedTab={true}
            isProgress={false}
          />
          <AutoSaveIndicator status={saveStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 !pt-0">
        {/* Notified Body Quick Link - Above the info box */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/app/settings?tab=stakeholders&subtab=notified-bodies&returnTo=regulatory&productId=${productId}`)}
            className="gap-2"
          >
            <Shield className="h-4 w-4" />
            Notified Body
          </Button>
        </div>

        {/* Classification Guidance Banner */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Device Classification Help
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Use our classification assistants to determine the correct risk class for each market.
                Expand a market card below and click the assistant button next to the risk class dropdown.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedMarkets.map(market => {
                  // Check both direct riskClass and componentClassification (for SiMD/procedure packs)
                  const directRiskClass = market.riskClass && market.riskClass !== 'TBD' ? market.riskClass : null;
                  
                  // Helper to normalize risk class (strip "Class " prefix and clean up)
                  const normalizeRiskClass = (rc: string | undefined | null): string => {
                    if (!rc) return '';
                    return rc.replace(/^Class\s*/i, '').replace('class_', '').replace('_', '').trim();
                  };
                  
                  // For SiMD: derive overall class from selected components if not stored
                  let componentOverallClass = market.componentClassification?.overallRiskClass;
                  if (!componentOverallClass && market.componentClassification?.components?.length) {
                    const selectedComponents = market.componentClassification.components.filter(
                      (c: any) => c.isSelected === true && c.riskClass
                    );
                    if (selectedComponents.length > 0) {
                      // Find highest class using EU hierarchy as fallback
                      const hierarchy = ['I', 'Is', 'Im', 'Ir', 'IIa', 'IIb', 'III'];
                      let highestIdx = -1;
                      selectedComponents.forEach((c: any) => {
                        const normalized = normalizeRiskClass(c.riskClass);
                        const idx = hierarchy.indexOf(normalized);
                        if (idx > highestIdx) {
                          highestIdx = idx;
                          componentOverallClass = normalized;
                        }
                      });
                    }
                  }
                  
                  // Normalize direct risk class too
                  const normalizedDirectClass = normalizeRiskClass(directRiskClass);
                  const normalizedComponentClass = normalizeRiskClass(componentOverallClass);
                  const effectiveRiskClass = normalizedDirectClass || normalizedComponentClass;
                  const hasRiskClass = !!effectiveRiskClass && effectiveRiskClass !== 'TBD';

                  return (
                    <Badge
                      key={market.code}
                      variant={hasRiskClass ? "default" : "outline"}
                      className={hasRiskClass
                        ? "bg-green-100 text-green-800 border-green-600 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 dark:text-green-100"
                        : "border-amber-600 text-amber-700 dark:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900 dark:text-amber-400"
                      }
                    >
                      {market.code}: {hasRiskClass ? `Class ${effectiveRiskClass}` : 'Not classified'}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {selectedMarkets.map((market) => {
          const marketData_item = marketData.find(md => md.code === market.code);
          const isExpanded = expandedCards.includes(market.code);
          const timelineOption = market.reauditTimeline ? getTimelineOptionFromDate(market) : "";

          if (!marketData_item) return null;

          // Determine if classification is complete for this market
          const hasClassification = market.riskClass && market.riskClass !== 'TBD' && market.riskClass !== '';
          
          return (
            <Card key={market.code} className={cn(
              "border-2 transition-colors",
              market.marketLaunchStatus === 'launched'
                ? "border-green-500 bg-green-50/30 dark:bg-green-950/20"
                : isInGenesisFlow
                  ? hasClassification
                    ? "border-emerald-500 bg-emerald-50/30"
                    : "border-amber-400 bg-amber-50/30"
                  : hasClassification
                    ? "border-emerald-500"
                    : "border-border"
            )}>
              <CardHeader
                className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleCardExpansion(market.code)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{marketData_item.name}</CardTitle>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {isExpanded ? lang('regulatory.info.collapse') : lang('regulatory.info.expand')}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Risk Classification - Always show simple dropdown */}
                    <div className={isInGenesisFlow ? `p-3 rounded-lg transition-colors ${market.riskClass && market.riskClass !== 'TBD' ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}>
                        <Label className="text-sm font-medium">{lang('regulatory.info.riskClassification')}</Label>
                        <div className="flex gap-2 mt-1">
                          <Select
                            value={market.riskClass || ""}
                            onValueChange={(value) => handleManualRiskClassChange(market.code, value)}
                            disabled={isLoading}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder={lang('regulatory.info.selectRiskClass')} />
                            </SelectTrigger>
                            <SelectContent>
                              {getRiskClassesForMarket(market.code, primaryRegulatoryType === 'In Vitro Diagnostic (IVD)').map((riskClass) => (
                                <SelectItem key={riskClass.value} value={riskClass.value}>
                                  {riskClass.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* Show MDR/IVDR Assistant only for EU market */}
                          {market.code === 'EU' && (
                            <ConditionalClassificationTrigger
                              onClassificationSelected={(deviceClass, result) =>
                                handleClassificationSelected(market.code, deviceClass, result)
                              }
                              primaryRegulatoryType={primaryRegulatoryType}
                              keyTechnologyCharacteristics={keyTechnologyCharacteristics}
                            />
                          )}

                          {/* Show FDA Assistant for USA market - IVD or hardware */}
                          {market.code === 'USA' && primaryRegulatoryType === 'In Vitro Diagnostic (IVD)' && (
                            <FDAIVDClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                handleAssistantClassification(market.code, riskClass, result);
                              }}
                            />
                          )}
                          {market.code === 'USA' && primaryRegulatoryType !== 'In Vitro Diagnostic (IVD)' && (
                            <FDAClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                // FDA result has different structure, normalize it to match ClassificationResult
                                const normalizedResult = {
                                  ...result,
                                  rule: `${result.productCode} - ${result.deviceClass}`,
                                  description: `Regulatory Pathway: ${result.regulatoryPathway}`
                                };
                                handleAssistantClassification(market.code, riskClass, normalizedResult);
                              }}
                            />
                          )}

                          {/* Show Canada Assistant for CA market - IVD or hardware */}
                          {market.code === 'CA' && primaryRegulatoryType === 'In Vitro Diagnostic (IVD)' && (
                            <CanadaIVDClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                handleAssistantClassification(market.code, riskClass, result);
                              }}
                            />
                          )}
                          {market.code === 'CA' && primaryRegulatoryType !== 'In Vitro Diagnostic (IVD)' && (
                            <CanadaClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                handleAssistantClassification(market.code, riskClass, result);
                              }}
                            />
                          )}

                          {/* Show Australia Assistant for AU market - IVD or hardware */}
                          {market.code === 'AU' && primaryRegulatoryType === 'In Vitro Diagnostic (IVD)' && (
                            <AustraliaIVDClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                handleAssistantClassification(market.code, riskClass, result);
                              }}
                            />
                          )}
                          {market.code === 'AU' && primaryRegulatoryType !== 'In Vitro Diagnostic (IVD)' && (
                            <AustraliaClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                handleAssistantClassification(market.code, riskClass, result);
                              }}
                            />
                          )}

                          {/* Show UK Assistant for UK market - IVDR or hardware */}
                          {market.code === 'UK' && primaryRegulatoryType === 'In Vitro Diagnostic (IVD)' && (
                            <UKIVDRClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                handleAssistantClassification(market.code, riskClass, result);
                              }}
                            />
                          )}
                          {market.code === 'UK' && primaryRegulatoryType !== 'In Vitro Diagnostic (IVD)' && (
                            <UKClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                handleAssistantClassification(market.code, riskClass, result);
                              }}
                            />
                          )}

                          {/* Show Japan Assistant for JP market - IVD or hardware */}
                          {market.code === 'JP' && primaryRegulatoryType === 'In Vitro Diagnostic (IVD)' && (
                            <JapanIVDClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                handleAssistantClassification(market.code, riskClass, result);
                              }}
                            />
                          )}
                          {market.code === 'JP' && primaryRegulatoryType !== 'In Vitro Diagnostic (IVD)' && (
                            <JapanClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                handleAssistantClassification(market.code, riskClass, result);
                              }}
                            />
                          )}

                          {/* Show Brazil Assistant for BR market - IVD or hardware */}
                          {market.code === 'BR' && primaryRegulatoryType === 'In Vitro Diagnostic (IVD)' && (
                            <BrazilIVDClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                handleAssistantClassification(market.code, riskClass, result);
                              }}
                            />
                          )}
                          {market.code === 'BR' && primaryRegulatoryType !== 'In Vitro Diagnostic (IVD)' && (
                            <BrazilClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                handleAssistantClassification(market.code, riskClass, result);
                              }}
                            />
                          )}

                          {/* Show South Korea Assistant for KR market - IVD or hardware */}
                          {market.code === 'KR' && primaryRegulatoryType === 'In Vitro Diagnostic (IVD)' && (
                            <SouthKoreaIVDClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                handleAssistantClassification(market.code, riskClass, result);
                              }}
                            />
                          )}
                          {market.code === 'KR' && primaryRegulatoryType !== 'In Vitro Diagnostic (IVD)' && (
                            <SouthKoreaClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                handleAssistantClassification(market.code, riskClass, result);
                              }}
                            />
                          )}

                          {/* Show China Assistant for CN market - IVD or hardware */}
                          {market.code === 'CN' && primaryRegulatoryType === 'In Vitro Diagnostic (IVD)' && (
                            <ChinaIVDClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                handleAssistantClassification(market.code, riskClass, result);
                              }}
                            />
                          )}
                          {market.code === 'CN' && primaryRegulatoryType !== 'In Vitro Diagnostic (IVD)' && (
                            <ChinaClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                handleAssistantClassification(market.code, riskClass, result);
                              }}
                            />
                          )}

                          {/* Show India Assistant for IN market - IVD or hardware */}
                          {market.code === 'IN' && primaryRegulatoryType === 'In Vitro Diagnostic (IVD)' && (
                            <IndiaIVDClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                handleAssistantClassification(market.code, riskClass, result);
                              }}
                            />
                          )}
                          {market.code === 'IN' && primaryRegulatoryType !== 'In Vitro Diagnostic (IVD)' && (
                            <IndiaClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                handleAssistantClassification(market.code, riskClass, result);
                              }}
                            />
                          )}

                          {/* Show Switzerland Assistant for CH market - IVD or hardware */}
                          {market.code === 'CH' && primaryRegulatoryType === 'In Vitro Diagnostic (IVD)' && (
                            <SwissIVDClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                handleAssistantClassification(market.code, riskClass, result);
                              }}
                            />
                          )}
                          {market.code === 'CH' && primaryRegulatoryType !== 'In Vitro Diagnostic (IVD)' && (
                            <SwitzerlandClassificationTrigger
                              onClassificationSelected={(riskClass, result) => {
                                handleAssistantClassification(market.code, riskClass, result);
                              }}
                            />
                          )}
                        </div>

                      </div>

                    {/* Regulatory Status */}
                    <div>
                      <Label className="text-sm font-medium">{lang('regulatory.info.regulatoryStatus')}</Label>
                      <Select
                        value={market.regulatoryStatus || ""}
                        onValueChange={(value) => handleFieldChangeWithStatus(market.code, 'regulatoryStatus', value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={lang('regulatory.info.selectRegulatoryStatus')} />
                        </SelectTrigger>
                        <SelectContent>
                          {marketData_item.regulatoryStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Show classification summary when risk class is set or assistant determined rule - Full width */}
                    {(market.riskClass || classificationRules[market.code]) && (
                      <div className="col-span-1 md:col-span-2">
                        <ClassificationRuleCard
                          ruleInfo={classificationRules[market.code] || null}
                          questions={isIVD ? ivdrClassificationQuestions : undefined}
                          components={market.componentClassification?.components}
                          marketCode={market.code}
                          riskClass={market.riskClass}
                          marketName={marketData_item.name}
                        />
                      </div>
                    )}

                    {/* Device Classification Section - data-driven visibility */}
                    {(() => {
                      // Check if market has existing component data
                      const hasComponentData = market.componentClassification?.components &&
                                              market.componentClassification.components.length > 0;

                      if (hasComponentData) {
                        // Show the section if there's data
                        return (
                          <div className="col-span-1 md:col-span-2">
                            <ComponentRiskClassificationSection
                              marketCode={market.code}
                              marketName={marketData_item.name}
                              componentClassification={market.componentClassification}
                              onComponentClassificationChange={onMarketComponentClassificationChange || (() => {})}
                              deviceType="procedure-pack"
                              isLoading={isLoading}
                              availableComponents={deviceComponents}
                              primaryRegulatoryType={primaryRegulatoryType}
                              keyTechnologyCharacteristics={keyTechnologyCharacteristics}
                              compactMode={true}
                            />
                          </div>
                        );
                      } else {
                        // Show Add Component button if no data
                        return (
                          <div className="col-span-1 md:col-span-2">
                            <Button
                              variant="outline"
                              className="w-full gap-2"
                              onClick={() => {
                                // Add an empty component to trigger showing the section
                                const newComponent = {
                                  id: `component-${Date.now()}`,
                                  name: '',
                                  description: '',
                                  riskClass: '',
                                  componentType: 'device' as const,
                                  isSelected: true
                                };
                                onMarketComponentClassificationChange?.(market.code, {
                                  ...market.componentClassification,
                                  components: [newComponent]
                                });
                              }}
                            >
                              <Plus className="h-4 w-4" />
                              Add Component
                            </Button>
                          </div>
                        );
                      }
                    })()}

                    {/* Show EUDAMED auto-population notice for EU market - Full width */}
                    {hasEudamedData && market.code === 'EU' && (market.riskClass || market.regulatoryStatus) && (
                      <div className="col-span-1 md:col-span-2 p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-green-800 mb-1">
                              {lang('regulatory.info.eudamedAutoPopulated')}
                            </p>
                            <p className="text-green-700">
                              {market.riskClass && market.regulatoryStatus
                                ? lang('regulatory.info.eudamedBothPopulated')
                                : market.riskClass
                                  ? lang('regulatory.info.eudamedRiskPopulated')
                                  : lang('regulatory.info.eudamedStatusPopulated')
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Certificate Number */}
                    <div>
                      <Label className="text-sm font-medium">{lang('regulatory.info.certificateNumber')}</Label>
                      <Input
                        value={market.certificateNumber || ''}
                        onChange={(e) => handleFieldChangeWithStatus(market.code, 'certificateNumber', e.target.value)}
                        placeholder={lang('regulatory.info.certificateNumberPlaceholder')}
                        className="mt-1"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Certificate Type */}
                    <div>
                      <Label className="text-sm font-medium">{lang('regulatory.info.certificateType')}</Label>
                      <Input
                        value={market.certificateType || ''}
                        onChange={(e) => handleFieldChangeWithStatus(market.code, 'certificateType', e.target.value)}
                        placeholder={lang('regulatory.info.certificateTypePlaceholder')}
                        className="mt-1"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Conformity Assessment Route - EU gets dropdown with suggestions */}
                    {market.code === 'EU' ? (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Label className="text-sm font-medium">{lang('regulatory.info.conformityAssessmentRoute')}</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-md z-[100]">
                                <p className="font-medium mb-1">Conformity Assessment Route</p>
                                <p className="text-sm">The regulatory pathway for demonstrating CE mark compliance under EU MDR. The route depends on your device's risk classification.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Select
                          value={market.conformityAssessmentRoute || ''}
                          onValueChange={(value) => handleFieldChangeWithStatus(market.code, 'conformityAssessmentRoute', value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select conformity route" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONFORMITY_ROUTES.map((route) => {
                              const isSuggested = route.value === getSuggestedConformityRoute(market.riskClass);
                              return (
                                <SelectItem key={route.value} value={route.value}>
                                  <div className="flex items-center gap-2">
                                    {route.label}
                                    {isSuggested && <Badge variant="secondary" className="text-xs">Suggested</Badge>}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        
                        {/* Show suggestion notice if route not set but we have a suggestion */}
                        {!market.conformityAssessmentRoute && market.riskClass && getSuggestedConformityRoute(market.riskClass) && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded text-sm">
                            <div className="flex items-center gap-2">
                              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              <span className="text-blue-700 dark:text-blue-300">
                                Based on {market.riskClass}, suggested: <strong>{getSuggestedConformityRoute(market.riskClass)}</strong>
                              </span>
                              <Button 
                                variant="link" 
                                size="sm"
                                className="ml-auto p-0 h-auto text-blue-600 dark:text-blue-400"
                                onClick={() => handleFieldChangeWithStatus(market.code, 'conformityAssessmentRoute', getSuggestedConformityRoute(market.riskClass)!)}
                              >
                                Apply
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Show description of selected route */}
                        {market.conformityAssessmentRoute && CONFORMITY_ROUTE_DESCRIPTIONS[market.conformityAssessmentRoute] && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {CONFORMITY_ROUTE_DESCRIPTIONS[market.conformityAssessmentRoute]}
                          </p>
                        )}
                      </div>
                    ) : (
                      // Keep existing Input for non-EU markets
                      <div>
                        <Label className="text-sm font-medium">{lang('regulatory.info.conformityAssessmentRoute')}</Label>
                        <Input
                          value={market.conformityAssessmentRoute || ''}
                          onChange={(e) => handleFieldChangeWithStatus(market.code, 'conformityAssessmentRoute', e.target.value)}
                          placeholder={lang('regulatory.info.conformityAssessmentPlaceholder')}
                          className="mt-1"
                          disabled={isLoading}
                        />
                      </div>
                    )}

                    {/* UDI Requirements */}
                    <div>
                      <Label className="text-sm font-medium">{lang('regulatory.info.udiRequirements')}</Label>
                      <Input
                        value={market.udiRequirements || ''}
                        onChange={(e) => handleFieldChangeWithStatus(market.code, 'udiRequirements', e.target.value)}
                        placeholder={lang('regulatory.info.udiRequirementsPlaceholder')}
                        className="mt-1"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Local Authorized Representative */}
                    <div>
                      <Label className="text-sm font-medium">{lang('regulatory.info.localAuthorizedRep')}</Label>
                      <Input
                        value={market.localAuthorizedRep || ''}
                        onChange={(e) => handleFieldChangeWithStatus(market.code, 'localAuthorizedRep', e.target.value)}
                        placeholder={lang('regulatory.info.localAuthorizedRepPlaceholder')}
                        className="mt-1"
                        disabled={isLoading}
                      />
                    </div>

                  </div>

                  {/* Re-audit Timeline */}
                  <div>
                    <Label className="text-sm font-medium">{lang('regulatory.info.reauditTimeline')}</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                      <Select
                        value={timelineOption}
                        onValueChange={(value) => handleReauditTimelineOptionChange(market.code, value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={lang('regulatory.info.selectTimeline')} />
                        </SelectTrigger>
                        <SelectContent>
                          {REAUDIT_TIMELINE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {market.customReauditTimeline && (
                        <Input
                          type="date"
                          value={market.reauditTimeline ? (market.reauditTimeline instanceof Date ? market.reauditTimeline.toISOString().split('T')[0] : new Date(market.reauditTimeline).toISOString().split('T')[0]) : ''}
                          onChange={(e) => {
                            const newDate = e.target.value ? new Date(e.target.value) : undefined;
                            if (newDate && newDate >= new Date()) {
                              handleDateChange(market.code, 'reauditTimeline', newDate);
                            }
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          disabled={isLoading}
                        />
                      )}
                    </div>
                  </div>

                  {/* Date fields with sync options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{lang('regulatory.info.launchDates')}</Label>
                      {productId && (
                        <div className="flex gap-2">
                          {projectedLaunchDate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={syncWithMilestones}
                              className="flex items-center gap-2"
                            >
                              <RefreshCw className="h-3 w-3" />
                              {lang('regulatory.info.syncFromMilestones')}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={syncToMilestones}
                            className="flex items-center gap-2"
                          >
                            <RefreshCw className="h-3 w-3" />
                            {lang('regulatory.info.syncToMilestones')}
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderDatePicker(market, 'launchDate', lang('regulatory.info.launchDate'))}
                      {renderDatePicker(market, 'approvalExpiryDate', lang('regulatory.info.approvalExpiryDate'))}
                    </div>
                    {projectedLaunchDate && (
                      <div className="text-xs text-muted-foreground">
                        {lang('regulatory.info.milestoneProjectedDate')}: {formatDate(projectedLaunchDate)}
                      </div>
                    )}
                  </div>

                  {/* Clinical Trials Required with Tooltip */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={market.clinicalTrialsRequired || false}
                      onCheckedChange={(checked) => handleFieldChangeWithStatus(market.code, 'clinicalTrialsRequired', checked)}
                      disabled={isLoading}
                    />
                    <Label className="text-sm font-medium flex items-center gap-2">
                      {lang('regulatory.info.clinicalTrialsRequired')}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <p>{getTooltipContent(market.code, 'clinical')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                  </div>

                  {/* PMCF Required with Tooltip */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={market.pmcfRequired || false}
                      onCheckedChange={(checked) => handleFieldChangeWithStatus(market.code, 'pmcfRequired', checked)}
                      disabled={isLoading}
                    />
                    <Label className="text-sm font-medium flex items-center gap-2">
                      {lang('regulatory.info.pmcfRequired')}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <p>{getTooltipContent(market.code, 'pmcf')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                  </div>

                  {/* Additional text fields */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="text-sm font-medium">{lang('regulatory.info.pmsDocument')}</Label>
                      <Input
                        value={market.pmsRequirement || ''}
                        onChange={(e) => handleFieldChangeWithStatus(market.code, 'pmsRequirement', e.target.value)}
                        placeholder={lang('regulatory.info.pmsDocumentPlaceholder')}
                        className="mt-1"
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">{lang('regulatory.info.responsiblePerson')}</Label>
                      <Input
                        value={market.responsiblePerson || ''}
                        onChange={(e) => handleFieldChangeWithStatus(market.code, 'responsiblePerson', e.target.value)}
                        placeholder={lang('regulatory.info.responsiblePersonPlaceholder')}
                        className="mt-1"
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">{lang('regulatory.info.countrySpecificNotes')}</Label>
                      <textarea
                        value={market.customRequirements || ''}
                        onChange={(e) => handleFieldChangeWithStatus(market.code, 'customRequirements', e.target.value)}
                        placeholder={lang('regulatory.info.countrySpecificNotesPlaceholder')}
                        className="w-full p-2 border rounded-md mt-1"
                        rows={3}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
