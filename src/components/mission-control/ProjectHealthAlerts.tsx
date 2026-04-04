import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ShieldAlert, CheckCircle2, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { usePersonalAlerts, GroupedAlerts } from '@/hooks/usePersonalAlerts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ProjectHealthAlertsProps {
  companyId?: string;
}

const STORAGE_KEY_PREFIX = 'mc-health-filter-';

export function ProjectHealthAlerts({ companyId }: ProjectHealthAlertsProps) {
  const { lang } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['company-products-filter', companyId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('id, name')
        .eq('is_archived', false)
        .order('name');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data } = await query;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const storageKey = `${STORAGE_KEY_PREFIX}${companyId || 'all'}`;
  const [selectedProductIds, setSelectedProductIds] = useState<string[] | 'all'>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed === 'all' ? 'all' : (parsed as string[]);
      }
    } catch {}
    return 'all';
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(selectedProductIds));
  }, [selectedProductIds, storageKey]);

  const { groupedAlerts, totalAlerts, isLoading } = usePersonalAlerts({
    companyId,
    selectedProductIds,
  });

  const toggleProduct = (productId: string) => {
    if (selectedProductIds === 'all') {
      setSelectedProductIds(products.filter(p => p.id !== productId).map(p => p.id));
    } else {
      if (selectedProductIds.includes(productId)) {
        const newIds = selectedProductIds.filter(id => id !== productId);
        setSelectedProductIds(newIds.length === 0 ? 'all' : newIds);
      } else {
        const newIds = [...selectedProductIds, productId];
        if (newIds.length === products.length) {
          setSelectedProductIds('all');
        } else {
          setSelectedProductIds(newIds);
        }
      }
    }
  };

  const isProductSelected = (productId: string) => {
    return selectedProductIds === 'all' || selectedProductIds.includes(productId);
  };

  const filterLabel = selectedProductIds === 'all'
    ? lang('missionControl.allDevices')
    : `${(selectedProductIds as string[]).length} ${lang('missionControl.devicesSelected')}`;

  const alertsContent = isLoading ? (
    <div className="space-y-3">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  ) : groupedAlerts.length === 0 ? (
    <div className="flex items-center gap-3 py-6 justify-center text-muted-foreground">
      <CheckCircle2 className="h-8 w-8 text-green-500" />
      <div>
        <p className="font-medium text-foreground">{lang('missionControl.allClear')}</p>
        <p className="text-sm">{lang('missionControl.nothingNeedsAttentionToday')}</p>
      </div>
    </div>
  ) : (
    <div className="space-y-4">
      {groupedAlerts.map((group) => (
        <ProductAlertGroup key={group.productId} group={group} />
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5" />
              {lang('missionControl.projectHealthAlerts')}
            </CardTitle>
            <CardDescription className="mt-1">
              {totalAlerts === 0
                ? lang('missionControl.nothingNeedsAttention')
                : `${totalAlerts} ${totalAlerts === 1 ? lang('missionControl.issueRequiresAttention') : lang('missionControl.issuesRequireAttention')}`
              }
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {products.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-3.5 w-3.5" />
                    {filterLabel}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-3">
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    <div className="flex items-center space-x-2 pb-2 border-b border-border">
                      <Checkbox
                        id="all-devices"
                        checked={selectedProductIds === 'all'}
                        onCheckedChange={() => setSelectedProductIds('all')}
                      />
                      <Label htmlFor="all-devices" className="text-sm font-medium cursor-pointer">
                        {lang('missionControl.allDevices')}
                      </Label>
                    </div>
                    {products.map(product => (
                      <div key={product.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-${product.id}`}
                          checked={isProductSelected(product.id)}
                          onCheckedChange={() => toggleProduct(product.id)}
                        />
                        <Label
                          htmlFor={`filter-${product.id}`}
                          className="text-sm font-normal cursor-pointer flex-1 truncate"
                        >
                          {product.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isExpanded ? alertsContent : (
          isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : groupedAlerts.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {lang('missionControl.nothingNeedsAttention')}
            </div>
          ) : (
            <div className="text-sm">
              <span className="font-medium">{totalAlerts}</span>{' '}
              {totalAlerts === 1 ? lang('missionControl.issueRequiresAttention') : lang('missionControl.issuesRequireAttention')}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

function ProductAlertGroup({ group }: { group: GroupedAlerts }) {
  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant={group.maxSeverity === 'critical' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {group.maxSeverity === 'critical' ? '🔴' : '🟡'} {group.alerts.length} {group.alerts.length === 1 ? 'issue' : 'issues'}
          </Badge>
          <span className="font-medium text-sm">{group.productName}</span>
        </div>
      </div>
      <div className="space-y-1.5 pl-1">
        {group.alerts.map((alert) => (
          <div key={alert.id} className="flex items-start gap-2 text-sm">
            <AlertTriangle className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${alert.severity === 'critical' ? 'text-destructive' : 'text-yellow-500'}`} />
            <div>
              <span className="font-medium">{alert.title}</span>
              <span className="text-muted-foreground ml-1.5">{alert.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
