
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, RefreshCw, Database } from "lucide-react";
import { PhaseCleanupService, type ComprehensiveCleanupResult } from "@/services/phaseCleanupService";

interface PhaseCleanupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
  companyName?: string;
}

export function PhaseCleanupDialog({
  open,
  onOpenChange,
  companyId,
  companyName
}: PhaseCleanupDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cleanupResults, setCleanupResults] = useState<ComprehensiveCleanupResult | null>(null);
  const [currentOperation, setCurrentOperation] = useState("");
  const [cleanupProgress, setCleanupProgress] = useState(0);

  const handleCleanup = async () => {
    setIsProcessing(true);
    setCleanupProgress(0);
    setCurrentOperation("Starting phase cleanup...");
    setCleanupResults(null);
    
    try {
      setCleanupProgress(20);
      setCurrentOperation("Analyzing duplicate phases...");
      
      const results = await PhaseCleanupService.cleanupAllCompanyPhases();
      
      setCleanupProgress(80);
      setCurrentOperation("Finalizing cleanup...");
      
      setCleanupResults(results);
      
      setCleanupProgress(100);
      setCurrentOperation("Cleanup completed!");
      
    } catch (error) {
      console.error('[PhaseCleanupDialog] Cleanup failed:', error);
      setCleanupResults({
        success: false,
        duplicatesFound: 0,
        duplicatesResolved: 0,
        companiesProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        details: []
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCleanupResults(null);
    setIsProcessing(false);
    setCleanupProgress(0);
    setCurrentOperation("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Phase Database Cleanup
          </DialogTitle>
          <DialogDescription>
            Clean up duplicate phase names and ensure database consistency. This will resolve issues with CSV imports 
            caused by duplicate phase names (e.g., "Concept & Feasibility" vs "(01) Concept & Feasibility").
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4 p-1">
          {isProcessing && (
            <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cleanup Progress</span>
                <span className="text-sm text-muted-foreground">{Math.round(cleanupProgress)}%</span>
              </div>
              <Progress value={cleanupProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">{currentOperation}</p>
            </div>
          )}

          {cleanupResults && (
            <div className={`space-y-2 p-4 rounded-lg border ${
              cleanupResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className={`font-medium flex items-center gap-2 ${
                cleanupResults.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {cleanupResults.success ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
                Cleanup Results
              </div>
              
              <div className={`text-sm space-y-1 grid grid-cols-2 gap-x-4 ${
                cleanupResults.success ? 'text-green-700' : 'text-red-700'
              }`}>
                <div>✓ Companies Processed: {cleanupResults.companiesProcessed}</div>
                <div>✓ Duplicates Found: {cleanupResults.duplicatesFound}</div>
                <div>✓ Duplicates Resolved: {cleanupResults.duplicatesResolved}</div>
                {cleanupResults.errors.length > 0 && (
                  <div className="text-red-600 col-span-2">
                    ✗ Errors: {cleanupResults.errors.length}
                  </div>
                )}
              </div>
              
              {cleanupResults.details && cleanupResults.details.length > 0 && (
                <div className="mt-3 max-h-32 overflow-auto">
                  <div className="text-xs font-medium mb-1">Detailed Results:</div>
                  {cleanupResults.details.slice(0, 10).map((detail, index) => (
                    <div key={index} className="text-xs">
                      {detail.companyName}: {detail.action} - "{detail.phaseName}" 
                      {detail.duplicateCount > 0 && ` (${detail.duplicateCount} duplicates removed)`}
                    </div>
                  ))}
                  {cleanupResults.details.length > 10 && (
                    <div className="text-xs">
                      ...and {cleanupResults.details.length - 10} more
                    </div>
                  )}
                </div>
              )}
              
              {cleanupResults.errors && cleanupResults.errors.length > 0 && (
                <div className="mt-3 max-h-24 overflow-auto">
                  <div className="text-xs font-medium text-red-800 mb-1">Errors:</div>
                  {cleanupResults.errors.slice(0, 5).map((error, index) => (
                    <div key={index} className="text-xs text-red-600">{error}</div>
                  ))}
                  {cleanupResults.errors.length > 5 && (
                    <div className="text-xs text-red-600">
                      ...and {cleanupResults.errors.length - 5} more errors
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-amber-800 mb-1">What this cleanup does:</div>
                <ul className="text-amber-700 space-y-1 list-disc list-inside">
                  <li>Identifies duplicate phase names (with and without numbering prefixes)</li>
                  <li>Merges duplicate phases by transferring all documents and relationships</li>
                  <li>Ensures consistent numbering format: "(01) Phase Name"</li>
                  <li>Removes database conflicts that cause CSV import failures</li>
                </ul>
                <div className="mt-2 text-xs text-amber-600">
                  This operation is safe and will not delete any documents or important data.
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            {isProcessing ? 'Please wait...' : 'Close'}
          </Button>
          <Button
            onClick={handleCleanup}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Cleaning up...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Start Cleanup
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
