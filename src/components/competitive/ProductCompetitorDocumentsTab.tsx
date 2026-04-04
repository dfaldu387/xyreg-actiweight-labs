import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  FileText,
  Database,
  ListOrdered,
  Edit,
  Trash2,
  Globe,
  ExternalLink,
  Package
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { manualCompetitorService, ManualCompetitor } from '@/services/manualCompetitorService';
import { useGenesisRestrictions } from '@/hooks/useGenesisRestrictions';
import { PlanRestrictionBanner } from '@/components/ui/PlanRestrictionBanner';
import { competitiveAnalysisService, CompetitorDevice } from '@/services/competitiveAnalysisService';
import { fdaCompetitiveAnalysisService } from '@/services/fdaCompetitiveAnalysisService';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import { ManualCompetitorDialog } from './ManualCompetitorDialog';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MarketLandscapeView } from './MarketLandscapeView';
import { EmdnNavigationButton } from './EmdnNavigationButton';
import { useEmdnCodeDetails } from '@/hooks/useEmdnCodeDetails';
import { FDAProductCodeService } from '@/services/fdaProductCodeService';
import { FDAProductCodeSelector } from './FDAProductCodeSelector';

interface ProductCompetitorDocumentsTabProps {
  productId: string;
  emdnCode?: string;
  fdaProductCode?: string;
  product: any;
  onEmdnCodeChange: (code: string) => void;
  disabled?: boolean;
  accessMode?: 'full' | 'manual' | 'auto-data' | false;
}

export function ProductCompetitorDocumentsTab({
  productId,
  emdnCode,
  fdaProductCode,
  product,
  onEmdnCodeChange,
  disabled = false,
  accessMode = 'full'
}: ProductCompetitorDocumentsTabProps) {
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const isInGenesisFlow = returnTo === 'genesis' || returnTo === 'venture-blueprint' || returnTo === 'investor-share';

  // Check Genesis plan restrictions - show banner for Genesis users on EUDAMED/FDA/Global tabs
  const { isGenesis } = useGenesisRestrictions();

  const [showManualDialog, setShowManualDialog] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<ManualCompetitor | null>(null);
  const [deletingCompetitorId, setDeletingCompetitorId] = useState<string | null>(null);
  const [fdaProductCodeDescription, setFdaProductCodeDescription] = useState<string>('');

  const { data: emdnDetails } = useEmdnCodeDetails(emdnCode);

  // Fetch FDA product code description
  React.useEffect(() => {
    const fetchFdaDescription = async () => {
      if (fdaProductCode) {
        try {
          const productCodeInfo = await FDAProductCodeService.getProductCodeInfo(fdaProductCode);
          if (productCodeInfo) {
            setFdaProductCodeDescription(`${productCodeInfo.code} - ${productCodeInfo.description}`);
          } else {
            setFdaProductCodeDescription(fdaProductCode);
          }
        } catch (error) {
          console.error('Error fetching FDA product code description:', error);
          setFdaProductCodeDescription(fdaProductCode);
        }
      } else {
        setFdaProductCodeDescription('');
      }
    };
    
    fetchFdaDescription();
  }, [fdaProductCode]);

  // Fetch manual competitors
  const { data: manualCompetitors, isLoading: loadingManual, refetch: refetchManual } = useQuery({
    queryKey: ['manual-competitors', productId],
    queryFn: () => manualCompetitorService.getProductCompetitors(productId),
    enabled: !!productId
  });

  // Fetch EMDN competitors
  const { data: emdnAnalysis, isLoading: loadingEmdn } = useQuery({
    queryKey: ['emdn-competitors', emdnCode],
    queryFn: () => emdnCode ? competitiveAnalysisService.analyzeCompetitiveLandscape(emdnCode) : null,
    enabled: !!emdnCode
  });

  // Fetch FDA competitors
  const { data: fdaAnalysis, isLoading: loadingFda } = useQuery({
    queryKey: ['fda-competitors', fdaProductCode],
    queryFn: () => fdaProductCode ? fdaCompetitiveAnalysisService.searchFDADevices({ productCode: fdaProductCode }) : null,
    enabled: !!fdaProductCode
  });

  const handleDeleteCompetitor = async (competitorId: string) => {
    if (disabled) return;
    try {
      await manualCompetitorService.deleteCompetitor(competitorId);
      toast.success(lang('marketAnalysis.competition.toast.deleted'));
      refetchManual();
      // Invalidate funnel query to sync sidebar completion status
      queryClient.invalidateQueries({ queryKey: ['funnel-competitors', productId] });
    } catch (error) {
      toast.error(lang('marketAnalysis.competition.toast.deleteFailed'));
    } finally {
      setDeletingCompetitorId(null);
    }
  };

  const handleEditCompetitor = (competitor: ManualCompetitor) => {
    if (disabled) return;
    setEditingCompetitor(competitor);
    setShowManualDialog(true);
  };

  const handleDialogClose = () => {
    if (disabled) return;
    setShowManualDialog(false);
    setEditingCompetitor(null);
  };

  const handleCompetitorSaved = () => {
    refetchManual();
    // Invalidate funnel query to sync sidebar completion status
    queryClient.invalidateQueries({ queryKey: ['funnel-competitors', productId] });
    handleDialogClose();
  };

  const emdnCompetitors = emdnAnalysis?.devices?.slice(0, 50) || [];
  const fdaCompetitors = fdaAnalysis?.devices?.slice(0, 50) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{lang('marketAnalysis.competition.title')}</CardTitle>
              <CardDescription>
                {lang('marketAnalysis.competition.description')}
              </CardDescription>
            </div>
            <Button onClick={() => setShowManualDialog(true)} className="gap-2" disabled={disabled}>
              <Plus className="w-4 h-4" />
              {lang('marketAnalysis.competition.addManualCompetitor')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger
                value="list"
                className="gap-2"
                disabled={disabled}
              >
                <ListOrdered className="w-4 h-4" />
                {lang('marketAnalysis.competition.tabs.list')} ({manualCompetitors?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="eudamed"
                className="gap-2"
                disabled={disabled || accessMode === 'manual'}
              >
                <Database className="w-4 h-4" />
                {lang('marketAnalysis.competition.tabs.eudamed')}
              </TabsTrigger>
              <TabsTrigger
                value="fda"
                className="gap-2"
                disabled={disabled || accessMode === 'manual'}
              >
                <Database className="w-4 h-4" />
                {lang('marketAnalysis.competition.tabs.fda')}
              </TabsTrigger>
              <TabsTrigger
                value="global"
                className="gap-2"
                disabled={disabled || accessMode === 'manual'}
              >
                <Globe className="w-4 h-4" />
                {lang('marketAnalysis.competition.tabs.global')}
              </TabsTrigger>
            </TabsList>

            {/* List Tab - All Competitors */}
            <TabsContent value="list" className="space-y-4">
              <div className={isInGenesisFlow ? `p-3 rounded-lg transition-colors ${manualCompetitors && manualCompetitors.length > 0 ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}>
              {loadingManual ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="sm" />
                </div>
              ) : !manualCompetitors || manualCompetitors.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-accent/20">
                  <ListOrdered className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">{lang('marketAnalysis.competition.noCompetitors')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {lang('marketAnalysis.competition.addFromDiscovery')}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{lang('marketAnalysis.competition.table.company')}</TableHead>
                      <TableHead>{lang('marketAnalysis.competition.table.devices')}</TableHead>
                      <TableHead>{lang('marketAnalysis.competition.table.market')}</TableHead>
                      <TableHead>{lang('marketAnalysis.competition.table.classification')}</TableHead>
                      <TableHead>{lang('marketAnalysis.competition.table.source')}</TableHead>
                      <TableHead className="text-right">{lang('marketAnalysis.competition.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manualCompetitors.map((competitor) => {
                      const metadata = competitor.metadata as any;
                      const productCount = metadata?.product_count;
                      const source = metadata?.source || 'manual';
                      
                      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(competitor.competitor_company + ' medical devices')}`;
                      
                      return (
                        <TableRow key={competitor.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {competitor.competitor_company}
                              <a
                                href={searchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-accent"
                                title="Search online"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </TableCell>
                          <TableCell>
                            {productCount ? (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Package className="w-3 h-3" />
                                <span>{productCount} device{productCount !== 1 ? 's' : ''}</span>
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {competitor.market ? (
                              <Badge variant="secondary">{competitor.market}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {competitor.device_classification ? (
                              <Badge variant="outline">{competitor.device_classification}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const sourceConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className?: string }> = {
                                eudamed: { label: lang('marketAnalysis.competition.sources.eudamed'), variant: 'default', className: 'bg-blue-500 hover:bg-blue-600' },
                                fda: { label: lang('marketAnalysis.competition.sources.fda'), variant: 'default', className: 'bg-green-600 hover:bg-green-700' },
                                global: { label: lang('marketAnalysis.competition.sources.global'), variant: 'default', className: 'bg-purple-600 hover:bg-purple-700' },
                                manual: { label: lang('marketAnalysis.competition.sources.manual'), variant: 'outline' }
                              };
                              const config = sourceConfig[source] || sourceConfig.manual;
                              return (
                                <Badge variant={config.variant} className={config.className}>
                                  {config.label}
                                </Badge>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCompetitor(competitor)}
                                disabled={disabled}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingCompetitorId(competitor.id)}
                                disabled={disabled}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              </div>
            </TabsContent>

            {/* EUDAMED Analysis Tab */}
            <TabsContent value="eudamed" className="space-y-4">
              {isGenesis && (
                <PlanRestrictionBanner
                  feature="EUDAMED Market Analysis"
                  currentPlan="Genesis"
                  requiredPlan="Professional"
                  className="mb-4"
                />
              )}
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">🇪🇺 {lang('marketAnalysis.competition.eudamedAnalysis')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {emdnCode ? `${emdnCode} - ${emdnDetails?.description || ''}` : lang('marketAnalysis.competition.noEmdnCodeSet') || 'No EMDN code set'}
                  </p>
                </div>
                  <EmdnNavigationButton
                    disabled={!isGenesis === false ? true : false}
                    currentEmdnCode={emdnCode || ''}
                    startingEmdnCode={product?.emdn_code || emdnCode || ''}
                    onEmdnCodeChange={disabled ? undefined : onEmdnCodeChange}
                  />
              </div>
              <MarketLandscapeView
                emdnCode={emdnCode}
                fdaProductCode={undefined}
                className="border-0 shadow-none"
              />
            </TabsContent>

            {/* FDA Analysis Tab */}
            <TabsContent value="fda" className="space-y-4">
              {isGenesis && (
                <PlanRestrictionBanner
                  feature="FDA Market Analysis"
                  currentPlan="Genesis"
                  requiredPlan="Professional"
                  className="mb-4"
                />
              )}
              <div className="mb-6">
                <h3 className="text-lg font-semibold">🇺🇸 {lang('marketAnalysis.competition.fdaAnalysis')}</h3>
                <p className="text-sm text-muted-foreground">
                  {fdaProductCodeDescription || lang('marketAnalysis.competition.noFdaCodeSelected')}
                </p>
              </div>
              {fdaProductCode ? (
                <MarketLandscapeView
                  emdnCode={undefined}
                  fdaProductCode={fdaProductCode}
                  className="border-0 shadow-none"
                />
              ) : (
                <FDAProductCodeSelector
                  productId={productId}
                  currentFdaCode={fdaProductCode}
                  onCodeSelected={() => window.location.reload()}
                />
              )}
            </TabsContent>

            {/* Global Comparison Tab */}
            <TabsContent value="global" className="space-y-4">
              {isGenesis && (
                <PlanRestrictionBanner
                  feature="Global Market Comparison"
                  currentPlan="Genesis"
                  requiredPlan="XyregOS"
                  className="mb-4"
                />
              )}
              <div className="mb-6">
                <h3 className="text-lg font-semibold">🌍 {lang('marketAnalysis.competition.globalComparison')}</h3>
                <p className="text-sm text-muted-foreground">
                  {lang('marketAnalysis.competition.euVsUsAnalysis')}
                </p>
              </div>
              <MarketLandscapeView
                emdnCode={emdnCode}
                fdaProductCode={fdaProductCode}
                className="border-0 shadow-none"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ManualCompetitorDialog
        open={showManualDialog && !disabled}
        onOpenChange={handleDialogClose}
        productId={productId}
        competitor={editingCompetitor}
        onSaved={handleCompetitorSaved}
        disabled={disabled}
      />

      <AlertDialog open={!!deletingCompetitorId} onOpenChange={() => setDeletingCompetitorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang('marketAnalysis.competition.deleteCompetitor')}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang('marketAnalysis.competition.deleteConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCompetitorId && handleDeleteCompetitor(deletingCompetitorId)}
            >
              {lang('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
