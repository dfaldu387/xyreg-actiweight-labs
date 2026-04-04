import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { BulkOperationProgress } from "@/hooks/useBulkOperationProgress";

interface BulkOperationStatusTrackerProps {
  progress: BulkOperationProgress;
  operationType?: string;
  operationDetails?: string;
  className?: string;
}

export function BulkOperationStatusTracker({ 
  progress, 
  operationType, 
  operationDetails, 
  className 
}: BulkOperationStatusTrackerProps) {
  const { isRunning, total, completed, succeeded, failed, currentItem, startTime, errors } = progress;

  if (!isRunning && completed === 0) {
    return null; // Don't show anything when not running and no progress
  }

  const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const hasErrors = failed > 0;
  const isComplete = completed === total && total > 0;

  const getElapsedTime = () => {
    if (!startTime) return '';
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  const getProcessingRate = () => {
    if (!startTime || completed === 0) return '';
    const elapsed = (Date.now() - startTime.getTime()) / 1000; // seconds
    const rate = completed / elapsed;
    if (rate < 1) {
      return `${Math.round(rate * 60)} products/min`;
    }
    return `${Math.round(rate)} products/sec`;
  };

  const getEstimatedTimeRemaining = () => {
    if (!startTime || completed === 0 || !isRunning) return '';
    const elapsed = Date.now() - startTime.getTime();
    const avgTimePerItem = elapsed / completed;
    const remaining = total - completed;
    const estimatedMs = avgTimePerItem * remaining;
    const estimatedSeconds = Math.floor(estimatedMs / 1000);
    const minutes = Math.floor(estimatedSeconds / 60);
    const seconds = estimatedSeconds % 60;
    return minutes > 0 ? `~${minutes}m ${seconds}s remaining` : `~${seconds}s remaining`;
  };

  const getOperationTitle = () => {
    if (operationType) {
      const titles = {
        'regulatory_status': 'Updating Regulatory Status',
        'markets': 'Configuring Markets',
        'pricing': 'Setting Pricing Rules',
        'hierarchy': 'Restructuring Hierarchy'
      };
      return titles[operationType as keyof typeof titles] || 'Processing Bulk Operation';
    }
    return isRunning ? 'Processing Products...' : 
           isComplete ? 'Operation Complete' :
           'Operation Paused';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isRunning ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            ) : isComplete ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : hasErrors ? (
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            ) : (
              <Clock className="h-5 w-5 text-gray-500" />
            )}
            
            {getOperationTitle()}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {startTime && (
              <Badge variant="outline" className="text-xs">
                {getElapsedTime()}
              </Badge>
            )}
            {isRunning && completed > 0 && (
              <Badge variant="secondary" className="text-xs">
                {getProcessingRate()}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Operation Details */}
        {operationDetails && (
          <div className="text-sm text-muted-foreground">
            {operationDetails}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress: {completed} / {total} products</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-3"
          />
        </div>

        {/* Current Item */}
        {currentItem && isRunning && (
          <div className="text-sm text-muted-foreground">
            Currently processing: <span className="font-medium">{currentItem}</span>
          </div>
        )}

        {/* Time Estimates */}
        {isRunning && completed > 0 && (
          <div className="text-xs text-muted-foreground">
            {getEstimatedTimeRemaining()}
          </div>
        )}

        {/* Status Summary */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>{succeeded} succeeded</span>
          </div>
          {failed > 0 && (
            <div className="flex items-center gap-1 text-red-700">
              <XCircle className="h-4 w-4" />
              <span>{failed} failed</span>
            </div>
          )}
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-red-700">Recent Errors:</div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {errors.slice(-3).map((error, index) => (
                <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              ))}
            </div>
            {errors.length > 3 && (
              <div className="text-xs text-muted-foreground">
                ... and {errors.length - 3} more errors
              </div>
            )}
          </div>
        )}
        
        {/* Completion Message */}
        {isComplete && (
          <div className="text-sm">
            {hasErrors ? (
              <span className="text-orange-700">
                Operation completed with {failed} errors out of {total} products
              </span>
            ) : (
              <span className="text-green-700">
                All {total} products processed successfully!
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}