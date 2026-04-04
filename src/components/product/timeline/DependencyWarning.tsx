import React from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface DependencyWarningProps {
  violations: string[];
  isValid: boolean;
  onOverride?: () => void;
  onCancel?: () => void;
  showOverrideOption?: boolean;
}

export function DependencyWarning({ 
  violations, 
  isValid, 
  onOverride, 
  onCancel,
  showOverrideOption = true 
}: DependencyWarningProps) {
  if (isValid) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          This change respects all dependency constraints.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <div className="space-y-2">
          <p className="font-medium">Dependency constraints would be violated:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {violations.map((violation, index) => (
              <li key={index}>{violation}</li>
            ))}
          </ul>
          
          {showOverrideOption && (
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onOverride}
                className="bg-white hover:bg-amber-100"
              >
                Override Dependencies
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onCancel}
              >
                Cancel Move
              </Button>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}