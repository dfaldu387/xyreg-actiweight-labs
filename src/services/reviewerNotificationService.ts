import { supabase } from '@/integrations/supabase/client';
import type { ReviewerGroupMember } from './reviewerGroupService';

export interface DocumentAssignmentNotification {
  documentName: string;
  documentId: string;
  reviewerGroupId: string;
  reviewerGroupName: string;
  companyId: string;
  dueDate?: string;
  assignedBy: string;
}

export class ReviewerNotificationService {
  /**
   * Send email notifications to all members of reviewer groups when a document is assigned
   */
  async notifyReviewerGroupAssignment(notification: DocumentAssignmentNotification): Promise<boolean> {
    try {
      console.log('[ReviewerNotificationService] Starting email notification process for:', notification);
      console.log('[ReviewerNotificationService] Processing reviewer group assignment notification:', notification);

      // Get reviewer group members
      const { data: reviewerGroupData, error: groupError } = await supabase
        .from('reviewer_groups')
        .select(`
          *,
          reviewer_group_members_new!reviewer_group_members_new_group_id_fkey(
            *,
            user_profiles(
              first_name,
              last_name,
              email,
              avatar_url
            )
          )
        `)
        .eq('id', notification.reviewerGroupId)
        .single();

      if (groupError) {
        console.error('[ReviewerNotificationService] Error fetching reviewer group:', groupError);
        return false;
      }

      if (!reviewerGroupData) {
        console.warn('[ReviewerNotificationService] No reviewer group found:', notification.reviewerGroupId);
        return false;
      }

      // Get company name
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('name')
        .eq('id', notification.companyId)
        .single();

      if (companyError) {
        console.error('[ReviewerNotificationService] Error fetching company:', companyError);
        return false;
      }

      // Get sender details
      const { data: senderData, error: senderError } = await supabase
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('id', notification.assignedBy)
        .single();

      if (senderError) {
        console.error('[ReviewerNotificationService] Error fetching sender:', senderError);
      }

      const senderName = senderData 
        ? `${senderData.first_name || ''} ${senderData.last_name || ''}`.trim() || 'System Administrator'
        : 'System Administrator';

      const companyName = companyData?.name || 'Unknown Company';
      const members = reviewerGroupData.reviewer_group_members_new || [];

      // Check if notifications are enabled for this group
      const groupSettings = reviewerGroupData.settings as any;
      if (!groupSettings?.enableNotifications) {
        console.log('[ReviewerNotificationService] Notifications disabled for group:', notification.reviewerGroupName);
        return true; // Not an error, just disabled
      }

      console.log('[ReviewerNotificationService] Found members to notify:', members.length);

      // Send emails to all active members with email notification preferences enabled
      const emailPromises = members
        .filter((member: any) => {
          const isActive = member.is_active;
          const hasEmailEnabled = member.notification_preferences?.email !== false;
          const hasEmail = member.user_profiles?.email;
          
          return isActive && hasEmailEnabled && hasEmail;
        })
        .map(async (member: any) => {
          const memberName = member.user_profiles 
            ? `${member.user_profiles.first_name || ''} ${member.user_profiles.last_name || ''}`.trim()
            : 'Reviewer';

          const emailData = {
            reviewerEmail: member.user_profiles.email,
            reviewerName: memberName || 'Reviewer',
            documentName: notification.documentName,
            reviewerGroupName: notification.reviewerGroupName,
            companyName,
            dueDate: notification.dueDate,
            senderName
          };

          try {
            console.log('[ReviewerNotificationService] Sending email to:', emailData.reviewerEmail);
            console.log('[ReviewerNotificationService] Email payload:', emailData);

            const { data, error } = await supabase.functions.invoke('send-reviewer-assignment-email', {
              body: emailData
            });

            console.log('[ReviewerNotificationService] Edge function response:', { data, error });

            if (error) {
              console.error('[ReviewerNotificationService] Error sending email to:', emailData.reviewerEmail, error);
              return false;
            }

            console.log('[ReviewerNotificationService] Email sent successfully to:', emailData.reviewerEmail);
            return true;
          } catch (error) {
            console.error('[ReviewerNotificationService] Exception sending email to:', emailData.reviewerEmail, error);
            return false;
          }
        });

      // Wait for all emails to be sent
      const results = await Promise.all(emailPromises);
      const successCount = results.filter(Boolean).length;
      const totalCount = results.length;

      console.log(`[ReviewerNotificationService] Email notifications sent: ${successCount}/${totalCount}`);

      return successCount > 0 || totalCount === 0; // Success if at least one email sent or no emails to send
    } catch (error) {
      console.error('[ReviewerNotificationService] Error in notifyReviewerGroupAssignment:', error);
      return false;
    }
  }

  /**
   * Send notifications when reviewer groups are updated
   */
  async notifyGroupMembersUpdate(groupId: string, groupName: string, companyId: string, action: 'added' | 'removed', documentName: string): Promise<boolean> {
    try {
      console.log(`[ReviewerNotificationService] Notifying group members about ${action} action`);
      
      // Get group members if action is 'added'
      if (action === 'added') {
        const { data: groupData, error } = await supabase
          .from('reviewer_groups')
          .select(`
            *,
            reviewer_group_members_new!reviewer_group_members_new_group_id_fkey(
              *,
              user_profiles(email, first_name, last_name)
            )
          `)
          .eq('id', groupId)
          .single();

        if (error || !groupData) {
          console.error('[ReviewerNotificationService] Error fetching group data:', error);
          return false;
        }

        // Check if notifications are enabled
        const groupSettings = groupData.settings as any;
        if (!groupSettings?.enableNotifications) {
          console.log('[ReviewerNotificationService] Notifications disabled for group:', groupName);
          return true;
        }

        // Get company name
        const { data: companyData } = await supabase
          .from('companies')
          .select('name')
          .eq('id', companyId)
          .single();

        const companyName = companyData?.name || 'Unknown Company';

        // Send welcome emails to new members
        const newMembers = groupData.reviewer_group_members_new || [];
        const emailPromises = newMembers
          .filter((member: any) => {
            const notificationPrefs = member.notification_preferences as any;
            return member.user_profiles?.email && notificationPrefs?.email !== false;
          })
          .map(async (member: any) => {
            const memberName = member.user_profiles 
              ? `${member.user_profiles.first_name || ''} ${member.user_profiles.last_name || ''}`.trim()
              : 'Reviewer';

            const emailData = {
              reviewerEmail: member.user_profiles.email,
              reviewerName: memberName || 'Reviewer',
              reviewerGroupName: groupName,
              companyName,
              action: 'added',
              documentName: documentName
            };

            try {
              console.log('[ReviewerNotificationService] Sending welcome email to:', emailData.reviewerEmail);
              // console.log('emailData', emailData);
              const { data, error } = await supabase.functions.invoke('send-reviewer-assignment-email', {
                body: emailData
              });

              if (error) {
                console.error('[ReviewerNotificationService] Error sending welcome email to:', emailData.reviewerEmail, error);
                return false;
              }

              console.log('[ReviewerNotificationService] Welcome email sent successfully to:', emailData.reviewerEmail);
              return true;
            } catch (error) {
              console.error('[ReviewerNotificationService] Exception sending welcome email to:', emailData.reviewerEmail, error);
              return false;
            }
          });

        // Wait for all welcome emails to be sent
        const results = await Promise.all(emailPromises);
        const successCount = results.filter(Boolean).length;
        const totalCount = results.length;

        console.log(`[ReviewerNotificationService] Welcome emails sent: ${successCount}/${totalCount}`);
        return successCount > 0 || totalCount === 0;
      }

      return true;
    } catch (error) {
      console.error('[ReviewerNotificationService] Error in notifyGroupMembersUpdate:', error);
      return false;
    }
  }
}