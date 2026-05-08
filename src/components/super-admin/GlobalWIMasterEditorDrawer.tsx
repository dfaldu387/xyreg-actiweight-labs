import React, { useEffect, useRef, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, Save, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { updateGlobalWISections } from '@/services/globalWorkInstructionsService';

/**
 * Super-admin master editor for a global Work Instruction. Edits write back
 * to `global_work_instructions.sections`, so every NEW company materializing
 * this WI inherits the latest content (including uploaded screenshots).
 * Existing materializations can opt-in via the per-company "Sync from master"
 * action (added separately).
 */

interface SectionBlock {
  id: string;
  title: string;
  content: Array<{ type: string; content: string }> | string;
}

interface Props {
  globalWiId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

function sectionsToHtml(sections: SectionBlock[]): string {
  return sections
    .map((s) => {
      const body = Array.isArray(s.content)
        ? s.content.map((b) => (typeof b?.content === 'string' ? b.content : '')).join('')
        : String(s.content ?? '');
      return `<section data-section-id="${s.id}"><h2>${s.title}</h2>${body}</section>`;
    })
    .join('');
}

function htmlToSections(root: HTMLElement, original: SectionBlock[]): SectionBlock[] {
  return original.map((orig) => {
    const node = root.querySelector(`section[data-section-id="${CSS.escape(orig.id)}"]`);
    if (!node) return orig;
    // Strip the leading <h2> (the title) and keep the rest as raw HTML.
    const clone = node.cloneNode(true) as HTMLElement;
    const h2 = clone.querySelector(':scope > h2');
    if (h2) h2.remove();
    return {
      ...orig,
      content: [{ type: 'paragraph', content: clone.innerHTML }],
    };
  });
}

export const GlobalWIMasterEditorDrawer: React.FC<Props> = ({
  globalWiId,
  open,
  onOpenChange,
  onSaved,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState<{ wi_number: string; title: string } | null>(null);
  const [sections, setSections] = useState<SectionBlock[]>([]);
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !globalWiId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('global_work_instructions' as never)
        .select('id, wi_number, title, sections')
        .eq('id', globalWiId)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        toast.error(`Failed to load: ${error?.message ?? 'not found'}`);
        setLoading(false);
        return;
      }
      const row = data as unknown as { wi_number: string; title: string; sections: SectionBlock[] };
      setMeta({ wi_number: row.wi_number, title: row.title });
      setSections(Array.isArray(row.sections) ? row.sections : []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, globalWiId]);

  // Inject HTML into the contentEditable when sections change.
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = sectionsToHtml(sections);
  }, [sections]);

  // Click-to-upload screenshot handler for .wi-image-placeholder figures.
  useEffect(() => {
    const root = editorRef.current;
    if (!root) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const ph = target?.closest?.('.wi-image-placeholder') as HTMLElement | null;
      if (!ph || !root.contains(ph)) return;
      e.preventDefault();
      e.stopPropagation();
      const hint = ph.getAttribute('data-hint') ?? '';
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image must be less than 5MB');
          return;
        }
        try {
          const ext = file.name.split('.').pop() ?? 'png';
          const path = `${globalWiId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from('wi-master-images')
            .upload(path, file, { upsert: false, contentType: file.type });
          if (upErr) throw upErr;
          const { data: { publicUrl } } = supabase.storage
            .from('wi-master-images')
            .getPublicUrl(path);
          const altAttr = hint ? ` alt="${hint.replace(/"/g, '&quot;')}"` : '';
          const html = `<img src="${publicUrl}"${altAttr} class="wi-screenshot" />`;
          ph.outerHTML = html;
          toast.success('Screenshot uploaded');
        } catch (err) {
          console.error(err);
          toast.error(`Upload failed: ${(err as Error).message}`);
        }
      };
      input.click();
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [globalWiId, sections]);

  const onSave = async () => {
    if (!globalWiId || !editorRef.current) return;
    setSaving(true);
    const next = htmlToSections(editorRef.current, sections);
    const r = await updateGlobalWISections(globalWiId, next);
    setSaving(false);
    if (!r.ok) {
      toast.error(`Save failed: ${(r as { reason: string }).reason}`);
      return;
    }
    toast.success('Master content saved. New companies inherit it automatically.');
    setSections(next);
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl flex flex-col p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{meta?.wi_number ?? '…'}</span>
            <span>{meta?.title ?? 'Loading…'}</span>
          </SheetTitle>
          <SheetDescription>
            Master content. Saves to the global SSOT — every newly seeded company inherits this. Click any
            screenshot placeholder <ImagePlus className="inline h-3.5 w-3.5" /> to upload an image once for
            all companies.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="prose prose-sm max-w-none focus:outline-none [&_section]:mb-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:border-b [&_h2]:pb-1 [&_h2]:mb-2"
            />
          )}
        </div>

        <div className="border-t px-6 py-3 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving || loading}>
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />Save master</>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};