import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Lightbulb, Play, TrendingUp, Users, Zap } from 'lucide-react';
import { FDAPredicateService } from '@/services/fdaPredicateService';
import { toast } from 'sonner';

interface PredicateTrailSuggestionsProps {
  devices: Array<{
    kNumber?: string;
    deviceName?: string;
    productCode?: string;
    deviceClass?: string;
    applicant?: string;
  }>;
  onTrailStarted: (kNumber: string) => void;
  onBatchProcessing: (kNumbers: string[]) => void;
}

export function PredicateTrailSuggestions({ devices, onTrailStarted, onBatchProcessing }: PredicateTrailSuggestionsProps) {
  const [loadingTrail, setLoadingTrail] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{
    kNumber: string;
    confidence: number;
    reasoning: string;
    deviceName: string;
    priority: 'high' | 'medium' | 'low';
  }>>([]);

  // Auto-generate suggestions based on device characteristics
  React.useEffect(() => {
    const generateSuggestions = () => {
      const deviceSuggestions = devices
        .filter(device => device.kNumber)
        .map(device => {
          let confidence = 0.5;
          let reasoning = 'Basic predicate trail analysis';
          let priority: 'high' | 'medium' | 'low' = 'medium';

          // Increase confidence for newer devices (likely to have more complex trails)
          if (device.kNumber && device.kNumber > 'K200000') {
            confidence += 0.2;
            reasoning += ' - Recent device likely has established predicate chain';
          }

          // Increase confidence for Class II devices (most use 510(k) pathway)
          if (device.deviceClass === '2') {
            confidence += 0.3;
            reasoning += ' - Class II device typically requires predicate analysis';
            priority = 'high';
          }

          // Increase confidence for certain product codes known to have rich predicate data
          const richPredicateCodes = ['LMH', 'GCX', 'LZI', 'KGI', 'NHA'];
          if (device.productCode && richPredicateCodes.includes(device.productCode)) {
            confidence += 0.2;
            reasoning += ` - ${device.productCode} product code has extensive predicate history`;
            priority = 'high';
          }

          // Consider market presence indicators
          if (device.applicant && device.applicant.length > 20) {
            confidence += 0.1;
            reasoning += ' - Established manufacturer likely has strategic predicate relationships';
          }

          return {
            kNumber: device.kNumber!,
            confidence: Math.min(confidence, 1.0),
            reasoning,
            deviceName: device.deviceName || 'Unknown Device',
            priority
          };
        })
        .filter(suggestion => suggestion.confidence > 0.6)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);

      setSuggestions(deviceSuggestions);
    };

    if (devices.length > 0) {
      generateSuggestions();
    }
  }, [devices]);

  const handleStartTrail = async (kNumber: string, deviceName: string) => {
    setLoadingTrail(kNumber);
    try {
      toast.success(`Starting predicate trail analysis for ${deviceName}`);
      onTrailStarted(kNumber);
    } catch (error) {
      toast.error('Failed to start predicate trail analysis');
      console.error('Error starting trail:', error);
    } finally {
      setLoadingTrail(null);
    }
  };

  const handleBatchProcess = () => {
    const highPriorityKNumbers = suggestions
      .filter(s => s.priority === 'high')
      .map(s => s.kNumber);
    
    if (highPriorityKNumbers.length === 0) {
      toast.error('No high-priority devices available for batch processing');
      return;
    }

    toast.success(`Starting batch predicate analysis for ${highPriorityKNumbers.length} devices`);
    onBatchProcessing(highPriorityKNumbers);
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          Smart Predicate Trail Suggestions
          <Badge variant="secondary" className="ml-auto">AI-Powered</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Automatically detected {suggestions.length} devices with valuable predicate trail potential
          </p>
          <Button 
            onClick={handleBatchProcess}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Batch Process ({suggestions.filter(s => s.priority === 'high').length})
          </Button>
        </div>

        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div 
              key={suggestion.kNumber}
              className="flex items-center justify-between p-3 bg-white/70 rounded-lg border"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={suggestion.priority === 'high' ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {suggestion.kNumber}
                  </Badge>
                  <Badge 
                    variant={
                      suggestion.priority === 'high' ? 'default' : 
                      suggestion.priority === 'medium' ? 'secondary' : 'outline'
                    }
                    className="text-xs"
                  >
                    {Math.round(suggestion.confidence * 100)}% confidence
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {suggestion.priority} priority
                  </Badge>
                </div>
                <p className="font-medium text-sm">{suggestion.deviceName}</p>
                <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleStartTrail(suggestion.kNumber, suggestion.deviceName)}
                  disabled={loadingTrail === suggestion.kNumber}
                  size="sm"
                  variant={suggestion.priority === 'high' ? 'default' : 'outline'}
                  className="flex items-center gap-1"
                >
                  {loadingTrail === suggestion.kNumber ? (
                    <div className="h-3 w-3 animate-spin border border-current border-t-transparent rounded-full" />
                  ) : (
                    <GitBranch className="h-3 w-3" />
                  )}
                  Build Trail
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Confidence based on device class, product code, and market factors
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Priority considers regulatory pathway likelihood
          </div>
        </div>
      </CardContent>
    </Card>
  );
}