import React from 'react';
import { cn } from '@/lib/utils';

interface HelixTrackPathProps {
  width: number;
  height: number;
  className?: string;
}

// Generate a sinusoidal path for each track
function generateHelixPath(
  startX: number,
  endX: number,
  centerY: number,
  amplitude: number,
  frequency: number,
  phaseOffset: number
): string {
  const points: string[] = [];
  const steps = 100;
  
  for (let i = 0; i <= steps; i++) {
    const x = startX + (endX - startX) * (i / steps);
    const y = centerY + amplitude * Math.sin((frequency * i / steps * Math.PI * 2) + phaseOffset);
    points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
  }
  
  return points.join(' ');
}

export function HelixTrackPath({ width, height, className }: HelixTrackPathProps) {
  const startX = 80;
  const endX = width - 40;
  const amplitude = 15;
  const frequency = 2;
  
  // Three tracks with phase offsets for intertwining effect
  // Track colors: Cyan (eng), Purple (reg), Orange (bus) - distinct from status colors
  const tracks = [
    {
      id: 'engineering',
      centerY: height * 0.25,
      phaseOffset: 0,
      color: 'hsl(185, 90%, 50%)', // Cyan - distinct from amber (active status)
      glowId: 'eng-glow',
    },
    {
      id: 'regulatory',
      centerY: height * 0.5,
      phaseOffset: Math.PI * 0.66,
      color: 'hsl(280, 70%, 60%)', // Purple - unchanged
      glowId: 'reg-glow',
    },
    {
      id: 'business',
      centerY: height * 0.75,
      phaseOffset: Math.PI * 1.33,
      color: 'hsl(35, 92%, 55%)', // Orange - distinct from emerald (validated status)
      glowId: 'bus-glow',
    },
  ];

  return (
    <svg 
      className={cn('absolute inset-0 pointer-events-none', className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <defs>
        {/* Glow filters for each track */}
        {tracks.map(track => (
          <filter key={track.glowId} id={track.glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
        
        {/* Animated flow gradient */}
        <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.8)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          <animate 
            attributeName="x1" 
            from="-100%" 
            to="100%" 
            dur="3s" 
            repeatCount="indefinite"
          />
          <animate 
            attributeName="x2" 
            from="0%" 
            to="200%" 
            dur="3s" 
            repeatCount="indefinite"
          />
        </linearGradient>
      </defs>

      {/* Render each track */}
      {tracks.map((track, index) => {
        const path = generateHelixPath(startX, endX, track.centerY, amplitude, frequency, track.phaseOffset);
        
        return (
          <g key={track.id}>
            {/* Base track path with glow */}
            <path
              d={path}
              fill="none"
              stroke={track.color}
              strokeWidth={4}
              strokeLinecap="round"
              filter={`url(#${track.glowId})`}
              opacity={0.6}
            />
            
            {/* Brighter inner path */}
            <path
              d={path}
              fill="none"
              stroke={track.color}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.9}
            />
            
            {/* Animated flow overlay */}
            <path
              d={path}
              fill="none"
              stroke="url(#flow-gradient)"
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.5}
              style={{
                animationDelay: `${index * 0.5}s`,
              }}
            />
          </g>
        );
      })}

      {/* Track labels - using distinct track colors */}
      <text x={20} y={height * 0.25 + 4} fill="hsl(185, 90%, 60%)" fontSize="10" fontWeight="600" className="uppercase tracking-wider">
        ENG
      </text>
      <text x={20} y={height * 0.5 + 4} fill="hsl(280, 70%, 70%)" fontSize="10" fontWeight="600" className="uppercase tracking-wider">
        REG
      </text>
      <text x={20} y={height * 0.75 + 4} fill="hsl(35, 92%, 65%)" fontSize="10" fontWeight="600" className="uppercase tracking-wider">
        BUS
      </text>
    </svg>
  );
}
