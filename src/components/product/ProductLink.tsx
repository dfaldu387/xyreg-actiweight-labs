
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface ProductLinkProps {
  productId: string;
  companyName?: string;
  children: React.ReactNode;
  showIcon?: boolean;
  asButton?: boolean;
  className?: string;
  showTooltip?: boolean;
}

export function ProductLink({ 
  productId, 
  companyName,
  children, 
  showIcon = true, 
  asButton = false,
  className = "",
  showTooltip = true
}: ProductLinkProps) {
  // If we have a company name and it's a button, use company route
  const linkTo = (asButton && companyName) 
    ? `/app/company/${encodeURIComponent(companyName)}`
    : `/app/product/${productId}`;

  // Handle click to stop propagation
  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  // These handlers prevent tooltip activation when showTooltip is false
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!showTooltip) {
      e.stopPropagation();
      // Find any parent tooltip elements and prevent them from opening
      const tooltipTrigger = (e.currentTarget as Element).closest('[data-state]');
      if (tooltipTrigger) {
        tooltipTrigger.setAttribute('data-state', 'closed');
      }
    }
  };
  
  const handleMouseLeave = (e: React.MouseEvent) => {
    if (!showTooltip) {
      e.stopPropagation();
    }
  };

  if (asButton) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className={className}
        asChild
      >
        <Link 
          to={linkTo} 
          className="flex items-center gap-1"
          onClick={handleLinkClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {children}
          {showIcon && <ExternalLink className="h-3.5 w-3.5" />}
        </Link>
      </Button>
    );
  }

  // If tooltip should not be shown, return simple link with tooltip prevention
  if (!showTooltip) {
    return (
      <Link 
        to={linkTo}
        className={`inline-flex items-center hover:underline ${className}`}
        onClick={handleLinkClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-tooltip-disabled="true"
      >
        {children}
        {showIcon && <ExternalLink className="ml-1 h-3.5 w-3.5" />}
      </Link>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link 
            to={linkTo}
            className={`inline-flex items-center hover:underline ${className}`}
            onClick={handleLinkClick}
          >
            {children}
            {showIcon && <ExternalLink className="ml-1 h-3.5 w-3.5" />}
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>View {companyName ? 'Company' : 'Product'} Dashboard</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
