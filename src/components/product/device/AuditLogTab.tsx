import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, SearchIcon, FilterIcon, DownloadIcon, RefreshCwIcon, AlertCircleIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useProductAuditLogs } from '@/hooks/useProductAuditLogs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from '@/hooks/useTranslation';

interface AuditLogTabProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function AuditLogTab({ productId, companyId, disabled = false }: AuditLogTabProps) {
  const { lang } = useTranslation();
  const {
    auditLogs,
    filteredLogs,
    stats,
    isLoading,
    isRefreshing,
    error,
    totalCount,
    filters,
    setFilters,
    refreshLogs,
    loadMore,
    exportLogs,
    createAuditLog
  } = useProductAuditLogs({
    productId,
    companyId,
    autoRefresh: true,
    refreshInterval: 30000 // 30 seconds
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Update filters when local state changes
  useEffect(() => {
    if (disabled) return;
    setFilters({
      ...filters,
      searchTerm,
      actionFilter,
      entityFilter,
      dateFilter
    });
  }, [searchTerm, actionFilter, entityFilter, dateFilter, disabled]);

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'default';
      case 'UPDATE':
        return 'secondary';
      case 'DELETE':
        return 'destructive';
      case 'VIEW':
        return 'outline';
      case 'DOWNLOAD':
        return 'outline';
      case 'SHARE':
        return 'outline';
      case 'EXPORT':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getEntityTypeBadgeVariant = (entityType: string) => {
    switch (entityType) {
      case 'DOCUMENT':
        return 'default';
      case 'IMAGE':
        return 'secondary';
      case 'PRODUCT':
        return 'outline';
      case 'CONFIGURATION':
        return 'outline';
      case 'REVIEW':
        return 'outline';
      case 'COMMENT':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleExportAuditLogs = async () => {
    if (disabled) return;
    try {
      setIsExporting(true);
      const csvContent = await exportLogs();
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting audit logs:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">{lang('deviceAuditLog.title')}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {lang('deviceAuditLog.description')}
              </p>
              {stats && (
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{lang('deviceAuditLog.totalEntries')}: {stats.totalEntries}</span>
                  <span>{lang('deviceAuditLog.uniqueUsers')}: {stats.totalUsers}</span>
                  <span>{lang('deviceAuditLog.recentActivity')}: {stats.recentActivity}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => { if (!disabled) refreshLogs(); }}
                variant="outline"
                size="sm"
                disabled={disabled || isRefreshing}
              >
                <RefreshCwIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {lang('deviceAuditLog.refresh')}
              </Button>
              {/* <Button
                onClick={handleExportAuditLogs}
                variant="outline"
                size="sm"
                disabled={isExporting}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                {isExporting ? lang('deviceAuditLog.exporting') : lang('deviceAuditLog.exportCsv')}
              </Button> */}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={lang('deviceAuditLog.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => { if (!disabled) setSearchTerm(e.target.value); }}
                  className="pl-10"
                  disabled={disabled}
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={(value) => { if (!disabled) setActionFilter(value); }} disabled={disabled}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder={lang('deviceAuditLog.filters.action')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang('deviceAuditLog.filters.allActions')}</SelectItem>
                <SelectItem value="CREATE">{lang('deviceAuditLog.filters.created')}</SelectItem>
                <SelectItem value="UPDATE">{lang('deviceAuditLog.filters.updated')}</SelectItem>
                <SelectItem value="DELETE">{lang('deviceAuditLog.filters.deleted')}</SelectItem>
                <SelectItem value="VIEW">{lang('deviceAuditLog.filters.viewed')}</SelectItem>
                <SelectItem value="DOWNLOAD">{lang('deviceAuditLog.filters.downloaded')}</SelectItem>
                <SelectItem value="SHARE">{lang('deviceAuditLog.filters.shared')}</SelectItem>
                <SelectItem value="EXPORT">{lang('deviceAuditLog.filters.exported')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={(value) => { if (!disabled) setEntityFilter(value); }} disabled={disabled}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder={lang('deviceAuditLog.filters.entity')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang('deviceAuditLog.filters.allEntities')}</SelectItem>
                <SelectItem value="DOCUMENT">{lang('deviceAuditLog.filters.documents')}</SelectItem>
                <SelectItem value="IMAGE">{lang('deviceAuditLog.filters.images')}</SelectItem>
                <SelectItem value="PRODUCT">{lang('deviceAuditLog.filters.products')}</SelectItem>
                <SelectItem value="CONFIGURATION">{lang('deviceAuditLog.filters.configurations')}</SelectItem>
                <SelectItem value="REVIEW">{lang('deviceAuditLog.filters.reviews')}</SelectItem>
                <SelectItem value="COMMENT">{lang('deviceAuditLog.filters.comments')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={(value) => { if (!disabled) setDateFilter(value); }} disabled={disabled}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder={lang('deviceAuditLog.filters.date')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang('deviceAuditLog.filters.allTime')}</SelectItem>
                <SelectItem value="today">{lang('deviceAuditLog.filters.today')}</SelectItem>
                <SelectItem value="yesterday">{lang('deviceAuditLog.filters.yesterday')}</SelectItem>
                <SelectItem value="lastWeek">{lang('deviceAuditLog.filters.lastWeek')}</SelectItem>
                <SelectItem value="lastMonth">{lang('deviceAuditLog.filters.lastMonth')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audit Log Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">{lang('deviceAuditLog.table.timestamp')}</TableHead>
                  <TableHead className="w-24">{lang('deviceAuditLog.table.action')}</TableHead>
                  <TableHead className="w-24">{lang('deviceAuditLog.table.entity')}</TableHead>
                  <TableHead>{lang('deviceAuditLog.table.entityName')}</TableHead>
                  <TableHead className="w-32">{lang('deviceAuditLog.table.user')}</TableHead>
                  <TableHead>{lang('deviceAuditLog.table.description')}</TableHead>
                  <TableHead className="w-24">{lang('deviceAuditLog.table.ipAddress')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {isLoading ? lang('deviceAuditLog.loading') : lang('deviceAuditLog.noLogsFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(log.timestamp, 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)} className="text-xs">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEntityTypeBadgeVariant(log.entityType)} className="text-xs">
                          {log.entityType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.entityName}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{log.userName}</div>
                          <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.description}
                          {log.changes && log.changes.length > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {log.changes.map((change, index) => (
                                <div key={index}>
                                  {change.field}: {change.oldValue} → {change.newValue}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {log.ipAddress}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Load More Button */}
          {filteredLogs.length > 0 && filteredLogs.length < totalCount && (
            <div className="flex justify-center mt-4">
              <Button onClick={() => { if (!disabled) loadMore(); }} variant="outline" size="sm" disabled={disabled}>
                {lang('deviceAuditLog.loadMore')}
              </Button>
            </div>
          )}

          {/* Summary */}
          <div className="mt-4 text-sm text-muted-foreground">
            {lang('deviceAuditLog.showing')
              .replace('{count}', String(filteredLogs.length))
              .replace('{total}', String(totalCount))}
            {isRefreshing && ` (${lang('deviceAuditLog.refreshing')})`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}