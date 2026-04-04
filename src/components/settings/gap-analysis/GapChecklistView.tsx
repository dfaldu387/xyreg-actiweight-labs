
import React, { useState } from "react";
import { CheckSquare, Square, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { GapChecklistItem } from "@/types/gapAnalysisTemplate";

interface GapChecklistViewProps {
  items: GapChecklistItem[];
  onStatusChange?: (itemId: string, status: 'not_started' | 'in_progress' | 'completed' | 'overdue') => void;
}

export function GapChecklistView({ items = [], onStatusChange }: GapChecklistViewProps) {
  // Group items by category
  const documentationItems = items.filter(item => item.category === 'documentation');
  const verificationItems = items.filter(item => item.category === 'verification');
  const complianceItems = items.filter(item => item.category === 'compliance');
  
  const renderChecklistItem = (item: GapChecklistItem) => {
    const isCompleted = item.status === 'completed';
    
    const handleStatusToggle = () => {
      if (onStatusChange) {
        onStatusChange(item.id, isCompleted ? 'not_started' : 'completed');
      }
    };
    
    const getStatusBadge = () => {
      switch(item.status) {
        case 'completed':
          return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">Completed</Badge>;
        case 'in_progress':
          return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200">In Progress</Badge>;
        case 'overdue':
          return <Badge variant="destructive">Overdue</Badge>;
        default:
          return <Badge variant="outline">Not Started</Badge>;
      }
    };
    
    return (
      <div key={item.id} className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50">
        <Checkbox 
          checked={isCompleted} 
          onCheckedChange={handleStatusToggle}
          className="mt-1"
        />
        <div className="flex-1">
          <div className={`${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
            {item.requirement}
          </div>
          
          {(item.dueDate || item.assignedTo) && (
            <div className="flex flex-wrap gap-2 mt-1">
              {item.dueDate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(item.dueDate).toLocaleDateString()}</span>
                </div>
              )}
              {item.assignedTo && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{item.assignedTo}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          {getStatusBadge()}
        </div>
      </div>
    );
  };
  
  const renderSection = (title: string, items: GapChecklistItem[]) => {
    if (items.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm">{title}</h4>
        <div className="space-y-1 pl-1">
          {items.map(renderChecklistItem)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          No checklist items available
        </div>
      ) : (
        <>
          {renderSection("Documentation", documentationItems)}
          {renderSection("Verification", verificationItems)}
          {renderSection("Compliance Methods", complianceItems)}
        </>
      )}
    </div>
  );
}
