import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Target, TrendingUp, GitBranch, Lightbulb, ExternalLink } from 'lucide-react';
import { FDAPredicateService } from '@/services/fdaPredicateService';
import { toast } from 'sonner';

interface SmartRecommendation {
  kNumber: string;
  confidence: number;
  reasoning: string;
  deviceName: string;
  strategicValue: 'high' | 'medium' | 'low';
  recommendationType: 'direct_competitor' | 'technology_similar' | 'regulatory_pathway' | 'market_leader';
  additionalInfo: {
    applicant?: string;
    decisionDate?: string;
    productCode?: string;
    deviceClass?: string;
  };
}

interface SmartPredicateRecommendationsProps {
  deviceName?: string;
  deviceClass?: string;
  productCode?: string;
  emdnCode?: string;
  companyId?: string;
  onPredicateSelected: (kNumber: string) => void;
}

export function SmartPredicateRecommendations({ 
  deviceName, 
  deviceClass, 
  productCode, 
  emdnCode,
  companyId,
  onPredicateSelected 
}: SmartPredicateRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<'conservative' | 'aggressive' | 'balanced'>('balanced');

  useEffect(() => {
    generateRecommendations();
  }, [deviceName, deviceClass, productCode, selectedStrategy]);

  const generateRecommendations = async () => {
    if (!deviceName && !productCode) return;

    setIsLoading(true);
    try {
      // Get base recommendations from FDA service
      const baseRecommendations = await FDAPredicateService.getPredicateRecommendations(
        deviceName || '',
        deviceClass,
        productCode
      );

      // If no recommendations returned, show realistic fallback
      if (!baseRecommendations || baseRecommendations.length === 0) {
        setRecommendations([]);
        return;
      }

      // Enhance recommendations with strategic analysis
      const enhancedRecommendations: SmartRecommendation[] = baseRecommendations.map((rec, index) => {
        // Determine recommendation type based on reasoning
        let recommendationType: SmartRecommendation['recommendationType'] = 'regulatory_pathway';
        if (rec.reasoning.toLowerCase().includes('competitor')) {
          recommendationType = 'direct_competitor';
        } else if (rec.reasoning.toLowerCase().includes('similar') || rec.reasoning.toLowerCase().includes('technology')) {
          recommendationType = 'technology_similar';
        } else if (rec.reasoning.toLowerCase().includes('market') || rec.reasoning.toLowerCase().includes('leader')) {
          recommendationType = 'market_leader';
        }

        // Adjust confidence based on selected strategy
        let adjustedConfidence = rec.confidence;
        if (selectedStrategy === 'conservative') {
          // Prefer established, well-documented predicates
          adjustedConfidence *= rec.confidence > 0.8 ? 1.1 : 0.9;
        } else if (selectedStrategy === 'aggressive') {
          // Favor newer, innovative predicates
          adjustedConfidence *= rec.confidence > 0.6 ? 1.2 : 0.8;
        }

        // Determine strategic value
        let strategicValue: SmartRecommendation['strategicValue'] = 'medium';
        if (adjustedConfidence > 0.8 && recommendationType === 'direct_competitor') {
          strategicValue = 'high';
        } else if (adjustedConfidence < 0.5) {
          strategicValue = 'low';
        }

        return {
          kNumber: rec.kNumber,
          confidence: Math.min(adjustedConfidence, 1.0),
          reasoning: rec.reasoning,
          deviceName: `Device ${index + 1}`, // Would be populated from actual device lookup
          strategicValue,
          recommendationType,
          additionalInfo: {
            productCode: productCode,
            deviceClass: deviceClass
          }
        };
      });

      // Sort by strategic value and confidence
      enhancedRecommendations.sort((a, b) => {
        const valueWeights = { high: 3, medium: 2, low: 1 };
        const aScore = valueWeights[a.strategicValue] * a.confidence;
        const bScore = valueWeights[b.strategicValue] * b.confidence;
        return bScore - aScore;
      });

      setRecommendations(enhancedRecommendations.slice(0, 5));
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('Failed to generate predicate recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationIcon = (type: SmartRecommendation['recommendationType']) => {
    switch (type) {
      case 'direct_competitor': return <Target className="h-4 w-4" />;
      case 'technology_similar': return <GitBranch className="h-4 w-4" />;
      case 'market_leader': return <TrendingUp className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getRecommendationColor = (type: SmartRecommendation['recommendationType']) => {
    switch (type) {
      case 'direct_competitor': return 'text-red-600 bg-red-50';
      case 'technology_similar': return 'text-blue-600 bg-blue-50';
      case 'market_leader': return 'text-green-600 bg-green-50';
      default: return 'text-purple-600 bg-purple-50';
    }
  };

  const getStrategyDescription = (strategy: string) => {
    switch (strategy) {
      case 'conservative':
        return 'Focus on well-established predicates with proven regulatory success';
      case 'aggressive':
        return 'Target innovative predicates that may provide competitive advantages';
      case 'balanced':
        return 'Mix of established and innovative predicates for optimal strategy';
      default:
        return '';
    }
  };

  if (!deviceName && !productCode) {
    return (
      <Alert>
        <Brain className="h-4 w-4" />
        <AlertDescription>
          Provide a device name or product code to receive smart predicate recommendations.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Smart Predicate Recommendations
          <Badge variant="secondary">AI-Powered</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strategy Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Regulatory Strategy</label>
          <div className="flex gap-2">
            {(['conservative', 'balanced', 'aggressive'] as const).map(strategy => (
              <Button
                key={strategy}
                variant={selectedStrategy === strategy ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStrategy(strategy)}
                className="capitalize"
              >
                {strategy}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {getStrategyDescription(selectedStrategy)}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Generating smart recommendations...</p>
          </div>
        ) : recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={rec.kNumber} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{rec.kNumber}</Badge>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getRecommendationColor(rec.recommendationType)}`}>
                      {getRecommendationIcon(rec.recommendationType)}
                      {rec.recommendationType.replace('_', ' ')}
                    </div>
                    <Badge 
                      variant={
                        rec.strategicValue === 'high' ? 'default' : 
                        rec.strategicValue === 'medium' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {rec.strategicValue} value
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {Math.round(rec.confidence * 100)}%
                    </span>
                    <Button
                      onClick={() => onPredicateSelected(rec.kNumber)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <GitBranch className="h-3 w-3" />
                      Analyze
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                
                {rec.additionalInfo.applicant && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Applicant: {rec.additionalInfo.applicant}</span>
                    {rec.additionalInfo.decisionDate && (
                      <span>Decision: {rec.additionalInfo.decisionDate}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            <div className="text-center pt-2">
              <Button 
                onClick={generateRecommendations} 
                variant="outline" 
                size="sm"
                disabled={isLoading}
              >
                Refresh Recommendations
              </Button>
            </div>
          </div>
        ) : (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              No predicate recommendations found for the current device characteristics. 
              Try adjusting the search parameters or device description.
            </AlertDescription>
          </Alert>
        )}

        {/* Strategic Insights */}
        {recommendations.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Strategic Insights
            </h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>• {recommendations.filter(r => r.strategicValue === 'high').length} high-value predicates identified</div>
              <div>• Focus on {recommendations[0]?.recommendationType.replace('_', ' ')} approach for best results</div>
              <div>• Average confidence score: {Math.round(recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length * 100)}%</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}