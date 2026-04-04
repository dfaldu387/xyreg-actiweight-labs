import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare, Clock, AlertTriangle, FileText, Users, Calendar, Settings } from 'lucide-react';
import { Product } from '@/types/client';

interface PriorityActionsSectionProps {
  product: Product;
}

export function PriorityActionsSection({ product }: PriorityActionsSectionProps) {
  // Mock priority actions - in real implementation, this would come from hooks/services
  const priorityActions = [
    {
      id: '1',
      type: 'document_review',
      title: 'Review Risk Management File v3.2',
      description: 'Critical document needs approval before phase transition',
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago (overdue)
      priority: 'urgent',
      assignee: 'You',
      estimatedTime: '30 min',
      action: 'Review'
    },
    {
      id: '2',
      type: 'approval_required',
      title: 'Approve Clinical Protocol',
      description: 'Protocol changes affecting primary endpoint',
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days from now
      priority: 'high',
      assignee: 'You',
      estimatedTime: '45 min',
      action: 'Approve'
    },
    {
      id: '3',
      type: 'regulatory_deadline',
      title: 'Submit EUDAMED Registration',
      description: 'Regulatory deadline approaching',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now (approaching)
      priority: 'high',
      assignee: 'Regulatory Team',
      estimatedTime: '2 hours',
      action: 'Approve'
    },
    {
      id: '4',
      type: 'team_decision',
      title: 'Design Control Board Meeting Decision',
      description: 'Critical design change requires board approval',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'medium',
      assignee: 'Design Team',
      estimatedTime: '1 hour',
      action: 'Schedule'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document_review': return <Settings className="h-10 w-10" />;
      case 'approval_required': return <FileText className="h-10 w-10" />;
      case 'regulatory_deadline': return <FileText className="h-10 w-10" />;
      case 'team_decision': return <Users className="h-10 w-10" />;
      default: return <Clock className="h-10 w-10" />;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateText = (dueDate: string) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return `Overdue by ${Math.abs(days)} days`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  const getDueDateColor = (dueDate: string) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return 'text-red-600';
    if (days <= 1) return 'text-orange-600';
    if (days <= 3) return 'text-yellow-600';
    return 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          My Action Center
          </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {priorityActions.slice(0, 3).map((action) => {
          const days = getDaysUntilDue(action.dueDate);
          const isOverdue = days < 0;
          const isDueToday = days === 0;
          const isDueSoon = days > 0 && days <= 5;
          const isApproaching = days > 5;
          
          // Determine card color based on urgency - Red for overdue, Orange for due soon, Yellow for approaching
          let cardColor = 'bg-yellow-500 text-white';
          let statusText = '';
          
          if (isOverdue) {
            cardColor = 'bg-red-500 text-white';
            statusText = `Overdue by ${Math.abs(days)} days`;
          } else if (isDueToday) {
            cardColor = 'bg-orange-500 text-white';
            statusText = 'Due in 0 days';
          } else if (isDueSoon) {
            cardColor = 'bg-orange-500 text-white';
            statusText = `Due in ${days} days`;
          } else if (isApproaching && action.type === 'regulatory_deadline') {
            cardColor = 'bg-yellow-500 text-white';
            statusText = 'Regulatory deadline approaching';
          } else {
            cardColor = 'bg-yellow-500 text-white';
            statusText = `Due in ${days} days`;
          }

          return (
            <Card key={action.id} className={`${cardColor} border-none`}>
              <CardContent className="flex items-center justify-between p-4 mt-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-shrink-0 text-white mt-4">
                  {getTypeIcon(action.type)}
                </div>
                <div className="flex-1 min-w-0 mt-4">
                    <h4 className="font-semibold text-sm mb-1">{action.title}</h4>
                    <p className="text-sm opacity-90">
                      {statusText}
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 shrink-0 mt-4"
                >
                {action.action}
              </Button>
              </CardContent>
            </Card>
          );
        })}
        
        {priorityActions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm">No priority actions at the moment.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
