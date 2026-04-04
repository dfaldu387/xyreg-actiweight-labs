
import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Link2, Package } from "lucide-react";
import { DeviceCharacteristics } from '@/types/client.d';
import { detectProductType, type ProductType } from '@/utils/productTypeDetection';
import { TabHeader } from "./TabHeader";

interface DeviceOverviewBasicsProps {
  productName: string;
  modelReference?: string;
  deviceType?: string | DeviceCharacteristics;
  deviceCategory?: string;
  deviceClass?: "I" | "IIa" | "IIb" | "III";
  description?: string;
  keyFeatures?: string[];
  deviceComponents?: Array<{ name: string; description: string; }>;
  images?: string[];
  videos?: string[];
  models3D?: any[];
  onProductNameChange: (value: string) => void;
  onModelReferenceChange?: (value: string) => void;
  onDeviceTypeChange?: (value: string | DeviceCharacteristics) => void;
  onDeviceCategoryChange?: (value: string) => void;
  onDeviceClassChange?: (value: "I" | "IIa" | "IIb" | "III") => void;
  onDescriptionChange?: (value: string) => void;
  onKeyFeaturesChange?: (value: string[]) => void;
  onDeviceComponentsChange?: (value: Array<{ name: string; description: string; }>) => void;
  onImagesChange?: (value: string[]) => void;
  onVideosChange?: (value: string[]) => void;
  onModels3DChange?: (value: any[]) => void;
  isLoading?: boolean;
  savingFields?: Record<string, boolean>;
  // Product type detection props
  project_types?: string[];
  is_line_extension?: boolean;
  parent_product_id?: string;
  base_product_name?: string;
  product_platform?: string;
  // New form fields
  primaryRegulatoryType?: string;
  onPrimaryRegulatoryTypeChange?: (value: string) => void;
  coreDeviceNature?: string;
  onCoreDeviceNatureChange?: (value: string) => void;
  keyTechnologyCharacteristics?: DeviceCharacteristics;
  onKeyTechnologyCharacteristicsChange?: (value: DeviceCharacteristics) => void;
}

// Force TypeScript to recognize the new interface
declare const __DeviceOverviewSectionPropsCheck: DeviceOverviewBasicsProps extends { project_types?: string[] } ? true : false;
export type DeviceOverviewSectionProps = DeviceOverviewBasicsProps;

const DEVICE_TYPES = [
  "Active Implantable",
  "Active Non-implantable", 
  "Non-active",
  "In Vitro Diagnostic"
];

export function DeviceOverviewSection({
  productName,
  modelReference,
  deviceType,
  deviceCategory,
  deviceClass,
  description,
  keyFeatures,
  deviceComponents,
  images,
  videos,
  models3D,
  onProductNameChange,
  onModelReferenceChange,
  onDeviceTypeChange,
  onDeviceCategoryChange,
  onDeviceClassChange,
  onDescriptionChange,
  onKeyFeaturesChange,
  onDeviceComponentsChange,
  onImagesChange,
  onVideosChange,
  onModels3DChange,
  isLoading,
  savingFields = {},
  project_types,
  is_line_extension,
  parent_product_id,
  base_product_name,
  product_platform,
  primaryRegulatoryType,
  onPrimaryRegulatoryTypeChange,
  coreDeviceNature,
  onCoreDeviceNatureChange,
  keyTechnologyCharacteristics,
  onKeyTechnologyCharacteristicsChange
}: DeviceOverviewBasicsProps) {
  console.log('[DeviceOverviewSection] Rendered with keyTechnologyCharacteristics:', keyTechnologyCharacteristics);
  // Helper function to get display value for deviceType
  const getDeviceTypeDisplayValue = (): string => {
    if (!deviceType) return '';
    if (typeof deviceType === 'string') return deviceType;
    return 'Custom Characteristics';
  };

  // Detect product type
  const productType = detectProductType({
    project_types,
    is_line_extension,
    parent_product_id
  });
  
  console.log('[DeviceOverviewSection] Product type detected:', productType);

  // Calculate completion percentage
  const calculateCompletion = () => {
    const baseFields = [
      productName,
      modelReference,
      getDeviceTypeDisplayValue(),
      deviceCategory
    ];
    
    // Add product type specific fields
    let additionalFields: string[] = [];
    
    if (productType === 'existing_product') {
      // For existing products, base_product_name is required
      additionalFields = [base_product_name];
    } else if (productType === 'line_extension') {
      // For line extensions, product_platform is required
      additionalFields = [product_platform];
    } else if (productType === 'new_product' && product_platform) {
      // For new products with a platform (meaning they have line extensions), platform is required
      additionalFields = [product_platform];
    }
    // For new_product without line extensions, no additional fields needed
    
    const allFields = [...baseFields, ...additionalFields];
    const filledFields = allFields.filter(field => field && field.trim().length > 0).length;
    return Math.round((filledFields / allFields.length) * 100);
  };

  const completionPercentage = calculateCompletion();

  // Helper functions for device indicator display
  const getBaseProductDisplay = (): string => {
    switch (productType) {
      case 'new_product':
      case 'line_extension':
        return 'N/A';
      case 'existing_product':
        return base_product_name || 'Not specified';
      default:
        return 'N/A';
    }
  };

  const getProductPlatformDisplay = (): string => {
    // If this is a new product with a platform (meaning it has line extensions), show the platform
    if (productType === 'new_product' && product_platform) {
      return product_platform;
    }
    // If this is a line extension, show the platform it belongs to
    if (productType === 'line_extension') {
      return product_platform || 'Not specified';
    }
    // For existing products without platforms, it's N/A
    return 'N/A';
  };

  // Handle checkbox changes with safety check
  const handleCharacteristicChange = useCallback((key: keyof DeviceCharacteristics, checked: boolean) => {
    console.log('🔧 [DeviceOverviewSection] Characteristic change:', { key, checked, current: keyTechnologyCharacteristics });
    
    // Special logging for System or Procedure Pack
    if (key === 'isSystemOrProcedurePack') {
      console.log('🎯 [DeviceOverviewSection] System or Procedure Pack checkbox clicked!', {
        previousValue: keyTechnologyCharacteristics?.isSystemOrProcedurePack,
        newValue: checked,
        timestamp: new Date().toISOString()
      });
    }
    
    if (!onKeyTechnologyCharacteristicsChange || !keyTechnologyCharacteristics) {
      console.error('❌ [DeviceOverviewSection] Missing handler or characteristics');
      return;
    }
    
    const newCharacteristics = {
      ...keyTechnologyCharacteristics,
      [key]: checked
    };
    
    console.log('💾 [DeviceOverviewSection] Calling characteristics change handler with:', newCharacteristics);
    console.log('🎯 [DeviceOverviewSection] isSystemOrProcedurePack in final object:', newCharacteristics.isSystemOrProcedurePack);
    
    onKeyTechnologyCharacteristicsChange(newCharacteristics);
  }, [keyTechnologyCharacteristics, onKeyTechnologyCharacteristicsChange]);

  return (
    <Card>
      <CardHeader>
        <TabHeader
          title="General Information"
          completionPercentage={completionPercentage}
          isLoading={Object.values(savingFields).some(Boolean)}
        />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 1.1 Device Identification Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2">1.1 Device Identification</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product-name">Product Name *</Label>
              <div className="relative">
                <Input
                  id="product-name"
                  value={productName}
                  onChange={(e) => onProductNameChange(e.target.value)}
                  placeholder="e.g., DiabetesControl System2"
                  className="pr-8"
                />
                {savingFields['name'] && (
                  <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="model-reference">Model / Reference</Label>
              <div className="relative">
                <Input
                  id="model-reference"
                  value={modelReference || ''}
                  onChange={(e) => onModelReferenceChange?.(e.target.value)}
                  placeholder="e.g., DCS2-V1"
                  className="pr-8"
                />
                {savingFields['model_reference'] && (
                  <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="device-type">Device Type</Label>
              <div className="relative">
                <Select 
                  value={getDeviceTypeDisplayValue()} 
                  onValueChange={(value) => onDeviceTypeChange?.(value)}
                >
                  <SelectTrigger className="pr-8">
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {savingFields['device_type'] && (
                  <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="device-category">Category</Label>
              <div className="relative">
                <Input
                  id="device-category"
                  value={deviceCategory || ''}
                  onChange={(e) => onDeviceCategoryChange?.(e.target.value)}
                  placeholder="e.g., Blood Glucose Monitoring System"
                  className="pr-8"
                />
                {savingFields['device_category'] && (
                  <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 1.2 Device Indicator Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2">1.2 Device Indicator</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Base Product</Label>
              <div className="flex items-center gap-2 mt-1">
                {productType === 'existing_product' && base_product_name ? (
                  <Link2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                ) : null}
                <Input
                  value={getBaseProductDisplay()}
                  readOnly
                  className={`${productType === 'existing_product' && base_product_name ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500'}`}
                />
              </div>
            </div>
            
            <div>
              <Label>Product Platform</Label>
              <div className="flex items-center gap-2 mt-1">
                {((productType === 'line_extension' || productType === 'new_product') && product_platform) ? (
                  <Package className="h-4 w-4 text-purple-600 flex-shrink-0" />
                ) : null}
                <Input
                  value={getProductPlatformDisplay()}
                  readOnly
                  className={`${((productType === 'line_extension' || productType === 'new_product') && product_platform) ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-500'}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 1.3 Primary Regulatory Type */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2">1.3 Primary Regulatory Type</h4>
          <RadioGroup 
            value={primaryRegulatoryType || ''} 
            onValueChange={(value) => {
              console.log('Primary Regulatory Type changed:', value);
              if (onPrimaryRegulatoryTypeChange) {
                onPrimaryRegulatoryTypeChange(value);
              }
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Class I" id="class-1" />
              <Label htmlFor="class-1">Class I</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Class IIa" id="class-2a" />
              <Label htmlFor="class-2a">Class IIa</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Class IIb" id="class-2b" />
              <Label htmlFor="class-2b">Class IIb</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Class III" id="class-3" />
              <Label htmlFor="class-3">Class III</Label>
            </div>
          </RadioGroup>
        </div>

        {/* 1.4 Core Device Nature */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2">1.4 Core Device Nature</h4>
          <RadioGroup 
            value={coreDeviceNature || ''} 
            onValueChange={(value) => {
              console.log('Core Device Nature changed:', value);
              if (onCoreDeviceNatureChange) {
                onCoreDeviceNatureChange(value);
              }
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Software" id="software" />
              <Label htmlFor="software">Software</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Hardware" id="hardware" />
              <Label htmlFor="hardware">Hardware</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Combination" id="combination" />
              <Label htmlFor="combination">Combination</Label>
            </div>
          </RadioGroup>
        </div>

        {/* 1.5 Key Technology Characteristics */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2">1.5 Key Technology Characteristics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Device Type */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isActive"
                checked={keyTechnologyCharacteristics?.isActive || false}
                onCheckedChange={(checked) => handleCharacteristicChange('isActive', checked as boolean)}
              />
              <Label htmlFor="isActive">Active Device</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isImplantable"
                checked={keyTechnologyCharacteristics?.isImplantable || false}
                onCheckedChange={(checked) => handleCharacteristicChange('isImplantable', checked as boolean)}
              />
              <Label htmlFor="isImplantable">Implantable Device</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isNonInvasive"
                checked={keyTechnologyCharacteristics?.isNonInvasive || false}
                onCheckedChange={(checked) => handleCharacteristicChange('isNonInvasive', checked as boolean)}
              />
              <Label htmlFor="isNonInvasive">Non-invasive Device</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isInVitroDiagnostic"
                checked={keyTechnologyCharacteristics?.isInVitroDiagnostic || false}
                onCheckedChange={(checked) => handleCharacteristicChange('isInVitroDiagnostic', checked as boolean)}
              />
              <Label htmlFor="isInVitroDiagnostic">In Vitro Diagnostic Device</Label>
            </div>
            
            {/* Device Classification */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isReusableSurgicalInstrument"
                checked={keyTechnologyCharacteristics?.isReusableSurgicalInstrument || false}
                onCheckedChange={(checked) => handleCharacteristicChange('isReusableSurgicalInstrument', checked as boolean)}
              />
              <Label htmlFor="isReusableSurgicalInstrument">Reusable Surgical Instrument</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isCustomMade"
                checked={keyTechnologyCharacteristics?.isCustomMade || false}
                onCheckedChange={(checked) => handleCharacteristicChange('isCustomMade', checked as boolean)}
              />
              <Label htmlFor="isCustomMade">Custom-made Device</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isSoftwareMobileApp"
                checked={keyTechnologyCharacteristics?.isSoftwareMobileApp || false}
                onCheckedChange={(checked) => handleCharacteristicChange('isSoftwareMobileApp', checked as boolean)}
              />
              <Label htmlFor="isSoftwareMobileApp">Software/Mobile App</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isSystemOrProcedurePack"
                checked={keyTechnologyCharacteristics?.isSystemOrProcedurePack || false}
                onCheckedChange={(checked) => handleCharacteristicChange('isSystemOrProcedurePack', checked as boolean)}
              />
              <Label htmlFor="isSystemOrProcedurePack">System or Procedure Pack</Label>
            </div>
            
            {/* Additional Characteristics */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="containsHumanAnimalMaterial"
                checked={keyTechnologyCharacteristics?.containsHumanAnimalMaterial || false}
                onCheckedChange={(checked) => handleCharacteristicChange('containsHumanAnimalMaterial', checked as boolean)}
              />
              <Label htmlFor="containsHumanAnimalMaterial">Contains Human/Animal Material</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="incorporatesMedicinalSubstance"
                checked={keyTechnologyCharacteristics?.incorporatesMedicinalSubstance || false}
                onCheckedChange={(checked) => handleCharacteristicChange('incorporatesMedicinalSubstance', checked as boolean)}
              />
              <Label htmlFor="incorporatesMedicinalSubstance">Incorporates Medicinal Substance</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isAccessoryToMedicalDevice"
                checked={keyTechnologyCharacteristics?.isAccessoryToMedicalDevice || false}
                onCheckedChange={(checked) => handleCharacteristicChange('isAccessoryToMedicalDevice', checked as boolean)}
              />
              <Label htmlFor="isAccessoryToMedicalDevice">Accessory to Medical Device</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isSingleUse"
                checked={keyTechnologyCharacteristics?.isSingleUse || false}
                onCheckedChange={(checked) => handleCharacteristicChange('isSingleUse', checked as boolean)}
              />
              <Label htmlFor="isSingleUse">Single-use Device</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isReusable"
                checked={keyTechnologyCharacteristics?.isReusable || false}
                onCheckedChange={(checked) => handleCharacteristicChange('isReusable', checked as boolean)}
              />
              <Label htmlFor="isReusable">Reusable Device</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isSoftwareAsaMedicalDevice"
                checked={keyTechnologyCharacteristics?.isSoftwareAsaMedicalDevice || false}
                onCheckedChange={(checked) => handleCharacteristicChange('isSoftwareAsaMedicalDevice', checked as boolean)}
              />
              <Label htmlFor="isSoftwareAsaMedicalDevice">Software as a Medical Device</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isNonSterile"
                checked={keyTechnologyCharacteristics?.isNonSterile || false}
                onCheckedChange={(checked) => handleCharacteristicChange('isNonSterile', checked as boolean)}
              />
              <Label htmlFor="isNonSterile">Non-sterile Device</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isDeliveredSterile"
                checked={keyTechnologyCharacteristics?.isDeliveredSterile || false}
                onCheckedChange={(checked) => handleCharacteristicChange('isDeliveredSterile', checked as boolean)}
              />
              <Label htmlFor="isDeliveredSterile">Delivered Sterile</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="canBeSterilized"
                checked={keyTechnologyCharacteristics?.canBeSterilized || false}
                onCheckedChange={(checked) => handleCharacteristicChange('canBeSterilized', checked as boolean)}
              />
              <Label htmlFor="canBeSterilized">Can be Sterilized/Re-sterilized</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="hasMeasuringFunction"
                checked={keyTechnologyCharacteristics?.hasMeasuringFunction || false}
                onCheckedChange={(checked) => handleCharacteristicChange('hasMeasuringFunction', checked as boolean)}
              />
              <Label htmlFor="hasMeasuringFunction">Has Measuring Function</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="deliversTherapeuticEnergy"
                checked={keyTechnologyCharacteristics?.deliversTherapeuticEnergy || false}
                onCheckedChange={(checked) => handleCharacteristicChange('deliversTherapeuticEnergy', checked as boolean)}
              />
              <Label htmlFor="deliversTherapeuticEnergy">Delivers Therapeutic Energy</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

