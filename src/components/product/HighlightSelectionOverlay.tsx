
import React from 'react';

interface HighlightSelection {
  text: string;
  pageNumber: number;
  pageRelativeCoords: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

interface HighlightSelectionOverlayProps {
  selection: HighlightSelection;
  color: string;
  scale?: number;
  isActive?: boolean;
}

export function HighlightSelectionOverlay({
  selection,
  color,
  scale = 1,
  isActive = false
}: HighlightSelectionOverlayProps) {
  return (
    <div
      className={`absolute pointer-events-none transition-opacity duration-150 ${
        isActive ? 'opacity-60' : 'opacity-40'
      }`}
      style={{
        left: selection.pageRelativeCoords.left * scale,
        top: selection.pageRelativeCoords.top * scale,
        width: selection.pageRelativeCoords.width * scale,
        height: selection.pageRelativeCoords.height * scale,
        backgroundColor: color,
        border: isActive ? `2px dashed ${color}` : 'none',
        borderRadius: '2px',
        zIndex: 20
      }}
      title={`Selecting: "${selection.text.substring(0, 50)}${selection.text.length > 50 ? '...' : ''}"`}
    />
  );
}
