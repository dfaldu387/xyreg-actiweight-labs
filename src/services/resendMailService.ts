import { Resend } from 'resend';
import { InvitationEmail } from '../emails/InvitationEmail';
import { supabase } from '@/integrations/supabase/client';

// const resend = new Resend('re_jQi7pN5D_DiKohhkfEhpwmxcMVhcfoAJE'); // Use env variable in production
class ResendEmailService {
    async sendInvitationEmail(
        recipientEmail: string,
        inviterName: string,
        companyName: string,
        accessLevel: string,
        invitationLink: string
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            // Create abort controller for timeout
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

            const { data, error } = await supabase.functions.invoke('send-email', {
                body: {
                    recipientEmail,
                    inviterName,
                    companyName,
                    accessLevel,
                    invitationLink,
                }
            })

            clearTimeout(timeoutId)

            if (error) {
                console.error('Supabase function error:', error)
                return { success: false, error: error.message }
            }

            return data
        } catch (error: any) {
            console.error('Error calling Supabase function:', error)
            if (error.name === 'AbortError') {
                return { success: false, error: 'Request timed out' }
            }
            return { success: false, error: error.message }
        }
    }
}

export const postmarkService = new ResendEmailService();
