import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Stepper } from '@/components/ui/stepper';
import { ChevronRight, ChevronLeft, Search, Beaker, HelpCircle, Check, AlertTriangle, X, Info, ChevronDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ClassificationAssistant } from '@/components/classification/ClassificationAssistant';
import { IVDRClassificationAssistant } from '@/components/classification/IVDRClassificationAssistant';
import { FDAClassificationAssistant } from '@/components/classification/FDAClassificationAssistant';
import { CanadaClassificationTrigger } from '@/components/classification/CanadaClassificationTrigger';
import { AustraliaClassificationTrigger } from '@/components/classification/AustraliaClassificationTrigger';
import { UKClassificationTrigger } from '@/components/classification/UKClassificationTrigger';
import { JapanClassificationTrigger } from '@/components/classification/JapanClassificationTrigger';
import { BrazilClassificationTrigger } from '@/components/classification/BrazilClassificationTrigger';
import { SouthKoreaClassificationTrigger } from '@/components/classification/SouthKoreaClassificationTrigger';
import { ChinaClassificationTrigger } from '@/components/classification/ChinaClassificationTrigger';
import { DeviceClass, ClassificationResult } from '@/types/classification';

export interface ViabilityAnswers {
  regulatoryFramework: string;
  deviceClass: string;
  hasPredicate: string;
  clinicalStrategy: string[];
  patientCount: number;
  reimbursementCode: string;
  technologyType: string;
}

// Interface for tracking which fields were derived from Genesis
export interface DerivedFieldsInfo {
  regulatoryFramework?: string;
  deviceClass?: string;
  clinicalStrategy?: string;
  patientCount?: string;
  reimbursementCode?: string;
  technologyType?: string;
}

interface ViabilityWizardProps {
  onComplete: (answers: ViabilityAnswers, score: number) => void;
  initialAnswers?: ViabilityAnswers;
  derivedFieldsInfo?: DerivedFieldsInfo;
  isSaving?: boolean;
  disabled?: boolean;
}

export function ViabilityWizard({ onComplete, initialAnswers, derivedFieldsInfo, isSaving, disabled = false }: ViabilityWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<ViabilityAnswers>(
    initialAnswers || {
      regulatoryFramework: '',
      deviceClass: '',
      hasPredicate: '',
      clinicalStrategy: [],
      patientCount: 50,
      reimbursementCode: '',
      technologyType: '',
    }
  );

  // Classification assistant state
  const [isMDRAssistantOpen, setIsMDRAssistantOpen] = useState(false);
  const [isIVDRAssistantOpen, setIsIVDRAssistantOpen] = useState(false);
  const [isFDAAssistantOpen, setIsFDAAssistantOpen] = useState(false);

  // Helper component to show derived field indicator
  const DerivedBadge = ({ field }: { field: keyof DerivedFieldsInfo }) => {
    const source = derivedFieldsInfo?.[field];
    if (!source) return null;
    return (
      <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">
        <Info className="h-3 w-3" />
        From {source}
      </span>
    );
  };

  const steps = [
    'Regulatory Strategy',
    'Clinical Burden',
    'Reimbursement',
    'Technical Complexity'
  ];

  const updateAnswer = (field: keyof ViabilityAnswers, value: string | number | string[]) => {
    if (disabled) return;
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  // Auto-prefill clinical strategy based on device class when entering Step 2
  useEffect(() => {
    // Only prefill when:
    // 1. We're on Step 2 (Clinical Burden)
    // 2. Device class is selected
    // 3. Clinical strategy is empty (first time entering)
    if (currentStep === 2 && answers.deviceClass && answers.clinicalStrategy.length === 0) {
      const deviceClass = answers.deviceClass.toLowerCase();
      let recommendedStrategies: string[] = [];

      // Low risk: Class I/A/510k-exempt
      if ((deviceClass.includes('class-i') && !deviceClass.includes('ii') && !deviceClass.includes('iii')) || 
          deviceClass.includes('class-a') || 
          deviceClass.includes('510k-exempt')) {
        recommendedStrategies = ['literature'];
      } 
      // Medium risk: Class IIa/II/B
      else if (deviceClass.includes('class-iia') || deviceClass.includes('class-b') || deviceClass.includes('510k') ||
               deviceClass.includes('ca-class-ii') || deviceClass.includes('jp-class-ii') || 
               deviceClass.includes('kr-class-ii') || deviceClass.includes('br-class-ii') || 
               deviceClass.includes('cn-class-ii')) {
        recommendedStrategies = ['literature', 'post-market'];
      } 
      // High risk: Class IIb/III/C
      else if (deviceClass.includes('class-iib') || deviceClass.includes('class-c') ||
               deviceClass.includes('ca-class-iii') || deviceClass.includes('jp-class-iii') || 
               deviceClass.includes('kr-class-iii') || deviceClass.includes('cn-class-iii') || 
               deviceClass.includes('br-class-iii')) {
        recommendedStrategies = ['post-market', 'pre-market'];
      } 
      // Very high risk: Class III/IV/D/PMA
      else if (deviceClass.includes('eu-class-iii') || deviceClass.includes('uk-class-iii') || 
               deviceClass.includes('au-class-iii') || deviceClass.includes('class-d') || 
               deviceClass.includes('pma') ||
               deviceClass.includes('ca-class-iv') || deviceClass.includes('jp-class-iv') || 
               deviceClass.includes('kr-class-iv') || deviceClass.includes('br-class-iv')) {
        recommendedStrategies = ['pre-market', 'post-market'];
      }

      if (recommendedStrategies.length > 0) {
        updateAnswer('clinicalStrategy', recommendedStrategies);
      }
    }
  }, [currentStep, answers.deviceClass, answers.clinicalStrategy.length]);

  // Helper function to toggle clinical strategy selection
  const toggleClinicalStrategy = (strategy: string) => {
    if (disabled) return;
    setAnswers(prev => {
      const current = prev.clinicalStrategy;
      const isSelected = current.includes(strategy);
      
      return {
        ...prev,
        clinicalStrategy: isSelected
          ? current.filter(s => s !== strategy)
          : [...current, strategy]
      };
    });
  };

  // Helper: Get clinical strategy guidance based on device class
  const getClinicalStrategyGuidance = (deviceClass: string, strategy: string): { status: 'recommended' | 'acceptable' | 'insufficient'; icon: React.ReactNode; message: string } => {
    const classLower = deviceClass.toLowerCase();
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'very-high' = 'low';
    
    // Low risk: Class I variants
    if (classLower.includes('class-i') && !classLower.includes('ii') && !classLower.includes('iii') || 
        classLower.includes('class-a') || 
        classLower.includes('510k-exempt')) {
      riskLevel = 'low';
    } 
    // Medium risk: Class IIa, Class II (CA/JP/KR/BR), Class B (IVDR)
    else if (classLower.includes('class-iia') || classLower.includes('class-b') || classLower.includes('510k') ||
             (classLower.includes('ca-class-ii') || classLower.includes('jp-class-ii') || 
              classLower.includes('kr-class-ii') || classLower.includes('br-class-ii'))) {
      riskLevel = 'medium';
    } 
    // High risk: Class IIb, Class III (CA/JP/KR/CN/BR), Class C (IVDR)
    else if (classLower.includes('class-iib') || classLower.includes('class-c') ||
             (classLower.includes('ca-class-iii') || classLower.includes('jp-class-iii') || 
              classLower.includes('kr-class-iii') || classLower.includes('cn-class-iii') || 
              classLower.includes('br-class-iii'))) {
      riskLevel = 'high';
    } 
    // Very high risk: Class III/D (EU), PMA, Class IV (CA/JP/KR/BR)
    else if (classLower.includes('eu-class-iii') || classLower.includes('uk-class-iii') || 
             classLower.includes('au-class-iii') || classLower.includes('class-d') || 
             classLower.includes('pma') ||
             (classLower.includes('ca-class-iv') || classLower.includes('jp-class-iv') || 
              classLower.includes('kr-class-iv') || classLower.includes('br-class-iv'))) {
      riskLevel = 'very-high';
    }

    // Guidance matrix
    const guidance: Record<string, Record<string, { status: 'recommended' | 'acceptable' | 'insufficient'; message: string }>> = {
      'literature': {
        'low': { status: 'recommended', message: 'Literature review is typically sufficient for Class I devices' },
        'medium': { status: 'acceptable', message: 'May be acceptable if strong equivalence can be demonstrated' },
        'high': { status: 'insufficient', message: 'Insufficient alone - must combine with clinical trial' },
        'very-high': { status: 'insufficient', message: 'Insufficient alone - must supplement with pre-market data' },
      },
      'post-market': {
        'low': { status: 'acceptable', message: 'Optional for Class I, but can strengthen evidence' },
        'medium': { status: 'recommended', message: 'Recommended - PMCF required under EU MDR' },
        'high': { status: 'recommended', message: 'Required under EU MDR for Class IIb' },
        'very-high': { status: 'recommended', message: 'Required - ongoing surveillance mandatory for Class III' },
      },
      'pre-market': {
        'low': { status: 'insufficient', message: 'Excessive burden for Class I devices' },
        'medium': { status: 'acceptable', message: 'May be needed for novel Class IIa devices' },
        'high': { status: 'recommended', message: 'Often required for Class IIb devices' },
        'very-high': { status: 'recommended', message: 'Required for Class III/PMA devices' },
      },
    };

    const result = guidance[strategy]?.[riskLevel] || { status: 'acceptable', message: '' };
    
    const icons = {
      'recommended': <Check className="h-4 w-4 text-green-600" />,
      'acceptable': <AlertTriangle className="h-4 w-4 text-yellow-600" />,
      'insufficient': <X className="h-4 w-4 text-red-600" />,
    };

    return { ...result, icon: icons[result.status] };
  };

  // Helper: Get patient count guidance
  const getPatientGuidance = (deviceClass: string, clinicalStrategy: string): { min: number; max: number; typical: number; description: string } => {
    const classLower = deviceClass.toLowerCase();
    
    // Default ranges
    const defaults = {
      'literature': { min: 0, max: 0, typical: 0, description: 'Literature review does not require new patient enrollment' },
      'post-market': { min: 30, max: 150, typical: 50, description: 'PMCF studies typically require 30-150 patients depending on endpoints' },
      'pre-market': { min: 50, max: 300, typical: 100, description: 'Pre-market trials typically require 50-300 patients for statistical significance' },
    };

    // Very high risk: Class III/D (EU/AU/UK), PMA, Class IV (CA/JP/KR/BR)
    const isVeryHighRisk = classLower.includes('eu-class-iii') || classLower.includes('uk-class-iii') || 
                          classLower.includes('au-class-iii') || classLower.includes('class-d') || 
                          classLower.includes('pma') ||
                          classLower.includes('ca-class-iv') || classLower.includes('jp-class-iv') || 
                          classLower.includes('kr-class-iv') || classLower.includes('br-class-iv');
    
    // High risk: Class IIb, Class III (CA/JP/KR/CN/BR), Class C (IVDR)
    const isHighRisk = classLower.includes('class-iib') || classLower.includes('class-c') ||
                      classLower.includes('ca-class-iii') || classLower.includes('jp-class-iii') || 
                      classLower.includes('kr-class-iii') || classLower.includes('cn-class-iii') || 
                      classLower.includes('br-class-iii');
    
    // Medium risk: Class IIa, Class II (CA/JP/KR/BR), Class B (IVDR)
    const isMediumRisk = classLower.includes('class-iia') || classLower.includes('class-b') ||
                        classLower.includes('ca-class-ii') || classLower.includes('jp-class-ii') || 
                        classLower.includes('kr-class-ii') || classLower.includes('br-class-ii') ||
                        classLower.includes('cn-class-ii');

    if (isVeryHighRisk) {
      if (clinicalStrategy === 'pre-market') {
        return { min: 100, max: 500, typical: 200, description: 'Class III/IV/PMA devices typically require 100-500 patients with robust statistical powering' };
      }
      if (clinicalStrategy === 'post-market') {
        return { min: 50, max: 200, typical: 100, description: 'Class III/IV PMCF typically requires 50-200 patients for ongoing safety monitoring' };
      }
    } else if (isHighRisk) {
      if (clinicalStrategy === 'pre-market') {
        return { min: 50, max: 200, typical: 80, description: 'Class IIb/III devices typically require 50-200 patients depending on novelty and endpoints' };
      }
      if (clinicalStrategy === 'post-market') {
        return { min: 30, max: 150, typical: 60, description: 'Class IIb/III PMCF typically requires 30-150 patients for regulatory compliance' };
      }
    } else if (isMediumRisk) {
      if (clinicalStrategy === 'post-market') {
        return { min: 20, max: 100, typical: 40, description: 'Class IIa/II PMCF typically requires 20-100 patients for ongoing evidence collection' };
      }
      if (clinicalStrategy === 'pre-market') {
        return { min: 30, max: 100, typical: 50, description: 'Class IIa/II may require 30-100 patients if novel or lacking equivalence' };
      }
    }

    return defaults[clinicalStrategy as keyof typeof defaults] || defaults['literature'];
  };

  // Helper: Get device class info card content
  const getDeviceClassGuidance = (deviceClass: string): { title: string; bullets: string[] } | null => {
    if (!deviceClass) return null;
    
    const classLower = deviceClass.toLowerCase();
    
    // Low risk
    if ((classLower.includes('class-i') && !classLower.includes('ii') && !classLower.includes('iii')) || 
        classLower.includes('class-a') || 
        classLower.includes('510k-exempt')) {
      return {
        title: 'Based on your Class I/A selection:',
        bullets: [
          'Literature review is typically sufficient',
          'Pre-market clinical trials are rarely required',
          'Focus on technical documentation and risk analysis',
        ],
      };
    } 
    // Medium risk
    else if (classLower.includes('class-iia') || classLower.includes('class-b') || classLower.includes('510k') ||
             classLower.includes('ca-class-ii') || classLower.includes('jp-class-ii') || 
             classLower.includes('kr-class-ii') || classLower.includes('br-class-ii') || 
             classLower.includes('cn-class-ii')) {
      return {
        title: 'Based on your Class IIa/II/B selection:',
        bullets: [
          'Literature or equivalence data often acceptable',
          'PMCF may be required depending on market',
          'Plan for 20-100 patients if conducting studies',
        ],
      };
    } 
    // High risk
    else if (classLower.includes('class-iib') || classLower.includes('class-c') ||
             classLower.includes('ca-class-iii') || classLower.includes('jp-class-iii') || 
             classLower.includes('kr-class-iii') || classLower.includes('cn-class-iii') || 
             classLower.includes('br-class-iii')) {
      return {
        title: 'Based on your Class IIb/III/C selection:',
        bullets: [
          'Pre-market clinical investigation often required',
          'Literature alone typically insufficient',
          'Plan for 50-200 patients depending on endpoints',
        ],
      };
    } 
    // Very high risk
    else if (classLower.includes('eu-class-iii') || classLower.includes('uk-class-iii') || 
             classLower.includes('au-class-iii') || classLower.includes('class-d') || 
             classLower.includes('pma') ||
             classLower.includes('ca-class-iv') || classLower.includes('jp-class-iv') || 
             classLower.includes('kr-class-iv') || classLower.includes('br-class-iv')) {
      return {
        title: 'Based on your Class III/IV/D/PMA selection:',
        bullets: [
          'Pre-market clinical investigation is required',
          'Rigorous clinical evidence mandatory',
          'Plan for 100-500+ patients with statistical powering',
        ],
      };
    }
    
    return null;
  };

  const handleClassificationComplete = (deviceClass: DeviceClass | 'Class I' | 'Class II' | 'Class III' | 'Class IV', result?: ClassificationResult | any) => {
    // Map classification result to our format
    let mappedClass = '';
    const classStr = String(deviceClass).toLowerCase();
    
    if (answers.regulatoryFramework === 'eu-mdr') {
      if (classStr.includes('iia')) mappedClass = 'eu-class-iia';
      else if (classStr.includes('iib')) mappedClass = 'eu-class-iib';
      else if (classStr.includes('iii')) mappedClass = 'eu-class-iii';
      else if (classStr.includes('i')) mappedClass = 'eu-class-i';
    } else if (answers.regulatoryFramework === 'eu-ivdr') {
      if (classStr.includes('d')) mappedClass = 'ivdr-class-d';
      else if (classStr.includes('c')) mappedClass = 'ivdr-class-c';
      else if (classStr.includes('b')) mappedClass = 'ivdr-class-b';
      else if (classStr.includes('a')) mappedClass = 'ivdr-class-a';
    } else if (answers.regulatoryFramework === 'us-fda') {
      if (classStr.includes('iii')) mappedClass = 'fda-class-iii-pma';
      else if (classStr.includes('ii')) mappedClass = 'fda-class-ii-510k';
      else if (classStr.includes('i')) mappedClass = 'fda-class-i-510k-exempt';
    }
    
    if (mappedClass) {
      updateAnswer('deviceClass', mappedClass);
    }
    
    // Close assistants
    setIsMDRAssistantOpen(false);
    setIsIVDRAssistantOpen(false);
    setIsFDAAssistantOpen(false);
  };

  const calculateScore = (): number => {
    let score = 0;

    // Regulatory Strategy (30%)
    // Map various class formats to risk levels
    const deviceClass = answers.deviceClass.toLowerCase();
    
    // Low risk (30 points): Class I variants
    if ((deviceClass.includes('class-i') && !deviceClass.includes('ii') && !deviceClass.includes('iii')) || 
        deviceClass.includes('class-a') || 
        deviceClass.includes('510k-exempt')) {
      score += 30;
    } 
    // Medium risk (20 points): Class IIa, Class II, Class B
    else if (deviceClass.includes('class-iia') || deviceClass.includes('class-b') || deviceClass.includes('510k') ||
             deviceClass.includes('ca-class-ii') || deviceClass.includes('jp-class-ii') || 
             deviceClass.includes('kr-class-ii') || deviceClass.includes('br-class-ii') || 
             deviceClass.includes('cn-class-ii')) {
      score += 20;
    } 
    // High risk (15 points): Class IIb, Class III (CA/JP/KR/CN/BR), Class C
    else if (deviceClass.includes('class-iib') || deviceClass.includes('class-c') ||
             deviceClass.includes('ca-class-iii') || deviceClass.includes('jp-class-iii') || 
             deviceClass.includes('kr-class-iii') || deviceClass.includes('cn-class-iii') || 
             deviceClass.includes('br-class-iii')) {
      score += 15;
    } 
    // Very high risk (10 points): Class III (EU/UK/AU), Class D, PMA, Class IV
    else if (deviceClass.includes('eu-class-iii') || deviceClass.includes('uk-class-iii') || 
             deviceClass.includes('au-class-iii') || deviceClass.includes('class-d') || 
             deviceClass.includes('pma') ||
             deviceClass.includes('ca-class-iv') || deviceClass.includes('jp-class-iv') || 
             deviceClass.includes('kr-class-iv') || deviceClass.includes('br-class-iv')) {
      score += 10;
    }

    // Predicate device bonus (only applies to US FDA)
    if (answers.regulatoryFramework === 'us-fda' && answers.hasPredicate === 'yes') {
      score += 10;
    }

    // Clinical Burden (30%)
    // Score based on the BEST (least burdensome) strategy selected
    const strategies = answers.clinicalStrategy;
    if (strategies.includes('literature')) score += 30;
    else if (strategies.includes('post-market')) score += 20;
    else if (strategies.includes('pre-market')) score += 10;

    // Patient count penalty (inverse scale)
    const patientPenalty = Math.max(0, 10 - (answers.patientCount / 50));
    score -= patientPenalty;

    // Reimbursement (20%)
    if (answers.reimbursementCode === 'exact') score += 20;
    else if (answers.reimbursementCode === 'partial') score += 12;
    else if (answers.reimbursementCode === 'new') score += 5;

    // Technical Complexity (20%)
    if (answers.technologyType === 'standard-hw') score += 20;
    else if (answers.technologyType === 'samd') score += 15;
    else if (answers.technologyType === 'novel') score += 10;
    else if (answers.technologyType === 'combo') score += 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const canProceed = () => {
    if (currentStep === 1) {
      const hasFramework = answers.regulatoryFramework;
      const hasClass = answers.deviceClass;
      const hasPredicate = answers.regulatoryFramework === 'us-fda' ? answers.hasPredicate : true;
      return hasFramework && hasClass && hasPredicate;
    }
    if (currentStep === 2) return answers.clinicalStrategy.length > 0;
    if (currentStep === 3) return answers.reimbursementCode;
    if (currentStep === 4) return answers.technologyType;
    return false;
  };

  const handleNext = () => {
    if (disabled) return;
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      const score = calculateScore();
      onComplete(answers, score);
    }
  };

  const handleBack = () => {
    if (disabled) return;
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <Stepper steps={steps} currentStep={currentStep} className="mb-8" />

      <Card className="p-8">
        {/* Step 1: Regulatory Strategy */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-semibold mb-4">Regulatory Strategy (Weight: 30%)</h3>
              
              {/* Regulatory Framework Selection */}
              <div className="space-y-4 mb-6">
                <Label className="text-base">
                  Regulatory Framework
                  <DerivedBadge field="regulatoryFramework" />
                </Label>
                <RadioGroup value={answers.regulatoryFramework} onValueChange={(val) => {
                  updateAnswer('regulatoryFramework', val);
                  updateAnswer('deviceClass', ''); // Reset classification when framework changes
                  if (val !== 'us-fda') {
                    updateAnswer('hasPredicate', 'n/a'); // Auto-set N/A for non-US
                  }
                }} disabled={disabled}>
                  {/* Europe */}
                  <div className="mt-2 mb-1 text-xs font-semibold text-muted-foreground">🌍 Europe</div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="eu-mdr" id="eu-mdr" />
                    <Label htmlFor="eu-mdr" className="font-normal cursor-pointer">
                      🇪🇺 EU MDR <span className="text-muted-foreground text-sm">— Medical Device Regulation (2017/745)</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="eu-ivdr" id="eu-ivdr" />
                    <Label htmlFor="eu-ivdr" className="font-normal cursor-pointer">
                      🇪🇺 EU IVDR <span className="text-muted-foreground text-sm">— In Vitro Diagnostic Regulation (2017/746)</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="uk-mhra" id="uk-mhra" />
                    <Label htmlFor="uk-mhra" className="font-normal cursor-pointer">
                      🇬🇧 UK MHRA <span className="text-muted-foreground text-sm">— UK Medical Devices Regulations 2002</span>
                    </Label>
                  </div>

                  {/* Americas */}
                  <div className="mt-4 mb-1 text-xs font-semibold text-muted-foreground">🌎 Americas</div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="us-fda" id="us-fda" />
                    <Label htmlFor="us-fda" className="font-normal cursor-pointer">
                      🇺🇸 US FDA <span className="text-muted-foreground text-sm">— Food and Drug Administration</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ca-hc" id="ca-hc" />
                    <Label htmlFor="ca-hc" className="font-normal cursor-pointer">
                      🇨🇦 Canada (Health Canada) <span className="text-muted-foreground text-sm">— Medical Devices Regulations SOR/98-282</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="br-anvisa" id="br-anvisa" />
                    <Label htmlFor="br-anvisa" className="font-normal cursor-pointer">
                      🇧🇷 Brazil (ANVISA) <span className="text-muted-foreground text-sm">— RDC 185/2001</span>
                    </Label>
                  </div>

                  {/* Asia-Pacific */}
                  <div className="mt-4 mb-1 text-xs font-semibold text-muted-foreground">🌏 Asia-Pacific</div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="jp-pmda" id="jp-pmda" />
                    <Label htmlFor="jp-pmda" className="font-normal cursor-pointer">
                      🇯🇵 Japan (PMDA) <span className="text-muted-foreground text-sm">— Pharmaceutical Affairs Law / PMD Act</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cn-nmpa" id="cn-nmpa" />
                    <Label htmlFor="cn-nmpa" className="font-normal cursor-pointer">
                      🇨🇳 China (NMPA) <span className="text-muted-foreground text-sm">— Medical Device Regulations</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="kr-mfds" id="kr-mfds" />
                    <Label htmlFor="kr-mfds" className="font-normal cursor-pointer">
                      🇰🇷 South Korea (MFDS) <span className="text-muted-foreground text-sm">— Medical Devices Act</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="au-tga" id="au-tga" />
                    <Label htmlFor="au-tga" className="font-normal cursor-pointer">
                      🇦🇺 Australia (TGA) <span className="text-muted-foreground text-sm">— Therapeutic Goods Act 1989</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Device Classification - Dynamic based on framework */}
              {answers.regulatoryFramework && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">
                      Device Classification
                      <DerivedBadge field="deviceClass" />
                    </Label>
                    
                    {/* MDR Assistant */}
                    {answers.regulatoryFramework === 'eu-mdr' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsMDRAssistantOpen(true)}
                        disabled={disabled}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        MDR Classification Assistant
                      </Button>
                    )}
                    
                    {/* IVDR Assistant */}
                    {answers.regulatoryFramework === 'eu-ivdr' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsIVDRAssistantOpen(true)}
                        disabled={disabled}
                      >
                        <Beaker className="h-4 w-4 mr-2" />
                        IVDR Classification Assistant
                      </Button>
                    )}
                    
                    {/* FDA Assistant */}
                    {answers.regulatoryFramework === 'us-fda' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFDAAssistantOpen(true)}
                        disabled={disabled}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        FDA Classification Assistant
                      </Button>
                    )}
                    
                    {/* Canada Assistant */}
                    {answers.regulatoryFramework === 'ca-hc' && (
                      <CanadaClassificationTrigger
                        onClassificationSelected={(riskClass, result) => {
                          // Map Canada class to our format
                          let mappedClass = '';
                          if (riskClass === 'I') mappedClass = 'ca-class-i';
                          else if (riskClass === 'II') mappedClass = 'ca-class-ii';
                          else if (riskClass === 'III') mappedClass = 'ca-class-iii';
                          else if (riskClass === 'IV') mappedClass = 'ca-class-iv';
                          
                          if (mappedClass) {
                            updateAnswer('deviceClass', mappedClass);
                          }
                        }}
                      />
                    )}
                    
                    {/* Australia Assistant */}
                    {answers.regulatoryFramework === 'au-tga' && (
                      <AustraliaClassificationTrigger
                        onClassificationSelected={(riskClass, result) => {
                          // Map Australia class to our format
                          let mappedClass = '';
                          if (riskClass === 'I') mappedClass = 'au-class-i';
                          else if (riskClass === 'IIa') mappedClass = 'au-class-iia';
                          else if (riskClass === 'IIb') mappedClass = 'au-class-iib';
                          else if (riskClass === 'III') mappedClass = 'au-class-iii';
                          
                          if (mappedClass) {
                            updateAnswer('deviceClass', mappedClass);
                          }
                        }}
                      />
                    )}
                    
                    {/* UK Assistant */}
                    {answers.regulatoryFramework === 'uk-mhra' && (
                      <UKClassificationTrigger
                        onClassificationSelected={(riskClass, result) => {
                          // Map UK class to our format
                          let mappedClass = '';
                          if (riskClass === 'I') mappedClass = 'uk-class-i';
                          else if (riskClass === 'IIa') mappedClass = 'uk-class-iia';
                          else if (riskClass === 'IIb') mappedClass = 'uk-class-iib';
                          else if (riskClass === 'III') mappedClass = 'uk-class-iii';
                          
                          if (mappedClass) {
                            updateAnswer('deviceClass', mappedClass);
                          }
                        }}
                      />
                    )}
                    
                    {/* Japan Assistant */}
                    {answers.regulatoryFramework === 'jp-pmda' && (
                      <JapanClassificationTrigger
                        onClassificationSelected={(riskClass, result) => {
                          // Map Japan class to our format
                          let mappedClass = '';
                          if (riskClass === 'I') mappedClass = 'jp-class-i';
                          else if (riskClass === 'II') mappedClass = 'jp-class-ii';
                          else if (riskClass === 'III') mappedClass = 'jp-class-iii';
                          else if (riskClass === 'IV') mappedClass = 'jp-class-iv';
                          
                          if (mappedClass) {
                            updateAnswer('deviceClass', mappedClass);
                          }
                        }}
                      />
                    )}
                    
                    {/* Brazil Assistant */}
                    {answers.regulatoryFramework === 'br-anvisa' && (
                      <BrazilClassificationTrigger
                        onClassificationSelected={(riskClass, result) => {
                          // Map Brazil class to our format
                          let mappedClass = '';
                          if (riskClass === 'I') mappedClass = 'br-class-i';
                          else if (riskClass === 'II') mappedClass = 'br-class-ii';
                          else if (riskClass === 'III') mappedClass = 'br-class-iii';
                          else if (riskClass === 'IV') mappedClass = 'br-class-iv';
                          
                          if (mappedClass) {
                            updateAnswer('deviceClass', mappedClass);
                          }
                        }}
                      />
                    )}
                    
                    {/* South Korea Assistant */}
                    {answers.regulatoryFramework === 'kr-mfds' && (
                      <SouthKoreaClassificationTrigger
                        onClassificationSelected={(riskClass, result) => {
                          // Map South Korea class to our format
                          let mappedClass = '';
                          if (riskClass === 'I') mappedClass = 'kr-class-i';
                          else if (riskClass === 'II') mappedClass = 'kr-class-ii';
                          else if (riskClass === 'III') mappedClass = 'kr-class-iii';
                          else if (riskClass === 'IV') mappedClass = 'kr-class-iv';
                          
                          if (mappedClass) {
                            updateAnswer('deviceClass', mappedClass);
                          }
                        }}
                      />
                    )}
                    
                    {/* China Assistant */}
                    {answers.regulatoryFramework === 'cn-nmpa' && (
                      <ChinaClassificationTrigger
                        onClassificationSelected={(riskClass, result) => {
                          // Map China class to our format
                          let mappedClass = '';
                          if (riskClass === 'I') mappedClass = 'cn-class-i';
                          else if (riskClass === 'II') mappedClass = 'cn-class-ii';
                          else if (riskClass === 'III') mappedClass = 'cn-class-iii';
                          
                          if (mappedClass) {
                            updateAnswer('deviceClass', mappedClass);
                          }
                        }}
                      />
                    )}
                  </div>
                  <RadioGroup value={answers.deviceClass} onValueChange={(val) => updateAnswer('deviceClass', val)} disabled={disabled}>
                    {answers.regulatoryFramework === 'eu-mdr' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="eu-class-i" id="eu-class-i" />
                          <Label htmlFor="eu-class-i" className="font-normal cursor-pointer">Class I</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="eu-class-iia" id="eu-class-iia" />
                          <Label htmlFor="eu-class-iia" className="font-normal cursor-pointer">Class IIa</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="eu-class-iib" id="eu-class-iib" />
                          <Label htmlFor="eu-class-iib" className="font-normal cursor-pointer">Class IIb</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="eu-class-iii" id="eu-class-iii" />
                          <Label htmlFor="eu-class-iii" className="font-normal cursor-pointer">Class III</Label>
                        </div>
                      </>
                    )}
                    
                    {answers.regulatoryFramework === 'eu-ivdr' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ivdr-class-a" id="ivdr-class-a" />
                          <Label htmlFor="ivdr-class-a" className="font-normal cursor-pointer">Class A</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ivdr-class-b" id="ivdr-class-b" />
                          <Label htmlFor="ivdr-class-b" className="font-normal cursor-pointer">Class B</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ivdr-class-c" id="ivdr-class-c" />
                          <Label htmlFor="ivdr-class-c" className="font-normal cursor-pointer">Class C</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ivdr-class-d" id="ivdr-class-d" />
                          <Label htmlFor="ivdr-class-d" className="font-normal cursor-pointer">Class D</Label>
                        </div>
                      </>
                    )}
                    
                    {answers.regulatoryFramework === 'us-fda' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fda-class-i-510k-exempt" id="fda-class-i-510k-exempt" />
                          <Label htmlFor="fda-class-i-510k-exempt" className="font-normal cursor-pointer">Class I (510k exempt)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fda-class-ii-510k" id="fda-class-ii-510k" />
                          <Label htmlFor="fda-class-ii-510k" className="font-normal cursor-pointer">Class II (510k clearance)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fda-class-iii-pma" id="fda-class-iii-pma" />
                          <Label htmlFor="fda-class-iii-pma" className="font-normal cursor-pointer">Class III (PMA)</Label>
                        </div>
                      </>
                    )}

                    {answers.regulatoryFramework === 'ca-hc' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ca-class-i" id="ca-class-i" />
                          <Label htmlFor="ca-class-i" className="font-normal cursor-pointer">Class I (lowest risk)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ca-class-ii" id="ca-class-ii" />
                          <Label htmlFor="ca-class-ii" className="font-normal cursor-pointer">Class II (low risk)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ca-class-iii" id="ca-class-iii" />
                          <Label htmlFor="ca-class-iii" className="font-normal cursor-pointer">Class III (moderate risk)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ca-class-iv" id="ca-class-iv" />
                          <Label htmlFor="ca-class-iv" className="font-normal cursor-pointer">Class IV (high risk)</Label>
                        </div>
                      </>
                    )}

                    {answers.regulatoryFramework === 'uk-mhra' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="uk-class-i" id="uk-class-i" />
                          <Label htmlFor="uk-class-i" className="font-normal cursor-pointer">Class I</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="uk-class-iia" id="uk-class-iia" />
                          <Label htmlFor="uk-class-iia" className="font-normal cursor-pointer">Class IIa</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="uk-class-iib" id="uk-class-iib" />
                          <Label htmlFor="uk-class-iib" className="font-normal cursor-pointer">Class IIb</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="uk-class-iii" id="uk-class-iii" />
                          <Label htmlFor="uk-class-iii" className="font-normal cursor-pointer">Class III</Label>
                        </div>
                      </>
                    )}

                    {answers.regulatoryFramework === 'au-tga' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="au-class-i" id="au-class-i" />
                          <Label htmlFor="au-class-i" className="font-normal cursor-pointer">Class I</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="au-class-iia" id="au-class-iia" />
                          <Label htmlFor="au-class-iia" className="font-normal cursor-pointer">Class IIa</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="au-class-iib" id="au-class-iib" />
                          <Label htmlFor="au-class-iib" className="font-normal cursor-pointer">Class IIb</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="au-class-iii" id="au-class-iii" />
                          <Label htmlFor="au-class-iii" className="font-normal cursor-pointer">Class III</Label>
                        </div>
                      </>
                    )}

                    {answers.regulatoryFramework === 'jp-pmda' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="jp-class-i" id="jp-class-i" />
                          <Label htmlFor="jp-class-i" className="font-normal cursor-pointer">Class I (general medical devices)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="jp-class-ii" id="jp-class-ii" />
                          <Label htmlFor="jp-class-ii" className="font-normal cursor-pointer">Class II (controlled medical devices)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="jp-class-iii" id="jp-class-iii" />
                          <Label htmlFor="jp-class-iii" className="font-normal cursor-pointer">Class III (highly controlled)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="jp-class-iv" id="jp-class-iv" />
                          <Label htmlFor="jp-class-iv" className="font-normal cursor-pointer">Class IV (specially controlled)</Label>
                        </div>
                      </>
                    )}

                    {answers.regulatoryFramework === 'cn-nmpa' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cn-class-i" id="cn-class-i" />
                          <Label htmlFor="cn-class-i" className="font-normal cursor-pointer">Class I (low risk)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cn-class-ii" id="cn-class-ii" />
                          <Label htmlFor="cn-class-ii" className="font-normal cursor-pointer">Class II (moderate risk)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cn-class-iii" id="cn-class-iii" />
                          <Label htmlFor="cn-class-iii" className="font-normal cursor-pointer">Class III (high risk)</Label>
                        </div>
                      </>
                    )}

                    {answers.regulatoryFramework === 'br-anvisa' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="br-class-i" id="br-class-i" />
                          <Label htmlFor="br-class-i" className="font-normal cursor-pointer">Class I (low risk)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="br-class-ii" id="br-class-ii" />
                          <Label htmlFor="br-class-ii" className="font-normal cursor-pointer">Class II (medium risk)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="br-class-iii" id="br-class-iii" />
                          <Label htmlFor="br-class-iii" className="font-normal cursor-pointer">Class III (high risk)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="br-class-iv" id="br-class-iv" />
                          <Label htmlFor="br-class-iv" className="font-normal cursor-pointer">Class IV (very high risk)</Label>
                        </div>
                      </>
                    )}

                    {answers.regulatoryFramework === 'kr-mfds' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="kr-class-i" id="kr-class-i" />
                          <Label htmlFor="kr-class-i" className="font-normal cursor-pointer">Class I (low risk)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="kr-class-ii" id="kr-class-ii" />
                          <Label htmlFor="kr-class-ii" className="font-normal cursor-pointer">Class II (moderate risk)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="kr-class-iii" id="kr-class-iii" />
                          <Label htmlFor="kr-class-iii" className="font-normal cursor-pointer">Class III (high risk)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="kr-class-iv" id="kr-class-iv" />
                          <Label htmlFor="kr-class-iv" className="font-normal cursor-pointer">Class IV (very high risk)</Label>
                        </div>
                      </>
                    )}
                  </RadioGroup>
                </div>
              )}

              {/* Predicate Device - Only for US FDA */}
              {answers.regulatoryFramework === 'us-fda' && (
                <div className="space-y-4 mt-6">
                  <Label className="text-base">Is there a clear predicate device? (US FDA 510(k) only)</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    The predicate device concept is specific to US FDA's 510(k) pathway. In EU MDR/IVDR, 
                    the equivalent concept is "clinical equivalence" which has different requirements.
                  </p>
                  <RadioGroup value={answers.hasPredicate} onValueChange={(val) => updateAnswer('hasPredicate', val)} disabled={disabled}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="predicate-yes" />
                      <Label htmlFor="predicate-yes" className="font-normal cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="predicate-no" />
                      <Label htmlFor="predicate-no" className="font-normal cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Clinical Burden */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-semibold mb-4">Clinical Burden (Weight: 30%)</h3>
              
              {/* Device Class Guidance Card */}
              {answers.deviceClass && getDeviceClassGuidance(answers.deviceClass) && (
                <div className="bg-secondary/50 border border-border rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <p className="font-medium text-sm">{getDeviceClassGuidance(answers.deviceClass)!.title}</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {getDeviceClassGuidance(answers.deviceClass)!.bullets.map((bullet, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base">
                    Clinical Strategy (Select all that apply)
                    <DerivedBadge field="clinicalStrategy" />
                  </Label>
                  <span className="text-xs text-muted-foreground italic">Multiple strategies can be combined</span>
                </div>
                <TooltipProvider>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4 py-2">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="literature"
                          checked={answers.clinicalStrategy.includes('literature')}
                          onCheckedChange={() => toggleClinicalStrategy('literature')}
                          disabled={disabled}
                        />
                        <div className="space-y-1">
                          <Label htmlFor="literature" className="font-normal cursor-pointer flex items-center gap-2">
                            Literature Route
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-sm">Using existing published clinical data to demonstrate safety/performance. Suitable for well-established technologies with extensive published evidence. Includes clinical literature reviews, meta-analyses, and clinical equivalence claims.</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                        </div>
                      </div>
                      {answers.deviceClass && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getClinicalStrategyGuidance(answers.deviceClass, 'literature').icon}
                          <span className="text-xs text-muted-foreground max-w-[200px]">{getClinicalStrategyGuidance(answers.deviceClass, 'literature').message}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-4 py-2">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="post-market"
                          checked={answers.clinicalStrategy.includes('post-market')}
                          onCheckedChange={() => toggleClinicalStrategy('post-market')}
                          disabled={disabled}
                        />
                        <div className="space-y-1">
                          <Label htmlFor="post-market" className="font-normal cursor-pointer flex items-center gap-2">
                            Post-Market Study (PMCF)
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-sm">Collecting clinical data after market approval through Post-Market Clinical Follow-up. Required under EU MDR for all Class IIa, IIb, III devices. Includes registries, surveys, and proactive data collection.</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                        </div>
                      </div>
                      {answers.deviceClass && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getClinicalStrategyGuidance(answers.deviceClass, 'post-market').icon}
                          <span className="text-xs text-muted-foreground max-w-[200px]">{getClinicalStrategyGuidance(answers.deviceClass, 'post-market').message}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-4 py-2">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="pre-market"
                          checked={answers.clinicalStrategy.includes('pre-market')}
                          onCheckedChange={() => toggleClinicalStrategy('pre-market')}
                          disabled={disabled}
                        />
                        <div className="space-y-1">
                          <Label htmlFor="pre-market" className="font-normal cursor-pointer flex items-center gap-2">
                            Pre-Market Clinical Trial
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-sm">Conducting a formal clinical investigation before market approval. Required for novel devices, higher-risk classes, and when insufficient equivalent data exists. Must follow ISO 14155 and local regulations.</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                        </div>
                      </div>
                      {answers.deviceClass && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getClinicalStrategyGuidance(answers.deviceClass, 'pre-market').icon}
                          <span className="text-xs text-muted-foreground max-w-[200px]">{getClinicalStrategyGuidance(answers.deviceClass, 'pre-market').message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </TooltipProvider>
              </div>

              {/* Learn More Section */}
              <Collapsible className="w-full mt-6">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between bg-secondary/30 hover:bg-secondary/50 p-4 rounded-lg"
                    disabled={disabled}
                  >
                    <span className="font-medium">Learn More: Clinical Strategy Comparison</span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-4 bg-secondary/20 p-6 rounded-lg">
                  {/* Literature Route */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      📚 Literature Route (Clinical Equivalence)
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Demonstrates safety and performance by referencing published clinical data from equivalent devices. 
                      No new patient data is collected. This approach relies on establishing clinical equivalence through 
                      technical and biological characteristics.
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs mt-2">
                      <div>
                        <span className="font-medium">Regulatory Basis:</span>
                        <p className="text-muted-foreground">EU MDR Article 61(4), FDA 510(k) predicate</p>
                      </div>
                      <div>
                        <span className="font-medium">Best For:</span>
                        <p className="text-muted-foreground">Class I, IIa, low-risk Class IIb with predicates</p>
                      </div>
                      <div>
                        <span className="font-medium">Cost:</span>
                        <p className="text-muted-foreground">$50K - $200K</p>
                      </div>
                      <div>
                        <span className="font-medium">Time:</span>
                        <p className="text-muted-foreground">Fastest (months)</p>
                      </div>
                    </div>
                  </div>

                  {/* Post-Market Study */}
                  <div className="space-y-2 border-t pt-4">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      📊 Post-Market Clinical Follow-up (PMCF)
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Ongoing collection of clinical data after market approval to confirm safety and performance in 
                      real-world conditions. Mandatory for EU MDR Class IIa/IIb/III devices. Can include registries, 
                      surveys, real-world evidence studies, and periodic safety update reports.
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs mt-2">
                      <div>
                        <span className="font-medium">Regulatory Basis:</span>
                        <p className="text-muted-foreground">EU MDR Article 61(11), PMCF Plan required</p>
                      </div>
                      <div>
                        <span className="font-medium">Best For:</span>
                        <p className="text-muted-foreground">Supplementing pre-market data, Class IIa/IIb</p>
                      </div>
                      <div>
                        <span className="font-medium">Cost:</span>
                        <p className="text-muted-foreground">$100K - $500K/year</p>
                      </div>
                      <div>
                        <span className="font-medium">Time:</span>
                        <p className="text-muted-foreground">Ongoing (years)</p>
                      </div>
                    </div>
                  </div>

                  {/* Pre-Market Clinical Trial */}
                  <div className="space-y-2 border-t pt-4">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      🔬 Pre-Market Clinical Trial
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Prospective, controlled clinical investigation conducted before market approval to generate 
                      original clinical data. Required for high-risk devices, novel technologies, or when equivalence 
                      cannot be established. Must follow GCP (Good Clinical Practice) and obtain ethics approval.
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs mt-2">
                      <div>
                        <span className="font-medium">Regulatory Basis:</span>
                        <p className="text-muted-foreground">ISO 14155, FDA IDE, EU MDR Article 62</p>
                      </div>
                      <div>
                        <span className="font-medium">Best For:</span>
                        <p className="text-muted-foreground">Class III, PMA, novel/high-risk devices</p>
                      </div>
                      <div>
                        <span className="font-medium">Cost:</span>
                        <p className="text-muted-foreground">$500K - $10M+</p>
                      </div>
                      <div>
                        <span className="font-medium">Time:</span>
                        <p className="text-muted-foreground">Slowest (1-5 years)</p>
                      </div>
                    </div>
                  </div>

                  {/* Comparison Table */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-3">Quick Comparison</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 pr-4">Criterion</th>
                            <th className="text-left py-2 px-2">Literature Route</th>
                            <th className="text-left py-2 px-2">PMCF Study</th>
                            <th className="text-left py-2 px-2">Pre-Market Trial</th>
                          </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                          <tr className="border-b">
                            <td className="py-2 pr-4 font-medium">Time to Market</td>
                            <td className="py-2 px-2">3-6 months</td>
                            <td className="py-2 px-2">Post-approval</td>
                            <td className="py-2 px-2">12-60 months</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 pr-4 font-medium">Cost Range</td>
                            <td className="py-2 px-2">$50K-200K</td>
                            <td className="py-2 px-2">$100K-500K/yr</td>
                            <td className="py-2 px-2">$500K-$10M+</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 pr-4 font-medium">Evidence Strength</td>
                            <td className="py-2 px-2">Moderate (indirect)</td>
                            <td className="py-2 px-2">Moderate-High (RWE)</td>
                            <td className="py-2 px-2">Highest (RCT)</td>
                          </tr>
                          <tr>
                            <td className="py-2 pr-4 font-medium">Typical Device Classes</td>
                            <td className="py-2 px-2">I, IIa, some IIb</td>
                            <td className="py-2 px-2">IIa, IIb, III (EU)</td>
                            <td className="py-2 px-2">III, PMA, Novel</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="space-y-4 mt-6">
                <Label className="text-base">
                  Estimated Patient Count: {answers.patientCount}+
                  <DerivedBadge field="patientCount" />
                </Label>
                <Slider
                  value={[answers.patientCount]}
                  onValueChange={(val) => updateAnswer('patientCount', val[0])}
                  min={0}
                  max={500}
                  step={10}
                  className="w-full"
                  disabled={disabled}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>500+</span>
                </div>
                
                {/* Patient Count Guidance */}
                {answers.deviceClass && answers.clinicalStrategy.length > 0 && (
                  <div className="bg-secondary/30 border border-border rounded-lg p-3 mt-3">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="space-y-2 flex-1">
                        <p className="text-xs font-medium">
                          Patient count guidance for {answers.deviceClass.replace(/-/g, ' ').toUpperCase()}:
                        </p>
                        {answers.clinicalStrategy.map((strategy) => {
                          const guidance = getPatientGuidance(answers.deviceClass, strategy);
                          return (
                            <div key={strategy} className="space-y-1">
                              <p className="text-xs font-medium text-foreground capitalize">{strategy.replace('-', ' ')}:</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground pl-3">
                                <span>Typical range:</span>
                                <span className="font-medium text-foreground">
                                  {guidance.min}-{guidance.max} patients
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed pl-3">
                                {guidance.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Reimbursement */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-semibold mb-4">Reimbursement (Weight: 20%)</h3>
              
              <div className="space-y-4">
                <Label className="text-base">
                  Existing CPT/DRG Codes?
                  <DerivedBadge field="reimbursementCode" />
                </Label>
                <RadioGroup value={answers.reimbursementCode} onValueChange={(val) => updateAnswer('reimbursementCode', val)} disabled={disabled}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="exact" id="exact" />
                    <Label htmlFor="exact" className="font-normal cursor-pointer">Yes - Exact Match</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partial" id="partial" />
                    <Label htmlFor="partial" className="font-normal cursor-pointer">Partial Match</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="new" />
                    <Label htmlFor="new" className="font-normal cursor-pointer">No - New Code Needed</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Technical Complexity */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-semibold mb-4">Technical Complexity (Weight: 20%)</h3>
              
              <div className="space-y-4">
                <Label className="text-base">
                  Technology Type
                  <DerivedBadge field="technologyType" />
                </Label>
                <RadioGroup value={answers.technologyType} onValueChange={(val) => updateAnswer('technologyType', val)} disabled={disabled}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="standard-hw" id="standard-hw" />
                    <Label htmlFor="standard-hw" className="font-normal cursor-pointer">Standard Hardware</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="samd" id="samd" />
                    <Label htmlFor="samd" className="font-normal cursor-pointer">Software Only (SaMD)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="novel" id="novel" />
                    <Label htmlFor="novel" className="font-normal cursor-pointer">Novel Material</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="combo" id="combo" />
                    <Label htmlFor="combo" className="font-normal cursor-pointer">Drug-Device Combo</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || disabled}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || disabled}
          >
            {currentStep === 4 ? 'Calculate Viability' : 'Next'}
            {currentStep < 4 && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </Card>

      {/* Classification Assistants */}
      <ClassificationAssistant
        isOpen={isMDRAssistantOpen}
        onClose={() => setIsMDRAssistantOpen(false)}
        onClassificationComplete={handleClassificationComplete}
      />
      
      <IVDRClassificationAssistant
        isOpen={isIVDRAssistantOpen}
        onClose={() => setIsIVDRAssistantOpen(false)}
        onClassificationComplete={handleClassificationComplete}
      />

      <FDAClassificationAssistant
        isOpen={isFDAAssistantOpen}
        onClose={() => setIsFDAAssistantOpen(false)}
        onComplete={handleClassificationComplete}
      />
    </div>
  );
}
