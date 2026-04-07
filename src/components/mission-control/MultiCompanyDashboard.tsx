import React, { useState, useEffect } from "react";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { useMissionControl } from "@/context/MissionControlContext";
import { useTranslation } from "@/hooks/useTranslation";
import { hasEditorPrivileges } from "@/utils/roleUtils";
import { CompanySelector } from "./CompanySelector";
import { WidgetPalette } from "./WidgetPalette";
import { SortableWidgetColumn } from "./SortableWidgetColumn";
import { MyActionItems } from "./MyActionItems";
import { ProjectHealthAlerts } from "./ProjectHealthAlerts";
import { CommunicationHub } from "./CommunicationHub";
import { TrainingStatusCard } from "./TrainingStatusCard";

import { useDashboardWidgets } from "@/hooks/useDashboardWidgets";
import { FeedbackTrackerWidget } from "./widgets/FeedbackTrackerWidget";
import { MyDocumentsWidget } from "./MyDocumentsWidget";

export function MultiCompanyDashboard() {
  const { companyRoles } = useCompanyRole();
  const { activeCompanyId } = useDashboardContext();
  const { selectedCompanyId } = useMissionControl();
  const { lang } = useTranslation();
  const { enabledWidgets, enabledWidgetIds, toggleWidget, removeWidget, reorderWidgets } = useDashboardWidgets();

  const [localSelectedCompanyId, setLocalSelectedCompanyId] = useState<string>(() => {
    return selectedCompanyId || activeCompanyId || 'all';
  });

  useEffect(() => {
    if (selectedCompanyId) {
      setLocalSelectedCompanyId(selectedCompanyId);
    } else if (activeCompanyId) {
      setLocalSelectedCompanyId(activeCompanyId);
    } else if (activeCompanyId === null && !selectedCompanyId) {
      setLocalSelectedCompanyId('all');
    } else if (companyRoles.length === 1) {
      setLocalSelectedCompanyId(companyRoles[0].companyId);
    }
  }, [companyRoles, activeCompanyId, selectedCompanyId]);

  const handleCompanyChange = (companyId: string, companyName: string) => {
    if (companyId === 'all') {
      window.location.href = '/app/mission-control?all=true';
    } else {
      const encodedCompanyName = encodeURIComponent(companyName);
      window.location.href = `/app/company/${encodedCompanyName}/mission-control`;
    }
  };

  const dashboardType = localSelectedCompanyId === 'all' ? 'multi-company' : 'single-company';
  const companyId = localSelectedCompanyId === 'all' ? undefined : localSelectedCompanyId;
  const currentCompanyRole = companyId ? companyRoles.find(r => r.companyId === companyId) : null;
  const userRole = currentCompanyRole?.role;
  const isAdmin = userRole === 'admin';
  const canViewAdminWidgets = hasEditorPrivileges(userRole || 'viewer');
  const filteredEnabledWidgets = enabledWidgets.filter(w => !w.adminOnly || canViewAdminWidgets);

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case 'project-health':
        return <ProjectHealthAlerts key={widgetId} companyId={companyId} />;
      case 'training-status':
        return <TrainingStatusCard key={widgetId} companyId={companyId} onRemove={() => removeWidget(widgetId)} />;
      case 'communication-hub':
        return <CommunicationHub key={widgetId} scope={dashboardType === 'multi-company' ? 'multi-company' : 'company'} companyId={companyId} />;
      case 'my-documents':
        return <MyDocumentsWidget key={widgetId} companyId={companyId} onRemove={() => removeWidget(widgetId)} />;
      case 'feedback-tracker':
        return <FeedbackTrackerWidget key={widgetId} companyId={companyId} onRemove={() => removeWidget(widgetId)} readOnly={!isAdmin} />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{lang('missionControl.executiveTitle')}</h1>
          <p className="text-muted-foreground">
            {localSelectedCompanyId === 'all'
              ? `${lang('missionControl.portfolioOverviewAcross')} ${companyRoles.length} ${lang('missionControl.companies')}`
              : `${companyRoles.find(r => r.companyId === localSelectedCompanyId)?.companyName || lang('common.company')} ${lang('missionControl.overview')}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WidgetPalette enabledWidgetIds={enabledWidgetIds} onToggleWidget={toggleWidget} onReorderWidget={reorderWidgets} userRole={userRole} />
          {companyRoles.length === 1 ? (
            <div>{companyRoles[0].companyName}</div>
          ) : (
            <CompanySelector
              selectedCompanyId={localSelectedCompanyId}
              onCompanyChange={handleCompanyChange}
              showAllOption={true}
            />
          )}
        </div>
      </div>

      <div className="space-y-6 pb-8">
        <MyActionItems companyId={companyId} />
        <SortableWidgetColumn
          widgets={filteredEnabledWidgets}
          onReorder={reorderWidgets}
          renderWidget={renderWidget}
        />
      </div>
    </div>
  );
}
