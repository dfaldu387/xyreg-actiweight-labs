import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, X } from "lucide-react";

interface ExpandableWidgetProps {
  title: string;
  icon: React.ReactNode;
  onRemove?: () => void;
  children: React.ReactNode;
  expandedChildren?: React.ReactNode;
}

export function ExpandableWidget({
  title,
  icon,
  onRemove,
  children,
  expandedChildren,
}: ExpandableWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
          {onRemove && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isExpanded ? (expandedChildren || children) : children}
      </CardContent>
    </Card>
  );
}
