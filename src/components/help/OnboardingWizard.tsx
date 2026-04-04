import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Circle, ArrowRight, ArrowLeft, X, Play, BookOpen, Users, FileText, Zap, Trophy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from '@/hooks/useTranslation';

interface OnboardingStage {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  requiredRoles: string[];
  steps: OnboardingStep[];
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  skipped: boolean;
}

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  stages: OnboardingStage[];
  currentStage: string | null;
  completionPercentage: number;
  onCompleteStep: (stageId: string, stepId: string) => void;
  onSkipStep: (stageId: string, stepId: string) => void;
  onCompleteStage: (stageId: string) => void;
  onCompleteOnboarding: () => void;
}

export function OnboardingWizard({
  isOpen,
  onClose,
  stages,
  currentStage,
  completionPercentage,
  onCompleteStep,
  onSkipStep,
  onCompleteStage,
  onCompleteOnboarding
}: OnboardingWizardProps) {
  const { lang } = useTranslation();
  const [selectedStageId, setSelectedStageId] = useState<string | null>(currentStage);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { userRole } = useAuth();

  const selectedStage = stages.find(stage => stage.id === selectedStageId);
  const currentStep = selectedStage?.steps[currentStepIndex];

  useEffect(() => {
    if (currentStage && !selectedStageId) {
      setSelectedStageId(currentStage);
    }
  }, [currentStage, selectedStageId]);

  // Get stage icon based on stage type
  const getStageIcon = (stageId: string) => {
    switch (stageId) {
      case 'welcome':
        return <Play className="h-5 w-5" />;
      case 'company-setup':
        return <Users className="h-5 w-5" />;
      case 'product-management':
        return <FileText className="h-5 w-5" />;
      case 'document-management':
        return <BookOpen className="h-5 w-5" />;
      case 'advanced-features':
        return <Zap className="h-5 w-5" />;
      default:
        return <Circle className="h-5 w-5" />;
    }
  };

  const handleStageSelect = (stageId: string) => {
    setSelectedStageId(stageId);
    setCurrentStepIndex(0);
  };

  const handleStepComplete = () => {
    if (!selectedStage || !currentStep) return;
    
    onCompleteStep(selectedStage.id, currentStep.id);
    
    // Move to next step or stage
    if (currentStepIndex < selectedStage.steps.length - 1) {
      // Move to next step in current stage
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // This is the last step of the current stage
      onCompleteStage(selectedStage.id);
      
      const currentStageIndex = stages.findIndex(s => s.id === selectedStage.id);
      const nextStage = stages[currentStageIndex + 1];
      
      if (nextStage) {
        // Move to next stage
        setSelectedStageId(nextStage.id);
        setCurrentStepIndex(0);
      } else {
        // This is the last stage - complete onboarding
        onCompleteOnboarding();
      }
    }
  };

  const handleStepSkip = () => {
    if (!selectedStage || !currentStep) return;
    
    onSkipStep(selectedStage.id, currentStep.id);
    
    // Move to next step
    if (currentStepIndex < selectedStage.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleFinishOnboarding = () => {
    onCompleteOnboarding();
    onClose();
  };

  if (!isOpen) return null;

  const isOnboardingComplete = completionPercentage >= 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar - Stage Overview */}
          <div className="w-1/3 border-r border-border bg-gradient-to-b from-primary/5 to-primary/10 flex flex-col">
            <DialogHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {lang('onboardingWizard.welcomeTitle')}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lang('onboardingWizard.welcomeSubtitle')}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="px-6 pb-4">
              {/* Overall Progress */}
              <div className="bg-white/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{lang('onboardingWizard.overallProgress')}</span>
                  <span className="text-sm font-bold">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>

              {/* Stage List */}
              <div className="space-y-2 max-h-[calc(90vh-280px)] overflow-y-auto">
                {stages.map((stage, index) => {
                  const completedSteps = stage.steps.filter(step => step.completed).length;
                  const totalSteps = stage.steps.length;
                  const stageProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
                  
                  return (
                    <Card
                      key={stage.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedStageId === stage.id
                          ? 'bg-primary/10 border-primary/30 shadow-sm'
                          : 'hover:bg-white/50'
                      }`}
                      onClick={() => handleStageSelect(stage.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            stage.completed
                              ? 'bg-green-500 text-white'
                              : selectedStageId === stage.id
                              ? 'bg-primary text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {stage.completed ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              getStageIcon(stage.id)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium line-clamp-1">
                              {stage.name}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {stage.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-slate-200 rounded-full h-1">
                                <div 
                                  className="bg-primary h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${stageProgress}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {completedSteps}/{totalSteps}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content - Step Details */}
          <div className="flex-1 flex flex-col">
            {isOnboardingComplete ? (
              // Completion Screen
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-full text-white shadow-lg inline-block mb-6">
                    <Trophy className="h-12 w-12" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">
                    {lang('onboardingWizard.congratulations')}
                  </h2>
                  <p className="text-slate-600 text-lg mb-6">
                    {lang('onboardingWizard.completionMessage')}
                  </p>
                  <div className="space-y-3">
                    <Button onClick={handleFinishOnboarding} className="w-full" size="lg">
                      {lang('onboardingWizard.startUsing')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button variant="outline" onClick={onClose} className="w-full">
                      {lang('onboardingWizard.continueExploring')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : selectedStage && currentStep ? (
              // Step Content
              <div className="flex-1 flex flex-col">
                {/* Step Header */}
                <div className="border-b border-border p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Badge variant="outline" className="text-xs">
                      {selectedStage.name}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {lang('onboardingWizard.stepOf', { current: currentStepIndex + 1, total: selectedStage.steps.length })}
                    </Badge>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    {currentStep.title}
                  </h1>
                  <p className="text-slate-600">
                    {currentStep.description}
                  </p>
                </div>

                {/* Step Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="max-w-2xl">
                    {/* Dynamic step content based on step ID */}
                    {getStepContent(selectedStage.id, currentStep.id)}
                  </div>
                </div>

                {/* Step Navigation */}
                <div className="border-t border-border p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      {currentStepIndex > 0 && (
                        <Button variant="outline" onClick={handlePreviousStep}>
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          {lang('onboardingWizard.previous')}
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button variant="ghost" onClick={handleStepSkip}>
                        {lang('onboardingWizard.skipStep')}
                      </Button>
                      <Button onClick={handleStepComplete}>
                        {(() => {
                          const isLastStep = currentStepIndex === selectedStage.steps.length - 1;

                          if (isLastStep) {
                            return lang('onboardingWizard.completeStage');
                          } else {
                            return lang('onboardingWizard.nextStep');
                          }
                        })()}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // No stage selected
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    {lang('onboardingWizard.selectStage')}
                  </h2>
                  <p className="text-slate-600">
                    {lang('onboardingWizard.selectStageDescription')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to render step-specific content
function getStepContent(stageId: string, stepId: string): React.ReactNode {
  const contentMap: Record<string, Record<string, React.ReactNode>> = {
    welcome: {
      'profile-setup': (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Complete Your Professional Profile</h3>
          <p className="text-slate-600">
            Setting up your profile helps XYREG personalize your experience and connect you with relevant regulatory information.
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              Add your professional background and expertise areas
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              Set your regulatory framework preferences (EU MDR, FDA, etc.)
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              Configure notification preferences
            </li>
          </ul>
        </div>
      ),
      'navigation-basics': (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Master Platform Navigation</h3>
          <p className="text-slate-600">
            Learn how to efficiently navigate the XYREG platform and access the features you need.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Sidebar Navigation</h4>
                <p className="text-sm text-slate-600">
                  Use the collapsible sidebar to access different platform areas and switch between companies.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Company Context</h4>
                <p className="text-sm text-slate-600">
                  The interface adapts based on your current company context and role permissions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
      'help-system': (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Get Help When You Need It</h3>
          <p className="text-slate-600">
            Discover the comprehensive help system designed to support you throughout your regulatory journey.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="bg-blue-500 p-1 rounded">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-blue-900">Help Center</p>
                <p className="text-sm text-blue-700">Comprehensive documentation and tutorials</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="bg-green-500 p-1 rounded">
                <Play className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-green-900">Contextual Help</p>
                <p className="text-sm text-green-700">Page-specific tips and guidance</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
    // Add more stage content as needed
  };

  return contentMap[stageId]?.[stepId] || (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Coming Soon</h3>
      <p className="text-slate-600">
        Interactive content for this step is being prepared. For now, you can complete this step to continue your onboarding journey.
      </p>
    </div>
  );
}