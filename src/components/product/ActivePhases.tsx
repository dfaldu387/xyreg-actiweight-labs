
import React, { useState } from "react";
import { AlertCircle, Calendar, CheckCircle, Clock, FileText } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculatePhaseProgress } from "@/utils/statusUtils";
import { LifecycleDocument } from "@/types/client";

interface DocumentProps {
  id: string;
  name: string;
  status: "Completed" | "In Progress" | "Not Started";
  deadline?: Date;
  description: string;
  type?: string;
  classes: string[];
}

interface PhaseProps {
  id: string;
  name: string;
  status: "Completed" | "In Progress" | "Not Started";
  deadline?: Date;
  isCurrentPhase?: boolean;
  documents: DocumentProps[];
}

interface ActivePhasesProps {
  phases: PhaseProps[];
  onPhaseDeadlineChange?: (phaseId: string, date: Date | undefined) => void;
  onDocumentStatusChange?: (phaseId: string, documentId: string, status: string) => void;
  onDocumentDeadlineChange?: (phaseId: string, documentId: string, date: Date | undefined) => void;
  showAllPhases?: boolean;
}

export function ActivePhases({ 
  phases, 
  onPhaseDeadlineChange,
  onDocumentStatusChange,
  onDocumentDeadlineChange,
  showAllPhases = false
}: ActivePhasesProps) {
  const [expanded, setExpanded] = useState<string[]>([]);

  // Show only active phases or all phases based on prop
  const displayPhases = showAllPhases 
    ? phases 
    : phases.filter(phase => phase.isCurrentPhase);

  if (displayPhases.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/30 rounded-md border border-dashed">
        <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-2 font-medium">No active phases</h3>
        <p className="text-sm text-muted-foreground mt-1">
          There are no active phases for this product currently.
        </p>
      </div>
    );
  }

  const toggleExpand = (phaseId: string) => {
    setExpanded(prev => 
      prev.includes(phaseId) 
        ? prev.filter(id => id !== phaseId) 
        : [...prev, phaseId]
    );
  };

  return (
    <Accordion
      type="multiple"
      value={expanded}
      onValueChange={setExpanded}
      className="space-y-2 mt-1"
    >
      {displayPhases.map((phase) => {
        // Calculate progress - convert DocumentProps to LifecycleDocument format
        const lifecycleDocuments: LifecycleDocument[] = phase.documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          status: doc.status,
          deadline: doc.deadline ? doc.deadline.toISOString() : undefined,
          description: doc.description || `Document for ${phase.name} phase`,
          type: doc.type,
          classes: doc.classes
        }));
        
        const phaseProgress = calculatePhaseProgress(lifecycleDocuments);

        return (
          <AccordionItem
            key={phase.id}
            value={phase.id}
            className="border rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
              <div className="flex flex-1 items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      phase.status === "Completed"
                        ? "outline"
                        : phase.status === "In Progress"
                        ? "secondary"
                        : "default"
                    }
                    className="rounded-md font-normal"
                  >
                    {phase.status}
                  </Badge>
                  <span className="font-medium">{phase.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{phaseProgress}%</span>
                    <Progress
                      value={phaseProgress}
                      className="w-20 h-2"
                    />
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            
            <AccordionContent className="px-4 pb-3">
              <div className="flex items-center mb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Deadline:</span>
                  {phase.deadline ? (
                    <span>
                      {phase.deadline.toLocaleDateString()}
                    </span>
                  ) : (
                    <span>Not set</span>
                  )}
                </div>
              </div>
              
              {phase.documents && phase.documents.length > 0 ? (
                <div className="space-y-2 mt-4">
                  {phase.documents.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between py-2 px-3 rounded-md border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-primary" />
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="font-medium">{doc.name}</span>
                          </TooltipTrigger>
                          
                          <TooltipContent className="max-w-xs">
                            <p>{doc.description || `Document for ${phase.name} phase`}</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        {doc.type && (
                          <Badge variant="outline" className="text-xs">
                            {doc.type}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center">
                        <Badge 
                          variant="outline" 
                          className={`${
                            doc.status === "Completed" ? "bg-green-100 text-green-800" : 
                            doc.status === "In Progress" ? "bg-blue-100 text-blue-800" : 
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {doc.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-md">
                  No documents available for this phase
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
