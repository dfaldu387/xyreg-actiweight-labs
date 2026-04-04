
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, RefreshCw, Zap } from 'lucide-react';
import { usePhaseInitialization } from '@/hooks/usePhaseInitialization';

interface PhaseInitializationCardProps {
  companyId: string;
  onInitializationComplete?: () => void;
}

export function PhaseInitializationCard({ companyId, onInitializationComplete }: PhaseInitializationCardProps) {
  const { isInitializing, validationResult, initializePhases, validatePhases } = usePhaseInitialization(companyId);

  const handleInitialize = async () => {
    const result = await initializePhases();
    if (result.success && onInitializationComplete) {
      onInitializationComplete();
    }
  };

  const handleRevalidate = async () => {
    await validatePhases();
  };

  if (!validationResult) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Validating phase configuration...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={validationResult.isValid ? "border-green-200 bg-green-50/50" : "border-orange-200 bg-orange-50/50"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {validationResult.isValid ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          )}
          Phase Configuration Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <Badge variant={validationResult.totalPhases >= 15 ? "default" : "destructive"}>
              {validationResult.totalPhases} Total
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Phases</p>
          </div>
          <div className="text-center">
            <Badge variant={validationResult.systemPhases >= 15 ? "default" : "destructive"}>
              {validationResult.systemPhases} System
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">System Phases</p>
          </div>
          <div className="text-center">
            <Badge variant={validationResult.activePhases > 0 ? "default" : "destructive"}>
              {validationResult.activePhases} Active
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Active Phases</p>
          </div>
        </div>

        {/* Issues */}
        {validationResult.issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-orange-700">Issues Found:</h4>
            <ul className="list-disc list-inside space-y-1">
              {validationResult.issues.map((issue, index) => (
                <li key={index} className="text-sm text-orange-600">{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!validationResult.isValid && (
            <Button 
              onClick={handleInitialize}
              disabled={isInitializing}
              className="flex-1"
            >
              {isInitializing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Initialize Standard Phases
                </>
              )}
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={handleRevalidate}
            size={validationResult.isValid ? "default" : "sm"}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recheck
          </Button>
        </div>

        {validationResult.isValid && (
          <div className="text-center text-sm text-green-600">
            ✓ All phases properly configured
          </div>
        )}
      </CardContent>
    </Card>
  );
}
