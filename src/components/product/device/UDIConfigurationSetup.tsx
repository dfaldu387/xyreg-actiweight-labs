import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Settings, Database, Lightbulb, Loader2, HelpCircle, ArrowRight, Circle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTemplateSettings } from "@/hooks/useTemplateSettings";
import { useUDIConfiguration } from "@/hooks/useUDIConfiguration";
import { UDICompanyPrefixService } from "@/services/udiCompanyPrefixService";
import { toast } from "sonner";
import { GS1PrefixLengthEducation } from "@/components/help/GS1PrefixLengthEducation";
import { IssuingAgencyDiscoveryTool } from './IssuingAgencyDiscoveryTool';
import { ISSUING_AGENCIES, EUDAMED_AGENCY_MAPPING, detectIssuingAgencyFromUDI } from '@/types/issuingAgency';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface UDIConfigurationSetupProps {
  companyId: string;
  productData?: any;
  onConfigurationComplete: () => void;
}

export function UDIConfigurationSetup({ companyId, productData, onConfigurationComplete }: UDIConfigurationSetupProps) {
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const { settings, updateSetting, saveSettings, isLoading } = useTemplateSettings(companyId);
  const { suggestCompanyPrefix, isSuggesting } = useUDIConfiguration(companyId);
  const [selectedAgency, setSelectedAgency] = useState<string>('');
  const [companyPrefix, setCompanyPrefix] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [autoPopulated, setAutoPopulated] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDiscoveryTool, setShowDiscoveryTool] = useState(true);
  const [userRequestedChange, setUserRequestedChange] = useState(false);
  const [prefixSuggestion, setPrefixSuggestion] = useState<{
    suggested_prefix?: string;
    confidence: string;
    udi_count: number;
    details?: string;
  } | null>(null);

  // Detect if current config is EUDAMED (for transition checklist)
  const currentAgencyIsEudamed = settings.udi_issuing_agency === 'EUDAMED' || 
    detectIssuingAgencyFromUDI(productData?.basic_udi_di || productData?.udi_di || '') === 'EUDAMED';
  const showTransitionChecklist = userRequestedChange && currentAgencyIsEudamed;

  // Load existing configuration if available (only on initial mount, not after user clicks Change)
  useEffect(() => {
    if (userRequestedChange) return; // Don't reset if user clicked "Change"
    
    if (settings.udi_configured && settings.udi_issuing_agency && settings.udi_company_prefix) {
      setSelectedAgency(settings.udi_issuing_agency);
      setCompanyPrefix(settings.udi_company_prefix);
      setIsEditMode(true);
      setShowDiscoveryTool(false);
    }
  }, [settings, userRequestedChange]);

  // Auto-populate from EUDAMED data when productData becomes available
  useEffect(() => {
    if (autoPopulated) return;
    
    const eudamedData = productData?.key_features?.eudamed_data;
    const eudamedIssuingAgency = eudamedData?.issuing_agency;
    
    if (eudamedIssuingAgency) {
      let mappedAgency = EUDAMED_AGENCY_MAPPING[eudamedIssuingAgency] || EUDAMED_AGENCY_MAPPING[eudamedIssuingAgency.toLowerCase()];
      
      // If mapped to EUDAMED, try auto-detecting from UDI-DI patterns for more specificity
      if (mappedAgency === 'EUDAMED') {
        const basicUdiDi = eudamedData?.basic_udi_di || productData?.basic_udi_di;
        const udiDi = eudamedData?.udi_di || productData?.udi_di;
        const detected = detectIssuingAgencyFromUDI(basicUdiDi || udiDi || '');
        if (detected) {
          mappedAgency = detected;
        }
      }
      
      if (mappedAgency) {
        if (mappedAgency !== selectedAgency) {
          setSelectedAgency(mappedAgency);
          setShowDiscoveryTool(false);
          toast.success(`Auto-populated issuing agency: ${mappedAgency} from EUDAMED data`);
        }
        setAutoPopulated(true);
        
        // Auto-extract company prefix from Basic UDI-DI for EUDAMED devices
        // B-FIMF0000039869G64607CUA → SRN prefix is FIMF000003986 (strip B-/D- prefix, take SRN portion)
        if (mappedAgency === 'EUDAMED' && !companyPrefix) {
          const basicUdiDi = productData?.basic_udi_di || eudamedData?.basic_udi_di;
          if (basicUdiDi) {
            const match = basicUdiDi.match(/^[BD]-([A-Z]{2,4}\d{9,12})/i);
            if (match) {
              setCompanyPrefix(match[1]);
              toast.success(`Auto-populated SRN prefix: ${match[1]} from Basic UDI-DI`);
            }
          }
        }
      }
    }
  }, [productData]);

  const handleAgencySelect = (agencyCode: string) => {
    setSelectedAgency(agencyCode);
    setShowDiscoveryTool(false);
  };

  const handleSuggestPrefix = async () => {
    try {
      const response = await suggestCompanyPrefix(selectedAgency, productData?.companies?.name);
      
      if (response.success && response.suggested_prefix) {
        setPrefixSuggestion({
          suggested_prefix: response.suggested_prefix,
          confidence: response.confidence,
          udi_count: response.udi_count,
          details: response.details
        });
        
        setCompanyPrefix(response.suggested_prefix);
        toast.success(
          `Suggested prefix: ${response.suggested_prefix} (${response.confidence} confidence)`,
          { description: `Based on ${response.udi_count} EUDAMED UDI-DIs` }
        );
      } else {
        setPrefixSuggestion({
          suggested_prefix: undefined,
          confidence: response.confidence,
          udi_count: response.udi_count,
          details: response.details || response.error
        });
        
        if (response.confidence === 'insufficient') {
          toast.info('No clear prefix pattern found in EUDAMED data', {
            description: 'Please enter your company prefix manually'
          });
        }
      }
    } catch (error) {
      console.error('Error suggesting prefix:', error);
      toast.error('Unable to suggest prefix', {
        description: 'Please enter your company prefix manually'
      });
    }
  };

  const validatePrefix = (agency: string, prefix: string): boolean => {
    if (!prefix.trim()) {
      setValidationError('Company prefix is required');
      return false;
    }

    const selectedAgencyInfo = ISSUING_AGENCIES.find(a => a.code === agency);
    if (!selectedAgencyInfo) {
      setValidationError('Please select an issuing agency');
      return false;
    }

    switch (agency) {
      case 'GS1':
        if (!/^\d{6,12}$/.test(prefix)) {
          setValidationError('GS1 Company Prefix must be 6-12 digits');
          return false;
        }
        break;
      case 'HIBCC':
        if (!/^[A-Z0-9]{4,25}$/.test(prefix)) {
          setValidationError('HIBCC LIC must be 4-25 alphanumeric characters');
          return false;
        }
        break;
      case 'ICCBBA':
        if (!/^[A-Z0-9]{6,25}$/.test(prefix)) {
          setValidationError('ICCBBA Facility Identifier must be 6-25 alphanumeric characters');
          return false;
        }
        break;
      case 'IFA':
        if (!/^\d{4,8}$/.test(prefix)) {
          setValidationError('IFA PZN Prefix must be 4-8 digits');
          return false;
        }
        break;
      case 'EUDAMED':
        if (!/^[A-Z0-9]{4,30}$/i.test(prefix)) {
          setValidationError('EUDAMED SRN-based identifier must be 4-30 alphanumeric characters');
          return false;
        }
        break;
    }

    setValidationError('');
    return true;
  };

  const handleSave = async () => {
    if (!validatePrefix(selectedAgency, companyPrefix)) {
      return;
    }

    setIsSaving(true);
    try {
      // If transitioning from EUDAMED, preserve legacy codes
      if (currentAgencyIsEudamed && selectedAgency !== 'EUDAMED' && productData?.id) {
        const legacyUdi = {
          basic_udi_di: productData?.basic_udi_di || null,
          udi_di: productData?.udi_di || null,
          issuing_agency: 'EUDAMED',
          migrated_at: new Date().toISOString(),
        };
        const currentFeatures = productData?.key_features || {};
        const { error: legacyError } = await supabase
          .from('products')
          .update({ key_features: { ...currentFeatures, legacy_udi: legacyUdi } as any })
          .eq('id', productData.id);
        if (legacyError) {
          console.error('Error saving legacy UDI codes:', legacyError);
        } else {
          toast.success('Legacy EUDAMED codes preserved for reference');
          queryClient.invalidateQueries({ queryKey: ['product', productData.id] });
        }
      }

      await saveSettings({
        'udi_issuing_agency': selectedAgency,
        'udi_company_prefix': companyPrefix,
        'udi_configured': true
      });
      
      toast.success('UDI configuration saved successfully');
      await new Promise(resolve => setTimeout(resolve, 300));
      onConfigurationComplete();
    } catch (error) {
      console.error('Error saving UDI configuration:', error);
      toast.error('Failed to save UDI configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedAgencyInfo = ISSUING_AGENCIES.find(a => a.code === selectedAgency);

  // Show discovery tool if no agency selected yet
  if (showDiscoveryTool && !isEditMode) {
    return (
      <IssuingAgencyDiscoveryTool
        selectedAgency={selectedAgency}
        onAgencySelect={handleAgencySelect}
      />
    );
  }

  return (
    <Card className={isEditMode ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className={isEditMode ? "h-5 w-5 text-blue-600" : "h-5 w-5 text-amber-600"} />
          {isEditMode ? lang('deviceIdentification.udiSetup.configurationTitle') : lang('deviceIdentification.udiSetup.setupRequiredTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* MDR Transition Checklist */}
        {showTransitionChecklist && (
          <Alert className="border-amber-300 bg-amber-50">
            <ArrowRight className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 font-semibold">MDD → MDR Transition Checklist</AlertTitle>
            <AlertDescription className="text-amber-700">
              <ul className="mt-2 space-y-1.5">
                {[
                  'Register with new issuing agency (e.g., GS1)',
                  'Obtain company prefix from the agency',
                  'Generate new Basic UDI-DI for device family',
                  'Generate new UDI-DI for each packaging level',
                  'Update EUDAMED registration with new identifiers',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Circle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs mt-3 text-amber-600">
                Your current EUDAMED codes will be preserved as legacy references.
              </p>
            </AlertDescription>
          </Alert>
        )}
        {!isEditMode && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {lang('deviceIdentification.udiSetup.setupDescription')}
            </AlertDescription>
          </Alert>
        )}

        {autoPopulated && (
          <Alert className="border-green-200 bg-green-50">
            <Database className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {lang('deviceIdentification.udiSetup.autoPopulatedMessage')}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Selected Agency Display */}
          {selectedAgencyInfo && (
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
              <div>
                <Label className="text-xs text-muted-foreground">Selected Issuing Agency</Label>
                <p className="font-medium">{selectedAgencyInfo.fullName}</p>
                <p className="text-sm text-muted-foreground">{selectedAgencyInfo.description}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setUserRequestedChange(true);
                  setShowDiscoveryTool(true);
                  setIsEditMode(false);
                }}
              >
                <HelpCircle className="h-4 w-4 mr-1.5" />
                Change
              </Button>
            </div>
          )}

          {selectedAgencyInfo && (
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="company-prefix">
                    {selectedAgencyInfo.prefixFormat}
                  </Label>
                  {selectedAgency === 'GS1' && (
                    <GS1PrefixLengthEducation 
                      currentPrefixLength={companyPrefix.length >= 6 ? companyPrefix.length : undefined}
                    />
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSuggestPrefix}
                  disabled={isSuggesting}
                  className="flex items-center gap-2 text-xs"
                >
                  {isSuggesting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Lightbulb className="h-3 w-3" />
                  )}
                  {lang('deviceIdentification.udiSetup.suggestFromEudamed')}
                </Button>
              </div>
              
              <Input
                id="company-prefix"
                value={companyPrefix}
                onChange={(e) => {
                  setCompanyPrefix(e.target.value);
                  setPrefixSuggestion(null);
                  if (validationError) {
                    validatePrefix(selectedAgency, e.target.value);
                  }
                }}
                placeholder={`e.g., ${selectedAgencyInfo.prefixExample}`}
                className={validationError ? 'border-red-500' : ''}
              />

              {prefixSuggestion && prefixSuggestion.suggested_prefix && (
                <Alert className="mt-2 border-blue-200 bg-blue-50">
                  <Database className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <div className="flex items-center justify-between">
                      <span>
                        Suggested from {prefixSuggestion.udi_count} EUDAMED UDI-DIs 
                        <span className={`ml-1 font-medium ${UDICompanyPrefixService.getConfidenceColor(prefixSuggestion.confidence)}`}>
                          ({prefixSuggestion.confidence} confidence)
                        </span>
                      </span>
                    </div>
                    {prefixSuggestion.details && (
                      <p className="text-xs mt-1 text-blue-700">{prefixSuggestion.details}</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {prefixSuggestion && !prefixSuggestion.suggested_prefix && (
                <Alert className="mt-2 border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    {prefixSuggestion.details || 'No clear prefix pattern found in EUDAMED data'}
                  </AlertDescription>
                </Alert>
              )}

              {validationError && (
                <p className="text-sm text-red-600 mt-1">{validationError}</p>
              )}
              
              <p className="text-sm text-muted-foreground mt-2">
                {lang('deviceIdentification.udiSetup.prefixHelperText').replace('{agencyName}', selectedAgencyInfo.name)}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={!selectedAgency || !companyPrefix || isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {lang('deviceIdentification.udiSetup.saving')}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {isEditMode ? lang('deviceIdentification.udiSetup.updateConfiguration') : lang('deviceIdentification.udiSetup.saveConfiguration')}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
