
import React from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Columns, Clock, List, PieChart } from "lucide-react";

interface ViewToggleProps {
  currentView: "cards" | "phases" | "timeline" | "list";
  onViewChange: (view: "cards" | "phases" | "timeline" | "list") => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 border rounded-lg p-1">
      <Button
        variant={currentView === "cards" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("cards")}
        className="gap-2 h-8"
      >
        <LayoutGrid className="h-4 w-4" />
        Cards
      </Button>
      <Button variant={currentView === "list" ? "default" : "ghost"} size="sm" onClick={() => onViewChange("list")} className="gap-2 h-8">
        <List className="h-4 w-4" />
        List
      </Button>
      <Button
        variant={currentView === "phases" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("phases")}
        className="gap-2 h-8"
      >
        <Columns className="h-4 w-4" />
        Phases
      </Button>
      <Button
        variant={currentView === "timeline" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("timeline")}
        className="gap-2 h-8"
      >
        <Clock className="h-4 w-4" />
        Timeline
      </Button>
    </div>
  );
}
