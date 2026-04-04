import React, { useState, useEffect } from 'react';
import { ReviewerAnalyticsDashboard } from '@/components/review/ReviewerAnalyticsDashboard';
import { useAuth } from '@/context/AuthContext';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useReviewerGroupMembership } from '@/hooks/useReviewerGroupMembership';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export function ReviewerAnalyticsPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const { user } = useAuth();
  const { activeRole } = useCompanyRole();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const { userGroups } = useReviewerGroupMembership(companyId);

  // Fetch company ID from company name
  useEffect(() => {
    const fetchCompanyId = async () => {
      if (!companyName) return;
      
      try {
        setIsLoadingCompany(true);
        const decodedCompanyName = decodeURIComponent(companyName);
        
        const { data: company, error } = await supabase
          .from("companies")
          .select("id")
          .eq("name", decodedCompanyName)
          .single();
        
        if (error) {
          console.error("Error fetching company:", error);
          return;
        }
        
        setCompanyId(company.id);
      } catch (error) {
        console.error("Error in fetchCompanyId:", error);
      } finally {
        setIsLoadingCompany(false);
      }
    };

    fetchCompanyId();
  }, [companyName]);

  if (!companyName) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Company name not found</div>
      </div>
    );
  }

  if (isLoadingCompany || !companyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading company information...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Please log in to view analytics</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Reviewer Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          Comprehensive insights into reviewer performance and document approval statistics
        </p>
      </div>

      <ReviewerAnalyticsDashboard
        companyId={companyId}
        userGroups={userGroups || []}
      />
    </div>
  );
}