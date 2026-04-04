import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, Package, Cpu, Star, Target, ClipboardList, AlertTriangle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BomItem } from '@/types/bom';
import { useTranslation } from '@/hooks/useTranslation';

interface BomTraceUpPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bomItem: BomItem | null;
  productId: string;
}

interface TraceLevel {
  icon: React.ReactNode;
  emoji: string;
  label: string;
  items: { id: string; name: string; detail?: string }[];
  loading: boolean;
}

export function BomTraceUpPanel({ open, onOpenChange, bomItem, productId }: BomTraceUpPanelProps) {
  const { lang } = useTranslation();
  const componentId = bomItem?.component_id;

  // 1. Component
  const { data: component, isLoading: compLoading } = useQuery({
    queryKey: ['trace-component', componentId],
    queryFn: async () => {
      if (!componentId) return null;
      const { data, error } = await supabase
        .from('device_components')
        .select('id, name, description, component_type')
        .eq('id', componentId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!componentId,
  });

  // 2. Features (via device_component_features)
  const { data: features, isLoading: featLoading } = useQuery({
    queryKey: ['trace-features', componentId],
    queryFn: async () => {
      if (!componentId) return [];
      const { data, error } = await supabase
        .from('device_component_features')
        .select('id, feature_name')
        .eq('component_id', componentId);
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!componentId,
    staleTime: 0,
  });

  // 3. User Needs (via feature_user_needs junction)
  const featureNames = features?.map(f => f.feature_name) || [];
  const { data: userNeeds, isLoading: unLoading } = useQuery({
    queryKey: ['trace-user-needs', productId, featureNames],
    queryFn: async () => {
      if (!featureNames.length) return [];
      try {
        const { data: links, error: linkErr } = await supabase
          .from('feature_user_needs')
          .select('user_need_id')
          .eq('product_id', productId)
          .in('feature_name', featureNames);
        if (linkErr) throw linkErr;
        if (!links?.length) return [];
        const needIds = [...new Set(links.map(l => l.user_need_id))];
        const { data, error } = await supabase
          .from('user_needs')
          .select('id, need_id, description, category')
          .in('id', needIds);
        if (error) throw error;
        return data || [];
      } catch {
        return [];
      }
    },
    enabled: open && featureNames.length > 0,
    staleTime: 0,
  });

  // 4. Requirements (linked to component)
  const { data: requirements, isLoading: reqLoading } = useQuery({
    queryKey: ['trace-requirements', componentId],
    queryFn: async () => {
      if (!componentId) return [];
      try {
        const { data, error } = await supabase
          .from('requirement_specifications')
          .select('id, requirement_id, description, requirement_type, linked_risks')
          .eq('component_id', componentId);
        if (error) throw error;
        return data || [];
      } catch {
        return [];
      }
    },
    enabled: open && !!componentId,
  });

  // 5. Hazards (from linked_risks in requirements)
  const hazardIds = React.useMemo(() => {
    if (!requirements?.length) return [];
    const ids = new Set<string>();
    for (const req of requirements) {
      const risks = req.linked_risks;
      if (Array.isArray(risks)) {
        risks.forEach((r: any) => {
          if (typeof r === 'string') ids.add(r);
          else if (r?.id) ids.add(r.id);
        });
      }
    }
    return [...ids];
  }, [requirements]);

  const { data: hazards, isLoading: hazLoading } = useQuery({
    queryKey: ['trace-hazards', hazardIds],
    queryFn: async () => {
      if (!hazardIds.length) return [];
      try {
        const { data, error } = await supabase
          .from('hazards')
          .select('id, hazard_id, description, initial_severity, initial_probability')
          .in('id', hazardIds);
        if (error) throw error;
        return data || [];
      } catch {
        return [];
      }
    },
    enabled: open && hazardIds.length > 0,
  });

  const levels: TraceLevel[] = [
    {
      icon: <Package className="h-4 w-4" />,
      emoji: '📦',
      label: lang('bom.bomItem'),
      items: bomItem ? [{ id: bomItem.id, name: bomItem.description, detail: `#${bomItem.item_number}` }] : [],
      loading: false,
    },
    {
      icon: <Cpu className="h-4 w-4" />,
      emoji: '🔩',
      label: lang('bom.component'),
      items: component ? [{ id: component.id, name: component.name, detail: component.component_type }] : [],
      loading: compLoading,
    },
    {
      icon: <Star className="h-4 w-4" />,
      emoji: '⭐',
      label: lang('bom.features'),
      items: (features || []).map(f => ({ id: f.id, name: f.feature_name })),
      loading: featLoading,
    },
    {
      icon: <Target className="h-4 w-4" />,
      emoji: '🎯',
      label: lang('bom.userNeeds'),
      items: (userNeeds || []).map((un: any) => ({ id: un.id, name: un.description || un.need_id, detail: un.category })),
      loading: unLoading,
    },
    {
      icon: <ClipboardList className="h-4 w-4" />,
      emoji: '📋',
      label: lang('bom.requirements'),
      items: (requirements || []).map((r: any) => ({ id: r.id, name: r.description || r.requirement_id, detail: r.requirement_type })),
      loading: reqLoading,
    },
    {
      icon: <AlertTriangle className="h-4 w-4" />,
      emoji: '⚠️',
      label: lang('bom.hazards'),
      items: (hazards || []).map((h: any) => ({ id: h.id, name: h.description || h.hazard_id, detail: `S${h.initial_severity || '?'} × P${h.initial_probability || '?'}` })),
      loading: hazLoading,
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[440px] p-0">
        <SheetHeader className="px-6 pt-6 pb-3">
          <SheetTitle className="text-base">{lang('bom.digitalThread')} — {lang('bom.traceUp')}</SheetTitle>
          {bomItem && (
            <p className="text-sm text-muted-foreground truncate">
              {bomItem.item_number}: {bomItem.description}
            </p>
          )}
        </SheetHeader>
        <Separator />
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="px-6 py-4 space-y-1">
            {!componentId && (
              <p className="text-sm text-muted-foreground py-4">
                {lang('bom.notLinkedHint')}
              </p>
            )}
            {levels.map((level, idx) => {
              // Skip levels after BOM if no component link
              if (!componentId && idx > 0) return null;

              return (
                <div key={level.label}>
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 hover:bg-muted/50 rounded px-2 text-left group">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                      <span className="text-base">{level.emoji}</span>
                      <span className="text-sm font-medium flex-1">{level.label}</span>
                      <Badge variant="secondary" className="text-xs">{level.items.length}</Badge>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-8 space-y-1 pb-2">
                        {level.loading ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                            <Loader2 className="h-3 w-3 animate-spin" /> {lang('bom.loading')}
                          </div>
                        ) : level.items.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-1 italic">{lang('bom.noLink')}</p>
                        ) : (
                          level.items.map(item => (
                            <div key={item.id} className="flex items-center gap-2 py-1 px-2 rounded bg-muted/30">
                              <span className="text-sm flex-1 truncate">{item.name}</span>
                              {item.detail && (
                                <Badge variant="outline" className="text-[10px] shrink-0">{item.detail}</Badge>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  {idx < levels.length - 1 && (
                    <div className="ml-[18px] h-3 border-l-2 border-dashed border-muted-foreground/30" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
