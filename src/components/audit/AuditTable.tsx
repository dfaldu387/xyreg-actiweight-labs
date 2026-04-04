import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, ChevronUp, ChevronDown, FileText, Eye, CheckCircle } from "lucide-react";
import { AuditStatusBadge } from "./AuditStatusBadge";
import { AuditMetadataTooltip } from "./AuditMetadataTooltip";
import { AuditDocumentManagementDialog } from "./AuditDocumentManagementDialog";
import { AuditDetailDialog } from "./AuditDetailDialog";
import { AuditCompletionDialog } from "./AuditCompletionDialog";
import { useTranslation } from "@/hooks/useTranslation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CompanyAudit, ProductAudit } from "@/types/audit";
import { calculateEffectiveAuditStatus } from "@/utils/auditStatusUtils";
import { 
  AuditorType, 
  AuditCategoryType, 
  matchesAuditorTypeFilter, 
  matchesCategoryFilter, 
  matchesLifecyclePhaseFilter 
} from "@/utils/auditTypeUtils";

type SortField = "audit_name" | "audit_type" | "lifecycle_phase" | "deadline_date" | "status";
type SortDirection = "asc" | "desc";

interface AuditTableProps {
  audits: (CompanyAudit | ProductAudit)[];
  type: "company" | "product";
  onEdit: (audit: CompanyAudit | ProductAudit) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<CompanyAudit | ProductAudit>) => Promise<void>;
  scopeFilter?: AuditCategoryType;
  lifecyclePhaseFilter?: string;
  auditorTypeFilter?: AuditorType;
  disabled?: boolean;
}

export function AuditTable({
  audits,
  type,
  onEdit,
  onDelete,
  onUpdate,
  scopeFilter = "all",
  lifecyclePhaseFilter = "all",
  auditorTypeFilter = "all",
  disabled = false
}: AuditTableProps) {
  const { lang } = useTranslation();
  const [sortField, setSortField] = useState<SortField>("deadline_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [auditToDelete, setAuditToDelete] = useState<string | null>(null);
  const [filteredAudits, setFilteredAudits] = useState<(CompanyAudit | ProductAudit)[]>(audits);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<CompanyAudit | ProductAudit | null>(null);

  // Apply filters when they change
  useEffect(() => {
    let filtered = audits;
    
    // Apply category filter
    if (scopeFilter !== "all") {
      filtered = filtered.filter(audit => 
        matchesCategoryFilter(audit.audit_type, scopeFilter)
      );
    }
    
    // Apply lifecycle phase filter for product audits
    if (type === "product" && lifecyclePhaseFilter !== "all") {
      filtered = filtered.filter(audit => {
        if ("lifecycle_phase" in audit) {
          if (lifecyclePhaseFilter === "all") {
            return true;
          }
          return audit.lifecycle_phase === lifecyclePhaseFilter;
        }
        return matchesLifecyclePhaseFilter(audit.audit_type, lifecyclePhaseFilter);
      });
    }
    
    // Apply auditor type filter
    if (auditorTypeFilter !== "all") {
      filtered = filtered.filter(audit => 
        matchesAuditorTypeFilter(audit.audit_type, auditorTypeFilter)
      );
    }
    
    setFilteredAudits(filtered);
  }, [audits, scopeFilter, lifecyclePhaseFilter, auditorTypeFilter, type]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const handleDeleteClick = (id: string) => {
    setAuditToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (auditToDelete) {
      onDelete(auditToDelete);
      setDeleteConfirmOpen(false);
    }
  };

  const handleDocumentManagement = (audit: CompanyAudit | ProductAudit) => {
    setSelectedAudit(audit);
    setDocumentDialogOpen(true);
  };

  const handleViewDetails = (audit: CompanyAudit | ProductAudit) => {
    setSelectedAudit(audit);
    setDetailDialogOpen(true);
  };

  const handleAuditNameClick = (audit: CompanyAudit | ProductAudit) => {
    setSelectedAudit(audit);
    setDetailDialogOpen(true);
  };

  const handleRecordCompletion = (audit: CompanyAudit | ProductAudit) => {
    setSelectedAudit(audit);
    setCompletionDialogOpen(true);
  };

  const handleCompletionUpdate = async (completionData: Partial<CompanyAudit | ProductAudit>) => {
    if (selectedAudit) {
      await onUpdate(selectedAudit.id, completionData);
    }
  };

  // Sort audits
  const sortedAudits = [...filteredAudits].sort((a, b) => {
    let valA, valB;

    switch (sortField) {
      case "audit_name":
        valA = a.audit_name;
        valB = b.audit_name;
        break;
      case "audit_type":
        valA = a.audit_type;
        valB = b.audit_type;
        break;
      case "lifecycle_phase":
        valA = "lifecycle_phase" in a ? a.lifecycle_phase || "" : "";
        valB = "lifecycle_phase" in b ? b.lifecycle_phase || "" : "";
        break;
      case "deadline_date":
        valA = a.deadline_date ? new Date(a.deadline_date).getTime() : Infinity;
        valB = b.deadline_date ? new Date(b.deadline_date).getTime() : Infinity;
        break;
      case "status":
        valA = a.status;
        valB = b.status;
        break;
    }

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Get actual document count for audit
  const getDocumentCount = (auditId: string) => {
    // TODO: Implement actual document count from audit_documents table
    return 0; // Show 0 until document linking is implemented
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("audit_name")}
              >
                <div className="flex items-center">
                  {lang('audits.table.columns.auditName')} {getSortIcon("audit_name")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("audit_type")}
              >
                <div className="flex items-center">
                  {lang('audits.table.columns.auditType')} {getSortIcon("audit_type")}
                </div>
              </TableHead>
              {type === "product" && (
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("lifecycle_phase")}
                >
                  <div className="flex items-center">
                    {lang('audits.table.columns.lifecyclePhase')} {getSortIcon("lifecycle_phase")}
                  </div>
                </TableHead>
              )}
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("deadline_date")}
              >
                <div className="flex items-center">
                  {lang('audits.table.columns.deadline')} {getSortIcon("deadline_date")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  {lang('audits.table.columns.status')} {getSortIcon("status")}
                </div>
              </TableHead>
              <TableHead>{lang('audits.table.columns.documents')}</TableHead>
              <TableHead>{lang('audits.table.columns.notes')}</TableHead>
              <TableHead className="text-right">{lang('audits.table.columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAudits.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={type === "product" ? 8 : 7}
                  className="h-24 text-center"
                >
                  {lang('audits.table.empty')}
                </TableCell>
              </TableRow>
            ) : (
              sortedAudits.map((audit) => {
                const effectiveStatus = calculateEffectiveAuditStatus(audit);
                return (
                  <TableRow key={audit.id}>
                    <TableCell>
                      <button 
                        onClick={() => handleAuditNameClick(audit)}
                        className="text-left hover:text-primary hover:underline transition-colors"
                      >
                        {audit.audit_name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {audit.audit_type}
                        <AuditMetadataTooltip auditType={audit.audit_type} />
                      </div>
                    </TableCell>
                    {type === "product" && (
                      <TableCell>
                        {"lifecycle_phase" in audit && audit.lifecycle_phase
                          ? audit.lifecycle_phase
                          : lang('audits.table.notApplicable')}
                      </TableCell>
                    )}
                    <TableCell>
                      {audit.deadline_date
                        ? format(new Date(audit.deadline_date), "MMM d, yyyy")
                        : lang('audits.table.deadlineNotSet')}
                    </TableCell>
                    <TableCell>
                      <AuditStatusBadge status={effectiveStatus} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          {getDocumentCount(audit.id)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDocumentManagement(audit)}
                          title={lang('audits.table.manageDocumentsTooltip')}
                          disabled={disabled}
                        >
                          {lang('audits.table.manage')}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={audit.notes || ""}>
                      {audit.notes || lang('audits.table.noNotes')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {effectiveStatus === "Completed" ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleViewDetails(audit)}
                            title={lang('audits.table.viewReportTooltip')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {lang('audits.table.viewReport')}
                          </Button>
                        ) : (
                          <>
                            {(effectiveStatus === "Planned" || effectiveStatus === "In Progress" || effectiveStatus === "Overdue") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => !disabled && handleRecordCompletion(audit)}
                                title={lang('audits.table.recordCompletionTooltip')}
                                disabled={disabled}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {lang('audits.table.complete')}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => !disabled && onEdit(audit)}
                              title={lang('audits.table.editTooltip')}
                              disabled={disabled}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => !disabled && handleDeleteClick(audit.id)}
                          title={lang('audits.table.deleteTooltip')}
                          disabled={disabled}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Document Management Dialog */}
      {selectedAudit && (
        <AuditDocumentManagementDialog
          open={documentDialogOpen}
          onOpenChange={setDocumentDialogOpen}
          auditName={selectedAudit.audit_name}
          auditId={selectedAudit.id}
        />
      )}

      {/* Audit Detail Dialog */}
      {selectedAudit && (
        <AuditDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          audit={selectedAudit}
        />
      )}

      {/* Audit Completion Dialog */}
      {selectedAudit && (
        <AuditCompletionDialog
          open={completionDialogOpen}
          onOpenChange={setCompletionDialogOpen}
          audit={selectedAudit}
          auditType={type}
          onComplete={handleCompletionUpdate}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang('audits.table.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{lang('audits.table.deleteConfirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {lang('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
