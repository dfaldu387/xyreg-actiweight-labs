import React from 'react';
import { Shield, Microscope, Cpu, FileText } from 'lucide-react';

interface ProgressPieIconProps {
  progress: number;
  color: string;
  chapterId: string;
  size?: number;
}

const getIcon = (chapterId: string) => {
  switch (chapterId) {
    case 'chapter1': return Shield;
    case 'chapter2a': return Microscope;
    case 'chapter2b': return Cpu;
    case 'chapter3': return FileText;
    default: return Shield;
  }
};

const getColorClasses = (color: string) => {
  const colorMap = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
  };
  return colorMap[color as keyof typeof colorMap] || 'text-primary';
};

export function ProgressPieIcon({ progress, color, chapterId, size = 80 }: ProgressPieIconProps) {
  const Icon = getIcon(chapterId);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const colorClass = getColorClasses(color);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth="4"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`hsl(var(--${color === 'amber' ? 'warning' : color === 'emerald' ? 'accent' : color}))`}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon 
          size={size * 0.3} 
          className={`${colorClass} opacity-80`}
        />
      </div>
      {/* Progress percentage */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
        <span className="text-xs font-semibold text-foreground bg-background px-1 rounded">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}