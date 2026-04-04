import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface IVDSpecimenTypeSectionProps {
  specimenType?: string;
  testingEnvironment?: string;
  analyticalPerformance?: string[];
  clinicalPerformance?: string[];
  onSpecimenTypeChange?: (value: string) => void;
  onTestingEnvironmentChange?: (value: string) => void;
  onAnalyticalPerformanceChange?: (value: string[]) => void;
  onClinicalPerformanceChange?: (value: string[]) => void;
  isLoading?: boolean;
}

export function IVDSpecimenTypeSection({
  specimenType,
  testingEnvironment,
  analyticalPerformance = [],
  clinicalPerformance = [],
  onSpecimenTypeChange,
  onTestingEnvironmentChange,
  onAnalyticalPerformanceChange,
  onClinicalPerformanceChange,
  isLoading = false
}: IVDSpecimenTypeSectionProps) {
  const specimenTypes = [
    'Blood (whole blood, serum, plasma)',
    'Urine',
    'Saliva',
    'Tissue samples',
    'Swabs (nasal, throat, etc.)',
    'Stool samples',
    'Cerebrospinal fluid',
    'Other body fluids',
    'Multiple specimen types'
  ];

  const performanceMetrics = [
    'Sensitivity/Analytical sensitivity',
    'Specificity/Analytical specificity', 
    'Precision/Repeatability',
    'Accuracy/Trueness',
    'Linearity',
    'Limit of detection (LoD)',
    'Limit of quantification (LoQ)',
    'Reference interval/Cut-off values',
    'Interfering substances',
    'Cross-reactivity',
    'Stability studies'
  ];

  const clinicalMetrics = [
    'Clinical sensitivity',
    'Clinical specificity',
    'Positive predictive value (PPV)',
    'Negative predictive value (NPV)',
    'Diagnostic accuracy',
    'Clinical concordance',
    'Intended use population validation',
    'Clinical utility evidence',
    'Comparative studies',
    'Real-world evidence'
  ];

  const handleAnalyticalChange = (metric: string, checked: boolean) => {
    if (!onAnalyticalPerformanceChange) return;
    
    if (checked) {
      onAnalyticalPerformanceChange([...analyticalPerformance, metric]);
    } else {
      onAnalyticalPerformanceChange(analyticalPerformance.filter(m => m !== metric));
    }
  };

  const handleClinicalChange = (metric: string, checked: boolean) => {
    if (!onClinicalPerformanceChange) return;
    
    if (checked) {
      onClinicalPerformanceChange([...clinicalPerformance, metric]);
    } else {
      onClinicalPerformanceChange(clinicalPerformance.filter(m => m !== metric));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>IVD Specimen & Performance Characteristics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Specimen Type */}
        <div>
          <Label htmlFor="specimen-type">Primary Specimen Type</Label>
          <Select 
            value={specimenType || ''} 
            onValueChange={onSpecimenTypeChange}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select primary specimen type..." />
            </SelectTrigger>
            <SelectContent>
              {specimenTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Testing Environment */}
        <div>
          <Label>Testing Environment</Label>
          <RadioGroup 
            value={testingEnvironment} 
            onValueChange={onTestingEnvironmentChange}
            disabled={isLoading}
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="laboratory" id="laboratory" />
              <Label htmlFor="laboratory">Laboratory use</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="near-patient" id="near-patient" />
              <Label htmlFor="near-patient">Near-patient testing</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="self-testing" id="self-testing" />
              <Label htmlFor="self-testing">Self-testing</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="point-of-care" id="point-of-care" />
              <Label htmlFor="point-of-care">Point-of-care testing</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Analytical Performance */}
        <div>
          <Label>Analytical Performance Characteristics</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {performanceMetrics.map(metric => (
              <div key={metric} className="flex items-center space-x-2">
                <Checkbox
                  id={`analytical-${metric}`}
                  checked={analyticalPerformance.includes(metric)}
                  onCheckedChange={(checked) => handleAnalyticalChange(metric, checked as boolean)}
                  disabled={isLoading}
                />
                <Label 
                  htmlFor={`analytical-${metric}`}
                  className="text-sm leading-tight"
                >
                  {metric}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Performance */}
        <div>
          <Label>Clinical Performance Characteristics</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {clinicalMetrics.map(metric => (
              <div key={metric} className="flex items-center space-x-2">
                <Checkbox
                  id={`clinical-${metric}`}
                  checked={clinicalPerformance.includes(metric)}
                  onCheckedChange={(checked) => handleClinicalChange(metric, checked as boolean)}
                  disabled={isLoading}
                />
                <Label 
                  htmlFor={`clinical-${metric}`}
                  className="text-sm leading-tight"
                >
                  {metric}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}