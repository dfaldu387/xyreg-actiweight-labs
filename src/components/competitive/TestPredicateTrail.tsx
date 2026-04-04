import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Zap, Brain, Sparkles } from 'lucide-react';
import { useFDAPredicateTrail } from '@/hooks/useFDAPredicateSearch';
import { useMultiAIPredicateTrail } from '@/hooks/useMultiAIPredicateTrail';
import { AIPredicateTrailVisualization } from './AIPredicateTrailVisualization';
import { supabase } from '@/integrations/supabase/client';
// import { useCompanyContext } from '@/contexts/CompanyContext';

interface TestPredicateTrailProps {
  kNumber: string;
  maxDepth?: number;
}

export function TestPredicateTrail({ kNumber, maxDepth = 3 }: TestPredicateTrailProps) {
  const { data: trail, isLoading, error } = useFDAPredicateTrail(kNumber, maxDepth);
  // For demo purposes, using a placeholder company ID
  const currentCompany = { id: 'demo-company-id' };
  
  // Multi-AI analysis
  const { 
    data: multiAIData, 
    isLoading: isLoadingMultiAI, 
    error: multiAIError,
    refetch: refetchMultiAI 
  } = useMultiAIPredicateTrail(kNumber, currentCompany?.id);
  
  const [aiTrail, setAiTrail] = useState<any>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAIAnalysis = async () => {
    setIsLoadingAI(true);
    setAiError(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-predicate-trail', {
        body: { kNumber }
      });
      
      if (error) throw error;
      
      if (data.success) {
        setAiTrail(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error loading AI trail:', error);
      setAiError(error.message);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // useEffect(() => {
    // console.log('[TestPredicateTrail] Trail data:', trail);
  // }, [trail]);

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gemini': return <Sparkles className="h-4 w-4" />;
      case 'openai': return <Zap className="h-4 w-4" />;
      case 'anthropic': return <Brain className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'gemini': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'openai': return 'bg-green-100 text-green-700 border-green-200';
      case 'anthropic': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Multi-AI Provider Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Multi-AI Predicate Trail Analysis
            <Badge variant="default">Enhanced</Badge>
          </CardTitle>
          <CardDescription>
            Analyzes predicate trails using all available AI providers for comprehensive results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!currentCompany?.id && (
            <div className="text-amber-600 p-4 bg-amber-50 rounded-lg mb-4">
              <p className="font-medium">Company context required</p>
              <p className="text-sm mt-1">Please select a company to access AI analysis features.</p>
            </div>
          )}

          {currentCompany?.id && (
            <>
              <div className="flex gap-2 mb-4">
                <Button 
                  onClick={() => refetchMultiAI()} 
                  disabled={isLoadingMultiAI || !kNumber}
                  size="sm"
                >
                  {isLoadingMultiAI ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Analyzing with all AI providers...
                    </>
                  ) : (
                    'Run Multi-AI Analysis'
                  )}
                </Button>
              </div>
              
              {multiAIError && (
                <div className="text-red-600 p-4 bg-red-50 rounded-lg mb-4">
                  <p className="font-medium">Multi-AI Analysis Error:</p>
                  <p className="text-sm mt-1">{multiAIError.message}</p>
                </div>
              )}
              
              {multiAIData?.success && multiAIData.data && (
                <div className="space-y-4">
                  {/* Consensus Summary */}
                  {multiAIData.data.consensus && (
                    <Card className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Consensus Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {multiAIData.data.consensus.commonFindings?.length > 0 && (
                          <div>
                            <h4 className="font-medium text-green-700 mb-2">Common Findings:</h4>
                            <ul className="space-y-1">
                              {multiAIData.data.consensus.commonFindings.map((finding, idx) => (
                                <li key={idx} className="text-sm text-green-600 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                  {finding}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {multiAIData.data.consensus.conflicts?.length > 0 && (
                          <div>
                            <h4 className="font-medium text-amber-700 mb-2">Conflicts:</h4>
                            <ul className="space-y-1">
                              {multiAIData.data.consensus.conflicts.map((conflict, idx) => (
                                <li key={idx} className="text-sm text-amber-600 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                                  {conflict}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {multiAIData.data.consensus.recommendedProvider && (
                          <div className="mt-3 p-3 bg-primary/5 rounded-lg">
                            <p className="text-sm">
                              <span className="font-medium">Recommended provider:</span>{' '}
                              <Badge variant="outline" className={getProviderColor(multiAIData.data.consensus.recommendedProvider)}>
                                {getProviderIcon(multiAIData.data.consensus.recommendedProvider)}
                                {multiAIData.data.consensus.recommendedProvider}
                              </Badge>
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Individual Provider Results */}
                  <Tabs defaultValue={multiAIData.data.trails[0]?.provider || 'gemini'} className="w-full">
                    <TabsList className="grid w-full grid-cols-auto">
                      {multiAIData.data.trails.map((trail) => (
                        <TabsTrigger 
                          key={trail.provider} 
                          value={trail.provider}
                          className="flex items-center gap-2"
                        >
                          {getProviderIcon(trail.provider)}
                          {trail.provider}
                          {trail.confidence && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {Math.round(trail.confidence * 100)}%
                            </Badge>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {multiAIData.data.trails.map((trail) => (
                      <TabsContent key={trail.provider} value={trail.provider} className="mt-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              {getProviderIcon(trail.provider)}
                              {trail.provider.charAt(0).toUpperCase() + trail.provider.slice(1)} Analysis
                              {trail.confidence && (
                                <Badge variant="outline">
                                  Confidence: {Math.round(trail.confidence * 100)}%
                                </Badge>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <AIPredicateTrailVisualization trail={trail} kNumber={kNumber} />
                          </CardContent>
                        </Card>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Traditional Parsing Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Traditional Document Parsing
            <Badge variant="secondary">Legacy Method</Badge>
          </CardTitle>
          <CardDescription>
            Uses regex parsing to extract predicate references from FDA documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Analyzing predicate trail...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="text-red-600 p-4 bg-red-50 rounded-lg">
              <p className="font-medium">Error loading predicate trail:</p>
              <p className="text-sm mt-1">{error.message}</p>
            </div>
          )}
          
          {trail && !isLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold text-lg">{trail.trailDepth}</div>
                  <div className="text-sm text-muted-foreground">Trail Depth</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold text-lg">{trail.upstreamPredicates?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Upstream</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold text-lg">{trail.downstreamReferences?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Downstream</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold text-lg">{trail.predicateChain?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Chain Length</div>
                </div>
              </div>
              
              {trail.predicateChain && trail.predicateChain.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Predicate Chain:</h4>
                  <div className="space-y-2">
                    {trail.predicateChain.map((device, index) => (
                      <div key={device.kNumber} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <Badge variant="outline">Level {index + 1}</Badge>
                        <span className="font-mono">{device.kNumber}</span>
                        <span className="text-sm text-muted-foreground">
                          {device.deviceName || 'Unknown Device'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Single AI Analysis Method (Legacy) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            AI-Powered Analysis (Single Provider)
            <Badge variant="outline">Legacy AI Method</Badge>
          </CardTitle>
          <CardDescription>
            Uses single AI provider to understand and analyze predicate relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={handleAIAnalysis} 
              disabled={isLoadingAI || !kNumber}
              size="sm"
            >
              {isLoadingAI ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                'Run Single AI Analysis'
              )}
            </Button>
            
            {aiTrail && (
              <Button 
                onClick={() => setAiTrail(null)} 
                variant="outline" 
                size="sm"
              >
                Clear Results
              </Button>
            )}
          </div>
          
          {aiError && (
            <div className="text-red-600 p-4 bg-red-50 rounded-lg mb-4">
              <p className="font-medium">AI Analysis Error:</p>
              <p className="text-sm mt-1">{aiError}</p>
            </div>
          )}
          
          {aiTrail && (
            <AIPredicateTrailVisualization trail={aiTrail} kNumber={kNumber} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}