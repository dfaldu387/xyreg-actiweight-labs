import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, ChevronRight, LayoutDashboard, FileText, Clock } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, useSidebar } from '@/components/ui/sidebar';
import { UserRole } from '@/types/documentTypes';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSidebarState } from '@/hooks/useSidebarState';

interface IPManagementGroupProps {
  userRole: UserRole;
  currentCompany: string;
  location: {
    pathname: string;
    search: string;
  };
}

export function IPManagementGroup({
  userRole,
  currentCompany,
  location
}: IPManagementGroupProps) {
  const baseUrl = `/app/company/${encodeURIComponent(currentCompany)}`;
  const { expandedMenus, toggleMenuExpansion, setAutoExpansion } = useSidebarState();
  const { state: sidebarState } = useSidebar();
  const menuName = "IPManagement";
  const isCollapsed = sidebarState === "collapsed";

  const ipItems = [
    {
      title: "Dashboard",
      path: `${baseUrl}/ip-portfolio`,
      icon: LayoutDashboard,
      visible: true
    },
    {
      title: "IP Assets",
      path: `${baseUrl}/ip-portfolio?tab=assets`,
      icon: FileText,
      visible: true
    },
    {
      title: "Deadlines",
      path: `${baseUrl}/ip-portfolio?tab=deadlines`,
      icon: Clock,
      visible: true
    }
  ];

  const visibleItems = ipItems.filter(item => item.visible);

  const isIPActive = useMemo(() => {
    return location.pathname.includes('/ip-portfolio');
  }, [location.pathname]);

  // Auto-expand when on IP routes
  useEffect(() => {
    if (isIPActive) {
      setAutoExpansion(menuName, true);
    }
  }, [isIPActive, setAutoExpansion]);

  const isOpen = expandedMenus[menuName] ?? isIPActive;

  // Simple rendering without Collapsible when collapsed
  if (isCollapsed) {
    return (
      <SidebarMenuButton
        asChild
        tooltip="IP Management"
        isActive={isIPActive}
        className="px-0 justify-center font-medium text-sm"
      >
        <Link to={`${baseUrl}/ip-portfolio`} className="flex items-center justify-center w-full -ml-1.5">
          <div className="text-muted-foreground">
            <Lightbulb className="h-5 w-5" />
          </div>
        </Link>
      </SidebarMenuButton>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={() => toggleMenuExpansion(menuName)}>
      <div className="flex items-center w-full">
        <CollapsibleTrigger asChild className="flex-1">
          <SidebarMenuButton
            tooltip="IP Management"
            isActive={isIPActive}
            className="px-3 py-2.5 font-medium text-sm cursor-pointer w-full"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="text-muted-foreground">
                <Lightbulb className="h-5 w-5" />
              </div>
              <span className="flex-1">IP Management</span>
              <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </div>
          </SidebarMenuButton>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <SidebarMenuSub>
          {visibleItems.map((item) => (
            <SidebarMenuSubItem key={item.path}>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === item.path.split('?')[0]}
                tooltip={item.title}
                className="px-6 py-2 text-sm"
              >
                <Link to={item.path} className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}
