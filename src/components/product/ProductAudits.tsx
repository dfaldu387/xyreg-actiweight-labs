import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Info, Plus, Paperclip, FileSearch } from "lucide-react";
import { getStatusColor } from "@/utils/statusUtils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { CategoryDetailModal } from "./CategoryDetailModal";
import { AddAuditDialog } from "./AddAuditDialog";
import { linkAuditToGapItem } from "@/services/auditService";

interface Audit {
  id?: string;
  name: string;
  status: "Completed" | "Scheduled" | "Unscheduled";
  date?: string;
  documents?: string[];
}

interface ProductAuditsProps {
  audits: Audit[];
  productId?: string;
  onAddAudit?: (audit: { name: string, date: Date, documents?: string[] }) => void;
  onAddDocumentToAudit?: (auditName: string, document: string) => void;
  gapItems?: { id: string; clauseId: string; clauseSummary: string; framework: string }[];
}

export function ProductAudits({ 
  audits, 
  productId,
  onAddAudit, 
  onAddDocumentToAudit,
  gapItems = []
}: ProductAuditsProps) {
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [addAuditDialogOpen, setAddAuditDialogOpen] = useState(false);
  const [linkGapDialogOpen, setLinkGapDialogOpen] = useState(false);

  const handleAuditClick = (audit: Audit) => {
    setSelectedAudit(audit);
    setDetailModalOpen(true);
  };

  const handleAddAudit = (name: string, date: Date) => {
    if (onAddAudit) {
      console.log("Adding audit in ProductAudits:", { name, date });
      onAddAudit({ name, date });
    } else {
      console.warn("onAddAudit callback is undefined");
    }
    setAddAuditDialogOpen(false);
  };

  const handleAddDocument = (auditName: string, document: string) => {
    if (onAddDocumentToAudit) {
      console.log("Adding document to audit:", { auditName, document });
      onAddDocumentToAudit(auditName, document);
    } else {
      console.warn("onAddDocumentToAudit callback is undefined");
    }
  };

  const handleLinkGapItem = async (auditId: string, gapItemId: string) => {
    if (auditId && gapItemId) {
      await linkAuditToGapItem(auditId, 'product', gapItemId);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Audits
            </h4>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
              onClick={() => setAddAuditDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Audit
            </Button>
          </div>
          <ul className="space-y-2">
            {audits.map((audit, index) => (
              <li 
                key={index} 
                className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                onClick={() => handleAuditClick(audit)}
              >
                <div className="flex items-center gap-2">
                  <span>{audit.name}</span>
                  {audit.documents && audit.documents.length > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      {audit.documents.length}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {audit.date && <span className="text-xs text-muted-foreground">Date: {audit.date}</span>}
                  {gapItems && gapItems.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAudit(audit);
                              setLinkGapDialogOpen(true);
                            }}
                          >
                            <FileSearch className="h-4 w-4" />
                            <span className="sr-only">Link to Gap Item</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Link to Gap Analysis Item</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Info</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View audit details</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Badge className={getStatusColor(audit.status)}>{audit.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Existing detail modal */}
      {selectedAudit && (
        <CategoryDetailModal 
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          category={{
            id: selectedAudit.name,
            title: selectedAudit.name,
            type: "audit",
            status: selectedAudit.status,
            data: {
              date: selectedAudit.date,
              documents: selectedAudit.documents || [],
              evidenceLinks: [`${selectedAudit.name}_report.pdf`, "Audit_checklist.pdf"],
              comments: [
                {
                  author: "Maria Garcia",
                  comment: "The audit was completed successfully with minor findings.",
                  timestamp: "2025-04-10"
                }
              ],
              onAddDocument: (document: string) => handleAddDocument(selectedAudit.name, document)
            }
          }}
        />
      )}

      {/* Dialog for adding a new audit */}
      <AddAuditDialog
        open={addAuditDialogOpen}
        onOpenChange={setAddAuditDialogOpen}
        onAddAudit={handleAddAudit}
      />

      {/* Dialog for linking gap items (this would need to be created) */}
      {selectedAudit && selectedAudit.id && linkGapDialogOpen && (
        <Dialog open={linkGapDialogOpen} onOpenChange={setLinkGapDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link Gap Analysis Item</DialogTitle>
              <DialogDescription>
                Select gap analysis items to link to this audit
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {gapItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between border p-2 rounded">
                  <div>
                    <div className="font-medium text-sm">{item.clauseId}</div>
                    <div className="text-xs text-muted-foreground">{item.clauseSummary}</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      handleLinkGapItem(selectedAudit.id!, item.id);
                      setLinkGapDialogOpen(false);
                    }}
                  >
                    Link
                  </Button>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLinkGapDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// Import the Dialog components needed for the GapItem linking feature
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
