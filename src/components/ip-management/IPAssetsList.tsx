import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Lightbulb, FileText, Shield, Lock, PenTool } from 'lucide-react';
import { useIPAssets, IPAsset } from '@/hooks/useIPAssets';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

interface IPAssetsListProps {
  companyId: string;
  onCreateNew: () => void;
  onSelectAsset: (asset: IPAsset) => void;
  disabled?: boolean;
}

const IP_TYPE_ICONS = {
  patent: FileText,
  trademark: Shield,
  copyright: PenTool,
  trade_secret: Lock,
  design_right: Lightbulb,
};

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  granted: 'default',
  pending: 'secondary',
  filing_prep: 'secondary',
  disclosure: 'outline',
  idea: 'outline',
  abandoned: 'destructive',
  expired: 'destructive',
};

export function IPAssetsList({ companyId, onCreateNew, onSelectAsset, disabled }: IPAssetsListProps) {
  const { data: assets, isLoading } = useIPAssets(companyId);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { lang } = useTranslation();

  const IP_TYPE_LABELS: Record<string, string> = {
    patent: lang('ipPortfolio.ipTypes.patent'),
    trademark: lang('ipPortfolio.ipTypes.trademark'),
    copyright: lang('ipPortfolio.ipTypes.copyright'),
    trade_secret: lang('ipPortfolio.ipTypes.tradeSecret'),
    design_right: lang('ipPortfolio.ipTypes.designRight'),
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredAssets = assets?.filter(asset => {
    const matchesSearch = asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.internal_reference?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || asset.ip_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              {lang('ipPortfolio.assetsList.title')}
            </CardTitle>
            <CardDescription>{lang('ipPortfolio.assetsList.description')}</CardDescription>
          </div>
          <Button onClick={onCreateNew} disabled={disabled}>
            <Plus className="h-4 w-4 mr-2" />
            {lang('ipPortfolio.assetsList.addAsset')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={lang('ipPortfolio.assetsList.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={lang('ipPortfolio.assetsList.ipType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang('ipPortfolio.assetsList.allTypes')}</SelectItem>
              <SelectItem value="patent">{lang('ipPortfolio.ipTypes.patent')}</SelectItem>
              <SelectItem value="trademark">{lang('ipPortfolio.ipTypes.trademark')}</SelectItem>
              <SelectItem value="copyright">{lang('ipPortfolio.ipTypes.copyright')}</SelectItem>
              <SelectItem value="trade_secret">{lang('ipPortfolio.ipTypes.tradeSecret')}</SelectItem>
              <SelectItem value="design_right">{lang('ipPortfolio.ipTypes.designRight')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={lang('ipPortfolio.assetsList.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang('ipPortfolio.assetsList.allStatuses')}</SelectItem>
              <SelectItem value="idea">{lang('ipPortfolio.statuses.idea')}</SelectItem>
              <SelectItem value="disclosure">{lang('ipPortfolio.statuses.disclosure')}</SelectItem>
              <SelectItem value="filing_prep">{lang('ipPortfolio.statuses.filingPrep')}</SelectItem>
              <SelectItem value="pending">{lang('ipPortfolio.statuses.pending')}</SelectItem>
              <SelectItem value="granted">{lang('ipPortfolio.statuses.granted')}</SelectItem>
              <SelectItem value="abandoned">{lang('ipPortfolio.statuses.abandoned')}</SelectItem>
              <SelectItem value="expired">{lang('ipPortfolio.statuses.expired')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Asset List */}
        {filteredAssets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">
              {assets?.length === 0
                ? lang('ipPortfolio.assetsList.noAssetsRecorded')
                : lang('ipPortfolio.assetsList.noMatchingAssets')}
            </p>
            {assets?.length === 0 && (
              <Button variant="outline" onClick={onCreateNew} disabled={disabled}>
                <Plus className="h-4 w-4 mr-2" />
                {lang('ipPortfolio.assetsList.addFirstAsset')}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAssets.map((asset) => {
              const Icon = IP_TYPE_ICONS[asset.ip_type];
              return (
                <div
                  key={asset.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-accent/50 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!disabled) {
                      onSelectAsset(asset);
                    }
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {asset.title}
                        <Badge variant="outline" className="text-xs">
                          {IP_TYPE_LABELS[asset.ip_type]}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                        {asset.internal_reference && <span>{lang('ipPortfolio.assetsList.ref').replace('{{reference}}', asset.internal_reference)}</span>}
                        {asset.priority_date && (
                          <span>{lang('ipPortfolio.assetsList.priority').replace('{{date}}', format(new Date(asset.priority_date), 'MMM dd, yyyy'))}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant={STATUS_COLORS[asset.status]} className="capitalize">
                    {asset.status.replace('_', ' ')}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
