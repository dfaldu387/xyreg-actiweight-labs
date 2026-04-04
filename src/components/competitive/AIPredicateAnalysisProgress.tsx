import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, FileSearch, Database, Brain, CheckCircle, AlertCircle } from 'lucide-react';

interface AIPredicateAnalysisProgressProps {
  kNumber: string;
  isAnalyzing: boolean;
  onComplete?: (result: any) => void;
}

export function AIPredicateAnalysisProgress({ 
  kNumber, 
  isAnalyzing, 
  onComplete 
}: AIPredicateAnalysisProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<('pending' | 'active' | 'complete' | 'error')[]>([
    'pending', 'pending', 'pending', 'pending', 'pending'
  ]);

  const analysisSteps = [
    {
      title: 'FDA Database Search',
      description: `Searching FDA 510(k) database for ${kNumber}`,
      icon: Database,
      duration: 2000
    },
    {
      title: 'Document Analysis',
      description: 'Locating and parsing 510(k) summary document',
      icon: FileSearch,
      duration: 3000
    },
    {
      title: 'Predicate Extraction',
      description: 'Extracting predicate device information using AI',
      icon: Brain,
      duration: 4000
    },
    {
      title: 'Recursive Analysis',
      description: 'Following predicate chain to build complete trail',
      icon: Zap,
      duration: 5000
    },
    {
      title: 'Results Compilation',
      description: 'Compiling comprehensive predicate trail analysis',
      icon: CheckCircle,
      duration: 1000
    }
  ];

  useEffect(() => {
    if (!isAnalyzing) {
      // Reset when not analyzing
      setCurrentStep(0);
      setProgress(0);
      setStepStatuses(['pending', 'pending', 'pending', 'pending', 'pending']);
      return;
    }

    let stepIndex = 0;
    let progressValue = 0;

    const progressInterval = setInterval(() => {
      if (stepIndex < analysisSteps.length) {
        const step = analysisSteps[stepIndex];
        
        // Update step status to active
        setStepStatuses(prev => prev.map((status, index) => 
          index === stepIndex ? 'active' : 
          index < stepIndex ? 'complete' : 'pending'
        ));
        
        setCurrentStep(stepIndex);
        
        // Simulate progress within the step
        const stepProgress = (progressValue % 20) + 20 * stepIndex;
        setProgress(Math.min(stepProgress, 95)); // Don't reach 100% until actually complete
        
        progressValue += 2;
        
        // Move to next step after duration
        if (progressValue >= 20) {
          stepIndex++;
          progressValue = 0;
        }
      }
    }, analysisSteps[stepIndex]?.duration / 10 || 1000);

    return () => clearInterval(progressInterval);
  }, [isAnalyzing]);

  // Complete all steps when analysis finishes
  useEffect(() => {
    if (!isAnalyzing && currentStep > 0) {
      setStepStatuses(['complete', 'complete', 'complete', 'complete', 'complete']);
      setProgress(100);
    }
  }, [isAnalyzing, currentStep]);

  if (!isAnalyzing && currentStep === 0) {
    return null; // Don't show when not analyzing
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary animate-pulse" />
          AI Predicate Analysis
          <Badge variant="secondary" className="animate-pulse">
            {isAnalyzing ? 'Analyzing...' : 'Complete'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Simple progress indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Analysis Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current status */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isAnalyzing ? (
            <>
              <Zap className="h-4 w-4 animate-pulse text-primary" />
              <span>AI is analyzing predicate relationships...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Analysis complete</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}