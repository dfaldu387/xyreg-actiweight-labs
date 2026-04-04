import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, FileText, User, Calendar, ArrowRight, RefreshCw, Filter, Search, MoreVertical, Eye, Edit, PlusCircle, CheckCircle, XCircle, MessageSquare, TrendingUp } from 'lucide-react';
import { ReviewerStatusDisplay } from './ReviewerStatusDisplay';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { toast } from 'sonner';
import { DocumentViewer } from "@/components/product/DocumentViewer";
import { CreateWorkflowDialog } from "@/components/review/CreateWorkflowDialog";
import { AddDocumentReviewDialog } from "@/components/review/AddDocumentReviewDialog";
import { CIReviewPanel } from "@/components/ci/CIReviewPanel";
import { getDay } from 'date-fns';
import { NotificationService } from '@/services/notificationService';
import { ReviewerGroupService } from '@/services/reviewerGroupService';
import { useNavigate } from 'react-router-dom';
import { useEffectiveUserRole } from '@/hooks/useEffectiveUserRole';
import { useTranslation } from '@/hooks/useTranslation';
interface ReviewDocument {
  id: string;
  name: string;
  type: string;
  dueDate?: string;
  assignedReviewer?: {
    id: string;
    name: string;
    avatar?: string;
  };
  status: 'document_review' | 'complete' | 'rejected' | 'in_review' | 'changes_requested';
  reviewerGroupId: string;
  reviewerGroupName?: string;
  reviewers?: any; // JSONB field from database
  dueDateDigit?: number;
  productName?: string;
  lastUpdated: string;
  isCompanyDocument?: boolean;
  documentFile?: {
    path: string;
    name: string;
    size?: number;
    type?: string;
    uploadedAt?: string;
  } | null;
  isCI?: boolean;
  ciData?: {
    id: string;
    title: string;
    description?: string;
    type: string;
    priority: string;
    assigned_to?: string;
    due_date?: string;
    created_at: string;
    instance_config: any;
    approvals?: Array<{
      reviewer_id: string;
      reviewer_name: string;
      approved_at: string;
      comments?: string;
    }>;
    required_approvals?: number;
  };
  reviewerStatuses?: Array<{
    id: string;
    name: string;
    status: 'approved' | 'in_review' | 'pending';
    avatar?: string;
    approvedAt?: string;
  }>;
}

interface DocumentReviewKanbanProps {
  companyId: string;
  userGroups: string[];
  companyName: string;
}

export function DocumentReviewKanban({ companyId, userGroups, companyName }: DocumentReviewKanbanProps) {
  const { lang } = useTranslation();
  const [documents, setDocuments] = useState<ReviewDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<ReviewDocument | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const { user, userRole } = useAuth();
  const { activeRole } = useCompanyRole();
  const { effectiveRole } = useEffectiveUserRole();
  const isAuthorRole = effectiveRole === 'author';
  // Add state for viewing document dialog
  const [viewingDocument, setViewingDocument] = useState<ReviewDocument | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isAddReviewOpen, setIsAddReviewOpen] = useState(false);
  const navigate = useNavigate();
  // Review functionality state
  const [selectedDocumentForReview, setSelectedDocumentForReview] = useState<ReviewDocument | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [comments, setComments] = useState<Array<{
    id: string;
    user: string;
    timestamp: string;
    text: string;
    user_id?: string;
    thread_id?: string;
  }>>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const queryClient = useQueryClient();
  // // console.log("viewingDocument", viewingDocument);
  const columns = [
    {
      id: 'document_review',
      title: lang('reviewPanel.columns.notStarted'),
      description: lang('reviewPanel.columns.notStartedDescription'),
      color: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/60',
      headerColor: 'text-blue-700',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: FileText,
      accentColor: 'border-l-blue-500'
    },
    {
      id: 'in_review',
      title: lang('reviewPanel.columns.inReview'),
      description: lang('reviewPanel.columns.inReviewDescription'),
      color: 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/60',
      headerColor: 'text-orange-700',
      badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
      icon: Clock,
      accentColor: 'border-l-orange-500'
    },
    // {
    //   id: 'changes_requested',
    //   title: 'Changes Requested',
    //   description: 'Requires modifications',
    //   color: 'bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200/60',
    //   headerColor: 'text-yellow-700',
    //   badgeColor: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    //   icon: RefreshCw,
    //   accentColor: 'border-l-yellow-500'
    // },
    {
      id: 'rejected',
      title: lang('reviewPanel.columns.rejected'),
      description: lang('reviewPanel.columns.rejectedDescription'),
      color: 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/60',
      headerColor: 'text-red-700',
      badgeColor: 'bg-red-100 text-red-700 border-red-200',
      icon: XCircle,
      accentColor: 'border-l-red-500'
    },
    {
      id: 'complete',
      title: lang('reviewPanel.columns.approved'),
      description: lang('reviewPanel.columns.approvedDescription'),
      color: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/60',
      headerColor: 'text-emerald-700',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: CheckCircle,
      accentColor: 'border-l-emerald-500'
    },
  ];

  useEffect(() => {
    fetchAssignedDocuments();
  }, [companyId, userGroups, isAuthorRole, user?.id]);

  const fetchAssignedDocuments = async () => {
    try {
      setIsLoading(true);


      // Fetch regular documents from documents table
      // Note: authors_ids column exists in DB but may not be in Supabase types - will cast result
      let documentsQuery = supabase
        .from('documents')
        .select(`
          id,
          name,
          document_type,
          due_date,
          reviewers,
          reviewer_group_ids,
          authors_ids,
          status,
          file_path,
          updated_at,
          product_id,
          created_at,
          is_record,
          products (name)
        `)
        .eq('company_id', companyId)
        .in('status', ['Not Started', 'In Progress', 'Under Review', 'In Review', 'Pending', 'Changes Requested', 'Rejected', 'Approved','Not Required','complete','Closed','closed','close','Close','Report']); // Show all documents including approved, rejected, and report

      // Fetch documents from phase_assigned_document_template table
      let phaseTemplateQuery = supabase
        .from('phase_assigned_document_template')
        .select(`
          id,
          name,
          document_type,
          due_date,
          deadline,
          reviewers,
          reviewer_group_ids,
          authors_ids,
          status,
          file_path,
          file_name,
          file_size,
          file_type,
          updated_at,
          created_at,
          description,
          tech_applicability,
          company_id,
          is_record,
          company_phases (name, company_id)
        `)
        .eq('company_id', companyId)
        .eq('is_excluded', false) // Only include non-excluded documents
        .in('status', ['Not Started', 'In Progress', 'Under Review', 'In Review', 'Pending', 'Changes Requested', 'Rejected', 'Approved','Open','Not Required','complete','Closed','closed','close','Close','Report']); // Show all documents including approved, rejected, and report

      // Fetch CI instances
      let ciQuery = supabase
        .from('ci_instances')
        .select(`
          id,
          title,
          description,
          type,
          status,
          priority,
          assigned_to,
          due_date,
          created_at,
          updated_at,
          instance_config,
          product_id
        `)
        .eq('company_id', companyId)
        .eq('status', 'in_progress'); // Only show CI instances that are in review

      // For non-author roles, apply server-side filtering by reviewer groups
      if (!isAuthorRole) {
        if (userGroups.length > 0) {
          // console.log('Filtering documents by user groups:', userGroups);
          documentsQuery = documentsQuery.overlaps('reviewer_group_ids', userGroups);
          phaseTemplateQuery = phaseTemplateQuery.overlaps('reviewer_group_ids', userGroups);
        } else {
          // console.log('No user groups - returning empty results');
          documentsQuery = documentsQuery.eq('id', '00000000-0000-0000-0000-000000000000');
          phaseTemplateQuery = phaseTemplateQuery.eq('id', '00000000-0000-0000-0000-000000000000');
        }
      }
      // For author role: fetch all documents, filter client-side after

      const [documentsResult, phaseTemplateResult, ciResult] = await Promise.all([
        documentsQuery,
        phaseTemplateQuery,
        ciQuery
      ]);

      // For authors, apply client-side filtering since JSON containment doesn't work well with Supabase
      let filteredPhaseTemplateData = phaseTemplateResult.data || [];
      // Cast documentsResult.data to any[] to handle TypeScript error since authors_ids exists in DB but not in generated types
      let filteredDocumentsData = (documentsResult.data as any[] || []);

      if (isAuthorRole && user?.id) {
        // Get document_authors.id based on user_id
        const { data: docAuthor } = await (supabase as any)
          .from('document_authors')
          .select('id, name')
          .eq('company_id', companyId)
          .eq('user_id', user.id)
          .maybeSingle();

        // Build authorIdsForFilter
        const authorIdsForFilter: string[] = [user.id];
        if (docAuthor?.id) {
          authorIdsForFilter.push(docAuthor.id);
        }

        // Filter documents by author
        filteredPhaseTemplateData = filteredPhaseTemplateData.filter(doc => {
          const authorsIds = doc.authors_ids as string[] | null;
          if (!authorsIds || !Array.isArray(authorsIds)) return false;
          return authorIdsForFilter.some(authorId => authorsIds.includes(authorId));
        });

        filteredDocumentsData = filteredDocumentsData.filter(doc => {
          const authorsIds = (doc as any).authors_ids as string[] | null;
          if (!authorsIds || !Array.isArray(authorsIds)) return false;
          return authorIdsForFilter.some(authorId => authorsIds.includes(authorId));
        });
      }
      if (documentsResult.error) throw documentsResult.error;
      if (phaseTemplateResult.error) throw phaseTemplateResult.error;
      if (ciResult.error) throw ciResult.error;

      // Log filtering details
      

      // Map regular documents from documents table (company documents)
      // For authors: include docs where they're assigned (already filtered above)
      // For reviewers: include docs with reviewer_group_ids
      // Use filteredDocumentsData (already cast to any[]) to avoid TypeScript errors with authors_ids
      const documentsToMap = isAuthorRole ? filteredDocumentsData : (documentsResult.data as any[] || []);
      const mappedDocuments: ReviewDocument[] = documentsToMap
        .filter(doc => {
          // For authors, we already filtered by authors_ids, so include all
          if (isAuthorRole) return true;
          // For reviewers, only include documents with reviewer groups
          return doc.reviewer_group_ids && doc.reviewer_group_ids.length > 0;
        })
        .map(doc => ({
          id: `company-${doc.id}`,
          name: doc.name,
          type: doc.document_type || 'Document',
          dueDate: doc.due_date,
          status: mapStatusToColumn(doc.status),
          reviewerGroupId: doc.reviewer_group_ids?.[0] || '', // Use first group ID
          reviewerGroupName: 'Review Group', // We'll need to fetch this separately if needed
          reviewers: doc.reviewers,
          dueDateDigit: 7, // Default value since we removed the join
          productName: doc.products?.name,
          lastUpdated: doc.updated_at,
          assignedReviewer: getAssignedReviewer(doc.reviewers),
          isCI: false,
          isCompanyDocument: true,
          documentFile: doc.file_path ? {
            path: doc.file_path,
            name: doc.name,
            size: 0,
            type: doc.document_type || 'application/pdf'
          } : null,
          reviewerStatuses: getReviewerStatuses(doc.reviewers, mapStatusToColumn(doc.status), doc.created_at)
        }));

      // Map phase template documents
      // For authors, use filtered data and don't require reviewer_group_ids
      const mappedPhaseTemplateDocuments: ReviewDocument[] = (isAuthorRole ? filteredPhaseTemplateData : (phaseTemplateResult.data || []))
        .filter(doc => isAuthorRole || (doc.reviewer_group_ids && doc.reviewer_group_ids.length > 0)) // Authors don't need reviewer groups
        .map(doc => ({
          id: `template-${doc.id}`,
          name: doc.name,
          type: doc.document_type || 'Phase Template',
          dueDate: doc.due_date || doc.deadline,
          status: mapStatusToColumn(doc.status),
          reviewerGroupId: doc.reviewer_group_ids?.[0] || '', // Use first group ID
          reviewerGroupName: 'Phase Template Review',
          reviewers: doc.reviewers,
          dueDateDigit: 7,
          productName: undefined, // Phase templates don't have product names
          lastUpdated: doc.updated_at,
          assignedReviewer: getAssignedReviewer(doc.reviewers),
          isCI: false,
          documentFile: doc.file_path ? {
            path: doc.file_path,
            name: doc.file_name || doc.name,
            size: doc.file_size || 0,
            type: doc.file_type || 'application/pdf'
          } : null,
          reviewerStatuses: getReviewerStatuses(doc.reviewers, mapStatusToColumn(doc.status), doc.created_at)
        }));

      // Map CI instances as review items
      const mappedCIInstances: ReviewDocument[] = (ciResult.data || []).map(ci => ({
        id: `ci-${ci.id}`,
        name: ci.title,
        type: 'CI Instance',
        dueDate: ci.due_date,
        status: 'in_review',
        reviewerGroupId: '', // CI instances don't have specific reviewer groups yet
        reviewerGroupName: 'CI Review',
        dueDateDigit: 7,
        productName: undefined, // Will fetch product name separately if needed
        lastUpdated: ci.updated_at,
        isCI: true,
        ciData: {
          id: ci.id,
          title: ci.title,
          description: ci.description,
          type: ci.type,
          priority: ci.priority,
          assigned_to: ci.assigned_to,
          due_date: ci.due_date,
          created_at: ci.created_at,
          instance_config: ci.instance_config,
          approvals: [], // Will be populated from audit log
          required_approvals: 1 // Default, can be configured
        },
        documentFile: null
      }));

      const allDocuments = [...mappedDocuments, ...mappedPhaseTemplateDocuments, ...mappedCIInstances];
      
      
      setDocuments(allDocuments);
    } catch (error) {
      console.error('Error fetching assigned documents:', error);
      toast.error(lang('reviewPanel.errors.failedToLoadDocuments'), { id: 'load-assigned-documents-error' });
    } finally {
      setIsLoading(false);
    }
  };
  const dueDateFunction = (digit: string) => {
    const today = new Date();
    const dueDate = new Date(today.getTime() + parseInt(digit) * 24 * 60 * 60 * 1000);
    return dueDate.toLocaleDateString();
  }
  const mapStatusToColumn = (status: string): 'document_review' | 'complete' | 'rejected' | 'in_review' | 'changes_requested' => {
    switch (status?.toLowerCase()) {
      // Approved column
      case 'complete':
      case 'completed':
      case 'approved':
      case 'done':
      case 'report':
        return 'complete';
      // Rejected column
      case 'rejected':
      case 'rejection':
      case 'failed':
      case 'closed':
      case 'close':
        return 'rejected';
      // In Review column
      case 'in_review':
      case 'in review':
      case 'reviewing':
      case 'under review':
      case 'in progress':
        return 'in_review';
      // Changes Requested column (currently hidden)
      case 'changes_requested':
      case 'changes requested':
      case 'needs changes':
      case 'revision needed':
        return 'changes_requested';
      // Not Started column
      case 'not started':
      case 'pending':
      case 'document_review':
        return 'document_review';
      default:
        return 'document_review';
    }
  };

  const getAssignedReviewer = (reviewers: any) => {
    if (!reviewers || !Array.isArray(reviewers) || reviewers.length === 0) {
      return undefined;
    }

    const reviewer = reviewers[0];
    return {
      id: reviewer.id || '',
      name: reviewer.name || lang('reviewPanel.unknownReviewer'),
      avatar: reviewer.avatar_url
    };
  };

  // Get reviewer statuses from actual database reviewers field
  const getReviewerStatuses = (reviewers: any, status: string, created_at: string): Array<{
    id: string;
    name: string;
    status: 'approved' | 'in_review' | 'pending';
    avatar?: string;
    approvedAt?: string;
  }> => {
    if (!reviewers || !Array.isArray(reviewers)) {
      return [];
    }

    const reviewerStatuses: Array<{
      id: string;
      name: string;
      status: 'approved' | 'in_review' | 'pending';
      avatar?: string;
      approvedAt?: string;
      assignedAt?: string;
    }> = [];

    reviewers.forEach(reviewerGroup => {
      // Check if reviewerGroup has members array
      if (reviewerGroup.members && Array.isArray(reviewerGroup.members)) {
        reviewerGroup.members.forEach(member => {
          let reviewerName = lang('reviewPanel.unknownReviewer');

          // Extract name from user_profiles if available
          if (member.user_profiles?.first_name || member.user_profiles?.last_name) {
            const firstName = member.user_profiles.first_name || '';
            const lastName = member.user_profiles.last_name || '';
            reviewerName = `${firstName} ${lastName}`.trim();
          } else if (member.name) {
            // Fallback to member name
            reviewerName = member.name;
          } else if (member.email) {
            // Fallback to email username
            reviewerName = member.email.split('@')[0];
          }

          reviewerStatuses.push({
            id: member.id || member.user_id || '',
            name: reviewerName,
            status: member.status || mapDocumentStatusToReviewerStatus(status),
            avatar: member.avatar_url || member.avatar,
            approvedAt: member.approved_at || member.approvedAt,
            assignedAt: member.assigned_at || created_at
          });
        });
      }
    });

    return reviewerStatuses;
  };

  const mapDocumentStatusToReviewerStatus = (docStatus: string): 'approved' | 'in_review' | 'pending' => {
    switch (docStatus) {
      case 'complete':
        return 'approved';
      case 'in_review':
        return 'in_review';
      default:
        return 'pending';
    }
  };


  const handleDragStart = (document: ReviewDocument) => {
    setDraggedItem(document);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const canMoveDocument = (fromStatus: string, toStatus: string): boolean => {
    // Allow all users to move documents to any column
    return true;
  };

  // Check if all reviewer group members have approved the document
  const checkAllReviewersApproved = (document: ReviewDocument): boolean => {
    if (!document.reviewerStatuses || document.reviewerStatuses.length === 0) {
      return false; // No reviewers means not approved
    }

    // All reviewers must have 'approved' status
    return document.reviewerStatuses.every(reviewer => reviewer.status === 'approved');
  };

  const handleDrop = async (newStatus: string) => {
    if (!draggedItem) return;

    // Check permissions
    if (!canMoveDocument(draggedItem.status, newStatus)) {
      toast.error(lang('reviewPanel.errors.noPermissionToMove'));
      setDraggedItem(null);
      setDragOverColumn(null);
      return;
    }

    // Allow moving to complete status without approval requirements

    const oldStatus = draggedItem.status;

    try {
      if (draggedItem.isCI) {
        // Handle CI instance status updates
        const ciId = draggedItem.id.replace('ci-', '');
        const { error } = await supabase
          .from('ci_instances')
          .update({
            status: mapCIStatus(newStatus),
            updated_at: new Date().toISOString()
          })
          .eq('id', ciId);

        if (error) throw error;

        // Trigger notifications for CI status change
        await handleCIStatusChange(draggedItem, newStatus);

        // Update local state for CI instances
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === draggedItem.id
              ? { ...doc, status: newStatus as any, lastUpdated: new Date().toISOString() }
              : doc
          )
        );
      } else if (draggedItem.isCompanyDocument || draggedItem.id.startsWith('company-')) {
        // Handle company document status updates
        const companyDocId = draggedItem.id.startsWith('company-')
          ? draggedItem.id.replace('company-', '')
          : draggedItem.id;
        const dbStatus = mapKanbanStatusToDbStatus(newStatus);
        

        const { data: updateResult, error } = await supabase
          .from('documents')
          .update({
            status: dbStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', companyDocId)
          .select('*');

        if (error) {
          console.error('[Company Doc Update] Database error:', error);
          throw error;
        }

        if (!updateResult || updateResult.length === 0) {
          console.error('[Company Doc Update] No rows updated. ID might be incorrect:', companyDocId);
          throw new Error('Company document update failed - no rows affected');
        }

        // Update local state for company documents
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === draggedItem.id
              ? { ...doc, status: newStatus as any, lastUpdated: new Date().toISOString() }
              : doc
          )
        );
      } else if (draggedItem.id.startsWith('template-')) {
        // Handle phase template document status updates
        const templateId = draggedItem.id.replace('template-', '');
        const dbStatus = mapKanbanStatusToDbStatus(newStatus);
        
        const { data: updateResult, error } = await supabase
          .from('phase_assigned_document_template')
          .update({
            status: dbStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', templateId)
          .select('*');

        if (error) {
          console.error('Phase template database update error:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        if (!updateResult || updateResult.length === 0) {
          console.error('No phase template rows were updated. Document might not exist or RLS policy might be blocking the update.');
          throw new Error('Phase template document update failed - no rows affected');
        }

        // console.log('Phase template document status updated successfully:', updateResult[0]);

        // Update local state for phase template documents
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === draggedItem.id
              ? { ...doc, status: newStatus as any, lastUpdated: new Date().toISOString() }
              : doc
          )
        );
      } else {
        // Handle regular document status updates - map kanban status to database status
        const dbStatus = mapKanbanStatusToDbStatus(newStatus);
        
        const { data: updateResult, error } = await supabase
          .from('documents')
          .update({
            status: dbStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', draggedItem.id)
          .select('*');

        if (error) {
          console.error('Database update error:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        if (!updateResult || updateResult.length === 0) {
          console.error('No rows were updated. Document might not exist or RLS policy might be blocking the update.');
          throw new Error('Document update failed - no rows affected');
        }

        // console.log('Document status updated successfully:', updateResult[0]);

        // Update local state for regular documents - use the kanban status, not database status
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === draggedItem.id
              ? { ...doc, status: newStatus as any, lastUpdated: new Date().toISOString() }
              : doc
          )
        );
      }

      // Send email notification to company admins about document movement
      await sendDocumentMovementNotification(draggedItem, oldStatus, newStatus);

      const docTypeLabel = draggedItem.isCI ? lang('reviewPanel.docTypes.ciInstance') :
        draggedItem.id.startsWith('template-') ? lang('reviewPanel.docTypes.phaseTemplate') :
        draggedItem.id.startsWith('company-') ? lang('reviewPanel.docTypes.companyDocument') : lang('reviewPanel.docTypes.document');
      toast.success(lang('reviewPanel.documentMovedTo', { docType: docTypeLabel, status: newStatus.replace('_', ' ') }));
    } catch (error) {
      console.error('Error updating status:', error);
      const docTypeLabel = draggedItem.isCI ? lang('reviewPanel.docTypes.ciInstance').toLowerCase() :
        draggedItem.id.startsWith('template-') ? lang('reviewPanel.docTypes.phaseTemplate').toLowerCase() :
        draggedItem.id.startsWith('company-') ? lang('reviewPanel.docTypes.companyDocument').toLowerCase() : lang('reviewPanel.docTypes.document').toLowerCase();
      toast.error(lang('reviewPanel.errors.failedToUpdateStatus', { docType: docTypeLabel }));
    }

    setDraggedItem(null);
    setDragOverColumn(null);
  };

  // Map kanban column status to database status values
  const mapKanbanStatusToDbStatus = (kanbanStatus: string): string => {
    switch (kanbanStatus) {
      case 'document_review':
        return 'Not Started';
      case 'in_review':
        return 'In Review';
      case 'complete':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'changes_requested':
        return 'Changes Requested';
      default:
        return 'Not Started';
    }
  };

  const sendDocumentMovementNotification = async (
    document: ReviewDocument,
    fromStatus: string,
    toStatus: string
  ) => {
    try {
      const userName = user?.user_metadata?.first_name || user?.email || 'Unknown User';

      await supabase.functions.invoke('send-document-movement-email', {
        body: {
          companyId,
          documentName: document.name,
          fromStatus,
          toStatus,
          movedBy: userName,
          reviewerGroupName: document.reviewerGroupName,
          productName: document.productName
        }
      });

      // console.log('Document movement notification sent successfully');
    } catch (error) {
      console.error('Error sending document movement notification:', error);
      // Don't show error to user as this is a background operation
    }
  };

  const mapCIStatus = (kanbanStatus: string) => {
    switch (kanbanStatus) {
      case 'In Review': return 'cancelled';
      case 'complete': return 'completed';
      case 'rejected': return 'cancelled';
      case 'changes_requested': return 'blocked';
      default: return 'pending';
    }
  };

  const handleCIStatusChange = async (ciItem: ReviewDocument, newStatus: string) => {
    if (!ciItem.isCI || !ciItem.ciData) return;

    try {
      const notificationService = new NotificationService();

      if (newStatus === 'in_review') {
        // Send notifications to reviewer groups when CI moves to "In Review"
        await sendCIReviewNotifications(ciItem.ciData.id, ciItem.ciData.title);
      } else if (newStatus === 'changes_requested') {
        // Notify editor when changes are requested
        if (ciItem.ciData.assigned_to) {
          await notificationService.addNotification({
            title: 'CI Changes Requested',
            message: `Changes have been requested for CI: ${ciItem.ciData.title}`,
            type: 'group_updated',
            group_id: ciItem.ciData.id,
            company_id: companyId
          });
        }
      }
    } catch (error) {
      console.error('Error sending CI notifications:', error);
    }
  };

  const sendCIReviewNotifications = async (ciId: string, ciTitle: string) => {
    try {
      const notificationService = new NotificationService();

      // For now, send to all company reviewer group members
      // In the future, this could be more specific based on CI assignment
      await notificationService.addNotification({
        title: 'CI Review Required',
        message: `CI "${ciTitle}" requires your review`,
        type: 'group_create',
        group_id: ciId,
        company_id: companyId
      });

      // Send email notifications via edge function
      await supabase.functions.invoke('send-reviewer-assignment-email', {
        body: {
          reviewerEmail: user?.email,
          reviewerName: user?.user_metadata?.first_name || 'Reviewer',
          documentName: ciTitle,
          reviewerGroupName: 'CI Review',
          companyName: 'Company', // Could fetch from company data
          senderName: user?.user_metadata?.first_name || 'System'
        }
      });
    } catch (error) {
      console.error('Error sending CI review notifications:', error);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate?: string): number | null => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDueDateBadgeColor = (daysUntilDue: number | null): string => {
    if (daysUntilDue === null) return 'bg-gray-100 text-gray-600 border-gray-200';
    if (daysUntilDue < 0) return 'bg-red-100 text-red-700 border-red-200';
    if (daysUntilDue <= 3) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (daysUntilDue <= 7) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.reviewerGroupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = selectedFilter === 'all' ||
      (selectedFilter === 'overdue' && getDaysUntilDue(doc.dueDate) !== null && getDaysUntilDue(doc.dueDate)! < 0) ||
      (selectedFilter === 'urgent' && getDaysUntilDue(doc.dueDate) !== null && getDaysUntilDue(doc.dueDate)! <= 3);

    return matchesSearch && matchesFilter;
  });

  // Review functionality
  const handleApprove = async () => {
    if (!selectedDocumentForReview) return;

    setIsSubmittingReview(true);
    try {
      if (selectedDocumentForReview.isCI && selectedDocumentForReview.ciData) {
        await handleCIApprove(selectedDocumentForReview.ciData.id, reviewComment);
      } else {
        // Record individual reviewer approval instead of changing document status directly
        await recordReviewerApproval(selectedDocumentForReview.id, 'approved', reviewComment);
      }

      toast.success(lang('reviewPanel.approvalRecorded'));
      setReviewComment('');
      setSelectedDocumentForReview(null);
    } catch (error) {
      console.error('Error approving:', error);

      toast.error(error instanceof Error ? error.message : lang('reviewPanel.errors.failedToRecordApproval'));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Record individual reviewer approval and check for automatic status update
  const recordReviewerApproval = async (documentId: string, status: 'approved' | 'rejected', comment?: string) => {
    if (!user?.id) {
      throw new Error(lang('reviewPanel.errors.userNotAuthenticated'));
    }

    // Determine if this is a phase template document, company document, or regular document
    const isPhaseTemplate = documentId.startsWith('template-');
    const isCompanyDocument = documentId.startsWith('company-');
    const actualDocumentId = isPhaseTemplate ? documentId.replace('template-', '') :
      isCompanyDocument ? documentId.replace('company-', '') : documentId;
    const tableName = isPhaseTemplate ? 'phase_assigned_document_template' : 'documents';

    // First, get the document to understand its current reviewer structure
    const { data: doc, error: fetchError } = await supabase
      .from(tableName)
      .select('reviewers, status, created_at')
      .eq('id', actualDocumentId)
      .single();

    if (fetchError) throw fetchError;

    let updatedReviewers: any[] = Array.isArray(doc.reviewers) ? doc.reviewers : [];

    // Update the reviewer's status in the reviewers array
    const currentUserId = user.id;
    let reviewerFound = false;

    updatedReviewers = updatedReviewers.map((reviewerGroup: any) => {
      if (reviewerGroup.members && Array.isArray(reviewerGroup.members)) {
        const updatedMembers = reviewerGroup.members.map((member: any) => {
          if (member.id === currentUserId || member.user_id === currentUserId) {
            reviewerFound = true;
            return {
              ...member,
              status,
              approved_at: status === 'approved' ? new Date().toISOString() : null,
              comments: comment || null
            };
          }
          return member;
        });

        return {
          ...reviewerGroup,
          members: updatedMembers
        };
      }
      return reviewerGroup;
    });

    if (!reviewerFound) {
      throw new Error(lang('reviewPanel.errors.notAssignedAsReviewer'));
    }

    // Update the document with new reviewer statuses
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        reviewers: updatedReviewers,
        updated_at: new Date().toISOString()
      })
      .eq('id', actualDocumentId);

    if (updateError) throw updateError;

    // Check if all reviewers have approved
    const allApproved = checkAllReviewersInArray(updatedReviewers);
    let finalStatus: 'document_review' | 'complete' | 'rejected' | 'in_review' | 'changes_requested' = doc.status as any;

    // If all reviewers approved, automatically move to complete status
    if (allApproved && doc.status !== 'complete') {
      const { error: statusError } = await supabase
        .from(tableName)
        .update({
          status: 'complete',
          updated_at: new Date().toISOString()
        })
        .eq('id', actualDocumentId);

      if (statusError) throw statusError;
      finalStatus = 'complete';

      toast.success(lang('reviewPanel.allReviewersApproved'));
    }

    // Update local state
    setDocuments(prev =>
      prev.map(document =>
        document.id === documentId
          ? {
            ...document,
            reviewers: updatedReviewers,
            status: finalStatus,
            reviewerStatuses: getReviewerStatuses(updatedReviewers, finalStatus, doc.created_at),
            lastUpdated: new Date().toISOString()
          }
          : document
      )
    );

    // Add approval comment to UI
    if (comment?.trim()) {
      const newComment = {
        id: Date.now().toString(),
        user: user?.user_metadata?.first_name || 'Anonymous',
        timestamp: new Date().toLocaleString(),
        text: `[${status.toUpperCase()}] ${comment}`
      };
      setComments(prev => [...prev, newComment]);
    }
  };

  // Helper function to check if all reviewers in array have approved
  const checkAllReviewersInArray = (reviewers: any[]): boolean => {
    if (!reviewers || reviewers.length === 0) return false;

    let hasReviewers = false;
    for (const reviewerGroup of reviewers) {
      if (reviewerGroup.members && Array.isArray(reviewerGroup.members)) {
        for (const member of reviewerGroup.members) {
          hasReviewers = true;
          if (member.status !== 'approved') {
            return false;
          }
        }
      }
    }

    return hasReviewers; // Only return true if there are reviewers and all approved
  };

  const handleCIApprove = async (ciId: string, comments?: string) => {
    try {
      // Record approval in audit log (simplified for demo)
      const approval = {
        reviewer_id: user?.id,
        reviewer_name: user?.user_metadata?.first_name || 'Anonymous',
        approved_at: new Date().toISOString(),
        comments: comments
      };

      // Update CI instance status and add approval
      const { error } = await supabase
        .from('ci_instances')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', ciId);

      if (error) throw error;

      // In a real implementation, you would also:
      // 1. Add approval to a separate approvals table
      // 2. Check if all required approvals are collected
      // 3. Auto-transition status when fully approved

      toast.success(lang('reviewPanel.ciApproved'));
    } catch (error) {
      console.error('Error approving CI:', error);
      throw error;
    }
  };
  const handleAnalyticsClick = () => {
    // console.log('Analytics button clicked:', { companyId, companyName });
    if (companyName) {
      const url = `/app/company/${encodeURIComponent(companyName)}/reviewer-analytics`;
      // console.log('Navigating to:', url);
      navigate(url);
    } else {
      // Fallback to companyId if companyName is not available
      const url = `/app/company/${companyId}/reviewer-analytics`;
      // console.log('Fallback navigation to:', url);
      navigate(url);
    }
  };
  const handleRejectWithComments = async () => {
    if (!selectedDocumentForReview || !reviewComment.trim()) {
      toast.error(lang('reviewPanel.errors.provideCommentsForRejection'));
      return;
    }

    setIsSubmittingReview(true);
    try {
      if (selectedDocumentForReview.isCI && selectedDocumentForReview.ciData) {
        await handleCIReject(selectedDocumentForReview.ciData.id, reviewComment);
      } else {
        // Record individual reviewer rejection instead of changing document status directly
        await recordReviewerApproval(selectedDocumentForReview.id, 'rejected', reviewComment);
      }

      toast.success(lang('reviewPanel.rejectionRecorded'));
      setReviewComment('');
      setSelectedDocumentForReview(null);
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error(lang('reviewPanel.errors.failedToRecordRejection'));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCIReject = async (ciId: string, comments: string) => {
    try {
      // Update CI status to changes requested (not rejected - they can be fixed)
      const { error } = await supabase
        .from('ci_instances')
        .update({
          status: 'blocked', // Using blocked to represent "changes requested"
          updated_at: new Date().toISOString()
        })
        .eq('id', ciId);

      if (error) throw error;

      // Notify the CI editor
      const notificationService = new NotificationService();
      await notificationService.addNotification({
        title: 'CI Changes Requested',
        message: `Changes requested for CI with comments: ${comments}`,
        type: 'group_updated',
        group_id: ciId,
        company_id: companyId
      });

      toast.success(lang('reviewPanel.ciChangesRequested'));
    } catch (error) {
      console.error('Error requesting CI changes:', error);
      throw error;
    }
  };

  const handlePostComment = async () => {
    if (!reviewComment.trim() || !selectedDocumentForReview || !user?.id) return;

    try {
      // Check if this is a template document or company document (has prefix)
      const isTemplateDocument = selectedDocumentForReview.id.startsWith('template-');
      const isCompanyDocument = selectedDocumentForReview.id.startsWith('company-');
      const actualDocumentId = isTemplateDocument ? selectedDocumentForReview.id.replace('template-', '') :
        isCompanyDocument ? selectedDocumentForReview.id.replace('company-', '') : selectedDocumentForReview.id;

      if (isTemplateDocument) {
        // For template documents, store comments locally only
        const newComment = {
          id: Date.now().toString(),
          user: user?.user_metadata?.first_name || 'Anonymous',
          timestamp: new Date().toLocaleString(),
          text: reviewComment,
          user_id: user.id,
          thread_id: `template-thread-${selectedDocumentForReview.id}`
        };

        setComments(prev => [...prev, newComment]);
        setReviewComment('');
        toast.success(lang('reviewPanel.commentPosted'));
        return;
      }

      // For real documents (including company documents), create a comment thread in the database
      const { data, error } = await supabase.rpc('create_new_comment_thread', {
        p_document_id: actualDocumentId,
        p_comment_content: reviewComment.trim(),
        p_position_coords: {
          reviewer_group_id: null,
          reviewer_group_name: 'Review Panel'
        },
        p_is_internal: false
      });

      if (error) throw error;

      // Add to local state for immediate UI update
      const responseData = data as any;
      const newComment = {
        id: responseData?.comment_id || Date.now().toString(),
        user: user?.user_metadata?.first_name || 'Anonymous',
        timestamp: new Date().toLocaleString(),
        text: reviewComment,
        user_id: user.id,
        thread_id: responseData?.thread_id
      };

      setComments(prev => [...prev, newComment]);
      setReviewComment('');
      toast.success(lang('reviewPanel.commentPosted'));

      // Refresh comments from database
      loadReviewComments(selectedDocumentForReview.id);
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error(lang('reviewPanel.errors.failedToPostComment'));
    }
  };

  // Load review comments for selected document
  const loadReviewComments = async (documentId: string) => {
    // Skip loading for template documents
    if (documentId.startsWith('template-')) {
      return;
    }

    try {
      const { data: threads, error } = await supabase
        .from('comment_threads')
        .select(`
          id,
          position,
          created_at,
          comments!inner(
            id,
            content,
            created_at,
            user_id,
            user_profiles(first_name, last_name, email)
          )
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const loadedComments = threads?.flatMap(thread =>
        thread.comments.map((comment: any) => ({
          id: comment.id,
          user: comment.user_profiles?.first_name || comment.user_profiles?.email || 'Anonymous',
          timestamp: new Date(comment.created_at).toLocaleString(),
          text: comment.content,
          user_id: comment.user_id,
          thread_id: thread.id
        }))
      ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) || [];

      setComments(loadedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  // Load comments when document is selected
  useEffect(() => {
    if (selectedDocumentForReview?.id) {
      loadReviewComments(selectedDocumentForReview.id);
    } else {
      setComments([]);
    }
  }, [selectedDocumentForReview?.id]);

  // Real-time subscription for comments
  useEffect(() => {
    if (!selectedDocumentForReview?.id) return;

    // Note: Removed global 'comments' table subscription (had no filter, causing continuous API calls).
    // Using only comment_threads subscription which is properly filtered by document_id.
    const channel = supabase
      .channel(`document-comments-${selectedDocumentForReview.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_threads',
          filter: `document_id=eq.${selectedDocumentForReview.id}`
        },
        (payload) => {
          // console.log('Thread change detected:', payload);
          loadReviewComments(selectedDocumentForReview.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDocumentForReview?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
          <div className="text-gray-600 font-medium">{lang('reviewPanel.loadingDocuments')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50/30 min-h-screen">
      {/* Action Buttons Section */}
      {selectedDocumentForReview && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {lang('reviewPanel.reviewing')}: {selectedDocumentForReview.name}
              </h3>
              <p className="text-gray-600 text-sm">
                {selectedDocumentForReview.productName && `${lang('reviewPanel.product')}: ${selectedDocumentForReview.productName}`}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                disabled={isSubmittingReview}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {lang('reviewPanel.approve')}
              </Button>
              <Button
                onClick={handleRejectWithComments}
                disabled={isSubmittingReview || !reviewComment.trim()}
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {lang('reviewPanel.rejectWithComments')}
              </Button>
              <Button
                onClick={() => setSelectedDocumentForReview(null)}
                variant="outline"
              >
                {lang('reviewPanel.cancelReview')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">{lang('reviewPanel.dashboardTitle')}</h2>
            <p className="text-gray-600">
              {lang('reviewPanel.dashboardSubtitle')}
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={lang('reviewPanel.searchDocuments')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option value="all">{lang('reviewPanel.filters.allDocuments')}</option>
              <option value="overdue">{lang('reviewPanel.filters.overdue')}</option>
              <option value="urgent">{lang('reviewPanel.filters.dueSoon')}</option>
            </select>
            {(activeRole === 'admin' || activeRole === 'editor') && (
              <Button
                variant="outline"
                className="bg-white hover:bg-gray-50 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                onClick={() => handleAnalyticsClick()}
              >
                {lang('reviewPanel.analytics')}
              </Button>
            )}
            <Button
              onClick={fetchAssignedDocuments}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              {lang('reviewPanel.refresh')}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {columns.map((column) => {
            const count = filteredDocuments.filter(doc => doc.status === column.id).length;
            const phaseTemplateCount = filteredDocuments.filter(doc => doc.status === column.id && doc.id.startsWith('template-')).length;
            const companyDocCount = filteredDocuments.filter(doc => doc.status === column.id && doc.isCompanyDocument).length;
            const regularDocumentCount = filteredDocuments.filter(doc => doc.status === column.id && !doc.id.startsWith('template-') && !doc.isCompanyDocument && !doc.isCI).length;
            const ciCount = filteredDocuments.filter(doc => doc.status === column.id && doc.isCI).length;
            const Icon = column.icon;

            return (
              <div key={column.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200/60">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", column.badgeColor)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600">{column.title}</div>
                    {count > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {regularDocumentCount > 0 && `${regularDocumentCount} docs`}
                        {phaseTemplateCount > 0 && (regularDocumentCount > 0 ? ', ' : '') + `${phaseTemplateCount} templates`}
                        {companyDocCount > 0 && (regularDocumentCount > 0 || phaseTemplateCount > 0 ? ', ' : '') + `${companyDocCount} company`}
                        {ciCount > 0 && (regularDocumentCount > 0 || phaseTemplateCount > 0 || companyDocCount > 0 ? ', ' : '') + `${ciCount} CI`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kanban Board with Horizontal Scroll */}
      <div className="overflow-x-auto">
        {/* Scrollable container with minimum width */}
        <div className="min-w-[1200px] flex gap-6 pb-4">
          {columns.map((column) => {
            const columnDocuments = filteredDocuments.filter(doc => doc.status === column.id);
            const Icon = column.icon;

            return (
              <div
                key={column.id}
                className={cn(
                  "flex-1 min-w-[280px] bg-white rounded-xl shadow-sm border transition-all duration-200",
                  column.color,
                  dragOverColumn === column.id && "ring-2 ring-blue-400 ring-opacity-50 transform scale-105"
                )}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(column.id)}
              >
                {/* Column Header */}
                <div className={cn("p-5 border-b border-gray-200/60", column.accentColor, "border-l-4")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", column.badgeColor)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className={cn("font-semibold text-lg", column.headerColor)}>
                          {column.title}
                        </h3>
                        <p className="text-sm text-gray-500">{column.description}</p>
                      </div>
                    </div>
                    <Badge className={cn("font-medium", column.badgeColor)}>
                      {columnDocuments.length}
                    </Badge>
                  </div>
                </div>

                {/* Documents */}
                <div className="p-4 space-y-3 min-h-[500px] max-h-[70vh] overflow-y-auto">
                  {columnDocuments.map((document) => {
                    const daysUntilDue = getDaysUntilDue(document.dueDate);
                    return (
                      <Card
                        key={document.id}
                        className={cn(
                          "transition-all duration-200 hover:shadow-md hover:-translate-y-1 bg-white border-gray-200/60 cursor-move",
                          draggedItem?.id === document.id && "opacity-50 rotate-3 scale-105"
                        )}
                        draggable={true}
                        onDragStart={() => handleDragStart(document)}
                        onDragEnd={handleDragEnd}
                      >
                        <CardContent className="p-5">
                          {/* Header Section */}
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex-1 min-w-0 mt-4">
                              <h4 className="font-semibold text-lg text-gray-900 leading-tight mb-2 truncate" title={document.name}>
                                {document.name}
                              </h4>
                              <div className="flex items-start mt-2 flex-col gap-2 mb-3">
                                <Badge variant="outline" className="text-xs px-2 py-1 bg-gray-100 text-gray-700 font-medium">
                                  {document.type}
                                </Badge>
                                {(document as any).is_record === true && (
                                  <Badge variant="outline" className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 font-medium">
                                    {lang('reviewPanel.badges.report')}
                                  </Badge>
                                )}
                                {document.id.startsWith('template-') && (
                                  <Badge variant="outline" className="text-xs px-2 py-1 bg-purple-50 text-purple-700 border-purple-200 font-medium">
                                    {lang('reviewPanel.badges.phaseTemplate')}
                                  </Badge>
                                )}
                                {document.isCompanyDocument && (
                                  <Badge variant="outline" className="text-xs px-2 py-1 bg-teal-50 text-teal-700 border-teal-200 font-medium">
                                    {lang('reviewPanel.badges.companyDocument')}
                                  </Badge>
                                )}
                                {document.reviewerGroupName && (
                                  <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200 font-medium">
                                    {document.reviewerGroupName}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {/* <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mt-3 hover:bg-gray-100">
                              <MoreVertical className="h-4 w-4" />
                            </Button> */}
                          </div>

                          {/* Due Date Section */}
                          {(document.dueDate || (document.dueDateDigit && document.dueDateDigit > 0)) && (
                            <div className="mb-4 p-3 bg-orange-50/80 border border-orange-200/60 rounded-lg">
                              <div className="flex items-center  gap-2 text-orange-700">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  {lang('reviewPanel.due')}: {document.dueDate ? formatDate(document.dueDate) : dueDateFunction(document.dueDateDigit?.toString() || '0')}
                                </span>
                                {(() => {
                                  const daysUntilDue = getDaysUntilDue(document.dueDate);
                                  return daysUntilDue !== null && (
                                    <Badge
                                      className={cn(
                                        "text-xs px-2 py-1 font-medium border ml-auto",
                                        getDueDateBadgeColor(daysUntilDue)
                                      )}
                                    >
                                      {daysUntilDue < 0
                                        ? `${Math.abs(daysUntilDue)}${lang('reviewPanel.daysOverdue')}`
                                        : `${daysUntilDue}${lang('reviewPanel.daysLeft')}`
                                      }
                                    </Badge>
                                  );
                                })()}
                              </div>
                            </div>
                          )}

                          {/* Product Name */}
                          {document.productName && (
                            <div className="mb-4 text-sm text-gray-600">
                              <span className="font-medium">{lang('reviewPanel.product')}:</span> {document.productName}
                            </div>
                          )}

                          {/* Reviewer Status Display */}
                          {document.reviewerStatuses && document.reviewerStatuses.length > 0 && (
                            <div className="mb-4">
                              <ReviewerStatusDisplay
                                reviewers={document.reviewerStatuses}
                                showLabels={true}
                              />
                            </div>
                          )}

                          {/* Assigned Reviewer (if different from status display) */}
                          {document.assignedReviewer && !document.reviewerStatuses?.length && (
                            <div className="mb-4 p-3 bg-gray-50/80 border border-gray-200/60 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                                  <AvatarImage src={document.assignedReviewer.avatar} />
                                  <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700">
                                    {getInitials(document.assignedReviewer.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900">{lang('reviewPanel.assignedTo')}</div>
                                  <div className="text-sm text-gray-600 truncate">{document.assignedReviewer.name}</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">
                                {lang('reviewPanel.updated')} {formatDate(document.lastUpdated)}
                              </span>
                            </div>

                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-blue-600 hover:text-blue-800 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                              onClick={() => {
                                setViewingDocument(document);
                                setIsViewerOpen(true);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              {lang('reviewPanel.view')}
                            </Button>
                            {/* <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-emerald-600 hover:text-emerald-800 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50"
                              onClick={() => setSelectedDocumentForReview(document)}
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Review
                            </Button> */}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {columnDocuments.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-2">
                        <Icon className="h-12 w-12 mx-auto opacity-50" />
                      </div>
                      <p className="text-gray-500 font-medium">{lang('reviewPanel.noDocuments')}</p>
                      <p className="text-gray-400 text-sm">
                        {searchQuery || selectedFilter !== 'all'
                          ? lang('reviewPanel.tryAdjustingFilters')
                          : lang('reviewPanel.documentsWillAppear')
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Comments Tab Section */}
      {selectedDocumentForReview && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60">
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="comments">{lang('reviewPanel.tabs.reviewComments')}</TabsTrigger>
              <TabsTrigger value="details">{lang('reviewPanel.tabs.documentDetails')}</TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="p-6 space-y-6">
              {/* Comment Input */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{lang('reviewPanel.addReviewComment')}</h3>
                </div>
                <Textarea
                  placeholder={lang('reviewPanel.writeCommentsPlaceholder')}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  className="w-full"
                />
                <Button
                  onClick={handlePostComment}
                  disabled={!reviewComment.trim() || isSubmittingReview}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {isSubmittingReview ? lang('reviewPanel.posting') : lang('reviewPanel.postComment')}
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">{lang('reviewPanel.commentsHistory')}</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{lang('reviewPanel.noCommentsYet')}</p>
                      <p className="text-sm">{lang('reviewPanel.beFirstToComment')}</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {comment.user.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-gray-900">{comment.user}</span>
                          </div>
                          <span className="text-xs text-gray-500">{comment.timestamp}</span>
                        </div>
                        <p className="text-gray-700">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">{lang('reviewPanel.documentInformation')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">{lang('reviewPanel.labels.documentName')}</label>
                    <p className="text-gray-900">{selectedDocumentForReview.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">{lang('reviewPanel.labels.type')}</label>
                    <p className="text-gray-900">{selectedDocumentForReview.type}</p>
                  </div>
                  {selectedDocumentForReview.productName && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">{lang('reviewPanel.product')}</label>
                      <p className="text-gray-900">{selectedDocumentForReview.productName}</p>
                    </div>
                  )}
                  {selectedDocumentForReview.reviewerGroupName && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">{lang('reviewPanel.labels.reviewerGroup')}</label>
                      <p className="text-gray-900">{selectedDocumentForReview.reviewerGroupName}</p>
                    </div>
                  )}
                  {selectedDocumentForReview.dueDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">{lang('reviewPanel.labels.dueDate')}</label>
                      <p className="text-gray-900">{formatDate(selectedDocumentForReview.dueDate)}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">{lang('reviewPanel.labels.status')}</label>
                    <Badge className="ml-2">{selectedDocumentForReview.status}</Badge>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* DocumentViewer Dialog */}
      {viewingDocument && (
        <DocumentViewer
          open={isViewerOpen}
          onOpenChange={(open) => {
            setIsViewerOpen(open);
            if (!open) setViewingDocument(null);
          }}
          documentId={viewingDocument.id.startsWith('template-') ? viewingDocument.id.replace('template-', '') :
            viewingDocument.id.startsWith('company-') ? viewingDocument.id.replace('company-', '') : viewingDocument.id}
          documentName={viewingDocument.name}
          companyId={companyId}
          companyRole={activeRole}
          documentFile={viewingDocument.documentFile}
          reviewerGroupId={viewingDocument.reviewerGroupId}
          onStatusChanged={() => {
            // Refresh document list when status is changed in DocumentViewer
            fetchAssignedDocuments();
          }}
        />
      )}
      {/* Add Review Dialog */}
      {viewingDocument && (
        <AddDocumentReviewDialog
          open={isAddReviewOpen}
          onOpenChange={setIsAddReviewOpen}
          document={{ id: viewingDocument.id, name: viewingDocument.name }}
          onReviewAdded={(reviewText) => {
            setIsAddReviewOpen(false);
            // Optionally refresh document list or show a toast
          }}
        />
      )}
    </div>
  );
}