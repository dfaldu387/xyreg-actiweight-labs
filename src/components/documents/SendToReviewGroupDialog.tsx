import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useReviewerGroups } from '@/hooks/useReviewerGroups';
import { useDocumentReviewAssignments } from '@/hooks/useDocumentReviewAssignments';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, Users, Calendar, UserCheck } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AppNotificationService } from '@/services/appNotificationService';
import { DocumentExportService } from '@/services/documentExportService';
import { DocumentTemplate } from '@/types/documentComposer';
import { useDocumentAuthors } from '@/hooks/useDocumentAuthors';
import { UserAndGroupSelector } from '@/components/shared/UserAndGroupSelector';
import { ESignatureFlow } from '@/components/shared/ESignatureFlow';

const appNotificationService = new AppNotificationService();

interface SendToReviewGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName: string;
  companyId: string;
  productId?: string;
  existingGroupIds?: string[];
  onSent?: () => void;
}

export function SendToReviewGroupDialog({
  open,
  onOpenChange,
  documentId,
  documentName,
  companyId,
  productId,
  existingGroupIds = [],
  onSent,
}: SendToReviewGroupDialogProps) {
  const { user } = useAuth();
  const { reviewerGroups, isLoading: groupsLoading } = useReviewerGroups(companyId);
  const { createAssignment } = useDocumentReviewAssignments(documentId);
  const { authors, isLoading: authorsLoading } = useDocumentAuthors(companyId);

  // Reviewer state
  const [reviewerGroupIds, setReviewerGroupIds] = useState<string[]>([]);
  const [reviewerUserIds, setReviewerUserIds] = useState<string[]>([]);

  // Approver state
  const [approverGroupIds, setApproverGroupIds] = useState<string[]>([]);
  const [approverUserIds, setApproverUserIds] = useState<string[]>([]);

  const [reviewerDueDate, setReviewerDueDate] = useState('');
  const [approverDueDate, setApproverDueDate] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [dialogStep, setDialogStep] = useState<'form' | 'sign'>('form');
  const [alreadyReviewedUserIds, setAlreadyReviewedUserIds] = useState<string[]>([]);
  const [alreadyApprovedUserIds, setAlreadyApprovedUserIds] = useState<string[]>([]);

  // Load existing reviewer/approver data when dialog opens
  React.useEffect(() => {
    if (!open || !documentId) return;
    setIsLoadingExisting(true);
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
          ...reviewNotes.map((n: any) => n.reviewer_id).filter(Boolean),
        ]);
        const approvedUserIds = new Set(decisions.filter(d => d.decision === 'approved').map(d => d.reviewer_id).filter(Boolean));
        setAlreadyReviewedUserIds(Array.from(reviewedUserIds));
        setAlreadyApprovedUserIds(Array.from(approvedUserIds));

        if (data) {
          const existingReviewerUsers = Array.isArray((data as any).reviewer_user_ids) ? (data as any).reviewer_user_ids : [];
          const groupMemberIds = new Set<string>(existingReviewerUsers);
          const allGroupIds = Array.isArray(data.reviewer_group_ids) ? data.reviewer_group_ids : [];
          if (allGroupIds.length > 0) {
            setReviewerGroupIds(allGroupIds);
          }
          for (const gid of allGroupIds) {
            const group = reviewerGroups.find(g => g.id === gid);
            if (group?.members) {
              group.members.forEach((m: any) => {
                if (m.is_active !== false) groupMemberIds.add(m.user_id);
              });
            }
          }
          // Remove already-reviewed users from selection
          const eligibleUserIds = Array.from(groupMemberIds).filter(uid => !reviewedUserIds.has(uid));
          setReviewerUserIds(eligibleUserIds);
          const existingApproverUsers = Array.isArray((data as any).approver_user_ids) ? (data as any).approver_user_ids : [];
          if (existingApproverUsers.length > 0) {
            setApproverUserIds(existingApproverUsers.filter((uid: string) => !approvedUserIds.has(uid)));
          } else if (data.approved_by && !approvedUserIds.has(data.approved_by)) {
            setApproverUserIds([data.approved_by]);
          }
          const existingApproverGroups = Array.isArray((data as any).approver_group_ids) ? (data as any).approver_group_ids : [];
          const approvedGroupIds = new Set(decisions.filter(d => d.decision === 'approved' && d.reviewer_group_id).map(d => d.reviewer_group_id));
          const eligibleApproverGroups = existingApproverGroups.filter((gid: string) => !approvedGroupIds.has(gid));
          if (eligibleApproverGroups.length > 0) {
            setApproverGroupIds(eligibleApproverGroups);
            const approverMemberIds = new Set<string>(existingApproverUsers.length > 0
              ? existingApproverUsers.filter((uid: string) => !approvedUserIds.has(uid))
              : (data.approved_by && !approvedUserIds.has(data.approved_by) ? [data.approved_by] : []));
            for (const gid of eligibleApproverGroups) {
              const group = reviewerGroups.find(g => g.id === gid);
              if (group?.members) {
                group.members.forEach((m: any) => {
                  if (m.is_active !== false && !approvedUserIds.has(m.user_id)) approverMemberIds.add(m.user_id);
                });
              }
            }
            setApproverUserIds(Array.from(approverMemberIds));
          }
          if ((data as any).due_date) {
            setReviewerDueDate((data as any).due_date.split('T')[0]);
          }
          if ((data as any).approver_due_date) {
            setApproverDueDate((data as any).approver_due_date.split('T')[0]);
          }
        }
      } finally {
        setIsLoadingExisting(false);
      }
    })();
  }, [open, documentId, reviewerGroups]);

  const hasReviewers = reviewerGroupIds.length > 0 || reviewerUserIds.length > 0;
  const hasApprovers = approverGroupIds.length > 0 || approverUserIds.length > 0;

  // Validate and move to signing step
  const handleProceedToSign = () => {
    if (!hasReviewers) {
      toast.error('Please select at least one reviewer');
      return;
    }
    if (!hasApprovers) {
      toast.error('Please select at least one approver');
      return;
    }
    setDialogStep('sign');
  };

  // Called after author signature is complete
  const handleSignComplete = () => {
    handleSend();
  };

  const handleSend = async () => {

    setIsSending(true);
    try {
      const cleanDocumentId = documentId.replace(/^template-/, '');

      // 0. Export draft to .docx and upload (if a draft exists)
      try {
        const { data: draftRow } = await supabase
          .from('document_studio_templates')
          .select('*')
          .eq('company_id', companyId)
          .eq('template_id', cleanDocumentId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const draftData = draftRow && Array.isArray(draftRow.sections) && draftRow.sections.length > 0
          ? {
              ...draftRow,
              sections: draftRow.sections,
              product_context: draftRow.product_context || undefined,
              document_control: draftRow.document_control || undefined,
              revision_history: Array.isArray(draftRow.revision_history) ? draftRow.revision_history : [],
              associated_documents: Array.isArray(draftRow.associated_documents) ? draftRow.associated_documents : [],
              metadata: draftRow.metadata || {},
            }
          : null;

        if (!draftData) {
          const { data: existingDoc } = await supabase
            .from('phase_assigned_document_template')
            .select('file_path')
            .eq('id', cleanDocumentId)
            .single();

          if (!existingDoc?.file_path) {
            toast.error('This document has not been drafted yet. Please create the draft in Document Studio before sending for review.');
            setIsSending(false);
            return;
          }
        }

        if (draftData) {
          const template: DocumentTemplate = {
            id: draftData.template_id,
            name: draftData.name,
            type: draftData.type,
            sections: draftData.sections as unknown as DocumentTemplate['sections'],
            productContext: (draftData.product_context || { productName: '', productType: '' }) as unknown as DocumentTemplate['productContext'],
            documentControl: draftData.document_control as unknown as DocumentTemplate['documentControl'],
            revisionHistory: (draftData.revision_history || []) as unknown as DocumentTemplate['revisionHistory'],
            associatedDocuments: (draftData.associated_documents || []) as unknown as DocumentTemplate['associatedDocuments'],
            metadata: (draftData.metadata || {
              version: '1.0',
              lastUpdated: new Date(),
              estimatedCompletionTime: '',
            }) as unknown as DocumentTemplate['metadata'],
          };

          const docxBlob = await DocumentExportService.generateDocxBlob(template);
          const timestamp = Date.now();
          const storagePath = `${companyId}/${cleanDocumentId}/review-draft-${timestamp}.docx`;
          const fileName = `${draftData.name || documentName}.docx`;

          const { error: uploadError } = await supabase.storage
            .from('document-templates')
            .upload(storagePath, docxBlob, {
              contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              upsert: false,
            });

          if (uploadError) throw new Error(`Failed to upload draft document: ${uploadError.message}`);

          const { error: fileUpdateError } = await supabase
            .from('phase_assigned_document_template')
            .update({
              file_path: storagePath,
              file_name: fileName,
              file_size: docxBlob.size,
              file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            })
            .eq('id', cleanDocumentId);

          if (fileUpdateError) throw new Error(`Failed to update document file info: ${fileUpdateError.message}`);

          const newEditorKey = `collab-${cleanDocumentId}-v${timestamp}`;
          await supabase.from('document_editor_sessions').delete().eq('document_id', cleanDocumentId);
          await supabase.from('document_editor_sessions').insert({
            document_id: cleanDocumentId,
            editor_key: newEditorKey,
            version: timestamp,
          });
        }
      } catch (exportErr) {
        console.error('Draft export failed:', exportErr);
        toast.error('Failed to export draft document. Review was not sent.');
        setIsSending(false);
        return;
      }

      // 1. Update document with reviewer + approver assignments
      const allReviewerGroupIds = [...new Set(reviewerGroupIds)];
      const updatePayload: Record<string, any> = {
        reviewer_group_ids: allReviewerGroupIds,
        reviewer_user_ids: reviewerUserIds,
        approver_user_ids: approverUserIds,
        approver_group_ids: approverGroupIds,
        approver_due_date: approverDueDate || null,
        due_date: reviewerDueDate || null,
        status: 'In Review',
        updated_at: new Date().toISOString(),
      };
      // Set approved_by to first approver user for backward compat
      if (approverUserIds.length > 0) {
        updatePayload.approved_by = approverUserIds[0];
      }

      const { error: updateError } = await supabase
        .from('phase_assigned_document_template')
        .update(updatePayload as any)
        .eq('id', cleanDocumentId);

      if (updateError) throw updateError;

      // 2. Create review assignments for groups
      for (const groupId of reviewerGroupIds) {
        await createAssignment(companyId, cleanDocumentId, groupId, reviewerDueDate || undefined);
      }

      // 3. Create individual reviewer assignments
      for (const userId of reviewerUserIds) {
        // Check if user is already assigned via a group — skip if so
        const isInGroup = allReviewerGroupIds.some(gid => {
          const group = reviewerGroups.find(g => g.id === gid);
          return group?.members?.some((m: any) => m.user_id === userId && m.is_active !== false);
        });
        if (!isInGroup) {
          await supabase.from('document_review_assignments').insert({
            company_id: companyId,
            document_id: cleanDocumentId,
            reviewer_user_id: userId,
            due_date: reviewerDueDate || null,
            status: 'pending',
          });
        }
      }

      // 4. Send notifications — separate for reviewers and approvers
      try {
        const actorName = user?.user_metadata?.first_name && user?.user_metadata?.last_name
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
          : user?.email || 'Someone';

        let companyNameForUrl = '';
        const { data: companyData } = await supabase
          .from('companies')
          .select('name')
          .eq('id', companyId)
          .single();
        if (companyData?.name) companyNameForUrl = encodeURIComponent(companyData.name);
        const actionUrl = companyNameForUrl ? `/app/company/${companyNameForUrl}/review` : undefined;

        // Collect reviewer recipient IDs
        const reviewerRecipientIds = new Set<string>();
        for (const groupId of reviewerGroupIds) {
          const { data: members } = await supabase
            .from('reviewer_group_members_new')
            .select('user_id')
            .eq('group_id', groupId)
            .eq('is_active', true);
          members?.forEach(m => reviewerRecipientIds.add(m.user_id));
        }
        reviewerUserIds.forEach(id => reviewerRecipientIds.add(id));
        reviewerRecipientIds.delete(user?.id || '');

        // Collect approver recipient IDs
        const approverRecipientIds = new Set<string>();
        for (const groupId of approverGroupIds) {
          const { data: members } = await supabase
            .from('reviewer_group_members_new')
            .select('user_id')
            .eq('group_id', groupId)
            .eq('is_active', true);
          members?.forEach(m => approverRecipientIds.add(m.user_id));
        }
        approverUserIds.forEach(id => approverRecipientIds.add(id));
        approverRecipientIds.delete(user?.id || '');

        const notifications: any[] = [];

        // Reviewer notifications
        Array.from(reviewerRecipientIds).forEach(userId => {
          notifications.push({
            user_id: userId, actor_id: user?.id, actor_name: actorName,
            company_id: companyId, product_id: productId,
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
            company_id: companyId, product_id: productId,
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
      } catch (notifErr) {
        console.error('Failed to send notifications:', notifErr);
      }

      const reviewerCount = new Set([...reviewerUserIds, ...reviewerGroupIds]).size;
      const approverCount = new Set([...approverUserIds, ...approverGroupIds]).size;
      toast.success(`Document sent for review (${reviewerCount} reviewer(s), ${approverCount} approver(s))`);

      // Reset state
      setDialogStep('form');
      setReviewerGroupIds([]);
      setReviewerUserIds([]);
      setApproverGroupIds([]);
      setApproverUserIds([]);
      setReviewerDueDate('');
      setApproverDueDate('');
      onOpenChange(false);
      onSent?.();
    } catch (err) {
      console.error('Failed to send for review:', err);
      toast.error('Failed to send document for review');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg z-[9999] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Send for Review & Approval
          </DialogTitle>
          <DialogDescription>
            Assign <strong>{documentName}</strong> to reviewers and approvers.
          </DialogDescription>
        </DialogHeader>

        {dialogStep === 'form' ? (
          <>
            {(groupsLoading || authorsLoading || isLoadingExisting) ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="md" />
              </div>
            ) : (
            <div className="space-y-4 py-2">
              {/* Reviewers */}
              <UserAndGroupSelector
                companyId={companyId}
                label="Reviewers"
                icon={<Users className="h-4 w-4" />}
                selectedGroupIds={reviewerGroupIds}
                onGroupIdsChange={setReviewerGroupIds}
                selectedUserIds={reviewerUserIds}
                onUserIdsChange={setReviewerUserIds}
                disabledUserIds={alreadyReviewedUserIds}
              />

              {/* Approvers */}
              <UserAndGroupSelector
                companyId={companyId}
                label="Approvers"
                icon={<UserCheck className="h-4 w-4" />}
                selectedGroupIds={approverGroupIds}
                onGroupIdsChange={setApproverGroupIds}
                selectedUserIds={approverUserIds}
                onUserIdsChange={setApproverUserIds}
                disabledUserIds={alreadyApprovedUserIds}
              />

              {/* Due Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="flex items-center gap-1 mb-2 text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    Review Due Date
                  </Label>
                  <Input
                    type="date"
                    value={reviewerDueDate}
                    onChange={(e) => setReviewerDueDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1 mb-2 text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    Approval Due Date
                  </Label>
                  <Input
                    type="date"
                    value={approverDueDate}
                    onChange={(e) => setApproverDueDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
                Cancel
              </Button>
              <Button onClick={handleProceedToSign} disabled={isSending || !hasReviewers || !hasApprovers}>
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </DialogFooter>
          </>
        ) : (
          <ESignatureFlow
            documentId={documentId}
            documentName={documentName}
            meaning="author"
            lockMeaning={true}
            onComplete={handleSignComplete}
            onBack={() => setDialogStep('form')}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
