import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { File, Eye, FileEdit, Trash2, Send, Pencil, MoreHorizontal, Copy, FileDown, Loader2 } from "lucide-react";
import { DocumentPdfPreviewService } from '@/services/documentPdfPreviewService';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CompanyDocument } from '@/hooks/useCompanyDocuments';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyDateFormat } from '@/hooks/useCompanyDateFormat';
import { useNavigate } from 'react-router-dom';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { RefDocsBadge } from '@/components/common/RefDocsBadge';
import { SendToReviewGroupDialog } from './SendToReviewGroupDialog';
import { CopyDocumentDialog } from '@/components/product/documents/CopyDocumentDialog';
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

interface CompanyDocumentCardProps {
  document: CompanyDocument;
  onView?: (document: CompanyDocument) => void;
  onEdit?: (document: CompanyDocument) => void;
  onDelete?: (document: CompanyDocument) => void;
  onCopy?: (document: CompanyDocument) => void;
  onCreateInStudio?: (document: CompanyDocument) => void;
  isDeleting?: boolean;
  disabled?: boolean;
  companyId?: string;
}

export function CompanyDocumentCard({
  document,
  onView,
  onEdit,
  onDelete,
  onCopy,
  onCreateInStudio,
  isDeleting = false,
  disabled = false,
  companyId
}: CompanyDocumentCardProps) {
  // Get company date format
  const { formatDate } = useCompanyDateFormat(companyId);
  const navigate = useNavigate();
  const { activeCompanyRole } = useCompanyRole();
  const [reviewerGroupNames, setReviewerGroupNames] = useState<string[]>([]);
  const [isLoadingReviewers, setIsLoadingReviewers] = useState(false);
  const [authorNames, setAuthorNames] = useState<string[]>([]);
  const [isLoadingAuthors, setIsLoadingAuthors] = useState(false);
  const [approverName, setApproverName] = useState<string | null>(null);
  const [isLoadingApprover, setIsLoadingApprover] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);
  const [showSendReview, setShowSendReview] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleInlineEdit = () => {
    onCreateInStudio?.(document);
  };

  // Fetch author names when authors_ids change
  useEffect(() => {
    const fetchAuthors = async () => {
      const authorsIds = document.authors_ids;

      if (!authorsIds || !Array.isArray(authorsIds) || authorsIds.length === 0) {
        setAuthorNames([]);
        return;
      }

      setIsLoadingAuthors(true);
      try {
        // First try to get from document_authors table
        const { data: docAuthors, error: docAuthorsError } = await supabase
          .from('document_authors')
          .select('id, name, last_name')
          .in('id', authorsIds);

        if (!docAuthorsError && docAuthors && docAuthors.length > 0) {
          const names = docAuthors.map(a =>
            [a.name, a.last_name].filter(Boolean).join(' ') || 'Unknown'
          );
          setAuthorNames(names);
        } else {
          // Fallback: try user_profiles for user IDs
          const { data: userProfiles, error: userError } = await supabase
            .from('user_profiles')
            .select('id, first_name, last_name, email')
            .in('id', authorsIds);

          if (!userError && userProfiles && userProfiles.length > 0) {
            const names = userProfiles.map(u =>
              [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email || 'Unknown'
            );
            setAuthorNames(names);
          } else {
            setAuthorNames([]);
          }
        }
      } catch {
        setAuthorNames([]);
      } finally {
        setIsLoadingAuthors(false);
      }
    };

    fetchAuthors();
  }, [document.authors_ids]);

  // Fetch reviewer group names when reviewer_group_ids change
  useEffect(() => {
    const fetchReviewerGroups = async () => {
      const reviewerGroupIds = document.reviewer_group_ids;

      if (!reviewerGroupIds || !Array.isArray(reviewerGroupIds) || reviewerGroupIds.length === 0) {
        setReviewerGroupNames([]);
        return;
      }

      setIsLoadingReviewers(true);
      try {
        const { data: reviewerGroups, error } = await supabase
          .from('reviewer_groups')
          .select('id, name')
          .in('id', reviewerGroupIds);

        if (error) {
          setReviewerGroupNames([]);
        } else if (reviewerGroups && reviewerGroups.length > 0) {
          setReviewerGroupNames(reviewerGroups.map(g => g.name));
        } else {
          setReviewerGroupNames([]);
        }
      } catch {
        setReviewerGroupNames([]);
      } finally {
        setIsLoadingReviewers(false);
      }
    };

    fetchReviewerGroups();
  }, [document.reviewer_group_ids]);

  // Fetch approver name when approved_by changes
  useEffect(() => {
    const fetchApprover = async () => {
      const approvedBy = document.approved_by;

      if (!approvedBy) {
        setApproverName(null);
        return;
      }

      setIsLoadingApprover(true);
      try {
        const { data: userProfile, error } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, email')
          .eq('id', approvedBy)
          .single();

        if (!error && userProfile) {
          const name = [userProfile.first_name, userProfile.last_name].filter(Boolean).join(' ') || userProfile.email || 'Unknown';
          setApproverName(name);
        } else {
          setApproverName(null);
        }
      } catch {
        setApproverName(null);
      } finally {
        setIsLoadingApprover(false);
      }
    };

    fetchApprover();
  }, [document.approved_by]);

  const hasUploadedFile = () => {
    return !!(document.file_path || document.file_name);
  };

  const getFileIcon = () => {
    if (!hasUploadedFile()) return null;
    const fileType = document.file_name?.split('.').pop()?.toLowerCase();
    if (fileType?.includes('pdf')) return <File className="h-4 w-4 text-red-500" />;
    if (fileType?.includes('doc')) return <File className="h-4 w-4 text-blue-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in review':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'n/a':
      case 'not applicable':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      case 'not started':
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const hasFile = hasUploadedFile();
  const formattedDate = document.updated_at
    ? formatDate(document.updated_at)
    : 'No date';
  const formattedApprovalDate = document.approval_date
    ? formatDate(document.approval_date)
    : null;
  // Format document date - show date if available, otherwise fallback to created_at
  const formattedDocumentDate = ((document as any).date || document.created_at)
    ? formatDate((document as any).date || document.created_at)
    : null;

  // Determine card background based on status - green for Approved/Report, blue for others
  const isApproved = document.status?.toLowerCase() === 'approved' || document.status?.toLowerCase() === 'completed' || document.status?.toLowerCase() === 'report';
  const cardBgClass = isApproved
    ? "flex items-center justify-between p-4 border rounded-lg bg-emerald-100 border-emerald-300"
    : "flex items-center justify-between p-4 border rounded-lg bg-blue-50 border-blue-200";

  return (
    <>
    <div className={cardBgClass}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
            {document.document_type}
          </Badge>
          {document.sub_section && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
              {(document as any as { sub_section?: string }).sub_section}
            </Badge>
          )}
          <Badge
            variant="outline"
            className={`text-xs ${document.is_record
              ? 'bg-purple-50 text-purple-700 border-purple-300'
              : 'bg-blue-50 text-blue-700 border-blue-300'}`}
          >
            {document.is_record ? 'Record' : 'Document'}
          </Badge>
        </div>
        
        <h5 className="font-medium mb-2">
          {document.name}
        </h5>
        {document.description && (
          <h6 className="text-sm text-muted-foreground mb-2">{document.description}</h6>
        )}
        
        <div className="flex items-center gap-4 mt-2">
          {formattedDocumentDate && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Date:</span>
              <span className="text-xs font-semibold">{formattedDocumentDate}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Last Updated:</span>
            <span className="text-xs">{formattedDate}</span>
          </div>
          {formattedApprovalDate && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Approved:</span>
              <span className="text-xs text-green-700 font-medium">{formattedApprovalDate}</span>
            </div>
          )}
          {document.tech_applicability && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Applies to:</span>
              <span className="text-xs">{document.tech_applicability}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Reviewers:</span>
          {isLoadingReviewers ? (
            <span className="text-xs text-muted-foreground">Loading...</span>
          ) : reviewerGroupNames.length > 0 ? (
            <div className="flex items-center gap-1 flex-wrap">
              {reviewerGroupNames.map((groupName, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                >
                  {groupName}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">No reviewers</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Authors:</span>
          {isLoadingAuthors ? (
            <span className="text-xs text-muted-foreground">Loading...</span>
          ) : authorNames.length > 0 ? (
            <div className="flex items-center gap-1 flex-wrap">
              {authorNames.map((name, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                >
                  {name}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">No authors</span>
          )}
        </div>

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {document.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs bg-teal-50 text-teal-700 border-teal-200"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Reference Documents Badge */}
        {companyId && document.reference_document_ids && document.reference_document_ids.length > 0 && (
          <div className="mt-2">
            <RefDocsBadge referenceDocumentIds={document.reference_document_ids} companyId={companyId} />
          </div>
        )}

        {/* Approval Log Section */}
        {isApproved && (formattedApprovalDate || approverName || document.approval_note) && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs font-medium text-green-800">Approval Log</span>
            </div>
            <div className="text-xs text-green-700 space-y-0.5">
              {approverName && (
                <div>
                  <span className="text-green-600">Approved by:</span>{' '}
                  <span className="font-medium">{isLoadingApprover ? 'Loading...' : approverName}</span>
                  {reviewerGroupNames.length > 0 && (
                    <span className="text-green-600"> - as reviewer ({reviewerGroupNames.join(', ')})</span>
                  )}
                </div>
              )}
              {formattedApprovalDate && (
                <div>
                  <span className="text-green-600">Approved on:</span>{' '}
                  <span className="font-medium">{formattedApprovalDate}</span>
                </div>
              )}
              {reviewerGroupNames.length > 0 && (
                <div>
                  <span className="text-green-600 italic">Done via the review process</span>
                </div>
              )}
              {document.approval_note && (
                <div className="mt-1 pt-1 border-t border-green-200">
                  <span className="text-green-600">Approval Note:</span>{' '}
                  <span className="italic">{document.approval_note}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      
      <div className="flex flex-col items-end gap-2 space-y-8">
      <Badge 
            variant="outline" 
            className={`text-xs ${getStatusBadgeStyles(document.status)}`}
          >
            {document.status}
          </Badge>
        <div className="flex items-center gap-3">
          {/* Studio */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleInlineEdit}
            disabled={isDeleting || disabled}
            className="h-8 px-3 bg-background"
            title={document.document_reference ? "Edit Document" : "Create Document"}
          >
            <FileEdit className={`h-4 w-4 ${document.document_reference?.startsWith('DS-') && document.status?.toLowerCase() !== 'approved' ? 'text-amber-500' : 'text-primary'}`} />
          </Button>

          {/* View */}
          {hasFile && onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(document)}
              disabled={isDeleting || disabled}
              className="h-8 px-3 bg-background"
              title="View File"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}

          {/* Send for Review */}
          {companyId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSendReview(true)}
              disabled={isDeleting || disabled}
              className="h-8 px-3 bg-background"
              title="Send for Review"
            >
              <Send className="h-4 w-4 text-primary" />
            </Button>
          )}

          {/* 3-dot menu: Preview PDF, Edit, Copy & Delete */}
          {(onEdit || onCopy || onDelete || companyId) && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isDeleting || disabled} className="h-8 px-3 bg-background">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {companyId && document.status === 'Approved' && (
                  <DropdownMenuItem
                    disabled={pdfLoading}
                    onSelect={(e) => {
                      e.preventDefault();
                      (async () => {
                        setPdfLoading(true);
                        try {
                          await DocumentPdfPreviewService.generatePreviewPdf(document.id, companyId);
                        } catch (error) {
                          console.error('PDF preview error:', error);
                          toast.error('Failed to generate PDF preview');
                        } finally {
                          setPdfLoading(false);
                        }
                      })();
                    }}
                  >
                    {pdfLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4 mr-2" />
                    )}
                    Preview PDF
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onSelect={() => { setTimeout(() => onEdit(document), 0); }}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onSelect={() => { if (!disabled) setTimeout(() => setShowDeleteConfirm(true), 0); }}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
                {onCopy && (
                  <DropdownMenuItem onSelect={() => { setTimeout(() => setShowCopyConfirm(true), 0); }}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>


    {/* Delete Confirmation Dialog */}
    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Document</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>"{document.name}"</strong>? This action cannot be undone and the document will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (onDelete) onDelete(document);
              setShowDeleteConfirm(false);
            }}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <CopyDocumentDialog
      open={showCopyConfirm}
      onOpenChange={setShowCopyConfirm}
      documentName={document.name}
      onConfirm={() => {
        if (onCopy) onCopy(document);
        setShowCopyConfirm(false);
      }}
    />

    {companyId && showSendReview && (
      <SendToReviewGroupDialog
        open={showSendReview}
        onOpenChange={setShowSendReview}
        documentId={document.id}
        documentName={document.name}
        companyId={companyId}
        existingGroupIds={document.reviewer_group_ids || []}
      />
    )}
    </>
  );
}
