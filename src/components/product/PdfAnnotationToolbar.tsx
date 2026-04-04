import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Highlighter,
  MessageSquarePlus,
  Type,
  Underline,
  Strikethrough,
  Square,
  Circle,
  Minus,
  MousePointer,
  Palette,
  FileText,
} from "lucide-react";

export type AnnotationMode =
  | "select"
  | "highlight"
  | "underline"
  | "strikethrough"
  | "comment"
  | "freetext"
  | "rectangle"
  | "circle"
  | "line";

export interface AnnotationColor {
  name: string;
  value: string;
  bg: string;
}

export const HIGHLIGHT_COLORS: AnnotationColor[] = [
  { name: "Yellow", value: "rgba(255,235,59,0.4)", bg: "bg-yellow-400" },
  { name: "Green", value: "rgba(76,175,80,0.4)", bg: "bg-green-500" },
  { name: "Blue", value: "rgba(33,150,243,0.4)", bg: "bg-blue-500" },
  { name: "Pink", value: "rgba(233,30,99,0.4)", bg: "bg-pink-500" },
  { name: "Purple", value: "rgba(156,39,176,0.4)", bg: "bg-purple-500" },
  { name: "Orange", value: "rgba(255,152,0,0.4)", bg: "bg-orange-500" },
  { name: "Red", value: "rgba(244,67,54,0.4)", bg: "bg-red-500" },
  { name: "Cyan", value: "rgba(0,188,212,0.4)", bg: "bg-cyan-500" },
];

export const STROKE_COLORS: AnnotationColor[] = [
  { name: "Red", value: "rgba(244,67,54,1)", bg: "bg-red-500" },
  { name: "Blue", value: "rgba(33,150,243,1)", bg: "bg-blue-500" },
  { name: "Green", value: "rgba(76,175,80,1)", bg: "bg-green-500" },
  { name: "Orange", value: "rgba(255,152,0,1)", bg: "bg-orange-500" },
  { name: "Purple", value: "rgba(156,39,176,1)", bg: "bg-purple-500" },
  { name: "Black", value: "rgba(0,0,0,1)", bg: "bg-black" },
];

interface PdfAnnotationToolbarProps {
  currentMode: AnnotationMode;
  currentColor: string;
  onModeChange: (mode: AnnotationMode) => void;
  onColorChange: (color: string) => void;
  disabled?: boolean;
}

export function PdfAnnotationToolbar({
  currentMode,
  currentColor,
  onModeChange,
  onColorChange,
  disabled = false,
}: PdfAnnotationToolbarProps) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const tools = [
    {
      mode: "select" as AnnotationMode,
      icon: MousePointer,
      label: "Select",
      tooltip: "Select and move annotations",
    },
    {
      mode: "highlight" as AnnotationMode,
      icon: Highlighter,
      label: "Highlight",
      tooltip: "Highlight selected text",
    },
    {
      mode: "underline" as AnnotationMode,
      icon: Underline,
      label: "Underline",
      tooltip: "Underline selected text",
    },
    {
      mode: "strikethrough" as AnnotationMode,
      icon: Strikethrough,
      label: "Strikethrough",
      tooltip: "Strikethrough selected text",
    },
    {
      mode: "comment" as AnnotationMode,
      icon: MessageSquarePlus,
      label: "Comment",
      tooltip: "Add a comment/sticky note",
    },
    {
      mode: "freetext" as AnnotationMode,
      icon: Type,
      label: "Text",
      tooltip: "Add free text annotation",
    },
    {
      mode: "rectangle" as AnnotationMode,
      icon: Square,
      label: "Rectangle",
      tooltip: "Draw a rectangle",
    },
    {
      mode: "circle" as AnnotationMode,
      icon: Circle,
      label: "Circle",
      tooltip: "Draw a circle/ellipse",
    },
    {
      mode: "line" as AnnotationMode,
      icon: Minus,
      label: "Line",
      tooltip: "Draw a line",
    },
  ];

  const isTextMode = ["highlight", "underline", "strikethrough"].includes(currentMode);
  const colors = isTextMode ? HIGHLIGHT_COLORS : STROKE_COLORS;

  const getCurrentColorBg = () => {
    const allColors = [...HIGHLIGHT_COLORS, ...STROKE_COLORS];
    const found = allColors.find((c) => c.value === currentColor);
    return found?.bg || "bg-yellow-400";
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-2 bg-white border-b">
        {/* Annotation Tools */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          {tools.map((tool) => (
            <Tooltip key={tool.mode}>
              <TooltipTrigger asChild>
                <Button
                  variant={currentMode === tool.mode ? "default" : "ghost"}
                  size="sm"
                  className={`h-8 w-8 p-0 ${
                    currentMode === tool.mode
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => onModeChange(tool.mode)}
                  disabled={disabled}
                >
                  <tool.icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{tool.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Color Picker */}
        {currentMode !== "select" && (
          <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 px-2"
                disabled={disabled}
              >
                <Palette className="h-4 w-4" />
                <div
                  className={`h-4 w-4 rounded ${getCurrentColorBg()}`}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  {isTextMode ? "Highlight Color" : "Stroke Color"}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {colors.map((color) => (
                    <Tooltip key={color.name}>
                      <TooltipTrigger asChild>
                        <button
                          className={`h-8 w-8 rounded-full ${color.bg} border-2 transition-transform hover:scale-110 ${
                            currentColor === color.value
                              ? "border-gray-800 ring-2 ring-offset-2 ring-blue-500"
                              : "border-gray-300"
                          }`}
                          onClick={() => {
                            onColorChange(color.value);
                            setColorPickerOpen(false);
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{color.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Mode Indicator */}
        <div className="ml-auto text-xs text-gray-500">
          {currentMode === "select" ? (
            "Click and drag to select text"
          ) : currentMode === "highlight" ? (
            "Select text to highlight"
          ) : currentMode === "underline" ? (
            "Select text to underline"
          ) : currentMode === "strikethrough" ? (
            "Select text to strikethrough"
          ) : currentMode === "comment" ? (
            "Click to add a comment"
          ) : currentMode === "freetext" ? (
            "Click to add text"
          ) : currentMode === "rectangle" ? (
            "Click and drag to draw rectangle"
          ) : currentMode === "circle" ? (
            "Click and drag to draw circle"
          ) : currentMode === "line" ? (
            "Click and drag to draw line"
          ) : (
            ""
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
