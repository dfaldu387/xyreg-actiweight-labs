import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';

export type FlowEdgeStatus = 'active' | 'blocked' | 'sync' | 'dormant';

interface HelixFlowEdgeData {
  status?: FlowEdgeStatus;
  isSync?: boolean;
  /**
   * Optional detour direction. When set, the edge ignores the default
   * smoothstep routing and draws a manual U-shaped path that goes well
   * above ('above') or below ('below') the natural mid-line, so it
   * routes *around* large central UI elements (e.g. the Device Engine
   * column) instead of slicing through them.
   */
  detour?: 'above' | 'below';
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
  label,
}: EdgeProps) {
  const edgeData = data as HelixFlowEdgeData | undefined;
  const status = edgeData?.status || 'dormant';
  const config = edgeConfig[status];

  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (edgeData?.detour) {
    // Manual detour around the central Design Control column.
    // 'above' (yellow REG) has clearance to run as a straight horizontal
    // line at the source's Y level — no vertical bends needed.
    // 'below' (red ENG) still needs to dip beneath the Device Engine panel,
    // but with a shallower offset so the bend begins earlier.
    if (edgeData.detour === 'above') {
      edgePath = `M ${sourceX},${sourceY} L ${targetX},${sourceY} L ${targetX},${targetY}`;
      labelX = (sourceX + targetX) / 2;
      labelY = sourceY;
    } else {
      const stub = 30;
      const detourOffset = 130; // halved from 260 so bend starts 50% earlier
      const midY = (sourceY + targetY) / 2 + detourOffset;
      const x1 = sourceX + stub;
      const x2 = targetX - stub;
      edgePath = `M ${sourceX},${sourceY} L ${x1},${sourceY} L ${x1},${midY} L ${x2},${midY} L ${x2},${targetY} L ${targetX},${targetY}`;
      labelX = (x1 + x2) / 2;
      labelY = midY;
    }
  } else {
    const [path, lx, ly] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 16,
    });
    edgePath = path;
    labelX = lx;
    labelY = ly;
  }

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

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
              fontSize: 10,
              fontWeight: 600,
              color: config.strokeColor,
              background: 'hsl(var(--background))',
              padding: '2px 6px',
              borderRadius: 4,
              border: `1px solid ${config.strokeColor}`,
              whiteSpace: 'nowrap',
              opacity: 0.95,
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
