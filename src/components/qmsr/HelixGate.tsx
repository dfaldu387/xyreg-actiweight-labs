import React from 'react';
import { cn } from '@/lib/utils';
import { Lock, Unlock, AlertTriangle, CheckCircle } from 'lucide-react';

export type GateStatus = 'passed' | 'blocked' | 'pending' | 'dormant';

interface HelixGateProps {
  label: string;
  status: GateStatus;
  position: { x: number; y: number };
  height?: number;
  className?: string;
}

const gateConfig = {
  passed: {
    borderColor: 'border-emerald-500',
    glowColor: 'shadow-emerald-500/50',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    icon: CheckCircle,
    animation: '',
  },
  blocked: {
    borderColor: 'border-red-500',
    glowColor: 'shadow-red-500/60',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
    icon: AlertTriangle,
    animation: 'animate-pulse',
  },
  pending: {
    borderColor: 'border-blue-500',
    glowColor: 'shadow-blue-500/40',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    icon: Unlock,
    animation: '',
  },
  dormant: {
    borderColor: 'border-slate-600',
    glowColor: 'shadow-slate-600/20',
    bgColor: 'bg-slate-800/50',
    textColor: 'text-slate-500',
    icon: Lock,
    animation: '',
  },
};

export function HelixGate({ 
  label, 
  status, 
  position, 
  height = 280,
  className 
}: HelixGateProps) {
  const config = gateConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'absolute flex flex-col items-center pointer-events-none',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Gate archway */}
      <div 
        className={cn(
          'relative w-24 flex flex-col items-center',
          'border-2 border-t-4 rounded-t-full',
          'backdrop-blur-sm',
          'shadow-[0_0_20px_var(--tw-shadow-color)]',
          config.borderColor,
          config.glowColor,
          config.bgColor,
          config.animation
        )}
        style={{ height }}
      >
        {/* Gate title */}
        <div className={cn(
          'absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap',
          'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
          'bg-slate-900/80 border',
          config.borderColor,
          config.textColor
        )}>
          {label}
        </div>

        {/* Status icon at top of gate */}
        <div className={cn(
          'mt-4 p-2 rounded-full',
          config.bgColor,
          config.textColor
        )}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Glowing pillars on sides */}
        <div className={cn(
          'absolute left-0 top-0 bottom-0 w-1 rounded-l-full',
          config.bgColor,
          'shadow-[0_0_8px_var(--tw-shadow-color)]',
          config.glowColor
        )} />
        <div className={cn(
          'absolute right-0 top-0 bottom-0 w-1 rounded-r-full',
          config.bgColor,
          'shadow-[0_0_8px_var(--tw-shadow-color)]',
          config.glowColor
        )} />

        {/* Energy field effect for blocked gates */}
        {status === 'blocked' && (
          <div className="absolute inset-0 overflow-hidden rounded-t-full">
            <div 
              className="absolute inset-0 bg-gradient-to-b from-red-500/30 to-transparent"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 8px,
                  rgba(239, 68, 68, 0.2) 8px,
                  rgba(239, 68, 68, 0.2) 10px
                )`,
                animation: 'helix-flow 2s linear infinite',
              }}
            />
          </div>
        )}

        {/* Checkmark effect for passed gates */}
        {status === 'passed' && (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-t-full">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent" />
          </div>
        )}
      </div>

      {/* Base of gate */}
      <div className={cn(
        'w-28 h-2 rounded-b-lg -mt-px',
        config.bgColor,
        config.borderColor,
        'border-2 border-t-0'
      )} />
    </div>
  );
}
