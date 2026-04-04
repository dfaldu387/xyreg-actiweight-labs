import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Brain, RefreshCw, Lightbulb, AlertTriangle, TrendingUp, Target, Globe, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AIAnalysisService, type AnalysisConfig } from '@/services/aiAnalysisService';

interface AICompetitiveInsightsProps {
  emdnCode?: string;
  fdaProductCode?: string;
  companyId: string;
  analysisData: any;
  className?: string;
}

export function AICompetitiveInsights({ emdnCode, fdaProductCode, companyId, analysisData, className }: AICompetitiveInsightsProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);
  const [config, setConfig] = useState<AnalysisConfig>({
    marketSizing: true,
    competitiveLandscape: true,
    growthOpportunities: true,
    regulatoryHurdles: false,
    adjacentMarkets: false,
    swotAnalysis: false,
    customQuestions: ''
  });
  const { toast } = useToast();

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const marketIdentifier = emdnCode && fdaProductCode ? `EMDN ${emdnCode} + FDA ${fdaProductCode}` :
                              emdnCode ? `EMDN ${emdnCode}` : `FDA ${fdaProductCode}`;
      
      const response = await AIAnalysisService.generateCompetitiveAnalysis({
        emdnCode,
        fdaProductCode,
        companyId,
        analysisData,
        config
      });

      setInsights(response.analysis!);
      setMetadata(response.metadata);
      
      const isGlobal = response.metadata?.isGlobalAnalysis;
      toast({
        title: `${isGlobal ? 'Global' : 'Regional'} AI Analysis Complete`,
        description: `Generated ${isGlobal ? 'cross-market' : 'competitive'} intelligence insights successfully.`
      });
    } catch (error) {
      console.error('Error generating AI insights:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to generate AI competitive insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatInsights = (text: string) => {
    // Split by numbered sections and format
    const sections = text.split(/\n(?=\d+\.\s+\*\*)/);
    
    return sections.map((section, index) => {
      const lines = section.trim().split('\n');
      const titleLine = lines[0];
      const content = lines.slice(1).join('\n');
      
      // Extract title from markdown
      const titleMatch = titleLine.match(/\*\*(.*?)\*\*/);
      const title = titleMatch ? titleMatch[1] : titleLine;
      
      const getIcon = (title: string) => {
        if (title.toLowerCase().includes('threat')) return <AlertTriangle className="h-4 w-4 text-red-500" />;
        if (title.toLowerCase().includes('opportunity')) return <TrendingUp className="h-4 w-4 text-green-500" />;
        if (title.toLowerCase().includes('recommendation')) return <Target className="h-4 w-4 text-blue-500" />;
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      };

      return (
        <div key={index} className="mb-6 p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {getIcon(title)}
            <h4 className="font-semibold text-sm">{title}</h4>
          </div>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {content.trim()}
          </div>
        </div>
      );
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {metadata?.isGlobalAnalysis ? <Globe className="h-5 w-5" /> : <Brain className="h-5 w-5" />}
          {metadata?.isGlobalAnalysis ? 'Global AI Competitive Intelligence' : 'AI Competitive Intelligence'}
        </CardTitle>
        <CardDescription>
          {metadata?.isGlobalAnalysis 
            ? 'AI-powered global analysis combining EU and US competitive landscapes'
            : 'AI-powered strategic analysis of the competitive landscape'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!insights && !isLoading && (
          <div className="space-y-6">
            <div className="text-center py-6">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Configure Your Market Analysis</h3>
              <p className="text-muted-foreground">
                Select the areas of focus for your AI-powered {emdnCode && fdaProductCode ? 'global' : 'competitive'} intelligence analysis
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="marketSizing" 
                    checked={config.marketSizing}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, marketSizing: !!checked }))}
                  />
                  <Label htmlFor="marketSizing" className="text-sm font-medium">Market Sizing & Revenue Forecast</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="competitiveLandscape" 
                    checked={config.competitiveLandscape}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, competitiveLandscape: !!checked }))}
                  />
                  <Label htmlFor="competitiveLandscape" className="text-sm font-medium">Competitive Landscape & Key Players</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="growthOpportunities" 
                    checked={config.growthOpportunities}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, growthOpportunities: !!checked }))}
                  />
                  <Label htmlFor="growthOpportunities" className="text-sm font-medium">Growth Opportunities & Unmet Needs</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="regulatoryHurdles" 
                    checked={config.regulatoryHurdles}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, regulatoryHurdles: !!checked }))}
                  />
                  <Label htmlFor="regulatoryHurdles" className="text-sm font-medium">Regulatory & Reimbursement Hurdles</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="adjacentMarkets" 
                    checked={config.adjacentMarkets}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, adjacentMarkets: !!checked }))}
                  />
                  <Label htmlFor="adjacentMarkets" className="text-sm font-medium">Adjacent Market Opportunities (Cross-Pollination)</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="swotAnalysis" 
                    checked={config.swotAnalysis}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, swotAnalysis: !!checked }))}
                  />
                  <Label htmlFor="swotAnalysis" className="text-sm font-medium">SWOT Analysis</Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customQuestions" className="text-sm font-medium">Additional Questions</Label>
                <Textarea
                  id="customQuestions"
                  placeholder="Add any other specific questions or areas of focus for the analysis (optional)"
                  value={config.customQuestions}
                  onChange={(e) => setConfig(prev => ({ ...prev, customQuestions: e.target.value }))}
                  className="min-h-[80px]"
                />
              </div>
            </div>
            
            <div className="text-center">
              <Button 
                onClick={generateInsights} 
                className="gap-2"
                disabled={!Object.entries(config).some(([key, value]) => key !== 'customQuestions' && value)}
              >
                {emdnCode && fdaProductCode ? <Globe className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                Generate Analysis
              </Button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className="ml-2 text-muted-foreground">
              Analyzing {emdnCode && fdaProductCode ? 'global' : 'competitive'} landscape...
            </span>
          </div>
        )}

        {insights && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {metadata && `Generated ${new Date(metadata.generatedAt).toLocaleString()}`}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateInsights}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
            </div>
            
            <div className="space-y-4">
              {formatInsights(insights)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}