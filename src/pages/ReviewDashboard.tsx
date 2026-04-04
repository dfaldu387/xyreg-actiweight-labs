import React from 'react';
import { useParams } from 'react-router-dom';
import { AwaitingMyReviewPage } from '@/components/review/AwaitingMyReviewPage';
import { useAuth } from "@/context/AuthContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useReviewerGroupMembership } from "@/hooks/useReviewerGroupMembership";
import { useTranslation } from "@/hooks/useTranslation";

export default function ReviewDashboard() {
  const { lang } = useTranslation();
  const { companyName } = useParams<{ companyName?: string }>();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const { userGroups, isLoading } = useReviewerGroupMembership(companyId);

  // Get user's first name for greeting
  const firstName = user?.user_metadata?.first_name || lang('reviewDashboard.user');

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-3 text-muted-foreground">{lang('reviewDashboard.loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">{lang('reviewDashboard.title')}</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">{lang('reviewDashboard.noCompanyContext')}</p>
        </div>
      </div>
    );
  }

  return (
    <AwaitingMyReviewPage
      companyId={companyId}
      userGroups={userGroups}
      companyName={companyName}
      firstName={firstName}
    />
  );
}
