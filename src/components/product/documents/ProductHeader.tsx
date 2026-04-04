import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { ConsistentPageHeader } from "@/components/layout/ConsistentPageHeader";
import { useNavigate } from "react-router-dom";
import { useSimpleClients } from "@/hooks/useSimpleClients";
import { resolveCompanyIdentifier } from "@/utils/companyUtils";

interface ProductHeaderProps {
  productName: string;
  productId?: string;
  companyId?: string;
  companyName?: string;
  statusFilter: string[];
  onStatusFilterChange: (status: string) => void;
  onAddDocumentClick: () => void;
  onSyncDocuments?: () => void;
  documentsCount: number;
  isSyncing?: boolean;
}

export function ProductHeader({ 
  productName,
  productId,
  companyId,
  companyName: initialCompanyName,
  statusFilter, 
  onStatusFilterChange, 
  onAddDocumentClick,
  onSyncDocuments,
  documentsCount,
  isSyncing = false
}: ProductHeaderProps) {
  const navigate = useNavigate();
  const { clients } = useSimpleClients();
  const [resolvedCompanyName, setResolvedCompanyName] = useState<string | null>(initialCompanyName || null);
  const [isResolvingCompany, setIsResolvingCompany] = useState(false);

  // Resolve company name from company ID
  useEffect(() => {
    const resolveCompanyName = async () => {
      // If we already have a company name, use it
      if (initialCompanyName) {
        setResolvedCompanyName(initialCompanyName);
        return;
      }

      const companyIdentifier = companyId;
      
      if (!companyIdentifier) {
        console.log("No company identifier found");
        setResolvedCompanyName(null);
        return;
      }

      setIsResolvingCompany(true);
      console.log("Resolving company name for identifier:", companyIdentifier);

      try {
        // First try to find in clients data (this is faster)
        const client = clients.find(c => c.id === companyIdentifier || c.name === companyIdentifier);
        if (client) {
          console.log("Found company in clients:", client.name);
          setResolvedCompanyName(client.name);
          setIsResolvingCompany(false);
          return;
        }

        // Check if it's already a readable name (not a UUID)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyIdentifier);
        if (!isUUID && companyIdentifier.length > 0) {
          console.log("Using company identifier as name directly:", companyIdentifier);
          setResolvedCompanyName(companyIdentifier);
          setIsResolvingCompany(false);
          return;
        }

        // If it's a UUID, try resolving with utility
        console.log("Attempting to resolve UUID with utility:", companyIdentifier);
        const result = await resolveCompanyIdentifier(companyIdentifier);
        if (result.companyName) {
          console.log("Successfully resolved company name:", result.companyName);
          setResolvedCompanyName(result.companyName);
        } else {
          console.log("Could not resolve company name, using identifier as fallback");
          setResolvedCompanyName(companyIdentifier);
        }
      } catch (error) {
        console.error("Error resolving company name:", error);
        setResolvedCompanyName(companyIdentifier);
      } finally {
        setIsResolvingCompany(false);
      }
    };

    resolveCompanyName();
  }, [companyId, initialCompanyName, clients]);

  // Handle navigation back to company dashboard
  const navigateToCompany = () => {
    const companyName = resolvedCompanyName;
    if (!companyName) {
      // If company identifier is missing, navigate to main dashboard
      navigate('/app/clients');
      return;
    }

    // Check if company is a UUID (indicating it's an ID rather than a name)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyName);
    if (isUUID) {
      // If it's a UUID, we'd prefer to navigate using company name
      // But since we only have ID, use it with the correct app route
      console.log("Navigating to company by ID:", companyName);
      navigate(`/app/company/${companyName}`);
    } else {
      // If it's likely a name, use it directly with the correct app route
      console.log("Navigating to company by name:", companyName);
      navigate(`/app/company/${encodeURIComponent(companyName)}`);
    }
  };

  // Handle navigation to product dashboard
  const navigateToProduct = () => {
    if (productId) {
      navigate(`/app/product/${productId}`);
    }
  };

  const navigateToClients = () => {
    navigate('/app/clients');
  };

  const breadcrumbs = [
    {
      label: "Client Compass",
      onClick: navigateToClients
    },
    {
      label: isResolvingCompany ? 'Loading...' : (resolvedCompanyName || 'Unknown Company'),
      onClick: navigateToCompany
    },
    {
      label: productName,
      onClick: navigateToProduct
    }
  ];

  const headerActions = (
    <>
      {onSyncDocuments && (
        <Button 
          variant="outline" 
          onClick={onSyncDocuments}
          disabled={isSyncing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Company Docs'}
        </Button>
      )}
      <Button onClick={onAddDocumentClick} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Add Document
      </Button>
    </>
  );

  return (
    <ConsistentPageHeader 
      breadcrumbs={breadcrumbs}
      title="Documents"
      subtitle={`Manage documents across all lifecycle phases (${documentsCount} total documents)`}
      actions={headerActions}
    />
  );
}
