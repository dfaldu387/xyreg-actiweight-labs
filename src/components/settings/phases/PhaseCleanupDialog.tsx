
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Trash2, ArrowRight } from 'lucide-react';
import { PhaseCleanupService, PhaseCleanupResult } from '@/services/phaseCleanupService';

interface PhaseCleanupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onCleanupComplete: () => void;
}

export function PhaseCleanupDialog({
  open,
  onOpenChange,
  companyId,
  onCleanupComplete
}: PhaseCleanupDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<PhaseCleanupResult[]>([]);

  const handleCleanup = async () => {
    try {
      setIsProcessing(true);
      const cleanupResults = await PhaseCleanupService.cleanupDuplicatePhases(companyId);
      setResults(cleanupResults);
      
      if (cleanupResults.length === 0) {
        // No duplicates found, close dialog
        setTimeout(() => {
          onOpenChange(false);
          onCleanupComplete();
        }, 1500);
      } else {
        // Show results and cleanup completed
        setTimeout(() => {
          onCleanupComplete();
        }, 2000);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setResults([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-orange-500" />
            Clean Up Duplicate Phases
          </DialogTitle>
          <DialogDescription>
            This will identify and merge duplicate phases, moving all documents to the primary phase.
            Duplicate phases will be removed after consolidation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {results.length === 0 && !isProcessing && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-yellow-800">Before proceeding:</p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Duplicate phases will be identified by similar names</li>
                    <li>• Documents will be moved to the oldest phase</li>
                    <li>• Duplicate phases will be permanently deleted</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-3">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-muted-foreground">Processing duplicate phases...</p>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-green-800">Cleanup completed successfully!</p>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-green-800">{result.old_phase_name}</span>
                        <ArrowRight className="h-3 w-3 text-green-600" />
                        <span className="font-medium text-green-800">{result.new_phase_name}</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {result.documents_moved} docs moved
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.length === 0 && !isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> If no duplicates are found, the cleanup will complete immediately.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            {results.length > 0 ? 'Close' : 'Cancel'}
          </Button>
          {results.length === 0 && (
            <Button 
              onClick={handleCleanup}
              disabled={isProcessing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isProcessing ? 'Processing...' : 'Clean Up Duplicates'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
