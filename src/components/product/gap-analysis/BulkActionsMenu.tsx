import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Clock, Layers, Settings } from "lucide-react";
import { BulkDueDateManager } from "./BulkDueDateManager";
import { BulkPhaseManager } from "./BulkPhaseManager";
import { GapAnalysisItem } from "@/types/client";

interface BulkActionsMenuProps {
  items: GapAnalysisItem[];
  companyId?: string;
  onComplete?: () => void;
  disabled?: boolean;
}

export function BulkActionsMenu({ items, companyId, onComplete, disabled = false }: BulkActionsMenuProps) {
  const [dueDateDialog, setDueDateDialog] = React.useState(false);
  const [phasesDialog, setPhasesDialog] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const handleDueDateClick = () => {
    if (disabled) return;
    setDropdownOpen(false);
    setDueDateDialog(true);
  };

  const handlePhasesClick = () => {
    if (disabled) return;
    setDropdownOpen(false);
    setPhasesDialog(true);
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={(open) => !disabled && setDropdownOpen(open)}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled}>
            <Settings className="h-4 w-4 mr-2" />
            Bulk Set
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => handleDueDateClick()}>
            <Clock className="h-4 w-4 mr-2" />
            Set Due Date
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handlePhasesClick()}>
            <Layers className="h-4 w-4 mr-2" />
            Set Phases
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BulkDueDateManager 
        items={items} 
        onComplete={onComplete} 
        open={dueDateDialog} 
        onOpenChange={setDueDateDialog}
      />
      <BulkPhaseManager 
        items={items} 
        companyId={companyId} 
        onComplete={onComplete}
        open={phasesDialog}
        onOpenChange={setPhasesDialog}
      />
    </>
  );
}