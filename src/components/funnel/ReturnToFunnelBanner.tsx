import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ReturnToFunnelBannerProps {
  productId: string;
}

export function ReturnToFunnelBanner({ productId }: ReturnToFunnelBannerProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const returnTo = searchParams.get('returnTo');

  // Handle both investor-share and venture-blueprint flows
  if (returnTo !== 'investor-share' && returnTo !== 'venture-blueprint') return null;

  const isVentureBlueprint = returnTo === 'venture-blueprint';
  const destination = isVentureBlueprint 
    ? `/app/product/${productId}/business-case?tab=venture-blueprint`
    : `/app/product/${productId}/investor-share`;
  const label = isVentureBlueprint ? 'Return to Venture Blueprint' : 'Return to Xyreg Genesis';

  return (
    <div className="bg-indigo-600 text-white px-6 py-3 w-full">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate(destination)}
        className="text-white hover:text-white/90 hover:bg-indigo-700"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {label}
      </Button>
    </div>
  );
}
