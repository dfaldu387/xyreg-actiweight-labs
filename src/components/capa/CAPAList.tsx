import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, MoreHorizontal, ExternalLink, AlertTriangle, Clock } from 'lucide-react';
import { CAPARecord, CAPAStatus, CAPA_STATUS_LABELS, CAPA_SOURCE_LABELS, calculateRiskLevel } from '@/types/capa';
import { CAPAStatusBadge } from './CAPAStateProgress';
import { format, differenceInDays } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

interface CAPAListProps {
  capas: CAPARecord[];
  isLoading?: boolean;
  onCAPAClick?: (capa: CAPARecord) => void;
  showProduct?: boolean;
}

export function CAPAList({ capas, isLoading, onCAPAClick, showProduct = false }: CAPAListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const { lang } = useTranslation();

  const filteredCAPAs = useMemo(() => {
    return capas.filter((capa) => {
      const matchesSearch =
        capa.capa_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        capa.problem_description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || capa.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || capa.source_type === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [capas, searchQuery, statusFilter, sourceFilter]);

  const getRiskBadge = (severity: number | null, probability: number | null) => {
    const level = calculateRiskLevel(severity, probability);
    if (!level) return null;

    const colors = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };

    return (
      <Badge variant="outline" className={colors[level]}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Badge>
    );
  };

  const getAgingIndicator = (capa: CAPARecord) => {
    if (capa.status === 'closed' || capa.status === 'rejected') return null;

    const daysOpen = differenceInDays(new Date(), new Date(capa.created_at));

    if (capa.target_closure_date) {
      const daysUntilDue = differenceInDays(new Date(capa.target_closure_date), new Date());
      if (daysUntilDue < 0) {
        return (
          <span className="flex items-center text-destructive text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {Math.abs(daysUntilDue)}d {lang('capa.overdue')}
          </span>
        );
      }
      if (daysUntilDue <= 7) {
        return (
          <span className="flex items-center text-amber-600 dark:text-amber-400 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {daysUntilDue}d {lang('capa.left')}
          </span>
        );
      }
    }

    return (
      <span className="text-muted-foreground text-xs">
        {daysOpen}d {lang('capa.open')}
      </span>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={lang('capa.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={lang('capa.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang('capa.allStatuses')}</SelectItem>
            {Object.entries(CAPA_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={lang('capa.source')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang('capa.allSources')}</SelectItem>
            {Object.entries(CAPA_SOURCE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {lang('capa.showingResults', { count: filteredCAPAs.length, total: capas.length })}
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">{lang('capa.capaId')}</TableHead>
              <TableHead>{lang('capa.problemDescription')}</TableHead>
              <TableHead className="w-[100px]">{lang('capa.status')}</TableHead>
              <TableHead className="w-[100px]">{lang('capa.source')}</TableHead>
              <TableHead className="w-[80px]">{lang('capa.risk')}</TableHead>
              <TableHead className="w-[100px]">{lang('capa.aging')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCAPAs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {lang('capa.noCAPAsFound')}
                </TableCell>
              </TableRow>
            ) : (
              filteredCAPAs.map((capa) => (
                <TableRow
                  key={capa.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onCAPAClick?.(capa)}
                >
                  <TableCell className="font-mono text-sm font-medium">
                    {capa.capa_id}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px] truncate" title={capa.problem_description}>
                      {capa.problem_description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CAPAStatusBadge status={capa.status} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {CAPA_SOURCE_LABELS[capa.source_type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getRiskBadge(capa.severity, capa.probability)}
                  </TableCell>
                  <TableCell>
                    {getAgingIndicator(capa)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onCAPAClick?.(capa)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {lang('capa.viewDetails')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
