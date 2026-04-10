import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Clock, AlertCircle, Eye, CheckSquare, File, CheckCircle } from 'lucide-react';
import { PdfPreviewButton } from '@/components/documents/PdfPreviewButton';
import { format } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { OnlyOfficeReviewViewer } from "@/components/review/OnlyOfficeReviewViewer";
import { DocumentActionModal } from "@/components/review/DocumentActionModal";
import { useTranslation } from "@/hooks/useTranslation";

interface AssignedDocument {
  id: string;
  name: string;
  status: string;
  phase: string;
  dueDate?: string;
  assignedDate: string;
  lastUpdated?: string;
  priority?: string;
  reviewerGroupName?: string;
  reviewerGroupId?: string;
  role?: 'review' | 'author';
  isAlsoApprover?: boolean;
  myDecision?: string;
  deviceName?: string;
  documentFile?: {
    path: string;
    name: string;
    size: number;
    type: string;
  } | null;
}

interface AwaitingMyReviewPageProps {
  companyId: string;
  userGroups: string[];
  companyName?: string;
  firstName?: string;
}

export function AwaitingMyReviewPage({ companyId, userGroups, companyName, firstName = "Expert" }: AwaitingMyReviewPageProps) {
  const { lang } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [documents, setDocuments] = useState<AssignedDocument[]>([]);
  const [completedDocs, setCompletedDocs] = useState<AssignedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<AssignedDocument | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [actionDocument, setActionDocument] = useState<AssignedDocument | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [highlightedDocId, setHighlightedDocId] = useState<string | null>(null);
  const lastHandledKey = useRef<string | null>(null);
  const retryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll + highlight + auto-open logic
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const docId = params.get('highlight');
    const uniqueKey = params.get('t');
    const shouldAutoOpen = params.get('autoopen') === 'true';
    if (!docId) return;

    const key = `${docId}-${uniqueKey}`;
    if (lastHandledKey.current === key) return;

    // Clear any previous retry
    if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);

    // Try to find and scroll to the element — retry every 300ms until found (max 10 attempts)
    let attempts = 0;
    const tryScroll = () => {
      attempts++;
      const el = document.querySelector(`[data-doc-id="${docId}"]`) as HTMLElement;
      if (el) {
        lastHandledKey.current = key;
        if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
        setHighlightedDocId(docId);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Remove highlight after 5 seconds
        fadeTimerRef.current = setTimeout(() => setHighlightedDocId(null), 5000);

        // Auto-open document viewer if requested
        if (shouldAutoOpen) {
          setTimeout(() => {
            const doc = documents.find(
              (d) => d.id.replace(/^template-/, '') === docId
            );
            if (doc) {
              setViewingDocument(doc);
              setIsViewerOpen(true);
            }
          }, 600);
        }
        return;
      }
      if (attempts >= 10) {
        if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);
      }
    };

    // First try immediately, then retry
    tryScroll();
    if (!lastHandledKey.current || lastHandledKey.current !== key) {
      retryIntervalRef.current = setInterval(tryScroll, 300);
    }

    return () => {
      if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [location.search, documents.length]);

  useEffect(() => {
    fetchAssignedDocuments();
  }, [companyId, userGroups]);

  const fetchAssignedDocuments = async () => {
    if (!user?.id || !companyId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch regular documents from documents table (same as DocumentReviewKanban)
      let documentsQuery = supabase
        .from('documents')
        .select(`
          id,
          name,
          document_type,
          due_date,
          status,
          created_at,
          reviewer_group_ids,
          file_path,
          products (name)
        `)
        .eq('company_id', companyId)
        .in('status', ['Not Started', 'In Progress', 'Under Review', 'Pending', 'Changes Requested','Approved','Closed','close', 'Rejected','Changes Requested','In Review','Draft']);

      // Fetch documents from phase_assigned_document_template table (no foreign key, fetch phase separately)
      let phaseTemplateQuery = supabase
        .from('phase_assigned_document_template')
        .select(`
          id,
          name,
          document_type,
          due_date,
          deadline,
          status,
          created_at,
          reviewer_group_ids,
          file_path,
          file_name,
          file_size,
          file_type,
          phase_id,
          product_id,
          company_id,
          document_scope,
          updated_at,
          approver_user_ids,
          approver_group_ids
        `)
        .eq('company_id', companyId)
        .eq('is_excluded', false)
        .in('status', ['Not Started', 'In Progress', 'Under Review', 'Pending', 'Changes Requested','Approved','Closed','close', 'Rejected','Changes Requested','In Review','Draft']);

      // Apply filtering based on user groups OR individual user assignment
      // Note: `documents` table does NOT have `reviewer_user_ids` — only `phase_assigned_document_template` does
      if (userGroups.length > 0) {
        documentsQuery = documentsQuery.overlaps('reviewer_group_ids', userGroups);
        const padtFilter = `reviewer_group_ids.ov.{${userGroups.join(',')}},reviewer_user_ids.cs.{${user.id}}`;
        phaseTemplateQuery = phaseTemplateQuery.or(padtFilter);
      } else if (user?.id) {
        // No groups — documents table can't match, only check PADT for individual assignment
        documentsQuery = documentsQuery.eq('id', '00000000-0000-0000-0000-000000000000');
        phaseTemplateQuery = phaseTemplateQuery.contains('reviewer_user_ids', [user.id]);
      } else {
        documentsQuery = documentsQuery.eq('id', '00000000-0000-0000-0000-000000000000');
        phaseTemplateQuery = phaseTemplateQuery.eq('id', '00000000-0000-0000-0000-000000000000');
      }

      const [documentsResult, phaseTemplateResult] = await Promise.all([
        documentsQuery,
        phaseTemplateQuery
      ]);

      if (documentsResult.error) throw documentsResult.error;
      if (phaseTemplateResult.error) throw phaseTemplateResult.error;


      // Fetch phase information separately (no foreign key relationship)
      const phaseIds = new Set<string>();
      (phaseTemplateResult.data || []).forEach(doc => {
        if (doc.phase_id) {
          phaseIds.add(doc.phase_id);
        }
      });

      let phasesMap = new Map<string, { name: string; company_id: string }>();
      if (phaseIds.size > 0) {
        // Try to fetch from phases table first
        const { data: phasesData } = await supabase
          .from('phases')
          .select('id, name, company_id')
          .in('id', Array.from(phaseIds))
          .eq('company_id', companyId);

        if (phasesData) {
          phasesData.forEach(phase => {
            phasesMap.set(phase.id, { name: phase.name, company_id: phase.company_id });
          });
        }

        // If not found in phases, try company_phases
        if (phasesMap.size === 0) {
          const { data: companyPhasesData } = await supabase
            .from('company_phases')
            .select('id, name, company_id')
            .in('id', Array.from(phaseIds))
            .eq('company_id', companyId);

          if (companyPhasesData) {
            companyPhasesData.forEach(phase => {
              phasesMap.set(phase.id, { name: phase.name, company_id: phase.company_id });
            });
          }
        }
      }

      // Fetch product/device names for phase template docs
      // productNameMap: product_id -> product name (for docs with product_id)
      // phaseProductMap: phase_id (company_phases.id) -> product name (fallback via lifecycle_phases)
      let productNameMap = new Map<string, string>();
      let phaseProductMap = new Map<string, string>();

      // Collect product_ids directly from phase template docs
      const productIds = new Set<string>();
      (phaseTemplateResult.data || []).forEach(doc => {
        if ((doc as any).product_id) productIds.add((doc as any).product_id);
      });

      // Fetch products directly by product_id
      if (productIds.size > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select('id, name')
          .in('id', Array.from(productIds));

        if (productsData) {
          productsData.forEach(p => productNameMap.set(p.id, p.name));
        }
      }

      // Fallback: for docs without product_id, look up via lifecycle_phases using phase_id
      if (phaseIds.size > 0) {
        const { data: lifecycleData } = await supabase
          .from('lifecycle_phases')
          .select('id, phase_id, product_id, products(name)')
          .in('phase_id', Array.from(phaseIds));

        if (lifecycleData) {
          lifecycleData.forEach((lp: any) => {
            const productName = lp.products?.name;
            if (productName && lp.phase_id) {
              phaseProductMap.set(lp.phase_id, productName);
            }
          });
        }
      }

      // Fetch reviewer group names
      const allGroupIds = new Set<string>();
      [...(documentsResult.data || []), ...(phaseTemplateResult.data || [])].forEach(doc => {
        if (doc.reviewer_group_ids) {
          doc.reviewer_group_ids.forEach((id: string) => allGroupIds.add(id));
        }
      });

      const { data: reviewerGroups } = await supabase
        .from('reviewer_groups')
        .select('id, name')
        .in('id', Array.from(allGroupIds));

      const groupNamesMap = new Map(reviewerGroups?.map(g => [g.id, g.name]) || []);

      // Map regular documents
      const mappedDocuments: AssignedDocument[] = (documentsResult.data || [])
        .filter(doc => doc.reviewer_group_ids && doc.reviewer_group_ids.length > 0)
        .map(doc => ({
          id: doc.id,
          name: doc.name,
          status: doc.status || 'Pending',
          phase: doc.products?.name || 'N/A',
          assignedDate: doc.created_at,
          dueDate: doc.due_date,
          reviewerGroupName: doc.reviewer_group_ids?.[0] ? groupNamesMap.get(doc.reviewer_group_ids[0]) : undefined,
          reviewerGroupId: doc.reviewer_group_ids?.[0] || '',
          role: 'review' as const,
          deviceName: doc.products?.name || undefined,
          documentFile: doc.file_path ? {
            path: doc.file_path,
            name: doc.name,
            size: 0,
            type: doc.document_type || 'application/pdf'
          } : null
        }));

      // Map phase template documents
      // DEBUG: Log file_path for all phase template docs
      (phaseTemplateResult.data || []).forEach(doc => {
        if (doc.id === '0b6b68b2-a7bb-4124-957a-9361203357ea') {
          console.log('[Review Debug] PADT file_path for target doc:', doc.file_path, '| file_name:', doc.file_name);
        }
      });

      const mappedPhaseDocuments: AssignedDocument[] = (phaseTemplateResult.data || [])
        .filter(doc => doc.reviewer_group_ids && doc.reviewer_group_ids.length > 0)
        .map(doc => {
          const phaseInfo = doc.phase_id ? phasesMap.get(doc.phase_id) : null;
          const isCompanyDoc = (doc as any).document_scope === 'company_document';
          // Check if current user is also an approver for this document
          const approverUserIds = (doc as any).approver_user_ids || [];
          const approverGroupIds = (doc as any).approver_group_ids || [];
          const isAlsoApprover = approverUserIds.includes(user!.id) || approverGroupIds.some((gid: string) => userGroups.includes(gid));
          return {
            id: `template-${doc.id}`,
            name: doc.name,
            status: doc.status || 'Pending',
            phase: phaseInfo?.name || 'N/A',
            assignedDate: doc.created_at,
            lastUpdated: (doc as any).updated_at || doc.created_at,
            dueDate: doc.due_date || doc.deadline,
            reviewerGroupName: doc.reviewer_group_ids?.[0] ? groupNamesMap.get(doc.reviewer_group_ids[0]) : undefined,
            reviewerGroupId: doc.reviewer_group_ids?.[0] || '',
            role: 'review' as const,
            isAlsoApprover,
            deviceName: isCompanyDoc ? undefined : ((doc as any).product_id
              ? productNameMap.get((doc as any).product_id)
              : (doc.phase_id ? phaseProductMap.get(doc.phase_id) : undefined)),
            documentFile: doc.file_path ? {
              path: doc.file_path,
              name: doc.file_name || doc.name,
              size: doc.file_size || 0,
              type: doc.file_type || 'application/pdf'
            } : null
          };
        });

      // Also fetch documents where user is assigned as author
      const AUTHOR_STATUSES = ['Not Started', 'In Progress', 'Under Review', 'Pending', 'Changes Requested', 'In Review', 'Draft', 'Approved', 'Rejected', 'Closed'];

      const { data: authorPhaseDocs } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, status, due_date, deadline, created_at, phase_id, product_id, company_id, file_path, file_name, file_size, file_type, document_type, document_scope')
        .eq('company_id', companyId)
        .eq('is_excluded', false)
        .in('status', AUTHOR_STATUSES)
        .contains('authors_ids', JSON.stringify([user.id]))
        .limit(20);

      const { data: authorRegularDocs } = await supabase
        .from('documents')
        .select('id, name, status, due_date, created_at, file_path, document_type, products(name)')
        .eq('company_id', companyId)
        .in('status', AUTHOR_STATUSES)
        .contains('authors_ids', JSON.stringify([user.id]))
        .limit(20);

      // Map author docs
      const existingIds = new Set([...mappedDocuments.map(d => d.id), ...mappedPhaseDocuments.map(d => d.id)]);

      const authorPhaseDocsMaped: AssignedDocument[] = (authorPhaseDocs || [])
        .filter(doc => !existingIds.has(`template-${doc.id}`))
        .map(doc => {
          const phaseInfo = doc.phase_id ? phasesMap.get(doc.phase_id) : null;
          const isCompanyDoc = (doc as any).document_scope === 'company_document';
          return {
            id: `template-${doc.id}`,
            name: doc.name,
            status: doc.status || 'Draft',
            phase: phaseInfo?.name || 'N/A',
            assignedDate: doc.created_at,
            lastUpdated: doc.created_at,
            dueDate: doc.due_date || doc.deadline,
            reviewerGroupName: 'Author',
            reviewerGroupId: '',
            role: 'author' as const,
            deviceName: isCompanyDoc ? undefined : ((doc as any).product_id
              ? productNameMap.get((doc as any).product_id)
              : (doc.phase_id ? phaseProductMap.get(doc.phase_id) : undefined)),
            documentFile: doc.file_path ? {
              path: doc.file_path,
              name: doc.file_name || doc.name,
              size: doc.file_size || 0,
              type: doc.file_type || 'application/pdf'
            } : null
          };
        });

      const authorRegularDocsMapped: AssignedDocument[] = (authorRegularDocs || [])
        .filter(doc => !existingIds.has(doc.id))
        .map(doc => ({
          id: doc.id,
          name: doc.name,
          status: doc.status || 'Draft',
          phase: (doc as any).products?.name || 'N/A',
          assignedDate: doc.created_at,
          dueDate: doc.due_date,
          reviewerGroupName: 'Author',
          reviewerGroupId: '',
          role: 'author' as const,
          deviceName: (doc as any).products?.name || undefined,
          documentFile: doc.file_path ? {
            path: doc.file_path,
            name: doc.name,
            size: 0,
            type: doc.document_type || 'application/pdf'
          } : null
        }));

      // Also fetch documents where user is assigned as approver (Pending Approval + Approved/Completed/Closed)
      const approverExistingIds = new Set([
        ...mappedDocuments.map(d => d.id),
        ...mappedPhaseDocuments.map(d => d.id),
        ...authorPhaseDocsMaped.map(d => d.id),
        ...authorRegularDocsMapped.map(d => d.id),
      ]);

      // Build approver filter: approved_by OR approver_user_ids OR approver_group_ids
      const approverOrParts = [`approved_by.eq.${user.id}`, `approver_user_ids.cs.{${user.id}}`];
      if (userGroups.length > 0) {
        approverOrParts.push(`approver_group_ids.ov.{${userGroups.join(',')}}`);
      }

      const { data: approverDocs } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, status, due_date, deadline, created_at, phase_id, product_id, company_id, file_path, file_name, file_size, file_type, document_type, document_scope, approver_due_date')
        .eq('company_id', companyId)
        .eq('is_excluded', false)
        .in('status', ['In Review', 'Under Review', 'Pending Approval', 'Approved', 'Completed', 'Closed'])
        .or(approverOrParts.join(','));

      const approverDocsMapped: AssignedDocument[] = (approverDocs || [])
        .filter(doc => !approverExistingIds.has(`template-${doc.id}`))
        .map(doc => {
          const phaseInfo = doc.phase_id ? phasesMap.get(doc.phase_id) : null;
          const isCompanyDoc = (doc as any).document_scope === 'company_document';
          return {
            id: `template-${doc.id}`,
            name: doc.name,
            status: doc.status || 'Pending Approval',
            phase: phaseInfo?.name || 'N/A',
            assignedDate: doc.created_at,
            lastUpdated: doc.created_at,
            dueDate: (doc as any).approver_due_date || doc.due_date || doc.deadline,
            reviewerGroupName: 'Approver',
            reviewerGroupId: '',
            role: 'author' as const,
            deviceName: isCompanyDoc ? undefined : ((doc as any).product_id
              ? productNameMap.get((doc as any).product_id)
              : (doc.phase_id ? phaseProductMap.get(doc.phase_id) : undefined)),
            documentFile: doc.file_path ? {
              path: doc.file_path,
              name: doc.file_name || doc.name,
              size: doc.file_size || 0,
              type: doc.file_type || 'application/pdf'
            } : null
          };
        });

      const allDocuments = [...mappedDocuments, ...mappedPhaseDocuments, ...authorPhaseDocsMaped, ...authorRegularDocsMapped, ...approverDocsMapped];

      // Fetch current user's individual decisions to show per-user status
      if (user?.id && allDocuments.length > 0) {
        const docIds = allDocuments.map(d => d.id.replace('template-', ''));
        const { data: myDecisions } = await supabase
          .from('document_reviewer_decisions')
          .select('document_id, decision')
          .eq('reviewer_id', user.id)
          .in('document_id', docIds);

        if (myDecisions && myDecisions.length > 0) {
          const decisionMap = new Map(myDecisions.map(d => [d.document_id, d.decision]));
          allDocuments.forEach(doc => {
            const cleanId = doc.id.replace('template-', '');
            const myDecision = decisionMap.get(cleanId);
            if (myDecision) {
              doc.myDecision = myDecision;
              // Only override status for non-approved decisions —
              // "approved" at user level shouldn't hide the doc when the document is still in review
              const decisionStatusMap: Record<string, string> = {
                'rejected': 'Rejected',
                'changes_requested': 'Changes Requested',
                'in_review': 'In Review',
                'not_started': 'Not Started',
                'pending': 'Pending',
              };
              if (decisionStatusMap[myDecision]) {
                doc.status = decisionStatusMap[myDecision];
              }
            }
          });
        }
      }

      // Split into pending and completed documents, sort by last updated first
      const sortByDate = (a: AssignedDocument, b: AssignedDocument) =>
        new Date(b.lastUpdated || b.assignedDate).getTime() - new Date(a.lastUpdated || a.assignedDate).getTime();
      const pendingDocuments = allDocuments.filter(doc => !['approved', 'completed', 'closed'].includes(doc.status?.toLowerCase())).sort(sortByDate);
      const completedDocuments = allDocuments.filter(doc => ['approved', 'completed', 'closed'].includes(doc.status?.toLowerCase())).sort(sortByDate);
      setDocuments(pendingDocuments);
      setCompletedDocs(completedDocuments);
    } catch (err) {
      console.error('Error fetching assigned documents:', err);
      setError(lang('reviewDashboard.errors.failedToLoadDocuments'));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Under Review':
      case 'In Review':
        return 'default';
      case 'Changes Requested':
        return 'destructive';
      case 'Pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const overdueCount = documents.filter(doc => {
    if (!doc.dueDate) return false;
    return new Date(doc.dueDate) < new Date();
  }).length;

  const needsNewVersionCount = documents.filter(doc => 
    doc.status === 'Changes Requested'
  ).length;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">{lang('reviewDashboard.loadingDocuments')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {highlightedDocId && (
        <style>{`
          @keyframes notification-pulse {
            0%, 100% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0.2), 0 10px 15px -3px hsl(var(--primary) / 0.15); }
            50% { box-shadow: 0 0 16px 4px hsl(var(--primary) / 0.3), 0 10px 15px -3px hsl(var(--primary) / 0.2); }
          }
        `}</style>
      )}
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{lang('reviewDashboard.awaitingMyReview')}</h1>
        <p className="text-muted-foreground">
          {lang('reviewDashboard.documentsAssigned')} {companyName ? `${lang('reviewDashboard.for')} ${companyName}` : ''}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{lang('reviewDashboard.stats.totalReviews')}</p>
              <p className="text-3xl font-bold mt-1">{documents.length}</p>
            </div>
            <FileText className="h-8 w-8 text-primary/50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{lang('reviewDashboard.stats.overdueReviews')}</p>
              <p className="text-3xl font-bold mt-1 text-destructive">{overdueCount}</p>
            </div>
            <Clock className="h-8 w-8 text-destructive/50" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{lang('reviewDashboard.stats.needsNewVersion')}</p>
              <p className="text-3xl font-bold mt-1 text-orange-600">{needsNewVersionCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600/50" />
          </div>
        </Card>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{lang('reviewDashboard.noDocumentsAssigned')}</h3>
            <p className="text-muted-foreground">
              {lang('reviewDashboard.noDocumentsDescription')}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">{lang('reviewDashboard.assignedDocuments')} ({documents.length})</h2>
          {documents.map((doc) => (
            <Card
              key={doc.id}
              data-doc-id={doc.id.replace(/^template-/, '')}
              className={`p-6 hover:shadow-md transition-shadow ${
                highlightedDocId === doc.id.replace(/^template-/, '')
                  ? 'outline outline-2 outline-primary bg-primary/5 animate-[notification-pulse_1.5s_ease-in-out_infinite]'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {doc.documentFile ? (
                      <File className="h-5 w-5 text-green-600" />
                    ) : (
                      <FileText className="h-5 w-5 text-primary" />
                    )}
                    <h3 className="font-semibold text-lg">{doc.name}</h3>
                    {doc.role === 'author' ? (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                        Author
                      </Badge>
                    ) : (
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs">
                        Reviewer
                      </Badge>
                    )}
                    {doc.status === 'Approved' && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        ✓ {lang('reviewDashboard.statuses.approved')}
                      </Badge>
                    )}
                    {doc.status === 'Rejected' && (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        ✗ {lang('reviewDashboard.statuses.rejected')}
                      </Badge>
                    )}
                    {doc.status === 'Changes Requested' && (
                      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        ⚠ {lang('reviewDashboard.statuses.changesRequested')}
                      </Badge>
                    )}
                    {!['Approved', 'Rejected', 'Changes Requested'].includes(doc.status) && (
                      <Badge variant={getStatusBadgeVariant(doc.status)}>
                        {doc.status}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 text-sm text-muted-foreground">
                    {doc.deviceName && (
                      <div>
                        <p className="font-medium text-foreground mb-1">Device</p>
                        <p>{doc.deviceName}</p>
                      </div>
                    )}

                    <div>
                      <p className="font-medium text-foreground mb-1">{lang('reviewDashboard.labels.assignedDate')}</p>
                      <p>{format(new Date(doc.assignedDate), 'MMM dd, yyyy')}</p>
                    </div>

                    {doc.dueDate && (
                      <div>
                        <p className="font-medium text-foreground mb-1">{lang('reviewDashboard.labels.dueDate')}</p>
                        <p className={new Date(doc.dueDate) < new Date() ? 'text-destructive font-medium' : ''}>
                          {format(new Date(doc.dueDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    )}

                    {doc.reviewerGroupName && (
                      <div>
                        <p className="font-medium text-foreground mb-1">{lang('reviewDashboard.labels.reviewerGroup')}</p>
                        <p>{doc.reviewerGroupName}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setViewingDocument(doc);
                      setIsViewerOpen(true);
                    }}
                    variant="outline"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {lang('reviewDashboard.reviewDocument')}
                  </Button>
                  {doc.status === 'Approved' && (
                    <PdfPreviewButton
                      documentId={doc.id}
                      companyId={companyId}
                      variant="outline"
                      size="sm"
                    />
                  )}
                  {/* <Button
                    onClick={() => {
                      setActionDocument(doc);
                      setIsActionModalOpen(true);
                    }}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Document Action
                  </Button> */}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reviewed & Approved Documents */}
      {completedDocs.length > 0 && (
        <div className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Reviewed & Approved Documents ({completedDocs.length})
          </h2>
          {completedDocs.map((doc) => (
            <Card
              key={doc.id}
              data-doc-id={doc.id.replace(/^template-/, '')}
              className={`p-6 hover:shadow-md transition-shadow border-green-200 bg-green-50/30 ${
                highlightedDocId === doc.id.replace(/^template-/, '')
                  ? 'outline outline-2 outline-primary bg-primary/5 animate-[notification-pulse_1.5s_ease-in-out_infinite]'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {doc.documentFile ? (
                      <File className="h-5 w-5 text-green-600" />
                    ) : (
                      <FileText className="h-5 w-5 text-green-600" />
                    )}
                    <h3 className="font-semibold text-lg">{doc.name}</h3>
                    {doc.role === 'author' ? (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                        Author
                      </Badge>
                    ) : (
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs">
                        Reviewer
                      </Badge>
                    )}
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {doc.status === 'Approved' ? 'Approved' : doc.status === 'Completed' ? 'Completed' : 'Closed'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 text-sm text-muted-foreground">
                    {doc.deviceName && (
                      <div>
                        <p className="font-medium text-foreground mb-1">Device</p>
                        <p>{doc.deviceName}</p>
                      </div>
                    )}

                    <div>
                      <p className="font-medium text-foreground mb-1">{lang('reviewDashboard.labels.assignedDate')}</p>
                      <p>{format(new Date(doc.assignedDate), 'MMM dd, yyyy')}</p>
                    </div>

                    {doc.dueDate && (
                      <div>
                        <p className="font-medium text-foreground mb-1">{lang('reviewDashboard.labels.dueDate')}</p>
                        <p>{format(new Date(doc.dueDate), 'MMM dd, yyyy')}</p>
                      </div>
                    )}

                    {doc.reviewerGroupName && (
                      <div>
                        <p className="font-medium text-foreground mb-1">{lang('reviewDashboard.labels.reviewerGroup')}</p>
                        <p>{doc.reviewerGroupName}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setViewingDocument(doc);
                      setIsViewerOpen(true);
                    }}
                    variant="outline"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {lang('reviewDashboard.reviewDocument')}
                  </Button>
                  <PdfPreviewButton
                    documentId={doc.id}
                    companyId={companyId}
                    variant="outline"
                    size="sm"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* OnlyOffice Review Viewer */}
      {viewingDocument && (
        <OnlyOfficeReviewViewer
          open={isViewerOpen}
          onOpenChange={(open) => {
            setIsViewerOpen(open);
            if (!open) {
              setViewingDocument(null);
              fetchAssignedDocuments();
            }
          }}
          documentId={viewingDocument.id}
          documentName={viewingDocument.name}
          documentFile={viewingDocument.documentFile}
          companyId={companyId}
          reviewerGroupId={viewingDocument.reviewerGroupId || userGroups[0]}
          userRole={
            viewingDocument.reviewerGroupName === 'Approver' ? 'approver'
            : (viewingDocument.isAlsoApprover && (viewingDocument.myDecision === 'reviewed' || viewingDocument.myDecision === 'approved')) ? 'approver'
            : viewingDocument.role === 'review' ? 'review'
            : 'author'
          }
        />
      )}

      {/* Document Action Modal */}
      {actionDocument && (
        <DocumentActionModal
          open={isActionModalOpen}
          onOpenChange={(open) => {
            setIsActionModalOpen(open);
            if (!open) {
              setActionDocument(null);
            }
          }}
          documentId={actionDocument.id}
          documentName={actionDocument.name}
          reviewerGroupId={actionDocument.reviewerGroupId}
          onActionComplete={fetchAssignedDocuments}
        />
      )}
    </div>
  );
}
