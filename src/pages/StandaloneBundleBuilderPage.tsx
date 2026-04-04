import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package2, Pencil, CheckCircle2, XCircle, TrendingUp, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BundleBuildTab } from '@/components/product/bundle/BundleBuildTab';
import { useBundleDetails } from '@/hooks/useProductBundleGroups';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { EditBundleDialog } from '@/components/product/bundle/EditBundleDialog';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useState } from 'react';

export default function StandaloneBundleBuilderPage() {
  const { bundleId } = useParams<{ bundleId: string }>();
  const navigate = useNavigate();
  const { companyRoles } = useCompanyRole();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Fetch bundle details to get company_id and bundle name
  const { data: bundleDetails, isLoading: bundleLoading, error: bundleError } = useBundleDetails(bundleId || '');
  
  // Fetch company name from company_id
  const { data: companyData, isLoading: companyLoading, error: companyError } = useQuery({
    queryKey: ['company-name', bundleDetails?.company_id],
    queryFn: async () => {
      if (!bundleDetails?.company_id) return null;
      
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', bundleDetails.company_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!bundleDetails?.company_id,
  });
  
  const isLoading = bundleLoading || companyLoading;
  const error = bundleError || companyError;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error || !bundleDetails || !companyData) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load bundle details. This bundle may not exist or you may not have access to it.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }
  
  // Security check: Verify user has access to this company
  const hasAccess = companyRoles.some(role => role.companyId === bundleDetails.company_id);
  
  if (!hasAccess) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Access denied. You do not have permission to view bundles for this company.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/app/clients')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Companies
        </Button>
      </div>
    );
  }
  
  const companyName = companyData.name;
  
  const breadcrumbs = [
    {
      label: 'Portfolio',
      href: `/app/company/${companyName}/portfolio`
    },
    {
      label: bundleDetails.bundle_name,
    }
  ];
  
  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{bundleDetails.bundle_name}</h1>
              {bundleDetails.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {bundleDetails.description}
                </p>
              )}
            </div>
          </div>
        }
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/app/company/${companyName}/portfolio?view=bundles`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bundle Projects
            </Button>
          </div>
        }
      />
      
      <div className="px-2 space-y-6">
        {/* Bundle Overview Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Bundle Overview</CardTitle>
                <CardDescription>
                  Bundle configuration and settings
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Bundle
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Bundle Name</label>
                <p className="text-base mt-1">{bundleDetails.bundle_name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <div className="mt-1">
                  {bundleDetails.is_feasibility_study ? (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Feasibility Study
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Standard Bundle
                    </Badge>
                  )}
                </div>
              </div>
              
              {bundleDetails.description && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-base mt-1">{bundleDetails.description}</p>
                </div>
              )}
              
              {bundleDetails.target_markets && bundleDetails.target_markets.length > 0 && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Target Markets</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {bundleDetails.target_markets.map((market) => (
                      <Badge key={market} variant="outline">
                        {market}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bundle Builder */}
        <BundleBuildTab
          productId=""
          companyId={bundleDetails.company_id}
          selectedBundleId={bundleId || null}
        />
      </div>

      <EditBundleDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        bundleId={bundleId || ''}
        currentName={bundleDetails.bundle_name}
        currentDescription={bundleDetails.description || ''}
        isFeasibilityStudy={bundleDetails.is_feasibility_study}
        currentTargetMarkets={bundleDetails.target_markets || []}
      />
    </div>
  );
}
