import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { Building, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface CompanySelectorProps {
  selectedCompanyId?: string;
  onCompanyChange?: (companyId: string, companyName: string) => void;
  className?: string;
  variant?: "default" | "ghost" | "outline";
  showAllOption?: boolean;
}

export function CompanySelector({
  selectedCompanyId,
  onCompanyChange,
  className,
  variant = "outline",
  showAllOption = true
}: CompanySelectorProps) {
  const { lang } = useTranslation();
  const { companyRoles, activeCompanyRole } = useCompanyRole();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // CRITICAL FIX: Don't show company menu when on /app/clients (no company selected)
  const isOnClientsPage = location.pathname === '/app/clients';

  // Use selectedCompanyId if provided, otherwise use activeCompanyRole
  const currentCompanyId = selectedCompanyId || activeCompanyRole?.companyId;
  const currentCompany = companyRoles.find(role => role.companyId === currentCompanyId);
  
  const { switchCompanyRole } = useCompanyRole();

  const handleCompanySelect = async (companyId: string, companyName: string) => { 
    // CRITICAL FIX: DO NOT update global company role from Mission Control
    // Only update the Mission Control context
    onCompanyChange?.(companyId, companyName);
    setIsOpen(false);
  };

  const handleAllCompaniesSelect = () => {
     // Navigate to mission control with all=true parameter to indicate multi-company view
    window.location.href = '/app/mission-control?all=true';
    setIsOpen(false);
  };

  const handleClientCompassClick = () => {
    navigate('/app/clients');
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          disabled={isOnClientsPage}
          className={cn(
            "justify-between min-w-[200px] bg-background hover:bg-accent border shadow-sm",
            isOnClientsPage && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="truncate">
              {isOnClientsPage ? lang('companySelector.selectCompany') :
               currentCompanyId === 'all' ? lang('companySelector.allCompanies') :
               currentCompany?.companyName || lang('companySelector.selectCompany')}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-[240px] bg-background border shadow-lg z-50" 
        align="start"
        sideOffset={4}
      >
        <DropdownMenuLabel
          className="text-xs text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
          onClick={handleClientCompassClick}
        >
          {lang('companySelector.clientCompass')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {showAllOption && (
          <>
            <DropdownMenuItem
              onClick={handleAllCompaniesSelect}
              className="flex items-center justify-between cursor-pointer hover:bg-accent focus:bg-accent"
            >
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>{lang('companySelector.allCompanies')}</span>
              </div>
              {currentCompanyId === 'all' && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <ScrollArea className="max-h-[200px] overflow-y-auto">
          {/* CRITICAL FIX: Show message when on clients page (no company selected) */}
          {isOnClientsPage ? (
            <DropdownMenuItem disabled>
              <span className="text-muted-foreground">{lang('companySelector.pleaseSelectCompanyFirst')}</span>
            </DropdownMenuItem>
          ) : (
            <>
              {companyRoles.map((role) => (
                <DropdownMenuItem
                  key={role.companyId}
                  onClick={() => handleCompanySelect(role.companyId, role.companyName)}
                  className="flex items-center justify-between cursor-pointer hover:bg-accent focus:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{role.companyName}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {role.role}
                      </span>
                    </div>
                  </div>
                  {role.companyId === currentCompanyId && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              
              {companyRoles.length === 0 && (
                <DropdownMenuItem disabled>
                  <span className="text-muted-foreground">{lang('companySelector.noCompaniesAvailable')}</span>
                </DropdownMenuItem>
              )}
            </>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}