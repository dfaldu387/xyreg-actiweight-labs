import React, { useState } from 'react';
import { Plus, FileText, Calendar, User, Trash2, Eye, Download, Search, Brain, Filter, BarChart3, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReportUploadDialog } from './ReportUploadDialog';
import { ReportViewDialog } from './ReportViewDialog';
import { ReportSearchDialog } from './ReportSearchDialog';
import { SearchHistoryPanel } from './SearchHistoryPanel';
import { MarketReportViewer } from './MarketReportViewer';
import { TrendAnalysisPanel } from './TrendAnalysisPanel';
import { ContextualSuggestionsPanel } from './ContextualSuggestionsPanel';
import { SavedQueriesManager } from './SavedQueriesManager';
import { AIStatusIndicator } from '@/components/document-composer/AIStatusIndicator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

interface MarketReport {
  id: string;
  title: string;
  source: string;
  report_date: string | null;
  description: string | null;
  file_name: string | null;
  file_storage_path: string | null;
  upload_timestamp: string;
  status: string;
  uploaded_by_user_id: string;
  executive_summary?: string;
  key_findings?: string[];
  strategic_recommendations?: string[];
  market_size_data?: any;
  processing_error?: string;
}

interface MarketIntelligenceDashboardProps {
  companyId: string;
  disabled?: boolean;
}

export function MarketIntelligenceDashboard({ companyId, disabled = false }: MarketIntelligenceDashboardProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<MarketReport | null>(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [reportViewerOpen, setReportViewerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { lang } = useTranslation();

  // Fetch market reports
  const { data: reports, isLoading } = useQuery({
    queryKey: ['market-reports', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_reports')
        .select('*')
        .eq('company_id', companyId)
        .order('upload_timestamp', { ascending: false });

      if (error) throw error;
      return data as MarketReport[];
    },
  });

  // Retry processing mutation
  const retryProcessingMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase.functions.invoke('process-market-report', {
        body: { report_id: reportId }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-reports', companyId] });
      toast({
        title: lang('marketAnalysis.toasts.processingRestarted'),
        description: lang('marketAnalysis.toasts.processingRestartedDesc'),
      });
    },
    onError: (error) => {
      toast({
        title: lang('marketAnalysis.toasts.retryFailed'),
        description: lang('marketAnalysis.toasts.retryFailedDesc'),
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('market_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-reports', companyId] });
      toast({
        title: lang('marketAnalysis.toasts.reportDeleted'),
        description: lang('marketAnalysis.toasts.reportDeletedDesc'),
      });
    },
    onError: (error) => {
      toast({
        title: lang('marketAnalysis.toasts.deleteFailed'),
        description: lang('marketAnalysis.toasts.deleteFailedDesc'),
        variant: "destructive",
      });
    },
  });

  const handleDelete = (report: MarketReport) => {
    if (disabled) return;
    if (window.confirm(lang('marketAnalysis.confirmations.deleteReport').replace('{{title}}', report.title))) {
      deleteMutation.mutate(report.id);
    }
  };

  const handleRetryProcessing = (report: MarketReport) => {
    if (disabled) return;
    if (window.confirm(lang('marketAnalysis.confirmations.retryProcessing').replace('{{title}}', report.title))) {
      retryProcessingMutation.mutate(report.id);
    }
  };

  const handleView = (report: MarketReport) => {
    setViewingReport(report);
    setReportViewerOpen(true);
  };

  const handleSearchQuerySelect = (query: string) => {
    setSearchQuery(query);
    setSearchDialogOpen(true);
  };

  const downloadFile = async (report: MarketReport) => {
    if (!report.file_storage_path) return;

    try {
      const { data, error } = await supabase.storage
        .from('market-intelligence-reports')
        .download(report.file_storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.file_name || 'report';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: lang('marketAnalysis.toasts.downloadFailed'),
        description: lang('marketAnalysis.toasts.downloadFailedDesc'),
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'Uploaded': 'default',
      'Processing': 'secondary',
      'Processed': 'default',
      'Error': 'destructive',
    } as const;

    const icon = status === 'Processing' ? (
      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
    ) : null;

    return (
      <Badge variant={statusColors[status as keyof typeof statusColors] || 'default'} className="flex items-center">
        {icon}
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{lang('marketAnalysis.marketIntelligence.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{lang('marketAnalysis.marketIntelligence.title')}</h2>
          <p className="text-muted-foreground">
            {lang('marketAnalysis.marketIntelligence.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => !disabled && setSearchDialogOpen(true)}
            className="flex items-center gap-2"
            disabled={disabled}
          >
            <Brain className="h-4 w-4" />
            {lang('marketAnalysis.marketIntelligence.askReports')}
          </Button>
          <Button onClick={() => !disabled && setUploadDialogOpen(true)} disabled={disabled}>
            <Plus className="mr-2 h-4 w-4" />
            {lang('marketAnalysis.marketIntelligence.uploadNewReport')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {lang('marketAnalysis.tabs2.overview')}
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {lang('marketAnalysis.tabs2.trendsInsights')}
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            {lang('marketAnalysis.tabs2.aiSuggestions')}
          </TabsTrigger>
          <TabsTrigger value="queries" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            {lang('marketAnalysis.tabs2.savedQueries')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

      {/* AI Search Bar */}
      {reports && reports.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  {lang('marketAnalysis.askReports.title')}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {lang('marketAnalysis.askReports.subtitle')}
                </p>
              </div>
              <div className="flex gap-2 max-w-2xl mx-auto">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Button
                    variant="outline"
                    className="w-full justify-start pl-10 text-muted-foreground h-12"
                    onClick={() => !disabled && setSearchDialogOpen(true)}
                    disabled={disabled}
                  >
                    {lang('marketAnalysis.askReports.placeholder')}
                  </Button>
                </div>
                <Button
                  onClick={() => !disabled && setSearchDialogOpen(true)}
                  size="lg"
                  className="h-12 px-6"
                  disabled={disabled}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {lang('marketAnalysis.askReports.search')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

        {!reports || reports.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{lang('marketAnalysis.emptyState.noReports')}</h3>
              <p className="text-muted-foreground mb-4">
                {lang('marketAnalysis.emptyState.noReportsDescription')}
              </p>
              <Button onClick={() => !disabled && setUploadDialogOpen(true)} disabled={disabled}>
                <Plus className="mr-2 h-4 w-4" />
                {lang('marketAnalysis.marketIntelligence.uploadFirstReport')}
              </Button>
            </div>
          </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reports Table */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{lang('marketAnalysis.reportsTable.title')}</CardTitle>
                  <CardDescription>
                    {reports.length} {lang('marketAnalysis.reportsTable.reportsAvailable')}
                  </CardDescription>
                </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{lang('marketAnalysis.reportsTable.reportTitle')}</TableHead>
                  <TableHead>{lang('marketAnalysis.reportsTable.source')}</TableHead>
                  <TableHead>{lang('marketAnalysis.reportsTable.reportDate')}</TableHead>
                  <TableHead>{lang('marketAnalysis.reportsTable.uploaded')}</TableHead>
                  <TableHead>{lang('marketAnalysis.reportsTable.status')}</TableHead>
                  <TableHead className="text-right">{lang('marketAnalysis.reportsTable.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                          {report.title}
                        </div>
                        {report.executive_summary && report.status === 'Processed' && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {report.executive_summary.substring(0, 100)}...
                          </p>
                        )}
                        {report.processing_error && report.status === 'Error' && (
                          <p className="text-xs text-destructive">
                            {lang('marketAnalysis.reportsTable.error')}: {report.processing_error}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{report.source}</TableCell>
                    <TableCell>
                      {report.report_date ? (
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {format(new Date(report.report_date), 'MMM d, yyyy')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="mr-1 h-3 w-3" />
                        {format(new Date(report.upload_timestamp), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                     <TableCell className="text-right">
                       <div className="flex justify-end space-x-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleView(report)}
                         >
                           <Eye className="h-4 w-4" />
                         </Button>
                         {report.status === 'Error' && (
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleRetryProcessing(report)}
                             className="text-orange-600 hover:text-orange-600"
                             disabled={disabled}
                           >
                             <Brain className="h-4 w-4" />
                           </Button>
                         )}
                         {report.file_storage_path && (
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => downloadFile(report)}
                           >
                             <Download className="h-4 w-4" />
                           </Button>
                         )}
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleDelete(report)}
                           className="text-destructive hover:text-destructive"
                           disabled={disabled}
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </CardContent>
              </Card>
            </div>

            {/* Search History Sidebar */}
            <div className="lg:col-span-1">
              <SearchHistoryPanel
                companyId={companyId}
                userId={user?.id || ""}
                onQuerySelect={handleSearchQuerySelect}
                disabled={disabled}
              />
            </div>
          </div>
        )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <TrendAnalysisPanel companyId={companyId} disabled={disabled} />
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          <AIStatusIndicator className="mb-4" />
          <ContextualSuggestionsPanel companyId={companyId} disabled={disabled} />
        </TabsContent>

        <TabsContent value="queries" className="space-y-6">
          <SavedQueriesManager
            companyId={companyId}
            userId={user?.id || ""}
            onQuerySelect={handleSearchQuerySelect}
            disabled={disabled}
          />
        </TabsContent>
      </Tabs>

      <ReportUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        companyId={companyId}
      />

      <MarketReportViewer
        open={reportViewerOpen}
        onOpenChange={(open) => {
          setReportViewerOpen(open);
          if (!open) setViewingReport(null);
        }}
        report={viewingReport}
        companyId={companyId}
      />

      {viewingReport && (
        <ReportViewDialog
          report={viewingReport}
          open={!!viewingReport && !reportViewerOpen}
          onOpenChange={(open) => !open && setViewingReport(null)}
        />
      )}

      <ReportSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        companyId={companyId}
        userId={user?.id || ""}
      />

    </div>
  );
}