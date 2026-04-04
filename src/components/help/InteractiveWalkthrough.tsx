import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, X, Target, CheckCircle, Lightbulb, MousePointer, Hand } from "lucide-react";
import { useTranslation } from '@/hooks/useTranslation';

interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for the target element
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'focus' | 'none';
  highlight?: boolean;
  required?: boolean;
  completionCheck?: () => boolean;
}

interface InteractiveWalkthroughProps {
  steps: WalkthroughStep[];
  title: string;
  description?: string;
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onStepComplete?: (stepId: string) => void;
  autoAdvance?: boolean;
  className?: string;
}

export function InteractiveWalkthrough({
  steps,
  title,
  description,
  isActive,
  onComplete,
  onSkip,
  onStepComplete,
  autoAdvance = true,
  className = ''
}: InteractiveWalkthroughProps) {
  const { lang } = useTranslation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Cleanup function to remove highlights and event listeners
  const cleanup = () => {
    if (highlightedElement) {
      highlightedElement.style.removeProperty('position');
      highlightedElement.style.removeProperty('z-index');
      highlightedElement.style.removeProperty('box-shadow');
      highlightedElement.style.removeProperty('outline');
      setHighlightedElement(null);
    }
    setIsWaiting(false);
  };

  // Highlight target element
  const highlightElement = (selector: string) => {
    cleanup();
    
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      console.warn(`Element not found: ${selector}`);
      return null;
    }

    if (currentStep.highlight !== false) {
      // Add highlight styling
      element.style.position = 'relative';
      element.style.zIndex = '9999';
      element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2)';
      element.style.outline = '2px solid #3b82f6';
      element.style.outlineOffset = '2px';
    }

    setHighlightedElement(element);
    return element;
  };

  // Position walkthrough card near target element
  const positionCard = (targetElement: HTMLElement, position: string) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const targetRect = targetElement.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let left = 0;
    let top = 0;

    switch (position) {
      case 'top':
        left = targetRect.left + (targetRect.width - cardRect.width) / 2;
        top = targetRect.top - cardRect.height - 16;
        break;
      case 'bottom':
        left = targetRect.left + (targetRect.width - cardRect.width) / 2;
        top = targetRect.bottom + 16;
        break;
      case 'left':
        left = targetRect.left - cardRect.width - 16;
        top = targetRect.top + (targetRect.height - cardRect.height) / 2;
        break;
      case 'right':
        left = targetRect.right + 16;
        top = targetRect.top + (targetRect.height - cardRect.height) / 2;
        break;
      case 'center':
      default:
        left = (viewport.width - cardRect.width) / 2;
        top = (viewport.height - cardRect.height) / 2;
        break;
    }

    // Ensure card stays within viewport
    left = Math.max(16, Math.min(left, viewport.width - cardRect.width - 16));
    top = Math.max(16, Math.min(top, viewport.height - cardRect.height - 16));

    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  };

  // Check if step is completed
  const checkStepCompletion = () => {
    if (!currentStep.completionCheck) return false;
    return currentStep.completionCheck();
  };

  // Handle target element interaction
  const setupInteraction = (element: HTMLElement) => {
    if (!currentStep.action || currentStep.action === 'none') return;

    const handleInteraction = (event: Event) => {
      if (currentStep.required && !checkStepCompletion()) {
        // Prevent default action if step isn't completed properly
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // Mark step as completed
      const newCompleted = new Set(completedSteps);
      newCompleted.add(currentStep.id);
      setCompletedSteps(newCompleted);
      onStepComplete?.(currentStep.id);

      if (autoAdvance) {
        setTimeout(() => {
          handleNext();
        }, 500);
      }
    };

    // Add event listener based on action type
    switch (currentStep.action) {
      case 'click':
        element.addEventListener('click', handleInteraction, { once: true });
        break;
      case 'hover':
        element.addEventListener('mouseenter', handleInteraction, { once: true });
        break;
      case 'focus':
        element.addEventListener('focus', handleInteraction, { once: true });
        break;
    }
  };

  // Initialize step
  useEffect(() => {
    if (!isActive || !currentStep) return;

    const element = highlightElement(currentStep.target);
    if (element) {
      setTimeout(() => {
        positionCard(element, currentStep.position);
        setupInteraction(element);
      }, 100);
    }

    return cleanup;
  }, [currentStepIndex, isActive, currentStep]);

  // Handle window resize
  useEffect(() => {
    if (!isActive || !highlightedElement) return;

    const handleResize = () => {
      positionCard(highlightedElement, currentStep.position);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isActive, highlightedElement, currentStep]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleComplete = () => {
    cleanup();
    onComplete();
  };

  const handleSkip = () => {
    cleanup();
    onSkip();
  };

  const getActionIcon = () => {
    switch (currentStep?.action) {
      case 'click':
        return <MousePointer className="h-4 w-4" />;
      case 'hover':
        return <Hand className="h-4 w-4" />;
      case 'focus':
        return <Target className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getActionText = () => {
    switch (currentStep?.action) {
      case 'click':
        return lang('walkthrough.action.click');
      case 'hover':
        return lang('walkthrough.action.hover');
      case 'focus':
        return lang('walkthrough.action.focus');
      default:
        return lang('walkthrough.action.review');
    }
  };

  if (!isActive || !currentStep) return null;

  return (
    <>
      {/* Dark overlay */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
      />

      {/* Walkthrough card */}
      <Card 
        ref={cardRef}
        className="fixed z-50 max-w-sm shadow-2xl border-2 border-primary/20 bg-white"
        style={{ position: 'fixed' }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <div className="bg-primary p-1 rounded">
                  <Target className="h-4 w-4 text-white" />
                </div>
                {title}
              </CardTitle>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="space-y-2 mt-3">
            <div className="flex justify-between text-xs">
              <span>{lang('walkthrough.stepOf', { current: currentStepIndex + 1, total: steps.length })}</span>
              <span>{lang('walkthrough.percentComplete', { percent: Math.round(progress) })}</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Step content */}
          <div>
            <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
              {getActionIcon()}
              {currentStep.title}
            </h4>
            <p className="text-sm text-muted-foreground">
              {currentStep.description}
            </p>
          </div>

          {/* Action instruction */}
          {currentStep.action && currentStep.action !== 'none' && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs font-medium text-primary flex items-center gap-2">
                {getActionIcon()}
                {getActionText()}
              </p>
            </div>
          )}

          {/* Step completion status */}
          {completedSteps.has(currentStep.id) && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{lang('walkthrough.stepCompleted')}</span>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center pt-2">
            <div>
              {currentStepIndex > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  {lang('walkthrough.previous')}
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                {lang('walkthrough.skipTour')}
              </Button>

              {!currentStep.required || !currentStep.action || completedSteps.has(currentStep.id) ? (
                <Button size="sm" onClick={handleNext}>
                  {currentStepIndex === steps.length - 1 ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {lang('walkthrough.finish')}
                    </>
                  ) : (
                    <>
                      {lang('walkthrough.next')}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              ) : (
                <Button size="sm" disabled>
                  {lang('walkthrough.completeFirst')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// Predefined walkthroughs for common workflows
export const PredefinedWalkthroughs = {
  ProductCreation: {
    title: 'Create Your First Product',
    description: 'Learn how to set up a new medical device product',
    steps: [
      {
        id: 'navigate-dashboard',
        title: 'Navigate to Company Dashboard',
        description: 'First, go to your company dashboard where you can manage all products.',
        target: '[data-tour="company-dashboard"]',
        position: 'bottom' as const,
        action: 'click' as const,
        highlight: true
      },
      {
        id: 'add-product-button',
        title: 'Click Add Product',
        description: 'Click the "Add Product" button to start creating a new medical device.',
        target: '[data-tour="add-product-button"]',
        position: 'bottom' as const,
        action: 'click' as const,
        required: true
      },
      {
        id: 'fill-basic-info',
        title: 'Enter Product Information',
        description: 'Fill in the basic product information including name, description, and intended use.',
        target: '[data-tour="product-form"]',
        position: 'right' as const,
        action: 'none' as const
      },
      {
        id: 'classify-device',
        title: 'Classify Your Device',
        description: 'Use our classification wizard to determine the regulatory pathway for your device.',
        target: '[data-tour="classification-wizard"]',
        position: 'left' as const,
        action: 'click' as const
      }
    ]
  },

  DocumentUpload: {
    title: 'Upload Your First Document',
    description: 'Learn the document management workflow',
    steps: [
      {
        id: 'open-documents',
        title: 'Open Document Section',
        description: 'Navigate to the documents section for your product.',
        target: '[data-tour="documents-tab"]',
        position: 'bottom' as const,
        action: 'click' as const
      },
      {
        id: 'upload-button',
        title: 'Start Document Upload',
        description: 'Click the upload button to begin adding documents.',
        target: '[data-tour="document-upload"]',
        position: 'top' as const,
        action: 'click' as const,
        required: true
      },
      {
        id: 'select-template',
        title: 'Choose Template',
        description: 'Select an appropriate document template for consistency.',
        target: '[data-tour="template-selector"]',
        position: 'right' as const,
        action: 'click' as const
      }
    ]
  },

  GapAnalysisFlow: {
    title: 'Run Gap Analysis',
    description: 'Assess your product\'s regulatory compliance',
    steps: [
      {
        id: 'access-gap-analysis',
        title: 'Open Gap Analysis',
        description: 'Navigate to the gap analysis section.',
        target: '[data-tour="gap-analysis-link"]',
        position: 'bottom' as const,
        action: 'click' as const
      },
      {
        id: 'select-framework',
        title: 'Choose Regulatory Framework',
        description: 'Select the appropriate regulatory framework for assessment.',
        target: '[data-tour="framework-selector"]',
        position: 'top' as const,
        action: 'click' as const,
        required: true
      },
      {
        id: 'run-assessment',
        title: 'Start Assessment',
        description: 'Begin the automated compliance assessment.',
        target: '[data-tour="run-assessment"]',
        position: 'bottom' as const,
        action: 'click' as const,
        required: true
      }
    ]
  }
};