
import React from "react";
import { AwaitingMyReviewPage } from "@/components/review/AwaitingMyReviewPage";
import { useAuth } from "@/context/AuthContext";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useReviewerGroupMembership } from "@/hooks/useReviewerGroupMembership";
import { DocumentReviewKanban } from "@/components/review/DocumentReviewKanban";
import { useTranslation } from "@/hooks/useTranslation";

export default function ReviewPanel() {
  const { lang } = useTranslation();
  const { user } = useAuth();
  const { activeCompanyId, companyRoles } = useCompanyRole();

  // Use the first available company if no active company
  const targetCompanyId = activeCompanyId || companyRoles[0]?.companyId;

  const { userGroups, isLoading } = useReviewerGroupMembership(targetCompanyId);
  const targetCompanyName = companyRoles.find(r => r.companyId === targetCompanyId)?.companyName;
  // Extract first name from user metadata or use fallback
  const firstName = user?.user_metadata?.first_name || lang('reviewPanel.expert');

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-3 text-muted-foreground">{lang('reviewPanel.loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  if (!targetCompanyId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">{lang('reviewPanel.title')}</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">{lang('reviewPanel.noCompaniesAvailable')}</p>
        </div>
      </div>
    );
  }

  return (
    <DocumentReviewKanban
      companyId={targetCompanyId}
      userGroups={userGroups}
      companyName={targetCompanyName}
    />
  );
}
