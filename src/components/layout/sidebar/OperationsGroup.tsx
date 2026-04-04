import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, ChevronRight, Package, Building, ClipboardList } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, useSidebar } from '@/components/ui/sidebar';
import { UserRole } from '@/types/documentTypes';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSidebarState } from '@/hooks/useSidebarState';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isoTooltips } from '@/constants/isoTooltips';

interface OperationsGroupProps {
  userRole: UserRole;
  currentCompany: string;
  location: {
    pathname: string;
    search: string;
  };
}


export function OperationsGroup({
  userRole,
  currentCompany,
  location
}: OperationsGroupProps) {
  const baseUrl = `/app/company/${encodeURIComponent(currentCompany)}`;
  const { expandedMenus, toggleMenuExpansion, setAutoExpansion } = useSidebarState();
  const { state: sidebarState } = useSidebar();
  const menuName = "Operations";
  const isCollapsed = sidebarState === "collapsed";

  const operationsItems = [
    {
      title: "Supplier Registry",
      path: `${baseUrl}/suppliers`,
      icon: Package,
      visible: true
    },
    {
      title: "Infrastructure",
      path: `${baseUrl}/infrastructure`,
      icon: Building,
      visible: true
    },
    {
      title: "Calibration Schedule",
      path: `${baseUrl}/calibration-schedule`,
      icon: ClipboardList,
      visible: true
    }
  ];

  const visibleItems = operationsItems.filter(item => item.visible);

  const isOperationsActive = useMemo(() => {
    return visibleItems.some(item => location.pathname === item.path);
  }, [location.pathname, visibleItems]);

  useEffect(() => {
    if (isOperationsActive) {
      setAutoExpansion(menuName, true);
    }
  }, [isOperationsActive, setAutoExpansion]);

  const isOpen = expandedMenus[menuName] ?? isOperationsActive;

  return (
    <Collapsible open={isOpen} onOpenChange={() => toggleMenuExpansion(menuName)}>
      <div className="flex items-center gap-3 w-full">
        <SidebarMenuButton
          tooltip="Operations"
          className="flex-1 px-3 py-2.5 font-medium text-sm cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className={`text-muted-foreground ${isCollapsed ? '-ml-2' : ''}`} style={isCollapsed ? {marginLeft: '-9px'} : {}}>
              <Settings className="h-5 w-5" />
            </div>
            <span>Operations</span>
          </div>
        </SidebarMenuButton>
        <CollapsibleTrigger asChild>
          <button 
            className="p-1 mr-3 hover:bg-muted rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <ChevronRight className="size-4 ml-auto transition-transform data-[state=open]:rotate-90" />
          </button>
        </CollapsibleTrigger>
      </div>

      {!isCollapsed && (
        <CollapsibleContent>
          <SidebarMenuSub>
            {visibleItems.map((item) => {
              const tooltipData = isoTooltips[item.title];
              return (
                <SidebarMenuSubItem key={item.path}>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          isActive={location.pathname === item.path}
                          className="px-6 py-2 text-sm"
                        >
                          <Link to={item.path} className="flex items-center gap-3">
                            <div className="text-muted-foreground">
                              <item.icon className="h-5 w-5" />
                            </div>
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {tooltipData && (
                        <TooltipContent side="right" sideOffset={12} className="max-w-xs p-3">
                          <div className="space-y-1.5">
                            <p className="font-semibold text-sm">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{tooltipData.role}</p>
                            <p className="text-xs font-medium text-primary/80">{tooltipData.reference}</p>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
