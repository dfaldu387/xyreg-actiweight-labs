import React from "react";
import type { WidgetDefinition } from "@/hooks/useDashboardWidgets";

interface SortableWidgetColumnProps {
  widgets: WidgetDefinition[];
  onReorder: (activeId: string, overId: string) => void;
  renderWidget: (widgetId: string) => React.ReactNode;
}

export function SortableWidgetColumn({
  widgets,
  renderWidget,
}: SortableWidgetColumnProps) {
  return (
    <div className="space-y-6">
      {widgets.map((widget) => (
        <div key={widget.id}>{renderWidget(widget.id)}</div>
      ))}
    </div>
  );
}
