import React from 'react';
import { BaseEdge, getBezierPath, Position } from '@xyflow/react';
import { TraceabilityEdgeData } from './useTraceabilityGraph';

const STATUS_COLORS = {
  not_run: '#9ca3af',      // Grey
  passed: '#22c55e',       // Green
  failed: '#ef4444',       // Red
  needs_rerun: '#f59e0b',  // Amber
};

interface TraceabilityFlowEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  data?: TraceabilityEdgeData;
  selected?: boolean;
}

export function TraceabilityFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: TraceabilityFlowEdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const status = data?.status || 'not_run';
  const strokeColor = STATUS_COLORS[status];
  
  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: selected ? 3 : 2,
          opacity: selected ? 1 : 0.7,
        }}
      />
      {status === 'needs_rerun' && (
        <circle r="4" fill={strokeColor}>
          <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
}
