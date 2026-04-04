import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Sparkles, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { AIGenerationProgress, CategoryProgress } from '@/hooks/useAIGenerationProgress';

interface AIGenerationProgressTrackerProps {
  progress: AIGenerationProgress;
  progressPercentage: number;
  elapsedTime: number;
  estimatedTimeRemaining: number;
}

const categoryLabels: Record<string, string> = {
  'Functional Performance & Efficacy': 'Performance & Efficacy',
  'Usability & Human Factors': 'Usability & Human Factors',
  'Safety & Risk Mitigation': 'Safety & Risk Mitigation',
  'Lifecycle Management': 'Lifecycle Management',
  'Information, Labeling & Training': 'Information & Training',
  'Environmental & Compatibility Factors': 'Environmental & Compatibility'
};

export function AIGenerationProgressTracker({
  progress,
  progressPercentage,
  elapsedTime: initialElapsedTime,
  estimatedTimeRemaining
}: AIGenerationProgressTrackerProps) {
  const [currentElapsedTime, setCurrentElapsedTime] = useState(initialElapsedTime);

  // Update elapsed time every second when generation is running
  useEffect(() => {
    if (!progress.isRunning || !progress.startTime) {
      setCurrentElapsedTime(initialElapsedTime);
      return;
    }

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - progress.startTime!.getTime()) / 1000);
      setCurrentElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [progress.isRunning, progress.startTime, initialElapsedTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProcessingRate = () => {
    if (currentElapsedTime === 0) return 0;
    return Math.round(progress.completedSuggestions / currentElapsedTime);
  };

  const isComplete = !progress.isRunning && progress.completedSuggestions > 0;
  const hasErrors = progress.errors.length > 0;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          Generating AI User Needs Suggestions
          {isComplete && <CheckCircle className="h-5 w-5 text-green-600" />}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Progress Display */}
        <div className="flex items-center gap-6">
          <CircularProgress 
            percentage={progressPercentage} 
            size={80} 
            strokeWidth={6}
            className="flex-shrink-0" 
          />
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                Overall Progress
              </div>
              <div className="text-sm text-muted-foreground">
                {progress.completedSuggestions} / {progress.totalSuggestions} suggestions
              </div>
            </div>
            
            <Progress value={progressPercentage} className="h-2" />
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Elapsed: {formatTime(currentElapsedTime)}
              </div>
              {estimatedTimeRemaining > 0 && (
                <div>
                  ETA: {formatTime(estimatedTimeRemaining)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current Batch Info */}
        {progress.isRunning && (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <div className="text-sm font-medium">
                Processing Batch {progress.currentBatch} of {progress.totalBatches}
              </div>
              <div className="text-sm text-muted-foreground">
                Category: {categoryLabels[progress.currentCategory] || progress.currentCategory}
              </div>
            </div>
            
            <Badge variant="secondary" className="animate-pulse">
              Processing...
            </Badge>
          </div>
        )}

        {/* Category Progress */}
        {progress.categoryProgress.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium">Category Progress</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {progress.categoryProgress.map((category, index) => (
                <div 
                  key={category.name}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    category.isComplete 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : progress.currentCategory === category.name
                      ? 'bg-primary/10 border-primary/30 animate-pulse'
                      : 'bg-muted/30 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium truncate pr-2">
                      {categoryLabels[category.name] || category.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">
                        {category.completedSuggestions}
                      </div>
                      {category.isComplete && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {progress.currentCategory === category.name && progress.isRunning && (
                        <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {progress.totalBatches}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Batches
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {getProcessingRate()}
            </div>
            <div className="text-sm text-muted-foreground">
              Suggestions/sec
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(progress.completedSuggestions / Math.max(progress.currentBatch, 1))}
            </div>
            <div className="text-sm text-muted-foreground">
              Avg per Batch
            </div>
          </div>
        </div>

        {/* Error Display */}
        {hasErrors && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertCircle className="h-4 w-4" />
              Issues Encountered
            </div>
            <div className="space-y-1">
              {progress.errors.map((error, index) => (
                <div 
                  key={index}
                  className="text-sm text-muted-foreground bg-destructive/10 p-2 rounded"
                >
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completion Message */}
        {isComplete && (
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300 font-medium">
              <CheckCircle className="h-5 w-5" />
              Generation Complete!
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 mt-1">
              Successfully generated {progress.completedSuggestions} user needs in {formatTime(currentElapsedTime)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}