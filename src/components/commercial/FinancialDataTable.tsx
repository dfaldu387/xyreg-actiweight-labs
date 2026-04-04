import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Save, X, Link2, Trash2 } from "lucide-react";
import { useCommercialData, useUpdateCommercialData } from '@/hooks/useCommercialData';
import { useEnhancedCommercialData } from '@/hooks/useEnhancedCommercialData';
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from '@/hooks/useTranslation';

interface FinancialDataItem {
  id: string;
  productName: string;
  platform: string;
  category: string;
  market: string;
  actualRevenue: number;
  actualCOGS: number;
  profitMargin: number;
  unitsSold: number;
  attributedRevenue?: number;
  revenueAttributions?: Array<{
    source_product_name?: string;
    target_product_name?: string;
    attribution_percentage: number;
    attributed_amount: number;
  }>;
}

interface FinancialDataTableProps {
  companyId: string;
  selectedMonth: Date;
  disabled?: boolean;
}

export function FinancialDataTable({ companyId, selectedMonth, disabled = false }: FinancialDataTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{[key: string]: {revenue: number, cogs: number, units: number}}>({});
  const [filters, setFilters] = useState({
    platform: '',
    category: '',
    model: '',
    product: '',
    market: ''
  });
  const { lang } = useTranslation();

  const queryClient = useQueryClient();
  const updateCommercialData = useUpdateCommercialData();

  // Fetch enhanced commercial data with attributions
  const { commercialData, attributions, loading: isLoading, error } = useEnhancedCommercialData(companyId, selectedMonth);

  // Transform the data to match our display format
  const transformedData = (commercialData || []).map(item => {
    // Find attributions for this product
    const productAttributions = attributions?.filter(attr => 
      attr.source_revenue_id === item.id || attr.target_product_id === item.product_id
    ) || [];
    
    // Calculate attributed revenue (placeholder logic)
    const attributedRevenue = productAttributions.length > 0 
      ? item.revenue_amount * 1.05  // Simple placeholder calculation
      : undefined;

    return {
      id: item.id,
      productName: item.products?.name || 'Unknown Device',
      platform: item.products?.product_platform || 'Unknown Platform',
      category: item.products?.device_category || 'Unknown Category',
      market: item.market_code || 'EU',
      actualRevenue: item.revenue_amount,
      actualCOGS: item.cogs_amount,
      profitMargin: item.profit_margin_percentage,
      unitsSold: item.units_sold,
      attributedRevenue,
      revenueAttributions: productAttributions.map(attr => ({
        source_product_name: 'Source Product', // Placeholder until we have full data structure
        target_product_name: 'Target Product', // Placeholder until we have full data structure
        attribution_percentage: attr.attribution_percentage || 0,
        attributed_amount: (attr.attribution_percentage || 0) * item.revenue_amount / 100
      }))
    };
  });

  // Get unique filter options from actual data
  const getUniqueFilterOptions = (field: keyof typeof transformedData[0]): string[] => {
    const uniqueValues = [...new Set(transformedData.map(item => String(item[field as keyof typeof item] || '')))];
    return (uniqueValues.filter(Boolean) as string[]).sort();
  };

  const calculateProfitMargin = (revenue: number, cogs: number): number => {
    if (revenue === 0) return 0;
    return Math.round(((revenue - cogs) / revenue) * 100);
  };

  const handleEdit = (id: string) => {
    if (disabled) return;
    const item = transformedData.find(d => d.id === id);
    if (item) {
      setEditingValues({
        ...editingValues,
        [id]: {
          revenue: item.actualRevenue,
          cogs: item.actualCOGS,
          units: item.unitsSold
        }
      });
    }
    setEditingId(id);
  };

  const handleSave = async (id: string) => {
    if (disabled) return;
    const values = editingValues[id];
    if (!values) return;

    try {
      await updateCommercialData.mutateAsync({
        id,
        revenue_amount: values.revenue,
        cogs_amount: values.cogs,
        units_sold: values.units
      });

      setEditingId(null);
      setEditingValues(prev => {
        const { [id]: removed, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error('Error updating commercial data:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (disabled) return;
    if (!confirm(lang('commercialPerformance.financialTable.deleteConfirm'))) return;

    try {
      await supabase.from('product_revenues').delete().eq('id', id);
      queryClient.invalidateQueries({ queryKey: ['commercial-data'] });
    } catch (error) {
      console.error('Error deleting commercial data:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingValues(prev => {
      const { [editingId!]: removed, ...rest } = prev;
      return rest;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredData = transformedData.filter(item => {
    return (
      (!filters.platform || item.platform.includes(filters.platform)) &&
      (!filters.category || item.category.includes(filters.category)) &&
      (!filters.market || item.market.includes(filters.market))
    );
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2 text-muted-foreground">{lang('commercialPerformance.financialTable.loading')}</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-destructive mb-2">{lang('commercialPerformance.financialTable.errorLoading')}</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Select value={filters.platform || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, platform: value === "all" ? "" : value }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={lang('commercialPerformance.financialTable.allPlatforms')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang('commercialPerformance.financialTable.allPlatforms')}</SelectItem>
            {getUniqueFilterOptions('platform').map(platform => (
              <SelectItem key={platform} value={platform}>{platform}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.category || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value === "all" ? "" : value }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={lang('commercialPerformance.financialTable.allCategories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang('commercialPerformance.financialTable.allCategories')}</SelectItem>
            {getUniqueFilterOptions('category').map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.market || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, market: value === "all" ? "" : value }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={lang('commercialPerformance.financialTable.allMarkets')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang('commercialPerformance.financialTable.allMarkets')}</SelectItem>
            {getUniqueFilterOptions('market').map(market => (
              <SelectItem key={market} value={market}>{market}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.product || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, product: value === "all" ? "" : value }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={lang('commercialPerformance.financialTable.allDevices')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang('commercialPerformance.financialTable.allDevices')}</SelectItem>
            {getUniqueFilterOptions('productName').map(product => (
              <SelectItem key={product} value={product}>{product}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{lang('commercialPerformance.financialTable.deviceName')}</TableHead>
              <TableHead>{lang('commercialPerformance.financialTable.platform')}</TableHead>
              <TableHead>{lang('commercialPerformance.financialTable.category')}</TableHead>
              <TableHead>{lang('commercialPerformance.financialTable.market')}</TableHead>
              <TableHead className="text-right">{lang('commercialPerformance.financialTable.actualRevenue')}</TableHead>
              <TableHead className="text-right">{lang('commercialPerformance.financialTable.attributedRevenue')}</TableHead>
              <TableHead className="text-right">{lang('commercialPerformance.financialTable.actualCogs')}</TableHead>
              <TableHead className="text-right">{lang('commercialPerformance.financialTable.profitMargin')}</TableHead>
              <TableHead className="text-right">{lang('commercialPerformance.financialTable.unitsSold')}</TableHead>
              <TableHead className="w-[100px]">{lang('commercialPerformance.financialTable.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.productName}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{item.platform}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.category}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="default">{item.market}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {editingId === item.id ? (
                    <Input
                      type="number"
                      value={editingValues[item.id]?.revenue || item.actualRevenue}
                      onChange={(e) => {
                        const revenue = parseFloat(e.target.value) || 0;
                        setEditingValues(prev => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], revenue }
                        }));
                      }}
                      className="w-24 text-right"
                    />
                  ) : (
                    formatCurrency(item.actualRevenue)
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {item.attributedRevenue ? (
                      <>
                        <span>{formatCurrency(item.attributedRevenue)}</span>
                        {item.revenueAttributions && item.revenueAttributions.length > 0 && (
                          <Link2 className="h-3 w-3 text-muted-foreground" />
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {editingId === item.id ? (
                    <Input
                      type="number"
                      value={editingValues[item.id]?.cogs || item.actualCOGS}
                      onChange={(e) => {
                        const cogs = parseFloat(e.target.value) || 0;
                        setEditingValues(prev => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], cogs }
                        }));
                      }}
                      className="w-24 text-right"
                    />
                  ) : (
                    formatCurrency(item.actualCOGS)
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {(() => {
                    const currentMargin = editingId === item.id && editingValues[item.id]
                      ? calculateProfitMargin(editingValues[item.id].revenue, editingValues[item.id].cogs)
                      : item.profitMargin;
                    
                    return (
                      <span className={`font-medium ${currentMargin > 35 ? 'text-green-600' : currentMargin > 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {currentMargin}%
                      </span>
                    );
                  })()}
                </TableCell>
                <TableCell className="text-right">
                  {item.unitsSold.toLocaleString()}
                </TableCell>
                <TableCell>
                  {editingId === item.id ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSave(item.id)}
                        disabled={disabled}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item.id)}
                        disabled={disabled}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(item.id)}
                        disabled={disabled}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {lang('commercialPerformance.financialTable.noData')}
        </div>
      )}
    </div>
  );
}