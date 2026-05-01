import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, GripVertical } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { WIDGET_REGISTRY } from '@/hooks/useDashboardWidgets';
import { useCustomerFeatureFlag } from '@/hooks/useCustomerFeatureFlag';
import { Badge } from '@/components/ui/badge';
import { hasEditorPrivileges } from '@/utils/roleUtils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface WidgetPaletteProps {
  enabledWidgetIds: string[];
  onToggleWidget: (widgetId: string) => void;
  onReorderWidget: (activeId: string, overId: string) => void;
  userRole?: string;
}

function SortableWidgetRow({
  widget,
  isEnabled,
  onToggle,
  lang,
}: {
  widget: typeof WIDGET_REGISTRY[number];
  isEnabled: boolean;
  onToggle: () => void;
  lang: (key: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: !isEnabled || !!widget.comingSoon });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-1">
      {isEnabled && !widget.comingSoon ? (
        <button
          {...attributes}
          {...listeners}
          className="mt-2.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      ) : (
        <div className="w-3.5 shrink-0" />
      )}
      <label
        className={`flex items-start gap-2.5 p-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors flex-1 min-w-0 ${widget.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Checkbox
          checked={isEnabled}
          onCheckedChange={() => !widget.comingSoon && onToggle()}
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
    </div>
  );
}

export function WidgetPalette({ enabledWidgetIds, onToggleWidget, onReorderWidget, userRole }: WidgetPaletteProps) {
  const { lang } = useTranslation();
  const communicationsEnabled = useCustomerFeatureFlag('communications-threads');

  const canViewAdminWidgets = hasEditorPrivileges(userRole || 'viewer');
  const visibleWidgets = WIDGET_REGISTRY.filter(w => {
    if (w.adminOnly && !canViewAdminWidgets) return false;
    if (w.id === 'communication-hub' && !communicationsEnabled) return false;
    return true;
  });

  // Sort: enabled widgets first (in enabledWidgetIds order), then disabled ones in registry order
  const sortedWidgets = [...visibleWidgets].sort((a, b) => {
    const aEnabled = enabledWidgetIds.includes(a.id);
    const bEnabled = enabledWidgetIds.includes(b.id);
    if (aEnabled && !bEnabled) return -1;
    if (!aEnabled && bEnabled) return 1;
    if (aEnabled && bEnabled) {
      return enabledWidgetIds.indexOf(a.id) - enabledWidgetIds.indexOf(b.id);
    }
    return 0;
  });

  const sortableIds = sortedWidgets.filter(w => enabledWidgetIds.includes(w.id) && !w.comingSoon).map(w => w.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderWidget(String(active.id), String(over.id));
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          {lang('missionControl.widgets.addWidget')}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <h4 className="font-medium text-sm mb-3">{lang('missionControl.widgets.toggleWidgets')}</h4>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {sortedWidgets.map(widget => (
                <SortableWidgetRow
                  key={widget.id}
                  widget={widget}
                  isEnabled={enabledWidgetIds.includes(widget.id)}
                  onToggle={() => onToggleWidget(widget.id)}
                  lang={lang}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </PopoverContent>
    </Popover>
  );
}
