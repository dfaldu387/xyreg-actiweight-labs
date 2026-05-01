import React from 'react';
import { FileText, Layers, Hash, Tag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DocumentTemplate } from '@/types/documentComposer';

interface TemplateConfigPanelProps {
  template: DocumentTemplate;
  showSectionNumbers?: boolean;
  onShowSectionNumbersChange?: (show: boolean) => void;
  className?: string;
}

/**
 * Lightweight Configure panel shown when the drawer is opened on a template
 * (i.e. before a Compliance Instance has been created). Surfaces the few
 * controls that are meaningful at the template level.
 */
export function TemplateConfigPanel({
  template,
  showSectionNumbers,
  onShowSectionNumbersChange,
  className,
}: TemplateConfigPanelProps) {
  const sectionCount = template.sections?.length ?? 0;

  return (
    <div className={cn('bg-background flex flex-col w-[400px] border-r shrink-0', className)}>
      <div className="px-3 py-2 border-b text-sm font-medium text-muted-foreground flex items-center gap-2">
        <FileText className="w-4 h-4" />
        <span>Configure</span>
        <Badge variant="outline" className="ml-auto text-[10px] font-normal">
          Template
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5 text-sm">
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            You're editing a template. Save the draft into a phase to unlock
            full document configuration (status, owners, reviewers, version…).
          </div>

          <Field icon={<FileText className="w-3.5 h-3.5" />} label="Template name">
            <span className="text-foreground">{template.name}</span>
          </Field>

          {template.type ? (
            <Field icon={<Tag className="w-3.5 h-3.5" />} label="Type">
              <span className="text-foreground capitalize">{template.type}</span>
            </Field>
          ) : null}

          <Field icon={<Layers className="w-3.5 h-3.5" />} label="Sections">
            <span className="text-foreground">{sectionCount}</span>
          </Field>

          {template.metadata?.version ? (
            <Field icon={<Hash className="w-3.5 h-3.5" />} label="Version">
              <span className="text-foreground">{template.metadata.version}</span>
            </Field>
          ) : null}

          <div className="border-t pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="tpl-show-section-numbers" className="text-xs font-medium">
                  Show section numbers
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Prefix headings with 1.0, 2.0…
                </p>
              </div>
              <Switch
                id="tpl-show-section-numbers"
                checked={!!showSectionNumbers}
                onCheckedChange={(v) => onShowSectionNumbersChange?.(!!v)}
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}