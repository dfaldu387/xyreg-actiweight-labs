import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EscalationBadgeProps {
  count: number;
  className?: string;
}

/**
 * Badge to display on company CAPA node showing escalated CAPAs from devices
 */
export function EscalationBadge({ count, className }: EscalationBadgeProps) {
  if (count === 0) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[9px] font-medium gap-1 px-1.5 py-0.5',
        'bg-orange-50 text-orange-700 border-orange-200',
        'shadow-sm',
        className
      )}
    >
      <Link2 className="h-2.5 w-2.5" />
      {count} from devices
    </Badge>
  );
}
