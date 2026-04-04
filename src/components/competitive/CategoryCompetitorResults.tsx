import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  MapPin, 
  Globe, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  ExternalLink,
  BarChart3
} from 'lucide-react';
import type { CategoryAnalysisResults, CategoryCompetitor } from '@/services/categoryCompetitiveAnalysisService';

interface CategoryCompetitorResultsProps {
  results: CategoryAnalysisResults;
  className?: string;
}

export function CategoryCompetitorResults({ results, className }: CategoryCompetitorResultsProps) {
  if (!results.isValidCode) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
          <h3 className="text-lg font-medium mb-2">No Data Found</h3>
          <p className="text-muted-foreground mb-4">
            {results.errorMessage || 'No competitive data found for this category code.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderCompetitorCard = (competitor: CategoryCompetitor, market: 'EU' | 'US') => (
    <div key={competitor.id} className="p-4 border rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="font-medium text-sm">{competitor.name}</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {competitor.country}
          </div>
        </div>
        <div className="text-right">
          <Badge variant="outline">{competitor.deviceCount} devices</Badge>
          {competitor.riskClass && (
            <div className="text-xs text-muted-foreground mt-1">
              Class {competitor.riskClass}
            </div>
          )}
        </div>
      </div>
      
      {competitor.deviceNames && competitor.deviceNames.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Device Examples:</div>
          <div className="text-xs space-y-1">
            {competitor.deviceNames.map((name, idx) => (
              <div key={idx} className="truncate">{name}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderGeographicDistribution = (distribution: Record<string, number>, title: string) => {
    const sortedEntries = Object.entries(distribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8);
    
    const maxCount = Math.max(...Object.values(distribution));

    return (
      <div className="space-y-3">
        <h4 className="font-medium">{title}</h4>
        <div className="space-y-2">
          {sortedEntries.map(([location, count]) => (
            <div key={location} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{location}</span>
                <span className="font-medium">{count} devices</span>
              </div>
              <Progress value={(count / maxCount) * 100} className="h-2" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with category info and key metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Category Analysis: {results.categoryCode}
          </CardTitle>
          <CardDescription>
            <div className="space-y-1">
              {results.codeInfo && (
                <>
                  <div className="font-medium">{results.codeInfo.description}</div>
                  <div className="text-sm">
                    {results.codeInfo.medicalSpecialty} • {results.codeInfo.deviceClass} • 
                    {results.codeInfo.regulationNumber}
                  </div>
                </>
              )}
              <div className="flex items-center gap-4 text-sm mt-2">
                <span className="text-blue-600">🇪🇺 EU: {results.summary.totalEuDevices} devices</span>
                <span className="text-red-600">🇺🇸 US: {results.summary.totalUsDevices} devices</span>
                {results.summary.globalPlayers.length > 0 && (
                  <span className="text-green-600">🌍 {results.summary.globalPlayers.length} global players</span>
                )}
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">🇪🇺 EU Companies</h4>
              <p className="text-2xl font-bold">{results.summary.uniqueEuCompanies}</p>
              <p className="text-sm text-muted-foreground">Manufacturing companies</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-red-600">🇺🇸 US Companies</h4>
              <p className="text-2xl font-bold">{results.summary.uniqueUsCompanies}</p>
              <p className="text-sm text-muted-foreground">FDA applicants</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">🌍 Global Players</h4>
              <p className="text-2xl font-bold">{results.summary.globalPlayers.length}</p>
              <p className="text-sm text-muted-foreground">Companies in both markets</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-purple-600">Market Concentration</h4>
              <p className="text-2xl font-bold">
                {results.summary.uniqueEuCompanies + results.summary.uniqueUsCompanies}
              </p>
              <p className="text-sm text-muted-foreground">Total unique companies</p>
            </div>
          </div>

          {results.codeInfo && (
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={results.codeInfo.fdaUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View FDA Product Code Details
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed analysis tabs */}
      <Tabs defaultValue="eu-competitors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="eu-competitors">🇪🇺 EU Competitors</TabsTrigger>
          <TabsTrigger value="us-competitors">🇺🇸 US Competitors</TabsTrigger>
          <TabsTrigger value="global-players">🌍 Global Players</TabsTrigger>
          <TabsTrigger value="geographic">📍 Geographic</TabsTrigger>
        </TabsList>

        <TabsContent value="eu-competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🇪🇺 EU Market Competitors ({results.summary.uniqueEuCompanies} companies)
              </CardTitle>
              <CardDescription>
                Companies manufacturing devices in this category across European markets (EUDAMED data)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.euCompetitors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.euCompetitors
                    .sort((a, b) => b.deviceCount - a.deviceCount)
                    .map(competitor => renderCompetitorCard(competitor, 'EU'))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No EU competitors found for this category</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="us-competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🇺🇸 US Market Competitors ({results.summary.uniqueUsCompanies} companies)
              </CardTitle>
              <CardDescription>
                Companies with FDA-cleared devices in this product code category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.fdaCompetitors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.fdaCompetitors
                    .sort((a, b) => b.deviceCount - a.deviceCount)
                    .map(competitor => renderCompetitorCard(competitor, 'US'))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No US competitors found for this category</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="global-players" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Global Players Analysis
              </CardTitle>
              <CardDescription>
                Companies operating in both EU and US markets for this category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.summary.globalPlayers.length > 0 ? (
                <div className="space-y-3">
                  {results.summary.globalPlayers.map((player, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium">{player}</span>
                      <Badge variant="outline" className="ml-auto">Global Presence</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Globe className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Global Players Identified</h3>
                  <p className="text-muted-foreground">
                    No companies found operating in both EU and US markets for this category
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>🇪🇺 EU Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(results.geographicDistribution.eu).length > 0 ? (
                  renderGeographicDistribution(results.geographicDistribution.eu, "Device Distribution by Country")
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No EU geographic data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🇺🇸 US Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(results.geographicDistribution.us).length > 0 ? (
                  renderGeographicDistribution(results.geographicDistribution.us, "Device Distribution by State")
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No US geographic data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}