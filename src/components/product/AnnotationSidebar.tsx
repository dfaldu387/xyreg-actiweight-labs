import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  FileText,
  X,
  User,
  Edit,
  Trash,
  Highlighter,
  Type,
  Square,
  StickyNote,
} from "lucide-react";

export type AnnotationType =
  | "highlight"
  | "comment"
  | "freetext"
  | "note"
  | "rectangle"
  | "text"
  | "freehand";

interface PdfAnnotation {
  id: string;
  pageNumber: number;
  text: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  comment?: {
    text: string;
    emoji?: string;
  };
  userName?: string;
  color?: string;
  annotationType?: AnnotationType;
  createdAt?: string;
}

interface AnnotationSidebarProps {
  highlights: PdfAnnotation[];
  onHighlightClick: (highlight: PdfAnnotation) => void;
  onEdit?: (highlight: PdfAnnotation) => void;
  onDelete?: (highlight: PdfAnnotation) => void;
  onClose?: () => void;
}

export function AnnotationSidebar({
  highlights,
  onHighlightClick,
  onEdit,
  onDelete,
  onClose,
}: AnnotationSidebarProps) {
  const getAnnotationTypeIcon = (type?: AnnotationType, color?: string) => {
    const iconClass = "h-4 w-4";
    const style = color ? { color } : {};

    switch (type) {
      case "highlight":
        return <Highlighter className={iconClass} style={style} />;
      case "comment":
        return <StickyNote className={`${iconClass} text-yellow-500`} />;
      case "freetext":
        return <Type className={`${iconClass} text-gray-600`} />;
      case "note":
        return <FileText className={`${iconClass} text-blue-500`} />;
      case "rectangle":
        return <Square className={iconClass} style={style} />;
      default:
        return <Highlighter className={`${iconClass} text-yellow-500`} />;
    }
  };

  const getAnnotationTypeLabel = (type?: AnnotationType) => {
    switch (type) {
      case "highlight":
        return "Highlight";
      case "comment":
        return "Comment";
      case "freetext":
        return "Text";
      case "note":
        return "Note";
      case "rectangle":
        return "Rectangle";
      default:
        return "Highlight";
    }
  };

  const getAnnotationTypeBadgeColor = (type?: AnnotationType) => {
    switch (type) {
      case "highlight":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "comment":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "freetext":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "note":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "rectangle":
        return "bg-green-100 text-green-800 border-green-200";
      case "freehand":
        return "bg-violet-100 text-violet-800 border-violet-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getTextSnippet = (highlight: PdfAnnotation) => {
    const text = highlight.text || highlight.comment?.text || "";
    if (text.length > 100) {
      return text.substring(0, 100) + "...";
    }
    return text;
  };

  return (
    <div className="w-1/3 min-w-[300px] max-w-[400px] bg-white border-l border-gray-200 flex flex-col h-full z-10 flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Annotations</h3>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {highlights.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No annotations yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Select text or areas in the PDF to create annotations
            </p>
          </div>
        ) : (
          <div className="p-2">
            {highlights.map((highlight, index) => (
              <div key={highlight.id} className="group">
                <div className="flex items-start w-full p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  {/* Click area for navigation */}
                  <div
                    className="flex items-start gap-3 flex-1 min-w-0"
                    onClick={() => onHighlightClick(highlight)}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getAnnotationTypeIcon(highlight.annotationType, highlight.color)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={`text-xs px-1.5 py-0.5 ${getAnnotationTypeBadgeColor(highlight.annotationType)}`}
                        >
                          {getAnnotationTypeLabel(highlight.annotationType)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Page {highlight.pageNumber}
                        </span>
                      </div>
                      <div className="text-sm text-gray-900 mb-2 line-clamp-2">
                        {getTextSnippet(highlight)}
                      </div>
                      {highlight.comment?.text && (
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                          <span>{highlight.comment.emoji}</span>
                          <span className="line-clamp-1">
                            {highlight.comment.text}
                          </span>
                        </div>
                      )}
                      {/* User name display */}
                      {highlight.userName && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <User className="h-3 w-3" />
                          <span className="line-clamp-1">
                            {highlight.userName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit/Delete buttons - Always visible with hover highlight */}
                  <div className="flex flex-col gap-1 ml-2 flex-shrink-0">
                    {typeof onEdit === 'function' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        title="Edit annotation"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(highlight);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {typeof onDelete === 'function' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete annotation"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(highlight);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {index < highlights.length - 1 && (
                  <Separator className="mx-3" />
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
