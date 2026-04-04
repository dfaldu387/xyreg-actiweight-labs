import React from 'react';
// @ts-ignore - reactflow type mismatch
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';
import { X, Info } from 'lucide-react';

export function PercentageEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const percentage = data?.percentage || 0;
  const relationship = data?.relationship;

  const handleEdgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.onEditPercentage) {
      data.onEditPercentage(id);
    } else {
      console.error('❌ No onEditPercentage handler found on edge data');
    }
  };

  return (
    <>
      <BaseEdge 
        id={id}
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          ...style,
          strokeWidth: 2,
        }}
      />
      
      {/* Wider invisible clickable area for easier clicking */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={40}
        stroke="transparent"
        style={{ 
          cursor: 'pointer',
          pointerEvents: 'stroke',
        }}
        onClick={handleEdgeClick}
        onDoubleClick={handleEdgeClick}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 11,
            pointerEvents: 'all',
            zIndex: 1000,
          }}
          className="nodrag nopan group/edge"
        >
          <div className="relative flex items-center gap-2">
            {/* Delete button - always visible */}
            {data?.onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  data.onDelete(id);
                }}
                className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center justify-center z-[1000] shadow-lg border-2 border-white"
                title="Delete relationship"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            
            {/* Info/Percentage button - click to view details */}
            <button
              className="flex items-center justify-center w-11 h-11 bg-gray-900 text-white rounded-full border-3 border-white shadow-lg hover:scale-110 transition-all cursor-pointer font-bold text-xs"
              style={{
                backgroundColor: '#1f2937',
                color: '#ffffff',
                borderColor: '#ffffff',
                pointerEvents: 'all',
              }}
              onClick={handleEdgeClick}
              title="Click to view relationship details"
            >
              <div className="flex flex-col items-center justify-center">
                <Info className="h-3 w-3 mb-0.5 opacity-70" />
                <span>{percentage}%</span>
              </div>
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
