import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Progress } from '@/components/ui/progress';
import { useEnhancedCompetitiveAnalysis } from '@/hooks/useFDACompetitiveAnalysis';
import { Globe, MapPin, Building, TrendingUp, AlertTriangle, CheckCircle, Code } from 'lucide-react';
import { FDASearchConfig } from './FDASearchConfig';
import { FDAProductCodeComparison } from './FDAProductCodeComparison';
import { CategoryBasedMarketAnalysis } from './CategoryBasedMarketAnalysis';

interface EnhancedMarketLandscapeProps {
  emdnCode?: string;
  companyId?: string;
  className?: string;
}

export function EnhancedMarketLandscape({ emdnCode, companyId, className }: EnhancedMarketLandscapeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSearch, setCurrentSearch] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonCodes, setComparisonCodes] = useState<string[]>([]);
  const [fdaSearchParams, setFdaSearchParams] = useState<{
    keywords: string[];
    productCodes: string[];
    deviceClass?: string;
  }>({
    keywords: [],
    productCodes: [],
    deviceClass: undefined
  });

  const { data: analysis, isLoading, error, refetch } = useEnhancedCompetitiveAnalysis(
    emdnCode, 
    currentSearch
  );

  const handleSearch = () => {
    setCurrentSearch(searchQuery);
  };

  const handleCompareProductCodes = (codes: string[]) => {
    setComparisonCodes(codes);
    setShowComparison(true);
  };

  const handleCloseComparison = () => {
    setShowComparison(false);
    setComparisonCodes([]);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <LoadingSpinner />
            <p className="text-muted-foreground">Analyzing global competitive landscape...</p>
            <p className="text-sm text-muted-foreground">Gathering data from EU (EUDAMED) and US (FDA) databases</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
          <h3 className="text-lg font-medium mb-2">Analysis Error</h3>
          <p className="text-muted-foreground mb-4">
            Unable to complete enhanced competitive analysis: {error.message}
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Enhanced Global Competitive Analysis
          </CardTitle>
          <CardDescription>
            Analyze competitive landscape across EU (EUDAMED) and US (FDA) markets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search-query">Additional Search Terms (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="search-query"
                placeholder="e.g., catheter, pump, monitor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button onClick={handleSearch}>Search</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Add search terms to find related FDA devices. Leave empty to use EMDN code only.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show comparison view if active
  if (showComparison) {
    return (
      <div className={`space-y-6 ${className}`}>
        <FDAProductCodeComparison 
          productCodes={comparisonCodes}
          onClose={handleCloseComparison}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Global Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Global Competitive Overview
          </CardTitle>
          <CardDescription>
            <div className="space-y-1">
              <div>Competitive landscape across EU and US markets for EMDN {emdnCode}</div>
              {fdaSearchParams.keywords.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium">FDA:</span> {fdaSearchParams.keywords.join(', ')}
                  {fdaSearchParams.productCodes.length > 0 && (
                    <span> | Product codes: {fdaSearchParams.productCodes.join(', ')}</span>
                  )}
                  {fdaSearchParams.deviceClass && (
                    <span> | Class {fdaSearchParams.deviceClass}</span>
                  )}
                </div>
              )}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">🇪🇺 EU Market</h4>
              <p className="text-2xl font-bold">{analysis.eu_data.total_competitors}</p>
              <p className="text-sm text-muted-foreground">Competing devices</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-red-600">🇺🇸 US Market</h4>
              <p className="text-2xl font-bold">{analysis.us_data.total_devices}</p>
              <p className="text-sm text-muted-foreground">FDA cleared devices</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">Global Players</h4>
              <p className="text-2xl font-bold">{analysis.cross_reference_matches.matched_companies.length}</p>
              <p className="text-sm text-muted-foreground">Companies in both markets</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-purple-600">Market Opportunity</h4>
              <Badge variant={
                analysis.market_insights.global_market_opportunity === 'High' ? 'default' :
                analysis.market_insights.global_market_opportunity === 'Moderate' ? 'secondary' : 'outline'
              }>
                {analysis.market_insights.global_market_opportunity}
              </Badge>
              <p className="text-sm text-muted-foreground">Entry opportunity</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="comparison">Market Comparison</TabsTrigger>
          <TabsTrigger value="cross-reference">Global Players</TabsTrigger>
          <TabsTrigger value="eu-details">EU Details</TabsTrigger>
          <TabsTrigger value="us-details">US Details</TabsTrigger>
          <TabsTrigger value="category-analysis">Category Analysis</TabsTrigger>
          <TabsTrigger value="refine">Refine Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Concentration Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">EU Market Concentration</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Concentration Index</span>
                      <span>{analysis.market_insights.eu_market_concentration}%</span>
                    </div>
                    <Progress value={analysis.market_insights.eu_market_concentration} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {analysis.market_insights.eu_market_concentration > 70 ? 'Highly concentrated' :
                       analysis.market_insights.eu_market_concentration > 40 ? 'Moderately concentrated' : 'Fragmented'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">US Market Concentration</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Concentration Index</span>
                      <span>{analysis.market_insights.us_market_concentration}%</span>
                    </div>
                    <Progress value={analysis.market_insights.us_market_concentration} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {analysis.market_insights.us_market_concentration > 70 ? 'Highly concentrated' :
                       analysis.market_insights.us_market_concentration > 40 ? 'Moderately concentrated' : 'Fragmented'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Regulatory Complexity</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Complexity Score</span>
                    <span>{analysis.market_insights.regulatory_complexity_score}%</span>
                  </div>
                  <Progress value={analysis.market_insights.regulatory_complexity_score} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Based on device class diversity across both markets
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cross-reference" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Global Competitors
              </CardTitle>
              <CardDescription>
                Companies operating in both EU and US markets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.cross_reference_matches.matched_companies.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-green-600">Confirmed Global Players</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {analysis.cross_reference_matches.matched_companies.map((company, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium capitalize">{company}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Building className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No exact company matches found between EU and US markets</p>
                </div>
              )}

              {analysis.cross_reference_matches.potential_global_competitors.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-yellow-600">Potential Global Players</h4>
                  <div className="space-y-2">
                    {analysis.cross_reference_matches.potential_global_competitors.map((match, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded border-yellow-200">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">{match}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Similar company names that may indicate the same organization
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eu-details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🇪🇺 EU Market Details (EUDAMED)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Device Classes</h4>
                  <div className="space-y-2">
                    {Object.entries(analysis.eu_data.competitors_by_class)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([riskClass, count]) => (
                        <div key={riskClass} className="flex justify-between items-center">
                          <span className="text-sm">{riskClass}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Top Countries</h4>
                  <div className="space-y-2">
                    {Object.entries(analysis.eu_data.geographic_distribution)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([country, count]) => (
                        <div key={country} className="flex justify-between items-center">
                          <span className="text-sm">{country}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="us-details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🇺🇸 US Market Details (FDA)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Device Classes</h4>
                  <div className="space-y-2">
                    {Object.entries(analysis.us_data.devices_by_class)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([deviceClass, count]) => (
                        <div key={deviceClass} className="flex justify-between items-center">
                          <span className="text-sm">Class {deviceClass}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Top States</h4>
                  <div className="space-y-2">
                    {Object.entries(analysis.us_data.devices_by_state)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([state, count]) => (
                        <div key={state} className="flex justify-between items-center">
                          <span className="text-sm">{state}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Top FDA Applicants</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(analysis.us_data.devices_by_applicant)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([applicant, count]) => (
                      <div key={applicant} className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm font-medium capitalize">{applicant.toLowerCase()}</span>
                        <Badge>{count}</Badge>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Category-Based Competitive Analysis
              </CardTitle>
              <CardDescription>
                Analyze competitors by FDA product codes or EMDN categories to get targeted market intelligence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryBasedMarketAnalysis />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refine" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FDASearchConfig
              emdnCode={emdnCode || ''}
              onSearchParamsChange={setFdaSearchParams}
              currentParams={fdaSearchParams}
              onCompareProductCodes={handleCompareProductCodes}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Search</CardTitle>
                <CardDescription>
                  Run a custom FDA search with additional terms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add search terms for FDA database..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button onClick={handleSearch}>Update Analysis</Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Last updated: {analysis ? new Date(analysis.generated_at).toLocaleString() : 'Never'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}