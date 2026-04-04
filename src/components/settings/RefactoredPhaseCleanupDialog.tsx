
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, AlertTriangle, Database } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefactoredPhaseCleanupService, RefactoredCleanupResult } from "@/services/refactoredPhaseCleanupService";

interface RefactoredPhaseCleanupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onCleanupComplete: () => void;
}

export function RefactoredPhaseCleanupDialog({
  open,
  onOpenChange,
  companyId,
  onCleanupComplete
}: RefactoredPhaseCleanupDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cleanupResults, setCleanupResults] = useState<RefactoredCleanupResult | null>(null);
  const [cleanupStats, setCleanupStats] = useState<{
    orphanedPhases: number;
    orphanedDocuments: number;
    errors: string[];
  } | null>(null);

  // Load cleanup stats when dialog opens
  useEffect(() => {
    if (open) {
      loadCleanupStats();
    }
  }, [open]);

  const loadCleanupStats = async () => {
    try {
      const stats = await RefactoredPhaseCleanupService.getCleanupStats();
      setCleanupStats(stats);
    } catch (error) {
      console.error('Error loading cleanup stats:', error);
      toast.error('Failed to load cleanup statistics');
    }
  };

  const handleOrphanedCleanup = async () => {
    setIsProcessing(true);
    setCleanupResults(null);
    
    try {
      console.log('[RefactoredPhaseCleanup] Starting orphaned phase cleanup');
      
      const results = await RefactoredPhaseCleanupService.cleanupOrphanedPhases();
      setCleanupResults(results);
      
      if (results.success) {
        toast.success(`Cleanup completed: ${results.orphanedPhasesRemoved} orphaned phases and ${results.orphanedDocumentsRemoved} orphaned documents removed`);
        // Refresh stats after cleanup
        await loadCleanupStats();
        onCleanupComplete();
      } else {
        toast.error(`Cleanup failed: ${results.errors.join(', ')}`);
      }

    } catch (error) {
      console.error('[RefactoredPhaseCleanup] Error during cleanup:', error);
      toast.error('Failed to cleanup orphaned phases. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDuplicateCleanup = async () => {
    setIsProcessing(true);
    setCleanupResults(null);
    
    try {
      console.log('[RefactoredPhaseCleanup] Starting duplicate phase cleanup for company:', companyId);
      
      const results = await RefactoredPhaseCleanupService.cleanupDuplicatePhases(companyId);
      setCleanupResults(results);
      
      if (results.success) {
        toast.success(`Cleanup completed: ${results.orphanedPhasesRemoved} duplicate phases and ${results.orphanedDocumentsRemoved} documents removed`);
        onCleanupComplete();
      } else {
        toast.error(`Cleanup failed: ${results.errors.join(', ')}`);
      }

    } catch (error) {
      console.error('[RefactoredPhaseCleanup] Error during cleanup:', error);
      toast.error('Failed to cleanup duplicate phases. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCleanupResults(null);
    setCleanupStats(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-destructive" />
            Refactored Phase System Cleanup
          </DialogTitle>
          <DialogDescription>
            Clean up orphaned phases and duplicate phases in the new refactored schema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {cleanupStats && (
            <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="font-medium text-blue-800">Cleanup Statistics:</div>
              <div className="text-sm text-blue-700 space-y-1">
                <div>🗄️ Orphaned phases found: {cleanupStats.orphanedPhases}</div>
                <div>📄 Orphaned documents found: {cleanupStats.orphanedDocuments}</div>
              </div>
              {cleanupStats.errors.length > 0 && (
                <div className="text-xs text-red-600 mt-2">
                  Errors: {cleanupStats.errors.join(', ')}
                </div>
              )}
            </div>
          )}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>What this cleanup does:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                <li><strong>Orphaned phases:</strong> Removes phases with no valid company reference</li>
                <li><strong>Duplicate phases:</strong> Removes duplicate phases within companies</li>
                <li><strong>Associated documents:</strong> Cleans up documents linked to removed phases</li>
              </ul>
            </AlertDescription>
          </Alert>

          {cleanupResults && (
            <div className="space-y-2 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="font-medium text-green-800 flex items-center gap-2">
                <Database className="h-5 w-5" />
                Cleanup Results
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <div>✓ {cleanupResults.orphanedPhasesRemoved} phases removed</div>
                <div>✓ {cleanupResults.orphanedDocumentsRemoved} documents cleaned up</div>
                {cleanupResults.errors.length > 0 && (
                  <div className="text-red-600">
                    ✗ Errors: {cleanupResults.errors.length}
                  </div>
                )}
              </div>
              
              {cleanupResults.errors && cleanupResults.errors.length > 0 && (
                <div className="mt-3 max-h-24 overflow-auto">
                  <div className="text-xs font-medium text-red-800 mb-1">Errors:</div>
                  {cleanupResults.errors.slice(0, 5).map((error, index) => (
                    <div key={index} className="text-xs text-red-600">
                      {error}
                    </div>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            {cleanupResults ? 'Close' : 'Cancel'}
          </Button>
          {!cleanupResults && (
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleOrphanedCleanup}
                disabled={isProcessing || (cleanupStats && cleanupStats.orphanedPhases === 0)}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clean Orphaned ({cleanupStats?.orphanedPhases || 0})
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDuplicateCleanup}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clean Duplicates
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
