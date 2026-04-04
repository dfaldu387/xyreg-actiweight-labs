
import React from 'react';
import { X } from 'lucide-react';

interface TextHighlight {
  id: string;
  text: string;
  color: string;
  left: number;
  top: number;
  width: number;
  height: number;
  pageNumber: number;
}

interface TextHighlightOverlayProps {
  highlights: TextHighlight[];
  pageNumber: number;
  scale: number;
  onHighlightClick: (highlight: TextHighlight) => void;
  onHighlightDelete?: (highlightId: string) => void;
  showDeleteButton?: boolean;
}

export function TextHighlightOverlay({
  highlights,
  pageNumber,
  scale,
  onHighlightClick,
  onHighlightDelete,
  showDeleteButton = false
}: TextHighlightOverlayProps) {
  const pageHighlights = highlights.filter(h => h.pageNumber === pageNumber);

  return (
    <>
      {pageHighlights.map((highlight) => (
        <div
          key={highlight.id}
          className="absolute cursor-pointer group"
          style={{
            left: highlight.left * scale,
            top: highlight.top * scale,
            width: highlight.width * scale,
            height: highlight.height * scale,
            backgroundColor: highlight.color,
            opacity: 0.4,
            zIndex: 10,
            border: '1px solid transparent',
            borderRadius: '2px'
          }}
          onClick={(e) => {
            e.stopPropagation();
            onHighlightClick(highlight);
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLElement;
            target.style.opacity = '0.6';
            target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLElement;
            target.style.opacity = '0.4';
            target.style.borderColor = 'transparent';
          }}
          title={`Highlighted text: "${highlight.text.substring(0, 50)}${highlight.text.length > 50 ? '...' : ''}"`}
        >
          {showDeleteButton && onHighlightDelete && (
            <button
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onHighlightDelete(highlight.id);
              }}
              title="Delete highlight"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
    </>
  );
}
