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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useReviewerGroups } from '@/hooks/useReviewerGroups';
import { useDocumentReviewAssignments } from '@/hooks/useDocumentReviewAssignments';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, Users, Calendar } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AppNotificationService } from '@/services/appNotificationService';

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
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [isSending, setIsSending] = useState(false);

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSend = async () => {
    if (selectedGroupIds.length === 0) {
      toast.error('Please select at least one reviewer group');
      return;
    }

    setIsSending(true);
    try {
      // Strip 'template-' prefix for DB operations (columns are UUID type)
      const cleanDocumentId = documentId.replace(/^template-/, '');

      // 1. Update reviewer_group_ids on the document
      const allGroupIds = [...new Set([...existingGroupIds, ...selectedGroupIds])];
      const { error: updateError } = await supabase
        .from('phase_assigned_document_template')
        .update({
          reviewer_group_ids: allGroupIds,
          status: 'In Review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', cleanDocumentId);

      if (updateError) {
        console.error('Failed to update document for review:', updateError);
        throw updateError;
      }

      // 2. Create review assignments for each selected group
      for (const groupId of selectedGroupIds) {
        await createAssignment(companyId, cleanDocumentId, groupId, dueDate || undefined);
      }

      // 3. Send in-app notifications to all members of selected groups
      try {
        const actorName = user?.user_metadata?.first_name && user?.user_metadata?.last_name
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
          : user?.email || 'Someone';

        // Fetch company name for the review page URL
        let companyNameForUrl = '';
        const { data: companyData } = await supabase
          .from('companies')
          .select('name')
          .eq('id', companyId)
          .single();
        if (companyData?.name) {
          companyNameForUrl = encodeURIComponent(companyData.name);
        }

        for (const groupId of selectedGroupIds) {
          const group = reviewerGroups.find((g) => g.id === groupId);
          if (!group) continue;

          // Fetch active members of this reviewer group
          const { data: members } = await supabase
            .from('reviewer_group_members_new')
            .select('user_id')
            .eq('group_id', groupId)
            .eq('is_active', true);

          if (!members?.length) continue;

          // Filter out the current user (don't notify yourself)
          const recipientIds = members
            .map((m) => m.user_id)
            .filter((uid) => uid !== user?.id);

          if (recipientIds.length === 0) continue;

          // Bulk create notifications for all group members
          const notifications = recipientIds.map((userId) => ({
            user_id: userId,
            actor_id: user?.id,
            actor_name: actorName,
            company_id: companyId,
            product_id: productId,
            category: 'review' as const,
            action: 'review_assigned',
            title: `Review requested: ${documentName}`,
            message: `${actorName} assigned you to review "${documentName}" via ${group.name}`,
            priority: 'normal' as const,
            entity_type: 'document',
            entity_id: cleanDocumentId,
            entity_name: documentName,
            action_url: companyNameForUrl
              ? `/app/company/${companyNameForUrl}/review`
              : undefined,
            metadata: {
              reviewer_group_id: groupId,
              reviewer_group_name: group.name,
              due_date: dueDate || null,
            },
          }));

          await appNotificationService.createBulkNotifications(notifications);
        }
      } catch (notifErr) {
        // Notifications are best-effort — don't block the main flow
        console.error('Failed to send in-app notifications:', notifErr);
      }

      // 4. Try to send email notifications (best-effort)
      try {
        for (const groupId of selectedGroupIds) {
          const group = reviewerGroups.find((g) => g.id === groupId);
          if (!group) continue;

          await supabase.functions.invoke('send-reviewer-assignment-email', {
            body: {
              reviewerEmail: '', // Edge function handles member lookup
              reviewerName: 'Reviewer',
              documentName,
              reviewerGroupName: group.name,
              companyName: companyId,
              dueDate: dueDate || undefined,
              senderName: 'System',
            },
          });
        }
      } catch {
        // Email is best-effort
      }

      toast.success(`Document sent to ${selectedGroupIds.length} reviewer group(s)`);
      setSelectedGroupIds([]);
      setDueDate('');
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
      <DialogContent className="sm:max-w-md z-[9999]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Send for Review
          </DialogTitle>
          <DialogDescription>
            Assign <strong>{documentName}</strong> to reviewer groups.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Reviewer Groups */}
          <div>
            <Label className="flex items-center gap-1 mb-2">
              <Users className="h-4 w-4" />
              Select Reviewer Groups
            </Label>
            {groupsLoading ? (
              <LoadingSpinner size="sm" />
            ) : reviewerGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviewer groups configured for this company.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-auto border rounded-md p-2">
                {reviewerGroups.map((group) => {
                  const alreadyAssigned = existingGroupIds.includes(group.id);
                  return (
                    <label
                      key={group.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedGroupIds.includes(group.id) || alreadyAssigned}
                        disabled={alreadyAssigned}
                        onCheckedChange={() => toggleGroup(group.id)}
                      />
                      <span className="text-sm font-medium">{group.name}</span>
                      {alreadyAssigned && (
                        <Badge variant="outline" className="text-xs ml-auto">
                          Already assigned
                        </Badge>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Due Date */}
          <div>
            <Label className="flex items-center gap-1 mb-2">
              <Calendar className="h-4 w-4" />
              Due Date (optional)
            </Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending || selectedGroupIds.length === 0}>
            {isSending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send to {selectedGroupIds.length || ''} Group{selectedGroupIds.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
