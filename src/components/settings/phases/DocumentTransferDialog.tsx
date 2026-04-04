
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, FileText } from 'lucide-react';
import { PhaseCleanupService } from '@/services/phaseCleanupService';
import { toast } from 'sonner';

interface DocumentTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onTransferComplete: () => void;
}

interface PhaseWithDocs {
  id: string;
  name: string;
  document_count: number;
  created_at: string;
}

export function DocumentTransferDialog({
  open,
  onOpenChange,
  companyId,
  onTransferComplete
}: DocumentTransferDialogProps) {
  const [phases, setPhases] = useState<PhaseWithDocs[]>([]);
  const [sourcePhaseId, setSourcePhaseId] = useState<string>('');
  const [targetPhaseId, setTargetPhaseId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && companyId) {
      loadPhases();
    }
  }, [open, companyId]);

  const loadPhases = async () => {
    try {
      setLoading(true);
      const phasesData = await PhaseCleanupService.getPhasesWithDocumentCounts(companyId);
      setPhases(phasesData);
    } catch (error) {
      console.error('Error loading phases:', error);
      toast.error('Failed to load phases');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!sourcePhaseId || !targetPhaseId) {
      toast.error('Please select both source and target phases');
      return;
    }

    if (sourcePhaseId === targetPhaseId) {
      toast.error('Source and target phases cannot be the same');
      return;
    }

    try {
      setIsTransferring(true);
      await PhaseCleanupService.transferDocuments(sourcePhaseId, targetPhaseId);
      onTransferComplete();
      onOpenChange(false);
      setSourcePhaseId('');
      setTargetPhaseId('');
    } catch (error) {
      console.error('Error transferring documents:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  const sourcePhase = phases.find(p => p.id === sourcePhaseId);
  const targetPhase = phases.find(p => p.id === targetPhaseId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Documents Between Phases</DialogTitle>
          <DialogDescription>
            Move all documents from one phase to another. This is useful when consolidating duplicate phases.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Source Phase (documents will be moved FROM here)</label>
            <Select value={sourcePhaseId} onValueChange={setSourcePhaseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select source phase..." />
              </SelectTrigger>
              <SelectContent>
                {phases
                  .filter(phase => phase.document_count > 0)
                  .map(phase => (
                    <SelectItem key={phase.id} value={phase.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{phase.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          <FileText className="h-3 w-3 mr-1" />
                          {phase.document_count}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Target Phase (documents will be moved TO here)</label>
            <Select value={targetPhaseId} onValueChange={setTargetPhaseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target phase..." />
              </SelectTrigger>
              <SelectContent>
                {phases
                  .filter(phase => phase.id !== sourcePhaseId)
                  .map(phase => (
                    <SelectItem key={phase.id} value={phase.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{phase.name}</span>
                        <Badge variant="outline" className="ml-2">
                          <FileText className="h-3 w-3 mr-1" />
                          {phase.document_count}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {sourcePhase && targetPhase && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Preview:</strong> {sourcePhase.document_count} documents will be moved from 
                "{sourcePhase.name}" to "{targetPhase.name}"
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleTransfer}
            disabled={!sourcePhaseId || !targetPhaseId || isTransferring || loading}
          >
            {isTransferring ? 'Transferring...' : 'Transfer Documents'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
