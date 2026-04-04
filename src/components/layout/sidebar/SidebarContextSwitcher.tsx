import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SidebarContextSwitcherProps {
  currentContext: "company" | "product";
  currentProductId: string | null;
  currentCompany: string | null;
  productOwnerCompany?: string | null;
  className?: string;
}

export function SidebarContextSwitcher({
  currentContext,
  currentProductId,
  currentCompany,
  productOwnerCompany,
  className
}: SidebarContextSwitcherProps) {
  const navigate = useNavigate();
  const { state, setOpen } = useSidebar();
  const { user } = useAuth();

  const handleCompanyClick = () => {
    if (currentContext === "company") return; // Already in company context

    // Store current sidebar state
    const isCollapsed = state === "collapsed";
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));

    // Determine which company to navigate to
    const targetCompany = currentCompany || productOwnerCompany;
    if (targetCompany) {
      navigate(`/app/company/${encodeURIComponent(targetCompany)}/portfolio-landing`);
    }
  };

  const handleProductClick = async () => {
    if (currentContext === "product") return; // Already in product context

    // Store current sidebar state
    const isCollapsed = state === "collapsed";
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));

    // Try to get last viewed product for this company
    const companyKey = currentCompany || productOwnerCompany;
    if (!companyKey) return;

    const lastProductKey = `lastViewedProduct_${companyKey}`;
    const lastProductId = localStorage.getItem(lastProductKey);

    if (!lastProductId || !user?.id) return;

    // Validate device access before navigating
    const { data: product } = await supabase
      .from('products')
      .select('id, company_id')
      .eq('id', lastProductId)
      .maybeSingle();

    if (!product?.company_id) {
      localStorage.removeItem(lastProductKey);
      toast.error('This device is no longer available');
      return;
    }

    // Check if user is owner or admin
    const { data: accessRows } = await supabase
      .from('user_company_access')
      .select('access_level, is_primary, is_invite_user')
      .eq('user_id', user.id)
      .eq('company_id', product.company_id)
      .limit(1);

    const accessData = accessRows?.[0] || null;
    const isOwner = accessData?.is_primary === true && !accessData?.is_invite_user;
    const isOwnerOrAdmin = isOwner || accessData?.access_level === 'admin';

    if (!isOwnerOrAdmin) {
      const { data: matrixRows } = await supabase
        .from('user_product_matrix')
        .select('product_ids')
        .eq('user_id', user.id)
        .eq('company_id', product.company_id)
        .eq('is_active', true)
        .limit(1);

      const matrixData = matrixRows?.[0] || null;

      // Only enforce restriction if an active matrix record exists
      if (matrixData) {
        const allowedIds = new Set<string>(matrixData.product_ids || []);

        if (!allowedIds.has(lastProductId)) {
          // Last viewed product is no longer accessible — try first accessible product
          localStorage.removeItem(lastProductKey);

          if (allowedIds.size > 0) {
            navigate(`/app/product/${Array.from(allowedIds)[0]}`);
          } else {
            toast.error('You do not have access to any devices');
          }
          return;
        }
      }
      // No active matrix record means unrestricted access
    }

    navigate(`/app/product/${lastProductId}`);
  };

  // Store current product as last viewed when in product context
  React.useEffect(() => {
    if (currentContext === "product" && currentProductId && productOwnerCompany) {
      const lastProductKey = `lastViewedProduct_${productOwnerCompany}`;
      localStorage.setItem(lastProductKey, currentProductId);
    }
  }, [currentContext, currentProductId, productOwnerCompany]);

  const canSwitchToCompany = Boolean(currentCompany || productOwnerCompany);
  const canSwitchToProduct = Boolean(currentProductId || (currentCompany && localStorage.getItem(`lastViewedProduct_${currentCompany}`)));

  // Collapsed state: show only vertical icons
  if (state === "collapsed") {
    return (
      <div className={cn("px-2 py-2 mb-1 mt-3 bg-muted/30 rounded-sm flex flex-col items-center gap-1", className)}>
        <button
          onClick={handleCompanyClick}
          disabled={!canSwitchToCompany}
          title="Switch to Company view"
          className={cn(
            "transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-30 p-1 rounded",
            currentContext === "company"
              ? "text-company-brand cursor-default"
              : "text-muted-foreground cursor-pointer hover:text-company-brand/70"
          )}
        >
          <Building2 size={21} />
        </button>

        <button
          onClick={handleProductClick}
          disabled={!canSwitchToProduct}
          title="Switch to Product view"
          className={cn(
            "transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-30 p-1 rounded",
            currentContext === "product"
              ? "text-company-brand cursor-default"
              : "text-muted-foreground cursor-pointer hover:text-company-brand/70"
          )}
        >
          <Package size={21} />
        </button>
      </div>
    );
  }

  // Expanded state: show full layout with text
  return (
    <div className={cn("px-3 py-1 mb-1 mt-3 bg-muted/30 rounded-sm", className)} style={{ paddingBottom: '20px' }}>
      <div className="flex items-center w-full justify-between text-xs font-medium uppercase">
        <div>
          <span className="text-company-brand font-bold" style={{ marginTop: '-15px' }}>
            {currentContext === "company" ? "COMPANY WIDE" : "DEVICE SPECIFIC"}
          </span>
        </div>

        <div className="flex items-center  gap-2">
          <button
            onClick={handleCompanyClick}
            disabled={!canSwitchToCompany}
            title="Switch to Company view"
            className={cn(
              "transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-30 p-1 rounded",
              currentContext === "company"
                ? "text-company-brand cursor-default"
                : "text-muted-foreground cursor-pointer hover:text-company-brand/70"
            )}
          >
            <Building2 size={18} />
          </button>

          <button
            onClick={handleProductClick}
            disabled={!canSwitchToProduct}
            title="Switch to Product view"
            className={cn(
              "transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-30 p-1 rounded",
              currentContext === "product"
                ? "text-company-brand cursor-default"
                : "text-muted-foreground cursor-pointer hover:text-company-brand/70"
            )}
          >
            <Package size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}