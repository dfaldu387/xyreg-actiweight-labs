
import React, { useState, useEffect } from "react";
import { useDevMode } from "@/context/DevModeContext";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, ChevronDown, Settings, UserCheck, UserX, Building, RefreshCw, ShieldCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole } from "@/types/documentTypes";

export function DevCompanySwitcher() {
  const { 
    isDevMode, 
    selectedCompanies,
    primaryCompany,
    setPrimaryCompany,
    hasMultipleCompanies,
    selectedRole,
    // Company-specific internal status methods
    getCompanyInternalStatus,
    setCompanyInternalStatus,
    // Company-specific role methods
    getCompanyRole,
    setCompanyRole
  } = useDevMode();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  
  // Only show when DevMode is active
  if (!isDevMode) {
    return null;
  }
  
  // Guard against undefined values
  const companiesArray = selectedCompanies || [];
  
  // Get primary company internal status and role
  const isPrimaryInternal = primaryCompany 
    ? getCompanyInternalStatus(primaryCompany.id)
    : false;
    
  const primaryCompanyRole = primaryCompany
    ? getCompanyRole(primaryCompany.id)
    : selectedRole;
  
  const switchCompany = (company: { id: string; name: string }) => {
    if (primaryCompany?.id !== company.id) {
      setIsChanging(true);
      
      // Small delay to show the loading state
      setTimeout(() => {
        setPrimaryCompany(company);
        toast.success(`Switched to ${company.name}`);
        
        // Always go to clients page after switching for cleaner navigation
        navigate('/app/clients');
        setIsChanging(false);
      }, 300);
    }
    setOpen(false);
  };
  
  const openDevControls = () => {
    // Navigate to landing page with dev controls
    navigate('/');
    setOpen(false);
  };

  const goToCompanySettings = (companyId: string) => {
    // Find company name from ID for navigation
    const company = selectedCompanies.find(c => c.id === companyId);
    if (company) {
      setIsChanging(true);
      
      // Small delay to show loading state
      setTimeout(() => {
        const encodedCompanyName = encodeURIComponent(company.name);
        navigate(`/app/company/${encodedCompanyName}/settings`);
        setIsChanging(false);
        setOpen(false);
      }, 300);
    }
  };
  
  // Toggle internal/external status for a company
  const toggleCompanyInternalStatus = (event: React.MouseEvent, companyId: string) => {
    // Stop propagation to prevent menu item click from closing the dropdown
    event.stopPropagation();
    
    const currentStatus = getCompanyInternalStatus(companyId);
    setCompanyInternalStatus(companyId, !currentStatus);
    
    const company = selectedCompanies.find(c => c.id === companyId);
    if (company) {
      toast.success(`${company.name} set as ${!currentStatus ? 'internal' : 'external'} user`);
    }
  };
  
  // Handle role change for a company
  const handleRoleChange = (event: React.MouseEvent, companyId: string, role: UserRole) => {
    // Stop propagation to prevent menu item click
    event.stopPropagation();
    
    // Set company-specific role
    setCompanyRole(companyId, role);
    
    // Get company name for toast message
    const company = selectedCompanies.find(c => c.id === companyId);
    if (company) {
      toast.success(`${company.name} role set to ${role}`);
    }
  };

  // Check if user can access settings
  // Use standardized role definitions
  const canAccessSettings = primaryCompanyRole === "admin";

  // Determine button style based on whether we have companies selected
  const getButtonStyle = () => {
    if (isChanging) {
      return "border-blue-300 text-blue-800 bg-blue-50";
    }
    
    if (companiesArray.length === 0) {
      return "bg-red-50 border-red-300 text-red-800";
    }
    return "bg-yellow-50 border-yellow-300 text-yellow-800";
  };

  // Show company count in the button
  const companyCountText = companiesArray.length > 1 
    ? ` (${companiesArray.length})` 
    : '';

  // Get display name for role
  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case "admin": return "Admin";
      case "editor": return "Editor";
      case "viewer": return "Viewer";
      default: return "Unknown";
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={`flex items-center gap-2 ${getButtonStyle()}`} disabled={isChanging}>
          <Badge variant="outline" className={`${companiesArray.length === 0 ? "bg-red-100 border-red-300" : "bg-yellow-100 border-yellow-300"} text-xs`}>DEV</Badge>
          <div className="flex items-center space-x-1">
            {isChanging ? (
              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
            ) : null}
            {primaryCompany?.name || 'No Company Selected'}
            {companyCountText}
            {primaryCompany && (
              <div className="flex items-center">
                {isPrimaryInternal 
                  ? <UserCheck className="h-3 w-3 text-green-600 ml-1" /> 
                  : <UserX className="h-3 w-3 text-amber-600 ml-1" />
                }
                <Badge 
                  variant="outline" 
                  className={`ml-1 text-xs ${
                    primaryCompanyRole === "admin" 
                      ? "bg-purple-100 text-purple-800 border-purple-300" 
                      : primaryCompanyRole === "editor" 
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : "bg-gray-100 text-gray-800 border-gray-300"
                  }`}
                >
                  {getRoleDisplayName(primaryCompanyRole)}
                </Badge>
              </div>
            )}
            {companiesArray.length === 0 && (
              <AlertTriangle className="h-3 w-3 text-red-600 ml-1" />
            )}
          </div>
          <ChevronDown size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>
          <div className="flex justify-between items-center">
            <span>DevMode Company Selection</span>
            {companiesArray.length > 1 && (
              <Badge variant="secondary" className="text-xs ml-2">
                {companiesArray.length} companies
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {companiesArray.length === 0 ? (
          <div className="p-3 text-sm text-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 font-medium">No companies selected</p>
            <p className="text-red-600 text-xs mt-1">
              You must select at least one company in DevMode settings to see data
            </p>
            <Button 
              variant="destructive" 
              size="sm" 
              className="mt-3 w-full text-xs"
              onClick={openDevControls}
            >
              <Settings size={14} className="mr-1" /> 
              Configure DevMode
            </Button>
          </div>
        ) : (
          companiesArray.map(company => {
            const isCompanyInternal = getCompanyInternalStatus(company.id);
            const companyRole = getCompanyRole(company.id);
            return (
              <DropdownMenuItem 
                key={company.id} 
                className={primaryCompany?.id === company.id ? 'bg-blue-50 text-blue-700' : ''}
                onClick={() => switchCompany(company)}
              >
                <div className="flex flex-col w-full">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {primaryCompany?.id === company.id && (
                        <CheckCircle size={14} className="text-blue-500 shrink-0" />
                      )}
                      <span className={primaryCompany?.id !== company.id ? 'ml-5' : ''}>
                        {company.name} <span className="text-xs text-gray-500">({company.id.slice(0, 6)})</span>
                      </span>
                    </div>
                    <div 
                      className="flex items-center" 
                      onClick={(e) => toggleCompanyInternalStatus(e, company.id)}
                    >
                      <Switch 
                        checked={isCompanyInternal}
                        className="ml-2 data-[state=checked]:bg-green-500"
                      />
                      {isCompanyInternal ? (
                        <UserCheck size={14} className="ml-1 text-green-600" />
                      ) : (
                        <UserX size={14} className="ml-1 text-amber-600" />
                      )}
                    </div>
                  </div>
                  
                  {/* Role selector for each company */}
                  <div className="ml-5 mt-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <ShieldCheck size={14} className="mr-1 text-gray-500" />
                      <span className="text-xs text-gray-500">Role:</span>
                    </div>
                    <div 
                      className="flex items-center" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Select
                        value={companyRole}
                        onValueChange={(value) => handleRoleChange(
                          { stopPropagation: () => {} } as React.MouseEvent, 
                          company.id, 
                          value as UserRole
                        )}
                      >
                        <SelectTrigger className="h-6 text-xs w-24">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                          <SelectItem value="editor" className="text-xs">Editor</SelectItem>
                          <SelectItem value="viewer" className="text-xs">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })
        )}
        
        {canAccessSettings && primaryCompany && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => goToCompanySettings(primaryCompany.id)} 
              className="text-blue-700"
            >
              <Settings size={14} className="mr-2" />
              {primaryCompany.name} Settings
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={openDevControls} className="text-yellow-700">
          <Settings size={14} className="mr-2" />
          Development Settings
        </DropdownMenuItem>

        {/* Debug menu item for quick refresh */}
        <DropdownMenuItem onClick={() => window.location.reload()} className="text-blue-700">
          <RefreshCw size={14} className="mr-2" />
          Refresh App (Debug)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
