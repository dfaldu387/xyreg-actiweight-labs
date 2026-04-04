import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  label: string;
  subtitle?: string;
  dateRange?: string;
}

interface StepperProps {
  steps: string[] | Step[];
  currentStep: number;
  className?: string;
  orientation?: 'horizontal' | 'vertical' | 'responsive';
}

export function Stepper({ steps, currentStep, className, orientation = 'responsive' }: StepperProps) {
  const normalizedSteps = steps.map(step =>
    typeof step === 'string' ? { label: step } : step
  );

  const isVertical = orientation === 'vertical';
  const isResponsive = orientation === 'responsive';

  return (
    <div
      className={cn(
        "w-full",
        isResponsive && "flex flex-col md:flex-row md:items-center md:justify-between",
        isVertical && "flex flex-col",
        !isVertical && !isResponsive && "flex items-center justify-between",
        className
      )}
    >
      {normalizedSteps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isUpcoming = stepNumber > currentStep;

        return (
          <React.Fragment key={step.label}>
            {/* Step Item */}
            <div
              className={cn(
                "flex",
                isResponsive && "flex-row md:flex-col items-center md:items-center gap-3 md:gap-0",
                isVertical && "flex-row items-start gap-3",
                !isVertical && !isResponsive && "flex-col items-center"
              )}
            >
              {/* Step Circle */}
              <div
                className={cn(
                  "flex items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors flex-shrink-0",
                  "w-8 h-8 md:w-8 md:h-8",
                  {
                    "bg-primary border-primary text-primary-foreground": isCompleted || isCurrent,
                    "bg-background border-muted-foreground text-muted-foreground": isUpcoming,
                  }
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  stepNumber
                )}
              </div>

              {/* Step Label - Different layout for mobile/desktop */}
              <div
                className={cn(
                  "flex flex-col",
                  isResponsive && "items-start md:items-center md:mt-2 md:text-center flex-1 md:flex-initial",
                  isVertical && "items-start flex-1 pb-4",
                  !isVertical && !isResponsive && "mt-2 text-center items-center gap-0.5"
                )}
              >
                <span
                  className={cn(
                    "text-xs md:max-w-24 leading-tight",
                    {
                      "text-primary font-medium": isCompleted || isCurrent,
                      "text-muted-foreground": isUpcoming,
                    }
                  )}
                >
                  {step.label}
                </span>
                {step.subtitle && (
                  <span className="text-[10px] text-muted-foreground/70">
                    {step.subtitle}
                  </span>
                )}
                {step.dateRange && (
                  <span className="text-[10px] font-medium text-primary/80 mt-0.5">
                    {step.dateRange}
                  </span>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {index < normalizedSteps.length - 1 && (
              <>
                {/* Horizontal connector (desktop) */}
                <div
                  className={cn(
                    "transition-colors",
                    isResponsive && "hidden md:block flex-1 h-0.5 mx-2",
                    !isResponsive && !isVertical && "flex-1 h-0.5 mx-2",
                    isVertical && "hidden",
                    {
                      "bg-primary": isCompleted,
                      "bg-muted": !isCompleted,
                    }
                  )}
                />
                {/* Vertical connector (mobile) */}
                <div
                  className={cn(
                    "transition-colors",
                    isResponsive && "md:hidden w-0.5 h-6 ml-[15px] my-1",
                    isVertical && "w-0.5 h-full ml-[15px] min-h-[24px]",
                    !isResponsive && !isVertical && "hidden",
                    {
                      "bg-primary": isCompleted,
                      "bg-muted": !isCompleted,
                    }
                  )}
                />
              </>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
