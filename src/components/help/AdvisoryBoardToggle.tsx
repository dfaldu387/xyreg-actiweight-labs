import React from 'react';
import { Switch } from '@/components/ui/switch';
import { useHelpMode } from '@/context/HelpModeContext';
import { Users } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export function AdvisoryBoardToggle() {
  const { isAdvisoryBoardVisible, setAdvisoryBoardVisible } = useHelpMode();
  const { lang } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-muted/50 border border-border/50">
      <div className="flex items-center gap-2 min-w-0">
        <Users className="h-4 w-4 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground">Professor XyReg</p>
          <p className="text-[10px] text-muted-foreground truncate">
            {isAdvisoryBoardVisible ? 'Floating AI advisor visible' : 'Floating AI advisor hidden'}
          </p>
        </div>
      </div>
      <Switch
        checked={isAdvisoryBoardVisible}
        onCheckedChange={setAdvisoryBoardVisible}
        className="shrink-0"
      />
    </div>
  );
}
