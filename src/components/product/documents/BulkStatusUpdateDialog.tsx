import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import { CircleCheckBig, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  name: string;
  status?: string;
  document_type?: string;
  phase_name?: string;
}

interface BulkStatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: Document[];
  companyId: string;
  productId: string;
  onUpdateComplete?: () => void;
}

const STATUS_OPTIONS = [
  { value: 'In Review', label: 'In Review', color: 'bg-yellow-500' },
  { value: 'Approved', label: 'Approved', color: 'bg-green-500' },
  { value: 'Rejected', label: 'Rejected', color: 'bg-red-500' },
  { value: 'N/A', label: 'N/A', color: 'bg-gray-300' },
  { value: 'Report', label: 'Report', color: 'bg-green-500' },
];

const steps = ['Select Documents', 'Choose Status', 'Confirm & Update'];

export function BulkStatusUpdateDialog({
  open,
  onOpenChange,
  documents,
  companyId,
  productId,
  onUpdateComplete
}: BulkStatusUpdateDialogProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [documentSearch, setDocumentSearch] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateResults, setUpdateResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  // Filter documents based on search
  const filteredDocuments = useMemo(() => {
    if (!documentSearch.trim()) return documents;
    const search = documentSearch.toLowerCase();
    return documents.filter(doc =>
      doc.name.toLowerCase().includes(search) ||
      doc.document_type?.toLowerCase().includes(search) ||
      doc.phase_name?.toLowerCase().includes(search) ||
      doc.status?.toLowerCase().includes(search)
    );
  }, [documents, documentSearch]);

  // Group documents by current status for summary
  const documentsByStatus = useMemo(() => {
    const selected = documents.filter(d => selectedDocuments.has(d.id));
    const grouped: Record<string, number> = {};
    selected.forEach(doc => {
      const status = doc.status || 'Not Started';
      grouped[status] = (grouped[status] || 0) + 1;
    });
    return grouped;
  }, [documents, selectedDocuments]);

  const handleDocumentToggle = (docId: string) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const handleSelectAllDocuments = () => {
    if (selectedDocuments.size === filteredDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(filteredDocuments.map(d => d.id)));
    }
  };

  const handleSelectByStatus = (status: string) => {
    const docsWithStatus = documents.filter(d => (d.status || 'Not Started') === status);
    setSelectedDocuments(new Set(docsWithStatus.map(d => d.id)));
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleUpdate = async () => {
    if (selectedDocuments.size === 0 || !targetStatus) return;

    setIsUpdating(true);
    setUpdateProgress(0);
    setUpdateResults({ success: 0, failed: 0 });

    const totalOperations = selectedDocuments.size;
    let completed = 0;
    let successCount = 0;
    let failedCount = 0;

    const selectedDocs = documents.filter(d => selectedDocuments.has(d.id));

    for (const doc of selectedDocs) {
      try {
        // Try to update in phase_assigned_document_template first
        const { error: phaseError } = await (supabase as any)
          .from('phase_assigned_document_template')
          .update({
            status: targetStatus,
            updated_at: new Date().toISOString(),
            // Set approval_date if status is Approved
            ...(targetStatus === 'Approved' ? { approval_date: new Date().toISOString() } : {})
          })
          .eq('id', doc.id);

        if (phaseError) {
          // Try documents table as fallback
          const { error: docError } = await (supabase as any)
            .from('documents')
            .update({
              status: targetStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', doc.id);

          if (docError) {
            console.error('Error updating document status:', docError);
            failedCount++;
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
      } catch (error) {
        console.error('Error updating document:', error);
        failedCount++;
      }

      completed++;
      setUpdateProgress(Math.round((completed / totalOperations) * 100));
      setUpdateResults({ success: successCount, failed: failedCount });
    }

    setIsUpdating(false);

    if (successCount > 0) {
      toast.success(`Successfully updated ${successCount} document(s) to "${targetStatus}"`);
    }
    if (failedCount > 0) {
      toast.error(`Failed to update ${failedCount} document(s)`);
    }

    // Move to completion step
    setActiveStep(3);
    onUpdateComplete?.();
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedDocuments(new Set());
    setTargetStatus('');
    setDocumentSearch('');
    setUpdateProgress(0);
    setUpdateResults({ success: 0, failed: 0 });
    onOpenChange(false);
  };

  const canProceedFromStep = (step: number) => {
    switch (step) {
      case 0:
        return selectedDocuments.size > 0;
      case 1:
        return !!targetStatus;
      case 2:
        return !isUpdating;
      default:
        return true;
    }
  };

  const getStatusColor = (status: string) => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    return option?.color || 'bg-gray-400';
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'report':
        return 'default';
      case 'in review':
      case 'under review':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CircleCheckBig className="h-5 w-5" />
            Bulk Status Update
          </DialogTitle>
          <DialogDescription>
            Update status for multiple documents at once
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <Stepper steps={steps} currentStep={activeStep + 1} className="mb-4 max-w-3xl mx-auto" />

        <div className="flex-1 overflow-y-auto px-1">
          {activeStep === 0 && (
            <div className="space-y-4 p-1">
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllDocuments}
                >
                  {selectedDocuments.size === filteredDocuments.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              {/* Quick select by status */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Quick select:</span>
                {STATUS_OPTIONS.map(status => {
                  const count = documents.filter(d => (d.status || 'Not Started') === status.value).length;
                  if (count === 0) return null;
                  return (
                    <Badge
                      key={status.value}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleSelectByStatus(status.value)}
                    >
                      <span className={cn("w-2 h-2 rounded-full mr-1.5", status.color)} />
                      {status.label} ({count})
                    </Badge>
                  );
                })}
              </div>

              <p className="text-sm text-muted-foreground">
                {selectedDocuments.size} of {documents.length} documents selected
              </p>

              <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-accent/50 cursor-pointer"
                    onClick={() => handleDocumentToggle(doc.id)}
                  >
                    <Checkbox
                      checked={selectedDocuments.has(doc.id)}
                      onCheckedChange={() => handleDocumentToggle(doc.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {doc.document_type && (
                          <Badge variant="outline" className="text-xs">{doc.document_type}</Badge>
                        )}
                        {doc.phase_name && (
                          <Badge variant="secondary" className="text-xs">{doc.phase_name}</Badge>
                        )}
                        <Badge variant={getStatusBadgeVariant(doc.status || 'Not Started')} className="text-xs">
                          {doc.status || 'Not Started'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredDocuments.length === 0 && (
                  <div className="p-6 text-center text-muted-foreground">
                    No documents found
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Choose Status */}
          {activeStep === 1 && (
            <div className="space-y-4 mb-4 p-1">
              <Alert>
                <AlertDescription>
                  Select the new status for <strong>{selectedDocuments.size}</strong> selected document(s).
                </AlertDescription>
              </Alert>

              {/* Current status breakdown */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Current status breakdown:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(documentsByStatus).map(([status, count]) => (
                    <Badge key={status} variant="secondary">
                      <span className={cn("w-2 h-2 rounded-full mr-1.5", getStatusColor(status))} />
                      {status}: {count}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">New Status</label>
                <Select value={targetStatus} onValueChange={setTargetStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <span className={cn("w-3 h-3 rounded-full", status.color)} />
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {targetStatus && (
                <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
                  <AlertDescription>
                    All {selectedDocuments.size} selected document(s) will be updated to <strong>"{targetStatus}"</strong> status.
                    {targetStatus === 'Approved' && ' The approval date will be set to today.'}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 3: Confirm & Update */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  You are about to update <strong>{selectedDocuments.size}</strong> document(s) to <strong>"{targetStatus}"</strong> status.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm font-medium">Documents to update:</p>
                <div className="border rounded-lg max-h-[250px] overflow-y-auto p-2 space-y-1">
                  {documents.filter(d => selectedDocuments.has(d.id)).map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 py-1 text-sm">
                      <Badge variant="outline" className="text-xs min-w-[80px] justify-center">
                        {doc.status || 'Not Started'}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant={getStatusBadgeVariant(targetStatus)} className="text-xs min-w-[80px] justify-center">
                        {targetStatus}
                      </Badge>
                      <span className="truncate ml-2">{doc.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {isUpdating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Updating documents...</span>
                    <span>{updateProgress}%</span>
                  </div>
                  <Progress value={updateProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Success: {updateResults.success} | Failed: {updateResults.failed}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Complete */}
          {activeStep === 3 && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h3 className="text-lg font-semibold">Update Complete!</h3>
              <p className="text-muted-foreground text-center">
                Successfully updated {updateResults.success} document(s) to "{targetStatus}"
                {updateResults.failed > 0 && ` (${updateResults.failed} failed)`}
              </p>
              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          )}
        </div>

        {activeStep < 3 && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
              Cancel
            </Button>
            <div className="flex-1" />
            {activeStep > 0 && (
              <Button variant="outline" onClick={handleBack} disabled={isUpdating}>
                Back
              </Button>
            )}
            {activeStep < 2 && (
              <Button
                onClick={handleNext}
                disabled={!canProceedFromStep(activeStep)}
              >
                Next
              </Button>
            )}
            {activeStep === 2 && (
              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
