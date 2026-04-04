import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ChevronRight } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { hasAdminPrivileges } from '@/utils/roleUtils';
import { UserRole } from '@/types/documentTypes';
import { getCompanyFromUrl } from '@/utils/urlCompanyContext';

interface SidebarCompanyMenuProps {
  userRole: UserRole;
  filteredCompanies: string[];
  isLoadingCompanies: boolean;
  expandedMenus: Record<string, boolean>;
  onToggleMenu: (menuName: string) => void;
  onCollapseMenu: (menuName: string) => void;
  isCompanyActive: (companyName: string) => boolean;
}

export function SidebarCompanyMenu({
  userRole,
  filteredCompanies,
  isLoadingCompanies,
  expandedMenus,
  onToggleMenu,
  onCollapseMenu,
  isCompanyActive
}: SidebarCompanyMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(expandedMenus["Company Dashboard"]);
  const currentCompany = getCompanyFromUrl();
  
  const handleCompanyClick = (event: React.MouseEvent) => {
    // Collapse the menu when clicking on a company
    onCollapseMenu("Company Dashboard");
    setIsMenuOpen(false);
  };

  const handleToggleMenu = () => {
    // Toggle the menu open/close without collapsing when clicking a company
    setIsMenuOpen((prev) => !prev);
    onToggleMenu("Company Dashboard");
  };

  const subItems = isLoadingCompanies ? [{
    name: "Loading companies...",
    path: "#",
    icon: <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
  }] : filteredCompanies.map(company => ({
    name: company,
    path: `/app/company/${encodeURIComponent(company)}`,
    icon: <Briefcase className="h-5 w-5" />
  }));

  return <>
    <SidebarMenuButton asChild tooltip={currentCompany || "Company Dashboard"} onClick={handleToggleMenu} className="px-3 py-2.5 font-medium text-sm">
      <div className="flex items-center justify-between w-full cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground">
            <Briefcase className="h-5 w-5" />
          </div>
          <span className="truncate">{currentCompany || "Company"}</span>
        </div>
        <ChevronRight className={`size-4 ml-2 opacity-70 transition-transform ${isMenuOpen ? 'rotate-90' : ''}`} />
      </div>
    </SidebarMenuButton>

    {isMenuOpen && <SidebarMenuSub className="ml-5 pl-3 mt-1 mb-2">
      {subItems.map(subItem => {
        const isActiveCompany = isCompanyActive(subItem.name);
        const activeItemClass = isActiveCompany ? "bg-primary/10 font-medium border-l-2 border-primary" : "";
        const bracketClass = isActiveCompany ? "relative before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-primary" : "";
        return <SidebarMenuSubItem key={subItem.path} className={`mb-0.5 ${bracketClass}`}>
          <SidebarMenuSubButton asChild isActive={isActiveCompany} className={`text-sm py-2 pl-2 pr-3 ${activeItemClass}`}>
            <Link to={subItem.path} className="flex items-center gap-3 w-full" onClick={handleCompanyClick}>
              <div className="text-muted-foreground -ml-1.5">
                {subItem.icon}
              </div>
              <span className="truncate">{subItem.name}</span>
            </Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>;
      })}
    </SidebarMenuSub>}
  </>;
}
