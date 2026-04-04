import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Activity, 
  Shield, 
  BarChart3,
  ChevronDown,
  ChevronRight,
  Calendar,
  User
} from 'lucide-react';
import { PhaseCompletionService, PhaseCompletionItem, PhaseCompletionSummary } from '@/services/phaseCompletionService';

interface PhaseCompletionChecklistProps {
  companyId: string;
  productId: string;
  phaseName: string;
  onRefresh?: () => void;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'document':
      return FileText;
    case 'activity':
      return Activity;
    case 'audit':
      return Shield;
    case 'gap_analysis':
      return BarChart3;
    default:
      return FileText;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'in_progress':
      return 'secondary';
    case 'overdue':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return CheckCircle;
    case 'in_progress':
      return Clock;
    case 'overdue':
      return AlertTriangle;
    default:
      return Clock;
  }
};

export function PhaseCompletionChecklist({
  companyId,
  productId,
  phaseName,
  onRefresh
}: PhaseCompletionChecklistProps) {
  const [completion, setCompletion] = useState<PhaseCompletionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    all: true,
    documents: false,
    activities: false,
    audits: false,
    gap_analysis: false
  });

  useEffect(() => {
    loadCompletionData();
  }, [companyId, productId, phaseName]);

  const loadCompletionData = async () => {
    setLoading(true);
    try {
      const data = await PhaseCompletionService.getPhaseCompletionData(
        companyId,
        productId,
        phaseName
      );
      setCompletion(data);
    } catch (error) {
      console.error('Error loading phase completion data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const groupItemsByType = (items: PhaseCompletionItem[]) => {
    return items.reduce((groups, item) => {
      if (!groups[item.type]) {
        groups[item.type] = [];
      }
      groups[item.type].push(item);
      return groups;
    }, {} as Record<string, PhaseCompletionItem[]>);
  };

  const renderItem = (item: PhaseCompletionItem) => {
    const TypeIcon = getTypeIcon(item.type);
    const StatusIcon = getStatusIcon(item.status);
    const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== 'completed';

    return (
      <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg">
        <div className="flex-shrink-0 mt-1">
          <TypeIcon className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium truncate">{item.name}</h4>
            <Badge variant={getStatusColor(item.status)} className="ml-2 flex-shrink-0">
              <StatusIcon className="h-3 w-3 mr-1" />
              {item.status.replace('_', ' ')}
            </Badge>
          </div>
          
          {item.description && (
            <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {item.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                  {new Date(item.due_date).toLocaleDateString()}
                </span>
              </div>
            )}
            
            {item.assigned_to && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>Assigned</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="h-4 w-4 mr-2 animate-spin" />
            Loading phase completion data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!completion) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No completion data available for this phase.
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedItems = groupItemsByType(completion.items);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Phase Completion Checklist
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Track all items required for {phaseName} completion
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadCompletionData}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>{completion.completion_percentage}%</span>
            </div>
            <Progress value={completion.completion_percentage} className="w-full" />
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completion.completed_items}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{completion.in_progress_items}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{completion.overdue_items}</div>
              <div className="text-xs text-muted-foreground">Overdue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{completion.total_items}</div>
              <div className="text-xs text-muted-foreground">Total Items</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* All Items */}
        <Collapsible open={expandedSections.all} onOpenChange={() => toggleSection('all')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                {expandedSections.all ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="font-medium">All Items ({completion.total_items})</span>
              </div>
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-3 mt-3">
            {completion.items.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No items found for this phase.
              </div>
            ) : (
              completion.items.map(renderItem)
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Grouped by Type */}
        {Object.entries(groupedItems).map(([type, items]) => {
          const TypeIcon = getTypeIcon(type);
          const typeName = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          return (
            <Collapsible 
              key={type} 
              open={expandedSections[type]} 
              onOpenChange={() => toggleSection(type)}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <div className="flex items-center gap-2">
                    {expandedSections[type] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <TypeIcon className="h-4 w-4" />
                    <span className="font-medium">{typeName} ({items.length})</span>
                  </div>
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-3 mt-3">
                {items.map(renderItem)}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}