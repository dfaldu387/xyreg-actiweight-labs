import React from "react";
import { Loader2 } from "lucide-react";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useMissionControl } from "@/context/MissionControlContext";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { getCompanyFromUrl } from "@/utils/urlCompanyContext";
import { hasEditorPrivileges } from "@/utils/roleUtils";
import { MyActionItems } from "./MyActionItems";
import { NewReleaseNotification } from "./NewReleaseNotification";
import { ProjectHealthAlerts } from "./ProjectHealthAlerts";
import { CommunicationHub } from "./CommunicationHub";
import { KnowledgeBotWidget } from "./KnowledgeBotWidget";
import { FeedbackTrackerWidget } from "./widgets/FeedbackTrackerWidget";
import { ReviewActionItemsWidget } from "./widgets/ReviewActionItemsWidget";
import { TrainingStatusCard } from "./TrainingStatusCard";
import { DocumentStatusWidget } from "./DocumentStatusWidget";
import { CompanySelector } from "./CompanySelector";
import { WidgetPalette } from "./WidgetPalette";
import { SortableWidgetColumn } from "./SortableWidgetColumn";
import { ConsistentPageHeader } from "@/components/layout/ConsistentPageHeader";
import { buildCompanyBreadcrumbs } from "@/utils/breadcrumbUtils";
import { useNavigate, useLocation } from "react-router-dom";
import { queryClient } from "@/lib/query-client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useTranslation } from "@/hooks/useTranslation";
import { useDashboardWidgets } from "@/hooks/useDashboardWidgets";

export function SingleCompanyDashboard() {
  const { companyRoles, isLoading: rolesLoading } = useCompanyRole();
  const { activeCompanyId, isMissionControlOverlay } = useDashboardContext();
  const { selectedCompanyId, selectedCompanyName, setSelectedCompany } = useMissionControl();
  const navigate = useNavigate();
  const location = useLocation();
  const compantId = useCompanyId();
  const { lang } = useTranslation();
  const { enabledWidgets, enabledWidgetIds, toggleWidget, removeWidget, reorderWidgets } = useDashboardWidgets();

  const urlCompanyName = getCompanyFromUrl();

  const searchParams = new URLSearchParams(location.search);
  const returnTo = searchParams.get('returnTo');
  const companyNameFromReturnTo = returnTo?.match(/\/company\/([^\/\?]+)/)?.[1];
  const decodedReturnToCompany = companyNameFromReturnTo ? decodeURIComponent(companyNameFromReturnTo) : null;

  const effectiveCompanyName = urlCompanyName || decodedReturnToCompany;

  const urlCompany = effectiveCompanyName ?
    companyRoles.find(role => role.companyName === effectiveCompanyName) ||
    companyRoles.find(role => role.companyName.toLowerCase() === effectiveCompanyName.toLowerCase())
    : null;

  const currentCompany = urlCompany ||
    (isMissionControlOverlay && activeCompanyId ?
      companyRoles.find(role => role.companyId === activeCompanyId) :
      (selectedCompanyId ? companyRoles.find(role => role.companyId === selectedCompanyId) : companyRoles[0])
    );

  const currentCompanyId = currentCompany?.companyId;
  const userRole = currentCompany?.role;
  const isAdmin = userRole === 'admin';
  const canViewAdminWidgets = hasEditorPrivileges(userRole || 'viewer');
  const filteredEnabledWidgets = enabledWidgets.filter(w => !w.adminOnly || canViewAdminWidgets);
  const handleCompanyChange = (companyId: string, companyName: string) => {
    if (companyId === 'all') {
      setSelectedCompany(null, null);
      navigate('/app/mission-control', { replace: false });
    } else {
      setSelectedCompany(companyId, companyName);
      const encodedCompanyName = encodeURIComponent(companyName);
      navigate(`/app/company/${encodedCompanyName}/mission-control`, { replace: false });
    }
  };

  const handleNavigateToClients = () => {
    navigate('/app/clients');
  };

  const handleNavigateToCompany = () => {
    if (currentCompany?.companyName) {
      navigate(`/app/company/${encodeURIComponent(currentCompany.companyName)}`);
    }
  };

  const breadcrumbs = buildCompanyBreadcrumbs(
    currentCompany?.companyName || lang('common.company'),
    lang('missionControl.title'),
    handleNavigateToClients,
    handleNavigateToCompany,
    { clientCompassLabel: lang('missionControl.clientCompass') }
  );

  if (rolesLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  if (!currentCompany) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">{lang('missionControl.companyNotFound')}</h2>
          <p className="text-muted-foreground mt-2">
            {lang('missionControl.unableToLoadCompany')} {urlCompanyName || lang('common.none')}
          </p>
          <button
            onClick={() => navigate('/app/mission-control')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            {lang('missionControl.returnToMissionControl')}
          </button>
        </div>
      </div>
    );
  }

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case 'project-health':
        return <ProjectHealthAlerts key={widgetId} companyId={currentCompanyId} />;
      case 'training-status':
        return <TrainingStatusCard key={widgetId} companyId={currentCompanyId} onRemove={() => removeWidget(widgetId)} />;
      case 'communication-hub':
        return <CommunicationHub key={widgetId} scope="company" companyId={currentCompanyId} />;
      case 'document-status':
        return <DocumentStatusWidget key={widgetId} companyId={currentCompanyId} onRemove={() => removeWidget(widgetId)} />;
      case 'knowledge-bot':
        return <KnowledgeBotWidget key={widgetId} companyId={currentCompanyId} onRemove={() => removeWidget(widgetId)} />;
      case 'review-action-items':
        return <ReviewActionItemsWidget key={widgetId} companyId={currentCompanyId} onRemove={() => removeWidget(widgetId)} />;
      case 'feedback-tracker':
        return <FeedbackTrackerWidget key={widgetId} companyId={currentCompanyId} onRemove={() => removeWidget(widgetId)} readOnly={!isAdmin} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={`${currentCompany?.companyName || lang('common.company')} ${lang('missionControl.title')}`}
        subtitle={`${currentCompany?.companyName || lang('common.company')} - ${lang('missionControl.subtitle')}`}
        actions={
          <div className="flex items-center gap-2">
            <WidgetPalette enabledWidgetIds={enabledWidgetIds} onToggleWidget={toggleWidget} userRole={userRole} />
            {companyRoles.length === 1 ? (
              <div className="text-sm font-medium">{companyRoles[0].companyName}</div>
            ) : (
              <CompanySelector
                selectedCompanyId={currentCompanyId}
                onCompanyChange={handleCompanyChange}
                showAllOption={true}
              />
            )}
          </div>
        }
      />

      <div className="space-y-6 pb-8 pt-4">
        <NewReleaseNotification />
        <MyActionItems companyId={currentCompanyId} />
        <SortableWidgetColumn
          widgets={filteredEnabledWidgets}
          onReorder={reorderWidgets}
          renderWidget={renderWidget}
        />
      </div>
    </div>
  );
}
