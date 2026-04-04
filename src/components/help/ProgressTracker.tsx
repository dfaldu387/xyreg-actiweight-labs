import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Trophy, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  skipped: boolean;
}

interface OnboardingStage {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  requiredRoles: string[];
  steps: OnboardingStep[];
}

interface ProgressTrackerProps {
  stages: OnboardingStage[];
  completionPercentage: number;
  currentStage: string | null;
  className?: string;
  onClose?: () => void;
}

export function ProgressTracker({
  stages,
  completionPercentage,
  currentStage,
  className,
  onClose
}: ProgressTrackerProps) {
  const { lang } = useTranslation();
  const totalSteps = stages.reduce((total, stage) => total + stage.steps.length, 0);
  const completedSteps = stages.reduce((total, stage) => 
    total + stage.steps.filter(step => step.completed).length, 0
  );
  const completedStages = stages.filter(stage => stage.completed).length;

  return (
    <Card className={cn("z-[1000]", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between relative">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {lang('progressTracker.title')}
            </CardTitle>
            <CardDescription>
              {lang('progressTracker.description')}
            </CardDescription>
          </div>
         {completionPercentage >= 100 && (
              <div className="text-green-600">
                <Trophy className="h-6 w-6" />
              </div>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-slate-100 absolute right-0 top-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{lang('progressTracker.overallCompletion')}</span>
            <span className="text-sm font-bold">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{lang('progressTracker.stepsCompleted', { completed: completedSteps, total: totalSteps })}</span>
            <span>{lang('progressTracker.stagesDone', { completed: completedStages, total: stages.length })}</span>
          </div>
        </div>

        {/* Stage Progress */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {lang('progressTracker.stageProgress')}
          </h4>
          
          {stages.map((stage) => {
            const stageCompletedSteps = stage.steps.filter(step => step.completed).length;
            const stageTotalSteps = stage.steps.length;
            const stageProgress = stageTotalSteps > 0 ? (stageCompletedSteps / stageTotalSteps) * 100 : 0;
            const isCurrentStage = stage.id === currentStage;
            
            return (
              <div 
                key={stage.id}
                className={`p-3 rounded-lg border ${
                  isCurrentStage 
                    ? 'bg-primary/5 border-primary/20' 
                    : 'bg-slate-50/50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {stage.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : isCurrentStage ? (
                      <Clock className="h-4 w-4 text-primary" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                    )}
                    <span className="text-sm font-medium">{stage.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCurrentStage && (
                      <Badge variant="secondary" className="text-xs">
                        {lang('progressTracker.current')}
                      </Badge>
                    )}
                    {stage.completed && (
                      <Badge variant="default" className="text-xs bg-green-600">
                        {lang('progressTracker.complete')}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{stage.description}</span>
                    <span className="font-medium">
                      {lang('progressTracker.stepsCount', { completed: stageCompletedSteps, total: stageTotalSteps })}
                    </span>
                  </div>
                  <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        stage.completed 
                          ? 'bg-green-600' 
                          : isCurrentStage 
                          ? 'bg-primary' 
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${stageProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Next Steps */}
        {completionPercentage < 100 && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              {lang('progressTracker.whatsNext')}
            </h4>
            <p className="text-xs text-blue-700">
              {completionPercentage === 0
                ? lang('progressTracker.startJourney')
                : lang('progressTracker.continueWith', { stage: stages.find(s => !s.completed)?.name || lang('progressTracker.remainingStages') })
              }
            </p>
          </div>
        )}

        {/* Completion Message */}
        {completionPercentage >= 100 && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-green-600" />
              <h4 className="text-sm font-medium text-green-900">
                {lang('progressTracker.onboardingComplete')}
              </h4>
            </div>
            <p className="text-xs text-green-700">
              {lang('progressTracker.congratulations')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}