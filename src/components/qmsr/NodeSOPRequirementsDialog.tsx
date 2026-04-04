/**
 * NodeSOPRequirementsDialog - Popup showing required SOPs for a QMS node
 * 
 * Displays:
 * 1. Required SOPs from the static mapping with track badges
 * 2. Status of each SOP in the company's document system
 * 3. Actions to create missing SOPs or view existing ones
 */

import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus, 
  ExternalLink,
  FileText,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  NODE_SOP_RECOMMENDATIONS, 
  TRACK_BADGE_STYLES,
  type SOPRecommendation,
  type SOPTrack 
} from '@/data/nodeSOPRecommendations';
import { useNodeSOPRequirements, type SOPRequirementStatus } from '@/hooks/useQmsNodeProcess';

interface NodeSOPRequirementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
  nodeLabel: string;
  isoClause?: string;
  companyId?: string;
  onCreateSOP?: (sopNumber: string, sopName: string) => void;
  onViewSOP?: (documentId: string) => void;
}

function TrackBadge({ track }: { track: SOPTrack }) {
  const styles = TRACK_BADGE_STYLES[track];
  return (
    <Badge 
      variant="outline" 
      className={cn(
        'text-[10px] font-bold px-1.5 py-0 h-5',
        styles.bg, 
        styles.text,
        'border-transparent'
      )}
    >
      {track}
    </Badge>
  );
}

function StatusBadge({ status }: { status: SOPRequirementStatus['status'] }) {
  switch (status) {
    case 'approved':
      return (
        <div className="flex items-center gap-1 text-emerald-600">
          <CheckCircle className="h-3.5 w-3.5" />
          <span className="text-[11px] font-medium">Approved</span>
        </div>
      );
    case 'draft':
    case 'in-review':
      return (
        <div className="flex items-center gap-1 text-amber-600">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-[11px] font-medium">
            {status === 'draft' ? 'Draft' : 'In Review'}
          </span>
        </div>
      );
    case 'missing':
      return (
        <div className="flex items-center gap-1 text-red-500">
          <AlertCircle className="h-3.5 w-3.5 animate-pulse" />
          <span className="text-[11px] font-medium">Not Created</span>
        </div>
      );
    default:
      return null;
  }
}

function SOPRow({ 
  sop, 
  status,
  onCreateSOP,
  onViewSOP,
}: { 
  sop: SOPRecommendation;
  status: SOPRequirementStatus;
  onCreateSOP?: (sopNumber: string, sopName: string) => void;
  onViewSOP?: (documentId: string) => void;
}) {
  const isMissing = status.status === 'missing';

  return (
    <div 
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border',
        isMissing ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-white'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
          <span className="font-mono text-sm font-semibold text-slate-700">
            {sop.sopNumber}
          </span>
          <TrackBadge track={sop.track} />
        </div>
        <p className="text-sm font-medium text-slate-900 truncate">
          {sop.sopName}
        </p>
        <p className="text-xs text-slate-500 line-clamp-1">
          {sop.description}
        </p>
      </div>
      
      <div className="flex items-center gap-3 ml-3 flex-shrink-0">
        <StatusBadge status={status.status} />
        
        {isMissing ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => onCreateSOP?.(sop.sopNumber, sop.sopName)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Create
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-slate-600 hover:text-slate-900"
            onClick={() => status.documentId && onViewSOP?.(status.documentId)}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View
          </Button>
        )}
      </div>
    </div>
  );
}

export function NodeSOPRequirementsDialog({
  open,
  onOpenChange,
  nodeId,
  nodeLabel,
  isoClause,
  companyId,
  onCreateSOP,
  onViewSOP,
}: NodeSOPRequirementsDialogProps) {
  const recommendations = NODE_SOP_RECOMMENDATIONS[nodeId] || [];
  const { data: sopStatuses, isLoading } = useNodeSOPRequirements(companyId, nodeId);

  // Count statistics
  const totalRequired = recommendations.length;
  const approvedCount = sopStatuses?.filter(s => s.status === 'approved').length ?? 0;
  const missingCount = sopStatuses?.filter(s => s.status === 'missing').length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Required SOPs for: {nodeLabel}
          </DialogTitle>
          {isoClause && (
            <DialogDescription className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              ISO 13485 Clause {isoClause}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Stats summary */}
        <div className="flex items-center gap-4 py-2 px-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Required:</span>
            <span className="text-sm font-semibold text-slate-900">{totalRequired}</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600">{approvedCount}</span>
          </div>
          {missingCount > 0 && (
            <>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                <span className="text-sm font-medium text-red-600">{missingCount} missing</span>
              </div>
            </>
          )}
        </div>

        {/* SOP list */}
        <ScrollArea className="max-h-[400px] pr-2">
          <div className="space-y-2">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Loading SOP status...
              </div>
            ) : recommendations.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No SOP requirements defined for this node.
              </div>
            ) : (
              recommendations.map((sop) => {
                const status = sopStatuses?.find(s => s.sopNumber === sop.sopNumber) ?? {
                  sopNumber: sop.sopNumber,
                  status: 'missing' as const,
                };
                return (
                  <SOPRow
                    key={sop.sopNumber}
                    sop={sop}
                    status={status}
                    onCreateSOP={onCreateSOP}
                    onViewSOP={onViewSOP}
                  />
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer hint */}
        {missingCount > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center">
              Create missing SOPs to achieve full compliance for this process area.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
