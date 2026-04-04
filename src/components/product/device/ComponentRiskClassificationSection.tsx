import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, AlertTriangle, Package, Search, Zap, Beaker, HelpCircle, Sparkles, Flag, Shield, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RegulatoryComponent as DeviceComponent, ComponentRiskClassification } from "@/types/deviceComponents";
import { getMarketByCode, getRiskClassesForMarket } from "@/utils/marketRiskClassMapping";
import { ClassificationAssistant } from "@/components/classification/ClassificationAssistant";
import { EUSaMDClassificationAssistant } from "@/components/classification/EUSaMDClassificationAssistant";
import { UKClassificationTrigger } from "@/components/classification/UKClassificationTrigger";
import { FDAClassificationTrigger } from "@/components/classification/FDAClassificationTrigger";
import { UKSaMDClassificationAssistant } from "@/components/classification/UKSaMDClassificationAssistant";
import { FDASaMDClassificationAssistant } from "@/components/classification/FDASaMDClassificationAssistant";
import { CanadaClassificationTrigger } from "@/components/classification/CanadaClassificationTrigger";
import { BrazilClassificationTrigger } from "@/components/classification/BrazilClassificationTrigger";
import { AustraliaClassificationTrigger } from "@/components/classification/AustraliaClassificationTrigger";
import { ChinaClassificationTrigger } from "@/components/classification/ChinaClassificationTrigger";
import IndiaClassificationTrigger from "@/components/classification/IndiaClassificationTrigger";
import { JapanClassificationTrigger } from "@/components/classification/JapanClassificationTrigger";
import { SouthKoreaClassificationTrigger } from "@/components/classification/SouthKoreaClassificationTrigger";
import { SwitzerlandClassificationTrigger } from "@/components/classification/SwitzerlandClassificationTrigger";
import { CanadaSaMDClassificationAssistant } from "@/components/classification/CanadaSaMDClassificationAssistant";
import { BrazilSaMDClassificationAssistant } from "@/components/classification/BrazilSaMDClassificationAssistant";
import { AustraliaSaMDClassificationAssistant } from "@/components/classification/AustraliaSaMDClassificationAssistant";
import { ChinaSaMDClassificationAssistant } from "@/components/classification/ChinaSaMDClassificationAssistant";
import { IndiaSaMDClassificationAssistant } from "@/components/classification/IndiaSaMDClassificationAssistant";
import { JapanSaMDClassificationAssistant } from "@/components/classification/JapanSaMDClassificationAssistant";
import { SouthKoreaSaMDClassificationAssistant } from "@/components/classification/SouthKoreaSaMDClassificationAssistant";
import { SwitzerlandSaMDClassificationAssistant } from "@/components/classification/SwitzerlandSaMDClassificationAssistant";
import { DeviceClass, ClassificationResult } from "@/types/classification";

interface ComponentRiskClassificationSectionProps {
  marketCode: string;
  marketName: string;
  componentClassification?: ComponentRiskClassification;
  onComponentClassificationChange: (marketCode: string, classification: ComponentRiskClassification) => void;
  deviceType: 'procedure-pack' | 'simd';
  isLoading?: boolean;
  availableComponents?: Array<{ name: string; description: string; }>; // Components from Product Definition
  primaryRegulatoryType?: string;
  keyTechnologyCharacteristics?: any;
  compactMode?: boolean; // When true, only show the Custom Components section (no header, help banner, or footer text)
}

export function ComponentRiskClassificationSection({
  marketCode,
  marketName,
  componentClassification,
  onComponentClassificationChange,
  deviceType,
  isLoading = false,
  availableComponents = [],
  primaryRegulatoryType,
  keyTechnologyCharacteristics,
  compactMode = false
}: ComponentRiskClassificationSectionProps) {
  const [isMDRAssistantOpen, setIsMDRAssistantOpen] = useState(false);
  const [isSaMDAssistantOpen, setIsSaMDAssistantOpen] = useState(false);
  const [isUKAssistantOpen, setIsUKAssistantOpen] = useState(false);
  const [isFDAAssistantOpen, setIsFDAAssistantOpen] = useState(false);
  const [isUKSaMDAssistantOpen, setIsUKSaMDAssistantOpen] = useState(false);
  const [isFDASaMDAssistantOpen, setIsFDASaMDAssistantOpen] = useState(false);
  const [isCanadaAssistantOpen, setIsCanadaAssistantOpen] = useState(false);
  const [isBrazilAssistantOpen, setIsBrazilAssistantOpen] = useState(false);
  const [isAustraliaAssistantOpen, setIsAustraliaAssistantOpen] = useState(false);
  const [isChinaAssistantOpen, setIsChinaAssistantOpen] = useState(false);
  const [isIndiaAssistantOpen, setIsIndiaAssistantOpen] = useState(false);
  const [isJapanAssistantOpen, setIsJapanAssistantOpen] = useState(false);
  const [isSouthKoreaAssistantOpen, setIsSouthKoreaAssistantOpen] = useState(false);
  const [isSwitzerlandAssistantOpen, setIsSwitzerlandAssistantOpen] = useState(false);
  // SaMD assistants for all markets
  const [isCanadaSaMDAssistantOpen, setIsCanadaSaMDAssistantOpen] = useState(false);
  const [isBrazilSaMDAssistantOpen, setIsBrazilSaMDAssistantOpen] = useState(false);
  const [isAustraliaSaMDAssistantOpen, setIsAustraliaSaMDAssistantOpen] = useState(false);
  const [isChinaSaMDAssistantOpen, setIsChinaSaMDAssistantOpen] = useState(false);
  const [isIndiaSaMDAssistantOpen, setIsIndiaSaMDAssistantOpen] = useState(false);
  const [isJapanSaMDAssistantOpen, setIsJapanSaMDAssistantOpen] = useState(false);
  const [isSouthKoreaSaMDAssistantOpen, setIsSouthKoreaSaMDAssistantOpen] = useState(false);
  const [isSwitzerlandSaMDAssistantOpen, setIsSwitzerlandSaMDAssistantOpen] = useState(false);
  const [activeComponentId, setActiveComponentId] = useState<string | null>(null);
  const [activeAssistantType, setActiveAssistantType] = useState<'device' | 'software' | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [components, setComponents] = useState<DeviceComponent[]>(
    componentClassification?.components || []
  );
  const [showAddForm, setShowAddForm] = useState(false);

  const marketInfo = getMarketByCode(marketCode);

  // Get risk classes based on regulatory type - with fallback to MDR classes
  const isIVD = primaryRegulatoryType === 'In Vitro Diagnostic (IVD)';
  const riskClassOptions = getRiskClassesForMarket(marketCode, isIVD);
  // Fallback to MDR classes if no options returned (handles edge cases)
  const finalRiskClassOptions = riskClassOptions.length > 0
    ? riskClassOptions
    : (marketInfo?.mdrRiskClasses || []);

  const isSiMDSoftwareComponent = (component: DeviceComponent) => deviceType === 'simd' && component.componentType === 'software';

  // Software in SiMD uses the same market risk classes as hardware
  // Each market has its own device classification framework that applies to software
  const getSoftwareClassLabel = (): string => {
    switch (marketCode) {
      case 'EU': return 'Software Class (MDR Rule 11)';
      case 'UK': return 'Software Class (UK MDR)';
      case 'US': return 'Software Class (FDA)';
      case 'CA': return 'Software Class (Health Canada)';
      case 'AU': return 'Software Class (TGA)';
      case 'CH': return 'Software Class (Swissmedic)';
      case 'JP': return 'Software Class (PMDA)';
      case 'CN': return 'Software Class (NMPA)';
      case 'BR': return 'Software Class (ANVISA)';
      case 'IN': return 'Software Class (CDSCO)';
      case 'KR': return 'Software Class (MFDS)';
      default: return 'Software Risk Class';
    }
  };
  
  // Classification handler for when an assistant returns a result
  const handleClassificationComplete = (deviceClass: DeviceClass, result?: ClassificationResult) => {
    if (activeComponentId) {
      // Map the classification result to match marketRiskClassMapping values (I, IIa, IIb, III)
      let riskClassValue = '';
      if (deviceClass.includes('IIb')) riskClassValue = 'IIb';
      else if (deviceClass.includes('IIa')) riskClassValue = 'IIa';
      else if (deviceClass.includes('III')) riskClassValue = 'III';
      else if (deviceClass.includes('I')) riskClassValue = 'I';

      if (riskClassValue) {
        // Update risk class, component name (if empty), and store the full classification result
        setComponents(prev => prev.map(component => {
          if (component.id === activeComponentId) {
            const defaultName = activeAssistantType === 'software' ? 'Software Component' : 'Hardware Component';
            return {
              ...component,
              name: component.name || defaultName,
              riskClass: riskClassValue,
              classificationResult: result // Store full result with ruleText, ruleSource, decisionPath
            };
          }
          return component;
        }));
        toast.success(`Classification applied: Class ${riskClassValue}`);
      }
    }
    setActiveComponentId(null);
    setActiveAssistantType(null);
  };

  const openAssistantForComponent = (componentId: string, componentType: 'device' | 'software') => {
    setActiveComponentId(componentId);
    setActiveAssistantType(componentType);
    if (componentType === 'software') {
      // Software classification assistants per market
      if (marketCode === 'EU') {
        setIsSaMDAssistantOpen(true);
      } else if (marketCode === 'UK') {
        setIsUKSaMDAssistantOpen(true);
      } else if (marketCode === 'US' || marketCode === 'USA') {
        setIsFDASaMDAssistantOpen(true);
      } else if (marketCode === 'CA') {
        setIsCanadaSaMDAssistantOpen(true);
      } else if (marketCode === 'BR') {
        setIsBrazilSaMDAssistantOpen(true);
      } else if (marketCode === 'AU') {
        setIsAustraliaSaMDAssistantOpen(true);
      } else if (marketCode === 'CN') {
        setIsChinaSaMDAssistantOpen(true);
      } else if (marketCode === 'IN') {
        setIsIndiaSaMDAssistantOpen(true);
      } else if (marketCode === 'JP') {
        setIsJapanSaMDAssistantOpen(true);
      } else if (marketCode === 'KR') {
        setIsSouthKoreaSaMDAssistantOpen(true);
      } else if (marketCode === 'CH') {
        setIsSwitzerlandSaMDAssistantOpen(true);
      }
    } else {
      // Hardware classification - open market-specific assistant
      if (marketCode === 'EU') {
        setIsMDRAssistantOpen(true);
      } else if (marketCode === 'UK') {
        setIsUKAssistantOpen(true);
      } else if (marketCode === 'US' || marketCode === 'USA') {
        setIsFDAAssistantOpen(true);
      } else if (marketCode === 'CA') {
        setIsCanadaAssistantOpen(true);
      } else if (marketCode === 'BR') {
        setIsBrazilAssistantOpen(true);
      } else if (marketCode === 'AU') {
        setIsAustraliaAssistantOpen(true);
      } else if (marketCode === 'CN') {
        setIsChinaAssistantOpen(true);
      } else if (marketCode === 'IN') {
        setIsIndiaAssistantOpen(true);
      } else if (marketCode === 'JP') {
        setIsJapanAssistantOpen(true);
      } else if (marketCode === 'KR') {
        setIsSouthKoreaAssistantOpen(true);
      } else if (marketCode === 'CH') {
        setIsSwitzerlandAssistantOpen(true);
      }
    }
  };

  // Handler for UK SaMD classification result
  const handleUKSaMDClassificationComplete = (deviceClass: DeviceClass, result?: ClassificationResult) => {
    if (activeComponentId) {
      let riskClassValue = '';
      if (deviceClass.includes('IIb')) riskClassValue = 'IIb';
      else if (deviceClass.includes('IIa')) riskClassValue = 'IIa';
      else if (deviceClass.includes('III')) riskClassValue = 'III';
      else if (deviceClass.includes('I')) riskClassValue = 'I';

      if (riskClassValue) {
        setComponents(prev => prev.map(component => {
          if (component.id === activeComponentId) {
            return {
              ...component,
              name: component.name || 'Software Component',
              riskClass: riskClassValue
            };
          }
          return component;
        }));
        toast.success(`Classification applied: Class ${riskClassValue}`);
      }
    }
    setActiveComponentId(null);
    setActiveAssistantType(null);
    setIsUKSaMDAssistantOpen(false);
  };

  // Handler for FDA SaMD classification result
  const handleFDASaMDClassificationComplete = (deviceClass: DeviceClass, result?: ClassificationResult) => {
    if (activeComponentId) {
      let riskClassValue = '';
      if (deviceClass.includes('III')) riskClassValue = 'III';
      else if (deviceClass.includes('II')) riskClassValue = 'II';
      else if (deviceClass.includes('I')) riskClassValue = 'I';

      if (riskClassValue) {
        setComponents(prev => prev.map(component => {
          if (component.id === activeComponentId) {
            return {
              ...component,
              name: component.name || 'Software Component',
              riskClass: riskClassValue
            };
          }
          return component;
        }));
        toast.success(`Classification applied: Class ${riskClassValue}`);
      }
    }
    setActiveComponentId(null);
    setActiveAssistantType(null);
    setIsFDASaMDAssistantOpen(false);
  };

  // Handler for UK classification result
  const handleUKClassificationComplete = (riskClass: string, result: any) => {
    if (activeComponentId) {
      // Map UK class to match marketRiskClassMapping values
      let riskClassValue = '';
      if (riskClass === 'III') riskClassValue = 'III';
      else if (riskClass === 'IIb') riskClassValue = 'IIb';
      else if (riskClass === 'IIa') riskClassValue = 'IIa';
      else if (riskClass === 'I') riskClassValue = 'I';

      if (riskClassValue) {
        setComponents(prev => prev.map(component => {
          if (component.id === activeComponentId) {
            return {
              ...component,
              name: component.name || 'Hardware Component',
              riskClass: riskClassValue
            };
          }
          return component;
        }));
        toast.success(`Classification applied: Class ${riskClassValue}`);
      }
    }
    setActiveComponentId(null);
    setActiveAssistantType(null);
    setIsUKAssistantOpen(false);
  };

  // Handler for FDA classification result
  const handleFDAClassificationComplete = (riskClass: string, result: any) => {
    if (activeComponentId) {
      setComponents(prev => prev.map(component => {
        if (component.id === activeComponentId) {
          return {
            ...component,
            name: component.name || 'Hardware Component',
            riskClass: riskClass
          };
        }
        return component;
      }));
      toast.success(`Classification applied: Class ${riskClass}`);
    }
    setActiveComponentId(null);
    setActiveAssistantType(null);
    setIsFDAAssistantOpen(false);
  };

  // Generic handler for other market classification results (Canada, Brazil, Australia, China, India, Japan, South Korea, Switzerland)
  const handleGenericMarketClassificationComplete = (riskClass: string, result: any, closeAssistant: () => void) => {
    if (activeComponentId) {
      setComponents(prev => prev.map(component => {
        if (component.id === activeComponentId) {
          return {
            ...component,
            name: component.name || 'Hardware Component',
            riskClass: riskClass
          };
        }
        return component;
      }));
      toast.success(`Classification applied: Class ${riskClass}`);
    }
    setActiveComponentId(null);
    setActiveAssistantType(null);
    closeAssistant();
  };

  // Track if we've initialized to prevent re-syncing from props after user edits
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Sync with componentClassification prop and merge with Product Definition components  
  // Only run on initial mount or when marketCode changes (different market)
  useEffect(() => {
    // Start with components from componentClassification (existing regulatory data)
    let initialComponents: DeviceComponent[] = [...(componentClassification?.components || [])];

    // For SiMD, always ensure HW/SW rows exist (they are NOT from product definition)
    if (deviceType === 'simd') {
      const hasHardware = initialComponents.some(c => c.id === 'hardware-1');
      const hasSoftware = initialComponents.some(c => c.id === 'software-1');
      
      if (!hasHardware) {
        initialComponents.push({
          id: 'hardware-1',
          name: 'Hardware Device',
          description: '',
          riskClass: '',
          componentType: 'device',
          isSelected: true
        });
      }
      if (!hasSoftware) {
        initialComponents.push({
          id: 'software-1',
          name: 'Software Component',
          description: '',
          riskClass: '',
          componentType: 'software',
          isSelected: true
        });
      }
    }

    // Add Product Definition components that aren't already included (Procedure Packs only)
    if (deviceType === 'procedure-pack' && availableComponents.length > 0) {
      const existingNames = new Set(initialComponents.map(c => c.name));
      
      const missingProductDefComponents = availableComponents.filter(
        comp => !existingNames.has(comp.name)
      );
      
      if (missingProductDefComponents.length > 0) {
        const productDefComponents: DeviceComponent[] = missingProductDefComponents.map((comp) => ({
          id: `product-def-${comp.name}`,
          name: comp.name,
          description: comp.description || '',
          riskClass: '',
          componentType: 'device',
          isFromProductDefinition: true,
          isSelected: false
        }));
        
        initialComponents = [...initialComponents, ...productDefComponents];
      }
    }
    
    // Only add default components if no components exist at all (Procedure Packs fallback)
    // Start with 2 components since a "pack" implies multiple items
    // Skip this in compactMode - user should add components manually
    if (deviceType === 'procedure-pack' && initialComponents.length === 0 && !compactMode) {
      initialComponents = [
        {
          id: 'component-1',
          name: '',
          description: '',
          riskClass: '',
          componentType: 'device',
          isSelected: true
        },
        {
          id: 'component-2',
          name: '',
          description: '',
          riskClass: '',
          componentType: 'device',
          isSelected: true
        }
      ];
    }

    setComponents(initialComponents);
    setHasInitialized(true);
  // Only sync on mount or when market changes - don't re-sync when componentClassification updates from our own saves
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketCode, deviceType, compactMode]);

  // Calculate overall risk class from highest component class
  // For SiMD, overall regulatory class is based on HARDWARE only (software safety class per IEC 62304 is tracked separately)
  const calculateOverallRiskClass = (components: DeviceComponent[]): string => {
    if (!marketInfo) return '';

    const selectedForOverall = components.filter(c => {
      if (c.isSelected === false) return false;
      if (!c.riskClass) return false;
      return true;
    });

    if (selectedForOverall.length === 0) return '';

    const riskClassHierarchy = marketInfo.riskClasses.map(rc => rc.value);

    // Find the highest risk class (last in the hierarchy)
    let highestClass = '';
    let highestIndex = -1;

    selectedForOverall.forEach(component => {
      const index = riskClassHierarchy.indexOf(component.riskClass);
      if (index > highestIndex) {
        highestIndex = index;
        highestClass = component.riskClass;
      }
    });

    return highestClass;
  };

  // Update parent when components change - use ref to avoid stale closure
  const onComponentClassificationChangeRef = React.useRef(onComponentClassificationChange);
  onComponentClassificationChangeRef.current = onComponentClassificationChange;
  
  useEffect(() => {
    // Skip the initial render before we've loaded data
    if (!hasInitialized) return;
    
    const overallRiskClass = calculateOverallRiskClass(components);
    // Save ALL components (not just selected) to preserve state on reload
    const classification: ComponentRiskClassification = {
      components: components,
      overallRiskClass
    };
    onComponentClassificationChangeRef.current(marketCode, classification);
  }, [components, marketCode, hasInitialized]);

  const addNewComponent = () => {
    const newComponent: DeviceComponent = {
      id: `new-component-${Date.now()}`,
      name: '',
      description: '',
      riskClass: '',
      componentType: 'device',
      isSelected: true
    };
    setComponents([...components, newComponent]);
    setShowAddForm(false);
  };

  const removeComponent = (id: string) => {
    // SiMD always has exactly HW + SW; don't allow removing the defaults
    if (deviceType === 'simd' && (id === 'hardware-1' || id === 'software-1')) return;

    const component = components.find(c => c.id === id);
    if (component?.isFromProductDefinition) {
      // Don't remove components from product definition, just unselect them
      updateComponent(id, 'isSelected', false);
    } else {
      // Remove custom components
      setComponents(components.filter(c => c.id !== id));
    }
  };

  const updateComponent = (id: string, field: keyof DeviceComponent, value: string | boolean) => {
    setComponents(components.map(component =>
      component.id === id ? { ...component, [field]: value } : component
    ));
  };

  const toggleComponentSelection = (id: string, selected: boolean) => {
    updateComponent(id, 'isSelected', selected);
  };

  const overallRiskClass = calculateOverallRiskClass(components);
  const overallRiskClassLabel = marketInfo?.riskClasses.find(rc => rc.value === overallRiskClass)?.label;
  const selectedComponents = components.filter(c => c.isSelected !== false);

  return (
    <div className={compactMode ? "space-y-4" : "border rounded-md p-4 space-y-4"}>
      {/* Header - hidden in compact mode */}
      {!compactMode && (
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">{marketName}</h4>
            <p className="text-sm text-muted-foreground">
              {deviceType === 'procedure-pack' ? 'Procedure Pack Components' : 'SiMD Components'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {overallRiskClass && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-md">
                <AlertTriangle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  Overall Class: {overallRiskClassLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Classification Help Banner - hidden in compact mode */}
      {!compactMode && (
      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
        <div className="flex items-start gap-2">
          <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {(keyTechnologyCharacteristics?.isSoftwareMobileApp || deviceType === 'simd')
                ? `Hardware: classified under ${marketName} device framework. Software: classified using ${marketName} software guidance (same risk classes).`
                : `Use the classification assistant to determine risk class for each component.`}
            </p>
            <div className="flex flex-wrap gap-2">
              {/* Market-specific hardware classification assistants */}
              {marketCode === 'EU' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMDRAssistantOpen(true)}
                  className="h-7 text-xs"
                >
                  <Search className="h-3 w-3 mr-1" />
                  EU MDR Assistant (Hardware)
                </Button>
              )}
              {marketCode === 'UK' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUKAssistantOpen(true)}
                  className="h-7 text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  UK MHRA Assistant (Hardware)
                </Button>
              )}
              {marketCode === 'US' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFDAAssistantOpen(true)}
                  className="h-7 text-xs"
                >
                  <Search className="h-3 w-3 mr-1" />
                  FDA Assistant (Hardware)
                </Button>
              )}
              {!['EU', 'UK', 'US'].includes(marketCode) && (
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Select the appropriate risk class for each component based on {marketName} regulatory requirements.
                </p>
              )}
              
              {/* Software classification assistants per market - show when SiMD, regardless of System/Procedure Pack */}
              {(keyTechnologyCharacteristics?.isSoftwareMobileApp || deviceType === 'simd') && marketCode === 'EU' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSaMDAssistantOpen(true)}
                  className="h-7 text-xs"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Software Assistant (Rule 11)
                </Button>
              )}
              {(keyTechnologyCharacteristics?.isSoftwareMobileApp || deviceType === 'simd') && marketCode === 'UK' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUKSaMDAssistantOpen(true)}
                  className="h-7 text-xs"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Software Assistant (UK MHRA)
                </Button>
              )}
              {(keyTechnologyCharacteristics?.isSoftwareMobileApp || deviceType === 'simd') && marketCode === 'US' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFDASaMDAssistantOpen(true)}
                  className="h-7 text-xs"
                >
                  <Flag className="h-3 w-3 mr-1" />
                  Software Assistant (FDA SaMD)
                </Button>
              )}
              {(keyTechnologyCharacteristics?.isSoftwareMobileApp || deviceType === 'simd') && !['EU', 'UK', 'US'].includes(marketCode) && (
                <p className="text-xs text-muted-foreground">
                  Software: select risk class based on {marketName} regulatory guidance. IEC 62304 (A/B/C) applies to development lifecycle, not classification.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Available Components from Product Definition (Procedure Packs only) - hidden in compact mode */}
      {!compactMode && deviceType === 'procedure-pack' && availableComponents.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Package className="w-4 h-4" />
            Available Components from Product Definition
          </div>
          {components.filter(c => c.isFromProductDefinition).map((component) => (
            <div key={component.id} className="flex items-center gap-3 p-3 border rounded-md bg-blue-50/50">
              <Checkbox
                checked={component.isSelected !== false}
                onCheckedChange={(checked) => toggleComponentSelection(component.id, checked as boolean)}
                disabled={isLoading}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{component.name}</div>
                <div className="text-xs text-muted-foreground truncate">{component.description}</div>
              </div>
              {component.isSelected !== false && (
                <div className="flex-shrink-0 w-32">
                  <Select
                    value={component.riskClass}
                    onValueChange={(value) => updateComponent(component.id, 'riskClass', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Risk class" />
                    </SelectTrigger>
                    <SelectContent>
                      {finalRiskClassOptions.map(riskClass => (
                        <SelectItem key={riskClass.value} value={riskClass.value}>
                          {riskClass.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Components */}
      {selectedComponents.filter(c => !c.isFromProductDefinition).length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            {deviceType === 'simd' ? 'Hardware & Software' : 'Custom Components'}
          </div>
          {selectedComponents.filter(c => !c.isFromProductDefinition).map((component) => (
            <div key={component.id} className="grid grid-cols-12 gap-3 items-end p-3 border rounded-md bg-muted/30">
              <div className="col-span-4">
                <Label className="text-xs">Component Name</Label>
                <Input
                  placeholder={
                    deviceType === 'simd' && component.componentType === 'software'
                      ? "e.g., Control Software"
                      : "e.g., Sterile Scalpel"
                  }
                  value={component.name}
                  onChange={(e) => updateComponent(component.id, 'name', e.target.value)}
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>

              <div className="col-span-3">
                <Label className="text-xs">Description (Optional)</Label>
                <Input
                  placeholder="Brief description"
                  value={component.description || ''}
                  onChange={(e) => updateComponent(component.id, 'description', e.target.value)}
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>

              <div className="col-span-4">
                <Label className="text-xs">
                  {isSiMDSoftwareComponent(component) ? getSoftwareClassLabel() : 'Risk Class'}
                </Label>
                <Select
                  value={component.riskClass}
                  onValueChange={(value) => updateComponent(component.id, 'riskClass', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Use pre-computed risk class options with fallback */}
                    {finalRiskClassOptions.map(riskClass => (
                      <SelectItem key={riskClass.value} value={riskClass.value}>
                        {riskClass.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-1 flex gap-1">
                {/* Three-dot menu for classification assistants - show for all markets when procedure pack is used */}
                <DropdownMenu
                  open={openDropdownId === component.id}
                  onOpenChange={(open) => setOpenDropdownId(open ? component.id : null)}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                      className="px-3 py-5 bg-background"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {/* Hardware/MDR Assistant - show for all markets with hardware assistants */}
                    {['EU', 'UK', 'US', 'USA', 'CA', 'BR', 'AU', 'CN', 'IN', 'JP', 'KR', 'CH'].includes(marketCode) && (component.componentType === 'device' || deviceType === 'procedure-pack' || deviceType === 'simd' || keyTechnologyCharacteristics?.isSoftwareMobileApp) && (
                      <DropdownMenuItem onClick={() => {
                        openAssistantForComponent(component.id, 'device');
                        setOpenDropdownId(null);
                      }}>
                        {marketCode === 'EU' ? 'EU MDR Assistant (Hardware)' :
                         marketCode === 'UK' ? 'UK MHRA Assistant (Hardware)' :
                         marketCode === 'US' || marketCode === 'USA' ? 'FDA Assistant (Hardware)' :
                         marketCode === 'CA' ? 'Health Canada Assistant (Hardware)' :
                         marketCode === 'BR' ? 'Brazil Assistant (Hardware)' :
                         marketCode === 'AU' ? 'Australia Assistant (Hardware)' :
                         marketCode === 'CN' ? 'China Assistant (Hardware)' :
                         marketCode === 'IN' ? 'India Assistant (Hardware)' :
                         marketCode === 'JP' ? 'Japan Assistant (Hardware)' :
                         marketCode === 'KR' ? 'South Korea Assistant (Hardware)' :
                         marketCode === 'CH' ? 'Switzerland Assistant (Hardware)' :
                         'MDR Assistant (Hardware)'}
                      </DropdownMenuItem>
                    )}
                    {/* Software Assistant - for all markets when SiMD is selected */}
                    {['EU', 'UK', 'US', 'USA', 'CA', 'BR', 'AU', 'CN', 'IN', 'JP', 'KR', 'CH'].includes(marketCode) && (component.componentType === 'software' || deviceType === 'simd' || keyTechnologyCharacteristics?.isSoftwareMobileApp) && (
                      <DropdownMenuItem onClick={() => {
                        openAssistantForComponent(component.id, 'software');
                        setOpenDropdownId(null);
                      }}>
                        {marketCode === 'EU' ? 'Software Assistant (Rule 11)' :
                         marketCode === 'UK' ? 'Software Assistant (UK)' :
                         marketCode === 'US' || marketCode === 'USA' ? 'Software Assistant (FDA)' :
                         marketCode === 'CA' ? 'Software Assistant (Health Canada)' :
                         marketCode === 'BR' ? 'Software Assistant (ANVISA)' :
                         marketCode === 'AU' ? 'Software Assistant (TGA)' :
                         marketCode === 'CN' ? 'Software Assistant (NMPA)' :
                         marketCode === 'IN' ? 'Software Assistant (CDSCO)' :
                         marketCode === 'JP' ? 'Software Assistant (PMDA)' :
                         marketCode === 'KR' ? 'Software Assistant (MFDS)' :
                         marketCode === 'CH' ? 'Software Assistant (Swissmedic)' :
                         'Software Assistant'}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Delete button - outside dropdown */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeComponent(component.id)}
                  disabled={
                    isLoading ||
                    (deviceType === 'simd' && (component.id === 'hardware-1' || component.id === 'software-1'))
                  }
                  className="px-3 py-5 bg-background"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Component Button */}
      {(
        <>
          <Button
            variant="outline"
            onClick={addNewComponent}
            disabled={isLoading}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Component
          </Button>

          {/* Footer text - hidden in compact mode */}
          {!compactMode && (
            <div className="text-xs text-muted-foreground">
              Select components from your Product Definition or add custom components. The overall classification is automatically determined by the highest risk class among all selected components.
            </div>
          )}
        </>
      )}

      {/* SiMD footer text - hidden in compact mode */}
      {!compactMode && deviceType === 'simd' && (
        <div className="text-xs text-muted-foreground">
          For SiMD, classify the hardware under the market's device rules and set the software safety class per IEC 62304 (A/B/C).
        </div>
      )}

      {/* Classification Assistants */}
      <ClassificationAssistant
        isOpen={isMDRAssistantOpen}
        onClose={() => {
          setIsMDRAssistantOpen(false);
          setActiveComponentId(null);
        }}
        onClassificationComplete={handleClassificationComplete}
      />

      <EUSaMDClassificationAssistant
        isOpen={isSaMDAssistantOpen}
        onClose={() => {
          setIsSaMDAssistantOpen(false);
          setActiveComponentId(null);
        }}
        onClassificationComplete={(result) => handleClassificationComplete(result.class, result)}
        onUseClassification={(result) => handleClassificationComplete(result.class, result)}
      />

      {/* UK MHRA Classification Dialog */}
      <UKClassificationTrigger
        isOpen={isUKAssistantOpen}
        onOpenChange={setIsUKAssistantOpen}
        onClassificationSelected={handleUKClassificationComplete}
        showButton={false}
      />

      {/* FDA Classification Dialog */}
      <FDAClassificationTrigger
        isOpen={isFDAAssistantOpen}
        onOpenChange={setIsFDAAssistantOpen}
        onClassificationSelected={handleFDAClassificationComplete}
        showButton={false}
      />

      {/* UK SaMD Classification Assistant */}
      <UKSaMDClassificationAssistant
        isOpen={isUKSaMDAssistantOpen}
        onClose={() => {
          setIsUKSaMDAssistantOpen(false);
          setActiveComponentId(null);
        }}
        onClassificationComplete={handleUKSaMDClassificationComplete}
      />

      {/* FDA SaMD Classification Assistant */}
      <FDASaMDClassificationAssistant
        isOpen={isFDASaMDAssistantOpen}
        onClose={() => {
          setIsFDASaMDAssistantOpen(false);
          setActiveComponentId(null);
        }}
        onClassificationComplete={handleFDASaMDClassificationComplete}
      />

      {/* Canada Health Canada Classification Dialog */}
      <CanadaClassificationTrigger
        isOpen={isCanadaAssistantOpen}
        onOpenChange={setIsCanadaAssistantOpen}
        onClassificationSelected={(riskClass, result) =>
          handleGenericMarketClassificationComplete(riskClass, result, () => setIsCanadaAssistantOpen(false))
        }
        showButton={false}
      />

      {/* Brazil ANVISA Classification Dialog */}
      <BrazilClassificationTrigger
        isOpen={isBrazilAssistantOpen}
        onOpenChange={setIsBrazilAssistantOpen}
        onClassificationSelected={(riskClass, result) =>
          handleGenericMarketClassificationComplete(riskClass, result, () => setIsBrazilAssistantOpen(false))
        }
        showButton={false}
      />

      {/* Australia TGA Classification Dialog */}
      <AustraliaClassificationTrigger
        isOpen={isAustraliaAssistantOpen}
        onOpenChange={setIsAustraliaAssistantOpen}
        onClassificationSelected={(riskClass, result) =>
          handleGenericMarketClassificationComplete(riskClass, result, () => setIsAustraliaAssistantOpen(false))
        }
        showButton={false}
      />

      {/* China NMPA Classification Dialog */}
      <ChinaClassificationTrigger
        isOpen={isChinaAssistantOpen}
        onOpenChange={setIsChinaAssistantOpen}
        onClassificationSelected={(riskClass, result) =>
          handleGenericMarketClassificationComplete(riskClass, result, () => setIsChinaAssistantOpen(false))
        }
        showButton={false}
      />

      {/* India CDSCO Classification Dialog */}
      <IndiaClassificationTrigger
        isOpen={isIndiaAssistantOpen}
        onOpenChange={setIsIndiaAssistantOpen}
        onClassificationSelected={(riskClass, result) =>
          handleGenericMarketClassificationComplete(riskClass, result, () => setIsIndiaAssistantOpen(false))
        }
        showButton={false}
      />

      {/* Japan PMDA Classification Dialog */}
      <JapanClassificationTrigger
        isOpen={isJapanAssistantOpen}
        onOpenChange={setIsJapanAssistantOpen}
        onClassificationSelected={(riskClass, result) =>
          handleGenericMarketClassificationComplete(riskClass, result, () => setIsJapanAssistantOpen(false))
        }
        showButton={false}
      />

      {/* South Korea MFDS Classification Dialog */}
      <SouthKoreaClassificationTrigger
        isOpen={isSouthKoreaAssistantOpen}
        onOpenChange={setIsSouthKoreaAssistantOpen}
        onClassificationSelected={(riskClass, result) =>
          handleGenericMarketClassificationComplete(riskClass, result, () => setIsSouthKoreaAssistantOpen(false))
        }
        showButton={false}
      />

      {/* Switzerland Swissmedic Classification Dialog */}
      <SwitzerlandClassificationTrigger
        isOpen={isSwitzerlandAssistantOpen}
        onOpenChange={setIsSwitzerlandAssistantOpen}
        onClassificationSelected={(riskClass, result) =>
          handleGenericMarketClassificationComplete(riskClass, result, () => setIsSwitzerlandAssistantOpen(false))
        }
        showButton={false}
      />

      {/* Canada SaMD Classification Assistant */}
      <CanadaSaMDClassificationAssistant
        isOpen={isCanadaSaMDAssistantOpen}
        onClose={() => {
          setIsCanadaSaMDAssistantOpen(false);
          setActiveComponentId(null);
        }}
        onClassificationComplete={(deviceClass, result) => {
          handleGenericMarketClassificationComplete(
            deviceClass.replace('Class ', ''),
            result,
            () => setIsCanadaSaMDAssistantOpen(false)
          );
        }}
      />

      {/* Brazil SaMD Classification Assistant */}
      <BrazilSaMDClassificationAssistant
        isOpen={isBrazilSaMDAssistantOpen}
        onClose={() => {
          setIsBrazilSaMDAssistantOpen(false);
          setActiveComponentId(null);
        }}
        onClassificationComplete={(deviceClass, result) => {
          handleGenericMarketClassificationComplete(
            deviceClass.replace('Class ', ''),
            result,
            () => setIsBrazilSaMDAssistantOpen(false)
          );
        }}
      />

      {/* Australia SaMD Classification Assistant */}
      <AustraliaSaMDClassificationAssistant
        isOpen={isAustraliaSaMDAssistantOpen}
        onClose={() => {
          setIsAustraliaSaMDAssistantOpen(false);
          setActiveComponentId(null);
        }}
        onClassificationComplete={(deviceClass, result) => {
          handleGenericMarketClassificationComplete(
            deviceClass.replace('Class ', ''),
            result,
            () => setIsAustraliaSaMDAssistantOpen(false)
          );
        }}
      />

      {/* China SaMD Classification Assistant */}
      <ChinaSaMDClassificationAssistant
        isOpen={isChinaSaMDAssistantOpen}
        onClose={() => {
          setIsChinaSaMDAssistantOpen(false);
          setActiveComponentId(null);
        }}
        onClassificationComplete={(deviceClass, result) => {
          handleGenericMarketClassificationComplete(
            deviceClass.replace('Class ', ''),
            result,
            () => setIsChinaSaMDAssistantOpen(false)
          );
        }}
      />

      {/* India SaMD Classification Assistant */}
      <IndiaSaMDClassificationAssistant
        isOpen={isIndiaSaMDAssistantOpen}
        onClose={() => {
          setIsIndiaSaMDAssistantOpen(false);
          setActiveComponentId(null);
        }}
        onClassificationComplete={(deviceClass, result) => {
          handleGenericMarketClassificationComplete(
            deviceClass.replace('Class ', ''),
            result,
            () => setIsIndiaSaMDAssistantOpen(false)
          );
        }}
      />

      {/* Japan SaMD Classification Assistant */}
      <JapanSaMDClassificationAssistant
        isOpen={isJapanSaMDAssistantOpen}
        onClose={() => {
          setIsJapanSaMDAssistantOpen(false);
          setActiveComponentId(null);
        }}
        onClassificationComplete={(deviceClass, result) => {
          handleGenericMarketClassificationComplete(
            deviceClass.replace('Class ', ''),
            result,
            () => setIsJapanSaMDAssistantOpen(false)
          );
        }}
      />

      {/* South Korea SaMD Classification Assistant */}
      <SouthKoreaSaMDClassificationAssistant
        isOpen={isSouthKoreaSaMDAssistantOpen}
        onClose={() => {
          setIsSouthKoreaSaMDAssistantOpen(false);
          setActiveComponentId(null);
        }}
        onClassificationComplete={(deviceClass, result) => {
          // South Korea SaMD rules use Arabic numerals (Class 1-4), convert to Roman (I-IV)
          let riskClass = deviceClass.replace('Class ', '');
          const arabicToRoman: Record<string, string> = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV' };
          riskClass = arabicToRoman[riskClass] || riskClass;
          handleGenericMarketClassificationComplete(
            riskClass,
            result,
            () => setIsSouthKoreaSaMDAssistantOpen(false)
          );
        }}
      />

      {/* Switzerland SaMD Classification Assistant */}
      <SwitzerlandSaMDClassificationAssistant
        isOpen={isSwitzerlandSaMDAssistantOpen}
        onClose={() => {
          setIsSwitzerlandSaMDAssistantOpen(false);
          setActiveComponentId(null);
        }}
        onClassificationComplete={(deviceClass, result) => {
          handleGenericMarketClassificationComplete(
            deviceClass.replace('Class ', ''),
            result,
            () => setIsSwitzerlandSaMDAssistantOpen(false)
          );
        }}
      />
    </div>
  );
}