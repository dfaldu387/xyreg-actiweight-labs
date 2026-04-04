import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Package, 
  Users, 
  Network,
  AlertCircle,
  CheckCircle2,
  Percent
} from 'lucide-react';
import { useCompanyBasicUDIGroups } from '@/hooks/useCompanyBasicUDIGroups';
import { BasicUDIClusterCard } from './BasicUDIClusterCard';

interface BasicUDISiblingOverviewProps {
  companyId: string;
}

export function BasicUDISiblingOverview({ companyId }: BasicUDISiblingOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: clusters, isLoading, error } = useCompanyBasicUDIGroups(companyId);

  // Filter clusters based on search
  const filteredClusters = useMemo(() => {
    if (!clusters) return [];
    if (!searchQuery.trim()) return clusters;

    const query = searchQuery.toLowerCase();
    return clusters.filter(cluster => 
      cluster.basicUDI.toLowerCase().includes(query) ||
      cluster.products.some(p => 
        p.name.toLowerCase().includes(query) ||
        p.trade_name?.toLowerCase().includes(query) ||
        p.model_reference?.toLowerCase().includes(query)
      ) ||
      cluster.siblingGroups.some(g => 
        g.name.toLowerCase().includes(query)
      )
    );
  }, [clusters, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!clusters) return {
      totalClusters: 0,
      totalProducts: 0,
      totalGroups: 0,
      groupedProducts: 0,
      ungroupedProducts: 0,
      completionRate: 0,
    };

    const totalClusters = clusters.length;
    const totalProducts = clusters.reduce((sum, c) => sum + c.totalCount, 0);
    const totalGroups = clusters.reduce((sum, c) => sum + c.siblingGroups.length, 0);
    const groupedProducts = clusters.reduce((sum, c) => sum + c.groupedCount, 0);
    const ungroupedProducts = clusters.reduce((sum, c) => sum + c.ungroupedCount, 0);
    const completionRate = totalProducts > 0 
      ? Math.round((groupedProducts / totalProducts) * 100)
      : 0;

    return {
      totalClusters,
      totalProducts,
      totalGroups,
      groupedProducts,
      ungroupedProducts,
      completionRate,
    };
  }, [clusters]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Basic UDI-DI Sibling Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Basic UDI-DI Sibling Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load sibling overview</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Basic UDI-DI Sibling Overview
          </CardTitle>
          <CardDescription>
            Manage product families and sibling groups across your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Network className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  Basic UDI-DI Clusters
                </span>
              </div>
              <div className="text-2xl font-bold">{stats.totalClusters}</div>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  Total Products
                </span>
              </div>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  Sibling Groups
                </span>
              </div>
              <div className="text-2xl font-bold">{stats.totalGroups}</div>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  Completion
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{stats.completionRate}%</div>
                {stats.completionRate === 100 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="secondary" className="px-3 py-1">
              {stats.groupedProducts} Grouped
            </Badge>
            {stats.ungroupedProducts > 0 && (
              <Badge variant="outline" className="px-3 py-1">
                {stats.ungroupedProducts} Ungrouped
              </Badge>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Basic UDI-DI, product name, or group..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clusters */}
      {filteredClusters.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-1">
                {searchQuery ? 'No matching clusters found' : 'No Basic UDI-DI clusters found'}
              </p>
              <p className="text-sm">
                {searchQuery 
                  ? 'Try adjusting your search criteria'
                  : 'Products need a Basic UDI-DI to appear here'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredClusters.map((cluster) => (
            <BasicUDIClusterCard
              key={cluster.basicUDI}
              cluster={cluster}
              companyId={companyId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
