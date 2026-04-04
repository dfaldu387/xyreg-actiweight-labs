import React from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { DEFAULT_ZOOM_LEVEL, zoomLevels } from "./config/ganttChartConfig";

export interface GanttChartZoomControlsProps {
    currentZoomLevel: number;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onResetZoom?: () => void;
}

export function GanttChartZoomControls({
    currentZoomLevel,
    onZoomIn,
    onZoomOut,
    onResetZoom,
}: GanttChartZoomControlsProps) {
    const handleZoomIn = () => {
        if (currentZoomLevel < zoomLevels.length - 1 && onZoomIn) {
            onZoomIn();
        }
    };

    const handleZoomOut = () => {
        if (currentZoomLevel > 0 && onZoomOut) {
            onZoomOut();
        }
    };

    const handleResetZoom = () => {
        if (onResetZoom) {
            onResetZoom();
        }
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
                Zoom: {zoomLevels[currentZoomLevel]?.name ?? zoomLevels[DEFAULT_ZOOM_LEVEL]?.name}
            </span>
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={currentZoomLevel === 0}
                    title="Zoom Out"
                >
                    <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetZoom}
                    title="Reset to Months"
                >
                    <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={currentZoomLevel === zoomLevels.length - 1}
                    title="Zoom In"
                >
                    <ZoomIn className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

