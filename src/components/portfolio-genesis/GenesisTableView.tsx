import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, Search, Download, Check, X, ExternalLink } from 'lucide-react';
import type { DeviceGenesisMetrics } from '@/hooks/usePortfolioGenesisMetrics';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface GenesisTableViewProps {
  devices: DeviceGenesisMetrics[];
}

type SortField = 'productName' | 'readinessPercentage' | 'viabilityScore' | 'deviceClass';
type SortDirection = 'asc' | 'desc';

export function GenesisTableView({ devices }: GenesisTableViewProps) {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('readinessPercentage');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredDevices = devices.filter(d =>
    d.productName.toLowerCase().includes(search.toLowerCase())
  );

  const sortedDevices = [...filteredDevices].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const modifier = sortDirection === 'asc' ? 1 : -1;
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * modifier;
    }
    return ((aVal as number) - (bVal as number)) * modifier;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const exportToCsv = () => {
    const headers = ['Device Name', 'Class', 'Phase', 'Readiness %', 'Viability Score', 'TAM', 'Device Desc', 'Viability', 'Blueprint', 'Canvas', 'Team', 'Gates', 'Clinical', 'Market', 'Reimburse'];
    const rows = sortedDevices.map(d => [
      d.productName,
      d.deviceClass || '',
      d.lifecyclePhase || '',
      d.readinessPercentage,
      d.viabilityScore || '',
      d.tamValue || '',
      d.checklistCompletion.deviceDescription ? 'Yes' : 'No',
      d.checklistCompletion.viabilityScorecard ? 'Yes' : 'No',
      d.checklistCompletion.ventureBlueprint ? 'Yes' : 'No',
      d.checklistCompletion.businessCanvas ? 'Yes' : 'No',
      d.checklistCompletion.teamProfile ? 'Yes' : 'No',
      d.checklistCompletion.essentialGates ? 'Yes' : 'No',
      d.checklistCompletion.clinicalEvidence ? 'Yes' : 'No',
      d.checklistCompletion.marketSizing ? 'Yes' : 'No',
      d.checklistCompletion.reimbursementStrategy ? 'Yes' : 'No',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio-genesis-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getReadinessBadge = (percentage: number) => {
    if (percentage >= 80) return <Badge className="bg-emerald-100 text-emerald-700">{percentage}%</Badge>;
    if (percentage >= 50) return <Badge className="bg-amber-100 text-amber-700">{percentage}%</Badge>;
    return <Badge className="bg-red-100 text-red-700">{percentage}%</Badge>;
  };

  const CheckIcon = ({ complete }: { complete: boolean }) => (
    <div className={cn(
      "w-5 h-5 rounded-full flex items-center justify-center",
      complete ? "bg-emerald-100" : "bg-red-100"
    )}>
      {complete ? <Check className="h-3 w-3 text-emerald-600" /> : <X className="h-3 w-3 text-red-600" />}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{lang('portfolioGenesis.deviceGenesisOverview')}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={lang('portfolioGenesis.searchDevices')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>
            <Button variant="outline" size="sm" onClick={exportToCsv}>
              <Download className="h-4 w-4 mr-2" />
              {lang('portfolioGenesis.exportCsv')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('productName')}>
                  <div className="flex items-center gap-1">
                    {lang('portfolioGenesis.device')} <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('deviceClass')}>
                  <div className="flex items-center gap-1">
                    {lang('portfolioGenesis.class')} <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>{lang('portfolioGenesis.phase')}</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('readinessPercentage')}>
                  <div className="flex items-center gap-1">
                    {lang('portfolioGenesis.readiness')} <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('viabilityScore')}>
                  <div className="flex items-center gap-1">
                    {lang('portfolioGenesis.viability')} <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="text-center" title={lang('portfolioGenesis.deviceDescription')}>Desc</TableHead>
                <TableHead className="text-center" title={lang('portfolioGenesis.viabilityScorecard')}>Via</TableHead>
                <TableHead className="text-center" title={lang('portfolioGenesis.ventureBlueprint')}>BP</TableHead>
                <TableHead className="text-center" title={lang('portfolioGenesis.businessCanvas')}>Can</TableHead>
                <TableHead className="text-center" title={lang('portfolioGenesis.teamProfile')}>Team</TableHead>
                <TableHead className="text-center" title={lang('portfolioGenesis.essentialGates')}>Gate</TableHead>
                <TableHead className="text-center" title={lang('portfolioGenesis.clinicalEvidence')}>Clin</TableHead>
                <TableHead className="text-center" title={lang('portfolioGenesis.marketSizing')}>Mkt</TableHead>
                <TableHead className="text-center" title={lang('portfolioGenesis.reimbursement')}>Reimb</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDevices.map(device => (
                <TableRow key={device.productId} className="hover:bg-muted/50">
                  <TableCell className="font-medium max-w-[150px] truncate" title={device.productName}>
                    {device.productName}
                  </TableCell>
                  <TableCell>
                    {device.deviceClass && <Badge variant="outline">{device.deviceClass}</Badge>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[100px] truncate">
                    {device.lifecyclePhase || '-'}
                  </TableCell>
                  <TableCell>{getReadinessBadge(device.readinessPercentage)}</TableCell>
                  <TableCell>{device.viabilityScore ?? '-'}</TableCell>
                  <TableCell className="text-center"><CheckIcon complete={device.checklistCompletion.deviceDescription} /></TableCell>
                  <TableCell className="text-center"><CheckIcon complete={device.checklistCompletion.viabilityScorecard} /></TableCell>
                  <TableCell className="text-center"><CheckIcon complete={device.checklistCompletion.ventureBlueprint} /></TableCell>
                  <TableCell className="text-center"><CheckIcon complete={device.checklistCompletion.businessCanvas} /></TableCell>
                  <TableCell className="text-center"><CheckIcon complete={device.checklistCompletion.teamProfile} /></TableCell>
                  <TableCell className="text-center"><CheckIcon complete={device.checklistCompletion.essentialGates} /></TableCell>
                  <TableCell className="text-center"><CheckIcon complete={device.checklistCompletion.clinicalEvidence} /></TableCell>
                  <TableCell className="text-center"><CheckIcon complete={device.checklistCompletion.marketSizing} /></TableCell>
                  <TableCell className="text-center"><CheckIcon complete={device.checklistCompletion.reimbursementStrategy} /></TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/app/product/${device.productId}/business-case?tab=venture-blueprint`)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
