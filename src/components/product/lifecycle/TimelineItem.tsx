
import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DocumentItem } from './DocumentItem';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock, ChevronRight, PlusCircle } from 'lucide-react';
import { formatDate } from '@/lib/date';
import { PhaseDocument } from '@/types/phaseDocuments';
import { PhaseBudgetDisplay } from './PhaseBudgetDisplay';

interface TimelineItemProps {
  item: {
    id: string;
    name: string;
    documents: PhaseDocument[];
    deadline?: Date | string;
    isCurrentPhase?: boolean;
    status?: string;
    progress?: number;
    audits?: any[];
    estimated_budget?: number;
    is_pre_launch?: boolean;
    cost_category?: 'development' | 'regulatory' | 'clinical' | 'operational';
    budget_currency?: string;
  };
  onDeadlineChange?: (phaseId: string, date: Date | undefined) => void;
  onScheduleMilestone?: (phase: any) => void;
  onBudgetUpdate?: (phaseId: string, budgetData: {
    estimated_budget: number;
    is_pre_launch: boolean;
    cost_category: string;
    budget_currency: string;
  }) => void;
  companyId: string;
}

export function TimelineItem({ 
  item, 
  onDeadlineChange,
  onScheduleMilestone,
  onBudgetUpdate,
  companyId
}: TimelineItemProps) {
  // Get color based on phase status
  const getPhaseColor = () => {
    if (!item.status) return "bg-gray-100";
    
    switch (item.status) {
      case "Completed":
        return "bg-green-100 border-green-200";
      case "In Progress":
        return "bg-blue-100 border-blue-200";
      case "Not Started":
      default:
        return "bg-gray-100 border-gray-200";
    }
  };
  
  const handlePhaseClick = () => {
    if (onScheduleMilestone) {
      onScheduleMilestone(item);
    }
  };
  
  const handleDocumentClick = (doc: PhaseDocument) => {
    console.log("Document clicked:", doc);
  };
  
  return (
    <Card 
      id={`phase-card-${item.id}`}
      className={`w-[280px] flex-shrink-0 ${item.isCurrentPhase ? 'border-primary' : ''}`}
    >
      <CardHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="font-semibold">{item.name}</h3>
            <div className="flex items-center gap-1 mt-1">
              {item.status && (
                <Badge 
                  variant="outline" 
                  className={`${getPhaseColor()} text-xs`}
                >
                  {item.status}
                </Badge>
              )}
              {item.progress !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {item.progress}% complete
                </span>
              )}
            </div>
          </div>
          
          {item.isCurrentPhase && (
            <div className="h-2.5 w-2.5 rounded-full bg-primary"></div>
          )}
        </div>
        
        {item.deadline && (
          <div className="flex items-center mt-2 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5 mr-1" />
            <span>{typeof item.deadline === 'string' ? formatDate(item.deadline) : formatDate(item.deadline)}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Documents</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={handlePhaseClick}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
        
        {item.documents && item.documents.length > 0 ? (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {item.documents.map((doc, index) => (
              <DocumentItem
                key={`${doc.id || doc.name}-${index}`}
                document={doc}
                onDocumentClick={handleDocumentClick}
                onUploadClick={() => console.log('Upload clicked for document:', doc.name)}
              />
            ))}
          </div>
        ) : (
          <div className="py-3 text-center text-sm text-muted-foreground">
            No documents for this phase yet
          </div>
        )}
        
        {/* Budget Display Section */}
        <PhaseBudgetDisplay
          phaseId={item.id}
          estimated_budget={item.estimated_budget}
          is_pre_launch={item.is_pre_launch}
          cost_category={item.cost_category}
          budget_currency={item.budget_currency}
          onBudgetUpdate={onBudgetUpdate}
          isEditable={true}
          companyId={companyId}
        />
        
        {item.audits && item.audits.length > 0 && (
          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Audits</span>
              <ChevronRight className="h-4 w-4" />
            </div>
            
            <div className="space-y-2">
              {item.audits.slice(0, 2).map((audit, index) => (
                <div 
                  key={`audit-${index}`}
                  className="p-2 bg-muted rounded text-xs"
                >
                  {audit.name}
                </div>
              ))}
              
              {item.audits.length > 2 && (
                <div className="text-xs text-center text-muted-foreground">
                  +{item.audits.length - 2} more
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
