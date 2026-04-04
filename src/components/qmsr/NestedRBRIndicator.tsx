import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, Clock, Circle } from 'lucide-react';
import type { HelixNodeStatus } from '@/config/helixNodeConfig';

interface NestedRBRIndicatorProps {
  label: string;
  status: HelixNodeStatus;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

const statusConfig = {
  dormant: {
    icon: Circle,
    bgColor: 'bg-white',
    borderColor: 'border-slate-400',
    textColor: 'text-slate-900',
    iconColor: 'text-slate-500',
  },
  active: {
    icon: Clock,
    bgColor: 'bg-white',
    borderColor: 'border-amber-500 border-2',
    textColor: 'text-slate-900',
    iconColor: 'text-amber-500',
    pulse: true,
  },
  validated: {
    icon: CheckCircle,
    bgColor: 'bg-white',
    borderColor: 'border-emerald-500 border-2',
    textColor: 'text-slate-900',
    iconColor: 'text-emerald-500',
  },
  critical: {
    icon: AlertTriangle,
    bgColor: 'bg-white',
    borderColor: 'border-red-500 border-2',
    textColor: 'text-slate-900',
    iconColor: 'text-red-500',
    pulse: true,
  },
};

export function NestedRBRIndicator({ 
  label, 
  status, 
  onClick,
  className 
}: NestedRBRIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  // Use different pulse speeds: slow (10s) for active/yellow, fast (2s) for critical/red
  const pulseClass = status === 'critical' 
    ? 'animate-pulse-critical' 
    : status === 'active' 
      ? 'animate-pulse-slow' 
      : '';

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-md border',
        'text-[10px] font-medium transition-all duration-200',
        'hover:scale-105 cursor-pointer shadow-sm',
        config.bgColor,
        config.borderColor,
        config.textColor,
        pulseClass,
        className
      )}
    >
      <Icon className={cn('h-3 w-3', config.iconColor)} />
      <span className="truncate max-w-[100px]">{label}</span>
    </button>
  );
}
