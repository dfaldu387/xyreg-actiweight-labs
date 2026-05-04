import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flag, Microscope, ChevronRight } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, useSidebar } from '@/components/ui/sidebar';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { UserRole } from '@/types/documentTypes';
import { useSidebarState } from '@/hooks/useSidebarState';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isoTooltips } from '@/constants/isoTooltips';
import { cn } from '@/lib/utils';

interface MilestonesGroupProps {
  userRole: UserRole;
  currentProductId: string;
  location: {
    pathname: string;
    search: string;
  };
  accentClassName?: string;
}

export function MilestonesGroup({
  userRole,
  currentProductId,
  location,
  accentClassName,
}: MilestonesGroupProps) {
  const { expandedMenus, toggleMenuExpansion, setAutoExpansion } = useSidebarState();
  const { state: sidebarState } = useSidebar();
  const menuName = "Development Lifecycle";
  const isCollapsed = sidebarState === "collapsed";

  const baseUrl = `/app/product/${currentProductId}`;
  
  const milestonesPath = `${baseUrl}/milestones`;
  const isMilestonesActive = location.pathname === milestonesPath;

  const clinicalTrialsPath = `${baseUrl}/clinical-trials`;
  const isClinicalTrialsActive = location.pathname === clinicalTrialsPath;

  useEffect(() => {
    if (isClinicalTrialsActive) {
      setAutoExpansion(menuName, true);
    }
  }, [isClinicalTrialsActive, setAutoExpansion]);

  const isOpen = expandedMenus[menuName] ?? isClinicalTrialsActive;

  if (userRole !== 'admin' && userRole !== 'editor') {
    return null;
  }

  const tooltipData = isoTooltips["Clinical Trials"];

  return (
    <Collapsible open={isOpen} onOpenChange={() => toggleMenuExpansion(menuName)}>
      <div className="flex items-center gap-3 w-full">
        <SidebarMenuButton 
          asChild
          isActive={isMilestonesActive}
          tooltip="Development Lifecycle" 
          className={cn("flex-1 px-3 py-2.5 font-medium text-sm", accentClassName)}
        >
          <Link to={milestonesPath} className="flex items-center gap-3">
            <div className={`text-blue-600 [&_svg]:!text-blue-600 ${isCollapsed ? '-ml-2' : ''}`} style={isCollapsed ? {marginLeft: '-9px'} : {}}>
              <Flag className="h-5 w-5" />
            </div>
            {!isCollapsed && <span>Development Lifecycle</span>}
          </Link>
        </SidebarMenuButton>
        {!isCollapsed && (
          <CollapsibleTrigger asChild>
            <button 
              className="p-1 mr-3 hover:bg-muted rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <ChevronRight className={`size-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
          </CollapsibleTrigger>
        )}
      </div>
      {!isCollapsed && (
        <CollapsibleContent>
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      asChild
                      isActive={isClinicalTrialsActive}
                      className="px-6 py-2 text-sm"
                    >
                      <Link to={clinicalTrialsPath} className="flex items-center gap-3">
                        <div className="text-blue-500">
                          <Microscope className="h-5 w-5" />
                        </div>
                        <span>Clinical Trials</span>
                      </Link>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  {tooltipData && (
                    <TooltipContent side="right" sideOffset={12} className="max-w-xs p-3">
                      <div className="space-y-1.5">
                        <p className="font-semibold text-sm">Clinical Trials</p>
                        <p className="text-xs text-muted-foreground">{tooltipData.role}</p>
                        {tooltipData.reference && (
                          <p className="text-xs font-medium text-primary/80">{tooltipData.reference}</p>
                        )}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
