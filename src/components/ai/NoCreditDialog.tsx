import React, { useState } from 'react';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppNotificationService } from '@/services/appNotificationService';
import { hasAdminPrivileges } from '@/utils/roleUtils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

interface NoCreditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  used?: number;
  limit?: number;
}

const notificationService = new AppNotificationService();

export function NoCreditDialog({ open, onOpenChange }: NoCreditDialogProps) {
  const { activeCompanyRole } = useCompanyRole();
  const { user } = useAuth();
  const companyId = activeCompanyRole?.companyId;
  const isAdmin = activeCompanyRole ? hasAdminPrivileges(activeCompanyRole.role) : false;
  const companyName = activeCompanyRole?.companyName || '';
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleBuyCredits = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !companyId) {
        toast.error('Please log in to purchase credits.');
        return;
      }

      const boosterPriceId = import.meta.env.VITE_STRIPE_PRICE_CORE_AI_BOOSTER;
      if (!boosterPriceId) {
        toast.error('AI Booster Pack not configured.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-booster-checkout', {
        body: {
          companyId,
          priceId: boosterPriceId,
          quantity: 1,
          companyName: encodeURIComponent(companyName),
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!error && data?.url) {
        onOpenChange(false);
        window.dispatchEvent(new Event('close-ai-panels'));
        window.open(data.url, '_blank');
      } else {
        toast.error(data?.error || 'Failed to create checkout.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCredits = async () => {
    if (!companyId || !user) return;
    setLoading(true);
    try {
      // Find company owner + all admins
      const { data: owner } = await supabase
        .from('user_company_access')
        .select('user_id')
        .eq('company_id', companyId)
        .eq('is_primary', true)
        .limit(1);

      const { data: admins } = await supabase
        .from('user_company_access')
        .select('user_id')
        .eq('company_id', companyId)
        .eq('access_level', 'admin');

      // Merge owner + admins, deduplicate
      const allRecipients = [...(owner || []), ...(admins || [])];
      const uniqueRecipientIds = [...new Set(allRecipients.map(r => r.user_id))];

      if (!uniqueRecipientIds.length) {
        toast.error('No owner or admins found for this company.');
        return;
      }

      const userName = user.user_metadata?.full_name || user.email || 'A team member';

      // Send notification to owner + all admins
      const notifications = uniqueRecipientIds.map((recipientId) => ({
        user_id: recipientId,
        actor_id: user.id,
        actor_name: userName,
        company_id: companyId,
        category: 'billing',
        action: 'credit_request',
        title: 'AI Credit Top-Up Requested',
        message: `${userName} has requested more AI credits. The team has run out of monthly credits and needs a Booster Pack to continue using AI features.`,
        priority: 'high' as const,
        entity_type: 'ai_credits',
        action_url: `/app/company/${encodeURIComponent(companyName)}/settings?tab=general`,
      }));

      const { error } = await notificationService.createBulkNotifications(notifications);
      if (error) {
        toast.error('Failed to send request. Please try again.');
      } else {
        setRequestSent(true);
        toast.success('Request sent to your admin(s).');
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setRequestSent(false); }}>
      <AlertDialogContent className="max-w-sm !z-[999999]">
        {open && <style dangerouslySetInnerHTML={{ __html: `[data-radix-portal]:has([role="alertdialog"]) { z-index: 999999 !important; }` }} />}
        <AlertDialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
            <Sparkles className="h-6 w-6 text-purple-500" />
          </div>
          <AlertDialogTitle className="text-center">You're out of AI credits</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {isAdmin
              ? 'Your monthly AI credits have been fully used. Top up with an AI Booster Pack (500 credits for $20) to keep using AI-powered features like document generation, suggestions, and analysis.'
              : 'Your monthly AI credits have been fully used. Request your admin to top up with an AI Booster Pack so your team can continue using AI-powered features.'
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          {isAdmin ? (
            <Button onClick={handleBuyCredits} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {loading ? 'Processing...' : 'Get More Credits - $20'}
            </Button>
          ) : requestSent ? (
            <Button disabled className="w-full bg-green-600 hover:bg-green-600">
              <Send className="h-4 w-4 mr-2" />
              Request Sent to Admin
            </Button>
          ) : (
            <Button onClick={handleRequestCredits} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {loading ? 'Sending...' : 'Request Credits from Admin'}
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            Maybe later
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
