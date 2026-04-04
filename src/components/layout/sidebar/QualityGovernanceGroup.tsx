import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, ClipboardCheck, FileBarChart, FileWarning, GitBranch } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isoTooltips } from '@/constants/isoTooltips';

interface QualityGovernanceGroupProps {
  context: 'product' | 'company';
  basePath: string;
  location: { pathname: string };
}

const items = [
  { id: 'management-review', label: 'Management Review', icon: FileBarChart, path: '/management-review' },
  { id: 'nonconformity', label: 'Nonconformity', icon: FileWarning, path: '/nonconformity' },
  { id: 'capa', label: 'CAPA', icon: AlertTriangle, path: '/capa' },
  { id: 'change-control', label: 'Change Control', icon: GitBranch, path: '/change-control' },
  { id: 'design-review', label: 'Design Review', icon: ClipboardCheck, path: '/design-review' },
];

export function QualityGovernanceGroup({ context, basePath, location }: QualityGovernanceGroupProps) {
  const { state } = useSidebar();
  const isAnyActive = items.some(i => location.pathname.includes(`${basePath}${i.path}`));

  return (
    <Collapsible defaultOpen={isAnyActive}>
      <CollapsibleTrigger asChild>
        <SidebarMenuButton
          tooltip="Quality Governance"
          size="lg"
          className={cn(
            state === "collapsed" ? "px-0 justify-center font-medium text-sm" : "px-3 font-medium text-sm",
            isAnyActive && "text-primary"
          )}
        >
          <div className={state === "collapsed" ? "flex items-center justify-center w-full -ml-1.5" : "flex items-center gap-3 w-full"}>
            <div className="text-muted-foreground">
              <FileWarning className="h-5 w-5" />
            </div>
            {state !== "collapsed" && (
              <>
                <span className="flex-1">Quality Governance</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </>
            )}
          </div>
        </SidebarMenuButton>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {state !== "collapsed" && (
          <div className="ml-6 border-l pl-2 space-y-0.5 mt-1">
            {items.map((item) => {
              const fullPath = `${basePath}${item.path}`;
              const isActive = location.pathname.includes(fullPath);
              const tooltipData = isoTooltips[item.label];
              return (
                <SidebarMenuItem key={item.id}>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          size="sm"
                          className="px-2 text-sm"
                        >
                          <Link to={fullPath} className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {tooltipData && (
                        <TooltipContent side="right" sideOffset={12} className="max-w-xs p-3">
                          <div className="space-y-1.5">
                            <p className="font-semibold text-sm">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{tooltipData.role}</p>
                            {tooltipData.reference && (
                              <p className="text-xs font-medium text-primary/80">{tooltipData.reference}</p>
                            )}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </SidebarMenuItem>
              );
            })}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
