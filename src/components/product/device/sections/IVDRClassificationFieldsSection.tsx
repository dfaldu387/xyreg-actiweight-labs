import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Beaker } from 'lucide-react';

interface IVDRClassificationFieldsSectionProps {
  primaryTestCategory?: string;
  onPrimaryTestCategoryChange: (value: string) => void;
  ivdrDeviceType?: string;
  onIvdrDeviceTypeChange: (value: string) => void;
  controlCalibratorProperties?: string;
  onControlCalibratorPropertiesChange: (value: string) => void;
  selfTestingSubcategory?: string;
  onSelfTestingSubcategoryChange: (value: string) => void;
  testingEnvironment?: string;
  isLoading?: boolean;
}

export function IVDRClassificationFieldsSection({
  primaryTestCategory,
  onPrimaryTestCategoryChange,
  ivdrDeviceType,
  onIvdrDeviceTypeChange,
  controlCalibratorProperties,
  onControlCalibratorPropertiesChange,
  selfTestingSubcategory,
  onSelfTestingSubcategoryChange,
  testingEnvironment,
  isLoading = false
}: IVDRClassificationFieldsSectionProps) {
  const primaryTestCategories = [
    { value: 'transfusion_transplantation', label: 'Transfusion/Transplantation Safety' },
    { value: 'high_risk_infectious', label: 'High-Risk Infectious Disease Detection/Monitoring' },
    { value: 'blood_grouping_high_risk', label: 'Blood Grouping - High Risk Markers (ABO, Rhesus, Kell, Kidd, Duffy)' },
    { value: 'blood_grouping_other', label: 'Blood Grouping - Other Markers' },
    { value: 'companion_diagnostic', label: 'Companion Diagnostic (CDx)' },
    { value: 'cancer_screening', label: 'Cancer Screening/Diagnosis/Staging' },
    { value: 'genetic_testing', label: 'Human Genetic Testing' },
    { value: 'sti_testing', label: 'Sexually Transmitted Infection (STI)' },
    { value: 'congenital_screening', label: 'Congenital Disorder Screening' },
    { value: 'critical_monitoring', label: 'Critical Patient Management/Monitoring' },
    { value: 'csf_blood_infectious', label: 'CSF/Blood Infectious Agent Detection' },
    { value: 'prenatal_immune', label: 'Prenatal Immune Status Screening' },
    { value: 'general_diagnostic', label: 'General Diagnostic Testing' },
    { value: 'none', label: 'None of the above' }
  ];

  const ivdrDeviceTypes = [
    { value: 'assay_reagent', label: 'Assay/Reagent Kit' },
    { value: 'instrument', label: 'Instrument' },
    { value: 'software', label: 'Software (Standalone)' },
    { value: 'calibrator', label: 'Calibrator' },
    { value: 'control_material', label: 'Control Material' },
    { value: 'specimen_receptacle', label: 'Specimen Receptacle' },
    { value: 'general_reagent', label: 'General Laboratory Reagent' },
    { value: 'accessory', label: 'Accessory' }
  ];

  const controlCalibratorOptions = [
    { value: 'has_assigned_value', label: 'Has Quantitative or Qualitative Assigned Value' },
    { value: 'no_assigned_value', label: 'Does NOT have an Assigned Value' }
  ];

  const selfTestingSubcategories = [
    { value: 'pregnancy_fertility', label: 'Pregnancy/Fertility Testing' },
    { value: 'cholesterol', label: 'Cholesterol Testing' },
    { value: 'glucose_urine', label: 'Glucose/Urine Testing (glucose, erythrocytes, leucocytes, bacteria)' },
    { value: 'other', label: 'Other Self-Testing' }
  ];

  const showControlCalibrator = ivdrDeviceType === 'control_material' || ivdrDeviceType === 'calibrator';
  const showSelfTestingSubcategory = testingEnvironment === 'Self-testing';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Beaker className="h-5 w-5" />
          IVDR Classification Fields
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="primary-test-category">
              Primary Test Category <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={primaryTestCategory || ''} 
              onValueChange={onPrimaryTestCategoryChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select test category" />
              </SelectTrigger>
              <SelectContent>
                {primaryTestCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Primary purpose of the test (maps directly to IVDR classification rules)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ivdr-device-type">
              IVDR Device Type <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={ivdrDeviceType || ''} 
              onValueChange={onIvdrDeviceTypeChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select device type" />
              </SelectTrigger>
              <SelectContent>
                {ivdrDeviceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              What type of product this is (assay, instrument, software, etc.)
            </p>
          </div>
        </div>

        {showControlCalibrator && (
          <div className="space-y-2">
            <Label htmlFor="control-calibrator-properties">
              Control/Calibrator Properties <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={controlCalibratorProperties || ''} 
              onValueChange={onControlCalibratorPropertiesChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select properties" />
              </SelectTrigger>
              <SelectContent>
                {controlCalibratorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Whether the control/calibrator has an assigned value (affects classification)
            </p>
          </div>
        )}

        {showSelfTestingSubcategory && (
          <div className="space-y-2">
            <Label htmlFor="self-testing-subcategory">
              Self-Testing Subcategory <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={selfTestingSubcategory || ''} 
              onValueChange={onSelfTestingSubcategoryChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent>
                {selfTestingSubcategories.map((subcategory) => (
                  <SelectItem key={subcategory.value} value={subcategory.value}>
                    {subcategory.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Specific category for self-testing devices (affects classification)
            </p>
          </div>
        )}

        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> These fields are critical for accurate IVDR classification. Complete all required fields to get precise classification guidance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}