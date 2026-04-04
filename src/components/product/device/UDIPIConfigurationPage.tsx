import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  HelpCircle, 
  Package, 
  Hash, 
  Calendar, 
  Clock, 
  Cpu,
  Info,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  FileText,
  Barcode,
  Database,
  Printer,
  CircleDot,
  Clipboard,
  Sparkles,
  ArrowUp,
  MessageSquare,
  Save
} from "lucide-react";
import { 
  calculateUDIPIRequirements, 
  generateProfileSummary, 
  generateMarketSummary,
  getRelevantAssessmentQuestions,
  getRequirementChanges,
  DeviceProfile,
  UDIPIRequirements,
  RequirementStatus,
  AssessmentQuestion
} from "@/utils/udiPiRequirementsEngine";
import { UDIPIConfig } from "./UDIPIConfigurationDialog";

interface UDIPIConfigurationPageProps {
  companyId: string;
  productId: string;
  productData?: any;
  currentConfig?: UDIPIConfig | null;
  onSave: (config: UDIPIConfig, assessmentAnswers?: Record<string, boolean | undefined>) => void;
}

const DEFAULT_CONFIG: UDIPIConfig = {
  lot_batch: { enabled: true, prefix: '', format: 'alphanumeric' },
  serial_number: { enabled: false, prefix: '', format: 'alphanumeric' },
  manufacturing_date: { enabled: false, format: 'YYMMDD' },
  expiration_date: { enabled: false, format: 'YYMMDD' },
  software_version: { enabled: false, format: 'semver' },
};

const PI_TYPES = [
  {
    id: 'lot_batch',
    title: 'Lot/Batch Number',
    aiCode: '(10)',
    icon: Package,
    description: 'Identifies a specific production batch for traceability',
    example: '(10)ABC123',
    hasPrefix: true,
  },
  {
    id: 'serial_number',
    title: 'Serial Number',
    aiCode: '(21)',
    icon: Hash,
    description: 'Unique identifier for individual device units',
    example: '(21)SN12345678',
    hasPrefix: true,
  },
  {
    id: 'manufacturing_date',
    title: 'Manufacturing Date',
    aiCode: '(11)',
    icon: Clock,
    description: 'Date when the device was manufactured',
    example: '(11)231215',
    hasPrefix: false,
  },
  {
    id: 'expiration_date',
    title: 'Expiration Date',
    aiCode: '(17)',
    icon: Calendar,
    description: 'Date after which the device should not be used',
    example: '(17)251215',
    hasPrefix: false,
  },
  {
    id: 'software_version',
    title: 'Software Version',
    aiCode: '(8012)',
    icon: Cpu,
    description: 'Version identifier for software as a medical device (SaMD)',
    example: '(8012)v2.1.0',
    hasPrefix: false,
  },
];

const STATUS_CONFIG: Record<RequirementStatus, { 
  icon: React.ReactNode; 
  color: string; 
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  required: { 
    icon: <AlertCircle className="h-4 w-4" />, 
    color: 'text-red-600', 
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'REQUIRED' 
  },
  recommended: { 
    icon: <AlertTriangle className="h-4 w-4" />, 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'RECOMMENDED' 
  },
  optional: { 
    icon: <CircleDot className="h-4 w-4" />, 
    color: 'text-slate-500', 
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    label: 'OPTIONAL' 
  },
  not_applicable: { 
    icon: <CheckCircle className="h-4 w-4" />, 
    color: 'text-slate-400', 
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-200',
    label: 'N/A' 
  },
};

interface AssessmentQuestionCardProps {
  question: AssessmentQuestion;
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
}

function AssessmentQuestionCard({ question, value, onChange }: AssessmentQuestionCardProps) {
  return (
    <div className="p-3 bg-background rounded-lg border">
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">{question.question}</p>
          <p className="text-xs text-muted-foreground mt-1">{question.helpText}</p>
        </div>
        
        <RadioGroup
          value={value === undefined ? '' : value ? 'yes' : 'no'}
          onValueChange={(val) => onChange(val === 'yes' ? true : val === 'no' ? false : undefined)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id={`${question.id}-yes`} />
            <Label htmlFor={`${question.id}-yes`} className="text-sm cursor-pointer">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id={`${question.id}-no`} />
            <Label htmlFor={`${question.id}-no`} className="text-sm cursor-pointer">No</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="" id={`${question.id}-skip`} />
            <Label htmlFor={`${question.id}-skip`} className="text-sm cursor-pointer text-muted-foreground">Not sure</Label>
          </div>
        </RadioGroup>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>→ Impacts:</span>
          {question.impacts.map((impact, idx) => (
            <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0">
              {impact}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

type AnswerValue = boolean | undefined;

export function UDIPIConfigurationPage({
  companyId,
  productId,
  productData,
  currentConfig,
  onSave,
}: UDIPIConfigurationPageProps) {
  const [config, setConfig] = useState<UDIPIConfig>(currentConfig || DEFAULT_CONFIG);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, AnswerValue>>({});

  // Build device profile from product data
  const initialDeviceProfile = useMemo<DeviceProfile>(() => {
    return {
      deviceClass: (() => {
        if (Array.isArray(productData?.markets)) {
          const selectedMarket = productData.markets.find((m: any) => m.selected && m.riskClass);
          if (selectedMarket?.riskClass) return selectedMarket.riskClass;
        }
        return productData?.class;
      })(),
      isImplantable: productData?.key_technology_characteristics?.isImplantable || 
                     productData?.device_type?.toLowerCase()?.includes('implant'),
      isReusable: productData?.key_technology_characteristics?.isReusable,
      isSterile: productData?.key_technology_characteristics?.isDeliveredSterile,
      isSingleUse: productData?.key_technology_characteristics?.isSingleUse || 
                   productData?.device_type?.toLowerCase()?.includes('consumable'),
      hasSoftware: productData?.key_technology_characteristics?.containsSoftware || 
                   productData?.device_type?.toLowerCase()?.includes('software'),
      hasExpirationDate: productData?.key_technology_characteristics?.hasExpirationDate,
      targetMarkets: Array.isArray(productData?.markets) 
        ? productData.markets.filter((m: any) => m.selected).map((m: any) => m.code)
        : [],
      containsBiologicalMaterial: productData?.key_technology_characteristics?.containsHumanAnimalMaterial,
      hasDegradableMaterials: productData?.key_technology_characteristics?.hasDegradableMaterials,
      requiresCalibration: productData?.key_technology_characteristics?.requiresCalibration,
      hasTimeBasedPerformance: productData?.key_technology_characteristics?.hasTimeBasedPerformance,
      isCustomFabricated: productData?.key_technology_characteristics?.isCustomMade,
      hasMultipleComponents: productData?.key_technology_characteristics?.hasMultipleComponents,
    };
  }, [productData]);

  // Build enhanced device profile with assessment answers
  const deviceProfile = useMemo<DeviceProfile>(() => {
    return {
      ...initialDeviceProfile,
      ...Object.fromEntries(
        Object.entries(assessmentAnswers).filter(([_, v]) => v !== undefined)
      ),
    };
  }, [initialDeviceProfile, assessmentAnswers]);

  // Calculate requirements
  const initialRequirements = useMemo(() => {
    return calculateUDIPIRequirements(initialDeviceProfile || {});
  }, [initialDeviceProfile]);

  const requirements = useMemo(() => {
    return calculateUDIPIRequirements(deviceProfile);
  }, [deviceProfile]);

  const requirementChanges = useMemo(() => {
    return getRequirementChanges(initialRequirements, requirements);
  }, [initialRequirements, requirements]);

  const relevantQuestions = useMemo(() => {
    return getRelevantAssessmentQuestions(initialDeviceProfile || {});
  }, [initialDeviceProfile]);

  const profileSummary = useMemo(() => {
    return generateProfileSummary(deviceProfile);
  }, [deviceProfile]);

  const marketSummary = useMemo(() => {
    return generateMarketSummary(deviceProfile?.targetMarkets);
  }, [deviceProfile?.targetMarkets]);

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig);
    } else {
      const autoConfig = { ...DEFAULT_CONFIG };
      
      if (requirements.lot_batch.status === 'required' || requirements.lot_batch.status === 'recommended') {
        autoConfig.lot_batch.enabled = true;
      }
      if (requirements.serial_number.status === 'required' || requirements.serial_number.status === 'recommended') {
        autoConfig.serial_number.enabled = true;
      }
      if (requirements.manufacturing_date.status === 'required' || requirements.manufacturing_date.status === 'recommended') {
        autoConfig.manufacturing_date.enabled = true;
      }
      if (requirements.expiration_date.status === 'required' || requirements.expiration_date.status === 'recommended') {
        autoConfig.expiration_date.enabled = true;
      }
      if (requirements.software_version.status === 'required') {
        autoConfig.software_version.enabled = true;
      }
      
      setConfig(autoConfig);
    }
  }, [currentConfig, requirements]);

  useEffect(() => {
    if (requirementChanges.length > 0) {
      setConfig(prev => {
        const updated = { ...prev };
        
        for (const change of requirementChanges) {
          const key = PI_TYPES.find(p => p.title === change.field)?.id as keyof UDIPIConfig;
          if (key && (change.to === 'required' || change.to === 'recommended')) {
            updated[key] = { ...updated[key], enabled: true };
          }
        }
        
        return updated;
      });
    }
  }, [requirementChanges]);

  const handleToggle = (piType: keyof UDIPIConfig) => {
    const req = requirements[piType];
    if (req.status === 'required') return;
    if (req.status === 'not_applicable') return;
    
    setConfig(prev => ({
      ...prev,
      [piType]: {
        ...prev[piType],
        enabled: !prev[piType].enabled,
      },
    }));
  };

  const handlePrefixChange = (piType: 'lot_batch' | 'serial_number', value: string) => {
    setConfig(prev => ({
      ...prev,
      [piType]: {
        ...prev[piType],
        prefix: value,
      },
    }));
  };

  const handleAssessmentAnswer = useCallback((questionId: string, value: boolean | undefined) => {
    setAssessmentAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  }, []);

  const handleSave = () => {
    onSave(config, assessmentAnswers);
  };

  const getEnabledCount = () => {
    return Object.values(config).filter(c => c.enabled).length;
  };

  const generatePreviewUDI = () => {
    const parts: string[] = [];
    parts.push('(01)05412345678904');
    
    if (config.lot_batch.enabled) {
      const prefix = config.lot_batch.prefix || '';
      parts.push(`(10)${prefix}ABC123`);
    }
    if (config.serial_number.enabled) {
      const prefix = config.serial_number.prefix || '';
      parts.push(`(21)${prefix}SN789012`);
    }
    if (config.manufacturing_date.enabled) {
      parts.push('(11)231215');
    }
    if (config.expiration_date.enabled) {
      parts.push('(17)251215');
    }
    if (config.software_version.enabled) {
      parts.push('(8012)v2.1.0');
    }
    
    return parts.join('');
  };

  const hasProfileData = profileSummary.length > 0;
  const hasUnansweredQuestions = relevantQuestions.length > 0;

  return (
    <div className="space-y-6">
      {/* Device Profile Detected Section */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clipboard className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-2">Device Profile Detected</h3>
              {hasProfileData ? (
                <div className="flex flex-wrap gap-2">
                  {profileSummary.map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-xs">
                    Markets: {marketSummary}
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No device characteristics detected. Complete Device Definition → General tab to get personalized guidance.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Assessment Questions Section */}
      {hasUnansweredQuestions && (
        <>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-amber-100">
                  <MessageSquare className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Help Us Refine Your Recommendations</h3>
                  <p className="text-xs text-muted-foreground">
                    Answer these questions to get more accurate UDI-PI guidance for your specific device
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {relevantQuestions.map((question) => (
                  <AssessmentQuestionCard
                    key={question.id}
                    question={question}
                    value={assessmentAnswers[question.id]}
                    onChange={(value) => handleAssessmentAnswer(question.id, value)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Requirements Changed Alert */}
          {requirementChanges.length > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <Sparkles className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-green-800">
                    Recommendations Updated Based on Your Answers
                  </p>
                  <div className="space-y-1">
                    {requirementChanges.map((change, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <ArrowUp className="h-3 w-3 text-green-600" />
                        <span className="font-medium">{change.field}:</span>
                        <Badge variant="outline" className="text-xs">
                          {change.from.toUpperCase()}
                        </Badge>
                        <span>→</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            change.to === 'required' ? 'bg-red-50 text-red-600 border-red-200' :
                            change.to === 'recommended' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                            ''
                          }`}
                        >
                          {change.to.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Requirements Summary */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Requirements Analysis</h3>
        <div className="grid gap-2">
          {PI_TYPES.map((piType) => {
            const req = requirements[piType.id as keyof UDIPIRequirements];
            const statusConfig = STATUS_CONFIG[req.status];
            
            return (
              <div 
                key={piType.id}
                className={`p-3 rounded-lg border ${statusConfig.bgColor} ${statusConfig.borderColor}`}
              >
                <div className="flex items-start gap-3">
                  <div className={statusConfig.color}>
                    {statusConfig.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                      <span className="font-medium text-sm">{piType.title}</span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {piType.aiCode}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {req.reason}
                    </p>
                    {req.regulatoryRef && (
                      <p className="text-xs text-primary mt-1 font-medium">
                        📋 {req.regulatoryRef}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Configuration Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Your Configuration</h3>
          <Badge variant="secondary">{getEnabledCount()} enabled</Badge>
        </div>

        <div className="space-y-3">
          {PI_TYPES.map((piType) => {
            const configKey = piType.id as keyof UDIPIConfig;
            const req = requirements[configKey];
            const isEnabled = config[configKey]?.enabled;
            const statusConfig = STATUS_CONFIG[req.status];
            const isLocked = req.status === 'required' || req.status === 'not_applicable';
            const IconComponent = piType.icon;

            return (
              <div
                key={piType.id}
                className={`p-4 border rounded-lg transition-all ${
                  req.status === 'not_applicable' 
                    ? 'opacity-50 bg-muted/30' 
                    : isEnabled 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={piType.id}
                    checked={isEnabled}
                    onCheckedChange={() => handleToggle(configKey)}
                    disabled={isLocked}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <IconComponent className={`h-4 w-4 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                      <Label 
                        htmlFor={piType.id} 
                        className={`font-medium ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {piType.title}
                      </Label>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${statusConfig.color} ${statusConfig.bgColor} ${statusConfig.borderColor}`}
                      >
                        {statusConfig.label}
                      </Badge>
                      {isLocked && req.status === 'required' && (
                        <span className="text-xs text-muted-foreground">(cannot be disabled)</span>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {piType.description}
                    </p>

                    {/* Configuration options when enabled */}
                    {isEnabled && piType.hasPrefix && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground w-16">Prefix:</Label>
                          <Input
                            value={(config[configKey] as any).prefix || ''}
                            onChange={(e) => handlePrefixChange(piType.id as 'lot_batch' | 'serial_number', e.target.value)}
                            placeholder="Optional prefix (e.g., LOT, SN)"
                            className="h-8 text-sm max-w-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* What's This For Section */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          What This Configuration Is Used For
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="border-dashed">
            <CardContent className="p-3 flex items-start gap-3">
              <Printer className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Label Template Generation</p>
                <p className="text-xs text-muted-foreground">
                  Your labels will include: {[
                    config.lot_batch.enabled && 'Lot/Batch',
                    config.serial_number.enabled && 'Serial',
                    config.manufacturing_date.enabled && 'Mfg Date',
                    config.expiration_date.enabled && 'Exp Date',
                    config.software_version.enabled && 'Software Ver.',
                  ].filter(Boolean).join(', ') || 'None selected'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="p-3 flex items-start gap-3">
              <Database className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">EUDAMED / GUDID Registration</p>
                <p className="text-xs text-muted-foreground">
                  UDI-PI declaration for regulatory database submission
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="p-3 flex items-start gap-3">
              <Barcode className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Barcode Structure</p>
                <p className="text-xs text-muted-foreground">
                  2D Data Matrix will encode the selected identifiers
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="p-3 flex items-start gap-3">
              <FileText className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Manufacturing Specs</p>
                <p className="text-xs text-muted-foreground">
                  Production system will generate these identifiers per unit
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Preview Section */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          Complete UDI Preview
        </h3>
        
        <div className="p-4 bg-muted rounded-lg">
          <div className="font-mono text-sm break-all">
            {generatePreviewUDI()}
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              <span className="text-blue-600">(01)</span> Device Identifier
            </Badge>
            {config.lot_batch.enabled && (
              <Badge variant="outline" className="text-xs">
                <span className="text-green-600">(10)</span> Lot/Batch
              </Badge>
            )}
            {config.serial_number.enabled && (
              <Badge variant="outline" className="text-xs">
                <span className="text-purple-600">(21)</span> Serial
              </Badge>
            )}
            {config.manufacturing_date.enabled && (
              <Badge variant="outline" className="text-xs">
                <span className="text-orange-600">(11)</span> Mfg Date
              </Badge>
            )}
            {config.expiration_date.enabled && (
              <Badge variant="outline" className="text-xs">
                <span className="text-red-600">(17)</span> Exp Date
              </Badge>
            )}
            {config.software_version.enabled && (
              <Badge variant="outline" className="text-xs">
                <span className="text-cyan-600">(8012)</span> Software
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
