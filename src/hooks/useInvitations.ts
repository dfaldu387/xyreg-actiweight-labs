import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { postmarkService } from '@/services/resendMailService';

export interface UserInvitation {
  id: string;
  email: string;
  company_id: string;
  access_level: 'viewer' | 'editor' | 'admin' | 'consultant' | 'author';
  is_internal: boolean;
  invited_by: string;
  invited_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invitation_token: string;
}

// Standalone function to send invitation (can be called outside of hook context)
export async function sendInvitationDirect(
  companyId: string,
  invitationData: {
    email: string;
    access_level: 'viewer' | 'editor' | 'admin' | 'consultant' | 'author';
    is_internal: boolean;
    firstName: string;
    lastName: string;
    functional_area?: string | null;
    external_role?: string | null;
    department_role?: string[] | null;
  }
): Promise<{ success: boolean; invitationId?: string }> {
  try {
    const emailLower = invitationData.email.toLowerCase().trim();

    // Check if user already exists in this company
    const { data: existingUsers } = await supabase
      .from('user_company_access')
      .select('id, user_id, user_profiles!user_company_access_user_id_fkey(email)')
      .eq('company_id', companyId);

    if (existingUsers?.some((u: any) =>
      u.user_profiles?.email?.toLowerCase() === emailLower
    )) {
      toast.info('This user is already a member of this company.');
      return { success: false };
    }

    // Check if there's already an invitation for this email in this company (any status)
    const { data: existingInvitations } = await supabase
      .from('user_invitations')
      .select('id, status')
      .eq('company_id', companyId)
      .ilike('email', emailLower);

    const existingInvitation = existingInvitations?.[0];

    if (existingInvitation && existingInvitation.status === 'pending') {
      toast.info('An invitation has already been sent to this email address.');
      return { success: false };
    }

    // Get current user profile for invited_by
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new Error('User not authenticated');
    }

    // Get current user's profile for inviter name
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('id', currentUser.user.id)
      .single();

    // Get company details
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    let data: any;

    if (existingInvitation) {
      // Clear old department assignments before re-activating
      await supabase
        .from('invitation_department_assignments')
        .delete()
        .eq('invitation_id', existingInvitation.id);

      // Re-activate existing cancelled/expired invitation
      const { data: updatedData, error } = await supabase
        .from('user_invitations')
        .update({
          status: 'pending',
          access_level: invitationData.access_level,
          is_internal: invitationData.is_internal,
          invited_by: currentUser.user.id,
          first_name: invitationData.firstName,
          last_name: invitationData.lastName,
          functional_area: invitationData.functional_area || null,
          external_role: invitationData.external_role || null,
          department_role: invitationData.department_role || null,
          invited_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', existingInvitation.id)
        .select()
        .single();

      if (error) {
        console.error('[sendInvitationDirect] Error re-activating invitation:', error);
        throw new Error(`Failed to send invitation: ${error.message}`);
      }
      data = updatedData;
    } else {
      // Insert new invitation record
      const { data: insertedData, error } = await supabase
        .from('user_invitations')
        .insert({
          email: invitationData.email,
          company_id: companyId,
          access_level: invitationData.access_level,
          is_internal: invitationData.is_internal,
          invited_by: currentUser.user.id,
          first_name: invitationData.firstName,
          last_name: invitationData.lastName,
          functional_area: invitationData.functional_area || null,
          external_role: invitationData.external_role || null,
          department_role: invitationData.department_role || null,
        })
        .select()
        .single();

      if (error) {
        console.error('[sendInvitationDirect] Error creating invitation:', error);
        throw new Error(`Failed to send invitation: ${error.message}`);
      }
      data = insertedData;
    }

    // Generate invitation link using the current origin (e.g., srk44.xyreg.com or app.xyreg.com)
    const invitationLink = `${window.location.origin || 'https://app.xyreg.com'}/accept-invitation?token=${data.invitation_token}`;

    // Prepare email data
    const inviterName = `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() ||
      'Someone';
    const companyName = company?.name || 'the company';

    // Send email using Postmark
    
    const emailResult = await postmarkService.sendInvitationEmail(
      invitationData.email,
      inviterName,
      companyName,
      invitationData.access_level,
      invitationLink
    );

    if (emailResult.success) {
      
    } else {
      console.warn('[sendInvitationDirect] Email failed to send, but invitation was created');
    }

    return { success: true, invitationId: data.id };
  } catch (err) {
    console.error('[sendInvitationDirect] Error sending invitation:', err);
    return { success: false };
  }
}

export function useInvitations(companyId?: string) {
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = async () => {
    if (!companyId) {
      setInvitations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      

      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false });

      if (error) {
        console.error('[useInvitations] Database error:', error);
        throw new Error(`Failed to fetch invitations: ${error.message}`);
      }

      
      // Type assert the data to ensure status is properly typed
      const typedInvitations = (data || []).map(invitation => ({
        ...invitation,
        status: invitation.status as 'pending' | 'accepted' | 'expired' | 'cancelled'
      })) as UserInvitation[];

      setInvitations(typedInvitations);
    } catch (err) {
      console.error('[useInvitations] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load invitations';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvitation = async (invitationData: {
    email: string;
    access_level: 'viewer' | 'editor' | 'admin' | 'consultant' | 'author';
    is_internal: boolean;
    firstName: string;
    lastName: string;
    functional_area?: string | null;
    external_role?: string | null;
    department_role?: string[] | null;
  }): Promise<{ success: boolean; invitationId?: string }> => {
    if (!companyId) return { success: false };

    try {
      const emailLower = invitationData.email.toLowerCase().trim();

      // Check if user already exists in this company
      const { data: existingUsers } = await supabase
        .from('user_company_access')
        .select('id, user_id, user_profiles!user_company_access_user_id_fkey(email)')
        .eq('company_id', companyId);

      if (existingUsers?.some((u: any) =>
        u.user_profiles?.email?.toLowerCase() === emailLower
      )) {
        toast.info('This user is already a member of this company.');
        return { success: false };
      }

      // Check if there's already an invitation for this email in this company (any status)
      const { data: existingInvitations } = await supabase
        .from('user_invitations')
        .select('id, status')
        .eq('company_id', companyId)
        .ilike('email', emailLower);

      const existingInvitation = existingInvitations?.[0];

      if (existingInvitation && existingInvitation.status === 'pending') {
        toast.info('An invitation has already been sent to this email address.');
        return { success: false };
      }

      // Get current user profile for invited_by
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('User not authenticated');
      }

      // Get current user's profile for inviter name
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, email')
        .eq('id', currentUser.user.id)
        .single();

      // Get company details
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();

      let data: any;

      if (existingInvitation) {
        // Clear old department assignments before re-activating
        await supabase
          .from('invitation_department_assignments')
          .delete()
          .eq('invitation_id', existingInvitation.id);

        // Re-activate existing cancelled/expired invitation
        const { data: updatedData, error } = await supabase
          .from('user_invitations')
          .update({
            status: 'pending',
            access_level: (invitationData as any).access_level,
            is_internal: invitationData.is_internal,
            invited_by: currentUser.user.id,
            first_name: invitationData.firstName,
            last_name: invitationData.lastName,
            functional_area: invitationData.functional_area || null,
            external_role: invitationData.external_role || null,
            department_role: invitationData.department_role || null,
            invited_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', existingInvitation.id)
          .select()
          .single();

        if (error) {
          console.error('[useInvitations] Error re-activating invitation:', error);
          throw new Error(`Failed to send invitation: ${error.message}`);
        }
        data = updatedData;
      } else {
        // Insert new invitation record
        const { data: insertedData, error } = await supabase
          .from('user_invitations')
          .insert({
            email: invitationData.email,
            company_id: companyId,
            access_level: (invitationData as any).access_level,
            is_internal: invitationData.is_internal,
            invited_by: currentUser.user.id,
            first_name: invitationData.firstName,
            last_name: invitationData.lastName,
            functional_area: invitationData.functional_area || null,
            external_role: invitationData.external_role || null,
            department_role: invitationData.department_role || null,
          })
          .select()
          .single();

        if (error) {
          console.error('[useInvitations] Error creating invitation:', error);
          throw new Error(`Failed to send invitation: ${error.message}`);
        }
        data = insertedData;
      }

      // Generate invitation link using the invitation token
      const invitationLink = `${window.location.origin || 'https://app.xyreg.com'}/accept-invitation?token=${data.invitation_token}`;

      // Prepare email data
      const inviterName = `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() ||
        'Someone';
      const companyName = company?.name || 'the company';

      // Send email using Postmark
      const emailResult = await postmarkService.sendInvitationEmail(
        invitationData.email,
        inviterName,
        companyName,
        invitationData.access_level,
        invitationLink
      );

      if (emailResult.success) {
        console.log('[useInvitations] Email sent successfully with ID:', emailResult.messageId);
        toast.success('Invitation sent successfully');
      } else {
        console.warn('[useInvitations] Email failed to send, but invitation was created');
        toast.warning('Invitation created but email failed to send. Please share the link manually.');
      }

      await fetchInvitations(); // Refresh the list
      return { success: true, invitationId: data.id };
    } catch (err) {
      console.error('[useInvitations] Error sending invitation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send invitation';
      toast.error(errorMessage);
      return { success: false };
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      console.log('[useInvitations] Cancelling invitation:', invitationId);

      const { error } = await supabase
        .from('user_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) {
        console.error('[useInvitations] Error cancelling invitation:', error);
        throw new Error(`Failed to cancel invitation: ${error.message}`);
      }

      toast.success('Invitation cancelled');
      await fetchInvitations(); // Refresh the list
      return true;
    } catch (err) {
      console.error('[useInvitations] Error cancelling invitation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel invitation';
      toast.error(errorMessage);
      return false;
    }
  };

  const resendInvitation = async (invitationId: string) => {
    try {
      console.log('[useInvitations] Resending invitation:', invitationId);

      // Update invitation record with new dates
      const { data: updatedInvitation, error } = await supabase
        .from('user_invitations')
        .update({
          invited_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          status: 'pending'
        })
        .eq('id', invitationId)
        .select()
        .single();

      if (error || !updatedInvitation) {
        console.error('[useInvitations] Error resending invitation:', error);
        throw new Error(`Failed to resend invitation: ${error?.message}`);
      }

      // Get current user's profile for inviter name
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: userProfile } = currentUser?.user
        ? await supabase
            .from('user_profiles')
            .select('first_name, last_name')
            .eq('id', currentUser.user.id)
            .single()
        : { data: null };

      // Get company details
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId!)
        .single();

      const inviterName = `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 'Someone';
      const companyName = company?.name || 'the company';
      const invitationLink = `${window.location.origin || 'https://app.xyreg.com'}/accept-invitation?token=${updatedInvitation.invitation_token}`;

      // Re-send the invitation email
      const emailResult = await postmarkService.sendInvitationEmail(
        updatedInvitation.email,
        inviterName,
        companyName,
        updatedInvitation.access_level,
        invitationLink
      );

      if (emailResult.success) {
        toast.success('Invitation resent successfully');
      } else {
        console.warn('[useInvitations] Email failed to send on resend');
        toast.warning('Invitation updated but email failed to send.');
      }

      await fetchInvitations(); // Refresh the list
      return true;
    } catch (err) {
      console.error('[useInvitations] Error resending invitation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend invitation';
      toast.error(errorMessage);
      return false;
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [companyId]);

  return {
    invitations,
    isLoading,
    error,
    fetchInvitations,
    sendInvitation,
    cancelInvitation,
    resendInvitation
  };
}
