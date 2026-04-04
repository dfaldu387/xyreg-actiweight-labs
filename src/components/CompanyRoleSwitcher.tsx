
import React, { useState } from "react";
import { useCompanyRole } from "@/context/CompanyRoleContext";
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
import { 
  Building, 
  CheckCircle, 
  ChevronDown, 
  RefreshCw,
  UserCheck,
  UserX,
  Users
} from "lucide-react";
import { UserRoleBadge } from "@/components/auth/UserRoleBadge";
import { hasAdminPrivileges } from "@/utils/roleUtils";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export function CompanyRoleSwitcher() {
  const {
    companyRoles,
    activeCompanyRole,
    switchCompanyRole,
    isLoading
  } = useCompanyRole();
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [open, setOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  
  // CRITICAL FIX: Don't show company menu when on /app/clients (no company selected)
  const isOnClientsPage = location.pathname === '/app/clients';
  
  // If user has no companies or we're still loading, don't render
  // Also don't render if on clients page (no company selected)
  if ((companyRoles.length === 0 && !isLoading) || !activeCompanyRole || isOnClientsPage) {
    return null;
  }

  const handleSwitchCompany = async (companyId: string) => {
    setIsChanging(true);
    await switchCompanyRole(companyId);
    setOpen(false);
    setIsChanging(false);
  };

  const handleClientCompass = () => {
    navigate('/app/clients');
    setOpen(false);
  };

  // Check if user has admin privileges and there are multiple companies
  const isSingleCompanyMode = companyRoles.length <= 1;
  const showClientCompass = hasAdminPrivileges(userRole || "viewer") && !isSingleCompanyMode;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2" disabled={isChanging || isLoading}>
          <div className="flex items-center space-x-1">
            {isChanging ? (
              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Building className="h-3 w-3 mr-1" />
            )}
            <span className="font-medium truncate max-w-[120px]">
              {activeCompanyRole?.companyName || 'Select Company'}
            </span>
            {activeCompanyRole && (
              <UserRoleBadge role={activeCompanyRole.role} className="ml-1" />
            )}
          </div>
          <ChevronDown size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex justify-between items-center">
            <span>Companies</span>
            {companyRoles.length > 1 && (
              <Badge variant="secondary" className="text-xs ml-2">
                {companyRoles.length} companies
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Client Compass - Admin only and multi-company mode */}
        {showClientCompass && (
          <>
            <DropdownMenuItem 
              onClick={handleClientCompass}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Users size={16} className="text-muted-foreground" />
              <span>Client Compass</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Companies list with scrolling */}
        <div className="max-h-60 overflow-y-auto">
          {companyRoles.map(company => (
            <DropdownMenuItem 
              key={company.companyId} 
              className={`flex items-center justify-between ${company.isActive ? 'bg-blue-50 text-blue-700' : ''}`}
              onClick={() => handleSwitchCompany(company.companyId)}
            >
              <div className="flex items-center gap-2 truncate">
                {company.isActive && (
                  <CheckCircle size={14} className="text-blue-500 shrink-0" />
                )}
                <span className={company.isActive ? '' : 'ml-5'} title={company.companyName}>
                  {company.companyName}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <UserRoleBadge role={company.role} />
                {company.isInternal ? (
                  <UserCheck size={14} className="ml-1 text-green-600" />
                ) : (
                  <UserX size={14} className="ml-1 text-amber-600" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
