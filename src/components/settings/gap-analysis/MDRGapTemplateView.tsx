
import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Circle, Clock, AlertCircle, ChevronDown, ChevronUp, FileText, Download } from "lucide-react";
import { comprehensiveMdrAnnexI } from "@/data/comprehensiveMdrAnnexI";
import { GapChecklistItem } from "@/types/gapAnalysisTemplate";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface MDRGapTemplateViewProps {
  showCompact?: boolean;
}

export function MDRGapTemplateView({ showCompact = false }: MDRGapTemplateViewProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [importing, setImporting] = useState(false);
  const { lang } = useTranslation();

  const handleBulkImport = async () => {
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('bulk-import-mdr-requirements', {
        body: { 
          templateId: '8b1ac5c4-28f0-4a5d-97ff-6bd093565e75' 
        }
      });

      if (error) {
        throw error;
      }

      toast.success(lang('companySettings.gapAnalysis.importSuccess', { count: data.itemsImported }));
      window.location.reload(); // Refresh to show updated data
    } catch (error) {
      console.error('Import error:', error);
      toast.error(lang('companySettings.gapAnalysis.importFailed'));
    } finally {
      setImporting(false);
    }
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleItem = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-slate-400" />;
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs font-medium px-2 py-0.5">{lang('companySettings.gapAnalysis.highPriority')}</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-amber-500 text-xs font-medium px-2 py-0.5">{lang('companySettings.gapAnalysis.medium')}</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs font-medium px-2 py-0.5">{lang('companySettings.gapAnalysis.low')}</Badge>;
      default:
        return <Badge variant="outline" className="text-xs font-medium px-2 py-0.5">{lang('companySettings.gapAnalysis.notSet')}</Badge>;
    }
  };

  // Group items by chapter
  const itemsByChapter: Record<string, any[]> = {};
  comprehensiveMdrAnnexI.forEach(item => {
    if (!itemsByChapter[item.chapter]) {
      itemsByChapter[item.chapter] = [];
    }
    itemsByChapter[item.chapter].push(item);
  });

  const groupChecklistByCategory = (items: GapChecklistItem[]) => {
    const grouped: Record<string, GapChecklistItem[]> = {};
    
    items.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    
    return grouped;
  };

  const categoryLabels = {
    documentation: lang('companySettings.gapAnalysis.categoryDocumentation'),
    verification: lang('companySettings.gapAnalysis.categoryVerification'),
    compliance: lang('companySettings.gapAnalysis.categoryCompliance')
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div>
          <h3 className="font-semibold text-blue-900">{lang('companySettings.gapAnalysis.importMdrTitle')}</h3>
          <p className="text-sm text-blue-700">{lang('companySettings.gapAnalysis.importMdrDesc')}</p>
        </div>
        <Button
          onClick={handleBulkImport}
          disabled={importing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Download className="h-4 w-4 mr-2" />
          {importing ? lang('companySettings.gapAnalysis.importing') : lang('companySettings.gapAnalysis.importRequirements', { count: 177 })}
        </Button>
      </div>
      
      <ScrollArea className={showCompact ? "h-[400px]" : "h-[600px]"}>
        <div className="space-y-4 p-3">
        {Object.entries(itemsByChapter).map(([chapter, items]) => (
          <Collapsible 
            key={chapter} 
            open={expandedSections[chapter] || false} 
            onOpenChange={() => toggleSection(chapter)}
            className="border rounded-lg overflow-hidden bg-white shadow-sm"
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full flex justify-between p-4 h-auto">
                <span className="font-semibold text-left text-lg">{chapter}</span>
                {expandedSections[chapter] ? 
                  <ChevronUp className="h-5 w-5 text-muted-foreground" /> : 
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-3 px-4 pb-4">
                {items.map((item) => (
                  <div key={item.clauseId} className="border rounded-md bg-gray-50 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex flex-col items-start text-left space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                            {item.clauseId}
                          </span>
                          {getPriorityBadge(item.priority)}
                        </div>
                        <span className="text-left font-medium text-gray-700">{item.requirement}</span>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded-md border border-blue-100">
                      <div className="flex items-start gap-2">
                        <FileText className="h-5 w-5 text-blue-500 mt-1" />
                        <div className="space-y-2 text-sm text-gray-700">
                          <p><strong>{lang('companySettings.gapAnalysis.evidenceMethod')}:</strong> {item.evidenceMethod}</p>
                          <p><strong>{lang('companySettings.gapAnalysis.standards')}:</strong> {item.keyStandards}</p>
                          <p><strong>{lang('companySettings.gapAnalysis.categoryLabel')}:</strong> {item.category}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
        </div>
      </ScrollArea>
    </div>
  );
}
