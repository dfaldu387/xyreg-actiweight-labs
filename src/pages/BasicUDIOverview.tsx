import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Package2, Search, AlertCircle } from "lucide-react";
import { ConsistentPageHeader } from "@/components/layout/ConsistentPageHeader";
import { buildCompanyBreadcrumbs } from "@/utils/breadcrumbUtils";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useCompanyBasicUDIGroups } from "@/hooks/useCompanyBasicUDIGroups";
import { BasicUDIClusterCard } from "@/components/product/basic-udi/BasicUDIClusterCard";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isValidUUID } from "@/utils/uuidValidation";
import { useTranslation } from "@/hooks/useTranslation";

export default function BasicUDIOverview() {
  const { lang } = useTranslation();
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const [searchQuery, setSearchQuery] = useState("");

  // Always call hooks unconditionally - pass empty string if invalid to skip query inside hook
  const validCompanyId = isValidUUID(companyId) ? companyId : '';
  const { data: clusters = [], isLoading, error } = useCompanyBasicUDIGroups(validCompanyId);

  // Show loading while companyId is resolving
  if (!isValidUUID(companyId)) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleNavigateToClients = () => {
    navigate('/app/clients');
  };

  const handleNavigateToCompany = () => {
    navigate(`/app/company/${encodeURIComponent(companyName!)}`);
  };

  const handleClusterClick = (basicUdiDi: string) => {
    navigate(`/app/company/${encodeURIComponent(companyName!)}/basic-udi/${encodeURIComponent(basicUdiDi)}`);
  };

  const breadcrumbs = buildCompanyBreadcrumbs(
    companyName!,
    lang('basicUdiOverview.title'),
    handleNavigateToClients,
    handleNavigateToCompany
  );

  // Filter clusters by search query
  const filteredClusters = clusters.filter(cluster => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      cluster.basicUDI.toLowerCase().includes(lowerQuery) ||
      cluster.groupName?.toLowerCase().includes(lowerQuery)
    );
  });

  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={lang('basicUdiOverview.title')}
        subtitle={lang('basicUdiOverview.subtitle')}
      />

      {/* Search Bar */}
      <div className="px-2">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={lang('basicUdiOverview.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {lang('basicUdiOverview.loadError')}
            </AlertDescription>
          </Alert>
        ) : filteredClusters.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="bg-card border border-border rounded-lg p-8 max-w-md mx-auto">
              <Package2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? lang('basicUdiOverview.noMatchingGroups') : lang('basicUdiOverview.noGroupsYet')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? lang('basicUdiOverview.tryAdjustingSearch')
                  : lang('basicUdiOverview.productsWillAppear')}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredClusters.map((cluster) => (
              <BasicUDIClusterCard
                key={cluster.basicUDI}
                cluster={cluster}
                onClick={() => handleClusterClick(cluster.basicUDI)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
