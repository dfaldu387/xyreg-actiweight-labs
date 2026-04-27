import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Box, Typography, CircularProgress, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ResizableDrawer } from '@/components/ui/resizable-drawer';
import { LiveEditor } from '@/components/document-composer/LiveEditor';
import { DocumentTemplate } from '@/types/documentComposer';
import { DocumentTemplatePersistenceService } from '@/services/documentTemplatePersistenceService';
import { getDefaultSectionsForType } from '@/utils/documentTemplateUtils';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DocumentEditor } from "@onlyoffice/document-editor-react";
import { FileEdit, ArrowLeft, Loader2, AlertCircle, Send, Check, CheckCircle, FilePen, Eye, ShieldCheck, CircleCheckBig, Hourglass, ExternalLink, Star, Users, UserCheck, Calendar, PenTool, ChevronDown, ChevronUp, Link2, MessageSquare } from 'lucide-react';
import { useDocumentStar } from '@/hooks/useDocumentStar';
import { DocumentEditorSidebar } from '@/components/document-composer/DocumentEditorSidebar';
import { useCIDocumentMetadata } from '@/hooks/useCIDocumentMetadata';
import { ReviewDraftsList } from '@/components/document-composer/ReviewDraftsList';
import { SendToReviewGroupDialog } from '@/components/documents/SendToReviewGroupDialog';
import { DocumentStudioPersistenceService } from '@/services/documentStudioPersistenceService';
import { extractFieldsFromSections } from '@/utils/documentToFieldExtractor';
import { useProductFieldSuggestions } from '@/hooks/useProductFieldSuggestions';
import { SaveContentAsDocCIDialog } from '@/components/shared/SaveContentAsDocCIDialog';
import { toast } from 'sonner';
import { UserAndGroupSelector } from '@/components/shared/UserAndGroupSelector';
import { ESignatureFlow } from '@/components/shared/ESignatureFlow';
import { useReviewerGroups } from '@/hooks/useReviewerGroups';
import { useDocumentReviewAssignments } from '@/hooks/useDocumentReviewAssignments';
import { useDocumentAuthors } from '@/hooks/useDocumentAuthors';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DocumentExportService } from '@/services/documentExportService';
import { AppNotificationService } from '@/services/appNotificationService';
import { DocumentValidationService, UnresolvedReferenceSource } from '@/services/documentValidationService';
import { DocxCommentSidebar } from '@/components/review/DocxCommentSidebar';
import { DocxCommentHighlighter } from '@/components/review/DocxCommentHighlighter';
import { useDocxComments } from '@/hooks/useDocxComments';
import { formatSopDisplayName } from '@/constants/sopAutoSeedTiers';
import { splitDocPrefix } from '@/utils/templateNameUtils';

// OnlyOffice constants
const SUPABASE_URL = "https://wzzkbmmgxxrfhhxggrcl.supabase.co";
const STORAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public`;
const CALLBACK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onlyoffice-callback`;

const getDocumentUrl = (filePath?: string): string => {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  return `${STORAGE_URL}/document-templates/${cleanPath}`;
};

const getFileType = (fileName?: string): string => {
  if (!fileName) return "docx";
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "doc" || ext === "docx") return "docx";
  if (ext === "xls" || ext === "xlsx") return "xlsx";
  if (ext === "ppt" || ext === "pptx") return "pptx";
  if (ext === "pdf") return "pdf";
  return "docx";
};

const getDocumentType = (fileName?: string): string => {
  if (!fileName) return "word";
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "doc" || ext === "docx") return "word";
  if (ext === "xls" || ext === "xlsx") return "cell";
  if (ext === "ppt" || ext === "pptx") return "slide";
  return "word";
};

interface DocumentDraftDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName: string;
  documentType: string;
  categoryPrefix?: string;
  productId?: string;
  companyId?: string;
  companyName?: string;
  onDocumentSaved?: () => void;
  filePath?: string;
  fileName?: string;
  documentReference?: string;
  isNewUnsavedDocument?: boolean;
  onDocumentCreated?: (docId: string, docName: string, docType: string) => void;
  /** When true, disables SOP @-mention suggestions in the AI chat (e.g. for QMS Document Control > Documents tab). */
  disableSopMentions?: boolean;
}

export function DocumentDraftDrawer({
  open,
  onOpenChange,
  documentId,
  documentName,
  documentType,
  categoryPrefix,
  productId,
  companyId,
  companyName,
  onDocumentSaved,
  filePath,
  fileName,
  documentReference,
  isNewUnsavedDocument,
  onDocumentCreated,
  disableSopMentions = false,
}: DocumentDraftDrawerProps) {
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [existingDraftId, setExistingDraftId] = useState<string | null>(null);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [editorMounted, setEditorMounted] = useState(false);
  const [docStatus, setDocStatus] = useState<string>('Not Started');
  const [editorKey, setEditorKey] = useState<string | null>(null);
  const { activeCompanyRole } = useCompanyRole();
  const drawerNavigate = useNavigate();
  const { user } = useAuth();
  const activeRole = activeCompanyRole?.role;
  const canEdit = activeRole !== 'viewer';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isRecord, setIsRecord] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [nextReviewDate, setNextReviewDate] = useState<string | null>(null);
  const [documentNumber, setDocumentNumber] = useState<string | null>(null);
  const [showSendForReview, setShowSendForReview] = useState(false);
  const [existingReviewerGroupIds, setExistingReviewerGroupIds] = useState<string[]>([]);
  const [showSaveCIDialog, setShowSaveCIDialog] = useState(false);
  const [isUnsaved, setIsUnsaved] = useState(isNewUnsavedDocument || false);
  const [activeView, setActiveView] = useState<'draft' | 'review' | 'completed'>('draft');

  // Review inline view state
  const [reviewerGroupIds, setReviewerGroupIds] = useState<string[]>([]);
  const [reviewerUserIds, setReviewerUserIds] = useState<string[]>([]);
  const [approverGroupIds, setApproverGroupIds] = useState<string[]>([]);
  const [approverUserIds, setApproverUserIds] = useState<string[]>([]);
  const [reviewerDueDate, setReviewerDueDate] = useState('');
  const [approverDueDate, setApproverDueDate] = useState('');
  const [isSendingReview, setIsSendingReview] = useState(false);
  const [isLoadingReviewData, setIsLoadingReviewData] = useState(false);
  const [reviewStep, setReviewStep] = useState<'form' | 'sign'>('form');
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [showSectionNumbers, setShowSectionNumbers] = useState(false);
  const [referencingSources, setReferencingSources] = useState<UnresolvedReferenceSource[]>([]);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (template?.formatOptions?.showSectionNumbers !== undefined) {
      setShowSectionNumbers(template.formatOptions.showSectionNumbers);
    }
  }, [template?.formatOptions?.showSectionNumbers]);
  const [approveStep, setApproveStep] = useState<'form' | 'sign'>('form');
  const [reviewFormCollapsed, setReviewFormCollapsed] = useState(false);
  const [reviewDetailsCollapsed, setReviewDetailsCollapsed] = useState(false);
  const [approverCommentsExpanded, setApproverCommentsExpanded] = useState(false);
  const [reviewFormAutoCollapsed, setReviewFormAutoCollapsed] = useState(false);
  const [reviewCommentsExpanded, setReviewCommentsExpanded] = useState(false);
  const [alreadyReviewedUserIds, setAlreadyReviewedUserIds] = useState<string[]>([]);
  const [showDocxComments, setShowDocxComments] = useState(false);
  const draftContentRef = useRef<HTMLDivElement>(null);
  const [alreadyApprovedUserIds, setAlreadyApprovedUserIds] = useState<string[]>([]);

  const resolvedCompanyId = companyId || activeCompanyRole?.companyId;

  useEffect(() => {
    if (!resolvedCompanyId) return;
    supabase
      .from('companies')
      .select('logo_url')
      .eq('id', resolvedCompanyId)
      .single()
      .then(({ data }) => {
        if (data?.logo_url) setCompanyLogoUrl(data.logo_url);
      });
  }, [resolvedCompanyId]);

  const { reviewerGroups, isLoading: groupsLoading } = useReviewerGroups(resolvedCompanyId || '');
  const { createAssignment } = useDocumentReviewAssignments(documentId);
  const { authors, isLoading: authorsLoading } = useDocumentAuthors(resolvedCompanyId || '');
  const appNotificationService = React.useMemo(() => new AppNotificationService(), []);

  const { createSuggestions } = useProductFieldSuggestions(productId, resolvedCompanyId);

  const handlePushToDeviceFields = useCallback(() => {
    if (!template || !productId) {
      toast.error('No product context available');
      return;
    }
    const extractions = extractFieldsFromSections(template.sections);
    if (extractions.length === 0) {
      toast.info('No field values found to push', { description: 'Add content with **Label:** Value format first.' });
      return;
    }
    createSuggestions.mutate(extractions.map(e => ({
      field_key: e.fieldKey,
      field_label: e.fieldLabel,
      suggested_value: e.suggestedValue,
    })));
  }, [template, productId, createSuggestions]);

  // Fetch existing reviewer group assignments
  useEffect(() => {
    if (!open || !documentId) {
      setExistingReviewerGroupIds([]);
      return;
    }
    const cleanId = documentId.replace(/^template-/, '');
    supabase
      .from('phase_assigned_document_template')
      .select('reviewer_group_ids')
      .eq('id', cleanId)
      .maybeSingle()
      .then(({ data }) => {
        setExistingReviewerGroupIds((data?.reviewer_group_ids as string[]) || []);
      });
  }, [open, documentId]);

  // Completed view state
  const [completedData, setCompletedData] = useState<any>(null);
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(false);

  // Reset view to draft when drawer closes or document changes
  useEffect(() => {
    setActiveView('draft');
    setReviewStep('form');
  }, [documentId]);

  // Reset advanced editor state when drawer closes
  useEffect(() => {
    if (!open) {
      setShowAdvancedEditor(false);
      setEditorMounted(false);
      setEditorKey(null);
      setShowSaveCIDialog(false);
      setIsUnsaved(false);
      setActiveView('draft');
      setReviewStep('form');
    } else if (isNewUnsavedDocument) {
      setIsUnsaved(true);
    }
  }, [open, isNewUnsavedDocument]);

  const resolvedDocUrl = editorMounted && filePath ? getDocumentUrl(filePath) : "";

  // Local override for document identity — set after CI creation to avoid drift
  const [overrideDocId, setOverrideDocId] = useState<string | null>(null);

  // Normalize the CI document ID (strip "template-" prefix if present)
  const normalizedDocId = overrideDocId
    || (documentId?.startsWith('template-') ? documentId.replace('template-', '') : documentId);

  // Reset override when drawer closes or prop documentId changes
  useEffect(() => {
    setOverrideDocId(null);
  }, [documentId, open]);

  // Fetch or create a stable editor key from DB for collaboration
  // Use normalizedDocId (without template- prefix) so comment extraction matches
  useEffect(() => {
    if (!editorMounted || !normalizedDocId) return;
    const fetchOrCreateKey = async () => {
      const { data } = await supabase
        .from('document_editor_sessions')
        .select('editor_key')
        .eq('document_id', normalizedDocId)
        .single();
      if (data) {
        setEditorKey(data.editor_key);
      } else {
        const newKey = `collab-${normalizedDocId}-v1`;
        await supabase.from('document_editor_sessions').insert({
          document_id: normalizedDocId,
          editor_key: newKey,
          version: 1,
        });
        setEditorKey(newKey);
      }
    };
    fetchOrCreateKey();
  }, [editorMounted, normalizedDocId]);

  const { isStarred, isLoading: starLoading, toggleStar } = useDocumentStar(normalizedDocId);
  const { comments: docxComments } = useDocxComments(showDocxComments ? normalizedDocId : undefined);

  // Keep parent state (isRecord/recordId/nextReviewDate/documentNumber) in sync with
  // the CI metadata. Previously this was driven by DocumentEditorSidebar; now it's
  // standalone since the sidebar UI has been removed from the draft view.
  const { metadata: ciMetadata } = useCIDocumentMetadata(normalizedDocId || null, resolvedCompanyId);
  useEffect(() => {
    if (ciMetadata) setIsRecord(ciMetadata.is_record ?? false);
  }, [ciMetadata?.is_record]);
  useEffect(() => {
    if (ciMetadata) setRecordId(ciMetadata.record_id ?? null);
  }, [ciMetadata?.record_id]);
  useEffect(() => {
    if (ciMetadata) setNextReviewDate(ciMetadata.next_review_date ?? null);
  }, [ciMetadata?.next_review_date]);
  useEffect(() => {
    if (ciMetadata) setDocumentNumber(ciMetadata.document_number ?? null);
  }, [ciMetadata?.document_number]);

  // Fetch document status for stepper (skip for new unsaved documents)
  useEffect(() => {
    if (!open || !normalizedDocId || isUnsaved) return;
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('phase_assigned_document_template')
        .select('status')
        .eq('id', normalizedDocId)
        .maybeSingle();
      if (data?.status) setDocStatus(data.status);
    };
    fetchStatus();
  }, [open, normalizedDocId, isUnsaved]);

  // Check if this document's number is referenced by other documents (proactive cross-ref tracking)
  useEffect(() => {
    if (!documentNumber) {
      setReferencingSources([]);
      return;
    }
    const sources = DocumentValidationService.getReferencingDocuments(documentNumber);
    setReferencingSources(sources);
  }, [documentNumber]);

  // Load existing reviewer/approver data when switching to review view
  useEffect(() => {
    if ((activeView !== 'review' && activeView !== 'completed') || !documentId) return;
    setIsLoadingReviewData(true);
    const cleanId = documentId.replace(/^template-/, '');
    (async () => {
      try {
        // Fetch document data, decisions, and review notes in parallel
        const [docResult, decisionsResult, notesResult] = await Promise.all([
          supabase
            .from('phase_assigned_document_template')
            .select('approved_by, reviewer_group_ids, reviewer_user_ids, approver_user_ids, approver_group_ids, approver_due_date, due_date')
            .eq('id', cleanId)
            .maybeSingle(),
          supabase
            .from('document_reviewer_decisions')
            .select('reviewer_id, reviewer_group_id, decision')
            .eq('document_id', cleanId),
          supabase
            .from('document_review_notes')
            .select('reviewer_id')
            .or(`document_id.eq.${cleanId},template_document_id.eq.${cleanId}`),
        ]);
        const data = docResult.data;
        const decisions = decisionsResult.data || [];
        const reviewNotes = notesResult.data || [];

        // Build set of already-reviewed user IDs: include both decisions and review notes
        const reviewedUserIds = new Set([
          ...decisions.map(d => d.reviewer_id).filter(Boolean),
          ...reviewNotes.map(n => n.reviewer_id).filter(Boolean),
        ]);
        const approvedUserIds = new Set(decisions.filter(d => d.decision === 'approved').map(d => d.reviewer_id).filter(Boolean));
        const approvedGroupIds = new Set(decisions.filter(d => d.decision === 'approved' && d.reviewer_group_id).map(d => d.reviewer_group_id));
        // Store for disabling in selector
        setAlreadyReviewedUserIds(Array.from(reviewedUserIds));
        setAlreadyApprovedUserIds(Array.from(approvedUserIds));

        if (data) {
          const existingReviewerUsers = Array.isArray((data as any).reviewer_user_ids) ? (data as any).reviewer_user_ids : [];
          const groupMemberIds = new Set<string>(existingReviewerUsers);
          const allGroupIds = Array.isArray(data.reviewer_group_ids) ? data.reviewer_group_ids : [];
          // Keep all groups selected (groups stay selectable, individual users get disabled)
          if (allGroupIds.length > 0) setReviewerGroupIds(allGroupIds);
          else setReviewerGroupIds([]);
          for (const gid of allGroupIds) {
            const group = reviewerGroups.find(g => g.id === gid);
            if (group?.members) {
              group.members.forEach((m: any) => { if (m.is_active !== false) groupMemberIds.add(m.user_id); });
            }
          }
          // Remove already-reviewed users from selection
          const eligibleUserIds = Array.from(groupMemberIds).filter(uid => !reviewedUserIds.has(uid));
          setReviewerUserIds(eligibleUserIds);

          const existingApproverUsers = Array.isArray((data as any).approver_user_ids) ? (data as any).approver_user_ids : [];
          const existingApproverGroups = Array.isArray((data as any).approver_group_ids) ? (data as any).approver_group_ids : [];
          // Filter out already-approved
          const eligibleApproverGroups = existingApproverGroups.filter((gid: string) => !approvedGroupIds.has(gid));
          if (eligibleApproverGroups.length > 0) {
            setApproverGroupIds(eligibleApproverGroups);
            const approverMemberIds = new Set<string>(
              existingApproverUsers.length > 0
                ? existingApproverUsers.filter((uid: string) => !approvedUserIds.has(uid))
                : (data.approved_by && !approvedUserIds.has(data.approved_by) ? [data.approved_by] : [])
            );
            for (const gid of eligibleApproverGroups) {
              const group = reviewerGroups.find(g => g.id === gid);
              if (group?.members) group.members.forEach((m: any) => { if (m.is_active !== false && !approvedUserIds.has(m.user_id)) approverMemberIds.add(m.user_id); });
            }
            setApproverUserIds(Array.from(approverMemberIds));
          } else {
            const filteredApproverUsers = existingApproverUsers.filter((uid: string) => !approvedUserIds.has(uid));
            if (filteredApproverUsers.length > 0) setApproverUserIds(filteredApproverUsers);
            else if (data.approved_by && !approvedUserIds.has(data.approved_by)) setApproverUserIds([data.approved_by]);
            else setApproverUserIds([]);
            setApproverGroupIds([]);
          }
          if ((data as any).due_date) setReviewerDueDate((data as any).due_date.split('T')[0]);
          if ((data as any).approver_due_date) setApproverDueDate((data as any).approver_due_date.split('T')[0]);
        }
      } finally {
        setIsLoadingReviewData(false);
      }
    })();
  }, [activeView, documentId, reviewerGroups]);

  // Load completed view data (e-sign records, version info, etc.)
  useEffect(() => {
    if (!['completed', 'review'].includes(activeView) || !documentId) return;
    setIsLoadingCompleted(true);
    const cleanId = documentId.replace(/^template-/, '');
    (async () => {
      try {
        const [docRes, sigRes, versRes, decisionsRes, notesRes] = await Promise.all([
          supabase.from('phase_assigned_document_template')
            .select('status, updated_at, approved_by, reviewer_group_ids, reviewer_user_ids, approver_user_ids, approver_group_ids, due_date, approver_due_date, version, file_name')
            .eq('id', cleanId).maybeSingle(),
          supabase.from('esign_records')
            .select('user_id, full_legal_name, signer_name, meaning, signed_at, signer_email, created_at')
            .eq('document_id', cleanId).order('signed_at', { ascending: true }),
          supabase.from('phase_document_versions' as any)
            .select('version_number, uploaded_at, uploaded_by_name, file_name, notes')
            .eq('document_id', cleanId).order('version_number', { ascending: false }).limit(5),
          supabase.from('document_reviewer_decisions')
            .select('reviewer_id, reviewer_group_id, decision, comment, updated_at')
            .eq('document_id', cleanId),
          supabase.from('document_review_notes')
            .select('reviewer_id, note, created_at')
            .or(`document_id.eq.${cleanId},template_document_id.eq.${cleanId}`)
            .order('created_at', { ascending: true }),
        ]);
        const rd = docRes.data as any;

        // Resolve group names (both reviewer + approver groups + decision groups)
        // First populate from already-loaded reviewerGroups hook data
        let groupMap: Record<string, string> = {};
        for (const g of reviewerGroups) {
          groupMap[g.id] = g.name;
        }
        // Collect all group IDs including from decisions
        const decisionGroupIds = (decisionsRes.data || []).map((d: any) => d.reviewer_group_id).filter(Boolean);
        const allGroupIds = [...new Set([...(rd?.reviewer_group_ids || []), ...(rd?.approver_group_ids || []), ...decisionGroupIds])];
        const unresolvedGroupIds = allGroupIds.filter(id => !groupMap[id]);
        if (unresolvedGroupIds.length > 0) {
          const { data: groups } = await supabase.from('reviewer_groups_new' as any)
            .select('id, name').in('id', unresolvedGroupIds);
          if (groups) {
            for (const g of groups as any[]) groupMap[g.id] = g.name;
          }
        }

        // Collect all user IDs that need name resolution (including from decisions)
        const allUserIds = new Set<string>();
        if (rd?.reviewer_user_ids) (rd.reviewer_user_ids as string[]).forEach(id => allUserIds.add(id));
        if (rd?.approver_user_ids) (rd.approver_user_ids as string[]).forEach(id => allUserIds.add(id));
        if (rd?.approved_by) allUserIds.add(rd.approved_by);
        (decisionsRes.data || []).forEach((d: any) => { if (d.reviewer_id) allUserIds.add(d.reviewer_id); });
        (notesRes.data || []).forEach((n: any) => { if (n.reviewer_id) allUserIds.add(n.reviewer_id); });

        // Also collect user IDs from group members
        if (allGroupIds.length > 0) {
          const { data: members } = await supabase.from('reviewer_group_members_new')
            .select('user_id, group_id')
            .in('group_id', allGroupIds)
            .eq('is_active', true);
          if (members) members.forEach(m => allUserIds.add(m.user_id));
        }

        // Resolve all user names from profiles
        let userMap: Record<string, string> = {};
        if (allUserIds.size > 0) {
          const userIdArr = Array.from(allUserIds);
          // Supabase .in() has a limit, batch if needed
          for (let i = 0; i < userIdArr.length; i += 50) {
            const batch = userIdArr.slice(i, i + 50);
            const { data: profiles } = await supabase.from('user_profiles')
              .select('id, first_name, last_name, email')
              .in('id', batch);
            if (profiles) {
              for (const p of profiles) {
                userMap[p.id] = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email || p.id;
              }
            }
          }
        }

        // Build reviewer display list: include current assignment groups + groups from past decisions
        const reviewerGroupDisplays: { groupName: string; members: string[] }[] = [];
        const seenGroupIds = new Set<string>();
        // Current assignment groups
        for (const gid of (rd?.reviewer_group_ids || [])) {
          seenGroupIds.add(gid);
          const gName = groupMap[gid] || gid;
          const { data: members } = await supabase.from('reviewer_group_members_new')
            .select('user_id').eq('group_id', gid).eq('is_active', true);
          const memberNames = (members || []).map(m => userMap[m.user_id] || m.user_id);
          reviewerGroupDisplays.push({ groupName: gName, members: memberNames });
        }
        // Past decision groups not in current assignment
        for (const gid of decisionGroupIds) {
          if (seenGroupIds.has(gid)) continue;
          seenGroupIds.add(gid);
          const gName = groupMap[gid] || gid;
          // Show only the members who actually submitted decisions for this group
          const groupDecisionUsers = (decisionsRes.data || [])
            .filter((d: any) => d.reviewer_group_id === gid)
            .map((d: any) => userMap[d.reviewer_id] || d.reviewer_id);
          if (groupDecisionUsers.length > 0) {
            reviewerGroupDisplays.push({ groupName: gName, members: groupDecisionUsers });
          }
        }
        // Individual reviewers: current assignment + past decision users
        const allReviewerUserIds = new Set<string>([
          ...(rd?.reviewer_user_ids || []),
          ...(decisionsRes.data || []).map((d: any) => d.reviewer_id).filter(Boolean),
        ]);
        const individualReviewerNames = Array.from(allReviewerUserIds).map((uid: string) => userMap[uid] || uid);

        // Build approver display list
        const approverGroupDisplays: { groupName: string; members: string[] }[] = [];
        for (const gid of (rd?.approver_group_ids || [])) {
          const gName = groupMap[gid] || gid;
          const { data: members } = await supabase.from('reviewer_group_members_new')
            .select('user_id').eq('group_id', gid).eq('is_active', true);
          const memberNames = (members || []).map(m => userMap[m.user_id] || m.user_id);
          approverGroupDisplays.push({ groupName: gName, members: memberNames });
        }
        const individualApproverNames = (rd?.approver_user_ids || []).map((uid: string) => userMap[uid] || uid);

        // Build decisions with resolved names
        const decisions = (decisionsRes.data || []).map((d: any) => ({
          ...d,
          reviewerName: userMap[d.reviewer_id] || d.reviewer_id,
          groupName: d.reviewer_group_id ? (groupMap[d.reviewer_group_id] || d.reviewer_group_id) : null,
        }));

        // Build review notes with resolved names and tag as review or approval
        const reviewerUserIdSet = new Set<string>();
        (rd?.reviewer_user_ids || []).forEach((uid: string) => reviewerUserIdSet.add(uid));
        // Also include members of reviewer groups
        for (const gid of (rd?.reviewer_group_ids || [])) {
          const group = reviewerGroups.find(g => g.id === gid);
          if (group?.members) {
            group.members.forEach((m: any) => { if (m.is_active !== false) reviewerUserIdSet.add(m.user_id); });
          }
        }
        const approverUserIdSet = new Set([
          ...(rd?.approver_user_ids || []),
          ...(rd?.approved_by ? [rd.approved_by] : []),
        ]);
        // Also check decisions to determine role
        const approverDecisionUserIds = new Set(
          (decisionsRes.data || []).filter((d: any) => d.decision === 'approved').map((d: any) => d.reviewer_id)
        );
        const reviewNotes = (notesRes.data || []).map((n: any) => {
          // If user is a reviewer, tag as review (even if also an approver)
          const isReviewer = reviewerUserIdSet.has(n.reviewer_id);
          const isApprover = approverUserIdSet.has(n.reviewer_id) || approverDecisionUserIds.has(n.reviewer_id);
          return {
            ...n,
            reviewerName: userMap[n.reviewer_id] || n.reviewer_id,
            type: isReviewer ? 'review' : (isApprover ? 'approval' : 'review'),
          };
        });

        setCompletedData({
          document: rd,
          signatures: sigRes.data || [],
          versions: versRes.data || [],
          decisions,
          reviewNotes,
          userMap,
          groupMap,
          reviewerGroupDisplays,
          individualReviewerNames,
          approverGroupDisplays,
          individualApproverNames,
        });
      } finally {
        setIsLoadingCompleted(false);
      }
    })();
  }, [activeView, documentId, reviewerGroups]);

  // Uncheck already-reviewed groups/users when decisions/notes data loads
  useEffect(() => {
    if (!completedData?.decisions?.length && !completedData?.reviewNotes?.length) return;
    const reviewedGroupIds = new Set((completedData.decisions || []).filter((d: any) => d.reviewer_group_id).map((d: any) => d.reviewer_group_id));
    const reviewedUserIds = new Set([
      ...(completedData.decisions || []).map((d: any) => d.reviewer_id).filter(Boolean),
      ...(completedData.reviewNotes || []).map((n: any) => n.reviewer_id).filter(Boolean),
    ]);
    if (reviewedGroupIds.size > 0) {
      setReviewerGroupIds(prev => prev.filter(id => !reviewedGroupIds.has(id)));
    }
    if (reviewedUserIds.size > 0) {
      setReviewerUserIds(prev => prev.filter(id => !reviewedUserIds.has(id)));
    }
    // Uncheck already-approved
    const approvedGroupIds = new Set(completedData.decisions.filter((d: any) => d.decision === 'approved' && d.reviewer_group_id).map((d: any) => d.reviewer_group_id));
    const approvedUserIds = new Set(completedData.decisions.filter((d: any) => d.decision === 'approved').map((d: any) => d.reviewer_id).filter(Boolean));
    if (approvedGroupIds.size > 0) {
      setApproverGroupIds(prev => prev.filter(id => !approvedGroupIds.has(id)));
    }
    if (approvedUserIds.size > 0) {
      setApproverUserIds(prev => prev.filter(id => !approvedUserIds.has(id)));
    }
  }, [completedData]);

  const hasReviewers = reviewerGroupIds.length > 0 || reviewerUserIds.length > 0;
  const hasApprovers = approverGroupIds.length > 0 || approverUserIds.length > 0;

  const handleProceedToSign = () => {
    if (!hasReviewers && !hasApprovers) { toast.error('Please select at least one reviewer or approver'); return; }
    setReviewStep('sign');
  };

  const handleSendForReview = async () => {
    setIsSendingReview(true);
    try {
      const cleanDocumentId = documentId.replace(/^template-/, '');

      // Export draft to .docx if a draft exists
      try {
        const { data: draftRow } = await supabase
          .from('document_studio_templates')
          .select('*')
          .eq('company_id', resolvedCompanyId)
          .eq('template_id', cleanDocumentId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const draftData = draftRow && Array.isArray(draftRow.sections) && draftRow.sections.length > 0
          ? { ...draftRow, sections: draftRow.sections, product_context: draftRow.product_context || undefined, document_control: draftRow.document_control || undefined, revision_history: Array.isArray(draftRow.revision_history) ? draftRow.revision_history : [], associated_documents: Array.isArray(draftRow.associated_documents) ? draftRow.associated_documents : [], metadata: draftRow.metadata || {} }
          : null;

        if (!draftData) {
          const { data: existingDoc } = await supabase.from('phase_assigned_document_template').select('file_path').eq('id', cleanDocumentId).single();
          if (!existingDoc?.file_path) {
            toast.error('This document has not been drafted yet. Please create the draft before sending for review.');
            setIsSendingReview(false);
            return;
          }
        }

        if (draftData) {
          const tpl: DocumentTemplate = {
            id: draftData.template_id, name: draftData.name, type: draftData.type,
            sections: draftData.sections as unknown as DocumentTemplate['sections'],
            productContext: (draftData.product_context || { productName: '', productType: '' }) as unknown as DocumentTemplate['productContext'],
            documentControl: draftData.document_control as unknown as DocumentTemplate['documentControl'],
            revisionHistory: (draftData.revision_history || []) as unknown as DocumentTemplate['revisionHistory'],
            associatedDocuments: (draftData.associated_documents || []) as unknown as DocumentTemplate['associatedDocuments'],
            metadata: (draftData.metadata || { version: '1.0', lastUpdated: new Date(), estimatedCompletionTime: '' }) as unknown as DocumentTemplate['metadata'],
          };
          const docxBlob = await DocumentExportService.generateDocxBlob(tpl);
          const timestamp = Date.now();
          const storagePath = `${resolvedCompanyId}/${cleanDocumentId}/review-draft-${timestamp}.docx`;
          const fName = `${draftData.name || documentName}.docx`;
          const { error: uploadError } = await supabase.storage.from('document-templates').upload(storagePath, docxBlob, { contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', upsert: false });
          if (uploadError) throw new Error(`Failed to upload draft document: ${uploadError.message}`);
          const { error: fileUpdateError } = await supabase.from('phase_assigned_document_template').update({ file_path: storagePath, file_name: fName, file_size: docxBlob.size, file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }).eq('id', cleanDocumentId);
          if (fileUpdateError) throw new Error(`Failed to update document file info: ${fileUpdateError.message}`);
          const newEditorKey = `collab-${cleanDocumentId}-v${timestamp}`;
          await supabase.from('document_editor_sessions').delete().eq('document_id', cleanDocumentId);
          await supabase.from('document_editor_sessions').insert({ document_id: cleanDocumentId, editor_key: newEditorKey, version: timestamp });
        }
      } catch (exportErr) {
        console.error('Draft export failed:', exportErr);
        toast.error('Failed to export draft document. Review was not sent.');
        setIsSendingReview(false);
        return;
      }

      // Update document with reviewer + approver assignments
      const allReviewerGroupIds = [...new Set(reviewerGroupIds)];
      const updatePayload: Record<string, any> = {
        reviewer_group_ids: allReviewerGroupIds, reviewer_user_ids: reviewerUserIds,
        approver_user_ids: approverUserIds, approver_group_ids: approverGroupIds,
        approver_due_date: approverDueDate || null, due_date: reviewerDueDate || null,
        status: 'In Review', updated_at: new Date().toISOString(),
      };
      if (approverUserIds.length > 0) updatePayload.approved_by = approverUserIds[0];
      const { error: updateError } = await supabase.from('phase_assigned_document_template').update(updatePayload as any).eq('id', cleanDocumentId);
      if (updateError) throw updateError;

      // Create review assignments
      for (const groupId of reviewerGroupIds) await createAssignment(resolvedCompanyId!, cleanDocumentId, groupId, reviewerDueDate || undefined);
      for (const userId of reviewerUserIds) {
        const isInGroup = allReviewerGroupIds.some(gid => { const group = reviewerGroups.find(g => g.id === gid); return group?.members?.some((m: any) => m.user_id === userId && m.is_active !== false); });
        if (!isInGroup) await supabase.from('document_review_assignments').insert({ company_id: resolvedCompanyId, document_id: cleanDocumentId, reviewer_user_id: userId, due_date: reviewerDueDate || null, status: 'pending' });
      }

      // Send notifications — separate for reviewers and approvers
      try {
        const actorName = user?.user_metadata?.first_name && user?.user_metadata?.last_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` : user?.email || 'Someone';
        let companyNameForUrl = '';
        const { data: companyData } = await supabase.from('companies').select('name').eq('id', resolvedCompanyId).single();
        if (companyData?.name) companyNameForUrl = encodeURIComponent(companyData.name);
        const actionUrl = companyNameForUrl ? `/app/company/${companyNameForUrl}/review` : undefined;

        // Collect reviewer recipient IDs
        const reviewerRecipientIds = new Set<string>();
        for (const groupId of reviewerGroupIds) {
          const { data: members } = await supabase.from('reviewer_group_members_new').select('user_id').eq('group_id', groupId).eq('is_active', true);
          members?.forEach(m => reviewerRecipientIds.add(m.user_id));
        }
        reviewerUserIds.forEach(id => reviewerRecipientIds.add(id));
        reviewerRecipientIds.delete(user?.id || '');

        // Collect approver recipient IDs
        const approverRecipientIds = new Set<string>();
        for (const groupId of approverGroupIds) {
          const { data: members } = await supabase.from('reviewer_group_members_new').select('user_id').eq('group_id', groupId).eq('is_active', true);
          members?.forEach(m => approverRecipientIds.add(m.user_id));
        }
        approverUserIds.forEach(id => approverRecipientIds.add(id));
        approverRecipientIds.delete(user?.id || '');

        const notifications: any[] = [];

        // Reviewer notifications
        Array.from(reviewerRecipientIds).forEach(userId => {
          notifications.push({
            user_id: userId, actor_id: user?.id, actor_name: actorName,
            company_id: resolvedCompanyId, product_id: productId,
            category: 'review' as const, action: 'review_assigned' as const,
            title: `Review requested: ${documentName}`,
            message: `${actorName} assigned you to review "${documentName}"`,
            priority: 'normal' as const, entity_type: 'document',
            entity_id: cleanDocumentId, entity_name: documentName,
            action_url: actionUrl,
            metadata: { role: 'reviewer', reviewer_due_date: reviewerDueDate || null },
          });
        });

        // Approver notifications (sent separately even if user is also a reviewer)
        Array.from(approverRecipientIds).forEach(userId => {
          notifications.push({
            user_id: userId, actor_id: user?.id, actor_name: actorName,
            company_id: resolvedCompanyId, product_id: productId,
            category: 'review' as const, action: 'approval_assigned' as const,
            title: `Approval requested: ${documentName}`,
            message: `${actorName} assigned you to approve "${documentName}"`,
            priority: 'normal' as const, entity_type: 'document',
            entity_id: cleanDocumentId, entity_name: documentName,
            action_url: actionUrl,
            metadata: { role: 'approver', approver_due_date: approverDueDate || null },
          });
        });

        if (notifications.length > 0) {
          await appNotificationService.createBulkNotifications(notifications);
        }
      } catch (notifErr) { console.error('Failed to send notifications:', notifErr); }

      const reviewerCount = new Set([...reviewerUserIds, ...reviewerGroupIds]).size;
      const approverCount = new Set([...approverUserIds, ...approverGroupIds]).size;
      toast.success(`Document sent for review (${reviewerCount} reviewer(s), ${approverCount} approver(s))`);
      setReviewStep('form');
      setDocStatus('In Review');
      setActiveView('draft');
      onDocumentSaved?.();
    } catch (err) {
      console.error('Failed to send for review:', err);
      toast.error('Failed to send document for review');
    } finally {
      setIsSendingReview(false);
    }
  };

  // Initialize template when drawer opens - check for existing draft first
  useEffect(() => {
    if (!open) {
      setTemplate(null);
      setExistingDraftId(null);
      return;
    }

    if (!resolvedCompanyId || !normalizedDocId) return;

    // For new unsaved documents, skip DB lookup — just create a blank template
    if (isUnsaved) {
      const sections = getDefaultSectionsForType(documentType, categoryPrefix, isRecord);
      setTemplate({
        id: normalizedDocId,
        name: documentName,
        type: documentType,
        sections,
        productContext: { id: productId || '', name: '', riskClass: '', phase: '', regulatoryRequirements: [] },
        documentControl: {
          sopNumber: '', documentTitle: documentName, version: '1.0',
          effectiveDate: new Date(), documentOwner: '',
          preparedBy: { name: '', title: '', date: new Date() },
          reviewedBy: { name: '', title: '', date: new Date() },
          approvedBy: { name: '', title: '', date: new Date() },
        },
        metadata: { version: '1.0', lastUpdated: new Date(), estimatedCompletionTime: '30 minutes' },
      });
      setExistingDraftId(null);
      return;
    }

    const loadOrCreateTemplate = async () => {
      setIsLoading(true);
      try {
        // Primary: look up by CI UUID (normalizedDocId)
        // Secondary: look up by documentReference (for legacy TF-key drafts)
        const templateIds = [normalizedDocId];
        if (documentReference && documentReference !== normalizedDocId) {
          templateIds.push(documentReference);
        }

        const bestDraftResult = await DocumentStudioPersistenceService.loadBestTemplateForTemplateIds(
          resolvedCompanyId,
          templateIds,
          productId
        );

        if (!bestDraftResult.success) {
          throw new Error(bestDraftResult.error || 'Failed to load document draft');
        }

        const existingDraft = bestDraftResult.data || null;

        if (existingDraft) {
          // Legacy migration: if draft was found under a deterministic key (e.g. TF-0-a)
          // but the CI UUID is different, rebind the draft to the CI UUID
          if (existingDraft.template_id && existingDraft.template_id !== normalizedDocId && documentReference) {
            console.log(`[DocumentDraftDrawer] Migrating legacy draft from ${existingDraft.template_id} to ${normalizedDocId}`);
            await DocumentStudioPersistenceService.rebindStudioDraftToCI(
              resolvedCompanyId,
              existingDraft.template_id,
              normalizedDocId,
              productId
            );
          }

          // Load existing draft
          let sections: any[] = Array.isArray(existingDraft.sections) ? existingDraft.sections : [];
          // Clean legacy Quality Manual drafts that have redundant "Chapter N" headings
          if (existingDraft.template_id?.startsWith('QM-FULL-')) {
            const { cleanQualityManualSections } = await import('@/utils/qualityManualContent');
            sections = cleanQualityManualSections(sections);
          }
          const docControl = existingDraft.document_control as any;

          const loadedTemplate: DocumentTemplate = {
            id: normalizedDocId,
            name: existingDraft.name,
            type: existingDraft.type,
            sections: sections as any,
            productContext: existingDraft.product_context as any || {
              id: productId || '',
              name: '',
              riskClass: '',
              phase: '',
              regulatoryRequirements: [],
            },
            documentControl: docControl || {
              sopNumber: '',
              documentTitle: existingDraft.name,
              version: '1.0',
              effectiveDate: new Date(),
              documentOwner: '',
              preparedBy: { name: '', title: '', date: new Date() },
              reviewedBy: { name: '', title: '', date: new Date() },
              approvedBy: { name: '', title: '', date: new Date() },
            },
            metadata: existingDraft.metadata as any || {
              version: '1.0',
              lastUpdated: new Date(),
              estimatedCompletionTime: '30 minutes',
            },
          };

          setExistingDraftId(existingDraft.id);
          setTemplate(loadedTemplate);
        } else {
          // No existing draft — create new blank template using CI doc ID as template_id
          const sections = getDefaultSectionsForType(documentType, categoryPrefix, isRecord);
          const newTemplate: DocumentTemplate = {
            id: normalizedDocId,
            name: documentName,
            type: documentType,
            sections,
            productContext: {
              id: productId || '',
              name: '',
              riskClass: '',
              phase: '',
              regulatoryRequirements: [],
            },
            documentControl: {
              sopNumber: '',
              documentTitle: documentName,
              version: '1.0',
              effectiveDate: new Date(),
              documentOwner: '',
              preparedBy: { name: '', title: '', date: new Date() },
              reviewedBy: { name: '', title: '', date: new Date() },
              approvedBy: { name: '', title: '', date: new Date() },
            },
            metadata: {
              version: '1.0',
              lastUpdated: new Date(),
              estimatedCompletionTime: '30 minutes',
            },
          };

          setExistingDraftId(null);
          setTemplate(newTemplate);
        }
      } catch (error) {
        console.error('Error loading existing draft:', error);
        // Fallback to new template on error
        const sections = getDefaultSectionsForType(documentType, categoryPrefix, isRecord);
        const newTemplate: DocumentTemplate = {
          id: normalizedDocId,
          name: documentName,
          type: documentType,
          sections,
          productContext: {
            id: productId || '',
            name: '',
            riskClass: '',
            phase: '',
            regulatoryRequirements: [],
          },
          documentControl: {
            sopNumber: '',
            documentTitle: documentName,
            version: '1.0',
            effectiveDate: new Date(),
            documentOwner: '',
            preparedBy: { name: '', title: '', date: new Date() },
            reviewedBy: { name: '', title: '', date: new Date() },
            approvedBy: { name: '', title: '', date: new Date() },
          },
          metadata: {
            version: '1.0',
            lastUpdated: new Date(),
            estimatedCompletionTime: '30 minutes',
          },
        };
        setExistingDraftId(null);
        setTemplate(newTemplate);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrCreateTemplate();
  }, [open, normalizedDocId, documentName, documentType, productId, resolvedCompanyId]);

  // Debounced DB save for inline content edits
  const debouncedDbSave = React.useMemo(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return (updatedTemplate: DocumentTemplate, draftId: string, cId: string) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          await DocumentStudioPersistenceService.saveTemplate({
            id: draftId,
            company_id: cId,
            template_id: normalizedDocId,
            name: updatedTemplate.name,
            type: updatedTemplate.type,
            sections: updatedTemplate.sections as any[],
            product_context: updatedTemplate.productContext,
            document_control: updatedTemplate.documentControl,
            metadata: updatedTemplate.metadata || { version: '1.0', lastUpdated: new Date() },
            product_id: productId,
          });
        } catch (e) {
          console.error('Auto-save to DB failed:', e);
        }
      }, 2000);
    };
  }, [normalizedDocId, productId]);

  const handleContentUpdate = useCallback((contentId: string, newContent: string) => {
    setTemplate(prev => {
      if (!prev) return prev;

      let updated: DocumentTemplate;

      // Handle document title update
      if (contentId === 'document-title') {
        updated = { ...prev, name: newContent };
      } else if (contentId === 'full-document-content') {
        // Full-document sync from LiveEditor (e.g. after AI "Paste to section").
        // newContent is JSON.stringify(sections[]).
        try {
          const parsed = JSON.parse(newContent);
          if (Array.isArray(parsed)) {
            updated = { ...prev, sections: parsed };
          } else {
            updated = prev;
          }
        } catch {
          updated = prev;
        }
      } else {
        // Update section content
        updated = {
          ...prev,
          sections: prev.sections.map(section => ({
            ...section,
            content: section.content.map(contentItem =>
              contentItem.id === contentId
                ? { ...contentItem, content: newContent }
                : contentItem
            ),
          })),
        };
      }

      DocumentTemplatePersistenceService.saveTemplateToLocalStorage(prev.id, updated);

      // Also persist to DB if we have a draft
      if (existingDraftId && resolvedCompanyId) {
        debouncedDbSave(updated, existingDraftId, resolvedCompanyId);
      }

      return updated;
    });
  }, [existingDraftId, resolvedCompanyId, debouncedDbSave]);

  const handleDocumentControlChange = useCallback((field: string, value: string) => {
    setTemplate(prev => {
      if (!prev) return prev;

      const dc = { ...(prev.documentControl || {}) } as any;

      if (field === 'documentOwner') {
        dc.documentOwner = value || undefined;
      } else if (field.startsWith('preparedBy.')) {
        dc.preparedBy = { ...(dc.preparedBy || {}), name: value || '' };
      } else if (field.startsWith('reviewedBy.')) {
        dc.reviewedBy = { ...(dc.reviewedBy || {}), name: value || '' };
      } else if (field.startsWith('approvedBy.')) {
        dc.approvedBy = { ...(dc.approvedBy || {}), name: value || '' };
      }

      return { ...prev, documentControl: dc };
    });
  }, []);

  const handleDocumentSaved = useCallback(() => {
    if (isUnsaved) {
      // Intercept: show scope dialog instead of closing
      setShowSaveCIDialog(true);
      return;
    }
    // Auto-clear resolved cross-references when document is saved
    if (documentNumber) {
      DocumentValidationService.clearResolvedReference(documentNumber);
      setReferencingSources([]);
    }
    onOpenChange(false);
    onDocumentSaved?.();
  }, [onOpenChange, onDocumentSaved, isUnsaved, documentNumber]);

  // Serialize current template sections to HTML for CI creation
  const getTemplateHtml = useCallback(() => {
    if (!template) return '';
    return template.sections
      .map(s => s.content.map(c => c.content || '').join('\n'))
      .join('\n');
  }, [template]);

  return (
    <>
    <ResizableDrawer
      open={open}
      onClose={() => onOpenChange(false)}
      defaultWidthPercent={97}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showAdvancedEditor && (
            <Tooltip title="Back to Draft Editor" arrow>
              <IconButton
                onClick={() => setShowAdvancedEditor(false)}
                size="small"
              >
                <ArrowLeft style={{ width: 20, height: 20 }} />
              </IconButton>
            </Tooltip>
          )}
          {(() => {
            const actionLabel =
              activeView === 'review'
                ? 'Review & Approve'
                : activeView === 'completed'
                  ? 'Completed'
                  : showAdvancedEditor
                    ? 'Advanced Editor'
                    : existingDraftId
                      ? 'Edit Draft'
                      : 'Create Draft';
            // Apply functional sub-prefix display (e.g. SOP-014 → SOP-CL-014)
            // and split the prefix from the title so the prefix can render
            // smaller/monospaced instead of inflating to h6 size.
            const displayName = formatSopDisplayName(documentName);
            const { prefix, title } = splitDocPrefix(displayName);
            return (
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ display: 'flex', alignItems: 'baseline', gap: 1, minWidth: 0 }}
              >
                <span>{actionLabel} —</span>
                {prefix && (
                  <span
                    style={{
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: '0.7em',
                      color: 'var(--mui-palette-text-secondary, rgba(0,0,0,0.6))',
                      fontWeight: 400,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {prefix}
                  </span>
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {title}
                </span>
              </Typography>
            );
          })()}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!showAdvancedEditor && (() => {
            const ext = (fileName || filePath || '').split('.').pop()?.toLowerCase();
            return ext === 'doc' || ext === 'docx';
          })() && (
            <Tooltip title="Advanced Editor" arrow>
              <IconButton
                onClick={() => { setShowAdvancedEditor(true); setEditorMounted(true); }}
                size="small"
                sx={{ color: '#1976d2', border: '1px solid #1976d2', borderRadius: '6px', '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' } }}
              >
                <FileEdit style={{ width: 16, height: 16 }} />
              </IconButton>
            </Tooltip>
          )}
          {companyId && (
            <Tooltip title="Send for Review" arrow>
              <IconButton
                onClick={() => setShowSendForReview(true)}
                size="small"
                sx={{ color: '#1976d2', border: '1px solid #1976d2', borderRadius: '6px', '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' } }}
              >
                <Send style={{ width: 16, height: 16 }} />
              </IconButton>
            </Tooltip>
          )}
          {resolvedCompanyId && (
            <Tooltip title="View in Document Control" arrow>
              <IconButton
                onClick={() => {
                  if (productId) {
                    drawerNavigate(`/app/product/${productId}/documents?docId=${documentId}`);
                  } else {
                    drawerNavigate(`/app/company/${encodeURIComponent(companyName || activeCompanyRole?.companyName || resolvedCompanyId)}/documents?docId=${documentId}`);
                  }
                }}
                size="small"
                sx={{ color: '#7c3aed', border: '1px solid #7c3aed', borderRadius: '6px', '&:hover': { backgroundColor: 'rgba(124, 58, 237, 0.08)' } }}
              >
                <ExternalLink style={{ width: 16, height: 16 }} />
              </IconButton>
            </Tooltip>
          )}
<Tooltip title={isStarred ? "Unstar document" : "Star document"} arrow>
              <IconButton
              onClick={(e) => { e.stopPropagation(); toggleStar(); }}
              size="small"
              disabled={starLoading}
              sx={{ color: isStarred ? '#eab308' : '#9ca3af', '&:hover': { backgroundColor: 'rgba(234, 179, 8, 0.08)' } }}
            >
              <Star style={{ width: 16, height: 16, fill: isStarred ? '#eab308' : 'none' }} />
            </IconButton>
          </Tooltip>
          <IconButton onClick={() => onOpenChange(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Document Lifecycle Stepper */}
      {(() => {
        const steps = [
          { label: 'Draft', icon: FilePen },
          { label: 'Review & Approve', icon: Eye },
          { label: 'Completed', icon: CircleCheckBig },
        ];
        const statusLower = docStatus?.toLowerCase() || '';
        let activeStep = 0;
        if (statusLower === 'draft' || statusLower === 'not started') activeStep = 0;
        else if (statusLower === 'under review' || statusLower === 'in review' || statusLower === 'changes requested' || statusLower === 'changes_requested' || statusLower === 'pending approval') activeStep = 1;
        else if (statusLower === 'approved' || statusLower === 'signed' || statusLower === 'esigned' || statusLower === 'completed' || statusLower === 'closed') activeStep = 3;

        return (
          <Box sx={{ px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: '#fafbfc' }}>
            {/* Step icons and connectors */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
              {steps.map((step, index) => {
                const isCompleted = index < activeStep;
                const isActive = index === activeStep;
                const StepIcon = step.icon;
                // Determine which steps are accessible based on document status
                // Draft (0) & Review & Approve (1): always accessible
                // Completed (2): only if activeStep >= 3 (approved/completed)
                const canNavigate =
                  index <= 1 ||
                  (index === 2 && activeStep >= 3);

                return (
                  <React.Fragment key={step.label}>
                    <Box
                      onClick={() => {
                        if (!canNavigate) {
                          if (index === 2) toast.error('Review & approval must be completed before viewing Completed');
                          return;
                        }
                        if (step.label === 'Draft') setActiveView('draft');
                        else if (step.label === 'Review & Approve') setActiveView('review');
                        else if (step.label === 'Completed') setActiveView('completed');
                      }}
                      sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90,
                        cursor: canNavigate ? 'pointer' : 'not-allowed',
                        opacity: canNavigate ? 1 : 0.5,
                        '&:hover': canNavigate ? { opacity: 0.8 } : {},
                      }}
                    >
                      {(() => {
                        // Per-step colors: Draft=yellow, Review & Approve=blue, Completed=green
                        const stepColors = [
                          { bg: '#eab308', border: '#eab308' },  // Draft - yellow
                          { bg: '#2563eb', border: '#2563eb' },  // Review & Approve - blue
                          { bg: '#16a34a', border: '#16a34a' },  // Completed - green
                        ];
                        const c = stepColors[index];
                        return (
                          <Box sx={{
                            width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: (isCompleted || isActive) ? c.bg : '#fff',
                            border: (isCompleted || isActive) ? `2px solid ${c.border}` : '2px solid #d1d5db',
                            color: (isCompleted || isActive) ? '#fff' : '#9ca3af',
                          }}>
                            {isCompleted ? <Check style={{ width: 18, height: 18 }} /> : isActive ? <Hourglass style={{ width: 18, height: 18 }} /> : <StepIcon style={{ width: 18, height: 18 }} />}
                          </Box>
                        );
                      })()}
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: isCompleted || isActive ? '#111827' : '#9ca3af', lineHeight: 1.2, mt: 0.5 }}>
                        {step.label}
                      </Typography>
                    </Box>
                    {index < steps.length - 1 && (
                      <Box sx={{ width: 48, height: 2, backgroundColor: isCompleted ? ['#eab308','#2563eb','#16a34a'][index] : '#d1d5db', borderRadius: 1, mt: -3 }} />
                    )}
                  </React.Fragment>
                );
              })}
            </Box>
          </Box>
        );
      })()}

      {/* Cross-reference tracking banner */}
      {referencingSources.length > 0 && (
        <Box sx={{
          mx: 2, mb: 1, px: 2, py: 1.5, borderRadius: 1,
          backgroundColor: 'hsl(var(--accent))',
          border: '1px solid hsl(var(--border))',
          display: 'flex', alignItems: 'flex-start', gap: 1.5,
        }}>
          <Link2 style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0, color: 'hsl(var(--primary))' }} />
          <Box sx={{ fontSize: '0.8rem', color: 'hsl(var(--foreground))' }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', mb: 0.25 }}>
              Cross-referenced by other documents
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
              {referencingSources.map(s => s.sourceDocName).join(', ')} reference this document number ({documentNumber}). Those cross-references will be validated once this document is completed.
            </Typography>
          </Box>
        </Box>
      )}

      {/* Body */}
      <Box sx={{ flex: 1, overflow: 'hidden', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'row' }}>
        {(activeView === 'review' || activeView === 'completed') ? (
          <>
            {/* Document Properties Sidebar */}
            <DocumentEditorSidebar
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
              widthClassName="w-[440px] min-w-[400px] max-w-[460px]"
              ciDocumentId={normalizedDocId || null}
              ciCompanyId={resolvedCompanyId}
              productId={productId}
              onIsRecordChange={setIsRecord}
              onRecordIdChange={setRecordId}
              onNextReviewDateChange={setNextReviewDate}
              onDocumentNumberChange={setDocumentNumber}
              isEditing={isEditingContent}
              onEditModeChange={setIsEditingContent}
              showSectionNumbers={showSectionNumbers}
              onShowSectionNumbersChange={(show) => {
                setShowSectionNumbers(show);
                if (template) {
                  setTemplate({
                    ...template,
                    formatOptions: { ...template.formatOptions, showSectionNumbers: show }
                  });
                }
              }}
              controlPanelProps={{
                productContext: template?.productContext,
                documentType: template?.type,
                isLocked: true,
                initialScope: productId ? 'product' : 'company',
                initialProductId: productId || undefined,
                template: template || undefined,
                disabled: !canEdit,
              }}
            />

            {/* Editor area */}
            <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Advanced Editor — hidden via CSS instead of unmounting to avoid DOM errors */}
            {editorMounted && resolvedDocUrl && editorKey && (
              <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden', display: showAdvancedEditor ? 'flex' : 'none' }}>
                <DocumentEditor
                  id="onlyoffice-editor-inline"
                  documentServerUrl={import.meta.env.VITE_ONLYOFFICE_SERVER_URL || "/api/onlyoffice/"}
                  config={{
                    document: {
                      fileType: getFileType(fileName || filePath || documentName),
                      key: editorKey,
                      title: fileName || documentName || "Document",
                      url: resolvedDocUrl,
                    },
                    documentType: getDocumentType(fileName || documentName),
                    editorConfig: {
                      mode: canEdit ? "edit" : "view",
                      callbackUrl: canEdit && filePath ? `${CALLBACK_URL}?path=${encodeURIComponent(filePath)}` : "",
                      user: {
                        id: user?.id || "anonymous",
                        name: [user?.user_metadata?.first_name, user?.user_metadata?.last_name].filter(Boolean).join(" ") || user?.email || "Anonymous",
                      },
                      customization: {
                        autosave: true,
                        forcesave: true,
                        features: {
                          spellcheck: { mode: true },
                        },
                        goback: { blank: false },
                      },
                      lang: "en",
                    },
                    height: "100%",
                    width: "100%",
                  }}
                  onLoadComponentError={(errorCode: number, errorDescription: string) => {
                    console.error("ONLYOFFICE Error:", errorCode, errorDescription);
                  }}
                />
              </Box>
            )}

            {/* Review / Approve form area */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 4 }}>
              {activeView === 'review' ? (
                <>
                  {/* Show loader until all review data is loaded */}
                  {(isLoadingCompleted || isLoadingReviewData || groupsLoading || authorsLoading) ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
                      <LoadingSpinner size="md" />
                    </Box>
                  ) : (
                  <>
                  {/* Send for Review & Approval form — collapsible card */}
                  <div className="rounded-xl border mt-2 mb-6">
                    <div
                      className="flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-muted/30 rounded-t-xl"
                      onClick={() => setReviewFormCollapsed(prev => !prev)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                          <Send className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <span className="text-sm font-semibold">Send for Review & Approval</span>
                      </div>
                      {reviewFormCollapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                    </div>

                    {!reviewFormCollapsed && (
                      <div className="px-4 pb-4 border-t">
                        <p className="text-xs text-muted-foreground mt-3 mb-3">
                          Assign <strong>{documentName}</strong> to reviewers and approvers.
                        </p>

                        {reviewStep === 'form' ? (
                          <div className="space-y-5">
                            {/* Reviewers Section */}
                            <div className="rounded-lg border border-blue-200 bg-blue-50/30 overflow-hidden">
                              <div className="flex items-center gap-2 px-3 py-2 bg-blue-100/60 border-b border-blue-200">
                                <Eye className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-semibold text-blue-800">Reviewers</span>
                              </div>
                              <div className="p-3 space-y-3">
                                <UserAndGroupSelector
                                  companyId={resolvedCompanyId!}
                                  label="Reviewers"
                                  icon={<Users className="h-4 w-4 text-blue-600" />}
                                  selectedGroupIds={reviewerGroupIds}
                                  onGroupIdsChange={setReviewerGroupIds}
                                  selectedUserIds={reviewerUserIds}
                                  onUserIdsChange={setReviewerUserIds}
                                  defaultExpanded={true}
                                  disabledUserIds={alreadyReviewedUserIds}
                                  groupLabel="Select reviewer group"
                                  disabledLabel="Already reviewed"
                                />
                                <div>
                                  <Label className="flex items-center gap-1 mb-2 text-xs text-blue-700">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Review Due Date
                                  </Label>
                                  <Input type="date" value={reviewerDueDate} onChange={(e) => setReviewerDueDate(e.target.value)} />
                                </div>
                              </div>
                            </div>

                            {/* Approvers Section */}
                            <div className="rounded-lg border border-green-200 bg-green-50/30 overflow-hidden">
                              <div className="flex items-center gap-2 px-3 py-2 bg-green-100/60 border-b border-green-200">
                                <ShieldCheck className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-semibold text-green-800">Approvers</span>
                              </div>
                              <div className="p-3 space-y-3">
                                <UserAndGroupSelector
                                  companyId={resolvedCompanyId!}
                                  label="Approvers"
                                  icon={<UserCheck className="h-4 w-4 text-green-600" />}
                                  selectedGroupIds={approverGroupIds}
                                  onGroupIdsChange={setApproverGroupIds}
                                  selectedUserIds={approverUserIds}
                                  onUserIdsChange={setApproverUserIds}
                                  defaultExpanded={true}
                                  disabledGroupIds={completedData?.decisions?.filter((d: any) => d.decision === 'approved' && d.reviewer_group_id).map((d: any) => d.reviewer_group_id) || []}
                                  disabledUserIds={alreadyApprovedUserIds}
                                  groupLabel="Select approver group"
                                  disabledLabel="Already approved"
                                />
                                <div>
                                  <Label className="flex items-center gap-1 mb-2 text-xs text-green-700">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Approval Due Date
                                  </Label>
                                  <Input type="date" value={approverDueDate} onChange={(e) => setApproverDueDate(e.target.value)} />
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <Button variant="outline" onClick={() => setActiveView('draft')} disabled={isSendingReview}>
                                Back to Draft
                              </Button>
                              <Button onClick={handleProceedToSign} disabled={isSendingReview || (!hasReviewers && !hasApprovers)}>
                                <Send className="h-4 w-4 mr-2" />
                                Send for Review & Approval
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <ESignatureFlow
                            documentId={documentId}
                            documentName={documentName}
                            meaning="author"
                            lockMeaning={true}
                            onComplete={handleSendForReview}
                            onBack={() => setReviewStep('form')}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Reviewer Details — show when document has been reviewed */}
                  {!['draft', 'not started'].includes(docStatus?.toLowerCase()) && completedData && (
                    (completedData.reviewerGroupDisplays?.length > 0 || completedData.individualReviewerNames?.length > 0 || completedData.approverGroupDisplays?.length > 0 || completedData.individualApproverNames?.length > 0) && (
                      <>
                        <div className="rounded-xl border mt-2 mb-6">
                          <div
                            className="flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-muted/30 rounded-t-xl"
                            onClick={() => setReviewDetailsCollapsed(prev => !prev)}
                          >
                            <div className="flex items-center gap-2">
                              <Eye style={{ width: 20, height: 20, color: '#2563eb' }} />
                              <span className="text-sm font-semibold">Review Details</span>
                              <span className="text-xs text-muted-foreground">— {documentName}</span>
                            </div>
                            {reviewDetailsCollapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        {!reviewDetailsCollapsed && (
                        <div className="px-4 pb-4 border-t pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            {/* Left Column — Reviewers */}
                            <div className="rounded-lg border border-blue-200 bg-blue-50/20 p-4 space-y-4">
                              {/* Header with status */}
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                  <Users className="h-4 w-4 text-blue-600" /> Reviewers
                                </h3>
                                {(() => {
                                  const reviewedUserIds = new Set<string>();
                                  (completedData.decisions || []).forEach((d: any) => {
                                    if (d.decision === 'reviewed' || d.decision === 'approved') reviewedUserIds.add(d.reviewer_id);
                                  });
                                  (completedData.reviewNotes || []).forEach((n: any) => {
                                    if (n.reviewer_id) reviewedUserIds.add(n.reviewer_id);
                                  });
                                  const totalReviewers = (completedData.individualReviewerNames?.length || 0);
                                  const isReviewComplete = ['pending approval', 'approved', 'completed', 'closed'].includes(docStatus?.toLowerCase());
                                  return (
                                    <span className={`inline-flex items-center text-xs font-medium rounded-full px-2.5 py-1 ${isReviewComplete ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                      {isReviewComplete ? 'Review Completed' : `In Review (${reviewedUserIds.size}/${totalReviewers || '?'})`}
                                    </span>
                                  );
                                })()}
                              </div>

                              {/* Reviewer Groups */}
                              {completedData.reviewerGroupDisplays?.map((g: any, i: number) => (
                                <div key={i} className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-700">{g.groupName}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1 ml-5">
                                    {g.members.map((name: string, j: number) => (
                                      <span key={j} className="inline-flex items-center text-xs bg-blue-50 text-blue-700 rounded-full px-2.5 py-1">
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}

                              {completedData.document?.due_date && (
                                <p className="text-xs text-muted-foreground">Due: {new Date(completedData.document.due_date).toLocaleDateString()}</p>
                              )}

                              {/* Reviewer Decisions (exclude approver decisions) */}
                              {(() => {
                                const reviewerDecisions = (completedData.decisions || []).filter((d: any) => d.decision !== 'approved');
                                return reviewerDecisions.length > 0 ? (
                                  <div className="border-t pt-3 space-y-2">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Decisions</span>
                                    {reviewerDecisions.map((d: any, i: number) => (
                                      <div key={i} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-medium">{d.reviewerName}</span>
                                          {d.groupName && <span className="text-xs text-muted-foreground">({d.groupName})</span>}
                                          <span className={`inline-flex items-center text-xs font-medium rounded-full px-2 py-0.5 ${
                                            d.decision === 'reviewed' ? 'bg-green-50 text-green-700' :
                                            d.decision === 'rejected' ? 'bg-red-50 text-red-700' :
                                            d.decision === 'changes_requested' ? 'bg-orange-50 text-orange-700' :
                                            'bg-gray-50 text-gray-700'
                                          }`}>
                                            {d.decision === 'reviewed' ? 'Reviewed' : d.decision === 'rejected' ? 'Rejected' : d.decision === 'changes_requested' ? 'Changes Requested' : d.decision}
                                          </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {d.updated_at ? new Date(d.updated_at).toLocaleDateString() : ''}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : null;
                              })()}

                              {/* Reviewer comments */}
                              {(() => {
                                const versions = (completedData.versions || []).sort((a: any, b: any) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime());
                                const getVersion = (dateStr: string) => {
                                  if (!dateStr || versions.length === 0) return null;
                                  const ts = new Date(dateStr).getTime();
                                  let matched: any = null;
                                  for (const v of versions) {
                                    if (new Date(v.uploaded_at).getTime() <= ts) matched = v;
                                  }
                                  return matched?.version_number || (versions.length > 0 ? versions[0].version_number : null);
                                };

                                const reviewerComments: { key: string; name: string; text: string; date: string | null; version: number | null; groupName: string | null }[] = [];
                                const seen = new Set<string>();

                                const userGroupName: Record<string, string> = {};
                                (completedData.decisions || []).forEach((d: any) => {
                                  if (d.reviewer_id && d.groupName) userGroupName[d.reviewer_id] = d.groupName;
                                });

                                (completedData.reviewNotes || []).filter((n: any) => n.type !== 'approval').forEach((n: any, i: number) => {
                                  const dedupKey = `${n.reviewer_id}::${n.note}`;
                                  if (!seen.has(dedupKey)) {
                                    seen.add(dedupKey);
                                    reviewerComments.push({ key: `note-${i}`, name: n.reviewerName, text: n.note, date: n.created_at, version: getVersion(n.created_at), groupName: userGroupName[n.reviewer_id] || null });
                                  }
                                });
                                (completedData.decisions || []).filter((d: any) => d.decision !== 'approved').forEach((d: any, i: number) => {
                                  if (!d.comment) return;
                                  const dedupKey = `${d.reviewer_id}::${d.comment}`;
                                  if (!seen.has(dedupKey)) {
                                    seen.add(dedupKey);
                                    reviewerComments.push({ key: `dec-${i}`, name: d.reviewerName, text: d.comment, date: d.updated_at, version: getVersion(d.updated_at), groupName: d.groupName || null });
                                  }
                                });
                                reviewerComments.sort((a, b) => {
                                  if (!a.date && !b.date) return 0;
                                  if (!a.date) return 1;
                                  if (!b.date) return -1;
                                  return new Date(b.date).getTime() - new Date(a.date).getTime();
                                });

                                const INITIAL_COUNT = 2;
                                const visibleComments = reviewCommentsExpanded ? reviewerComments : reviewerComments.slice(0, INITIAL_COUNT);
                                const hasMore = reviewerComments.length > INITIAL_COUNT;

                                return reviewerComments.length > 0 ? (
                                  <div className="border-t pt-3">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Comments ({reviewerComments.length})</span>
                                    <div className="mt-2 space-y-0 divide-y max-h-[300px] overflow-y-auto">
                                      {visibleComments.map(c => (
                                        <div key={c.key} className="flex gap-3 py-3 first:pt-0">
                                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                                            {c.name.charAt(0).toUpperCase()}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="text-sm font-medium">{c.name}</span>
                                              {c.groupName && (
                                                <span className="text-[11px] text-muted-foreground font-normal">{c.groupName}</span>
                                              )}
                                              <span className="text-[11px] text-muted-foreground">·</span>
                                              {c.date && (
                                                <span className="text-[11px] text-muted-foreground">
                                                  {new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date(c.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                              )}
                                              {c.version && (
                                                <span className="inline-flex items-center text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5 leading-none">
                                                  Version {c.version}
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap break-words">{c.text}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    {hasMore && (
                                      <button
                                        type="button"
                                        onClick={() => setReviewCommentsExpanded(prev => !prev)}
                                        className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                      >
                                        {reviewCommentsExpanded ? 'Show less' : `Show more (${reviewerComments.length - INITIAL_COUNT} more)`}
                                      </button>
                                    )}
                                  </div>
                                ) : null;
                              })()}

                              {/* Signatures */}
                              {completedData.signatures?.filter((s: any) => s.meaning === 'reviewer').length > 0 && (
                                <div className="border-t pt-3 space-y-2">
                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Signatures</span>
                                  {completedData.signatures?.filter((s: any) => s.meaning === 'reviewer').map((sig: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                      <div className="flex items-center gap-2">
                                        <PenTool className="h-3.5 w-3.5 text-blue-600" />
                                        <span className="font-medium">{sig.full_legal_name || sig.signer_name || sig.signer_email || 'Unknown'}</span>
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {sig.signed_at ? new Date(sig.signed_at).toLocaleDateString() : sig.created_at ? new Date(sig.created_at).toLocaleDateString() : ''}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Right Column — Approvers */}
                            <div className="rounded-lg border border-green-200 bg-green-50/20 p-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                  <UserCheck className="h-4 w-4 text-green-600" /> Approvers
                                </h3>
                                {(() => {
                                  const isApproved = ['approved', 'completed', 'closed'].includes(docStatus?.toLowerCase());
                                  const isPending = docStatus?.toLowerCase() === 'pending approval';
                                  return (
                                    <span className={`inline-flex items-center text-xs font-medium rounded-full px-2.5 py-1 ${
                                      isApproved ? 'bg-green-50 text-green-700' : isPending ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-700'
                                    }`}>
                                      {isApproved ? 'Approved' : isPending ? 'Pending Approval' : 'Assigned'}
                                    </span>
                                  );
                                })()}
                              </div>

                              {/* Approver Groups */}
                              {completedData.approverGroupDisplays?.map((g: any, i: number) => (
                                <div key={i} className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5 text-green-600" />
                                    <span className="text-sm font-medium text-green-700">{g.groupName}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1 ml-5">
                                    {g.members.map((name: string, j: number) => (
                                      <span key={j} className="inline-flex items-center text-xs bg-green-50 text-green-700 rounded-full px-2.5 py-1">
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              {(() => {
                                const groupMemberNames = new Set(completedData.approverGroupDisplays?.flatMap((g: any) => g.members) || []);
                                const uniqueIndividualApprovers = (completedData.individualApproverNames || []).filter((name: string) => !groupMemberNames.has(name));
                                return uniqueIndividualApprovers.length > 0 ? (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <UserCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                    {uniqueIndividualApprovers.map((name: string, i: number) => (
                                      <span key={i} className="inline-flex items-center text-xs bg-green-50 text-green-700 rounded-full px-2.5 py-1">
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                ) : null;
                              })()}

                              {completedData.document?.approver_due_date && (
                                <p className="text-xs text-muted-foreground">Due: {new Date(completedData.document.approver_due_date).toLocaleDateString()}</p>
                              )}

                              {/* Approver Decisions */}
                              {(() => {
                                const approverDecisions = completedData.decisions?.filter((d: any) => d.decision === 'approved') || [];
                                return approverDecisions.length > 0 ? (
                                  <div className="border-t pt-3 space-y-2">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Decisions</span>
                                    {approverDecisions.map((d: any, i: number) => (
                                      <div key={`d-${i}`} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                          <span className="font-medium">{d.reviewerName}</span>
                                          <span className="inline-flex items-center text-xs font-medium rounded-full px-2 py-0.5 bg-green-50 text-green-700">Approved</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{d.updated_at ? new Date(d.updated_at).toLocaleDateString() : ''}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : null;
                              })()}

                              {/* Approver Comments */}
                              {(() => {
                                const versions = (completedData.versions || []).sort((a: any, b: any) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime());
                                const getVersion = (dateStr: string) => {
                                  if (!dateStr || versions.length === 0) return null;
                                  const ts = new Date(dateStr).getTime();
                                  let matched: any = null;
                                  for (const v of versions) {
                                    if (new Date(v.uploaded_at).getTime() <= ts) matched = v;
                                  }
                                  return matched?.version_number || (versions.length > 0 ? versions[0].version_number : null);
                                };

                                const approverComments: { key: string; name: string; text: string; date: string | null; version: number | null; groupName: string | null }[] = [];
                                const seen = new Set<string>();

                                const userGroupName: Record<string, string> = {};
                                (completedData.decisions || []).forEach((d: any) => {
                                  if (d.reviewer_id && d.groupName) userGroupName[d.reviewer_id] = d.groupName;
                                });

                                (completedData.reviewNotes || []).filter((n: any) => n.type === 'approval').forEach((n: any, i: number) => {
                                  const dedupKey = `${n.reviewer_id}::${n.note}`;
                                  if (!seen.has(dedupKey)) {
                                    seen.add(dedupKey);
                                    approverComments.push({ key: `anote-${i}`, name: n.reviewerName, text: n.note, date: n.created_at, version: getVersion(n.created_at), groupName: userGroupName[n.reviewer_id] || null });
                                  }
                                });
                                (completedData.decisions || []).filter((d: any) => d.decision === 'approved').forEach((d: any, i: number) => {
                                  if (!d.comment) return;
                                  const dedupKey = `${d.reviewer_id}::${d.comment}`;
                                  if (!seen.has(dedupKey)) {
                                    seen.add(dedupKey);
                                    approverComments.push({ key: `adec-${i}`, name: d.reviewerName, text: d.comment, date: d.updated_at, version: getVersion(d.updated_at), groupName: d.groupName || null });
                                  }
                                });
                                approverComments.sort((a, b) => {
                                  if (!a.date && !b.date) return 0;
                                  if (!a.date) return 1;
                                  if (!b.date) return -1;
                                  return new Date(b.date).getTime() - new Date(a.date).getTime();
                                });

                                const INITIAL_COUNT = 2;
                                const visibleComments = approverCommentsExpanded ? approverComments : approverComments.slice(0, INITIAL_COUNT);
                                const hasMore = approverComments.length > INITIAL_COUNT;

                                return approverComments.length > 0 ? (
                                  <div className="border-t pt-3">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Comments ({approverComments.length})</span>
                                    <div className="mt-2 space-y-0 divide-y max-h-[300px] overflow-y-auto">
                                      {visibleComments.map(c => (
                                        <div key={c.key} className="flex gap-3 py-3 first:pt-0">
                                          <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                                            {c.name.charAt(0).toUpperCase()}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="text-sm font-medium">{c.name}</span>
                                              {c.groupName && (
                                                <span className="text-[11px] text-muted-foreground font-normal">{c.groupName}</span>
                                              )}
                                              <span className="text-[11px] text-muted-foreground">·</span>
                                              {c.date && (
                                                <span className="text-[11px] text-muted-foreground">
                                                  {new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date(c.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                              )}
                                              {c.version && (
                                                <span className="inline-flex items-center text-[10px] font-medium bg-green-50 text-green-600 border border-green-200 rounded px-1.5 py-0.5 leading-none">
                                                  Version {c.version}
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap break-words">{c.text}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    {hasMore && (
                                      <button
                                        type="button"
                                        onClick={() => setApproverCommentsExpanded(prev => !prev)}
                                        className="mt-2 text-xs font-medium text-green-600 hover:text-green-800 hover:underline"
                                      >
                                        {approverCommentsExpanded ? 'Show less' : `Show more (${approverComments.length - INITIAL_COUNT} more)`}
                                      </button>
                                    )}
                                  </div>
                                ) : null;
                              })()}

                              {/* Approver Signatures */}
                              {completedData.signatures?.filter((s: any) => s.meaning === 'approver').length > 0 && (
                                <div className="border-t pt-3 space-y-2">
                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Signatures</span>
                                  {completedData.signatures?.filter((s: any) => s.meaning === 'approver').map((sig: any, i: number) => (
                                    <div key={`s-${i}`} className="flex items-center justify-between text-sm">
                                      <div className="flex items-center gap-2">
                                        <PenTool className="h-3.5 w-3.5 text-green-600" />
                                        <span className="font-medium">{sig.full_legal_name || sig.signer_name || sig.signer_email || 'Unknown'}</span>
                                        <span className="text-xs text-muted-foreground">Signed</span>
                                      </div>
                                      <span className="text-xs text-muted-foreground">{sig.signed_at ? new Date(sig.signed_at).toLocaleDateString() : sig.created_at ? new Date(sig.created_at).toLocaleDateString() : ''}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Show message when no approvers assigned yet */}
                              {!completedData.approverGroupDisplays?.length && !completedData.individualApproverNames?.length && (
                                <p className="text-xs text-muted-foreground italic">No approvers assigned yet.</p>
                              )}
                            </div>
                          </div>

                        </div>
                        )}
                        </div>
                      </>
                    )
                  )}

                  {/* DOCX Comments (extracted from OnlyOffice) */}
                  {normalizedDocId && (
                    <div className="mt-4">
                      <details className="group">
                        <summary className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-foreground/80 hover:text-foreground select-none">
                          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                          Document Annotations
                        </summary>
                        <div className="mt-2 border rounded-lg overflow-hidden" style={{ height: '400px' }}>
                          <DocxCommentSidebar
                            documentId={normalizedDocId}
                            fullWidth
                          />
                        </div>
                      </details>
                    </div>
                  )}

                  {/* Review Drafts — always visible */}
                  {resolvedCompanyId && normalizedDocId && (
                    <div className="mt-4">
                      <ReviewDraftsList
                        companyId={resolvedCompanyId}
                        documentId={normalizedDocId}
                      />
                    </div>
                  )}
                  </>
                  )}
                </>
              ) : (
                /* Completed View */
                <>
                  {isLoadingCompleted ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
                      <LoadingSpinner size="md" />
                    </Box>
                  ) : completedData ? (
                    <div className="space-y-5">
                      {/* Success Banner */}
                      <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <CircleCheckBig className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h2 className="text-base font-semibold text-green-900">Document Completed</h2>
                            <p className="text-xs text-green-700">{documentName}</p>
                          </div>
                          <span className="ml-auto inline-flex items-center text-xs font-semibold rounded-full px-3 py-1 bg-green-600 text-white">
                            {completedData.document?.status || 'Completed'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-3 gap-3 mt-3">
                          <div className="bg-white/70 rounded-lg px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Version</p>
                            <p className="text-sm font-semibold">{completedData.document?.version || '1.0'}</p>
                          </div>
                          <div className="bg-white/70 rounded-lg px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Last Updated</p>
                            <p className="text-sm font-semibold">{completedData.document?.updated_at ? new Date(completedData.document.updated_at).toLocaleDateString() : '—'}</p>
                          </div>
                          <div className="bg-white/70 rounded-lg px-3 py-2">
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">File</p>
                            <p className="text-sm font-semibold truncate">{completedData.document?.file_name || '—'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Review & Approval Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Reviewers Card */}
                        {(completedData.reviewerGroupDisplays?.length > 0 || completedData.individualReviewerNames?.length > 0) && (
                          <div className="rounded-xl border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Eye className="h-3.5 w-3.5 text-blue-600" />
                                </div>
                                Reviewed By
                              </h3>
                              <span className="inline-flex items-center text-xs font-medium rounded-full px-2.5 py-1 bg-blue-50 text-blue-700">
                                Review Complete
                              </span>
                            </div>
                            {completedData.reviewerGroupDisplays?.map((g: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 flex-wrap">
                                <Users className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                <span className="text-sm font-medium text-blue-700">{g.groupName}</span>
                                <span className="text-xs text-muted-foreground">—</span>
                                {g.members.map((name: string, j: number) => (
                                  <span key={j} className="inline-flex items-center text-xs bg-blue-50 text-blue-700 rounded-full px-2.5 py-1">{name}</span>
                                ))}
                              </div>
                            ))}
                            {(() => {
                              const reviewGroupMemberNames = new Set(completedData.reviewerGroupDisplays?.flatMap((g: any) => g.members) || []);
                              const uniqueReviewers = (completedData.individualReviewerNames || []).filter((n: string) => !reviewGroupMemberNames.has(n));
                              return uniqueReviewers.length > 0 ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Eye className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                  {uniqueReviewers.map((name: string, i: number) => (
                                    <span key={i} className="inline-flex items-center text-xs bg-blue-50 text-blue-700 rounded-full px-2.5 py-1">{name}</span>
                                  ))}
                                </div>
                              ) : null;
                            })()}
                            {/* Review decisions */}
                            {completedData.decisions?.filter((d: any) => d.decision === 'reviewed' || (d.decision === 'approved' && !['approved', 'completed', 'closed'].includes(d.decision))).length > 0 && (
                              <div className="border-t pt-2 space-y-1">
                                {completedData.decisions.filter((d: any) => d.decision === 'reviewed').map((d: any, i: number) => (
                                  <div key={i} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <CheckCircle className="h-3 w-3 text-blue-600" />
                                      <span className="font-medium">{d.reviewerName}</span>
                                      <span className="text-blue-600">Reviewed</span>
                                      {d.comment && <span className="text-muted-foreground italic ml-1">"{d.comment}"</span>}
                                    </div>
                                    <span className="text-muted-foreground">{d.updated_at ? new Date(d.updated_at).toLocaleDateString() : ''}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {completedData.document?.due_date && (
                              <p className="text-xs text-muted-foreground">Due: {new Date(completedData.document.due_date).toLocaleDateString()}</p>
                            )}
                          </div>
                        )}

                        {/* Approvers Card */}
                        {(completedData.approverGroupDisplays?.length > 0 || completedData.individualApproverNames?.length > 0) && (
                          <div className="rounded-xl border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                  <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                                </div>
                                Approved By
                              </h3>
                              <span className="inline-flex items-center text-xs font-medium rounded-full px-2.5 py-1 bg-green-50 text-green-700">
                                Approved
                              </span>
                            </div>
                            {completedData.approverGroupDisplays?.map((g: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 flex-wrap">
                                <Users className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                <span className="text-sm font-medium text-green-700">{g.groupName}</span>
                                <span className="text-xs text-muted-foreground">—</span>
                                {g.members.map((name: string, j: number) => (
                                  <span key={j} className="inline-flex items-center text-xs bg-green-50 text-green-700 rounded-full px-2.5 py-1">{name}</span>
                                ))}
                              </div>
                            ))}
                            {(() => {
                              const approverGroupMemberNames = new Set(completedData.approverGroupDisplays?.flatMap((g: any) => g.members) || []);
                              const uniqueApprovers = (completedData.individualApproverNames || []).filter((n: string) => !approverGroupMemberNames.has(n));
                              return uniqueApprovers.length > 0 ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <UserCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                  {uniqueApprovers.map((name: string, i: number) => (
                                    <span key={i} className="inline-flex items-center text-xs bg-green-50 text-green-700 rounded-full px-2.5 py-1">{name}</span>
                                  ))}
                                </div>
                              ) : null;
                            })()}
                            {/* Approval decisions */}
                            {completedData.decisions?.filter((d: any) => d.decision === 'approved').length > 0 && (
                              <div className="border-t pt-2 space-y-1">
                                {completedData.decisions.filter((d: any) => d.decision === 'approved').map((d: any, i: number) => (
                                  <div key={i} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <CheckCircle className="h-3 w-3 text-green-600" />
                                      <span className="font-medium">{d.reviewerName}</span>
                                      <span className="text-green-600">Approved</span>
                                      {d.comment && <span className="text-muted-foreground italic ml-1">"{d.comment}"</span>}
                                    </div>
                                    <span className="text-muted-foreground">{d.updated_at ? new Date(d.updated_at).toLocaleDateString() : ''}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {completedData.document?.approver_due_date && (
                              <p className="text-xs text-muted-foreground">Due: {new Date(completedData.document.approver_due_date).toLocaleDateString()}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* E-Signatures */}
                      {completedData.signatures?.length > 0 && (
                        <div className="rounded-xl border p-4 space-y-3">
                          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                              <PenTool className="h-3.5 w-3.5 text-purple-600" />
                            </div>
                            E-Signatures ({completedData.signatures.length})
                          </h3>
                          <div className="divide-y">
                            {completedData.signatures.map((sig: any, i: number) => (
                              <div key={i} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                    sig.meaning === 'approver' ? 'bg-green-500' : sig.meaning === 'reviewer' ? 'bg-blue-500' : 'bg-gray-500'
                                  }`}>
                                    {(sig.full_legal_name || sig.signer_name || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{sig.full_legal_name || sig.signer_name || sig.signer_email || 'Unknown'}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{sig.meaning || 'signer'}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-medium">{sig.signed_at ? new Date(sig.signed_at).toLocaleDateString() : '—'}</p>
                                  <p className="text-[10px] text-muted-foreground">{sig.signed_at ? new Date(sig.signed_at).toLocaleTimeString() : ''}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Version History */}
                      {completedData.versions?.length > 0 && (
                        <div className="rounded-xl border p-4 space-y-3">
                          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                              <FilePen className="h-3.5 w-3.5 text-amber-600" />
                            </div>
                            Version History ({completedData.versions.length})
                          </h3>
                          <div className="divide-y">
                            {completedData.versions.map((v: any, i: number) => (
                              <div key={i} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold">
                                    v{v.version_number}
                                  </span>
                                  <div>
                                    <p className="text-sm font-medium">{v.file_name || `Version ${v.version_number}`}</p>
                                    {v.uploaded_by_name && <p className="text-xs text-muted-foreground">by {v.uploaded_by_name}</p>}
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground">{v.uploaded_at ? new Date(v.uploaded_at).toLocaleDateString() : '—'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CircleCheckBig className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No completion data available.</p>
                    </div>
                  )}
                </>
              )}
            </Box>
            </Box>
          </>
        ) : (
          <>
            {/* Editor area + optional comments sidebar */}
            <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'row', minWidth: 0 }}>

            {/* Editor column */}
            <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Advanced Editor — hidden via CSS instead of unmounting to avoid DOM errors */}
            {editorMounted && resolvedDocUrl && editorKey && (
              <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden', display: showAdvancedEditor ? 'flex' : 'none' }}>
                <DocumentEditor
                  id="onlyoffice-editor-inline"
                  documentServerUrl={import.meta.env.VITE_ONLYOFFICE_SERVER_URL || "/api/onlyoffice/"}
                  config={{
                    document: {
                      fileType: getFileType(fileName || filePath || documentName),
                      key: editorKey,
                      title: fileName || documentName || "Document",
                      url: resolvedDocUrl,
                    },
                    documentType: getDocumentType(fileName || documentName),
                    editorConfig: {
                      mode: canEdit ? "edit" : "view",
                      callbackUrl: canEdit && filePath ? `${CALLBACK_URL}?path=${encodeURIComponent(filePath)}` : "",
                      user: {
                        id: user?.id || "anonymous",
                        name: [user?.user_metadata?.first_name, user?.user_metadata?.last_name].filter(Boolean).join(" ") || user?.email || "Anonymous",
                      },
                      customization: {
                        autosave: true,
                        forcesave: true,
                        features: {
                          spellcheck: { mode: true },
                        },
                        goback: { blank: false },
                      },
                      lang: "en",
                    },
                    height: "100%",
                    width: "100%",
                  }}
                  onLoadComponentError={(errorCode: number, errorDescription: string) => {
                    console.error("ONLYOFFICE Error:", errorCode, errorDescription);
                  }}
                />
              </Box>
            )}

            {/* Draft Editor */}
            <Box
              ref={draftContentRef}
              className={showDocxComments ? 'scrollbar-hide' : ''}
              sx={{ flex: 1, overflow: 'auto', display: showAdvancedEditor ? 'none' : 'flex', flexDirection: 'column', position: 'relative' }}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                  <CircularProgress />
                </Box>
              ) : template ? (
                <LiveEditor
                  template={template}
                  onContentUpdate={handleContentUpdate}
                  companyId={companyId || activeCompanyRole?.companyId}
                  onDocumentSaved={handleDocumentSaved}
                  isEditingExistingDocument={!!existingDraftId}
                  editingDocumentId={existingDraftId || normalizedDocId}
                  docxSourceDocumentId={normalizedDocId}
                  onAIGenerate={() => {}}
                  onAddAutoNote={() => {}}
                  currentNotes={[]}
                  selectedScope={productId ? 'product' : 'company'}
                  selectedProductId={productId}
                  onDocumentControlChange={handleDocumentControlChange}
                  onPushToDeviceFields={productId ? handlePushToDeviceFields : undefined}
                  onCustomSave={isUnsaved ? () => setShowSaveCIDialog(true) : undefined}
                  isRecord={isRecord}
                  recordId={recordId || undefined}
                  nextReviewDate={nextReviewDate || undefined}
                  documentNumber={documentNumber || undefined}
                  companyLogoUrl={companyLogoUrl}
                  hideVersioning
                  onIsRecordChange={setIsRecord}
                  disableSopMentions={disableSopMentions}
                  showSectionNumbers={showSectionNumbers}
                  onShowSectionNumbersChange={(show) => {
                    setShowSectionNumbers(show);
                    if (template) {
                      setTemplate({
                        ...template,
                        formatOptions: { ...template.formatOptions, showSectionNumbers: show }
                      });
                    }
                  }}
                />
              ) : null}
              {/* Inline comment highlights on document text */}
              {showDocxComments && docxComments.length > 0 && (
                <DocxCommentHighlighter
                  containerRef={draftContentRef}
                  comments={docxComments}
                />
              )}
            </Box>
            </Box>

            {/* DOCX Comments Sidebar — visible when toggled */}
            {showDocxComments && normalizedDocId && (
              <DocxCommentSidebar
                documentId={normalizedDocId}
                onClose={() => setShowDocxComments(false)}
              />
            )}
            </Box>
          </>
        )}
      </Box>
    </ResizableDrawer>

    {/* Custom overlay — must exceed MUI Modal (z-1300) and Drawer paper */}
    {showSendForReview && (
      <div
        onClick={() => setShowSendForReview(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          margin: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 9998,
        }}
      />
    )}
    {companyId && (
      <SendToReviewGroupDialog
        open={showSendForReview}
        onOpenChange={setShowSendForReview}
        documentId={documentId}
        documentName={documentName}
        companyId={companyId}
        existingGroupIds={existingReviewerGroupIds}
        onSent={() => {
          onDocumentSaved?.();
        }}
      />
    )}
    {/* Save-as-CI scope dialog — shown on first save of unsaved documents */}
    {showSaveCIDialog && resolvedCompanyId && (
      <SaveContentAsDocCIDialog
        open={showSaveCIDialog}
        onOpenChange={(open) => { if (!open) setShowSaveCIDialog(false); }}
        title={documentName}
        htmlContent={getTemplateHtml()}
        templateIdKey={documentReference || documentId}
        companyId={resolvedCompanyId}
        companyName=""
        productId={productId}
        defaultScope={productId ? 'device' : 'enterprise'}
        onDocumentCreated={async (ciId, ciName, ciType) => {
          setShowSaveCIDialog(false);
          setIsUnsaved(false);

          // Rebind drawer identity to the real CI UUID
          setOverrideDocId(ciId);

          // Persist the current template content as a studio draft under the CI UUID
          if (template && resolvedCompanyId) {
            try {
              const savedDraft = await DocumentStudioPersistenceService.saveTemplate({
                company_id: resolvedCompanyId,
                template_id: ciId,
                name: ciName || template.name,
                type: template.type,
                sections: template.sections as any[],
                product_context: template.productContext,
                document_control: template.documentControl,
                metadata: template.metadata || { version: '1.0', lastUpdated: new Date() },
                product_id: productId,
              });
              if (savedDraft?.id) {
                setExistingDraftId(savedDraft.id);
              }
              // Update the in-memory template id so subsequent saves use CI UUID
              setTemplate(prev => prev ? { ...prev, id: ciId, name: ciName || prev.name } : prev);
            } catch (err) {
              console.error('[DocumentDraftDrawer] Failed to persist studio draft after CI creation:', err);
            }
          }

          onDocumentCreated?.(ciId, ciName, ciType);
        }}
      />
    )}
    </>
  );
}
