
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface PhaseDocument {
  id: string;
  name: string;
  status: string;
  document_type: string;
}

interface PhaseOverviewCardProps {
  phaseName: string;
  documents: PhaseDocument[];
  isCurrentPhase?: boolean;
  onClick?: () => void;
}

export function PhaseOverviewCard({
  phaseName,
  documents,
  isCurrentPhase = false,
  onClick
}: PhaseOverviewCardProps) {
  const completedDocs = documents.filter(doc => doc.status === 'Completed').length;
  const inProgressDocs = documents.filter(doc => doc.status === 'In Progress').length;
  const totalDocs = documents.length;
  const completionRate = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

  const getStatusIcon = () => {
    if (completionRate === 100) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (inProgressDocs > 0) return <Clock className="h-4 w-4 text-blue-500" />;
    return <Circle className="h-4 w-4 text-gray-400" />;
  };

  const getStatusColor = () => {
    if (completionRate >= 80) return 'bg-green-500';
    if (completionRate >= 50) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isCurrentPhase ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {phaseName}
            {isCurrentPhase && (
              <Badge variant="default" className="text-xs">
                Current
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {completedDocs}/{totalDocs}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <Progress value={completionRate} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completionRate}% complete</span>
            {inProgressDocs > 0 && (
              <span>{inProgressDocs} in progress</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
