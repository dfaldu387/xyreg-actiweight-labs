
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DocumentSplitViewToggleProps {
  isRightPanelOpen: boolean;
  onToggle: () => void;
}

export function DocumentSplitViewToggle({
  isRightPanelOpen,
  onToggle
}: DocumentSplitViewToggleProps) {
  return (
    <div className="flex items-center">
      <button
        onClick={onToggle}
        className="p-2 bg-gray-100 hover:bg-gray-200 border-l border-r border-gray-300 transition-colors"
      >
        {isRightPanelOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </div>
  );
}
