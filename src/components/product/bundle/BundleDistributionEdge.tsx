import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';

export function BundleDistributionEdge({
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

  const percentage = data?.percentage as number | undefined;
  const color = (data?.color as string) || 'hsl(var(--foreground))';

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {percentage !== undefined && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div
              className="px-2 py-1 rounded text-xs font-semibold shadow-sm border"
              style={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: color,
                color: color,
              }}
            >
              {percentage}%
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
