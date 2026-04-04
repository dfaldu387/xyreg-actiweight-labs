import { useState, useCallback, useEffect } from 'react';

export interface WidgetDefinition {
  id: string;
  labelKey: string;
  descriptionKey: string;
  label?: string;
  description?: string;
  icon: string;
  column: 'right';
  defaultEnabled: boolean;
  comingSoon?: boolean;
  adminOnly?: boolean;
}

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    id: 'project-health',
    labelKey: 'missionControl.widgets.projectHealth',
    descriptionKey: 'missionControl.widgets.projectHealthDesc',
    icon: 'ShieldAlert',
    column: 'right',
    defaultEnabled: true,
  },
  {
    id: 'training-status',
    labelKey: 'missionControl.widgets.trainingStatus',
    descriptionKey: 'missionControl.widgets.trainingStatusDesc',
    icon: 'GraduationCap',
    column: 'right',
    defaultEnabled: true,
  },
  {
    id: 'communication-hub',
    labelKey: 'missionControl.widgets.communicationHub',
    descriptionKey: 'missionControl.widgets.communicationHubDesc',
    icon: 'MessageSquare',
    column: 'right',
    defaultEnabled: true,
  },
  {
    id: 'document-status',
    labelKey: 'missionControl.widgets.documentStatus',
    descriptionKey: 'missionControl.widgets.documentStatusDesc',
    icon: 'FileCheck',
    column: 'right',
    defaultEnabled: false,
  },
  {
    id: 'audit-calendar',
    labelKey: 'missionControl.widgets.auditCalendar',
    descriptionKey: 'missionControl.widgets.auditCalendarDesc',
    icon: 'Calendar',
    column: 'right',
    defaultEnabled: false,
    comingSoon: true,
  },
  {
    id: 'capa-tracker',
    labelKey: 'missionControl.widgets.capaTracker',
    descriptionKey: 'missionControl.widgets.capaTrackerDesc',
    icon: 'AlertTriangle',
    column: 'right',
    defaultEnabled: false,
    comingSoon: true,
  },
  {
    id: 'team-activity',
    labelKey: 'missionControl.widgets.teamActivity',
    descriptionKey: 'missionControl.widgets.teamActivityDesc',
    icon: 'Users',
    column: 'right',
    defaultEnabled: false,
    comingSoon: true,
  },
  {
    id: 'knowledge-bot',
    labelKey: 'missionControl.widgets.knowledgeBot',
    descriptionKey: 'missionControl.widgets.knowledgeBotDesc',
    label: 'Knowledge Bot',
    description: 'Ask questions about your Slack conversations',
    icon: 'Brain',
    column: 'right',
    defaultEnabled: false,
  },
  {
    id: 'review-action-items',
    labelKey: 'missionControl.widgets.reviewActionItems',
    descriptionKey: 'missionControl.widgets.reviewActionItemsDesc',
    label: 'Review Action Items',
    description: 'Documents assigned to you for review or authoring',
    icon: 'FileCheck',
    column: 'right',
    defaultEnabled: true,
  },
  {
    id: 'feedback-tracker',
    labelKey: 'missionControl.widgets.feedbackTracker',
    descriptionKey: 'missionControl.widgets.feedbackTrackerDesc',
    label: 'Feedback Tracker',
    description: 'Recent feedback and bug reports for your company',
    icon: 'MessageSquare',
    column: 'right',
    defaultEnabled: false,
    adminOnly: true,
  },
];

const STORAGE_KEY = 'mc-widgets-enabled';

function getDefaultEnabledIds(): string[] {
  return WIDGET_REGISTRY.filter(w => w.defaultEnabled && !w.comingSoon).map(w => w.id);
}

export function useDashboardWidgets() {
  const [enabledWidgetIds, setEnabledWidgetIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return getDefaultEnabledIds();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(enabledWidgetIds));
    } catch {}
  }, [enabledWidgetIds]);

  const toggleWidget = useCallback((widgetId: string) => {
    setEnabledWidgetIds(prev => {
      if (prev.includes(widgetId)) {
        return prev.filter(id => id !== widgetId);
      }
      return [...prev, widgetId];
    });
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    setEnabledWidgetIds(prev => prev.filter(id => id !== widgetId));
  }, []);

  const reorderWidgets = useCallback((activeId: string, overId: string) => {
    setEnabledWidgetIds(prev => {
      const oldIndex = prev.indexOf(activeId);
      const newIndex = prev.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const next = [...prev];
      next.splice(oldIndex, 1);
      next.splice(newIndex, 0, activeId);
      return next;
    });
  }, []);

  const enabledWidgets = WIDGET_REGISTRY
    .filter(w => enabledWidgetIds.includes(w.id) && !w.comingSoon)
    .sort((a, b) => enabledWidgetIds.indexOf(a.id) - enabledWidgetIds.indexOf(b.id));

  return {
    allWidgets: WIDGET_REGISTRY,
    enabledWidgets,
    enabledWidgetIds,
    toggleWidget,
    removeWidget,
    reorderWidgets,
  };
}
