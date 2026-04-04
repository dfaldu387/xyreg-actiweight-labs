
import React from "react";
import { useDevMode } from "@/context/DevModeContext";
import { useProductDetails } from "@/hooks/useProductDetails";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, RefreshCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation, useParams } from "react-router-dom";

// Add Company interface at file scope for proper typing
interface Company {
  id: string;
  name: string;
}

export function DevModeBadge() {
  const { 
    isDevMode, 
    selectedRole,
    primaryCompany,
    selectedCompanies,
    isInternalUser,
    getCompanyInternalStatus,
    getCompanyRole
  } = useDevMode();
  
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  // Get product details if we're on a product page
  const { data: product } = useProductDetails(params.productId);
  
  // Only show when Dev Mode is active
  if (!isDevMode) {
    return null;
  }
  
  // Guard against undefined values
  const companiesArray = selectedCompanies || [];
  const hasCompanies = companiesArray.length > 0;

  // Determine current context and role
  const getCurrentContextInfo = () => {
    // Check if we're on a product page
    if (location.pathname.includes('/app/product/') && product) {
      const productCompanyRole = getCompanyRole(product.company_id);
      return {
        context: `Product: ${product.name}`,
        role: productCompanyRole,
        companyId: product.company_id
      };
    }
    
    // Check if we're on a company page
    if (location.pathname.includes('/app/company/') && params.companyId) {
      const company = companiesArray.find(c => c.id === params.companyId);
      const companyRole = getCompanyRole(params.companyId);
      return {
        context: company ? `Company: ${company.name}` : 'Company',
        role: companyRole,
        companyId: params.companyId
      };
    }
    
    // Default to primary company context
    if (primaryCompany) {
      const primaryCompanyRole = getCompanyRole(primaryCompany.id);
      return {
        context: `Company: ${primaryCompany.name}`,
        role: primaryCompanyRole,
        companyId: primaryCompany.id
      };
    }
    
    // Fallback to global role
    return {
      context: 'Global',
      role: selectedRole,
      companyId: null
    };
  };

  const contextInfo = getCurrentContextInfo();
  
  // Simplify company display for tooltip
  const companyDisplay = hasCompanies
    ? `${companiesArray.length} ${companiesArray.length === 1 ? 'company' : 'companies'}`
    : 'No companies';

  // Get context company internal status
  const contextCompanyStatus = contextInfo.companyId 
    ? (getCompanyInternalStatus(contextInfo.companyId) ? 'Internal' : 'External') 
    : 'Not applicable';
    
  // Navigate to developer settings
  const goToDevSettings = () => {
    navigate('/');
  };
  
  // Get badge style based on company selection state
  const getBadgeStyle = () => {
    if (!hasCompanies) {
      return "bg-red-100 text-red-800 border-red-300";
    }
    return "bg-yellow-100 text-yellow-800 border-yellow-300";
  };

  // Format the role display
  const roleDisplay = `${contextInfo.role.charAt(0).toUpperCase() + contextInfo.role.slice(1)}`;
  const contextDisplay = contextInfo.context !== 'Global' ? ` (${contextInfo.context})` : '';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${getBadgeStyle()} flex items-center gap-1 cursor-help`}
          >
            <AlertTriangle size={12} />
            <span>Dev Mode - {roleDisplay}{contextDisplay}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="w-80 p-3" side="bottom">
          <div className="space-y-2 text-xs">
            <h4 className="font-semibold">Development Mode Active</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Current Context:</span>
                <span className="font-medium">{contextInfo.context}</span>
              </div>
              <div className="flex justify-between">
                <span>Context Role:</span>
                <span className="font-medium">{roleDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span>Global Role:</span>
                <span className="font-medium">{selectedRole || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span>Primary Company:</span>
                <span className="font-medium">{primaryCompany?.name || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span>Portfolio:</span>
                <span className="font-medium">{companyDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span>Context Company Status:</span>
                <span className="font-medium">{contextCompanyStatus}</span>
              </div>
              <div className="flex justify-between">
                <span>Global User Type:</span>
                <span className="font-medium">{isInternalUser ? 'Internal' : 'External'}</span>
              </div>
              
              {contextInfo.role !== selectedRole && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="font-medium mb-1">Role Override Active:</div>
                  <div className="text-xs text-blue-800">
                    Your role for this context ({roleDisplay}) differs from your global DevMode role ({selectedRole}).
                  </div>
                </div>
              )}
              
              {hasCompanies && companiesArray.length > 1 && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="font-medium mb-1">Selected Companies:</div>
                  <div className="max-h-20 overflow-y-auto">
                    <ul className="list-disc pl-4 text-xs">
                      {companiesArray.map(company => (
                        <li key={company.id} className="text-blue-800">
                          {company.name} ({getCompanyRole(company.id)})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {!hasCompanies && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                  <div className="flex items-center gap-1 mb-1">
                    <Info size={12} className="shrink-0" />
                    <span className="font-semibold">Action Required</span>
                  </div>
                  <p className="text-xs">No companies selected. You must configure DevMode settings to see data.</p>
                </div>
              )}
              
              <div className="flex flex-col gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToDevSettings} 
                  className="text-xs h-7 bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                >
                  Configure DevMode
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.reload()} 
                  className="flex items-center gap-1 text-xs h-7 bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100"
                >
                  <RefreshCcw size={12} />
                  <span>Refresh App</span>
                </Button>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
