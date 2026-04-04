import React from 'react';
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';

export type FlowEdgeStatus = 'active' | 'blocked' | 'sync' | 'dormant';

interface HelixFlowEdgeData {
  status?: FlowEdgeStatus;
  isSync?: boolean;
}

const edgeConfig = {
  active: {
    strokeColor: 'hsl(45, 96%, 53%)', // Amber - matches active status
    glowColor: 'hsl(45, 96%, 53%)',
    strokeWidth: 3,
    animated: true,
    dashArray: undefined,
  },
  blocked: {
    strokeColor: 'hsl(0, 84%, 60%)',
    glowColor: 'hsl(0, 84%, 60%)',
    strokeWidth: 3,
    animated: false,
    dashArray: '8,8',
  },
  sync: {
    strokeColor: 'hsl(280, 70%, 60%)',
    glowColor: 'hsl(280, 70%, 60%)',
    strokeWidth: 2,
    animated: true,
    dashArray: '4,4',
  },
  dormant: {
    strokeColor: 'hsl(215, 20%, 40%)',
    glowColor: 'hsl(215, 20%, 40%)',
    strokeWidth: 2,
    animated: false,
    dashArray: undefined,
  },
};

export function HelixFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps) {
  const edgeData = data as HelixFlowEdgeData | undefined;
  const status = edgeData?.status || 'dormant';
  const config = edgeConfig[status];

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  return (
    <>
      {/* Glow layer */}
      <path
        d={edgePath}
        fill="none"
        stroke={config.glowColor}
        strokeWidth={config.strokeWidth + 6}
        strokeOpacity={0.3}
        pointerEvents="none"
        style={{
          filter: 'blur(4px)',
        }}
      />
      
      {/* Main edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: config.strokeColor,
          strokeWidth: config.strokeWidth,
          strokeDasharray: config.dashArray,
        }}
        interactionWidth={24}
        markerEnd={markerEnd}
      />

    </>
  );
}
