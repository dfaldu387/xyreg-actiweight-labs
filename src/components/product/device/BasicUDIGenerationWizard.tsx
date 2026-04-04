import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Package, 
  AlertCircle, 
  Check, 
  Settings, 
  Copy,
  Edit,
  Trash2,
  ExternalLink,
  Sparkles,
  Loader2
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "react-router-dom";
import { useBasicUDIDI, BasicUDIDIGroup, ProductInfo } from "@/hooks/useBasicUDIDI";
import { useUDIConfiguration } from "@/hooks/useUDIConfiguration";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductData {
  intended_use?: string;
  class?: string;
  description?: string;
  markets?: Array<{ code: string; name: string; selected: boolean; riskClass?: string }>;
  device_type?: string;
  device_components?: any;
  name?: string;
}

interface BasicUDIGenerationWizardProps {
  companyId: string;
  productId?: string;
  productData?: ProductData;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  onSuccess?: (basicUdiDi: string) => void;
}

interface GenerationFormData {
  internalReference: string;
  intendedPurpose: string;
  essentialCharacteristics: string;
  selectedProducts: string[];
}

interface EditFormData {
  internalReference: string;
  intendedPurpose: string;
  essentialCharacteristics: string;
}

export function BasicUDIGenerationWizard({ 
  companyId,
  productId,
  productData,
  externalOpen,
  onExternalOpenChange,
  onSuccess
}: BasicUDIGenerationWizardProps) {
  const { configuration } = useUDIConfiguration(companyId);
  const {
    basicUDIGroups,
    products,
    isLoading,
    createBasicUDIGroup,
    updateBasicUDIGroup,
    deleteBasicUDIGroup,
    assignProductsToGroup,
    getProductsForGroup,
    getUnassignedProducts,
    getNextInternalReference,
    getCommonPrefix
  } = useBasicUDIDI(companyId);

  const [internalOpen, setInternalOpen] = useState(false);
  const [showAllDevices, setShowAllDevices] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  // Support both internal and external open control
  const isWizardOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsWizardOpen = (open: boolean) => {
    if (onExternalOpenChange) {
      onExternalOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };
  const [formData, setFormData] = useState<GenerationFormData>({
    internalReference: '',
    intendedPurpose: '',
    essentialCharacteristics: '',
    selectedProducts: []
  });
  const [skuSuffix, setSkuSuffix] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Edit dialog state
  const [editingGroup, setEditingGroup] = useState<BasicUDIDIGroup | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    internalReference: '',
    intendedPurpose: '',
    essentialCharacteristics: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const unassignedProducts = getUnassignedProducts();
  
  // Displayed devices based on toggle
  const displayedDevices = showAllDevices ? products : unassignedProducts;
  
  // Get the common prefix from existing codes (e.g., "1569431111NOX_")
  const commonPrefix = getCommonPrefix() || `${configuration.companyPrefix || ''}`;
  
  // Preview the full Basic UDI-DI
  const previewUDI = skuSuffix ? `${commonPrefix}${skuSuffix}` : '';


  // Reset and auto-populate form when dialog opens - combined to avoid race condition
  useEffect(() => {
    if (isWizardOpen) {
      // Auto-populate from productData if available, otherwise empty
      const intendedPurpose = productData?.intended_use || '';
      
      console.log('[BasicUDIGenerationWizard] Dialog opened, auto-populating:', {
        intended_use: productData?.intended_use,
        hasProductData: !!productData
      });
      
      setSkuSuffix('');
      setFormData({
        internalReference: '',
        intendedPurpose,
        essentialCharacteristics: '',
        selectedProducts: productId ? [productId] : []
      });
    }
  }, [isWizardOpen, productId, productData]);

  // Handle late-loading productData (if dialog opened before data was ready)
  useEffect(() => {
    if (isWizardOpen && productData?.intended_use && !formData.intendedPurpose) {
      console.log('[BasicUDIGenerationWizard] Late-loading intended_use:', productData.intended_use);
      setFormData(prev => ({
        ...prev,
        intendedPurpose: productData.intended_use || '',
      }));
    }
  }, [isWizardOpen, productData?.intended_use, formData.intendedPurpose]);

  // Count filled fields to assess data sufficiency
  const countFilledFields = (): number => {
    if (!productData) return 0;
    const product = productData as any;
    
    const importantFields = [
      product.intended_use, 
      product.description, 
      product.key_features, 
      product.device_components, 
      product.key_technology_characteristics, 
      product.contraindications, 
      product.clinical_benefits,
      product.intended_purpose_data?.patient_population
    ];
    
    return importantFields.filter(value => {
      if (!value) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return Object.keys(value).length > 0;
      return true;
    }).length;
  };

  const filledFieldsCount = countFilledFields();
  const hasInsufficientData = filledFieldsCount < 3;

  // AI generation for essential characteristics
  const handleGenerateCharacteristics = async () => {
    if (!productData) {
      toast.error('No device data available for AI generation');
      return;
    }

    // Warn user about limited data
    if (hasInsufficientData) {
      toast.warning(
        'Limited device information available. AI generation may produce generic results. Consider filling in more details in Purpose and General tabs.',
        { duration: 6000 }
      );
    }

    setIsGeneratingAI(true);
    try {
      // Cast to any to access all product fields (types may not include all DB columns)
      const product = productData as any;
      const intentedPurposeData = product.intended_purpose_data || {};
      
      const context = {
        // Basic info
        name: product.name || 'Medical Device',
        device_type: product.device_type,
        device_class: product.class,
        
        // Purpose tab - Statement of Use
        intended_use: product.intended_use || formData.intendedPurpose,
        
        // Purpose tab - Context of Use
        patient_population: intentedPurposeData.patient_population,
        intended_users: product.intended_users,
        duration_of_use: intentedPurposeData.duration_of_use,
        environment_of_use: intentedPurposeData.environment_of_use,
        
        // Purpose tab - Safety & Usage
        contraindications: product.contraindications,
        clinical_benefits: product.clinical_benefits,
        
        // General tab - Definition
        description: product.description,
        key_features: product.key_features,
        device_components: product.device_components,
        
        // General tab - Technical Specs
        key_technology_characteristics: product.key_technology_characteristics,
        primary_regulatory_type: product.primary_regulatory_type,
      };

      console.log('[BasicUDIGenerationWizard] AI context:', context);

      const { data, error } = await supabase.functions.invoke('generate-udi-characteristics', {
        body: { context }
      });

      if (error) throw error;

      if (data?.characteristics) {
        setFormData(prev => ({
          ...prev,
          essentialCharacteristics: data.characteristics
        }));
        toast.success('Essential characteristics generated');
      }
    } catch (error) {
      console.error('Error generating characteristics:', error);
      toast.error('Failed to generate characteristics. Please enter manually.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleProductSelection = (productId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: checked
        ? [...prev.selectedProducts, productId]
        : prev.selectedProducts.filter(id => id !== productId)
    }));
  };

  const handleGenerate = async () => {
    if (!skuSuffix.trim()) {
      toast.error('SKU code is required');
      return;
    }

    if (formData.selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    // Validate GS1 Company Prefix is configured
    const gs1Prefix = configuration.companyPrefix;
    if (!gs1Prefix || gs1Prefix.length < 6) {
      toast.error('Please configure your GS1 Company Prefix in UDI Settings before creating Basic UDI-DI');
      return;
    }

    // Check if this Basic UDI-DI already exists
    const fullUDI = `${commonPrefix}${skuSuffix}`;
    const existingGroup = basicUDIGroups.find(g => g.basic_udi_di === fullUDI);
    if (existingGroup) {
      toast.error('A Basic UDI-DI with this code already exists');
      return;
    }

    setIsGenerating(true);
    try {
      const newGroup = await createBasicUDIGroup({
        company_id: companyId,
        basic_udi_di: fullUDI,
        internal_reference: skuSuffix,
        check_character: '',
        issuing_agency: configuration.issuingAgency || 'GS1',
        company_prefix: commonPrefix, // Store the common prefix pattern (e.g., 1569431111NOX_)
        intended_purpose: formData.intendedPurpose,
        essential_characteristics: formData.essentialCharacteristics
      });

      await assignProductsToGroup(newGroup.id, formData.selectedProducts, newGroup.basic_udi_di);

      // Reset form
      setSkuSuffix('');
      setFormData({
        internalReference: '',
        intendedPurpose: '',
        essentialCharacteristics: '',
        selectedProducts: []
      });
      setIsWizardOpen(false);
      
      toast.success('Basic UDI-DI generated successfully!');
      onSuccess?.(newGroup.basic_udi_di);
    } catch (error) {
      console.error('Error generating Basic UDI-DI:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyUDI = (udi: string) => {
    navigator.clipboard.writeText(udi);
    toast.success('UDI copied to clipboard');
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this Basic UDI-DI group?')) {
      try {
        await deleteBasicUDIGroup(groupId);
      } catch (error) {
        console.error('Error deleting group:', error);
      }
    }
  };

  const handleEditGroup = (group: BasicUDIDIGroup) => {
    setEditingGroup(group);
    setEditFormData({
      internalReference: group.internal_reference,
      intendedPurpose: group.intended_purpose || '',
      essentialCharacteristics: group.essential_characteristics || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingGroup) return;
    
    setIsUpdating(true);
    try {
      await updateBasicUDIGroup(editingGroup.id, {
        internal_reference: editFormData.internalReference,
        intended_purpose: editFormData.intendedPurpose,
        essential_characteristics: editFormData.essentialCharacteristics
      });
      setEditingGroup(null);
    } catch (error) {
      console.error('Error updating group:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!configuration.isConfigured) {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription>
          UDI configuration is required before generating Basic UDI-DI codes.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Basic UDI-DI</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Configuration Info */}
            <Alert className="border-blue-200 bg-blue-50">
              <Settings className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <strong>Your Company Prefix:</strong> <code className="font-mono">{commonPrefix}</code>
              </AlertDescription>
            </Alert>

            {/* Prefix + SKU Input */}
            <div>
              <Label htmlFor="sku-suffix">SKU Code (Item Reference)</Label>
              <div className="flex items-center gap-0 mt-1">
                <div className="px-3 py-2 bg-muted border border-r-0 rounded-l-md text-muted-foreground font-mono text-sm">
                  {commonPrefix}
                </div>
                <Input
                  id="sku-suffix"
                  value={skuSuffix}
                  onChange={(e) => setSkuSuffix(e.target.value.toUpperCase())}
                  placeholder="YOURSKU"
                  className="rounded-l-none font-mono"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your unique SKU or product identifier (e.g., LEADSW5, CATHETER01)
              </p>
            </div>

            {/* Live Preview */}
            {previewUDI && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <Label className="text-sm font-medium text-green-800">Preview Basic UDI-DI:</Label>
                <div className="flex items-center gap-2 mt-2">
                  <code className="text-lg font-mono bg-white px-3 py-1 rounded border border-green-300 text-green-700">
                    {previewUDI}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyUDI(previewUDI)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Intended Purpose */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="intended-purpose">Intended Purpose</Label>
                {productData?.intended_use && (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                    Auto-filled
                  </Badge>
                )}
              </div>
              <Textarea
                id="intended-purpose"
                value={formData.intendedPurpose}
                onChange={(e) => setFormData(prev => ({ ...prev, intendedPurpose: e.target.value }))}
                placeholder="Brief description of intended use"
                rows={3}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="essential-characteristics">Essential Design & Manufacturing Characteristics</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateCharacteristics}
                  disabled={isGeneratingAI || !productData}
                  className="h-7 text-xs"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>

              {/* AI Input Sources Indicator */}
              {productData && (
                <div className="rounded-md border bg-muted/30 p-2 mb-2">
                  <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mb-1">
                    <Settings className="h-3 w-3" />
                    AI will use:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {productData.name && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Device Name</Badge>}
                    {productData.intended_use && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Intended Use</Badge>}
                    {productData.description && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Description</Badge>}
                    {productData.class && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Device Class</Badge>}
                    {productData.device_components && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Components</Badge>}
                  </div>
                  {hasInsufficientData && (
                    <p className="text-[10px] text-amber-600 mt-1">⚠ Limited data — consider filling in more device details</p>
                  )}
                </div>
              )}

              <Textarea
                id="essential-characteristics"
                value={formData.essentialCharacteristics}
                onChange={(e) => setFormData(prev => ({ ...prev, essentialCharacteristics: e.target.value }))}
                placeholder="Key characteristics that define this device group (materials, dimensions, sterility, etc.)"
                rows={4}
              />
            </div>

            <Separator />

            {/* Device Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-medium">Select Devices for This Group</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-all-devices"
                    checked={showAllDevices}
                    onCheckedChange={(checked) => setShowAllDevices(checked as boolean)}
                  />
                  <Label htmlFor="show-all-devices" className="text-sm text-muted-foreground cursor-pointer">
                    Show assigned devices
                  </Label>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Choose devices that share the same intended purpose, risk class, and essential characteristics
              </p>
              
              {displayedDevices.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {showAllDevices 
                      ? 'No devices available in this company.'
                      : 'No unassigned devices available. Toggle "Show assigned devices" to see all devices.'}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                  {displayedDevices.map((product) => {
                    const isAssignedElsewhere = product.basic_udi_di && !product.basic_udi_di.startsWith('tmp-');
                    return (
                      <div
                        key={product.id}
                        className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 ${
                          isAssignedElsewhere ? 'bg-amber-50/50 border-amber-200' : ''
                        }`}
                      >
                        <Checkbox
                          id={product.id}
                          checked={formData.selectedProducts.includes(product.id)}
                          onCheckedChange={(checked) => 
                            handleProductSelection(product.id, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <label htmlFor={product.id} className="font-medium cursor-pointer">
                            {product.name}
                          </label>
                          {product.description && (
                            <p className="text-sm text-muted-foreground">
                              {product.description}
                            </p>
                          )}
                          {isAssignedElsewhere && (
                            <p className="text-xs text-amber-600 mt-1">
                              Currently assigned to: {product.basic_udi_di}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary">{product.status}</Badge>
                        {isAssignedElsewhere && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            Assigned
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsWizardOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || formData.selectedProducts.length === 0}
              >
                {isGenerating ? 'Generating...' : 'Generate Basic UDI-DI'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );
}
