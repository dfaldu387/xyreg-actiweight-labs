import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Search, Filter, Truck } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/context/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useSupplierMaterialCounts } from '@/hooks/useMaterialSuppliers';
import { SuppliersTable } from '@/components/suppliers/SuppliersTable';
import { AddSupplierDialog } from '@/components/suppliers/AddSupplierDialog';
import { SupplierFilters } from '@/components/suppliers/SupplierFilters';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { buildCompanyBreadcrumbs } from '@/utils/breadcrumbUtils';
import { useNavigate } from 'react-router-dom';
import type { Supplier } from '@/types/supplier';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';

export default function CompanySuppliersPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [criticalityFilter, setCriticalityFilter] = useState<string>('all');
  const [supplierTypeFilter, setSupplierTypeFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Restriction check - double security pattern (hooks must be called before any conditional returns)
  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.OPERATIONS_SUPPLIERS);
  const isRestricted = !isFeatureEnabled;

  const { data: suppliers = [], isLoading, error } = useSuppliers(companyId || '');
  const { data: materialCounts = {} } = useSupplierMaterialCounts(companyId || '');

  // Filter suppliers based on search and filters
  const filteredSuppliers = suppliers.filter((supplier: Supplier) => {
    const scopeText = typeof supplier.scope_of_supply === 'string' 
      ? supplier.scope_of_supply 
      : supplier.scope_of_supply?.category || '';
    
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scopeText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
    const matchesCriticality = criticalityFilter === 'all' || supplier.criticality === criticalityFilter;
    const matchesSupplierType = supplierTypeFilter === 'all' || supplier.supplier_type === supplierTypeFilter;
    
    return matchesSearch && matchesStatus && matchesCriticality && matchesSupplierType;
  });

  // Calculate stats
  const stats = {
    total: suppliers.length,
    approved: suppliers.filter(s => s.status === 'Approved').length,
    probationary: suppliers.filter(s => s.status === 'Probationary').length,
    critical: suppliers.filter(s => s.criticality === 'Critical').length,
  };

  if (!companyId) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{lang('suppliers.loading')}</h1>
          <p className="text-muted-foreground">{lang('suppliers.resolvingCompany')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center space-y-2">
              <p className="text-destructive">{lang('suppliers.errorLoading')}</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleNavigateToClients = () => {
    navigate('/app/clients');
  };

  const handleNavigateToCompany = () => {
    if (companyName) {
      navigate(`/app/company/${encodeURIComponent(companyName)}`);
    }
  };

  const breadcrumbs = buildCompanyBreadcrumbs(
    companyName || 'Company',
    lang('suppliers.title'),
    handleNavigateToClients,
    handleNavigateToCompany
  );

  return (
    <RestrictedFeatureProvider
      isRestricted={isRestricted}
      planName={planName}
      featureName={lang('suppliers.featureName')}
    >
      <div className="space-y-6" data-tour="suppliers">
        <ConsistentPageHeader
          breadcrumbs={breadcrumbs}
          title={`${companyName} ${lang('suppliers.title')}`}
          subtitle={lang('suppliers.subtitle')}
          actions={
            <Button onClick={() => !isRestricted && setShowAddDialog(true)} disabled={isRestricted} data-tour="add-supplier">
              <Plus className="h-4 w-4 mr-2" />
              {lang('suppliers.actions.addSupplier')}
            </Button>
          }
        />

        {isRestricted && <RestrictedPreviewBanner />}

        <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{lang('suppliers.stats.totalSuppliers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{lang('suppliers.stats.approved')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{lang('suppliers.stats.probationary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.probationary}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{lang('suppliers.stats.criticalSuppliers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.critical}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="!p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={lang('suppliers.search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {lang('suppliers.filters.label')}
            </Button>
          </div>
          
          {showFilters && (
            <div className="mt-4">
              <SupplierFilters
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                criticalityFilter={criticalityFilter}
                onCriticalityFilterChange={setCriticalityFilter}
                supplierTypeFilter={supplierTypeFilter}
                onSupplierTypeFilterChange={setSupplierTypeFilter}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {lang('suppliers.title')} ({filteredSuppliers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <SuppliersTable suppliers={filteredSuppliers} disabled={isRestricted} materialCounts={materialCounts} />
          )}
        </CardContent>
      </Card>

        {/* Add Supplier Dialog */}
        <AddSupplierDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          companyId={companyId}
          userId={user?.id || ''}
        />
        </div>
      </div>
    </RestrictedFeatureProvider>
  );
}