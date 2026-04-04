import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { WIDGET_REGISTRY } from '@/hooks/useDashboardWidgets';
import { Badge } from '@/components/ui/badge';
import { hasEditorPrivileges } from '@/utils/roleUtils';

interface WidgetPaletteProps {
  enabledWidgetIds: string[];
  onToggleWidget: (widgetId: string) => void;
  userRole?: string;
}

export function WidgetPalette({ enabledWidgetIds, onToggleWidget, userRole }: WidgetPaletteProps) {
  const { lang } = useTranslation();

  const isAdmin = userRole === 'admin';
  const canViewAdminWidgets = hasEditorPrivileges(userRole || 'viewer');
  const visibleWidgets = WIDGET_REGISTRY.filter(w => !w.adminOnly || canViewAdminWidgets);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          {lang('missionControl.widgets.addWidget')}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <h4 className="font-medium text-sm mb-3">{lang('missionControl.widgets.toggleWidgets')}</h4>
        <div className="space-y-2">
          {visibleWidgets.map(widget => (
            <label
              key={widget.id}
              className={`flex items-start gap-2.5 p-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors ${widget.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Checkbox
                checked={enabledWidgetIds.includes(widget.id)}
                onCheckedChange={() => !widget.comingSoon && onToggleWidget(widget.id)}
                disabled={widget.comingSoon}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">
                    {(() => {
                      const translated = lang(widget.labelKey);
                      return translated === widget.labelKey && widget.label ? widget.label : translated;
                    })()}
                  </span>
                  {widget.comingSoon && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {lang('missionControl.widgets.comingSoon')}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(() => {
                    const translated = lang(widget.descriptionKey);
                    return translated === widget.descriptionKey && widget.description ? widget.description : translated;
                  })()}
                </p>
              </div>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
