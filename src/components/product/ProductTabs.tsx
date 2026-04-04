
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DatabasePhaseService } from "@/services/databasePhaseService";

interface ProductTabsProps {
  companyId: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
  documentCounts?: Record<string, number>;
}

export function ProductTabs({ 
  companyId, 
  activeTab, 
  onTabChange, 
  children,
  documentCounts = {}
}: ProductTabsProps) {
  const [phases, setPhases] = React.useState<any[]>([]);

  React.useEffect(() => {
    const loadPhases = async () => {
      try {
        const phasesData = await DatabasePhaseService.getPhases(companyId);
        setPhases(phasesData.activePhases);
      } catch (error) {
        console.error('Error loading phases:', error);
      }
    };

    if (companyId) {
      loadPhases();
    }
  }, [companyId]);

  const getTabLabel = (tabId: string) => {
    switch (tabId) {
      case 'overview':
        return 'Overview';
      case 'documents':
        return 'Documents';
      case 'phases':
        return 'Phases';
      case 'compliance':
        return 'Compliance';
      case 'team':
        return 'Team';
      case 'audits':
        return 'Audits';
      case 'certifications':
        return 'Certifications';
      default:
        return tabId.charAt(0).toUpperCase() + tabId.slice(1);
    }
  };

  const getDocumentCount = (tabId: string) => {
    return documentCounts[tabId] || 0;
  };

  const defaultTabs = [
    'overview',
    'documents', 
    'phases',
    'compliance',
    'team',
    'audits',
    'certifications'
  ];

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="flex flex-wrap w-full min-h-[2.5rem] h-auto p-1 bg-muted overflow-x-auto">
        {defaultTabs.map((tab) => (
          <TabsTrigger 
            key={tab} 
            value={tab} 
            className="flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex-shrink-0 min-w-fit flex-1 max-w-[150px]"
          >
            {getTabLabel(tab)}
            {(tab === 'documents' || tab === 'phases') && getDocumentCount(tab) > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-1 h-5 px-1 text-xs"
              >
                {getDocumentCount(tab)}
              </Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      
      <div className="mt-4">
        {children}
      </div>
    </Tabs>
  );
}
