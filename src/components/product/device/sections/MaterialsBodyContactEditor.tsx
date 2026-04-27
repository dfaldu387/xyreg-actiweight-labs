import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Edit2, Link2, Check, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BomService } from '@/services/bomService';
import { useNavigate } from 'react-router-dom';

export interface MaterialEntry {
  id: string;
  name: string;
  note?: string;
  bomItemId?: string | null;
  bomItemNumber?: string | null;
}

interface Props {
  productId?: string;
  value: MaterialEntry[];
  disabled?: boolean;
  onChange: (next: MaterialEntry[]) => void;
}

const genId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? (crypto as any).randomUUID()
    : `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

/**
 * Coerce legacy data: a string[] of names, or array of MaterialEntry objects.
 * Returns a normalised MaterialEntry[].
 */
export function normalizeMaterialEntries(raw: unknown): MaterialEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') {
        const name = item.trim();
        return name ? { id: genId(), name } : null;
      }
      if (item && typeof item === 'object' && typeof (item as any).name === 'string') {
        const e = item as any;
        const name = e.name.trim();
        if (!name) return null;
        return {
          id: e.id || genId(),
          name,
          note: e.note || undefined,
          bomItemId: e.bomItemId ?? null,
          bomItemNumber: e.bomItemNumber ?? null,
        } as MaterialEntry;
      }
      return null;
    })
    .filter(Boolean) as MaterialEntry[];
}

export const MaterialsBodyContactEditor: React.FC<Props> = ({
  productId,
  value,
  disabled,
  onChange,
}) => {
  const navigate = useNavigate();
  const [draftName, setDraftName] = useState('');
  const [draftNote, setDraftNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNote, setEditNote] = useState('');
  const [pickerForId, setPickerForId] = useState<string | null>(null);

  const addMaterial = () => {
    const name = draftName.trim();
    if (!name) return;
    const next = [
      ...value,
      { id: genId(), name, note: draftNote.trim() || undefined },
    ];
    onChange(next);
    setDraftName('');
    setDraftNote('');
  };

  const removeMaterial = (id: string) => {
    onChange(value.filter((m) => m.id !== id));
  };

  const startEdit = (m: MaterialEntry) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditNote(m.note || '');
  };

  const commitEdit = () => {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    onChange(
      value.map((m) =>
        m.id === editingId ? { ...m, name, note: editNote.trim() || undefined } : m,
      ),
    );
    setEditingId(null);
  };

  const linkBom = (id: string, item: { id: string; item_number: string }) => {
    onChange(
      value.map((m) =>
        m.id === id ? { ...m, bomItemId: item.id, bomItemNumber: item.item_number } : m,
      ),
    );
    setPickerForId(null);
  };

  const unlinkBom = (id: string) => {
    onChange(
      value.map((m) =>
        m.id === id ? { ...m, bomItemId: null, bomItemNumber: null } : m,
      ),
    );
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
            <ul className="space-y-2">
              {value.map((m) => (
                <li
                  key={m.id}
                  className="rounded-md border border-border bg-card px-3 py-2"
                >
                  {editingId === m.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Material name"
                        autoFocus
                      />
                      <Input
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Optional note (e.g. contacts mucosa >30 days)"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={commitEdit}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{m.name}</span>
                          {m.bomItemId && m.bomItemNumber ? (
                            <Badge
                              variant="outline"
                              className="gap-1 cursor-pointer hover:bg-accent"
                              onClick={() =>
                                productId &&
                                navigate(
                                  `/app/product/${productId}/bom?item=${m.bomItemId}`,
                                )
                              }
                              title="Open BOM item"
                            >
                              <Check className="h-3 w-3" />
                              BOM: {m.bomItemNumber}
                              <ExternalLink className="h-3 w-3" />
                            </Badge>
                          ) : null}
                        </div>
                        {m.note && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {m.note}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {m.bomItemId ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => unlinkBom(m.id)}
                            title="Unlink from BOM"
                            disabled={disabled}
                          >
                            <Link2 className="h-3 w-3" />
                            <span className="sr-only">Unlink</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPickerForId(m.id)}
                            disabled={disabled || !productId}
                            className="text-xs gap-1"
                          >
                            <Link2 className="h-3 w-3" />
                            Link to BOM
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(m)}
                          disabled={disabled}
                          title="Edit"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeMaterial(m.id)}
                          disabled={disabled}
                          title="Remove"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-md border border-dashed border-border p-3 space-y-2">
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && draftName.trim()) {
                  e.preventDefault();
                  addMaterial();
                }
              }}
              placeholder="e.g. medical-grade silicone"
              disabled={disabled}
            />
            <Input
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              placeholder="Optional note (e.g. contacts mucosa >30 days)"
              disabled={disabled}
            />
            <Button
              size="sm"
              onClick={addMaterial}
              disabled={disabled || !draftName.trim()}
              className="gap-1"
            >
              <Plus className="h-3 w-3" />
              Add material
            </Button>
          </div>

      <BomItemPickerDialog
        open={!!pickerForId}
        productId={productId}
        onClose={() => setPickerForId(null)}
        onSelect={(item) => pickerForId && linkBom(pickerForId, item)}
      />
    </div>
  );
};

const BomItemPickerDialog: React.FC<{
  open: boolean;
  productId?: string;
  onClose: () => void;
  onSelect: (item: { id: string; item_number: string }) => void;
}> = ({ open, productId, onClose, onSelect }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const activeRev = useQuery({
    queryKey: ['bom-active-revision', productId],
    queryFn: () => BomService.getActiveRevision(productId!),
    enabled: !!productId && open,
  });

  const items = useQuery({
    queryKey: ['bom-items', activeRev.data?.id],
    queryFn: () => BomService.getItems(activeRev.data!.id),
    enabled: !!activeRev.data?.id && open,
  });

  const sorted = useMemo(() => {
    const list = items.data || [];
    const filtered = search.trim()
      ? list.filter((i: any) => {
          const q = search.toLowerCase();
          return (
            (i.item_number || '').toLowerCase().includes(q) ||
            (i.description || '').toLowerCase().includes(q) ||
            (i.material_name || '').toLowerCase().includes(q)
          );
        })
      : list;
    // Items with patient_contact != 'none' first
    return [...filtered].sort((a: any, b: any) => {
      const aPc = a.patient_contact && a.patient_contact !== 'none' ? 0 : 1;
      const bPc = b.patient_contact && b.patient_contact !== 'none' ? 0 : 1;
      return aPc - bPc;
    });
  }, [items.data, search]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Link to BOM item</DialogTitle>
          <DialogDescription>
            Select a Bill of Materials item to link this body-contact material to.
            The BOM remains the source of truth for supplier, grade and lot data.
          </DialogDescription>
        </DialogHeader>

        {!activeRev.data ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <p className="mb-3">No active BOM revision yet.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (productId) navigate(`/app/product/${productId}/bom`);
                onClose();
              }}
            >
              Open BOM module
            </Button>
          </div>
        ) : (
          <>
            <Input
              placeholder="Search by item number, description, material…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="max-h-80 overflow-y-auto space-y-1">
              {items.isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Loading BOM items…
                </div>
              ) : sorted.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No matching BOM items.{' '}
                  <button
                    type="button"
                    className="underline text-primary"
                    onClick={() => {
                      if (productId) navigate(`/app/product/${productId}/bom`);
                      onClose();
                    }}
                  >
                    Open BOM module
                  </button>
                </div>
              ) : (
                sorted.map((i: any) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() =>
                      onSelect({ id: i.id, item_number: i.item_number })
                    }
                    className="w-full text-left rounded-md border border-border bg-card hover:bg-accent px-3 py-2 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          {i.item_number} —{' '}
                          {i.material_name || i.description || 'Unnamed item'}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {i.description}
                          {i.supplier?.name ? ` · ${i.supplier.name}` : ''}
                        </div>
                      </div>
                      {i.patient_contact && i.patient_contact !== 'none' && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {i.patient_contact}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
