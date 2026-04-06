import React from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PendingFieldSuggestionProps {
  fieldLabel: string;
  suggestedValue: string;
  onAccept: () => void;
  onReject: () => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
}

export function PendingFieldSuggestion({
  fieldLabel,
  suggestedValue,
  onAccept,
  onReject,
  isAccepting = false,
  isRejecting = false,
}: PendingFieldSuggestionProps) {
  // Don't render if suggestion is empty after stripping HTML
  const plainText = suggestedValue
    ?.replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  if (!plainText) return null;

  return (
    <div className="mt-2 rounded-md border border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-3 animate-in fade-in slide-in-from-top-1 duration-300">
      <div className="flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
            AI Suggestion from Document Studio
          </p>
          <p
            className="text-sm text-green-800 dark:text-green-300 break-words"
            dangerouslySetInnerHTML={{ __html: suggestedValue }}
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={onAccept}
            disabled={isAccepting || isRejecting}
            className="h-7 w-7 p-0 text-green-700 hover:bg-green-200 dark:text-green-400 dark:hover:bg-green-900"
            title="Accept suggestion"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onReject}
            disabled={isAccepting || isRejecting}
            className="h-7 w-7 p-0 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900"
            title="Reject suggestion"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
