
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Info, Calendar, Users, Target } from "lucide-react";
import { DocumentItem } from "@/types/client";

interface DocumentMetadataTooltipProps {
  document: DocumentItem;
  children: React.ReactNode;
}

export function DocumentMetadataTooltip({ document, children }: DocumentMetadataTooltipProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-sm p-4">
          <div className="space-y-3">
            <div className="font-semibold text-sm">{document.name}</div>
            
            {document.description && (
              <div className="text-xs text-muted-foreground">
                {document.description}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Target className="h-3 w-3" />
                <span className="font-medium">Type:</span>
                <Badge variant="outline" className="text-xs h-4">
                  {document.type || 'Standard'}
                </Badge>
              </div>

              {document.techApplicability && document.techApplicability !== "All device types" && (
                <div className="flex items-center gap-2 text-xs">
                  <Target className="h-3 w-3" />
                  <span className="font-medium">Tech:</span>
                  <span className="text-muted-foreground">{document.techApplicability}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs">
                <Calendar className="h-3 w-3" />
                <span className="font-medium">Updated:</span>
                <span className="text-muted-foreground">{formatDate(document.lastUpdated)}</span>
              </div>

              {document.phases && document.phases.length > 0 && (
                <div className="flex items-start gap-2 text-xs">
                  <Users className="h-3 w-3 mt-0.5" />
                  <div>
                    <div className="font-medium">Assigned to phases:</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {document.phases.slice(0, 3).map(phase => (
                        <Badge key={phase} variant="secondary" className="text-xs h-4">
                          {phase}
                        </Badge>
                      ))}
                      {document.phases.length > 3 && (
                        <Badge variant="secondary" className="text-xs h-4">
                          +{document.phases.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
