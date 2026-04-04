
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedProductMarket, MARKET_FIELD_CONFIGS } from "@/utils/enhancedMarketRiskClassMapping";
import { ConditionalRequirementToggle } from "./ConditionalRequirementToggle";
import { ImporterInformationToggle } from "./ImporterInformationToggle";
import { ImporterInformationForm } from "./ImporterInformationForm";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { isAgentRequired, getAgentRequirementMessage, getAgentTypeName } from "@/utils/marketRequirements";
import { countries } from "@/data/countries";
import { Loader2, Check } from "lucide-react";

// Save status type
type SaveStatus = 'idle' | 'saving' | 'saved';

// Auto-save status indicator component - floating version
function AutoSaveIndicator({ status }: { status: SaveStatus }) {
  const [visible, setVisible] = useState(false);
  const [displayStatus, setDisplayStatus] = useState<SaveStatus>(status);

  useEffect(() => {
    if (status !== 'idle') {
      setDisplayStatus(status);
      setVisible(true);
    } else {
      // Delay hiding to allow fade-out animation
      const timeout = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [status]);

  if (!visible && status === 'idle') return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all duration-300 transform ${
        status === 'idle' ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      } ${displayStatus === 'saving'
        ? 'bg-white dark:bg-gray-800 text-muted-foreground border border-gray-200 dark:border-gray-700'
        : 'bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700'
      }`}
      style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
    >
      {displayStatus === 'saving' ? (
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

interface MarketSpecificFormProps {
  market: EnhancedProductMarket;
  onMarketChange: (market: EnhancedProductMarket) => void;
  isLoading?: boolean;
  companyId?: string;
  isFirstSelectedMarket?: boolean;
}

export function MarketSpecificForm({
  market,
  onMarketChange,
  isLoading = false,
  companyId,
  isFirstSelectedMarket = false
}: MarketSpecificFormProps) {
  const { data: companyInfo, isLoading: isLoadingCompany } = useCompanyInfo(companyId);

  const [agentToggleEnabled, setAgentToggleEnabled] = useState(false);
  const [importerToggleEnabled, setImporterToggleEnabled] = useState(false);

  // Auto-save status tracking
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const savingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevLoadingRef = useRef(isLoading);

  // Helper to clear all timeouts
  const clearAllTimeouts = () => {
    if (savingTimeoutRef.current) {
      clearTimeout(savingTimeoutRef.current);
      savingTimeoutRef.current = null;
    }
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = null;
    }
  };

  // Helper to show saved status and auto-hide after delay
  const showSavedStatus = () => {
    clearAllTimeouts();
    setSaveStatus('saved');
    savedTimeoutRef.current = setTimeout(() => {
      setSaveStatus('idle');
    }, 2000);
  };

  // Track save status based on isLoading changes from parent
  useEffect(() => {
    // When isLoading changes from false to true, show "Saving..."
    if (isLoading && !prevLoadingRef.current) {
      clearAllTimeouts();
      setSaveStatus('saving');
    }

    // When isLoading changes from true to false, show "Saved" then hide
    if (!isLoading && prevLoadingRef.current) {
      showSavedStatus();
    }

    prevLoadingRef.current = isLoading;

    return () => {
      clearAllTimeouts();
    };
  }, [isLoading]);

  // Show saving indicator when market data changes (for auto-save)
  const handleMarketChangeWithStatus = (updatedMarket: EnhancedProductMarket) => {
    // Clear any existing timeouts
    clearAllTimeouts();

    // Show saving status immediately
    setSaveStatus('saving');

    // Call parent's onChange handler
    onMarketChange(updatedMarket);

    // Set fallback timeout: if parent doesn't update isLoading,
    // auto-transition to saved after 1 second
    savingTimeoutRef.current = setTimeout(() => {
      showSavedStatus();
    }, 1000);
  };

  const manufacturerCountry = companyInfo?.country || '';
  const isRequired = isAgentRequired(manufacturerCountry, market.code);
  const requirementMessage = getAgentRequirementMessage(manufacturerCountry, market.code);
  const agentTypeName = getAgentTypeName(market.code);

  // Initialize toggle states based on existing data - only on initial load
  useEffect(() => {
    if (!isRequired && market.selected) {
      const config = MARKET_FIELD_CONFIGS[market.code];
      if (config) {
        const hasAgentData = config.fields.some(field => {
          const details = market[field.key as keyof EnhancedProductMarket] as any;
          return details && Object.values(details).some(value => value && value !== '');
        });
        setAgentToggleEnabled(hasAgentData);
      }
    }

    // Check if importer data exists - only set to true if there's actual data
    if (market.selected && market.importerDetails) {
      const hasImporterData = Object.values(market.importerDetails).some(value => value && value !== '');
      if (hasImporterData) {
        setImporterToggleEnabled(true);
      }
      // Don't set to false here - let user control the toggle
    }
  }, [market.selected, market.code, isRequired]); // Only depend on market selection and code, not full market object


  const handleToggleChange = (enabled: boolean) => {
    setAgentToggleEnabled(enabled);

    if (!enabled) {
      // Clear agent data when disabled
      const config = MARKET_FIELD_CONFIGS[market.code];
      if (config) {
        const updatedMarket = { ...market };
        config.fields.forEach(field => {
          (updatedMarket as any)[field.key] = undefined;
        });
        handleMarketChangeWithStatus(updatedMarket);
      }
    }
  };

  const handleImporterToggle = (enabled: boolean) => {
    setImporterToggleEnabled(enabled);

    if (!enabled) {
      // Clear importer data when disabled
      handleMarketChangeWithStatus({
        ...market,
        importerDetails: undefined
      });
    } else {
      // Initialize empty importer details
      handleMarketChangeWithStatus({
        ...market,
        importerDetails: {}
      });
    }
  };

  const handleFieldChange = (fieldKey: keyof EnhancedProductMarket, subField: string, value: string) => {
    const currentDetails = (market[fieldKey] as any) || {};
    const updatedDetails = { ...currentDetails, [subField]: value };

    handleMarketChangeWithStatus({
      ...market,
      [fieldKey]: updatedDetails
    });
  };

  const handleImporterChange = (importerDetails: any) => {
    handleMarketChangeWithStatus({
      ...market,
      importerDetails
    });
  };

  const handleRegulatoryStatusChange = (value: string) => {
    handleMarketChangeWithStatus({
      ...market,
      regulatoryStatus: value
    });
  };

  const handleMarketLaunchStatusChange = (value: string) => {
    const updatedMarket = {
      ...market,
      marketLaunchStatus: value as "launched" | "planned" | "withdrawn"
    };

    // Auto-set regulatory status when market is launched
    if (value === 'launched') {
      const launchIndicatingStatuses: Record<string, string> = {
        'EU': 'CE_MARKED',
        'US': 'FDA_APPROVED',
        'USA': 'FDA_APPROVED',
        'CA': 'HEALTH_CANADA_LICENSED',
        'AU': 'TGA_REGISTERED',
        'JP': 'PMDA_APPROVED',
        'BR': 'ANVISA_APPROVED',
        'CN': 'NMPA_APPROVED',
        'IN': 'CDSCO_APPROVED',
        'KR': 'KFDA_APPROVED',
        'UK': 'CE_MARKED',
        'CH': 'CE_MARKED'
      };

      const autoRegulatoryStatus = launchIndicatingStatuses[market.code];
      if (autoRegulatoryStatus) {
        updatedMarket.regulatoryStatus = autoRegulatoryStatus;
      }
    }

    handleMarketChangeWithStatus(updatedMarket);
  };

  const config = MARKET_FIELD_CONFIGS[market.code];

  if (!config) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No specific requirements configured for {market.name}
      </div>
    );
  }

  const shouldShowAgentForm = isRequired || agentToggleEnabled;

  return (
    <>
      {/* Floating auto-save indicator */}
      <AutoSaveIndicator status={saveStatus} />

      <div className="space-y-6">
        {/* Market Launch Status Only - Classification is done on Regulatory tab */}

        {/* Company context */}
        {isLoadingCompany ? (
          <div className="p-3 bg-muted rounded-md">
            <div className="animate-pulse">Loading manufacturer information...</div>
          </div>
        ) : companyInfo ? (
          <div className="p-3 bg-muted rounded-md">
            <div className="text-sm">
              <span className="font-medium">Manufacturer:</span> {companyInfo.name}
              {manufacturerCountry && (
                <>
                  <span className="mx-2">•</span>
                  <span className="font-medium">Country:</span> {manufacturerCountry}
                </>
              )}
            </div>
          </div>
        ) : null}

        {/* Agent/Representative requirement toggle */}
        <ConditionalRequirementToggle
          isRequired={isRequired}
          isEnabled={agentToggleEnabled}
          onToggle={handleToggleChange}
          agentTypeName={agentTypeName}
          requirementMessage={requirementMessage}
          marketName={market.name}
        >
          {/* Agent/Representative form fields - only show if required or enabled */}
          {shouldShowAgentForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{config.label} Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.fields.map((fieldConfig) => {
                  const details = (market[fieldConfig.key as keyof EnhancedProductMarket] as any) || {};

                  return (
                    <div key={fieldConfig.key} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Required fields */}
                        {fieldConfig.requiredFields.map((field) => (
                          <div key={field} className="space-y-2">
                            <Label htmlFor={`${fieldConfig.key}-${field}`} className="text-sm font-medium">
                              {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} *
                            </Label>
                            {field.toLowerCase().includes('country') ? (
                              <Select
                                value={details[field] || ''}
                                onValueChange={(value) => handleFieldChange(fieldConfig.key as keyof EnhancedProductMarket, field, value)}
                                disabled={isLoading}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                  {countries.map((country) => (
                                    <SelectItem key={country} value={country}>
                                      {country}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                id={`${fieldConfig.key}-${field}`}
                                type={field.toLowerCase().includes('email') ? 'email' :
                                  field.toLowerCase().includes('phone') ? 'tel' : 'text'}
                                placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                                value={details[field] || ''}
                                onChange={(e) => handleFieldChange(fieldConfig.key as keyof EnhancedProductMarket, field, e.target.value)}
                                disabled={isLoading}
                              />
                            )}
                          </div>
                        ))}

                        {/* Optional fields */}
                        {fieldConfig.optionalFields.map((field) => (
                          <div key={field} className="space-y-2">
                            <Label htmlFor={`${fieldConfig.key}-${field}`} className="text-sm font-medium text-muted-foreground">
                              {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Label>
                            {field.toLowerCase().includes('country') ? (
                              <Select
                                value={details[field] || ''}
                                onValueChange={(value) => handleFieldChange(fieldConfig.key as keyof EnhancedProductMarket, field, value)}
                                disabled={isLoading}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                  {countries.map((country) => (
                                    <SelectItem key={country} value={country}>
                                      {country}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                id={`${fieldConfig.key}-${field}`}
                                type={field.toLowerCase().includes('email') ? 'email' :
                                  field.toLowerCase().includes('phone') ? 'tel' : 'text'}
                                placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                                value={details[field] || ''}
                                onChange={(e) => handleFieldChange(fieldConfig.key as keyof EnhancedProductMarket, field, e.target.value)}
                                disabled={isLoading}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </ConditionalRequirementToggle>

        {/* Universal Importer Information Toggle */}

        {/* Universal Importer Information Toggle */}
        <ImporterInformationToggle
          isEnabled={importerToggleEnabled}
          onToggle={handleImporterToggle}
          marketName={market.name}
        >
          {/* Universal Importer Information Form */}
          {importerToggleEnabled && (
            <ImporterInformationForm
              importerDetails={market.importerDetails || {}}
              onImporterChange={handleImporterChange}
              isLoading={isLoading}
            />
          )}
        </ImporterInformationToggle>
      </div>
    </>
  );
}
