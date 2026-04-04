import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextField } from '@/components/shared/RichTextField';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  StorageSterilityHandlingData,
  DEFAULT_STORAGE_STERILITY_HANDLING,
  STERILIZATION_METHODS,
  STERILITY_ASSURANCE_LEVELS,
  ENVIRONMENTAL_CONTROLS,
  HANDLING_PRECAUTIONS
} from '@/types/storageHandling';
import { DeviceCharacteristics } from '@/types/client.d';
import {
  shouldShowSterilizationDetails,
  shouldShowResterilizationInstructions,
  getSterilityStatusText
} from '@/utils/sterilitySync';
import { InvestorVisibleBadge } from '@/components/ui/investor-visible-badge';
import { useTranslation } from '@/hooks/useTranslation';
import CompactScopeToggle from '@/components/product/shared/CompactScopeToggle';
import { GovernanceBookmark } from '@/components/ui/GovernanceBookmark';
import { useFieldGovernance } from '@/hooks/useFieldGovernance';


interface StorageSterilityHandlingSectionProps {
  data: StorageSterilityHandlingData;
  onChange: (data: StorageSterilityHandlingData) => void;
  isLoading?: boolean;
  deviceCharacteristics?: DeviceCharacteristics;
  productId?: string;
  belongsToFamily?: boolean;
  getFieldScope?: (fieldKey: string) => 'individual' | 'product_family';
  onFieldScopeChange?: (fieldKey: string, scope: 'individual' | 'product_family') => void;
  isVariant?: boolean;
  masterDeviceName?: string;
  masterDeviceId?: string;
  isFieldPFMode?: (fieldKey: string) => boolean;
}

export function StorageSterilityHandlingSection({
  data,
  onChange,
  isLoading = false,
  deviceCharacteristics = {},
  productId,
  belongsToFamily = false,
  getFieldScope,
  onFieldScopeChange,
  isVariant = false,
  masterDeviceName,
  masterDeviceId,
  isFieldPFMode,
}: StorageSterilityHandlingSectionProps) {
  const { lang } = useTranslation();
  const { getSection } = useFieldGovernance(productId);
  console.log('🔧 [StorageSterilityHandlingSection] Received data:', data);

  const getGovIcon = (sectionKey: string, label: string) => {
    const gov = getSection(sectionKey);
    if (gov && gov.status !== 'draft') {
      return (
        <GovernanceBookmark
          status={gov.status}
          designReviewId={gov.design_review_id}
          verdictComment={gov.verdict_comment}
          approvedAt={gov.approved_at}
          productId={productId}
          sectionLabel={label}
        />
      );
    }
    return <GovernanceBookmark status={null} />;
  };
  
  // Ensure data is defined with default values
  const safeData = {
    ...DEFAULT_STORAGE_STERILITY_HANDLING,
    ...data
  };

  const [sterilizationDetailsOpen, setSterilizationDetailsOpen] = useState(safeData.isSterile);

  const handleInputChange = useCallback((field: keyof StorageSterilityHandlingData, value: any) => {
    console.log('🔧 [StorageSterilityHandlingSection] Input change:', field, value);
    onChange({
      ...safeData,
      [field]: value
    });
  }, [safeData, onChange]);

  const handleArrayToggle = useCallback((field: 'specialEnvironmentalControls' | 'handlingPrecautions', value: string) => {
    const currentArray = safeData[field] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    handleInputChange(field, newArray);
  }, [safeData, handleInputChange]);

  const handleSterilityChange = useCallback((value: string) => {
    const isSterile = value === 'true';
    handleInputChange('isSterile', isSterile);
    setSterilizationDetailsOpen(isSterile);
  }, [handleInputChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {lang('deviceBasics.storage.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sterility Status Display */}
        {(deviceCharacteristics.isDeliveredSterile || deviceCharacteristics.canBeSterilized || deviceCharacteristics.isNonSterile) && (
          <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50 border text-sm">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <span className="font-medium">{lang('deviceBasics.storage.sterilityStatus')}</span>
            <span className="text-muted-foreground">
              {getSterilityStatusText(deviceCharacteristics)}
            </span>
          </div>
        )}

        {/* Sterilization Details */}
        {shouldShowSterilizationDetails(deviceCharacteristics) && (
          <>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">{lang('deviceBasics.storage.sterilizationDetailsTitle')}</Label>
                <div className="flex items-center gap-1">
                  {belongsToFamily && getFieldScope && onFieldScopeChange && (
                    <CompactScopeToggle
                      scopeView={getFieldScope('sterilizationDetails')}
                      onScopeChange={(scope) => onFieldScopeChange('sterilizationDetails', scope)}
                    />
                  )}
                  {getGovIcon('sterilization_details', 'Sterilization Details')}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {lang('deviceBasics.storage.sterilizationDetailsDesc')}
              </p>
              
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor="sterilization-method">{lang('deviceBasics.storage.sterilizationMethodLabel')}</Label>
                        <InvestorVisibleBadge />
                      </div>
                      <Select
                        value={safeData.sterilizationMethod}
                        onValueChange={(value) => handleInputChange('sterilizationMethod', value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={lang('deviceBasics.storage.selectMethod')} />
                        </SelectTrigger>
                        <SelectContent>
                          {STERILIZATION_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {data.sterilizationMethod === 'other' && (
                      <div>
                        <Label htmlFor="sterilization-other">{lang('deviceBasics.storage.ifOtherSpecify')}</Label>
                        <Input
                          id="sterilization-other"
                          value={safeData.sterilizationMethodOther || ''}
                          onChange={(e) => handleInputChange('sterilizationMethodOther', e.target.value)}
                          disabled={isLoading}
                          placeholder={lang('deviceBasics.storage.specifyMethod')}
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="sal">{lang('deviceBasics.storage.salLabel')}</Label>
                      <Select
                        value={safeData.sterilityAssuranceLevel}
                        onValueChange={(value) => handleInputChange('sterilityAssuranceLevel', value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={lang('deviceBasics.storage.selectSal')} />
                        </SelectTrigger>
                        <SelectContent>
                          {STERILITY_ASSURANCE_LEVELS.map((sal) => (
                            <SelectItem key={sal.value} value={sal.value}>
                              {sal.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sterile-barrier">{lang('deviceBasics.storage.sterileBarrierLabel')}</Label>
                    <Textarea
                      id="sterile-barrier"
                      value={safeData.sterileBarrierSystemDescription || ''}
                      onChange={(e) => handleInputChange('sterileBarrierSystemDescription', e.target.value)}
                      disabled={isLoading}
                      placeholder={lang('deviceBasics.storage.sterileBarrierPlaceholder')}
                      className="mt-1"
                    />
                  </div>
                </div>
              
            </div>
          </>
        )}

        {/* Storage & Transport Conditions */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">{lang('deviceBasics.storage.conditionsTitle')}</Label>
            <div className="flex items-center gap-1">
              {belongsToFamily && getFieldScope && onFieldScopeChange && (
                <CompactScopeToggle
                  scopeView={getFieldScope('storageConditions')}
                  onScopeChange={(scope) => onFieldScopeChange('storageConditions', scope)}
                />
              )}
              {getGovIcon('storage_conditions', 'Storage & Transport Conditions')}
            </div>
          </div>
          
            <div className="space-y-4">
              {/* Temperature Range */}
              <div>
                <Label className="text-sm font-medium mb-3 block">{lang('deviceBasics.storage.temperatureLabel')}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{lang('deviceBasics.storage.from')}</span>
                  <Input
                    type="number"
                    value={safeData.storageTemperatureMin?.toString() || ''}
                    onChange={(e) => handleInputChange('storageTemperatureMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                    disabled={isLoading}
                    className="w-20"
                    placeholder="-10"
                  />
                  <span className="text-sm">{lang('deviceBasics.storage.to')}</span>
                  <Input
                    type="number"
                    value={safeData.storageTemperatureMax?.toString() || ''}
                    onChange={(e) => handleInputChange('storageTemperatureMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                    disabled={isLoading}
                    className="w-20"
                    placeholder="25"
                  />
                  <Select
                    value={safeData.storageTemperatureUnit}
                    onValueChange={(value: 'celsius' | 'fahrenheit') => handleInputChange('storageTemperatureUnit', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="celsius">°C</SelectItem>
                      <SelectItem value="fahrenheit">°F</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Humidity Range */}
              <div>
                <Label className="text-sm font-medium mb-3 block">{lang('deviceBasics.storage.humidityLabel')}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{lang('deviceBasics.storage.from')}</span>
                  <Input
                    type="number"
                    value={safeData.storageHumidityMin?.toString() || ''}
                    onChange={(e) => handleInputChange('storageHumidityMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                    disabled={isLoading}
                    className="w-20"
                    placeholder="15"
                  />
                  <span className="text-sm">{lang('deviceBasics.storage.to')}</span>
                  <Input
                    type="number"
                    value={safeData.storageHumidityMax?.toString() || ''}
                    onChange={(e) => handleInputChange('storageHumidityMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                    disabled={isLoading}
                    className="w-20"
                    placeholder="75"
                  />
                  <span className="text-sm">% RH</span>
                </div>
              </div>

              {/* Environmental Controls */}
              <div>
                <Label className="text-sm font-medium mb-3 block">{lang('deviceBasics.storage.environmentalControlsLabel')}</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {ENVIRONMENTAL_CONTROLS.map((control) => (
                    <div key={control.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`env-${control.value}`}
                        checked={safeData.specialEnvironmentalControls.includes(control.value)}
                        onCheckedChange={() => handleArrayToggle('specialEnvironmentalControls', control.value)}
                        disabled={isLoading}
                      />
                      <Label htmlFor={`env-${control.value}`} className="text-sm">
                        {control.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Storage Requirements */}
              <div>
                <Label htmlFor="other-storage">{lang('deviceBasics.storage.otherStorageLabel')}</Label>
                <RichTextField
                  value={safeData.otherStorageRequirements || ''}
                  onChange={(html) => handleInputChange('otherStorageRequirements', html)}
                  disabled={isLoading}
                  placeholder={lang('deviceBasics.storage.otherStoragePlaceholder')}
                  minHeight="80px"
                />
              </div>
            </div>
          
        </div>

        {/* Shelf Life & Handling */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">{lang('deviceBasics.storage.shelfLifeTitle')}</Label>
            <div className="flex items-center gap-1">
              {belongsToFamily && getFieldScope && onFieldScopeChange && (
                <CompactScopeToggle
                  scopeView={getFieldScope('shelfLife')}
                  onScopeChange={(scope) => onFieldScopeChange('shelfLife', scope)}
                />
              )}
              {getGovIcon('shelf_life', 'Shelf Life & Handling')}
            </div>
          </div>
          
            <div className="space-y-4">
              {/* Shelf Life */}
              <div>
                <Label className="text-sm font-medium mb-3 block">{lang('deviceBasics.storage.shelfLifeLabel')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={safeData.shelfLifeValue?.toString() || ''}
                    onChange={(e) => handleInputChange('shelfLifeValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                    disabled={isLoading}
                    className="w-20"
                    placeholder="24"
                  />
                  <Select
                    value={safeData.shelfLifeUnit}
                    onValueChange={(value: 'months' | 'years') => handleInputChange('shelfLifeUnit', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="months">{lang('deviceBasics.storage.months')}</SelectItem>
                      <SelectItem value="years">{lang('deviceBasics.storage.years')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Handling Precautions */}
              <div>
                <Label className="text-sm font-medium mb-3 block">{lang('deviceBasics.storage.handlingPrecautionsLabel')}</Label>
                <div className="space-y-2">
                  {HANDLING_PRECAUTIONS.map((precaution) => (
                    <div key={precaution.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`handling-${precaution.value}`}
                        checked={safeData.handlingPrecautions.includes(precaution.value)}
                        onCheckedChange={() => handleArrayToggle('handlingPrecautions', precaution.value)}
                        disabled={isLoading}
                      />
                      <Label htmlFor={`handling-${precaution.value}`} className="text-sm">
                        {precaution.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Handling Instructions */}
              <div>
                <Label htmlFor="other-handling">{lang('deviceBasics.storage.otherHandlingLabel')}</Label>
                <RichTextField
                  value={safeData.otherHandlingInstructions || ''}
                  onChange={(html) => handleInputChange('otherHandlingInstructions', html)}
                  disabled={isLoading}
                  placeholder={lang('deviceBasics.storage.otherHandlingPlaceholder')}
                  minHeight="80px"
                />
              </div>
            </div>
          
        </div>
      </CardContent>
    </Card>
  );
}
