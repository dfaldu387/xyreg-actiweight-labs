import React from 'react';
import { cn } from '@/lib/utils';

interface SemiCircleGaugeProps {
  score: number; // 0-100
  className?: string;
  variant?: 'internal' | 'investor';
}

export function SemiCircleGauge({ score, className, variant = 'internal' }: SemiCircleGaugeProps) {
  // Clamp score between 0-100
  const clampedScore = Math.max(0, Math.min(100, score));
  
  // Calculate needle angle (-90 to 90 degrees)
  const needleAngle = -90 + (clampedScore / 100) * 180;
  
  // Determine zone and recommendation
  const getZoneInfo = (score: number) => {
    const isInvestor = variant === 'investor';
    
    if (score >= 71) {
      return {
        color: 'hsl(var(--success))',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        textColor: 'text-green-700 dark:text-green-400',
        recommendation: isInvestor ? 'STRONG VIABILITY' : 'PROCEED TO DESIGN CONTROLS'
      };
    } else if (score >= 41) {
      return {
        color: 'hsl(var(--warning))',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
        textColor: 'text-yellow-700 dark:text-yellow-400',
        recommendation: isInvestor ? 'MODERATE VIABILITY' : 'PROCEED WITH CAUTION'
      };
    } else {
      return {
        color: 'hsl(var(--destructive))',
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        textColor: 'text-red-700 dark:text-red-400',
        recommendation: isInvestor ? 'LOW VIABILITY' : 'PIVOT RECOMMENDED'
      };
    }
  };

  const zoneInfo = getZoneInfo(clampedScore);

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      {/* SVG Gauge */}
      <svg width="300" height="180" viewBox="0 0 300 180" className="mb-4">
        {/* Background arc - Red zone (0-40) */}
        <path
          d="M 30 150 A 120 120 0 0 1 90 30"
          fill="none"
          stroke="hsl(var(--destructive))"
          strokeWidth="20"
          opacity="0.3"
        />
        {/* Background arc - Yellow zone (40-70) */}
        <path
          d="M 90 30 A 120 120 0 0 1 210 30"
          fill="none"
          stroke="hsl(var(--warning))"
          strokeWidth="20"
          opacity="0.3"
        />
        {/* Background arc - Green zone (70-100) */}
        <path
          d="M 210 30 A 120 120 0 0 1 270 150"
          fill="none"
          stroke="hsl(var(--success))"
          strokeWidth="20"
          opacity="0.3"
        />
        
        {/* Active arc up to current score */}
        <path
          d="M 30 150 A 120 120 0 0 1 270 150"
          fill="none"
          stroke={zoneInfo.color}
          strokeWidth="20"
          strokeDasharray={`${(clampedScore / 100) * 377} 377`}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        
        {/* Needle */}
        <g
          transform={`rotate(${needleAngle} 150 150)`}
          className="transition-transform duration-1000 ease-out"
        >
          <line
            x1="150"
            y1="150"
            x2="150"
            y2="50"
            stroke="hsl(var(--foreground))"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="150" cy="150" r="8" fill="hsl(var(--foreground))" />
        </g>
        
        {/* Center circle */}
        <circle cx="150" cy="150" r="4" fill="hsl(var(--background))" />
      </svg>

      {/* Score Display */}
      <div className="text-center mb-4">
        <div className="text-5xl font-bold text-foreground mb-2">
          {clampedScore}
          <span className="text-2xl text-muted-foreground">/100</span>
        </div>
        <div className={cn("inline-block px-4 py-2 rounded-full text-sm font-semibold", zoneInfo.bgColor, zoneInfo.textColor)}>
          {zoneInfo.recommendation}
        </div>
      </div>
    </div>
  );
}
