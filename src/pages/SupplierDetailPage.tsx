import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupplier } from '@/hooks/useSuppliers';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatScopeOfSupply } from '@/utils/scopeOfSupply';
import { SupplierEvaluationTab } from '@/components/suppliers/SupplierEvaluationTab';
import { useTranslation } from '@/hooks/useTranslation';

export default function SupplierDetailPage() {
  const { lang } = useTranslation();
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const { data: supplier, isLoading, error } = useSupplier(supplierId!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-destructive">{lang('supplier.loadFailed')}</p>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {lang('supplier.goBack')}
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'default';
      case 'Probationary':
        return 'secondary';
      case 'Disqualified':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getCriticalityBadgeVariant = (criticality: string) => {
    return criticality === 'Critical' ? 'destructive' : 'outline';
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {lang('supplier.back')}
          </Button>
          <h1 className="text-2xl font-bold">{supplier.name}</h1>
        </div>
        <Button
          onClick={() => navigate(`/app/supplier/${supplierId}/edit`)}
        >
          <Edit className="mr-2 h-4 w-4" />
          {lang('supplier.editSupplier')}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{lang('supplier.basicInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">{lang('supplier.name')}</label>
              <p className="text-lg">{supplier.name}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{lang('supplier.status')}</label>
                <div className="mt-1">
                  <Badge variant={getStatusBadgeVariant(supplier.status)}>
                    {supplier.status === 'Approved' ? lang('supplier.statusApproved') :
                     supplier.status === 'Probationary' ? lang('supplier.statusProbationary') :
                     lang('supplier.statusDisqualified')}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{lang('supplier.criticality')}</label>
                <div className="mt-1">
                  <Badge variant={getCriticalityBadgeVariant(supplier.criticality)}>
                    {supplier.criticality === 'Critical' ? lang('supplier.critical') : lang('supplier.nonCritical')}
                  </Badge>
                </div>
              </div>
            </div>

            {supplier.status === 'Probationary' && supplier.probationary_reason && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="text-sm font-medium text-yellow-800 mb-1">
                  {lang('supplier.probationaryStatusReason')}:
                </div>
                <div className="text-sm text-yellow-700">
                  {supplier.probationary_reason}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{lang('supplier.contactInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supplier.contact_info?.email && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">{lang('supplier.email')}</label>
                <p>{supplier.contact_info.email}</p>
              </div>
            )}
            {supplier.contact_info?.phone && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">{lang('supplier.phone')}</label>
                <p>{supplier.contact_info.phone}</p>
              </div>
            )}
            {!supplier.contact_info?.email && !supplier.contact_info?.phone && (
              <p className="text-muted-foreground">{lang('supplier.noContactInfo')}</p>
            )}
          </CardContent>
        </Card>

        {supplier.scope_of_supply && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{lang('supplier.scopeOfSupply')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{formatScopeOfSupply(supplier.scope_of_supply)}</p>
            </CardContent>
          </Card>
        )}

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{lang('supplier.supplierEvaluation')}</CardTitle>
          </CardHeader>
          <CardContent>
            <SupplierEvaluationTab
              supplierId={supplier.id}
              companyId={supplier.company_id}
              supplierName={supplier.name}
              supplierCriticality={supplier.criticality as 'Critical' | 'Non-Critical'}
              scopeOfSupply={typeof supplier.scope_of_supply === 'string' ? supplier.scope_of_supply : undefined}
              supplierStatus={supplier.status}
              probationaryReason={supplier.probationary_reason}
              nextScheduledAudit={supplier.next_scheduled_audit}
              auditInterval={supplier.audit_interval}
              isEditMode={false}
              onEvaluationComplete={() => {
                console.log('Evaluation completed');
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}