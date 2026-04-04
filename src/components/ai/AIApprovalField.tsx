import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIApprovalFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  description?: string;
  isAIGenerated?: boolean;
  aiConfidence?: number;
  onApprove?: () => void;
  isApproved?: boolean;
  minHeight?: string;
}

export function AIApprovalField({
  value,
  onChange,
  placeholder,
  className,
  label,
  description,
  isAIGenerated = false,
  aiConfidence,
  onApprove,
  isApproved = false,
  minHeight = "min-h-[60px]"
}: AIApprovalFieldProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleApprove = () => {
    onApprove?.();
  };

  const textColor = isAIGenerated && !isApproved ? 'text-red-600 dark:text-red-400' : '';
  const borderColor = isAIGenerated && !isApproved ? 'border-red-300 dark:border-red-600' : '';

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
          {isAIGenerated && !isApproved && (
            <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Generated
            </Badge>
          )}
          {isAIGenerated && isApproved && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              <Check className="h-3 w-3 mr-1" />
              AI Approved
            </Badge>
          )}
          {aiConfidence && isAIGenerated && !isApproved && (
            <Badge variant="outline" className="text-xs">
              {Math.round(aiConfidence * 100)}% confidence
            </Badge>
          )}
        </div>
      )}
      
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      <div className="relative"
           onMouseEnter={() => setIsHovered(true)}
           onMouseLeave={() => setIsHovered(false)}>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            minHeight,
            "resize-none",
            textColor,
            borderColor,
            className
          )}
          style={{ fieldSizing: 'content' } as React.CSSProperties}
        />
        
        {isAIGenerated && !isApproved && (
          <div className={cn(
            "absolute top-2 right-2 transition-opacity duration-200",
            isHovered ? "opacity-100" : "opacity-70"
          )}>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleApprove}
              className="h-7 px-2 text-xs bg-white/90 hover:bg-white border-red-300 text-red-700 hover:text-red-800 dark:bg-gray-800/90 dark:hover:bg-gray-800 dark:border-red-600 dark:text-red-300 dark:hover:text-red-200"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Approve AI
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}