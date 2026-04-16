import { supabase } from '@/integrations/supabase/client';

// Valid enum values from the database
const VALID_EXTERNAL_ROLES = ['consultant', 'auditor', 'contract_manufacturer', 'distributor', 'key_opinion_leader', 'other_external'] as const;

// Normalize external_role to a valid enum value (handles both enum values and legacy display names)
function toExternalRoleEnum(value: string | null | undefined): string | null {
    if (!value) return null;
    // Already a valid enum value
    if ((VALID_EXTERNAL_ROLES as readonly string[]).includes(value)) return value;
    // Legacy display name → try lowercase + underscore conversion
    const normalized = value.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '').replace(/_+/g, '_').replace(/^_|_$/g, '');
    if ((VALID_EXTERNAL_ROLES as readonly string[]).includes(normalized)) return normalized;
    // Special cases for legacy display names
    if (normalized.includes('contract') || normalized === 'contractor') return 'contract_manufacturer';
    if (normalized.includes('opinion_leader') || normalized.includes('kol')) return 'key_opinion_leader';
    return 'other_external';
}

class CredentialsEmailService {
    // Send login credentials email
    async sendCredentialsEmail(
        email: string,
        firstName: string,
        lastName: string,
        companyId: string,
        companyName: string,
        accessLevel: string,
        invitationToken: string
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            // Validate parameters before sending
            if (!email || !firstName || !companyId || !companyName || !accessLevel || !invitationToken) {
                console.error('Missing required parameters');
                return { success: false, error: 'Missing required parameters' };
            }

            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.warn('Request timeout - aborting...');
                controller.abort();
            }, 30000); // 30 second timeout

            // console.log('Calling Supabase edge function...');
            const requestPayload = {
                email,
                firstName,
                lastName,
                companyId,
                companyName,
                accessLevel,
                invitationToken,
                appUrl: window.location.origin || 'https://app.xyreg.com',
            };

            // console.log('Request payload:', JSON.stringify(requestPayload, null, 2));

            const { data, error } = await supabase.functions.invoke('send-login-detail-mail', {
                body: requestPayload
            });

            clearTimeout(timeoutId);

            // Handle edge function errors - parse actual error message from response
            if (error) {
                // Check if the error context contains the actual response body
                const errorBody = (error as any)?.context?.body ? await (error as any).context.json?.().catch(() => null) : null;
                const actualError = errorBody?.error || data?.error || error.message;

                // Check if this is a "user already registered" case
                if (actualError?.includes('already been registered') || actualError?.includes('already exists')) {
                    return { success: true, existing: true, message: 'User already exists' } as any;
                }

                console.error('Supabase function error:', actualError);
                return { success: false, error: actualError };
            }

            if (data) {
                // Fetch invitation first to read is_internal before creating access record
                const { data: userInvitation, error: userInvitationError } = await supabase.from('user_invitations').update({
                    status: 'accepted'
                }).eq('invitation_token', invitationToken)
                    .eq('email', email)
                    .select("*").single();
                if (userInvitationError) {
                    console.error('Error fetching user invitation:', userInvitationError);
                }

                const isInternal = userInvitation?.is_internal ?? false;
                const { data: companyAccess, error: companyAccessError } = await (supabase as any).from('user_company_access').insert({
                    company_id: data.user.company_id,
                    user_id: data.user.id,
                    access_level: data.user.access_level,
                    affiliation_type: isInternal ? 'internal' : 'external',
                    is_invite_user: true,
                    is_internal: isInternal,
                    functional_area: null,
                    external_role: !isInternal ? toExternalRoleEnum(userInvitation?.external_role) : null,
                }).select().single();


                const { data: userProfile, error: userProfileError } = await supabase.from('user_profiles').update({
                    first_name: firstName,
                    last_name: lastName,
                    is_invited: true
                }).eq('id', data.user.id).select("*");

                // Department assignment is now created in the edge function (send-login-detail-mail)
                // using supabaseAdmin to bypass RLS
                if (userInvitationError) {
                    console.error('Error fetching user invitation:', userInvitationError);
                }
                if (userInvitation) {
                    // console.log('userInvitation:', userInvitation);
                    // console.log('Looking for document_authors with user_invitation_id:', userInvitation.id, 'and company_id:', companyId);

                    // First, check if there's a document_authors entry with this user_invitation_id
                    const { data: existingAuthor, error: checkError } = await supabase
                        .from('document_authors')
                        .select('id, name, user_invitation_id')
                        .eq('user_invitation_id', userInvitation.id)
                        .eq('company_id', companyId)
                        .maybeSingle();

                    // console.log('Existing document_author found:', existingAuthor, 'error:', checkError);

                    if (existingAuthor) {
                        // Link document_authors entry with the new user_id
                        // This allows the Review Panel to find documents assigned to this author
                        const { data: documentAuthorUpdate, error: docAuthorError } = await (supabase as any)
                            .from('document_authors')
                            .update({
                                user_id: data.user.id
                            })
                            .eq('id', existingAuthor.id)
                            .select('id, name, user_id');

                        if (docAuthorError) {
                            console.error('Error updating document_authors with user_id:', docAuthorError);
                        } else {
                            // console.log('Successfully linked document_authors to user:', documentAuthorUpdate);
                        }
                    } else {
                        // console.log('No document_authors entry found with user_invitation_id:', userInvitation.id);
                        // console.log('This user was likely invited directly, not converted from a stakeholder.');
                    }
                }
                if (companyAccessError) {
                    console.error('Error fetching company access:', companyAccessError);
                }
                if (companyAccess) {
                    // console.log('companyAccess companyAccess', companyAccess);
                }
                if (userProfileError) {
                    console.error('Error fetching user profile:', userProfileError);
                }
                if (userProfile) {
                    // console.log('userProfile userProfile', userProfile);
                }
            }
            // Check if the data indicates success
            if (data && data.success === false) {
                // Check for "already registered" in data error too
                if (data.error?.includes('already been registered') || data.error?.includes('already exists')) {
                    return { success: true, existing: true, message: 'User already exists' } as any;
                }
                console.error('Function returned error:', data.error);
                return { success: false, error: data.error };
            }

            // console.log('=== CLIENT: Success ===');
            return data || { success: true };

        } catch (error: any) {
            console.error('=== CLIENT: Catch block error ===');
            console.error('Error calling Supabase function:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });

            if (error.name === 'AbortError') {
                return { success: false, error: 'Request timed out' };
            }
            return { success: false, error: error.message || 'Unknown error occurred' };
        }
    }

    // Test method to check if invitation exists
    async testInvitationExists(invitationToken: string, email: string): Promise<{ exists: boolean; error?: string; invitation?: any }> {
        try {
            // console.log('=== CLIENT: Testing invitation existence ===');
            // console.log('Token:', invitationToken);
            // console.log('Email:', email);

            const { data, error } = await supabase
                .from('user_invitations')
                .select('*')
                .eq('invitation_token', invitationToken)
                .eq('email', email)
                .single();

            // console.log('Invitation test result:');
            // console.log('- data:', data);
            // console.log('- error:', error);

            if (error) {
                if (error.code === 'PGRST116') {
                    return { exists: false, error: 'No invitation found with this token and email' };
                }
                return { exists: false, error: error.message };
            }

            return { exists: true, invitation: data };
        } catch (error: any) {
            console.error('Error testing invitation:', error);
            return { exists: false, error: error.message };
        }
    }

    // Method to list all pending invitations (for debugging)
    async listPendingInvitations(): Promise<{ invitations?: any[]; error?: string }> {
        try {
            // console.log('=== CLIENT: Listing pending invitations ===');

            const { data, error } = await supabase
                .from('user_invitations')
                .select('*')
                .eq('status', 'pending')
                .limit(10);

            // console.log('Pending invitations:');
            // console.log('- data:', data);
            // console.log('- error:', error);

            if (error) {
                return { error: error.message };
            }

            return { invitations: data };
        } catch (error: any) {
            console.error('Error listing invitations:', error);
            return { error: error.message };
        }
    }
}

export const credentialsEmailService = new CredentialsEmailService();