import React from 'react';
import { Switch } from '@/components/ui/switch';
import { useHelpMode } from '@/context/HelpModeContext';
import { Lightbulb } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export function HelpHintsToggle() {
  const { isHelpEnabled, setHelpEnabled } = useHelpMode();
  const { lang } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-muted/50 border border-border/50">
      <div className="flex items-center gap-2 min-w-0">
        <Lightbulb className="h-4 w-4 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground">{lang('help.sidebar.helpHints.title')}</p>
          <p className="text-[10px] text-muted-foreground truncate">
            {isHelpEnabled ? lang('help.sidebar.helpHints.enabled') : lang('help.sidebar.helpHints.disabled')}
          </p>
        </div>
      </div>
      <Switch
        checked={isHelpEnabled}
        onCheckedChange={setHelpEnabled}
        className="shrink-0"
      />
    </div>
  );
}
