import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
interface ClassificationProgressIndicatorProps {
  anatomicalLocation: string;
  energyDeliveryType: string;
  duration?: string;
  invasiveness?: string;
  active?: boolean;
  intendedUse?: string;
  keyTechnologyCharacteristics?: {
    isSoftwareAsaMedicalDevice?: boolean;
    isSoftwareMobileApp?: boolean;
    noSoftware?: boolean;
    isNonSterile?: boolean;
    isDeliveredSterile?: boolean;
    canBeSterilized?: boolean;
    hasMeasuringFunction?: boolean;
    isReusable?: boolean;
    isSingleUse?: boolean;
    isImplantable?: boolean;
  };
  intendedUsers?: string[];
}
export function ClassificationProgressIndicator({
  anatomicalLocation,
  energyDeliveryType,
  duration,
  invasiveness,
  active,
  intendedUse,
  keyTechnologyCharacteristics,
  intendedUsers = []
}: ClassificationProgressIndicatorProps) {
  // Debug logging to see actual values
  console.log('ClassificationProgressIndicator props:', {
    anatomicalLocation,
    energyDeliveryType,
    duration,
    invasiveness,
    active,
    intendedUse
  });

  // Determine software type
  const softwareType = keyTechnologyCharacteristics?.isSoftwareAsaMedicalDevice ? 'SaMD (Software as a Medical Device)' : keyTechnologyCharacteristics?.isSoftwareMobileApp ? 'SiMD (Software in a Medical Device)' : keyTechnologyCharacteristics?.noSoftware ? 'No Software Used' : '';

  // Determine sterility status
  const sterilityStatus = keyTechnologyCharacteristics?.isNonSterile ? 'Non-sterile' :
    keyTechnologyCharacteristics?.isDeliveredSterile ? 'Delivered Sterile' :
      keyTechnologyCharacteristics?.canBeSterilized ? 'Can be Sterilized' : '';
  const reusabilityStatus = keyTechnologyCharacteristics?.isReusable ? 'Reusable' :
    keyTechnologyCharacteristics?.isSingleUse ? 'Single-use' : '';

  // All regulatory DNA fields for complete progress tracking
  const essentialFields = [
    // Core Classification Fields (Critical)
    {
      label: 'Anatomical Location',
      value: anatomicalLocation,
      critical: true
    },
    {
      label: 'Energy Delivery',
      value: energyDeliveryType,
      critical: true
    },
    {
      label: 'Duration of Use',
      value: duration,
      critical: true
    },
    {
      label: 'Invasiveness',
      value: invasiveness,
      critical: true
    },
    {
      label: 'Active/Non-Active',
      value: active !== undefined ? (active ? 'Active' : 'Non-Active') : '',
      critical: true
    },
    {
      label: 'Software Type',
      value: softwareType,
      critical: true
    },

    // Gap Analysis Critical Fields
    {
      label: 'Sterility Requirements',
      value: sterilityStatus,
      critical: true
    },
    {
      label: 'Intended User',
      value: intendedUsers && intendedUsers.length > 0 ? intendedUsers.join(', ') : '',
      critical: true
    },
    {
      label: 'Measuring Function',
      value: keyTechnologyCharacteristics?.hasMeasuringFunction !== undefined ?
        (keyTechnologyCharacteristics.hasMeasuringFunction ? 'Has Measuring Function' : 'No Measuring Function') : '',
      critical: true
    },
    {
      label: 'Reusable vs Single-Use',
      value: reusabilityStatus,
      critical: true
    },
    {
      label: 'Implantable Status',
      value: keyTechnologyCharacteristics?.isImplantable !== undefined ?
        (keyTechnologyCharacteristics.isImplantable ? 'Implantable' : 'Non-implantable') : '',
      critical: true
    },

    // Non-Critical Fields
    {
      label: 'Intended Use',
      value: intendedUse,
      critical: false
    }
  ];

  // Helper function to check if a field value is considered complete
  const isFieldComplete = (value: any) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed !== '' && trimmed !== 'not_specified' && trimmed !== 'no_contact' && trimmed !== 'undefined' && trimmed !== 'null' && trimmed !== 'not_defined';
    }
    if (typeof value === 'boolean') return true;
    return Boolean(value);
  };

  // Helper function to format field values for display
  const formatFieldValue = (value: any) => {
    if (!isFieldComplete(value)) {
      return 'Not specified';
    }
    if (typeof value === 'boolean') {
      return value ? 'Active' : 'Non-Active';
    }
    if (typeof value === 'string') {
      // Truncate long values and add ellipsis
      return value.length > 50 ? `${value.substring(0, 50)}...` : value;
    }
    return String(value);
  };
  const completedFields = essentialFields.filter(field => isFieldComplete(field.value)).length;
  const criticalFields = essentialFields.filter(field => field.critical);
  const completedCriticalFields = criticalFields.filter(field => isFieldComplete(field.value)).length;
  const overallProgress = Math.round(completedFields / essentialFields.length * 100);
  const criticalProgress = Math.round(completedCriticalFields / criticalFields.length * 100);
  const getConfidenceLevel = () => {
    if (criticalProgress >= 100) return {
      level: 'High',
      color: 'bg-green-500',
      icon: CheckCircle
    };
    if (criticalProgress >= 67) return {
      level: 'Medium',
      color: 'bg-yellow-500',
      icon: Clock
    };
    return {
      level: 'Low',
      color: 'bg-red-500',
      icon: AlertCircle
    };
  };
  const confidence = getConfidenceLevel();
  return <Card>
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <span>Regulatory DNA</span>
        <Badge variant="outline" className={`${confidence.color} text-white`}>
          <confidence.icon className="w-3 h-3 mr-1" />
          {confidence.level} Confidence
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span>Overall Progress</span>
          <span>{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      <div>
        <div className="flex justify-between text-sm mb-2">
          <span>Critical Fields</span>
          <span>{completedCriticalFields}/{criticalFields.length}</span>
        </div>
        <Progress value={criticalProgress} className="h-2" />
      </div>

      <div className="space-y-3 text-xs">
        {essentialFields.map((field, index) => {
          const isComplete = isFieldComplete(field.value);
          const StatusIcon = isComplete ? CheckCircle : AlertCircle;
          const statusColor = isComplete ? 'text-green-600' : 'text-amber-500';
          const status = isComplete ? 'Specified' : 'Missing';

          return (
            <div key={index} className={`p-3 rounded-lg border ${isComplete ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-2 font-semibold mb-1">
                <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                {field.label} - {status}
                {field.critical && <span className="text-red-500">*</span>}
              </div>
              <div className="text-muted-foreground">
                {formatFieldValue(field.value)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Gap Analysis Information */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Gap Analysis Ready:</strong> All regulatory DNA fields above are used to filter applicable GSPR requirements in Gap Analysis. Complete the missing fields to ensure accurate compliance assessment.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        * Critical fields significantly impact classification confidence
      </p>
    </CardContent>
  </Card>;
}