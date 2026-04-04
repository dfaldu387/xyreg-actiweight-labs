import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, X, Lightbulb, Play, ExternalLink } from "lucide-react";
import { useLocation } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

interface TooltipContent {
  title: string;
  description: string;
  tips?: string[];
  videoUrl?: string;
  learnMoreUrl?: string;
}

interface ContextualTooltipProps {
  children: React.ReactNode;
  content: TooltipContent;
  trigger?: 'hover' | 'click' | 'focus';
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  delay?: number;
  className?: string;
  disabled?: boolean;
}

export function ContextualTooltip({
  children,
  content,
  trigger = 'hover',
  position = 'auto',
  delay = 500,
  className = '',
  disabled = false
}: ContextualTooltipProps) {
  const { lang } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const location = useLocation();

  // Check if user has seen this tooltip before
  useEffect(() => {
    const seenKey = `xyreg-tooltip-seen-${content.title.toLowerCase().replace(/\s+/g, '-')}-${location.pathname}`;
    const hasSeenBefore = localStorage.getItem(seenKey) === 'true';
    setHasBeenSeen(hasSeenBefore);
  }, [content.title, location.pathname]);

  // Mark tooltip as seen when it becomes visible
  useEffect(() => {
    if (isVisible && !hasBeenSeen) {
      const seenKey = `xyreg-tooltip-seen-${content.title.toLowerCase().replace(/\s+/g, '-')}-${location.pathname}`;
      localStorage.setItem(seenKey, 'true');
      setHasBeenSeen(true);
    }
  }, [isVisible, hasBeenSeen, content.title, location.pathname]);

  // Calculate optimal position
  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return position;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    if (position !== 'auto') return position;

    // Auto-positioning logic
    const spaceTop = triggerRect.top;
    const spaceBottom = viewport.height - triggerRect.bottom;
    const spaceLeft = triggerRect.left;
    const spaceRight = viewport.width - triggerRect.right;

    // Prefer bottom, then top, then sides
    if (spaceBottom >= tooltipRect.height + 10) return 'bottom';
    if (spaceTop >= tooltipRect.height + 10) return 'top';
    if (spaceRight >= tooltipRect.width + 10) return 'right';
    if (spaceLeft >= tooltipRect.width + 10) return 'left';

    return 'bottom'; // Fallback
  };

  const showTooltip = () => {
    if (disabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (trigger === 'hover') {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    } else {
      setIsVisible(true);
    }
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const toggleTooltip = () => {
    if (disabled) return;
    setIsVisible(!isVisible);
  };

  // Update position when tooltip becomes visible
  useEffect(() => {
    if (isVisible) {
      const newPosition = calculatePosition();
      setActualPosition(newPosition);
    }
  }, [isVisible]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getPositionClasses = () => {
    const baseClasses = 'absolute z-50';
    
    switch (actualPosition) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 -translate-x-1/2 mb-2`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 -translate-x-1/2 mt-2`;
      case 'left':
        return `${baseClasses} right-full top-1/2 -translate-y-1/2 mr-2`;
      case 'right':
        return `${baseClasses} left-full top-1/2 -translate-y-1/2 ml-2`;
      default:
        return `${baseClasses} top-full left-1/2 -translate-x-1/2 mt-2`;
    }
  };

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-2 h-2 bg-white border rotate-45';
    
    switch (actualPosition) {
      case 'top':
        return `${baseClasses} top-full left-1/2 -translate-x-1/2 -mt-1 border-t-0 border-l-0`;
      case 'bottom':
        return `${baseClasses} bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-0 border-r-0`;
      case 'left':
        return `${baseClasses} left-full top-1/2 -translate-y-1/2 -ml-1 border-l-0 border-b-0`;
      case 'right':
        return `${baseClasses} right-full top-1/2 -translate-y-1/2 -mr-1 border-r-0 border-t-0`;
      default:
        return `${baseClasses} bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-0 border-r-0`;
    }
  };

  const handleVideoClick = () => {
    // In a real implementation, this would open a video player
  };

  const handleLearnMoreClick = () => {
    // In a real implementation, this would navigate to the help topic
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        ref={triggerRef}
        onMouseEnter={trigger === 'hover' ? showTooltip : undefined}
        onMouseLeave={trigger === 'hover' ? hideTooltip : undefined}
        onClick={trigger === 'click' ? toggleTooltip : undefined}
        onFocus={trigger === 'focus' ? showTooltip : undefined}
        onBlur={trigger === 'focus' ? hideTooltip : undefined}
        className="relative"
      >
        {children}
        
        {/* Help indicator for new tooltips */}
        {!hasBeenSeen && !disabled && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
        )}
      </div>

      {/* Tooltip */}
      {isVisible && (
        <>
          {/* Backdrop for click-outside behavior */}
          {trigger === 'click' && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsVisible(false)}
            />
          )}
          
          <div
            ref={tooltipRef}
            className={getPositionClasses()}
            style={{ maxWidth: '320px', minWidth: '200px' }}
          >
            {/* Arrow */}
            <div className={getArrowClasses()} />
            
            {/* Content */}
            <Card className="shadow-lg border border-border/50 backdrop-blur-sm bg-white/95">
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1 rounded">
                      <Lightbulb className="h-3 w-3 text-primary" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {content.title}
                    </h4>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsVisible(false)}
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  {content.description}
                </p>

                {/* Tips */}
                {content.tips && content.tips.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {content.tips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs">
                        <div className="w-1 h-1 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                        <span className="text-muted-foreground leading-relaxed">{tip}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {(content.videoUrl || content.learnMoreUrl) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    {content.videoUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleVideoClick}
                        className="h-6 text-xs flex-1"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        {lang('tooltip.video')}
                      </Button>
                    )}
                    {content.learnMoreUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLearnMoreClick}
                        className="h-6 text-xs flex-1"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {lang('tooltip.learnMore')}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// Helper component for wrapping existing UI elements with contextual help
interface HelpWrapperProps {
  children: React.ReactNode;
  helpKey: string;
  title: string;
  description: string;
  tips?: string[];
  className?: string;
}

export function HelpWrapper({
  children,
  helpKey,
  title,
  description,
  tips = [],
  className = ''
}: HelpWrapperProps) {
  return (
    <ContextualTooltip
      content={{
        title,
        description,
        tips: tips.length > 0 ? tips : undefined
      }}
      trigger="hover"
      position="auto"
      className={className}
    >
      {children}
    </ContextualTooltip>
  );
}

// Pre-configured tooltips for common UI elements
export const HelpTooltips = {
  CompanySelector: (props: { children: React.ReactNode }) => (
    <HelpWrapper
      helpKey="company-selector"
      title="Company Context"
      description="Switch between companies to access different product portfolios and regulatory data."
      tips={[
        "The interface adapts based on your selected company",
        "Use the dropdown to quickly switch contexts",
        "Your role may differ between companies"
      ]}
      {...props}
    />
  ),

  AddProductButton: (props: { children: React.ReactNode }) => (
    <HelpWrapper
      helpKey="add-product"
      title="Add New Product"
      description="Create a new medical device product to track through the regulatory lifecycle."
      tips={[
        "Complete device information for accurate classification",
        "Choose the appropriate regulatory pathway",
        "Set up initial phase and milestones"
      ]}
      {...props}
    />
  ),

  PhaseBoard: (props: { children: React.ReactNode }) => (
    <HelpWrapper
      helpKey="phase-board"
      title="Phase Board View"
      description="Kanban-style view of products organized by their current lifecycle phase."
      tips={[
        "Drag products between phases to update their status",
        "Each phase has specific requirements and deliverables",
        "Use filters to focus on specific product types or statuses"
      ]}
      {...props}
    />
  ),

  DocumentUpload: (props: { children: React.ReactNode }) => (
    <HelpWrapper
      helpKey="document-upload"
      title="Document Upload"
      description="Upload regulatory documents and link them to products and phases."
      tips={[
        "Use templates when available for consistency",
        "Categorize documents properly for easy retrieval",
        "Version control is automatic for all uploads"
      ]}
      {...props}
    />
  ),

  GapAnalysis: (props: { children: React.ReactNode }) => (
    <HelpWrapper
      helpKey="gap-analysis"
      title="Gap Analysis"
      description="Automated assessment of regulatory compliance gaps for your products."
      tips={[
        "Select appropriate regulatory frameworks",
        "Review automated findings and recommendations", 
        "Create action plans to address identified gaps"
      ]}
      {...props}
    />
  )
};