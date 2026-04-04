import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BookOpen } from "lucide-react";
import { ReimbursementInfoHub } from "./ReimbursementInfoHub";

interface ReimbursementHelpSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetMarkets: string[];
  disabled?: boolean;
}

export function ReimbursementHelpSidebar({ 
  open, 
  onOpenChange, 
  targetMarkets, 
  disabled = false 
}: ReimbursementHelpSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Reimbursement Systems Guide
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="p-6">
            <ReimbursementInfoHub targetMarkets={targetMarkets} disabled={disabled} />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// Trigger button component for consistency
interface ReimbursementHelpTriggerProps {
  onClick: () => void;
  disabled?: boolean;
}

export function ReimbursementHelpTrigger({ onClick, disabled = false }: ReimbursementHelpTriggerProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={onClick} disabled={disabled}>
            <BookOpen className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Reimbursement Systems Guide</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
