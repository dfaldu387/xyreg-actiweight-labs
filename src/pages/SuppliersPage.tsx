import React, { useState } from 'react';
import { Plus, Search, Filter, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/context/AuthContext';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useSupplierMaterialCounts } from '@/hooks/useMaterialSuppliers';
import { SuppliersTable } from '@/components/suppliers/SuppliersTable';
import { AddSupplierDialog } from '@/components/suppliers/AddSupplierDialog';
import { SupplierFilters } from '@/components/suppliers/SupplierFilters';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { buildCompanyBreadcrumbs } from '@/utils/breadcrumbUtils';
import { useNavigate } from 'react-router-dom';
import type { Supplier } from '@/types/supplier';

export default function SuppliersPage() {
  const { activeCompanyRole } = useCompanyRole();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [criticalityFilter, setCriticalityFilter] = useState<string>('all');
  const [supplierTypeFilter, setSupplierTypeFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const companyId = activeCompanyRole?.companyId;
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
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">No company selected</p>
              <p className="text-sm text-muted-foreground">Please select a company to view suppliers</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center space-y-2">
              <p className="text-destructive">Error loading suppliers</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <Truck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Suppliers</h1>
            <p className="text-muted-foreground">
              Manage your supplier relationships and evaluations
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Probationary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.probationary}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name or scope..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Supplier
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <SupplierFilters
              statusFilter={statusFilter}
              criticalityFilter={criticalityFilter}
              supplierTypeFilter={supplierTypeFilter}
              onStatusFilterChange={setStatusFilter}
              onCriticalityFilterChange={setCriticalityFilter}
              onSupplierTypeFilterChange={setSupplierTypeFilter}
            />
          )}
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Suppliers ({filteredSuppliers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No suppliers found matching your criteria.
            </div>
          ) : (
            <SuppliersTable suppliers={filteredSuppliers} materialCounts={materialCounts} />
          )}
        </CardContent>
      </Card>

      {/* Add Supplier Dialog */}
      <AddSupplierDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        companyId={activeCompanyRole?.companyId || ''}
        userId={user?.id || ''}
      />
    </div>
  );
}