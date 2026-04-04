import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Info } from "lucide-react";

interface DeviceInformationStatusCardProps {
  progress: number;
  totalFields: number;
  completedFields: number;
  isLoading: boolean;
}

export function DeviceInformationStatusCard({ 
  progress, 
  totalFields, 
  completedFields, 
  isLoading 
}: DeviceInformationStatusCardProps) {
  const getStatusColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-yellow-500";
    if (progress >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getStatusBadge = (progress: number) => {
    if (progress >= 80) return <Badge variant="secondary" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (progress >= 60) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (progress >= 40) return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Fair</Badge>;
    return <Badge variant="secondary" className="bg-red-100 text-red-800">Poor</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Info className="h-4 w-4" />
          Overall Progress
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
              <div className="text-2xl font-bold">{progress}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
            
            <Progress value={progress} className="h-2" />
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Phases</span>
              <span className="font-medium">{completedFields}/{totalFields}</span>
            </div>
            
            <div className="flex justify-center">
              {getStatusBadge(progress)}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}