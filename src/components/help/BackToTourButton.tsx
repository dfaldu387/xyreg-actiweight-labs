import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface BackToTourButtonProps {
  isActive: boolean;
  onClick: () => void;
}

export function BackToTourButton({ isActive, onClick }: BackToTourButtonProps) {
  if (!isActive) return null;

  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 left-6 z-[55] bg-amber-600 hover:bg-amber-700 text-white shadow-lg rounded-full px-4 py-2 gap-2 animate-pulse"
      size="sm"
    >
      <MapPin className="h-4 w-4" />
      Back to Tour
    </Button>
  );
}
