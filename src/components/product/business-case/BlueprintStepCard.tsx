import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  ChevronDown,
  StickyNote,
  Sparkles,
  Loader2
} from 'lucide-react';
import { cn } from "@/lib/utils";

export interface StepModuleMapping {
  route: string;
  moduleLabel: string;
  completionKey: string;
}

interface BlueprintStepCardProps {
  stepId: string;
  stepNumber: number;
  title: string;
  description: string;
  questions: string;
  mapping: StepModuleMapping;
  isModuleComplete: boolean;
  notes?: string;
  onNotesChange?: (notes: string) => void;
  onGenerateAI?: () => void;
  isAILoading?: boolean;
  disabled?: boolean;
  returnTo?: string;
}

export function BlueprintStepCard({
  stepId,
  stepNumber,
  title,
  description,
  questions,
  mapping,
  isModuleComplete,
  notes = '',
  onNotesChange,
  onGenerateAI,
  isAILoading = false,
  disabled = false,
  returnTo = 'venture-blueprint',
}: BlueprintStepCardProps) {
  const navigate = useNavigate();
  const { productId, companyName } = useParams();
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const handleNavigateToModule = () => {
    if (disabled) return;
    const separator = mapping.route.includes('?') ? '&' : '?';
    const fullRoute = `/app/product/${productId}/${mapping.route}${separator}returnTo=${returnTo}`;
    navigate(fullRoute);
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      isModuleComplete 
        ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20" 
        : "border-border hover:border-primary/30"
    )}>
      <CardContent className="p-4 space-y-3">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            {/* Completion Indicator */}
            <div className="mt-0.5 flex-shrink-0">
              {isModuleComplete ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Title & Description */}
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium text-sm">
                  Step {stepNumber}: {title}
                </h4>
                {isModuleComplete && (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-xs">
                    Complete
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Questions Preview */}
        <div className="pl-8 space-y-2">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Key Questions: </span>
            {questions}
          </div>
        </div>

        {/* Action Row */}
        <div className="pl-8 flex items-center justify-between gap-3 pt-2">
          {/* Navigate Button */}
          <Button
            variant={isModuleComplete ? "outline" : "default"}
            size="sm"
            onClick={handleNavigateToModule}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            Go to {mapping.moduleLabel.split(' → ')[0]}
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Optional Notes Toggle */}
          <Collapsible open={isNotesOpen} onOpenChange={setIsNotesOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "flex items-center gap-2 text-muted-foreground",
                  notes?.trim() && "text-blue-600"
                )}
                disabled={disabled}
              >
                <StickyNote className="h-4 w-4" />
                {notes?.trim() ? 'View Notes' : 'Add Notes'}
                <ChevronDown className={cn(
                  "h-3 w-3 transition-transform",
                  isNotesOpen && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>

        {/* Notes Section (Collapsible) */}
        <Collapsible open={isNotesOpen} onOpenChange={setIsNotesOpen}>
          <CollapsibleContent className="pl-8 pt-2">
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  Strategic Notes (optional - for investor narrative)
                </span>
                {onGenerateAI && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onGenerateAI}
                    disabled={isAILoading || disabled}
                    className="h-7 px-2"
                  >
                    {isAILoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-purple-600" />
                    )}
                  </Button>
                )}
              </div>
              <Textarea
                placeholder="Add strategic notes for this step..."
                value={notes}
                onChange={(e) => onNotesChange?.(e.target.value)}
                disabled={disabled}
                className="min-h-[80px] text-sm"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
