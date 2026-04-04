
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { Trash2, Search, AlertTriangle } from "lucide-react";
import { useDocumentDuplicateCleanup } from "@/hooks/useDocumentDuplicateCleanup";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DocumentDuplicateCleanupButtonProps {
  companyId: string;
  onCleanupComplete?: () => void;
}

export function DocumentDuplicateCleanupButton({ 
  companyId, 
  onCleanupComplete 
}: DocumentDuplicateCleanupButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showReport, setShowReport] = useState(false);
  
  const {
    isCleaningUp,
    lastCleanupResult,
    duplicatesReport,
    isLoadingReport,
    cleanupDuplicates,
    getDuplicatesReport
  } = useDocumentDuplicateCleanup();

  const handleShowReport = async () => {
    await getDuplicatesReport(companyId);
    setShowReport(true);
  };

  const handleCleanup = async () => {
    try {
      const result = await cleanupDuplicates(companyId);
      
      if (result.success && result.duplicatesRemoved > 0) {
        toast.success(`Successfully removed ${result.duplicatesRemoved} duplicate assignments`);
        onCleanupComplete?.();
      } else if (result.duplicatesRemoved === 0) {
        toast.info('No duplicate assignments found to clean up');
      }
      
      setShowDialog(false);
      setShowReport(false);
    } catch (error) {
      console.error('Cleanup failed:', error);
      toast.error('Failed to clean up duplicates');
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleShowReport}
          disabled={isLoadingReport}
        >
          {isLoadingReport ? (
            <LoadingSpinner className="mr-2 h-4 w-4" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Check Duplicates
        </Button>
        
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDialog(true)}
          disabled={isCleaningUp}
        >
          {isCleaningUp ? (
            <LoadingSpinner className="mr-2 h-4 w-4" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Clean Duplicates
        </Button>
      </div>

      {/* Duplicates Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Duplicate Document Assignments Report
            </DialogTitle>
            <DialogDescription>
              Documents that are assigned to multiple phases
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-auto">
            {duplicatesReport?.duplicates.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Found <Badge variant="destructive">{duplicatesReport.totalDuplicates}</Badge> duplicate assignments
                </div>
                
                {duplicatesReport.duplicates.map((duplicate: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{duplicate.documentName}</h4>
                    <div className="text-sm text-muted-foreground mb-2">
                      Assigned to {duplicate.assignmentCount} phases:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {duplicate.phases.map((phase: any) => (
                        <Badge key={phase.id} variant="outline">
                          {phase.name} (pos: {phase.position})
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No duplicate assignments found
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReport(false)}>
              Close
            </Button>
            {duplicatesReport?.totalDuplicates > 0 && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  setShowReport(false);
                  setShowDialog(true);
                }}
              >
                Clean Up Duplicates
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cleanup Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Clean Up Duplicate Document Assignments
            </DialogTitle>
            <DialogDescription>
              This will remove duplicate document assignments from phases, keeping only the assignment in the earliest phase (lowest position number).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Warning:</p>
                  <p className="text-yellow-700">
                    This action cannot be undone. Documents will be kept in their earliest assigned phase only.
                  </p>
                </div>
              </div>
            </div>
            
            {lastCleanupResult && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Last cleanup: {lastCleanupResult.duplicatesRemoved} duplicates removed from {lastCleanupResult.documentsProcessed} documents
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCleanup}
              disabled={isCleaningUp}
            >
              {isCleaningUp ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Cleaning...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clean Up Duplicates
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
