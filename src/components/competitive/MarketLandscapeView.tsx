import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Building2, Globe, Shield, TrendingUp, Users, Target, AlertTriangle, Lightbulb, Brain, UserPlus } from 'lucide-react';
import { useCombinedCompetitiveAnalysis } from '@/hooks/useCombinedCompetitiveAnalysis';
import { useParams } from 'react-router-dom';
import { useProductDetails } from '@/hooks/useProductDetails';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompetitorsPieChart } from './CompetitorsPieChart';
import { AICompetitiveInsights } from './AICompetitiveInsights';
import { CompetitorCompanyCard } from './CompetitorCompanyCard';
import { GeographicDistributionMap } from './GeographicDistributionMap';
import { EnhancedMarketLandscape } from './EnhancedMarketLandscape';
import { FDADocumentSearch } from './FDADocumentSearch';
import { FDAProductCodeSelector } from './FDAProductCodeSelector';
import { GlobalAnalysisComparison } from './GlobalAnalysisComparison';
import { RegionalMarketInsights } from './RegionalMarketInsights';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';
import { manualCompetitorService } from '@/services/manualCompetitorService';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';

interface MarketLandscapeViewProps {
  emdnCode?: string;
  fdaProductCode?: string;
  className?: string;
}

export function MarketLandscapeView({ emdnCode, fdaProductCode, className }: MarketLandscapeViewProps) {
  const { lang } = useTranslation();
  const { productId } = useParams<{ productId: string }>();
  const { data: product } = useProductDetails(productId);
  const companyId = product?.company_id;
  const queryClient = useQueryClient();
  
  // Fetch existing manual competitors to check which ones are already added
  const { data: existingCompetitors } = useQuery({
    queryKey: ['manual-competitors', productId],
    queryFn: () => manualCompetitorService.getProductCompetitors(productId!),
    enabled: !!productId
  });
  
  // Create a set of already added competitor names for quick lookup
  const existingCompetitorNames = useMemo(() => {
    if (!existingCompetitors) return new Set<string>();
    return new Set(existingCompetitors.map(c => c.competitor_company));
  }, [existingCompetitors]);
  
  // Track which competitors have been added during this session (for immediate UI feedback)
  const [sessionAddedCompetitors, setSessionAddedCompetitors] = useState<Set<string>>(new Set());
  const [addingCompetitor, setAddingCompetitor] = useState<string | null>(null);

  const { data: analysis, isLoading, error, refetch } = useCombinedCompetitiveAnalysis(
    emdnCode, 
    fdaProductCode, 
    undefined, 
    { enabled: Boolean(emdnCode || fdaProductCode) }
  );
  
  // Combined check: either already in DB or added this session
  const isCompetitorAdded = (companyName: string) => {
    return existingCompetitorNames.has(companyName) || sessionAddedCompetitors.has(companyName);
  };
  
  // State for bulk adding
  const [isAddingAll, setIsAddingAll] = useState(false);
  
  // Handler to add a competitor to the manual overview
  const handleAddToOverview = async (company: { organization: string; country?: string; productCount: number; dominantRiskClass?: string }) => {
    if (!productId || !companyId) {
      toast.error('Product information not available');
      return;
    }
    
    setAddingCompetitor(company.organization);
    
    try {
      // Determine source: if both codes are provided, we're in Global view
      const isGlobalView = Boolean(emdnCode && fdaProductCode);
      const source = isGlobalView ? 'global' : (company.country === 'US' ? 'fda' : 'eudamed');
      
      await manualCompetitorService.createCompetitor({
        product_id: productId,
        company_id: companyId,
        competitor_company: company.organization,
        market: company.country === 'US' ? 'USA' : 'EU',
        device_classification: company.dominantRiskClass,
        notes: `Added from ${isGlobalView ? 'Global' : (company.country === 'US' ? 'FDA' : 'EUDAMED')} competitive analysis. ${company.productCount} devices in category.`,
        metadata: {
          source,
          product_count: company.productCount,
          added_at: new Date().toISOString()
        }
      });
      
      setSessionAddedCompetitors(prev => new Set([...prev, company.organization]));
      toast.success(`${company.organization} added to your competitor list`);
      
      // Invalidate manual competitors query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['manual-competitors', productId] });
    } catch (error) {
      console.error('Failed to add competitor:', error);
      toast.error('Failed to add competitor to overview');
    } finally {
      setAddingCompetitor(null);
    }
  };

  // Handler to add all visible competitors at once
  const handleAddAllToList = async (companies: Array<{ organization: string; country?: string; productCount: number; dominantRiskClass?: string }>) => {
    if (!productId || !companyId) {
      toast.error('Product information not available');
      return;
    }
    
    // Filter out already added competitors
    const newCompanies = companies.filter(c => !isCompetitorAdded(c.organization));
    
    if (newCompanies.length === 0) {
      toast.info('All competitors are already in your list');
      return;
    }
    
    setIsAddingAll(true);
    
    try {
      const isGlobalView = Boolean(emdnCode && fdaProductCode);
      
      // Add all competitors in parallel
      await Promise.all(newCompanies.map(company => {
        const source = isGlobalView ? 'global' : (company.country === 'US' ? 'fda' : 'eudamed');
        
        return manualCompetitorService.createCompetitor({
          product_id: productId,
          company_id: companyId,
          competitor_company: company.organization,
          market: company.country === 'US' ? 'USA' : 'EU',
          device_classification: company.dominantRiskClass,
          notes: `Added from ${isGlobalView ? 'Global' : (company.country === 'US' ? 'FDA' : 'EUDAMED')} competitive analysis. ${company.productCount} devices in category.`,
          metadata: {
            source,
            product_count: company.productCount,
            added_at: new Date().toISOString()
          }
        });
      }));
      
      // Update session state with all new companies
      setSessionAddedCompetitors(prev => {
        const newSet = new Set(prev);
        newCompanies.forEach(c => newSet.add(c.organization));
        return newSet;
      });
      
      toast.success(`${newCompanies.length} competitor${newCompanies.length > 1 ? 's' : ''} added to your list`);
      queryClient.invalidateQueries({ queryKey: ['manual-competitors', productId] });
    } catch (error) {
      console.error('Failed to add competitors:', error);
      toast.error('Failed to add some competitors');
    } finally {
      setIsAddingAll(false);
    }
  };

  const handleFDACodeSelected = () => {
    // Refresh product data to get updated FDA code
    window.location.reload();
  };

  const handleFixFDACode = async () => {
    if (!productId) return;
    
    try {
      // Simple direct update - no complex functions needed
      const { error } = await supabase
        .from('products')
        .update({ fda_product_code: 'LMH' })
        .eq('id', productId);
      
      if (error) {
        console.error('Failed to update FDA product code:', error);
        return;
      }
      
      // Show success and refresh
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('Error updating FDA code:', error);
    }
  };

  // Diagnostic information for FDA product code mismatch
  const diagnosticInfo = {
    emdnCode,
    fdaProductCode,
    isValidForAestheticFillers: fdaProductCode === 'LMH',
    currentFdaCodeDescription: fdaProductCode === 'KGI' ? 'Bone Densitometer (Mismatch!)' : 
                              fdaProductCode === 'LMH' ? 'Dermal Implant for Aesthetic Use (Correct!)' : 
                              `Device Code: ${fdaProductCode}`
  };

  // Only show the "set code" message if neither EMDN nor FDA product code is available
  if (!emdnCode && !fdaProductCode) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {lang('marketAnalysis.landscape.title')}
          </CardTitle>
          <CardDescription>
            {lang('marketAnalysis.landscape.setEmdnCode')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {lang('marketAnalysis.landscape.title')}
          </CardTitle>
          <CardDescription>
            {lang('marketAnalysis.landscape.loadingData')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <LoadingSpinner />
            <p className="text-sm text-muted-foreground">
              {lang('marketAnalysis.landscape.loadingTime')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show diagnostic warning if FDA product code doesn't match aesthetic fillers
  if (emdnCode && fdaProductCode && !diagnosticInfo.isValidForAestheticFillers) {
    const shouldShowMismatchWarning = (
      emdnCode.includes('Y062703') || // Aesthetic fillers EMDN code
      emdnCode.toLowerCase().includes('filler') ||
      emdnCode.toLowerCase().includes('aesthetic')
    ) && fdaProductCode !== 'LMH';

    if (shouldShowMismatchWarning) {
      return (
        <Card className={className}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {lang('marketAnalysis.fdaMismatch.title')}
            </CardTitle>
            <CardDescription>
              {lang('marketAnalysis.fdaMismatch.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="space-y-2 text-sm">
                <div><strong>🇪🇺 {lang('marketAnalysis.fdaMismatch.emdnCode')}:</strong> {emdnCode} (Aesthetic Fillers)</div>
                <div><strong>🇺🇸 {lang('marketAnalysis.fdaMismatch.currentFdaCode')}:</strong> {fdaProductCode} - {diagnosticInfo.currentFdaCodeDescription}</div>
                <div className="text-amber-700">
                  <strong>⚠️ {lang('marketAnalysis.fdaMismatch.issue')}</strong> {lang('marketAnalysis.fdaMismatch.issueDesc')} <strong>LMH</strong> (Dermal Implant for Aesthetic Use)
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="font-medium">{lang('marketAnalysis.fdaMismatch.recommendedActions')}</h5>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>1. {lang('marketAnalysis.fdaMismatch.action1').replace('{{code}}', 'LMH')}</div>
                <div>2. {lang('marketAnalysis.fdaMismatch.action2')}</div>
                <div>3. {lang('marketAnalysis.fdaMismatch.action3')}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleFixFDACode}
                size="sm"
              >
                {lang('marketAnalysis.fdaMismatch.autoFix')}
              </Button>
              <Button
                onClick={() => window.location.href = `/app/product/${productId}/business-case?tab=market-analysis#fda-search`}
                variant="outline"
                size="sm"
              >
                {lang('marketAnalysis.fdaMismatch.manualSelection')}
              </Button>
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="sm"
              >
                {lang('marketAnalysis.fdaMismatch.continueWithCurrent')}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  if (error || !analysis) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {lang('marketAnalysis.landscape.title')}
          </CardTitle>
          <CardDescription className="text-destructive">
            {lang('marketAnalysis.landscape.failedToLoad')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enhanced Error Diagnostics */}
          <div className="p-4 border border-dashed rounded-lg">
            <div className="space-y-2 text-sm">
              <div><strong>🇪🇺 {lang('marketAnalysis.fdaMismatch.emdnCode')}:</strong> {emdnCode || 'Not set'}</div>
              <div><strong>🇺🇸 FDA Device Code:</strong> {fdaProductCode || 'Not set'} {fdaProductCode && `- ${diagnosticInfo.currentFdaCodeDescription}`}</div>
              {error && (
                <div className="text-red-600">
                  <strong>Error Details:</strong> {error.message || 'Unknown error'}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Button onClick={() => refetch()} variant="outline" size="sm">
              {lang('marketAnalysis.landscape.retryAnalysis')}
            </Button>
            {fdaProductCode !== 'LMH' && emdnCode?.includes('Y062703') && (
              <div className="text-xs text-muted-foreground">
                💡 {lang('marketAnalysis.fdaMismatch.tip').replace('{{code}}', 'LMH').replace('{{current}}', fdaProductCode || '')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (analysis.totalCompetitors === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {lang('marketAnalysis.landscape.title')}
          </CardTitle>
          <CardDescription>
            {lang('marketAnalysis.landscape.noDataFound').replace('{{code}}', emdnCode || '')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-dashed rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{lang('marketAnalysis.landscape.marketOpportunity')}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {lang('marketAnalysis.landscape.marketOpportunityDesc')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const marketConcentration = calculateMarketConcentration(analysis);
  const competitiveIntensity = calculateCompetitiveIntensity(analysis);

  return (
    <Card className={className}>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">{lang('marketAnalysis.landscape.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="competitors">{lang('marketAnalysis.landscape.tabs.competitors')}</TabsTrigger>
            <TabsTrigger value="geographic">{lang('marketAnalysis.landscape.tabs.geographic')}</TabsTrigger>
            <TabsTrigger value="insights">{lang('marketAnalysis.landscape.tabs.insights')}</TabsTrigger>
            <TabsTrigger value="ai-insights">{lang('marketAnalysis.landscape.tabs.aiInsights')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Market Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{analysis.totalCompetitors}</div>
                <div className="text-sm text-muted-foreground">{lang('marketAnalysis.landscape.overview.totalDevices')}</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {Object.keys(analysis.competitorsByOrganization || {}).length}
                </div>
                <div className="text-sm text-muted-foreground">{lang('marketAnalysis.landscape.overview.organizations')}</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {Object.keys(analysis.competitorsByCountry || {}).length}
                </div>
                <div className="text-sm text-muted-foreground">{lang('marketAnalysis.landscape.overview.countriesStates')}</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {analysis.marketInsights?.dominantRiskClass || 'Unknown'}
                </div>
                <div className="text-sm text-muted-foreground">{lang('marketAnalysis.landscape.overview.dominantRiskClass')}</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {analysis.cross_market_insights?.global_competitors?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">{lang('marketAnalysis.landscape.overview.globalPlayers')}</div>
              </div>
            </div>

            {/* Market Concentration */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                {lang('marketAnalysis.landscape.marketConcentration.title')}
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{lang('marketAnalysis.landscape.marketConcentration.index')}</span>
                  <span className={`font-medium ${
                    marketConcentration > 70 ? 'text-red-600' :
                    marketConcentration > 40 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {marketConcentration}% ({
                      marketConcentration > 70 ? lang('marketAnalysis.landscape.marketConcentration.highlyConcentrated') :
                      marketConcentration > 40 ? lang('marketAnalysis.landscape.marketConcentration.moderatelyConcentrated') : lang('marketAnalysis.landscape.marketConcentration.fragmented')
                    })
                  </span>
                </div>
                <Progress value={marketConcentration} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{lang('marketAnalysis.landscape.competitiveIntensity.title')}</span>
                  <span className={`font-medium ${
                    competitiveIntensity > 70 ? 'text-red-600' :
                    competitiveIntensity > 40 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {competitiveIntensity}% ({
                      competitiveIntensity > 70 ? lang('marketAnalysis.landscape.competitiveIntensity.high') :
                      competitiveIntensity > 40 ? lang('marketAnalysis.landscape.competitiveIntensity.moderate') : lang('marketAnalysis.landscape.competitiveIntensity.low')
                    })
                  </span>
                </div>
                <Progress value={competitiveIntensity} className="h-2" />
              </div>
            </div>

            <Separator />

            {/* Market Leaders Badges */}
            {analysis.marketInsights?.marketLeaders?.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-semibold mb-3">
                  <Building2 className="h-4 w-4" />
                  {lang('marketAnalysis.landscape.marketLeaders')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.marketInsights.marketLeaders.slice(0, 5).map((leader, index) => (
                    <Badge key={leader} variant={index === 0 ? "default" : "secondary"}>
                      {leader}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Top Countries Badges */}
            {analysis.marketInsights?.topCountries?.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-semibold mb-3">
                  <Globe className="h-4 w-4" />
                  {lang('marketAnalysis.landscape.topMarkets')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.marketInsights.topCountries.slice(0, 5).map((country) => (
                    <Badge key={country} variant="outline">
                      {country}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Class Distribution */}
            {Object.keys(analysis.competitorsByRiskClass).length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-semibold mb-3">
                  <Shield className="h-4 w-4" />
                  {lang('marketAnalysis.landscape.riskClassDistribution')}
                </h4>
                <div className="space-y-3">
                  {Object.entries(analysis.competitorsByRiskClass)
                    .sort(([,a], [,b]) => b - a)
                    .map(([riskClass, count]) => {
                      const percentage = (count / analysis.totalCompetitors) * 100;
                      return (
                        <div key={riskClass} className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">{riskClass}</span>
                            <span className="text-muted-foreground">{count} {lang('marketAnalysis.landscape.devices')} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="competitors" className="space-y-6">
            {/* EU vs FDA Competitors Section */}
            <div className="space-y-6">
              {/* EU (EUDAMED) Competitors */}
              {analysis.market_sources.eu > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-2 font-semibold text-lg">
                      <div className="flex items-center gap-2">
                        🇪🇺 <span>EU Market (EUDAMED)</span>
                      </div>
                    </h4>
                    <div className="flex items-center gap-2">
                      {analysis.competitorsByOrganization && Object.keys(analysis.competitorsByOrganization).length > 0 && (() => {
                        const euCompanies = Object.entries(analysis.competitorsByOrganization)
                          .filter(([org]) => {
                            const isInUS = analysis.us_data.devices_by_applicant && 
                              Object.keys(analysis.us_data.devices_by_applicant).some(usOrg => 
                                usOrg.toLowerCase().includes(org.toLowerCase()) || 
                                org.toLowerCase().includes(usOrg.toLowerCase())
                              );
                            return !isInUS;
                          })
                          .slice(0, 6)
                          .map(([organization, productCount]) => ({
                            organization,
                            country: 'EU',
                            productCount: productCount as number,
                            dominantRiskClass: 'Class I'
                          }));
                        const notAddedCount = euCompanies.filter(c => !isCompetitorAdded(c.organization)).length;
                        
                        return notAddedCount > 0 ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddAllToList(euCompanies)}
                            disabled={isAddingAll}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            {isAddingAll ? 'Adding...' : `Add all ${notAddedCount} to List`}
                          </Button>
                        ) : null;
                      })()}
                      <Badge variant="outline">
                        {analysis.market_sources.eu} devices
                      </Badge>
                    </div>
                  </div>
                  
                  {analysis.competitorsByOrganization && Object.keys(analysis.competitorsByOrganization).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(analysis.competitorsByOrganization)
                        .filter(([org]) => {
                          // Filter to show only EU competitors (those not in US data)
                          const isInUS = analysis.us_data.devices_by_applicant && 
                            Object.keys(analysis.us_data.devices_by_applicant).some(usOrg => 
                              usOrg.toLowerCase().includes(org.toLowerCase()) || 
                              org.toLowerCase().includes(usOrg.toLowerCase())
                            );
                          return !isInUS;
                        })
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 6)
                        .map(([organization, productCount], index) => {
                          const company = {
                            organization,
                            country: 'EU',
                            productCount: productCount as number,
                            dominantRiskClass: 'Class I',
                            deviceTypes: ['Medical Device'],
                            website: undefined
                          };

                          return (
                            <CompetitorCompanyCard 
                              key={`eu-${organization}`} 
                              company={company}
                              rank={index + 1}
                              onAddToOverview={handleAddToOverview}
                              isAddedToOverview={isCompetitorAdded(organization) || addingCompetitor === organization}
                            />
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* US (FDA) Competitors */}
              {analysis.us_data && analysis.us_data.total_devices > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-2 font-semibold text-lg">
                      <div className="flex items-center gap-2">
                        🇺🇸 <span>US Market (FDA)</span>
                      </div>
                    </h4>
                    <div className="flex items-center gap-2">
                      {analysis.us_data.devices_by_applicant && Object.keys(analysis.us_data.devices_by_applicant).length > 0 && (() => {
                        const usCompanies = Object.entries(analysis.us_data.devices_by_applicant)
                          .slice(0, 6)
                          .map(([organization, productCount]) => ({
                            organization,
                            country: 'US',
                            productCount: productCount as number,
                            dominantRiskClass: 'Class II'
                          }));
                        const notAddedCount = usCompanies.filter(c => !isCompetitorAdded(c.organization)).length;
                        
                        return notAddedCount > 0 ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddAllToList(usCompanies)}
                            disabled={isAddingAll}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            {isAddingAll ? 'Adding...' : `Add all ${notAddedCount} to List`}
                          </Button>
                        ) : null;
                      })()}
                      <Badge variant="outline">
                        {analysis.us_data.total_devices} devices
                      </Badge>
                    </div>
                  </div>
                  
                  {analysis.us_data.devices_by_applicant && Object.keys(analysis.us_data.devices_by_applicant).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(analysis.us_data.devices_by_applicant)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 6)
                        .map(([organization, productCount], index) => {
                          const company = {
                            organization,
                            country: 'US',
                            productCount: productCount as number,
                            dominantRiskClass: 'Class II',
                            deviceTypes: ['Medical Device'],
                            website: undefined
                          };

                          return (
                            <CompetitorCompanyCard 
                              key={`us-${organization}`} 
                              company={company}
                              rank={index + 1}
                              onAddToOverview={handleAddToOverview}
                              isAddedToOverview={isCompetitorAdded(organization) || addingCompetitor === organization}
                            />
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* Global Cross-Market Competitors */}
              {analysis.cross_market_insights?.global_competitors && analysis.cross_market_insights.global_competitors.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="flex items-center gap-2 font-semibold text-lg">
                        <div className="flex items-center gap-2">
                          🌍 <span>Global Competitors (Both Markets)</span>
                        </div>
                      </h4>
                      <Badge variant="outline">
                        {analysis.cross_market_insights.global_competitors.length} companies
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {analysis.cross_market_insights.global_competitors.slice(0, 6).map((company, index) => (
                        <div key={`global-${company}`} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="default" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <span className="font-medium text-sm">{company}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              🇪🇺 EU
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              🇺🇸 US
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="geographic" className="space-y-6">
            {/* EU vs FDA Geographic Distribution */}
            <div className="space-y-6">
              <div>
                <h4 className="flex items-center gap-2 font-semibold mb-4">
                  <Globe className="h-4 w-4" />
                  Geographic Market Distribution
                </h4>
                
                {/* Combined Map */}
                <GeographicDistributionMap 
                  emdnCode={emdnCode}
                  companyId={companyId}
                  competitorsByCountry={analysis.competitorsByCountry}
                  totalCompetitors={analysis.totalCompetitors}
                />
              </div>

              <Separator />

              {/* Separate EU and US Geographic Breakdowns */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* EU Geographic Distribution */}
                {analysis.market_sources.eu > 0 && (
                  <div className="space-y-3">
                    <h5 className="flex items-center gap-2 font-medium text-lg">
                      🇪🇺 <span>EU Market Distribution</span>
                    </h5>
                    <div className="space-y-2">
                      {Object.entries(analysis.competitorsByCountry)
                        .filter(([country]) => !country.startsWith('US-')) // Filter out US states
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 8)
                        .map(([country, count]) => {
                          const percentage = ((count as number) / analysis.market_sources.eu) * 100;
                          return (
                            <div key={`eu-${country}`} className="space-y-1">
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-medium">{country}</span>
                                <span className="text-muted-foreground">{count} devices ({percentage.toFixed(1)}%)</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* US Geographic Distribution */}
                {analysis.us_data && analysis.us_data.total_devices > 0 && (
                  <div className="space-y-3">
                    <h5 className="flex items-center gap-2 font-medium text-lg">
                      🇺🇸 <span>US Market Distribution</span>
                    </h5>
                    <div className="space-y-2">
                      {analysis.us_data.devices_by_state && Object.entries(analysis.us_data.devices_by_state)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 8)
                        .map(([state, count]) => {
                          const percentage = ((count as number) / analysis.us_data.total_devices) * 100;
                          return (
                            <div key={`us-${state}`} className="space-y-1">
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-medium">{state}</span>
                                <span className="text-muted-foreground">{count} devices ({percentage.toFixed(1)}%)</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {/* EU vs FDA Market Insights */}
            <div className="space-y-6">
              <h4 className="flex items-center gap-2 font-semibold">
                <Lightbulb className="h-4 w-4" />
                Strategic Market Insights
              </h4>

              {/* Combined Market Insights */}
              <MarketInsights analysis={analysis} emdnCode={emdnCode} />

              <Separator />

              {/* Market-Specific Insights */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* EU Market Insights */}
                {analysis.market_sources.eu > 0 && (
                  <div className="space-y-4">
                    <h5 className="flex items-center gap-2 font-medium text-lg">
                      🇪🇺 <span>EU Market Insights</span>
                    </h5>
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm font-medium mb-1">Competitive Landscape</div>
                        <div className="text-2xl font-bold text-blue-600">{analysis.market_sources.eu}</div>
                        <div className="text-xs text-muted-foreground">Total devices registered</div>
                        {analysis.sample_sources && analysis.sample_sources.eu !== analysis.market_sources.eu && (
                          <div className="text-xs text-amber-600 mt-1">
                            Analysis based on {analysis.sample_sources.eu} device sample
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm font-medium mb-1">Regulatory Environment</div>
                        <div className="text-sm text-muted-foreground">
                          Operating under MDR regulations with EUDAMED database tracking
                        </div>
                      </div>

                      {analysis.competitorsByRiskClass && Object.keys(analysis.competitorsByRiskClass).length > 0 && (
                        <div className="p-3 border rounded-lg">
                          <div className="text-sm font-medium mb-2">Risk Class Distribution</div>
                          <div className="space-y-1">
                            {Object.entries(analysis.competitorsByRiskClass)
                              .sort(([,a], [,b]) => b - a)
                              .slice(0, 3)
                              .map(([riskClass, count]) => (
                                <div key={riskClass} className="flex justify-between text-xs">
                                  <span>{riskClass}</span>
                                  <span className="text-muted-foreground">{count} devices</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* US Market Insights */}
                {analysis.us_data && analysis.us_data.total_devices > 0 && (
                  <div className="space-y-4">
                    <h5 className="flex items-center gap-2 font-medium text-lg">
                      🇺🇸 <span>US Market Insights</span>
                    </h5>
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm font-medium mb-1">Regulatory Landscape</div>
                        <div className="text-2xl font-bold text-red-600">{analysis.us_data.total_devices}</div>
                        <div className="text-xs text-muted-foreground">FDA 510(k) clearances</div>
                        {analysis.sample_sources && analysis.sample_sources.us !== analysis.us_data.total_devices && (
                          <div className="text-xs text-amber-600 mt-1">
                            Analysis based on {analysis.sample_sources.us} device sample
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm font-medium mb-1">Regulatory Environment</div>
                        <div className="text-sm text-muted-foreground">
                          FDA 510(k) pathway for substantial equivalence clearances
                        </div>
                      </div>

                      {analysis.us_data.devices_by_class && Object.keys(analysis.us_data.devices_by_class).length > 0 && (
                        <div className="p-3 border rounded-lg">
                          <div className="text-sm font-medium mb-2">Device Class Distribution</div>
                          <div className="space-y-1">
                            {Object.entries(analysis.us_data.devices_by_class)
                              .sort(([,a], [,b]) => b - a)
                              .slice(0, 3)
                              .map(([deviceClass, count]) => (
                                <div key={deviceClass} className="flex justify-between text-xs">
                                  <span>Class {deviceClass}</span>
                                  <span className="text-muted-foreground">{count} devices</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Cross-Market Strategic Insights */}
              {analysis.cross_market_insights && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h5 className="font-medium mb-3">Cross-Market Strategic Analysis</h5>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-green-600 mb-1">Opportunities</div>
                      <ul className="text-muted-foreground space-y-1">
                        <li>• {analysis.cross_market_insights.global_competitors.length} companies operate globally</li>
                        <li>• {analysis.cross_market_insights.market_overlap_percentage}% market overlap suggests expansion potential</li>
                        {analysis.cross_market_insights.eu_only_competitors.length > 0 && (
                          <li>• {analysis.cross_market_insights.eu_only_competitors.length} EU-only competitors could expand to US</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium text-blue-600 mb-1">Regulatory Considerations</div>
                      <ul className="text-muted-foreground space-y-1">
                        <li>• Regulatory complexity score: {analysis.cross_market_insights.regulatory_complexity_score}/100</li>
                        <li>• Different regulatory pathways between EU (MDR) and US (510k)</li>
                        <li>• Consider harmonized standards for global market entry</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ai-insights" className="space-y-6">
            {companyId ? (
              <AICompetitiveInsights 
                emdnCode={emdnCode}
                fdaProductCode={fdaProductCode}
                companyId={companyId}
                analysisData={analysis}
              />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center p-6">
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground">Loading company data...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="fda-search" className="space-y-6">
            <FDADocumentSearch 
              emdnCode={emdnCode} 
              productId={productId}
              companyId={companyId}
              currentFdaCode={fdaProductCode}
              onFdaCodeSelected={handleFDACodeSelected}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function MarketInsights({ analysis, emdnCode }: { analysis: any; emdnCode: string }) {
  const insights = generateMarketInsights(analysis);

  return (
    <div className="space-y-4">
      <h4 className="flex items-center gap-2 font-semibold">
        <Lightbulb className="h-4 w-4" />
        Strategic Market Insights
      </h4>
      
      {insights.map((insight, index) => (
        <div key={index} className={`p-4 rounded-lg border-l-4 ${
          insight.type === 'opportunity' ? 'border-green-500 bg-green-50' :
          insight.type === 'threat' ? 'border-red-500 bg-red-50' :
          'border-blue-500 bg-blue-50'
        }`}>
          <div className="flex items-start gap-3">
            {insight.type === 'opportunity' ? (
              <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
            ) : insight.type === 'threat' ? (
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
            ) : (
              <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
            )}
            <div>
              <div className="font-medium text-sm mb-1">{insight.title}</div>
              <div className="text-sm text-muted-foreground">{insight.description}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function calculateMarketConcentration(analysis: any): number {
  const orgCounts = Object.values(analysis.competitorsByOrganization) as number[];
  const totalDevices = analysis.totalCompetitors;
  
  // Calculate top 3 organizations' market share
  const topThreeShare = orgCounts
    .sort((a, b) => b - a)
    .slice(0, 3)
    .reduce((sum, count) => sum + count, 0);
  
  return Math.round((topThreeShare / totalDevices) * 100);
}

function calculateCompetitiveIntensity(analysis: any): number {
  const orgCount = Object.keys(analysis.competitorsByOrganization).length;
  const avgDevicesPerOrg = analysis.totalCompetitors / orgCount;
  
  // Higher number of organizations with fewer devices each = higher intensity
  const intensity = Math.min(100, (orgCount / avgDevicesPerOrg) * 20);
  return Math.round(intensity);
}

function generateMarketInsights(analysis: any) {
  const insights = [];
  const orgCount = Object.keys(analysis.competitorsByOrganization).length;
  const concentration = calculateMarketConcentration(analysis);
  const isLimitedSample = analysis.sample_sources && 
    (analysis.sample_sources.total < analysis.market_sources.total * 0.2);
  
  // Add sample limitation context
  if (isLimitedSample) {
    insights.push({
      type: 'info',
      title: 'Analysis Based on Sample Data',
      description: `Strategic insights are based on ${analysis.sample_sources.total} analyzed devices from ${analysis.market_sources.total} total market devices. Full market analysis may reveal different patterns.`
    });
  }
  
  if (concentration > 70 && !isLimitedSample) {
    insights.push({
      type: 'threat',
      title: 'Highly Concentrated Market',
      description: 'Market is dominated by a few key players, making entry challenging but potentially rewarding if successful.'
    });
  } else if (concentration < 30) {
    insights.push({
      type: 'opportunity',
      title: isLimitedSample ? 'Sample Shows Fragmented Competition' : 'Fragmented Market Opportunity',
      description: isLimitedSample 
        ? 'Analyzed sample shows fragmented competition with no dominant players. Full market analysis recommended for complete picture.'
        : 'Market appears fragmented with no dominant players, presenting consolidation opportunities.'
    });
  }
  
  if (orgCount < 5) {
    insights.push({
      type: 'opportunity',
      title: 'Limited Competition',
      description: 'Relatively few organizations in this space, indicating potential market gaps.'
    });
  }
  
  if (analysis.totalCompetitors > 100) {
    insights.push({
      type: 'insight',
      title: 'Mature Market',
      description: 'High device count suggests a mature market with established demand and regulatory pathways.'
    });
  }
  
  const countryCount = Object.keys(analysis.competitorsByCountry).length;
  if (countryCount > 10) {
    insights.push({
      type: 'insight',
      title: 'Global Market Presence',
      description: 'Wide geographic distribution indicates strong global demand and regulatory acceptance.'
    });
  }
  
  return insights;
}