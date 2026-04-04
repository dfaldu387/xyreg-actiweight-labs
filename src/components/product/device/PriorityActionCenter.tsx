import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileX, AlertTriangle, Activity, Search } from "lucide-react";
import { PriorityAction } from '@/hooks/usePriorityActions';

interface PriorityActionCenterProps {
  actions: PriorityAction[];
}

export function PriorityActionCenter({ actions }: PriorityActionCenterProps) {
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'document': return FileX;
      case 'approval': return AlertTriangle;
      case 'activity': return Activity;
      case 'audit': return Search;
      default: return AlertTriangle;
    }
  };

  const getActionColor = (urgency: string) => {
    switch (urgency) {
      case 'overdue': return 'bg-red-500 text-white';
      case 'urgent': return 'bg-orange-500 text-white';
      case 'upcoming': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getActionText = (action: PriorityAction) => {
    if (action.daysOverdue) {
      return `Overdue by ${action.daysOverdue} days`;
    }
    if (action.daysUntilDue) {
      return `Due in ${action.daysUntilDue} days`;
    }
    return 'Needs attention';
  };

  if (actions.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">My Action Center</h3>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No pending actions - great work! 🎉</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">My Action Center</h3>
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = getActionIcon(action.type);
          return (
            <Card key={action.id} className={`border-none ${getActionColor(action.urgency)}`}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Icon className="h-10 w-10 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">{action.title}</p>
                    <p className="text-sm opacity-90">{getActionText(action)}</p>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  Review
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
