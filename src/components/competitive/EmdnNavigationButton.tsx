import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Network } from 'lucide-react';
import { EmdnNavigationPopup } from './EmdnNavigationPopup';
import { useTranslation } from '@/hooks/useTranslation';

interface EmdnNavigationButtonProps {
  disabled?: boolean;
  currentEmdnCode: string;
  startingEmdnCode: string;
  onEmdnCodeChange?: (newCode: string) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function EmdnNavigationButton({
  disabled = false,
  currentEmdnCode,
  startingEmdnCode,
  onEmdnCodeChange,
  className,
  variant = 'outline',
  size = 'sm'
}: EmdnNavigationButtonProps) {
  const { lang } = useTranslation();
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  return (
    <EmdnNavigationPopup
      currentEmdnCode={currentEmdnCode}
      startingEmdnCode={startingEmdnCode}
      onEmdnCodeChange={onEmdnCodeChange}
      open={isPopupOpen}
      onOpenChange={setIsPopupOpen}
      trigger={
        <Button
          disabled={disabled}
          variant={variant}
          size={size}
          className={className}
        >
          <Network className={`h-4 w-4 mr-2 ${disabled ? 'text-slate-500' : 'text-slate-700'}`} />
          {lang('marketAnalysis.emdnNavigation')}
        </Button>
      }
    />
  );
}