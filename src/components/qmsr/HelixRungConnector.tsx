import React from 'react';
import { cn } from '@/lib/utils';
import type { HelixNodeStatus } from '@/config/helixNodeConfig';

interface HelixRungConnectorProps {
  x: number;
  y1: number;
  y2: number;
  status?: HelixNodeStatus;
  animated?: boolean;
  className?: string;
}

const statusColors = {
  dormant: {
    stroke: 'hsl(215, 20%, 35%)',
    glow: 'hsl(215, 20%, 40%)',
  },
  active: {
    stroke: 'hsl(45, 96%, 53%)',
    glow: 'hsl(45, 96%, 60%)',
  },
  validated: {
    stroke: 'hsl(142, 60%, 45%)',
    glow: 'hsl(142, 60%, 55%)',
  },
  critical: {
    stroke: 'hsl(0, 84%, 55%)',
    glow: 'hsl(0, 84%, 65%)',
  },
};

export function HelixRungConnector({
  x,
  y1,
  y2,
  status = 'dormant',
  animated = true,
  className,
}: HelixRungConnectorProps) {
  const colors = statusColors[status];
  const height = Math.abs(y2 - y1);
  const minY = Math.min(y1, y2);

  return (
    <svg
      className={cn('absolute pointer-events-none', className)}
      style={{
        left: x - 10,
        top: minY,
        width: 20,
        height: height,
      }}
      viewBox={`0 0 20 ${height}`}
    >
      <defs>
        <filter id={`rung-glow-${x}-${y1}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`rung-gradient-${x}-${y1}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.3" />
          <stop offset="50%" stopColor={colors.stroke} stopOpacity="1" />
          <stop offset="100%" stopColor={colors.stroke} stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Glow layer */}
      <line
        x1="10"
        y1="0"
        x2="10"
        y2={height}
        stroke={colors.glow}
        strokeWidth="6"
        strokeOpacity="0.3"
        filter={`url(#rung-glow-${x}-${y1})`}
      />

      {/* Main connector line */}
      <line
        x1="10"
        y1="0"
        x2="10"
        y2={height}
        stroke={`url(#rung-gradient-${x}-${y1})`}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Animated pulse (if active or validated) */}
      {animated && (status === 'active' || status === 'validated') && (
        <>
          <circle r="3" fill={colors.glow}>
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={`M10,0 L10,${height}`}
            />
          </circle>
          <circle r="2" fill="white" opacity="0.8">
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={`M10,${height} L10,0`}
              begin="1s"
            />
          </circle>
        </>
      )}

      {/* Connection dots at endpoints */}
      <circle cx="10" cy="0" r="4" fill={colors.stroke} opacity="0.8" />
      <circle cx="10" cy={height} r="4" fill={colors.stroke} opacity="0.8" />
    </svg>
  );
}
