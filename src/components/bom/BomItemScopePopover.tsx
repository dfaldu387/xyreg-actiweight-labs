import React, { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { BomItemScopeService } from '@/services/bomItemScopeService';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface BomItemScopePopoverProps {
  bomItemId: string;
  currentProductId: string;
  companyId: string;
  scopedProductIds: string[];
  onScopeChange: (bomItemId: string, productIds: string[]) => void;
  readOnly?: boolean;
}

export function BomItemScopePopover({
  bomItemId,
  currentProductId,
  companyId,
  scopedProductIds,
  onScopeChange,
  readOnly = false,
}: BomItemScopePopoverProps) {
  const { lang } = useTranslation();
  const { data: products } = useQuery({
    queryKey: ['company-products', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('company_id', companyId)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const [selected, setSelected] = useState<string[]>(scopedProductIds);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(scopedProductIds);
  }, [scopedProductIds]);

  const count = selected.length;
  const label = count <= 1 ? lang('bom.thisDevice') : lang('bom.devices', { count });

  const handleToggle = async (productId: string, checked: boolean) => {
    if (productId === currentProductId) return;
    const next = checked
      ? [...selected, productId]
      : selected.filter(id => id !== productId);
    setSelected(next);

    setSaving(true);
    try {
      await BomItemScopeService.upsertScope(bomItemId, companyId, next);
      onScopeChange(bomItemId, next);
    } catch {
      toast.error(lang('bom.failedUpdateScope'));
      setSelected(selected); // revert
    } finally {
      setSaving(false);
    }
  };

  if (readOnly) {
    return (
      <Badge variant="outline" className="text-xs whitespace-nowrap">
        {label}
      </Badge>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={e => e.stopPropagation()}
        >
          <Layers className="h-3.5 w-3.5" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start" onClick={e => e.stopPropagation()}>
        <p className="text-xs font-medium text-muted-foreground mb-2">
          {lang('bom.devicesUsingPart')}
        </p>
        <ScrollArea className="max-h-48">
          <div className="space-y-1.5">
            {products?.map(p => {
              const isCurrent = p.id === currentProductId;
              const isChecked = selected.includes(p.id) || isCurrent;
              return (
                <label
                  key={p.id}
                  className="flex items-center gap-2 text-sm py-1 px-1 rounded hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={isChecked}
                    disabled={isCurrent || saving}
                    onCheckedChange={(checked) => handleToggle(p.id, !!checked)}
                  />
                  <span className={isCurrent ? 'font-medium' : ''}>
                    {p.name}
                    {isCurrent && <span className="text-xs text-muted-foreground ml-1">{lang('bom.currentLabel')}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
