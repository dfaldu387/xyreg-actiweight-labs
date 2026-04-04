
import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Brush, Highlighter, Eraser, Undo, Trash2, Eye, EyeOff, RotateCcw } from 'lucide-react';

interface DrawingToolbarProps {
  isDrawingMode: boolean;
  selectedTool: 'pen' | 'highlighter' | 'eraser';
  selectedColor: string;
  brushSize: number;
  showAnnotations: boolean;
  onToggleDrawingMode: () => void;
  onSelectTool: (tool: 'pen' | 'highlighter' | 'eraser') => void;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onUndo: () => void;
  onClearAll: () => void;
  onToggleAnnotations: () => void;
  onResetDrawingState?: () => void;
}

// Reordered colors with highlighter-friendly colors first
const PRESET_COLORS = [
  '#ffff00', // Yellow (highlighter primary)
  '#00ff00', // Green (highlighter)
  '#ff00ff', // Magenta (highlighter)
  '#00ffff', // Cyan (highlighter)
  '#ffa500', // Orange (highlighter)
  '#ff69b4', // Pink (highlighter)
  '#ff0000', // Red
  '#0000ff', // Blue
  '#000000', // Black
  '#808080', // Gray
];

export function DrawingToolbar({
  selectedTool,
  selectedColor,
  brushSize,
  showAnnotations,
  onSelectTool,
  onColorChange,
  onBrushSizeChange,
  onUndo,
  onClearAll,
  onToggleAnnotations,
  onResetDrawingState
}: DrawingToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-white border-b">
      {/* Drawing Tools */}
      <div className="flex items-center gap-1">
        <Button
          variant={selectedTool === 'highlighter' ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectTool('highlighter')}
          title="Highlighter Tool (Yellow Marker)"
          className={selectedTool === 'highlighter' ? "bg-yellow-500 hover:bg-yellow-600" : ""}
        >
          <Highlighter className="h-4 w-4" />
        </Button>
        
        <Button
          variant={selectedTool === 'pen' ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectTool('pen')}
          title="Pen Tool"
        >
          <Brush className="h-4 w-4" />
        </Button>
        
        <Button
          variant={selectedTool === 'eraser' ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectTool('eraser')}
          title="Eraser Tool"
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Color Picker */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">Color:</span>
        <div className="flex gap-1">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              className={`w-6 h-6 rounded border-2 ${
                selectedColor === color ? 'border-gray-800 ring-2 ring-blue-300' : 'border-gray-300'
              } hover:border-gray-600 transition-colors`}
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
              disabled={selectedTool === 'eraser'}
              title={`Select ${color === '#ffff00' ? 'Yellow (Highlighter)' : color}`}
            />
          ))}
        </div>
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => onColorChange(e.target.value)}
          disabled={selectedTool === 'eraser'}
          className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
          title="Custom Color"
        />
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Brush Size */}
      <div className="flex items-center gap-2 min-w-[120px]">
        <span className="text-xs text-muted-foreground">Size:</span>
        <Slider
          value={[brushSize]}
          onValueChange={(value) => onBrushSizeChange(value[0])}
          min={1}
          max={selectedTool === 'highlighter' ? 25 : 20}
          step={1}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-6 text-center">{brushSize}</span>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          title="Undo Last Stroke"
        >
          <Undo className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          title="Clear All Annotations"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        {/* Recovery Button */}
        {onResetDrawingState && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetDrawingState}
            title="Reset Drawing State (if stuck)"
            className="text-orange-600 hover:text-orange-700"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleAnnotations}
          title={showAnnotations ? "Hide Annotations" : "Show Annotations"}
        >
          {showAnnotations ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {/* Tool Status Indicator */}
      <div className="flex items-center gap-2 ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
        <div className="flex items-center gap-1">
          {selectedTool === 'highlighter' && <span className="text-yellow-600">📝 Highlighter</span>}
          {selectedTool === 'pen' && <span className="text-blue-600">✏️ Pen</span>}
          {selectedTool === 'eraser' && <span className="text-red-600">🧹 Eraser</span>}
        </div>
      </div>
    </div>
  );
}
