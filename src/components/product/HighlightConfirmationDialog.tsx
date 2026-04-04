
import React from 'react';
import { Check, X, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HighlightConfirmationDialogProps {
  selectedText: string;
  highlightColor: string;
  onConfirm: () => void;
  onCancel: () => void;
  onColorChange: (color: string) => void;
  position: { x: number; y: number };
}

const HIGHLIGHT_COLORS = [
  { color: '#ffff00', name: 'Yellow' },
  { color: '#90EE90', name: 'Light Green' },
  { color: '#FFB6C1', name: 'Light Pink' },
  { color: '#87CEEB', name: 'Sky Blue' },
  { color: '#DDA0DD', name: 'Plum' },
  { color: '#F0E68C', name: 'Khaki' }
];

export function HighlightConfirmationDialog({
  selectedText,
  highlightColor,
  onConfirm,
  onCancel,
  onColorChange,
  position
}: HighlightConfirmationDialogProps) {
  return (
    <div
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[280px]"
      style={{
        left: Math.min(position.x, window.innerWidth - 300),
        top: position.y + 10
      }}
    >
      <div className="space-y-3">
        {/* Selected text preview */}
        <div className="text-sm">
          <div className="font-medium text-gray-700 mb-1">Selected text:</div>
          <div 
            className="text-gray-600 p-2 rounded border-l-4 max-h-20 overflow-y-auto text-xs"
            style={{ borderLeftColor: highlightColor, backgroundColor: `${highlightColor}20` }}
          >
            "{selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText}"
          </div>
        </div>

        {/* Color picker */}
        <div>
          <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
            <Palette className="h-3 w-3" />
            Highlight Color
          </div>
          <div className="flex gap-1 flex-wrap">
            {HIGHLIGHT_COLORS.map(({ color, name }) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${
                  highlightColor === color ? 'border-gray-400' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
                title={name}
              />
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={onConfirm}
            size="sm"
            className="flex-1 flex items-center gap-1"
          >
            <Check className="h-3 w-3" />
            Highlight
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
            className="flex-1 flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
