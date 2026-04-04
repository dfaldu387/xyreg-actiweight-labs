import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  FileText, 
  GitBranch,
  Zap,
  Brain,
  Target
} from 'lucide-react';
import { useAutomaticPredicateAnalysis } from '@/hooks/useAutomaticPredicateAnalysis';
import { PredicateDevice } from '@/types/fdaPredicateTrail';

interface AutomaticPredicateAnalysisProps {
  devices: PredicateDevice[];
  isVisible: boolean;
  onTrailSelected: (kNumber: string) => void;
}

export function AutomaticPredicateAnalysis({ 
  devices, 
  isVisible, 
  onTrailSelected 
}: AutomaticPredicateAnalysisProps) {
  const {
    results,
    isProcessing,
    processedCount,
    totalCount,
    startBatchAnalysis,
    clearResults,
    getSuccessfulResults,
    getProgress,
    getElapsedTime
  } = useAutomaticPredicateAnalysis();

  React.useEffect(() => {
    // Auto-start analysis when devices are available and visible
    if (isVisible && devices.length > 0 && results.size === 0 && !isProcessing) {
      startBatchAnalysis(devices, 5);
    }
  }, [isVisible, devices, results.size, isProcessing, startBatchAnalysis]);

  const successfulResults = getSuccessfulResults();
  const progress = getProgress();
  const elapsedSeconds = Math.floor(getElapsedTime() / 1000);

  if (!isVisible && results.size === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 border-violet-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-violet-600" />
          AI Predicate Trail Discovery
          <Badge variant="secondary" className="ml-auto flex items-center gap-1">
            <Brain className="h-3 w-3" />
            Automated
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Processing Status */}
        {isProcessing && (
          <div className="space-y-3 p-3 bg-white/70 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin border-2 border-violet-600 border-t-transparent rounded-full" />
                <span className="font-medium">Analyzing predicate trails...</span>
              </div>
              <Badge variant="outline">
                {processedCount}/{totalCount}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {elapsedSeconds}s elapsed
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Processing documents & building trails
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {successfulResults.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white/70 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Trails Discovered</span>
              </div>
              <div className="text-2xl font-bold text-green-700">
                {successfulResults.filter(r => r.trail && r.trail.trailDepth > 0).length}
              </div>
              <div className="text-xs text-muted-foreground">
                Active predicate chains found
              </div>
            </div>
            <div className="p-3 bg-white/70 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <GitBranch className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Avg. Confidence</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {Math.round(
                  successfulResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / 
                  successfulResults.length
                )}%
              </div>
              <div className="text-xs text-muted-foreground">
                Document analysis quality
              </div>
            </div>
          </div>
        )}

        {/* Key Insights */}
        {successfulResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-violet-600" />
              <span className="font-medium">Smart Insights</span>
            </div>
            {successfulResults
              .filter(r => r.insights && r.insights.length > 0)
              .slice(0, 2)
              .map((result, index) => (
              <div key={index} className="p-3 bg-white/80 rounded-lg border-l-4 border-violet-500">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{result.kNumber} - {result.deviceName}</span>
                  <Badge 
                    variant={result.confidence >= 70 ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {result.confidence}% confidence
                  </Badge>
                </div>
                <div className="text-sm space-y-1">
                  {result.insights.slice(0, 3).map((insight, idx) => (
                    <p key={idx} className="text-muted-foreground">{insight}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Discovered Trails */}
        {successfulResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Discovered Predicate Trails</span>
              <Button 
                onClick={clearResults}
                variant="ghost" 
                size="sm"
                className="text-xs"
              >
                Clear Results
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {successfulResults
                .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
                .slice(0, 8)
                .map((result) => (
                <div 
                  key={result.kNumber}
                  className="flex items-center justify-between p-2 bg-white/60 rounded border hover:bg-white/80 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {result.kNumber}
                      </Badge>
                      <Badge 
                        variant={result.confidence > 70 ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {result.confidence}%
                      </Badge>
                      {result.trail && result.trail.trailDepth > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {result.trail.trailDepth} refs
                        </Badge>
                      )}
                      {result.enhancedAnalysis?.source && (
                        <Badge variant="secondary" className="text-xs">
                          {result.enhancedAnalysis.source === 'pdf' ? '📄' : 
                           result.enhancedAnalysis.source === 'api' ? '🔗' : '🔍'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm truncate">{result.deviceName}</p>
                    {result.enhancedAnalysis?.predicateKNumbers?.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Predicates: {result.enhancedAnalysis.predicateKNumbers.slice(0, 2).join(', ')}
                        {result.enhancedAnalysis.predicateKNumbers.length > 2 && ` +${result.enhancedAnalysis.predicateKNumbers.length - 2} more`}
                      </p>
                    )}
                    {result.insights.length > 0 && (
                      <p className="text-xs text-violet-600 mt-1">
                        {result.insights[0]}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => onTrailSelected(result.kNumber)}
                    size="sm"
                    variant={result.trail && result.trail.trailDepth > 0 ? 'default' : 'outline'}
                    className="ml-2"
                  >
                    {result.trail && result.trail.trailDepth > 0 ? 'View Trail' : 'Explore'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Actions */}
        {!isProcessing && results.size === 0 && devices.length > 0 && (
          <div className="text-center p-4 border-2 border-dashed border-violet-200 rounded-lg">
            <Zap className="h-8 w-8 mx-auto mb-2 text-violet-400" />
            <p className="text-sm text-muted-foreground mb-3">
              Ready to analyze {devices.length} devices for predicate trails
            </p>
            <Button 
              onClick={() => startBatchAnalysis(devices, 5)}
              className="flex items-center gap-2"
            >
              <Bot className="h-4 w-4" />
              Start AI Analysis
            </Button>
          </div>
        )}

        {/* Error States */}
        {!isProcessing && results.size > 0 && successfulResults.length === 0 && (
          <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
            <p className="text-sm text-red-700">
              Analysis completed but no meaningful predicate trails were discovered
            </p>
            <Button 
              onClick={() => startBatchAnalysis(devices, 10)}
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Try with more devices
            </Button>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            AI-powered document analysis
          </div>
          <div className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            Smart pattern recognition
          </div>
        </div>
      </CardContent>
    </Card>
  );
}