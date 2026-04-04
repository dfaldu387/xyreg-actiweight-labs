import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sparkles, ChevronDown, ChevronUp, Check, X, Loader2 } from 'lucide-react';
import { FieldSuggestion } from '@/services/productDefinitionAIService';
import { cn } from '@/lib/utils';

interface AISuggestionButtonProps {
  fieldType: string;
  currentValue: string;
  suggestions: FieldSuggestion[];
  onAcceptSuggestion: (suggestion: string) => void;
  onRejectSuggestion?: (suggestion: FieldSuggestion) => void;
  className?: string;
  disabled?: boolean;
}

export function AISuggestionButton({
  fieldType,
  currentValue,
  suggestions,
  onAcceptSuggestion,
  onRejectSuggestion,
  className,
  disabled = false
}: AISuggestionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Filter suggestions for this field type
  const fieldSuggestions = suggestions.filter(s => s.fieldType === fieldType);

  // Don't show if no suggestions or field already has content
  if (fieldSuggestions.length === 0 || currentValue.trim().length > 0) {
    return null;
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const handleAcceptSuggestion = async (suggestion: FieldSuggestion) => {
    setIsApplying(true);
    try {
      onAcceptSuggestion(suggestion.suggestion);
      setIsExpanded(false);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRejectSuggestion = (suggestion: FieldSuggestion) => {
    onRejectSuggestion?.(suggestion);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="w-full justify-between bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300 text-amber-700 hover:from-amber-100 hover:to-yellow-100 dark:from-amber-950/30 dark:to-yellow-950/30 dark:border-amber-700 dark:text-amber-300"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-medium">
                AI Suggestions ({fieldSuggestions.length})
              </span>
            </div>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <Card className="border-amber-300 dark:border-amber-700">
            <CardContent className="p-4 space-y-3">
              {fieldSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-950/50 dark:to-gray-900/50"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Badge
                      variant="secondary"
                      className={getConfidenceColor(suggestion.confidence)}
                    >
                      {getConfidenceLabel(suggestion.confidence)} ({Math.round(suggestion.confidence * 100)}%)
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcceptSuggestion(suggestion)}
                        disabled={isApplying}
                        className="h-7 px-2 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300"
                      >
                        {isApplying ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectSuggestion(suggestion)}
                        className="h-7 px-2 text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {suggestion.suggestion}
                  </p>
                  
                  {suggestion.reasoning && (
                    <p className="text-xs text-muted-foreground italic border-l-2 border-gray-300 dark:border-gray-600 pl-2">
                      {suggestion.reasoning}
                    </p>
                  )}
                </div>
              ))}
              
              <p className="text-xs text-muted-foreground text-center mt-3 pt-2 border-t">
                ✨ Suggestions generated from your uploaded document
              </p>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}