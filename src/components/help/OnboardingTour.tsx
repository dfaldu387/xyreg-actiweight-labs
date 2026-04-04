
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, X, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from '@/hooks/useTranslation';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  userRoles: string[];
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to XYREG!',
    content: 'Let\'s take a quick tour to help you get started with the Medical Device Regulatory Management Platform.',
    position: 'center',
    userRoles: ['admin', 'company_admin', 'consultant', 'editor', 'viewer']
  },
  {
    id: 'sidebar',
    title: 'Navigation Sidebar',
    content: 'Use the sidebar to navigate between companies, products, and features. It adapts based on your current context.',
    target: '[data-tour="sidebar"]',
    position: 'right',
    userRoles: ['admin', 'company_admin', 'consultant', 'editor', 'viewer']
  },
  {
    id: 'company-selector',
    title: 'Company Context',
    content: 'Switch between different companies you have access to. The interface will update to show company-specific information.',
    target: '[data-tour="company-selector"]',
    position: 'bottom',
    userRoles: ['admin', 'consultant']
  },
  {
    id: 'help-button',
    title: 'Help & Support',
    content: 'Need help? Click this button anytime to access documentation, tutorials, and support resources.',
    target: '[data-tour="help-button"]',
    position: 'left',
    userRoles: ['admin', 'company_admin', 'consultant', 'editor', 'viewer']
  }
];

interface OnboardingTourProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ isActive, onComplete, onSkip }: OnboardingTourProps) {
  const { lang } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const { userRole } = useAuth();

  // Filter steps based on user role
  const availableSteps = tourSteps.filter(step => 
    step.userRoles.includes(userRole || 'viewer')
  );

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      setCurrentStep(0);
    } else {
      setIsVisible(false);
    }
  }, [isActive]);

  const currentStepData = availableSteps[currentStep];

  const handleNext = () => {
    if (currentStep < availableSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isVisible || !currentStepData) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-50" />
      
      {/* Tour Card */}
      <div className="fixed z-[60] max-w-sm">
        <Card className="shadow-xl border-2 border-primary">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                <CardDescription className="mt-1">
                  {lang('onboardingTour.stepOf', { current: currentStep + 1, total: availableSteps.length })}
                </CardDescription>
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
          </CardHeader>
          
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              {currentStepData.content}
            </p>
            
            {/* Progress Indicators */}
            <div className="flex gap-1 mb-4">
              {availableSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded ${
                    index <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <div>
                {currentStep > 0 && (
                  <Button variant="outline" size="sm" onClick={handlePrevious}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    {lang('onboardingTour.previous')}
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  {lang('onboardingTour.skipTour')}
                </Button>
                <Button size="sm" onClick={handleNext}>
                  {currentStep === availableSteps.length - 1 ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {lang('onboardingTour.finish')}
                    </>
                  ) : (
                    <>
                      {lang('onboardingTour.next')}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
