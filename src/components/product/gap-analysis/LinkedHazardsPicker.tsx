import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Plus, X, ExternalLink, AlertTriangle, Link2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RichTextField } from '@/components/shared/RichTextField';

interface Hazard {
  id: string;
  hazard_id: string;
  description: string;
  category: string | null;
}

interface LinkedHazardsPickerProps {
  productId: string;
  fieldId: string;
  label: string;
  /** Currently selected hazard UUIDs (stored in form_responses) */
  value: string[];
  onChange: (hazardIds: string[]) => void;
  /** Additional notes value */
  notesValue?: string;
  onNotesChange?: (val: string) => void;
  placeholder?: string;
}

export function LinkedHazardsPicker({
  productId,
  fieldId,
  label,
  value,
  onChange,
  notesValue,
  onNotesChange,
  placeholder,
}: LinkedHazardsPickerProps) {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    supabase
      .from('hazards')
      .select('id, hazard_id, description, category')
      .eq('product_id', productId)
      .order('hazard_id')
      .then(({ data }) => {
        setHazards(data || []);
        setLoading(false);
      });
  }, [productId]);

  const selectedHazards = useMemo(
    () => hazards.filter(h => value.includes(h.id)),
    [hazards, value]
  );

  const availableHazards = useMemo(
    () => hazards.filter(h => !value.includes(h.id)),
    [hazards, value]
  );

  const toggleHazard = (hazardUuid: string) => {
    if (value.includes(hazardUuid)) {
      onChange(value.filter(id => id !== hazardUuid));
    } else {
      onChange([...value, hazardUuid]);
    }
  };

  const navigateToHazard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/app/product/${productId}/design-risk-controls?tab=risk-management`);
  };

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 flex items-center gap-1">
        <Link2 className="h-3 w-3 text-primary" />
        Linked to Hazard Traceability Matrix (HTM)
      </div>
      <Label className="text-sm font-medium">{label}</Label>

      {/* Selected hazards as badges */}
      {selectedHazards.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedHazards.map(h => (
            <Badge
              key={h.id}
              variant="secondary"
              className="flex items-center gap-1 text-xs cursor-pointer hover:bg-accent group"
            >
              <span
                onClick={navigateToHazard}
                className="flex items-center gap-1"
                title="View in Risk Management"
              >
                <span className="font-mono font-semibold">{h.hazard_id}</span>
                <span className="max-w-[200px] truncate">{h.description}</span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 text-muted-foreground" />
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleHazard(h.id); }}
                className="ml-0.5 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground italic py-1">
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          No hazards linked — add from HTM
        </div>
      )}

      {/* Add hazard popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
            <Plus className="h-3 w-3" />
            Link existing hazard…
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search hazards..." />
            <CommandList>
              <CommandEmpty>
                {loading ? 'Loading hazards...' : 'No hazards found for this product.'}
              </CommandEmpty>
              <CommandGroup heading="Available Hazards">
                {availableHazards.map(h => (
                  <CommandItem
                    key={h.id}
                    value={`${h.hazard_id} ${h.description}`}
                    onSelect={() => { toggleHazard(h.id); }}
                  >
                    <span className="font-mono text-xs font-semibold mr-2">{h.hazard_id}</span>
                    <span className="text-xs truncate">{h.description}</span>
                    {h.category && (
                      <span className="ml-auto text-[10px] text-muted-foreground">{h.category}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Additional notes */}
      {onNotesChange && (
        <div className="mt-2">
          <Label className="text-xs text-muted-foreground">Additional notes</Label>
          <RichTextField
            value={notesValue || ''}
            onChange={onNotesChange}
            placeholder={placeholder || 'Notes about hazards not yet in the HTM...'}
            minHeight="40px"
            maxHeight="100px"
          />
        </div>
      )}
    </div>
  );
}
