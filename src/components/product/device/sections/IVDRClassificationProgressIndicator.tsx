import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

interface IVDRClassificationProgressIndicatorProps {
  intendedUse?: string;
  primaryTestCategory?: string;
  ivdrDeviceType?: string;
  testingEnvironment?: string;
  controlCalibratorProperties?: string;
  selfTestingSubcategory?: string;
  isLoading?: boolean;
}

export function IVDRClassificationProgressIndicator({
  intendedUse,
  primaryTestCategory,
  ivdrDeviceType,
  testingEnvironment,
  controlCalibratorProperties,
  selfTestingSubcategory,
  isLoading = false
}: IVDRClassificationProgressIndicatorProps) {
  const isFieldComplete = (value: any): boolean => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== undefined && value !== null;
  };

  const formatFieldValue = (value: any): string => {
    if (!isFieldComplete(value)) return 'Not specified';
    if (typeof value === 'string') {
      return value.length > 50 ? `${value.substring(0, 50)}...` : value;
    }
    return String(value);
  };

  // Critical fields for IVDR classification
  const criticalFields = [
    { label: 'Intended Use', value: intendedUse, required: true },
    { label: 'Primary Test Category', value: primaryTestCategory, required: true },
    { label: 'IVDR Device Type', value: ivdrDeviceType, required: true },
    { label: 'Testing Environment', value: testingEnvironment, required: true },
  ];

  // Conditional fields
  const conditionalFields = [];
  
  if (ivdrDeviceType === 'Control Material' || ivdrDeviceType === 'Calibrator') {
    conditionalFields.push({
      label: 'Control/Calibrator Properties',
      value: controlCalibratorProperties,
      required: true
    });
  }

  if (testingEnvironment === 'Self-testing') {
    conditionalFields.push({
      label: 'Self-Testing Subcategory',
      value: selfTestingSubcategory,
      required: true
    });
  }

  const allRequiredFields = [...criticalFields, ...conditionalFields.filter(f => f.required)];
  const completedCriticalFields = allRequiredFields.filter(field => isFieldComplete(field.value));
  const criticalProgress = allRequiredFields.length > 0 ? (completedCriticalFields.length / allRequiredFields.length) * 100 : 0;

  // Overall progress includes all fields
  const allFields = [...criticalFields, ...conditionalFields];
  const completedAllFields = allFields.filter(field => isFieldComplete(field.value));
  const overallProgress = allFields.length > 0 ? (completedAllFields.length / allFields.length) * 100 : 0;

  const getConfidenceLevel = (): { level: string; variant: 'default' | 'secondary' | 'destructive' } => {
    if (criticalProgress === 100) return { level: 'High', variant: 'default' };
    if (criticalProgress >= 75) return { level: 'Medium', variant: 'secondary' };
    return { level: 'Low', variant: 'destructive' };
  };

  const confidence = getConfidenceLevel();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            IVDR Regulatory DNA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          IVDR Regulatory DNA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Critical Fields Progress</span>
              <Badge variant={confidence.variant}>{confidence.level} Confidence</Badge>
            </div>
            <Progress value={criticalProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {completedCriticalFields.length} of {allRequiredFields.length} critical fields completed
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Essential IVDR Classification Fields</h4>
          <div className="space-y-2">
            {allFields.map((field, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                {isFieldComplete(field.value) ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{field.label}</span>
                    {field.required && <span className="text-red-500">*</span>}
                  </div>
                  <p className="text-muted-foreground truncate">
                    {formatFieldValue(field.value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>IVDR Classification:</strong> Complete the critical fields above to get accurate IVDR classification assistance based on test purpose and risk level.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}