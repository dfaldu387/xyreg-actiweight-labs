
import { RefreshCw, ShieldAlert, Archive } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/client";
import { useDevMode } from "@/context/DevModeContext";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useSimpleClients } from "@/hooks/useSimpleClients";
import { resolveCompanyIdentifier } from "@/utils/companyUtils";
import { useState, useEffect } from "react";

interface ProductDashboardHeaderProps {
  product: Product | null;
  onArchive: () => void;
  onEdit: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  subsection?: string;
}

export function ProductDashboardHeader({
  product,
  onArchive,
  onEdit,
  onRefresh,
  isRefreshing = false,
  subsection
}: ProductDashboardHeaderProps) {
  const navigate = useNavigate();
  const { isDevMode } = useDevMode();
  const { clients } = useSimpleClients();
  const [resolvedCompanyName, setResolvedCompanyName] = useState<string | null>(null);
  const [isResolvingCompany, setIsResolvingCompany] = useState(false);
  
  // Resolve company name from company ID
  useEffect(() => {
    const resolveCompanyName = async () => {
      // Product.company is now always a string (the company name)
      const companyName = product?.company;
      
      if (!companyName) {
        console.log("No company identifier found in product");
        setResolvedCompanyName(null);
        return;
      }

      setIsResolvingCompany(true);
      console.log("Using company name directly:", companyName);
      setResolvedCompanyName(companyName);
      setIsResolvingCompany(false);
    };

    resolveCompanyName();
  }, [product?.company, clients]);

  if (!product) {
    return (
      <div className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Product Not Found</h2>
            <p className="text-muted-foreground">
              We couldn't find the requested product.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => navigate('/')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle navigation back to company dashboard
  const navigateToCompany = () => {
    if (!resolvedCompanyName) {
      navigate('/');
      return;
    }

    console.log("Navigating to company by name:", resolvedCompanyName);
    navigate(`/app/company/${encodeURIComponent(resolvedCompanyName)}`);
  };

  // Handle navigation to product dashboard
  const navigateToProduct = () => {
    navigate(`/app/product/${product.id}`);
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <div className="space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <button 
                    onClick={navigateToCompany}
                    className="text-xl font-bold text-company-brand hover:text-primary transition-colors cursor-pointer"
                    disabled={isResolvingCompany}
                  >
                    {isResolvingCompany ? 'Loading...' : (resolvedCompanyName || 'Unknown Company')}
                  </button>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {subsection ? (
                  <BreadcrumbLink asChild>
                    <button 
                      onClick={navigateToProduct}
                      className="text-xl font-bold text-company-brand hover:text-primary transition-colors cursor-pointer"
                    >
                      {product.name}
                    </button>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="text-xl font-bold text-primary">
                    {product.name}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {subsection && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-xl font-bold text-primary">
                      {subsection}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          <p className="text-muted-foreground">
            {subsection ? `Manage and monitor your product's ${subsection.toLowerCase()}.` : 'Manage and monitor your product\'s progress.'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={onRefresh} 
                    disabled={isRefreshing}
                    className="mr-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh product data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isDevMode && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-400 flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              <span>Dev Mode</span>
            </Badge>
          )}
          <Button variant="outline" onClick={onArchive} className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Archive
          </Button>
        </div>
      </div>
    </div>
  );
}
