
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircleIcon, AlertTriangleIcon, RefreshCwIcon, DatabaseIcon } from 'lucide-react';
import { useStandardizedPhases, usePhaseConsistencyValidation } from '@/hooks/useStandardizedPhases';
import { EnhancedPhaseService } from '@/services/enhancedPhaseService';

interface PhaseStandardizationPanelProps {
  companyId: string;
  onStandardizationComplete?: () => void;
}

export function PhaseStandardizationPanel({ 
  companyId, 
  onStandardizationComplete 
}: PhaseStandardizationPanelProps) {
  const { 
    phases, 
    loading, 
    isStandardized, 
    standardizing, 
    standardizePhases, 
    refreshPhases 
  } = useStandardizedPhases(companyId);
  
  const { reports, loading: validationLoading, validateConsistency } = usePhaseConsistencyValidation();
  const [showValidation, setShowValidation] = useState(false);

  const handleStandardize = async () => {
    const success = await standardizePhases();
    if (success && onStandardizationComplete) {
      onStandardizationComplete();
    }
  };

  const handleValidateAll = async () => {
    setShowValidation(true);
    await validateConsistency();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Complete': return 'bg-green-100 text-green-800';
      case 'Partial': return 'bg-yellow-100 text-yellow-800';
      case 'Incomplete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const standardTemplate = EnhancedPhaseService.getStandardPhaseTemplate();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCwIcon className="h-6 w-6 animate-spin mr-2" />
            Loading phase standardization status...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Phase Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5" />
            Phase Template Standardization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isStandardized ? (
                <>
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">Standardized</span>
                </>
              ) : (
                <>
                  <AlertTriangleIcon className="h-5 w-5 text-yellow-600" />
                  <span className="text-yellow-600 font-medium">Needs Standardization</span>
                </>
              )}
              <Badge variant="outline">
                {phases.length}/15 phases
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={refreshPhases} disabled={loading}>
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {!isStandardized && (
                <Button 
                  onClick={handleStandardize} 
                  disabled={standardizing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {standardizing ? (
                    <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Standardize Phases
                </Button>
              )}
            </div>
          </div>

          {!isStandardized && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-2">What happens when you standardize?</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Replace current phases with standard 15-phase template</li>
                <li>• Add comprehensive document recommendations for each phase</li>
                <li>• Ensure consistency with medical device development best practices</li>
                <li>• Maintain existing phase assignments for products</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Standard Template Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Standard 15-Phase Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {standardTemplate.map((phase, index) => {
              const hasPhase = phases.some(p => p.name === phase.name);
              return (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    hasPhase 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {hasPhase ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className="font-medium text-sm">{phase.name}</span>
                  </div>
                  <p className="text-xs text-gray-600">{phase.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System-Wide Validation */}
      <Card>
        <CardHeader>
          <CardTitle>System-Wide Phase Consistency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleValidateAll}
              disabled={validationLoading}
            >
              {validationLoading ? (
                <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Validate All Companies
            </Button>
          </div>

          {showValidation && reports.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Validation Results</h4>
              {reports.map((report, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{report.company_name}</span>
                    <div className="text-sm text-gray-600">
                      {report.phase_count} phases configured
                      {report.missing_phases.length > 0 && (
                        <span className="ml-2 text-yellow-600">
                          ({report.missing_phases.length} missing)
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(report.status)} variant="outline">
                    {report.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
