
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Trash, Info } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PhaseDocument } from "@/types/phaseDocuments";

interface PhaseListProps {
  chosenPhases: string[];
  phaseData: Record<string, any[]>;
  chosenDocs: Record<string, string[]>;
  onMovePhase: (index: number, direction: "up" | "down") => void;
  onRemovePhase: (index: number) => void;
  onToggleDoc: (phase: string, docName: string) => void;
}

export function PhaseList({
  chosenPhases,
  phaseData,
  chosenDocs,
  onMovePhase,
  onRemovePhase,
  onToggleDoc
}: PhaseListProps) {
  const handleRemovePhase = (index: number) => {
    const phaseName = chosenPhases[index];
    console.log(`[PhaseList] Attempting to remove phase at index ${index}: "${phaseName}"`);
    
    // Add confirmation for deletion
    if (window.confirm(`Are you sure you want to remove the phase "${phaseName}"?`)) {
      console.log(`[PhaseList] User confirmed deletion of phase: "${phaseName}"`);
      onRemovePhase(index);
    } else {
      console.log(`[PhaseList] User cancelled deletion of phase: "${phaseName}"`);
    }
  };

  if (chosenPhases.length === 0) {
    return (
      <div className="text-muted-foreground italic">No phases selected. Use above buttons to add.</div>
    );
  }

  return (
    <div className="space-y-6">
      {chosenPhases.map((phase, i) => (
        <div key={phase} className="border p-4 rounded-md bg-muted flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{phase}</span>
            <Badge variant="outline">{(phaseData[phase]??[]).length} docs</Badge>
            <div className="flex gap-1 ml-auto">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => onMovePhase(i, "up")} 
                disabled={i === 0}
                title="Move up"
              >
                <ArrowUp size={16}/>
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => onMovePhase(i, "down")} 
                disabled={i === chosenPhases.length-1}
                title="Move down"
              >
                <ArrowDown size={16}/>
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => handleRemovePhase(i)}
                className="text-destructive hover:text-destructive"
                title={`Remove ${phase} phase`}
              >
                <Trash size={16}/>
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {(phaseData[phase]??[]).map((doc: any) => (
              <label key={doc.name} className="flex items-center gap-2 text-xs px-2 py-1 rounded bg-background border">
                <Checkbox
                  checked={(chosenDocs[phase]??[]).includes(doc.name)}
                  onCheckedChange={() => onToggleDoc(phase, doc.name)}
                />
                {doc.name}
                {(doc.classes && doc.classes.length) ? (
                  <Badge variant="secondary">{doc.classes.join(",")}</Badge>
                ) : null}
              </label>
            ))}
            
            {(phaseData[phase]??[]).length === 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Info size={14} className="mr-1" /> No documents found for this phase
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    Add documents to this phase in the Standard Phases tab
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
