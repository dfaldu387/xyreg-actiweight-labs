import React, { useState } from 'react';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface NoCreditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  used?: number;
  limit?: number;
}

export function NoCreditDialog({ open, onOpenChange }: NoCreditDialogProps) {
  const { activeCompanyRole } = useCompanyRole();
  const { user } = useAuth();
  const companyId = activeCompanyRole?.companyId;
  const companyName = activeCompanyRole?.companyName || '';
  const [loading, setLoading] = useState(false);

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

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm !z-[999999]">
        {open && <style dangerouslySetInnerHTML={{ __html: `[data-radix-portal]:has([role="alertdialog"]) { z-index: 999999 !important; }` }} />}
        <AlertDialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
            <Sparkles className="h-6 w-6 text-purple-500" />
          </div>
          <AlertDialogTitle className="text-center">You're out of AI credits</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Your monthly AI credits have been fully used. Top up with an AI Booster Pack (500 credits for $20) to keep using AI-powered features like document generation, suggestions, and analysis.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleBuyCredits} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {loading ? 'Processing...' : 'Get More Credits - $20'}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            Maybe later
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
