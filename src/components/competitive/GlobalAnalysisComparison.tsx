import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Globe2, Building2, Users, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface MarketData {
  totalCompetitors: number;
  organizationCount: number;
  topCountries: Array<{ country: string; count: number }>;
  riskClassDistribution: Record<string, number>;
  marketConcentration: number;
  competitiveIntensity: number;
}

interface GlobalAnalysisComparisonProps {
  euData: MarketData;
  usData: MarketData;
  emdnCode?: string;
  fdaProductCode?: string;
  className?: string;
}

export function GlobalAnalysisComparison({ 
  euData, 
  usData, 
  emdnCode, 
  fdaProductCode, 
  className 
}: GlobalAnalysisComparisonProps) {
  
  const calculateMarketMaturity = (data: MarketData): { score: number; label: string; color: string } => {
    const competitors = data.totalCompetitors;
    const concentration = data.marketConcentration;
    const intensity = data.competitiveIntensity;
    
    // Market maturity score based on competition metrics
    let score = 0;
    if (competitors > 100) score += 40;
    else if (competitors > 50) score += 30;
    else if (competitors > 20) score += 20;
    else score += 10;
    
    if (concentration > 70) score += 30; // High concentration = mature
    else if (concentration > 40) score += 20;
    else score += 10;
    
    if (intensity > 70) score += 30; // High intensity = mature
    else if (intensity > 40) score += 20;
    else score += 10;
    
    if (score >= 80) return { score, label: 'Mature', color: 'text-red-600' };
    if (score >= 60) return { score, label: 'Developing', color: 'text-yellow-600' };
    return { score, label: 'Emerging', color: 'text-green-600' };
  };

  const getRegulatoryPathway = (marketData: MarketData, region: 'EU' | 'US') => {
    const riskClasses = Object.keys(marketData.riskClassDistribution);
    const hasHighRisk = riskClasses.some(rc => rc.includes('III') || rc.includes('High'));
    const competitorCount = marketData.totalCompetitors;
    
    if (region === 'EU') {
      return {
        pathway: hasHighRisk ? 'Notified Body Assessment' : 'Conformity Assessment',
        timeline: hasHighRisk ? '12-18 months' : '6-12 months',
        complexity: hasHighRisk ? 'High' : competitorCount > 50 ? 'Medium' : 'Low',
        considerations: [
          'EUDAMED registration required',
          hasHighRisk ? 'Clinical evaluation mandatory' : 'Technical documentation review',
          'EU Authorized Representative needed'
        ]
      };
    } else {
      return {
        pathway: hasHighRisk ? '510(k) Premarket Notification' : 'FDA Registration',
        timeline: hasHighRisk ? '9-15 months' : '3-6 months',
        complexity: hasHighRisk ? 'High' : competitorCount > 50 ? 'Medium' : 'Low',
        considerations: [
          'FDA establishment registration',
          hasHighRisk ? 'Predicate device identification' : 'Quality system regulation',
          'US agent appointment'
        ]
      };
    }
  };

  const euMaturity = calculateMarketMaturity(euData);
  const usMaturity = calculateMarketMaturity(usData);
  const euRegulatory = getRegulatoryPathway(euData, 'EU');
  const usRegulatory = getRegulatoryPathway(usData, 'US');

  const getMarketEntryRecommendation = () => {
    const euEasier = euMaturity.score < usMaturity.score;
    const totalCompetitors = euData.totalCompetitors + usData.totalCompetitors;
    
    if (totalCompetitors < 30) {
      return {
        strategy: 'Dual Market Entry',
        priority: 'Both markets simultaneously',
        reasoning: 'Low competition in both markets presents opportunity for early market capture',
        timeline: '12-18 months'
      };
    } else if (euEasier) {
      return {
        strategy: 'EU First Strategy',
        priority: 'Start with EU market',
        reasoning: 'EU market appears less mature with more opportunity for market penetration',
        timeline: '6-12 months EU, then 12-18 months US'
      };
    } else {
      return {
        strategy: 'US First Strategy', 
        priority: 'Start with US market',
        reasoning: 'US market conditions more favorable for initial market entry',
        timeline: '9-15 months US, then 12-18 months EU'
      };
    }
  };

  const recommendation = getMarketEntryRecommendation();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Market Comparison Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EU Market */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-blue-600" />
              EU Market ({emdnCode})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Competitors</p>
                <p className="text-2xl font-bold">{euData.totalCompetitors}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Organizations</p>
                <p className="text-2xl font-bold">{euData.organizationCount}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Market Maturity</span>
                <Badge variant="outline" className={euMaturity.color}>
                  {euMaturity.label}
                </Badge>
              </div>
              <Progress value={euMaturity.score} className="h-2" />
              <p className="text-xs text-muted-foreground">{euMaturity.score}/100</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Market Concentration</p>
              <div className="flex items-center gap-2">
                <Progress value={euData.marketConcentration} className="flex-1 h-2" />
                <span className="text-sm font-medium">{euData.marketConcentration}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* US Market */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-red-600" />
              US Market ({fdaProductCode})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Competitors</p>
                <p className="text-2xl font-bold">{usData.totalCompetitors}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Organizations</p>
                <p className="text-2xl font-bold">{usData.organizationCount}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Market Maturity</span>
                <Badge variant="outline" className={usMaturity.color}>
                  {usMaturity.label}
                </Badge>
              </div>
              <Progress value={usMaturity.score} className="h-2" />
              <p className="text-xs text-muted-foreground">{usMaturity.score}/100</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Market Concentration</p>
              <div className="flex items-center gap-2">
                <Progress value={usData.marketConcentration} className="flex-1 h-2" />
                <span className="text-sm font-medium">{usData.marketConcentration}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regulatory Pathways Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Regulatory Pathways Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* EU Regulatory */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold">EU Regulatory Pathway</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Pathway</p>
                  <p className="text-sm text-muted-foreground">{euRegulatory.pathway}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Expected Timeline</p>
                  <p className="text-sm text-muted-foreground">{euRegulatory.timeline}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Complexity</p>
                  <Badge variant={euRegulatory.complexity === 'High' ? 'destructive' : 
                                 euRegulatory.complexity === 'Medium' ? 'default' : 'secondary'}>
                    {euRegulatory.complexity}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Key Considerations</p>
                  {euRegulatory.considerations.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* US Regulatory */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-red-600" />
                <h4 className="font-semibold">US Regulatory Pathway</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Pathway</p>
                  <p className="text-sm text-muted-foreground">{usRegulatory.pathway}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Expected Timeline</p>
                  <p className="text-sm text-muted-foreground">{usRegulatory.timeline}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Complexity</p>
                  <Badge variant={usRegulatory.complexity === 'High' ? 'destructive' : 
                                 usRegulatory.complexity === 'Medium' ? 'default' : 'secondary'}>
                    {usRegulatory.complexity}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Key Considerations</p>
                  {usRegulatory.considerations.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Entry Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Global Market Entry Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
              <div>
                <h4 className="font-semibold">{recommendation.strategy}</h4>
                <p className="text-sm text-muted-foreground">{recommendation.priority}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Strategic Reasoning</p>
                <p className="text-sm text-muted-foreground">{recommendation.reasoning}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Recommended Timeline</p>
                <p className="text-sm text-muted-foreground">{recommendation.timeline}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 p-4 border rounded-lg">
              <div className="text-center">
                <Badge variant="outline" className="mb-2">Phase 1</Badge>
                <p className="text-sm font-medium">
                  {recommendation.strategy.includes('EU First') ? 'EU Market Entry' : 
                   recommendation.strategy.includes('US First') ? 'US Market Entry' : 'Dual Market Entry'}
                </p>
              </div>
              {!recommendation.strategy.includes('Dual') && (
                <>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="text-center">
                    <Badge variant="outline" className="mb-2">Phase 2</Badge>
                    <p className="text-sm font-medium">
                      {recommendation.strategy.includes('EU First') ? 'US Market Entry' : 'EU Market Entry'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}