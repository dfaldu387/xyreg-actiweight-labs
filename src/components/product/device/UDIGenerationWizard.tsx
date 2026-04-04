import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Check, Copy, Package, Barcode, CheckCircle, HelpCircle, Info, AlertTriangle, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useUDIDIVariants, useGroupItemReferences } from '@/hooks/useUDIDIVariants';
import { useBasicUDIDI } from '@/hooks/useBasicUDIDI';
import { generateUDIDI, validateUDIDI, getPackagingLevels } from '@/utils/udiCheckCharacters';
import { 
  getItemReferenceInfo, 
  validateItemReference, 
  calculateCapacityUsage,
  suggestNextItemReference
} from '@/utils/itemReferenceValidation';

interface UDIGenerationWizardProps {
  productId: string;
  companyId: string;
  currentBasicUdiDi?: string;
  onClose: () => void;
}

export function UDIGenerationWizard({ productId, companyId, currentBasicUdiDi, onClose }: UDIGenerationWizardProps) {
  const [selectedBasicUDI, setSelectedBasicUDI] = useState<string>('');
  const [packagingLevel, setPackagingLevel] = useState<string>('');
  const [itemReference, setItemReference] = useState<string>('');
  const [generatedUDI, setGeneratedUDI] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { basicUDIGroups } = useBasicUDIDI(companyId);
  const { createVariant, isCreating } = useUDIDIVariants(productId);
  const { usedReferences, isLoading: isLoadingReferences } = useGroupItemReferences(selectedBasicUDI);

  const packagingLevels = getPackagingLevels();

  // Auto-select Basic UDI-DI if product already has one assigned
  useEffect(() => {
    if (currentBasicUdiDi && basicUDIGroups.length > 0 && !selectedBasicUDI) {
      const matchingGroup = basicUDIGroups.find(g => g.basic_udi_di === currentBasicUdiDi);
      if (matchingGroup) {
        setSelectedBasicUDI(matchingGroup.id);
      }
    }
  }, [currentBasicUdiDi, basicUDIGroups, selectedBasicUDI]);

  const selectedBasicUDIGroup = basicUDIGroups.find(group => group.id === selectedBasicUDI);
  const selectedPackagingLevel = packagingLevels.find(level => level.value.toString() === packagingLevel);

  // Extract GS1 prefix info from basic_udi_di
  // IMPORTANT: The leading digits in basic_udi_di (e.g., "1569431111") include the packaging indicator as the first digit
  // For GTIN-14: 1 (pkg) + 9 (GS1 prefix) + 3 (item ref) + 1 (check) = 14
  const gs1PrefixInfo = useMemo(() => {
    if (!selectedBasicUDIGroup) return { fullNumeric: '', gs1Prefix: '', defaultPackaging: '' };
    
    // If company_prefix is explicitly set, use it
    if (selectedBasicUDIGroup.company_prefix) {
      return { 
        fullNumeric: selectedBasicUDIGroup.company_prefix, 
        gs1Prefix: selectedBasicUDIGroup.company_prefix,
        defaultPackaging: '' 
      };
    }
    
    // Extract leading digits from basic_udi_di (e.g., "1569431111" from "1569431111NOX_SASCABLESCE")
    const match = selectedBasicUDIGroup.basic_udi_di?.match(/^(\d+)/);
    if (!match) return { fullNumeric: '', gs1Prefix: '', defaultPackaging: '' };
    
    const fullNumeric = match[1]; // e.g., "1569431111" (10 digits)
    // First digit is the default packaging indicator, rest is GS1 prefix
    const defaultPackaging = fullNumeric.slice(0, 1); // e.g., "1"
    const gs1Prefix = fullNumeric.slice(1); // e.g., "569431111" (9 digits)
    
    return { fullNumeric, gs1Prefix, defaultPackaging };
  }, [selectedBasicUDIGroup]);
  
  // The actual GS1 company prefix (without packaging indicator)
  const effectiveCompanyPrefix = gs1PrefixInfo.gs1Prefix;

  // Calculate Item Reference info based on selected Basic UDI-DI group
  const itemRefInfo = useMemo(() => {
    if (!selectedBasicUDIGroup) return null;
    return getItemReferenceInfo(
      effectiveCompanyPrefix.length || 0, 
      selectedBasicUDIGroup.issuing_agency,
      usedReferences.map(r => r.itemReference) // Pass used refs for intelligent detection
    );
  }, [selectedBasicUDIGroup, effectiveCompanyPrefix, usedReferences]);

  // Validate Item Reference in real-time
  const itemRefValidation = useMemo(() => {
    if (!selectedBasicUDIGroup || !itemReference) return null;
    return validateItemReference(
      itemReference,
      effectiveCompanyPrefix.length || 0,
      selectedBasicUDIGroup.issuing_agency,
      usedReferences.map(r => r.itemReference)
    );
  }, [itemReference, selectedBasicUDIGroup, effectiveCompanyPrefix, usedReferences]);

  // Calculate capacity usage
  const capacityInfo = useMemo(() => {
    if (!itemRefInfo) return null;
    return calculateCapacityUsage(usedReferences.length, itemRefInfo.capacity);
  }, [itemRefInfo, usedReferences]);

  // Calculate suggested next item reference
  const suggestedNext = useMemo(() => {
    if (!itemRefInfo) return null;
    return suggestNextItemReference(
      usedReferences.map(r => r.itemReference),
      itemRefInfo.availableDigits
    );
  }, [itemRefInfo, usedReferences]);

  const handleGenerateUDI = () => {
    if (!selectedBasicUDIGroup || !packagingLevel || !itemReference) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    try {
      const packageLevelIndicator = parseInt(packagingLevel);
      // Use effectiveCompanyPrefix (9-digit GS1 prefix without packaging indicator)
      // The generateUDIDI function adds packaging level as first digit
      const udiDI = generateUDIDI(
        selectedBasicUDIGroup.issuing_agency,
        effectiveCompanyPrefix, // Use extracted GS1 prefix, not empty company_prefix
        itemReference,
        packageLevelIndicator
      );

      setGeneratedUDI(udiDI);
      toast.success('UDI-DI generated successfully!');
    } catch (error) {
      console.error('Error generating UDI-DI:', error);
      toast.error('Failed to generate UDI-DI');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveVariant = async () => {
    if (!selectedBasicUDIGroup || !packagingLevel || !itemReference || !generatedUDI) {
      toast.error('Please generate a UDI-DI first');
      return;
    }

    const selectedPackagingLevelObj = packagingLevels.find(level => level.value.toString() === packagingLevel);
    if (!selectedPackagingLevelObj) {
      toast.error('Invalid packaging level selected');
      return;
    }

    try {
      await createVariant({
        product_id: productId,
        basic_udi_di_group_id: selectedBasicUDI,
        packaging_level: selectedPackagingLevelObj.label,
        item_reference: itemReference,
        package_level_indicator: selectedPackagingLevelObj.value,
        generated_udi_di: generatedUDI,
      });

      // Reset form
      setSelectedBasicUDI('');
      setPackagingLevel('');
      setItemReference('');
      setGeneratedUDI('');
      onClose();
    } catch (error) {
      console.error('Error saving UDI-DI variant:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('UDI-DI copied to clipboard');
  };

  const validation = generatedUDI ? validateUDIDI(generatedUDI, selectedBasicUDIGroup?.issuing_agency || '') : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Barcode className="h-5 w-5" />
            Generate UDI-DI for Product Label
          </CardTitle>
          <CardDescription>
            Create a globally unique UDI-DI for a specific product package level
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Select Basic UDI-DI Group */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="basic-udi-group">Step 1: Select Basic UDI-DI Group</Label>
              {currentBasicUdiDi && selectedBasicUDIGroup && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Auto-selected
                </Badge>
              )}
            </div>
            <Select value={selectedBasicUDI} onValueChange={setSelectedBasicUDI}>
              <SelectTrigger className={selectedBasicUDIGroup ? 'border-green-500' : ''}>
                <SelectValue placeholder="Select a Basic UDI-DI group" />
              </SelectTrigger>
              <SelectContent>
                {basicUDIGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{group.basic_udi_di}</span>
                      <Badge variant="secondary">{group.issuing_agency}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBasicUDIGroup && (
              <div className="text-sm text-muted-foreground">
                Company Prefix: {selectedBasicUDIGroup.company_prefix} • 
                Agency: {selectedBasicUDIGroup.issuing_agency}
              </div>
            )}
          </div>

          <Separator />

          {/* Step 2: Select Packaging Level */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="packaging-level">Step 2: Select Packaging Level</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                    <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96" align="start">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">What is a Packaging Level?</h4>
                      <p className="text-xs text-muted-foreground">
                        Think of your product like Russian nesting dolls. The device itself is inside a pouch, 
                        pouches go in boxes, boxes go in cases. Each "level" can have its own barcode (UDI-DI).
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs font-medium">Which level are you creating a barcode for?</p>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-2 p-2 bg-green-50 rounded border border-green-200">
                          <Badge className="bg-green-600 shrink-0">0</Badge>
                          <div>
                            <p className="font-medium">Unit of Use</p>
                            <p className="text-muted-foreground">The individual device that touches the patient</p>
                            <p className="text-green-700 mt-1">Use when: Creating a barcode for a single syringe, catheter, or implant</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                          <Badge className="bg-blue-600 shrink-0">1</Badge>
                          <div>
                            <p className="font-medium">Each (Primary Package)</p>
                            <p className="text-muted-foreground">The smallest box/pouch you sell individually</p>
                            <p className="text-blue-700 mt-1">Use when: The box a hospital scans when receiving one item</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2 p-2 bg-muted rounded border">
                          <Badge variant="secondary" className="shrink-0">3</Badge>
                          <div>
                            <p className="font-medium">Case (Shipping Box)</p>
                            <p className="text-muted-foreground">A cardboard box containing multiple units</p>
                            <p className="text-muted-foreground mt-1">Use when: The box hospitals order (e.g., "1 case of 50 syringes")</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2 p-2 bg-purple-50 rounded border border-purple-200">
                          <Badge className="bg-purple-600 shrink-0">7</Badge>
                          <div>
                            <p className="font-medium">Set/Kit</p>
                            <p className="text-muted-foreground">Multiple different items sold together</p>
                            <p className="text-purple-700 mt-1">Use when: A surgical tray with scalpel + sutures + gauze</p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground pt-2 border-t">
                        Other levels (2, 4, 5, 6, 8) are less common and used for intermediate packaging, pallets, or retail displays.
                      </p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Select value={packagingLevel} onValueChange={setPackagingLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select packaging level" />
              </SelectTrigger>
              <SelectContent>
                {packagingLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value.toString()}>
                    <div className="flex items-center gap-3 w-full">
                      <span className="font-medium">{level.label}</span>
                      <Badge variant="outline" className="text-xs">{level.value}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPackagingLevel && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <p className="text-sm">{selectedPackagingLevel.description}</p>
                <p className="text-xs text-muted-foreground">
                  <Info className="h-3 w-3 inline mr-1" />
                  <strong>Example:</strong> {selectedPackagingLevel.example}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Step 3: Enter Item Reference */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="item-reference">Step 3: Item Reference Number</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96" side="right">
                  <div className="space-y-3">
                    <h4 className="font-semibold">What is an Item Reference Number?</h4>
                    <p className="text-sm text-muted-foreground">
                      This is a <strong>unique number you assign</strong> to identify this specific product variant 
                      within your company's catalog. It becomes part of the UDI-DI barcode.
                    </p>
                    
                    {itemRefInfo && selectedBasicUDIGroup && (
                      <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800 space-y-2">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          📐 Your Digit Allocation
                        </p>
                        <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                          <p>GS1 Company Prefix: <strong>{selectedBasicUDIGroup.company_prefix}</strong> ({selectedBasicUDIGroup.company_prefix.length} digits)</p>
                          <p>Available Item Reference: <strong>{itemRefInfo.availableDigits} digits</strong> ({itemRefInfo.minValue} - {itemRefInfo.maxValue})</p>
                          <p>This means you can identify up to <strong>{itemRefInfo.capacity.toLocaleString()}</strong> unique products.</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg space-y-2">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">💡 How to choose a number:</p>
                      <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• Use your internal catalog/SKU number</li>
                        <li>• Or create a sequential number (0001, 0002, 0003...)</li>
                        <li>• Must be unique within your Basic UDI-DI group</li>
                        <li>• Numbers will be zero-padded automatically (5 → 05)</li>
                      </ul>
                    </div>

                    {usedReferences.length > 0 && (
                      <div className="bg-muted p-3 rounded-lg space-y-2">
                        <p className="text-sm font-medium">📦 Already used in this group:</p>
                        <div className="text-xs font-mono space-y-1 max-h-32 overflow-y-auto">
                          {usedReferences.slice(0, 5).map((ref, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate">{ref.productName}:</span>
                              <Badge variant="secondary">{ref.itemReference}</Badge>
                            </div>
                          ))}
                          {usedReferences.length > 5 && (
                            <p className="text-muted-foreground">...and {usedReferences.length - 5} more</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Digit Allocation Display */}
            {selectedBasicUDIGroup && itemRefInfo && (
              <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-200 dark:border-amber-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      📊 Available: {itemRefInfo.availableDigits}-digit Item Reference
                    </span>
                    <Badge variant="outline" className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-amber-300">
                      {itemRefInfo.minValue} - {itemRefInfo.maxValue}
                    </Badge>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            capacityInfo?.status === 'critical' ? 'bg-red-100 text-red-700 border-red-300' :
                            capacityInfo?.status === 'high' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                            capacityInfo?.status === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                            'bg-green-100 text-green-700 border-green-300'
                          }`}
                        >
                          {usedReferences.length}/{itemRefInfo.capacity.toLocaleString()} used
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{capacityInfo?.remaining.toLocaleString()} item references remaining</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {/* Capacity Progress Bar */}
                <Progress 
                  value={capacityInfo?.percentage || 0} 
                  className={`h-1.5 ${
                    capacityInfo?.status === 'critical' ? '[&>div]:bg-red-500' :
                    capacityInfo?.status === 'high' ? '[&>div]:bg-orange-500' :
                    capacityInfo?.status === 'medium' ? '[&>div]:bg-yellow-500' :
                    '[&>div]:bg-green-500'
                  }`}
                />
                
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                  {selectedBasicUDIGroup.company_prefix?.length > 0 
                    ? `Your prefix (${selectedBasicUDIGroup.company_prefix.length} digits) leaves ${itemRefInfo.availableDigits} digits for identifying products.`
                    : `${itemRefInfo.availableDigits}-digit item references detected from existing usage.`
                  }
                </p>
              </div>
            )}
            
            {/* Suggest Next Reference - Dual Options */}
            {selectedBasicUDIGroup && suggestedNext && (
              <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Available Item References:
                  </span>
                </div>
                
                <div className="space-y-2 ml-7">
                  {/* Next Sequential */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      Next sequential: <strong className="font-mono">{suggestedNext.nextSequential}</strong>
                      <span className="text-xs ml-1 opacity-70">(after {suggestedNext.maxUsed})</span>
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300"
                      onClick={() => setItemReference(suggestedNext.nextSequential)}
                    >
                      Use
                    </Button>
                  </div>
                  
                  {/* Lowest Available - always show */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      Lowest available: <strong className="font-mono">{suggestedNext.lowestAvailable}</strong>
                      {suggestedNext.hasGaps && (
                        <span className="text-xs ml-1 opacity-70">({suggestedNext.gapCount.toLocaleString()} unused below max)</span>
                      )}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300"
                      onClick={() => setItemReference(suggestedNext.lowestAvailable)}
                    >
                      Use
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Input Field */}
            <div className="relative">
              <Input
                id="item-reference"
                value={itemReference}
                onChange={(e) => setItemReference(e.target.value)}
                placeholder={itemRefInfo ? `Enter ${itemRefInfo.availableDigits}-digit reference (e.g., ${itemRefInfo.minValue.slice(0, -1)}1)` : "Select a Basic UDI-DI first"}
                maxLength={itemRefInfo?.availableDigits || 10}
                disabled={!selectedBasicUDIGroup}
                className={`${
                  itemRefValidation?.isValid === false ? 'border-red-500 focus-visible:ring-red-500' :
                  itemRefValidation?.warning ? 'border-yellow-500 focus-visible:ring-yellow-500' :
                  itemRefValidation?.isValid ? 'border-green-500 focus-visible:ring-green-500' : ''
                }`}
              />
              {itemRefValidation && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {itemRefValidation.isValid ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            
            {/* Real-time Availability Feedback - Prominent */}
            {itemReference && itemRefValidation && (
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                itemRefValidation.isValid 
                  ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-700' 
                  : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-700'
              }`}>
                {itemRefValidation.isValid ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        ✅ Available - this item reference is free to use
                      </span>
                      {itemRefValidation.warning && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                          {itemRefValidation.warning}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">
                      ❌ {itemRefValidation.error}
                    </span>
                  </>
                )}
              </div>
            )}

            {!selectedBasicUDIGroup && (
              <p className="text-sm text-muted-foreground">
                Select a Basic UDI-DI group first to see available digit allocation
              </p>
            )}
          </div>

          <Separator />

          {/* UDI-DI Structure Anatomy */}
          {selectedBasicUDIGroup && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">How Your UDI-DI is Constructed</h4>
              </div>
              
              {/* Visual anatomy breakdown - GTIN-14 structure */}
              <div className="bg-white dark:bg-background rounded-lg p-4 border">
                <p className="text-xs text-center text-muted-foreground mb-3">Your UDI-DI is a 14-digit GTIN:</p>
                <div className="flex items-center justify-center gap-1 text-lg font-mono mb-4">
                  <div className="flex flex-col items-center">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600">
                      {packagingLevel || '?'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">Pkg Level</span>
                  </div>
                  <span className="text-gray-400">+</span>
                  <div className="flex flex-col items-center">
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-sm">
                      {effectiveCompanyPrefix || '?'}
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">GS1 Prefix ({effectiveCompanyPrefix?.length || '?'} digits)</span>
                  </div>
                  <span className="text-gray-400">+</span>
                  <div className="flex flex-col items-center">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-300 border-2 border-green-500 font-bold">
                      {itemReference || '____'}
                    </span>
                    <span className="text-[10px] text-green-600 dark:text-green-400 mt-1 font-medium">Item Reference</span>
                  </div>
                  <span className="text-gray-400">+</span>
                  <div className="flex flex-col items-center">
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded text-purple-600 dark:text-purple-400">
                      {generatedUDI ? generatedUDI.slice(-1) : '?'}
                    </span>
                    <span className="text-[10px] text-purple-500 mt-1">Check Digit</span>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-4 text-xs border-t pt-3">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700 border border-slate-400"></div>
                    <span className="text-muted-foreground">Packaging indicator</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-amber-200 dark:bg-amber-800 border border-amber-400"></div>
                    <span className="text-muted-foreground">Your GS1 prefix (fixed)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-200 dark:bg-green-800 border-2 border-green-500"></div>
                    <span className="text-green-700 dark:text-green-400 font-medium">You choose this!</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-purple-200 dark:bg-purple-800"></div>
                    <span className="text-muted-foreground">Auto-calculated</span>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-3 text-center">
                The <strong>Item Reference</strong> is what makes each product unique. Use your internal SKU or a sequential number.
                <br />
                <span className="text-blue-500 dark:text-blue-400">Note: "(01)" is added only during barcode encoding, not stored in the database.</span>
              </p>
            </div>
          )}

          <Separator />

          {/* Step 4: Generate UDI-DI */}
          <div className="space-y-3">
            <Label>Step 4: Generate UDI-DI</Label>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateUDI}
                disabled={!selectedBasicUDI || !packagingLevel || !itemReference || isGenerating}
                className="flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Generate UDI-DI'}
              </Button>
            </div>
            
            {generatedUDI && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <div className="font-mono text-lg font-semibold">{generatedUDI}</div>
                    {selectedBasicUDIGroup && (
                      <div className="text-sm text-muted-foreground">
                        {selectedBasicUDIGroup.issuing_agency} format • 
                        Package Level: {selectedPackagingLevel?.label}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedUDI)}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {validation && (
                  <Alert variant={validation.valid ? "default" : "destructive"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {validation.valid ? (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Valid UDI-DI format and check digit
                        </div>
                      ) : (
                        validation.error
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveVariant}
              disabled={!generatedUDI || isCreating || !validation?.valid}
              className="flex items-center gap-2"
            >
              {isCreating ? 'Saving...' : 'Save UDI-DI Variant'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}