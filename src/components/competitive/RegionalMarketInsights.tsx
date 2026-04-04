import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Globe2, Building2, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

interface RegionalData {
  region: string;
  totalCompetitors: number;
  organizationCount: number;
  topCountries: Array<{ country: string; count: number }>;
  riskClassDistribution: Record<string, number>;
  growthIndicators: {
    newEntrants: number;
    marketShare: number;
    innovationIndex: number;
  };
}

interface RegionalMarketInsightsProps {
  euData: RegionalData;
  usData: RegionalData;
  className?: string;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export function RegionalMarketInsights({ euData, usData, className }: RegionalMarketInsightsProps) {
  
  const calculateGrowthTrend = (data: RegionalData) => {
    const { newEntrants, marketShare, innovationIndex } = data.growthIndicators;
    const score = (newEntrants * 0.4) + (marketShare * 0.3) + (innovationIndex * 0.3);
    
    if (score > 70) return { trend: 'Growing', icon: TrendingUp, color: 'text-green-600' };
    if (score > 40) return { trend: 'Stable', icon: Minus, color: 'text-yellow-600' };
    return { trend: 'Declining', icon: TrendingDown, color: 'text-red-600' };
  };

  const getCompetitivePosition = (competitors: number, organizations: number) => {
    const ratio = competitors / organizations;
    if (ratio > 5) return { position: 'Highly Competitive', color: 'destructive' };
    if (ratio > 3) return { position: 'Competitive', color: 'default' };
    return { position: 'Fragmented', color: 'secondary' };
  };

  const euGrowth = calculateGrowthTrend(euData);
  const usGrowth = calculateGrowthTrend(usData);
  const euPosition = getCompetitivePosition(euData.totalCompetitors, euData.organizationCount);
  const usPosition = getCompetitivePosition(usData.totalCompetitors, usData.organizationCount);

  // Prepare chart data
  const comparisonData = [
    {
      metric: 'Total Competitors',
      EU: euData.totalCompetitors,
      US: usData.totalCompetitors,
    },
    {
      metric: 'Organizations',
      EU: euData.organizationCount,
      US: usData.organizationCount,
    },
    {
      metric: 'Innovation Index',
      EU: euData.growthIndicators.innovationIndex,
      US: usData.growthIndicators.innovationIndex,
    }
  ];

  const euRiskData = Object.entries(euData.riskClassDistribution).map(([risk, count]) => ({
    name: risk,
    value: count
  }));

  const usRiskData = Object.entries(usData.riskClassDistribution).map(([risk, count]) => ({
    name: risk,
    value: count
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Regional Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EU Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-blue-600" />
              EU Market Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Market Trend</span>
              <div className="flex items-center gap-2">
                <euGrowth.icon className={`h-4 w-4 ${euGrowth.color}`} />
                <Badge variant="outline" className={euGrowth.color}>
                  {euGrowth.trend}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Competitive Landscape</span>
              <Badge variant={euPosition.color as any}>
                {euPosition.position}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Innovation Index</p>
              <div className="flex items-center gap-2">
                <Progress value={euData.growthIndicators.innovationIndex} className="flex-1 h-2" />
                <span className="text-sm font-medium">{euData.growthIndicators.innovationIndex}/100</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Market Share Distribution</p>
              <div className="flex items-center gap-2">
                <Progress value={euData.growthIndicators.marketShare} className="flex-1 h-2" />
                <span className="text-sm font-medium">{euData.growthIndicators.marketShare}%</span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>{euData.growthIndicators.newEntrants}</strong> new market entrants this year
              </p>
            </div>
          </CardContent>
        </Card>

        {/* US Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-red-600" />
              US Market Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Market Trend</span>
              <div className="flex items-center gap-2">
                <usGrowth.icon className={`h-4 w-4 ${usGrowth.color}`} />
                <Badge variant="outline" className={usGrowth.color}>
                  {usGrowth.trend}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Competitive Landscape</span>
              <Badge variant={usPosition.color as any}>
                {usPosition.position}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Innovation Index</p>
              <div className="flex items-center gap-2">
                <Progress value={usData.growthIndicators.innovationIndex} className="flex-1 h-2" />
                <span className="text-sm font-medium">{usData.growthIndicators.innovationIndex}/100</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Market Share Distribution</p>
              <div className="flex items-center gap-2">
                <Progress value={usData.growthIndicators.marketShare} className="flex-1 h-2" />
                <span className="text-sm font-medium">{usData.growthIndicators.marketShare}%</span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>{usData.growthIndicators.newEntrants}</strong> new market entrants this year
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparative Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Regional Market Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Bar dataKey="EU" fill="#3b82f6" />
                  <Bar dataKey="US" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-sm">EU Market</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span className="text-sm">US Market</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Class Distributions */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Class Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2 text-center">EU Distribution</h4>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={euRiskData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={50}
                        fill="#8884d8"
                      >
                        {euRiskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2 text-center">US Distribution</h4>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={usRiskData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={50}
                        fill="#8884d8"
                      >
                        {usRiskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {[...new Set([...euRiskData.map(d => d.name), ...usRiskData.map(d => d.name)])].map((riskClass, index) => (
                <div key={riskClass} className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs">{riskClass}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Strategic Market Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Market Opportunities</h4>
              <ul className="space-y-2 text-sm">
                {euData.growthIndicators.innovationIndex < 50 && (
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2" />
                    <span>EU market shows low innovation - opportunity for disruptive technologies</span>
                  </li>
                )}
                {usData.growthIndicators.newEntrants < 5 && (
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2" />
                    <span>US market has few new entrants - less competitive pressure</span>
                  </li>
                )}
                {euData.totalCompetitors < usData.totalCompetitors && (
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2" />
                    <span>EU market less saturated - easier market penetration</span>
                  </li>
                )}
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Market Challenges</h4>
              <ul className="space-y-2 text-sm">
                {euPosition.position === 'Highly Competitive' && (
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2" />
                    <span>EU market highly competitive - differentiation critical</span>
                  </li>
                )}
                {usPosition.position === 'Highly Competitive' && (
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2" />
                    <span>US market highly competitive - strong value proposition needed</span>
                  </li>
                )}
                {usData.growthIndicators.innovationIndex > 80 && (
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2" />
                    <span>US market highly innovative - rapid innovation cycles expected</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}