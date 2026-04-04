import React from 'react';
import { NCStatus, NC_STATUS_LABELS } from '@/types/nonconformity';
import { cn } from '@/lib/utils';

const STEPS: NCStatus[] = ['open', 'investigation', 'disposition', 'verification', 'closed'];

interface NCStateProgressProps {
  status: NCStatus;
}

export function NCStateProgress({ status }: NCStateProgressProps) {
  const currentIdx = STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-1 w-full">
      {STEPS.map((step, idx) => {
        const isActive = idx === currentIdx;
        const isDone = idx < currentIdx;
        return (
          <div key={step} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={cn(
                'w-full h-2 rounded-full',
                isDone ? 'bg-primary' : isActive ? 'bg-primary/60' : 'bg-muted'
              )}
            />
            <span className={cn(
              'text-xs',
              isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'
            )}>
              {NC_STATUS_LABELS[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
