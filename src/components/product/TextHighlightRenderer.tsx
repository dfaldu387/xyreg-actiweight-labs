
import React from 'react';

interface TextHighlight {
  id: string;
  text: string;
  color: string;
  bounds: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  pageNumber: number;
  commentNumber: number;
  hasComments: boolean;
}

interface TextHighlightRendererProps {
  highlights: TextHighlight[];
  scale: number;
  rotation: number;
}

export function TextHighlightRenderer({ highlights, scale, rotation }: TextHighlightRendererProps) {
  return (
    <>
      {highlights.map((highlight) => (
        <div
          key={highlight.id}
          className="absolute pointer-events-none"
          style={{
            left: highlight.bounds.left * scale,
            top: highlight.bounds.top * scale,
            width: highlight.bounds.width * scale,
            height: highlight.bounds.height * scale,
            backgroundColor: highlight.color,
            opacity: 0.3,
            borderRadius: '2px',
            transform: `rotate(${rotation}deg)`,
          }}
        />
      ))}
    </>
  );
}
