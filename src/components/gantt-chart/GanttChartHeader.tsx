import React from "react";
import { CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export interface GanttChartHeaderProps {
    title: string;
    icon?: React.ReactNode;
}

export function GanttChartHeader({ title, icon }: GanttChartHeaderProps) {
    return (
        <CardTitle className="flex items-center gap-2">
            {icon || <BarChart3 className="h-5 w-5" />}
            {title}
        </CardTitle>
    );
}

