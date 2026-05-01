import React, { useEffect, useMemo, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  FpdSopCatalogService,
  TIER_LABELS,
  TIER_BADGE_CLASSES,
  type FpdSopCatalogEntry,
} from '@/services/fpdSopCatalogService';
import type { SOPSectionContent } from '@/data/sopContent/types';

interface FpdSopEditDrawerProps {
  entry: FpdSopCatalogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

/**
 * Right-side drawer for editing a single FPD catalog entry, including the
 * full section-by-section template body. This is master content authoring —
 * intentionally NO review/approve, signatures, or CI lifecycle.
 */
export const FpdSopEditDrawer: React.FC<FpdSopEditDrawerProps> = ({
  entry,
  open,
  onOpenChange,
  onSaved,
}) => {
  const [draft, setDraft] = useState<FpdSopCatalogEntry | null>(entry);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(entry);
    setOpenSections({});
  }, [entry?.id]);

  const sections = draft?.default_sections ?? [];

  const updateSection = (
    index: number,
    patch: Partial<SOPSectionContent>,
  ) => {
    if (!draft) return;
    const next = [...sections];
    next[index] = { ...next[index], ...patch };
    setDraft({ ...draft, default_sections: next });
  };

  const addSection = () => {
    if (!draft) return;
    const newId = `section-${Date.now()}`;
    const next: SOPSectionContent[] = [
      ...sections,
      { id: newId, title: 'New Section', content: '' },
    ];
    setDraft({ ...draft, default_sections: next });
    setOpenSections((prev) => ({ ...prev, [newId]: true }));
  };

  const removeSection = (index: number) => {
    if (!draft) return;
    const next = sections.filter((_, i) => i !== index);
    setDraft({ ...draft, default_sections: next });
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    if (!draft) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const next = [...sections];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    setDraft({ ...draft, default_sections: next });
  };

  const handleResetToLibrary = () => {
    if (!draft) return;
    const lib = FpdSopCatalogService.libraryDefaultSections(draft.sop_key);
    if (lib.length === 0) {
      toast.error('No library default available for this SOP');
      return;
    }
    setDraft({ ...draft, default_sections: lib });
    toast.success('Sections reset to library default');
  };

  const handleSave = async () => {
    if (!draft) return;
    try {
      setSaving(true);
      await FpdSopCatalogService.update(draft.id, {
        title: draft.title,
        description: draft.description,
        rationale: draft.rationale,
        trigger: draft.trigger,
        is_active: draft.is_active,
        default_sections: draft.default_sections,
      });
      toast.success(`${draft.sop_key} saved`);
      onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const totalChars = useMemo(
    () => sections.reduce((sum, s) => sum + (s.content?.length ?? 0), 0),
    [sections],
  );

  if (!draft) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[760px] flex flex-col p-0 gap-0"
      >
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium">
              {draft.sop_key}
            </span>
            <Badge
              variant="outline"
              className={cn('text-xs', TIER_BADGE_CLASSES[draft.tier])}
            >
              {TIER_LABELS[draft.tier]}
            </Badge>
            {draft.trigger && draft.trigger !== 'always' && (
              <Badge variant="secondary" className="text-xs">
                when: {draft.trigger}
              </Badge>
            )}
          </div>
          <SheetTitle className="text-lg">{draft.title}</SheetTitle>
          <SheetDescription>
            Master content for this SOP. Edits affect future company
            onboardings; existing companies are unaffected.
          </SheetDescription>
        </SheetHeader>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Metadata */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={draft.title}
                onChange={(e) =>
                  setDraft({ ...draft, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Rationale</Label>
              <Textarea
                rows={2}
                value={draft.rationale ?? ''}
                onChange={(e) =>
                  setDraft({ ...draft, rationale: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Trigger</Label>
                <Input
                  value={draft.trigger ?? ''}
                  onChange={(e) =>
                    setDraft({ ...draft, trigger: e.target.value })
                  }
                  placeholder="always, eu_mdr, manufacturing…"
                />
              </div>
              <div className="flex items-end justify-between rounded-md border px-3 py-2">
                <div>
                  <Label className="text-sm">Active</Label>
                  <p className="text-xs text-muted-foreground">
                    Skipped during seeding when off
                  </p>
                </div>
                <Switch
                  checked={draft.is_active}
                  onCheckedChange={(v) =>
                    setDraft({ ...draft, is_active: v })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Sections */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">
                  Sections ({sections.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  {totalChars.toLocaleString()} characters total
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetToLibrary}
                  className="text-muted-foreground"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Reset to library
                </Button>
                <Button variant="outline" size="sm" onClick={addSection}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add section
                </Button>
              </div>
            </div>

            {sections.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No sections yet. Click <strong>Add section</strong> or{' '}
                <strong>Reset to library</strong> to start.
              </div>
            ) : (
              <div className="space-y-2">
                {sections.map((section, index) => {
                  const isOpen = openSections[section.id] ?? false;
                  return (
                    <Collapsible
                      key={section.id}
                      open={isOpen}
                      onOpenChange={(o) =>
                        setOpenSections((prev) => ({
                          ...prev,
                          [section.id]: o,
                        }))
                      }
                      className="rounded-md border"
                    >
                      <div className="flex items-center gap-1 px-2 py-1.5">
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 justify-start font-normal"
                          >
                            {isOpen ? (
                              <ChevronDown className="mr-1.5 h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="mr-1.5 h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="truncate text-sm font-medium">
                              {section.title || '(untitled section)'}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {(section.content?.length ?? 0).toLocaleString()}{' '}
                              chars
                            </span>
                          </Button>
                        </CollapsibleTrigger>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveSection(index, -1)}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveSection(index, 1)}
                          disabled={index === sections.length - 1}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeSection(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <CollapsibleContent className="space-y-2 px-3 pb-3">
                        <Input
                          value={section.title}
                          onChange={(e) =>
                            updateSection(index, { title: e.target.value })
                          }
                          placeholder="Section title (e.g. 6.0 Procedure)"
                          className="text-sm"
                        />
                        <Textarea
                          value={section.content}
                          onChange={(e) =>
                            updateSection(index, { content: e.target.value })
                          }
                          placeholder="Section body…"
                          rows={10}
                          className="font-mono text-xs leading-relaxed"
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t px-6 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FpdSopEditDrawer;