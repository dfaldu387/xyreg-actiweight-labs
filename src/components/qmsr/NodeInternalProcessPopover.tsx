/**
 * NodeInternalProcessPopover
 * 
 * Modal popup showing internal process details for a QMS node,
 * with editable process description and linked SOP documents.
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Edit2,
  Save,
  X,
  Plus,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertTriangle,
  Link2,
  Unlink,
  Loader2,
} from 'lucide-react';
import { useQmsNodeData, useAvailableSOPs } from '@/hooks/useQmsNodeProcess';
import { HELIX_NODE_CONFIGS } from '@/config/helixNodeConfig';

interface NodeInternalProcessPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  companyId: string;
}

const statusIcons: Record<string, React.ReactNode> = {
  approved: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
  draft: <Clock className="h-3.5 w-3.5 text-amber-500" />,
  'in review': <Clock className="h-3.5 w-3.5 text-blue-500" />,
  pending: <Clock className="h-3.5 w-3.5 text-slate-400" />,
};

const statusColors: Record<string, string> = {
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  'in review': 'bg-blue-50 text-blue-700 border-blue-200',
  pending: 'bg-slate-50 text-slate-600 border-slate-200',
};

export function NodeInternalProcessPopover({
  isOpen,
  onClose,
  nodeId,
  companyId,
}: NodeInternalProcessPopoverProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [selectedSopId, setSelectedSopId] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);

  // Get node config
  const nodeConfig = HELIX_NODE_CONFIGS.find(n => n.id === nodeId);

  // Fetch data
  const {
    process,
    sops,
    isLoading,
    saveProcess,
    linkSOP,
    unlinkSOP,
  } = useQmsNodeData(companyId, nodeId);

  const { data: availableSOPs, isLoading: loadingAvailable } = useAvailableSOPs(companyId);

  // Reset edit state when opening
  useEffect(() => {
    if (isOpen) {
      setIsEditing(false);
      setEditedDescription(process?.process_description || '');
      setSelectedSopId('');
    }
  }, [isOpen, process?.process_description]);

  const handleSave = async () => {
    const success = await saveProcess.mutateAsync({ description: editedDescription });
    if (success) {
      setIsEditing(false);
    }
  };

  const handleLinkSOP = async () => {
    if (!selectedSopId) return;
    setIsLinking(true);
    await linkSOP.mutateAsync(selectedSopId);
    setSelectedSopId('');
    setIsLinking(false);
  };

  const handleUnlinkSOP = async (linkId: string) => {
    await unlinkSOP.mutateAsync(linkId);
  };

  // Filter out already-linked SOPs
  const linkedSopIds = new Set(sops.map(s => s.document_id));
  const unlinkedSOPs = (availableSOPs || []).filter(sop => !linkedSopIds.has(sop.id));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-purple-600" />
            Internal Process: {nodeConfig?.label || nodeId}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            ISO 13485 Clause {nodeConfig?.isoClause}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Process Description Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Process Overview</h4>
                {!isEditing ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditedDescription(process?.process_description || '');
                      setIsEditing(true);
                    }}
                    className="h-7 gap-1.5"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                      className="h-7"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saveProcess.isPending}
                      className="h-7 gap-1.5"
                    >
                      {saveProcess.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      Save
                    </Button>
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : isEditing ? (
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Describe the internal process for this QMS node..."
                  className="min-h-[120px] text-sm"
                />
              ) : (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {process?.process_description || (
                      <span className="italic text-slate-400">
                        No process description defined yet. Click Edit to add one.
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Linked SOPs Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-purple-500" />
                  Related SOPs
                </h4>
              </div>

              {sops.length > 0 ? (
                <div className="space-y-2">
                  {sops.map((sopLink) => {
                    const doc = sopLink.document;
                    const status = doc?.status?.toLowerCase() || 'pending';
                    return (
                      <div
                        key={sopLink.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {statusIcons[status] || statusIcons.pending}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {doc?.name || 'Unknown Document'}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge
                                variant="outline"
                                className={cn('text-[10px] h-5', statusColors[status] || statusColors.pending)}
                              >
                                {doc?.status || 'Pending'}
                              </Badge>
                              {doc?.document_type && (
                                <span className="text-[10px] text-muted-foreground">
                                  {doc.document_type}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {doc?.file_path && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="View SOP"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleUnlinkSOP(sopLink.id)}
                            title="Unlink SOP"
                          >
                            <Unlink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-dashed bg-muted/20 text-center">
                  <p className="text-sm text-muted-foreground">
                    No SOPs linked to this node yet.
                  </p>
                </div>
              )}

              {/* Link new SOP */}
              {unlinkedSOPs.length > 0 && (
                <div className="flex items-center gap-2 pt-2">
                  <Select value={selectedSopId} onValueChange={setSelectedSopId}>
                    <SelectTrigger className="flex-1 h-9">
                      <SelectValue placeholder="Select an SOP to link..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unlinkedSOPs.map((sop) => (
                        <SelectItem key={sop.id} value={sop.id}>
                          {sop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={handleLinkSOP}
                    disabled={!selectedSopId || isLinking}
                    className="h-9 gap-1.5"
                  >
                    {isLinking ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Link
                  </Button>
                </div>
              )}

              {unlinkedSOPs.length === 0 && sops.length > 0 && (
                <p className="text-xs text-muted-foreground italic">
                  All available SOPs are linked to this node.
                </p>
              )}

              {!loadingAvailable && availableSOPs?.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No company SOP documents available. Create SOPs in Company Documents to link them here.
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
