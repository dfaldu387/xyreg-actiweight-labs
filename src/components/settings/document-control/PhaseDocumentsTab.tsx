
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DocumentControlTabs } from "./DocumentControlTabs";

interface PhaseDocumentsTabProps {
  companyId?: string;
  companyName?: string;
}

export function PhaseDocumentsTab({ companyId, companyName }: PhaseDocumentsTabProps) {
  const [finalCompanyId, setFinalCompanyId] = useState<string | null>(companyId || null);
  const [loading, setLoading] = useState(!companyId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyId = async () => {
      if (companyId) {
        setFinalCompanyId(companyId);
        setLoading(false);
        return;
      }

      if (!companyName) {
        setError("No company information provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const decodedCompanyName = decodeURIComponent(companyName);
        
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select("id")
          .eq("name", decodedCompanyName)
          .single();
          
        if (companyError || !company) {
          throw new Error(`Failed to find company: ${decodedCompanyName}`);
        }
        
        setFinalCompanyId(company.id);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load company";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyId();
  }, [companyId, companyName]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2">Loading company information...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error}
          {companyName && (
            <div className="mt-2 text-sm">
              Company: {decodeURIComponent(companyName)}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!finalCompanyId) {
    return (
      <Alert>
        <AlertDescription>
          No company information available.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <DocumentControlTabs 
      companyId={finalCompanyId} 
      companyName={companyName ? decodeURIComponent(companyName) : undefined} 
    />
  );
}
