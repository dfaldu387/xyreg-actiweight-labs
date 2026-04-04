
import React from 'react';
import { Save, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface SaveStatusIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date | null;
  hasUnsavedChanges?: boolean;
  className?: string;
}

export function SaveStatusIndicator({
  status,
  lastSaved,
  hasUnsavedChanges = false,
  className
}: SaveStatusIndicatorProps) {
  const { lang } = useTranslation();

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return lang('saveStatus.justNow');
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return minutes === 1
        ? lang('saveStatus.minuteAgo').replace('{{count}}', '1')
        : lang('saveStatus.minutesAgo').replace('{{count}}', String(minutes));
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return hours === 1
        ? lang('saveStatus.hourAgo').replace('{{count}}', '1')
        : lang('saveStatus.hoursAgo').replace('{{count}}', String(hours));
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: lang('saveStatus.saving'),
          color: 'text-blue-600'
        };
      case 'saved':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: lastSaved ? lang('saveStatus.savedRelative').replace('{{time}}', formatRelativeTime(lastSaved)) : lang('saveStatus.saved'),
          color: 'text-green-600'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: lang('saveStatus.saveFailed'),
          color: 'text-red-600'
        };
      default:
        if (hasUnsavedChanges) {
          return {
            icon: <Clock className="w-4 h-4" />,
            text: lang('saveStatus.unsavedChanges'),
            color: 'text-orange-600'
          };
        }
        return {
          icon: <Save className="w-4 h-4" />,
          text: lang('saveStatus.allChangesSaved'),
          color: 'text-gray-500'
        };
    }
  };

  const { icon, text, color } = getStatusDisplay();

  return (
    <div className={cn('flex items-center gap-2 text-sm', color, className)}>
      {icon}
      <span>{text}</span>
    </div>
  );
}
