import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChartBar, Activity, Calendar, ChevronRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, useSidebar } from '@/components/ui/sidebar';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { UserRole } from '@/types/documentTypes';
import { useSidebarState } from '@/hooks/useSidebarState';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isoTooltips } from '@/constants/isoTooltips';

interface ComplianceInstancesGroupProps {
  context: 'company' | 'product' | 'standard';
  userRole: UserRole;
  currentProductId?: string | null;
  currentCompany?: string | null;
  location: {
    pathname: string;
    search: string;
  };
  singleCompanyName: string | null;
}

export function ComplianceInstancesGroup({
  context,
  userRole,
  currentProductId,
  currentCompany,
  location,
  singleCompanyName
}: ComplianceInstancesGroupProps) {
  const { expandedMenus, toggleMenuExpansion, setAutoExpansion } = useSidebarState();
  const { state: sidebarState } = useSidebar();
  const menuName = "Enterprise Compliance";
  const isCollapsed = sidebarState === "collapsed";

  // Determine if any compliance item is active
  const isComplianceActive = React.useMemo(() => {
    const compliancePaths = ['documents', 'gap-analysis', 'activities', 'audits', 'clinical-trials'];
    return compliancePaths.some(path => location.pathname.includes(path)) &&
           !location.pathname.endsWith('/compliance-instances');
  }, [location.pathname]);

  // Auto-expand when on compliance routes
  useEffect(() => {
    if (isComplianceActive) {
      setAutoExpansion(menuName, true);
    }
  }, [isComplianceActive, setAutoExpansion]);

  const isOpen = expandedMenus[menuName] ?? isComplianceActive;

  const getBaseUrl = () => {
    if (context === 'product' && currentProductId) {
      return `/app/product/${currentProductId}`;
    }
    if (context === 'company' && currentCompany) {
      return `/app/company/${encodeURIComponent(currentCompany)}`;
    }
    return '/app';
  };

  const baseUrl = getBaseUrl();

  // For viewers in company context, use the combined compliance page
  const complianceItems = userRole === 'viewer' && context === 'company' 
    ? [
        {
          title: 'Documents',
          path: '/compliance',
          icon: FileText,
          isVisible: true
        },
        {
          title: 'Gap Analysis',
          path: '/compliance',
          icon: ChartBar,
          isVisible: true
        }
      ]
    : [
        {
          title: 'Documents',
          path: '/documents',
          icon: FileText,
          isVisible: true
        },
        {
          title: 'Gap Analysis',
          path: '/gap-analysis',
          icon: ChartBar,
          isVisible: true
        },
        {
          title: 'Activities',
          path: '/activities',
          icon: Activity,
          isVisible: context !== 'standard'
        },
        {
          title: 'Audits',
          path: '/audits',
          icon: Calendar,
          isVisible: context === 'product'
            ? (userRole === 'admin' || userRole === 'editor')
            : context === 'company'
              ? true
              : userRole === 'editor'
        }
      ].filter(item => item.isVisible);

  const complianceInstancesPath = `${baseUrl}/compliance-instances`;
  const isComplianceInstancesActive = location.pathname === complianceInstancesPath;

  return (
    <Collapsible open={isOpen} onOpenChange={() => toggleMenuExpansion(menuName)}>
      <div className="flex items-center gap-3 w-full">
        <SidebarMenuButton 
          asChild
          isActive={isComplianceInstancesActive}
          tooltip="Enterprise Compliance"
          className="flex-1 px-3 py-2.5 font-medium text-sm"
        >
          <Link to={complianceInstancesPath} className="flex items-center gap-3">
            <div className={`text-muted-foreground ${isCollapsed ? '-ml-2' : ''}`} style={isCollapsed ? {marginLeft: '-9px'} : {}}>
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span>Enterprise Compliance</span>
          </Link>
        </SidebarMenuButton>
        <CollapsibleTrigger asChild>
          <button 
            className="p-1 mr-3 hover:bg-muted rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <ChevronRight className="size-4 transition-transform data-[state=open]:rotate-90" />
          </button>
        </CollapsibleTrigger>
      </div>
      {!isCollapsed && (
        <CollapsibleContent>
          <SidebarMenuSub>
            {complianceItems.map((item) => {
              const fullPath = `${baseUrl}${item.path}`;
              const isActive = location.pathname === fullPath;

              return (
                <SidebarMenuSubItem key={item.title}>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="px-6 py-2 text-sm"
                        >
                          <Link to={fullPath} className="flex items-center gap-3">
                            <div className="text-muted-foreground">
                              <item.icon className="h-5 w-5" />
                            </div>
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {isoTooltips[item.title] && (
                        <TooltipContent side="right" sideOffset={12} className="max-w-xs p-3">
                          <div className="space-y-1.5">
                            <p className="font-semibold text-sm">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{isoTooltips[item.title].role}</p>
                            {isoTooltips[item.title].reference && (
                              <p className="text-xs font-medium text-primary/80">{isoTooltips[item.title].reference}</p>
                            )}
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