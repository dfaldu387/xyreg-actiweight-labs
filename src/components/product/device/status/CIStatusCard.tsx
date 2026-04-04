import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface CIStatusCardProps {
  title: string;
  icon: string;
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  isLoading: boolean;
}

export function CIStatusCard({ 
  title, 
  icon, 
  total, 
  completed, 
  pending, 
  overdue, 
  isLoading 
}: CIStatusCardProps) {
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    if (percentage >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    if (percentage >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getStatusColor(completionPercentage)}`}>
                {completed}/{total}
              </div>
              <div className="text-sm text-muted-foreground">
                {completionPercentage}% Complete
              </div>
            </div>
            
            <Progress value={completionPercentage} className="h-2" />
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Pending</span>
                <Badge variant="outline" className="text-xs">
                  {pending}
                </Badge>
              </div>
              
              {overdue > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Overdue</span>
                  <Badge variant="destructive" className="text-xs">
                    {overdue}
                  </Badge>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}