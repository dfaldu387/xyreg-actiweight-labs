
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GapAnalysisTemplate, GapChecklistItem } from "@/types/gapAnalysisTemplate";
import { AlertCircle, ChevronDown, ChevronUp, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/useTranslation";

interface GapTemplateDetailsProps {
  template: GapAnalysisTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GapTemplateDetails({ template, open, onOpenChange }: GapTemplateDetailsProps) {
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({});
  const { lang } = useTranslation();

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const groupChecklistByCategory = (items: GapChecklistItem[] = []) => {
    const grouped: Record<string, GapChecklistItem[]> = {};
    
    items.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    
    return grouped;
  };

  // Demo checklist items if none are provided
  const demoChecklistItems: GapChecklistItem[] = template?.checklistItems?.length ? template.checklistItems : [
    {
      id: "cl-1",
      clause: "GSPR.1.1",
      section: "General Requirements",
      requirement: "Document device performance specifications",
      description: "Document device performance specifications",
      category: "documentation",
      framework: template?.framework || "MDR",
      chapter: "General Safety and Performance Requirements",
      status: "completed",
    },
    {
      id: "cl-2",
      clause: "GSPR.2.1",
      section: "General Requirements",
      requirement: "Conduct risk analysis under normal use conditions",
      description: "Conduct risk analysis under normal use conditions",
      category: "verification",
      framework: template?.framework || "MDR",
      chapter: "General Safety and Performance Requirements",
      status: "in_progress",
    },
    {
      id: "cl-3",
      clause: "GSPR.3.1",
      section: "General Requirements",
      requirement: "Complete performance testing",
      description: "Complete performance testing",
      category: "verification",
      framework: template?.framework || "MDR",
      chapter: "General Safety and Performance Requirements",
      status: "not_started",
    },
    {
      id: "cl-4",
      clause: "GSPR.4.1",
      section: "General Requirements",
      requirement: "Gather clinical data or equivalent evidence",
      description: "Gather clinical data or equivalent evidence",
      category: "documentation",
      
      framework: template?.framework || "MDR",
      chapter: "General Safety and Performance Requirements",
      status: "not_started",
    },
    {
      id: "cl-5",
      clause: "GSPR.5.1",
      section: "General Requirements",
      requirement: "Document verification results",
      description: "Document verification results",
      category: "compliance",
      
      framework: template?.framework || "MDR",
      chapter: "General Safety and Performance Requirements",
      status: "not_started",
    }
  ];

  const groupedItems = template ? groupChecklistByCategory(demoChecklistItems) : {};
  const categoryLabels = {
    documentation: lang('companySettings.gapAnalysis.categoryDocumentation'),
    verification: lang('companySettings.gapAnalysis.categoryVerification'),
    compliance: lang('companySettings.gapAnalysis.categoryCompliance')
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {template?.name || <Skeleton className="h-7 w-3/4" />}
          </DialogTitle>
          <DialogDescription>
            {template?.description || <Skeleton className="h-4 w-full mt-2" />}
          </DialogDescription>
        </DialogHeader>
        
        {template ? (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline">{template.framework}</Badge>
                <Badge variant="outline" className="capitalize">
                  {template.scope === "company" ? lang('companySettings.gapAnalysis.companyWide') : lang('companySettings.gapAnalysis.productSpecific')}
                </Badge>
                <Badge variant={template.importance === "high" ? "destructive" :
                              template.importance === "medium" ? "default" : "secondary"}>
                  {template.importance === "high" ? lang('companySettings.gapAnalysis.recommendedStrongly') :
                   template.importance === "medium" ? lang('companySettings.gapAnalysis.recommendedMedium') : lang('companySettings.gapAnalysis.recommendedLow')}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{lang('companySettings.gapAnalysis.overallProgress')}</span>
                  <span className="font-medium">{template.progress || 0}%</span>
                </div>
                <Progress value={template.progress || 0} className="h-2" />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">{lang('companySettings.gapAnalysis.complianceChecklist')}</h3>
                
                {Object.keys(groupedItems).length > 0 ? (
                  Object.entries(groupedItems).map(([category, items]) => (
                    <Collapsible 
                      key={category} 
                      open={expandedSections[category] || false} 
                      onOpenChange={() => toggleSection(category)}
                      className="border rounded-md"
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full flex justify-between p-4">
                          <span>{categoryLabels[category as keyof typeof categoryLabels] || category}</span>
                          {expandedSections[category] ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 pb-4">
                        <ul className="space-y-2">
                          {items.map((item) => (
                            <li key={item.id} className="flex items-start gap-2">
                              {getStatusIcon(item.status)}
                              <span className={`text-sm ${
                                item.status === 'completed' ? 'text-muted-foreground line-through' : ''
                              }`}>
                                {item.requirement}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  ))
                ) : (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        {lang('companySettings.gapAnalysis.noChecklistItems')}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-4 py-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
