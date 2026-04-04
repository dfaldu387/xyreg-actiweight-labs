
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, CheckCircle, AlertTriangle, Info, Wrench, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { usePhaseRepair } from "@/hooks/usePhaseRepair";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PhaseRepairDashboardProps {
  companyId: string;
  onRepairComplete?: () => void;
}

export function PhaseRepairDashboard({ companyId, onRepairComplete }: PhaseRepairDashboardProps) {
  const { 
    isRepairing, 
    isValidating,
    lastRepairResult, 
    integrityIssues,
    hasIssues,
    totalIssueCount,
    runRepair, 
    validateIntegrity,
    clearRepairResult
  } = usePhaseRepair(companyId);

  const [hasChecked, setHasChecked] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [autoCheckInterval, setAutoCheckInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Auto-check on mount
    const checkIntegrity = async () => {
      await validateIntegrity();
      setHasChecked(true);
    };
    checkIntegrity();

    // Set up periodic validation every 30 seconds
    const interval = setInterval(() => {
      if (!isRepairing && !isValidating) {
        validateIntegrity();
      }
    }, 30000);
    
    setAutoCheckInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [validateIntegrity, isRepairing, isValidating]);

  useEffect(() => {
    // Clear auto-check when component unmounts
    return () => {
      if (autoCheckInterval) {
        clearInterval(autoCheckInterval);
      }
    };
  }, [autoCheckInterval]);

  const handleRepair = async () => {
    const result = await runRepair();
    if (result.success && onRepairComplete) {
      // Wait a moment for database consistency
      setTimeout(() => {
        onRepairComplete();
      }, 1500);
    }
  };

  const handleCheck = async () => {
    await validateIntegrity();
    setHasChecked(true);
    clearRepairResult();
  };

  // Don't show anything while initially loading
  if (!hasChecked && isValidating) {
    return (
      <div className="flex items-center justify-center p-4">
        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Checking phase integrity...</span>
      </div>
    );
  }

  // Only show the dashboard if there are issues or we just finished a repair
  if (!hasIssues && !lastRepairResult) {
    return null;
  }

  const getStatusBadge = () => {
    if (isValidating) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Checking...</Badge>;
    }
    if (isRepairing) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Repairing...</Badge>;
    }
    if (!hasIssues) {
      return <Badge className="bg-green-500">All Good</Badge>;
    }
    return <Badge variant="destructive">{totalIssueCount} Issues Found</Badge>;
  };

  const getIssueTypeLabel = (type: string) => {
    switch (type) {
      case 'missing_phase':
        return 'Products without phases';
      case 'invalid_phase':
        return 'Products with invalid phases';
      case 'orphaned_lifecycle_phase':
        return 'Orphaned phase assignments';
      case 'phase_id_mismatch':
        return 'Products with mismatched phase IDs';
      default:
        return 'Unknown issues';
    }
  };

  const getIssueDescription = (type: string) => {
    switch (type) {
      case 'missing_phase':
        return 'Products that have no phase assigned - these will appear as "No Phase"';
      case 'invalid_phase':
        return 'Products assigned to phases that no longer exist in your company configuration';
      case 'orphaned_lifecycle_phase':
        return 'Database records pointing to phases that have been deleted';
      case 'phase_id_mismatch':
        return 'Products whose current phase doesn\'t match your company\'s active phases';
      default:
        return 'Unknown issue type';
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'missing_phase':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'invalid_phase':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'orphaned_lifecycle_phase':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'phase_id_mismatch':
        return <RefreshCw className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-amber-600" />
          Phase & Product Integrity
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={handleCheck}
            disabled={isValidating || isRepairing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
            {isValidating ? 'Checking...' : 'Check Again'}
          </Button>
          
          {hasIssues && (
            <Button
              onClick={handleRepair}
              disabled={isRepairing || isValidating}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isRepairing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Repairing...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Fix {totalIssueCount} Issues
                </>
              )}
            </Button>
          )}
        </div>

        {hasIssues && (
          <Alert className="border-amber-300 bg-amber-100">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-medium text-amber-800">Issues detected that need attention:</p>
                <ul className="space-y-2">
                  {integrityIssues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-amber-700">
                      {getIssueIcon(issue.type)}
                      <div>
                        <span className="font-medium">{getIssueTypeLabel(issue.type)}</span>: {issue.count} items
                        <br />
                        <span className="text-xs text-amber-600">{getIssueDescription(issue.type)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-amber-600 mt-3 p-2 bg-amber-50 rounded border-l-4 border-amber-400">
                  <Info className="h-4 w-4 inline mr-1" />
                  These issues cause products to appear in the "Unmapped Products" section and may prevent proper drag-and-drop functionality.
                </p>
                
                {/* Detailed issue breakdown */}
                <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-0 h-auto text-amber-700 hover:text-amber-800">
                      {showDetails ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show Affected Items
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {integrityIssues.map((issue, index) => (
                        <div key={index} className="border border-amber-200 rounded p-3 bg-white/50">
                          <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                            {getIssueIcon(issue.type)}
                            {getIssueTypeLabel(issue.type)} ({issue.count})
                          </h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {issue.details.slice(0, 5).map((detail, detailIndex) => (
                              <div key={detailIndex} className="text-xs text-amber-700 font-mono bg-white/70 p-2 rounded flex justify-between">
                                <span className="font-medium">
                                  {detail.name || detail.products?.name || `Item ${detailIndex + 1}`}
                                </span>
                                {detail.current_lifecycle_phase && (
                                  <span className="text-amber-600">
                                    Current: {detail.current_lifecycle_phase}
                                  </span>
                                )}
                              </div>
                            ))}
                            {issue.details.length > 5 && (
                              <div className="text-xs text-amber-600 text-center py-1">
                                ... and {issue.details.length - 5} more items
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {lastRepairResult && (
          <Alert className={lastRepairResult.success ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}>
            <CheckCircle className={`h-4 w-4 ${lastRepairResult.success ? 'text-green-600' : 'text-red-600'}`} />
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    Repair {lastRepairResult.success ? 'Completed' : 'Failed'}
                  </p>
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">
                  Items Fixed: <strong>{lastRepairResult.repairedCount}</strong>
                </p>
                
                {lastRepairResult.details && lastRepairResult.details.length > 0 && (
                  <div className="text-sm mt-2">
                    <p className="font-medium text-green-700 mb-1">Actions Taken:</p>
                    <ul className="list-disc list-inside text-green-600 space-y-0.5">
                      {lastRepairResult.details.slice(0, 3).map((detail, index) => (
                        <li key={index} className="text-xs">{detail}</li>
                      ))}
                      {lastRepairResult.details.length > 3 && (
                        <li className="text-xs">... and {lastRepairResult.details.length - 3} more actions</li>
                      )}
                    </ul>
                  </div>
                )}
                
                {lastRepairResult.errors.length > 0 && (
                  <div className="text-sm">
                    <p className="font-medium text-red-600 mb-1">Warnings/Errors:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {lastRepairResult.errors.slice(0, 3).map((error, index) => (
                        <li key={index} className="text-xs text-red-600">{error}</li>
                      ))}
                      {lastRepairResult.errors.length > 3 && (
                        <li className="text-xs text-red-600">... and {lastRepairResult.errors.length - 3} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!hasIssues && hasChecked && !lastRepairResult && (
          <Alert className="border-green-300 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              <div className="flex items-center justify-between">
                <span>All phase and product assignments are properly configured.</span>
                <span className="text-xs text-green-600">
                  Last checked: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
          <Info className="h-3 w-3 inline mr-1" />
          This tool automatically checks and repairs phase assignments every 30 seconds to keep your product board synchronized.
        </div>
      </CardContent>
    </Card>
  );
}
