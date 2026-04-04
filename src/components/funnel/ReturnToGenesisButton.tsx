import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Crosshair, ArrowLeft } from 'lucide-react';
import { useGenesisFlowSession } from '@/hooks/useGenesisFlowSession';
import { useSidebarData } from '@/hooks/useSidebarData';
import { useAuth } from '@/context/AuthContext';
import { useSubscriptionContext } from '@/context/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Floating button that always appears on all app pages.
 * Provides an always-visible escape hatch to return to the guided Genesis flow.
 */
export function ReturnToGenesisButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionProductId } = useGenesisFlowSession();
  const { user } = useAuth();
  const { planName, isSubscriptionLoading } = useSubscriptionContext();
  const { currentCompany } = useSidebarData();

  const isInApp = location.pathname.startsWith('/app');
  const isGenesisPlan = !isSubscriptionLoading && planName && planName.toLowerCase() === 'genesis';

  // Extract productId from URL path (/app/product/:productId/...)
  const productIdFromUrl = location.pathname.match(/\/app\/product\/([^/]+)/)?.[1] || null;

  // Fetch the user's first product as fallback
  const { data: fetchedProductId } = useQuery({
    queryKey: ['genesis-single-product', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data: access } = await supabase
        .from('user_company_access')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single();
      if (!access?.company_id) return null;
      const { data: product } = await supabase
        .from('products')
        .select('id')
        .eq('company_id', access.company_id)
        .eq('is_archived', false)
        .limit(1)
        .single();
      return product?.id || null;
    },
    enabled: !productIdFromUrl && !sessionProductId && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Resolve productId: URL > session > fetched
  const productId = productIdFromUrl || sessionProductId || fetchedProductId;

  const searchParams = new URLSearchParams(location.search);
  const isOnGenesisPage = location.pathname === '/app/genesis' || location.pathname.endsWith('/genesis');
  const isOnGenesisTab = location.pathname.includes('/business-case') && searchParams.get('tab') === 'genesis';
  const isReturnToGenesis = searchParams.get('returnTo') === 'genesis';

  // Only show for Genesis plan users inside the app, hide on genesis-related pages
  if (!isInApp || !isGenesisPlan || isOnGenesisPage || isOnGenesisTab || isReturnToGenesis) {
    return null;
  }

  const handleReturn = () => {
    if (productId) {
      navigate(`/app/product/${productId}/business-case?tab=genesis`);
    } else if (currentCompany) {
      navigate(`/app/company/${encodeURIComponent(currentCompany)}/genesis`);
    } else {
      navigate('/app/genesis');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <Button
        onClick={handleReturn}
        className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2 pr-4 pl-3 py-2 h-auto rounded-full"
      >
        <div className="bg-amber-400/30 rounded-full p-1">
          <Crosshair className="h-4 w-4" />
        </div>
        <span className="font-medium">Return to Xyreg Genesis</span>
        <ArrowLeft className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
