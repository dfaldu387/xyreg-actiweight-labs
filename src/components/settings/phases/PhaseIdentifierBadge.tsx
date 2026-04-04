
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Hash } from 'lucide-react';

interface PhaseIdentifierBadgeProps {
  phaseId: string;
  className?: string;
}

export function PhaseIdentifierBadge({ phaseId, className }: PhaseIdentifierBadgeProps) {
  // Show last 8 characters of the phase ID for identification
  const shortId = phaseId.slice(-8);
  
  return (
    <Badge 
      variant="outline" 
      className={`text-xs font-mono bg-gray-50 text-gray-500 ${className}`}
    >
      <Hash className="h-2 w-2 mr-1" />
      {shortId}
    </Badge>
  );
}
