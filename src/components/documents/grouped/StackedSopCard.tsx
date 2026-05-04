import { useState } from "react";
import { FileText, ChevronRight, Layers, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { CompanyDocument } from "@/hooks/useCompanyDocuments";
import type { FunctionalCluster } from "./functionalClusters";
import { SopDetailsModal } from "./SopDetailsModal";

export interface StackTopMeta {
  kind: "sop" | "orphan";
  id: string;
  label: string;
  title: string;
}

interface StackedSopCardProps {
  top: StackTopMeta;
  topDoc: CompanyDocument | null;
  children: CompanyDocument[];
  cluster: FunctionalCluster;
  bulkSelectedDocs: Set<string>;
  onToggleBulk: (docId: string) => void;
  onOpen: (doc: CompanyDocument) => void;
  onEdit: (doc: CompanyDocument) => void;
}

export function StackedSopCard({
  top,
  topDoc,
  children,
  cluster,
  bulkSelectedDocs,
  onToggleBulk,
  onOpen,
  onEdit,
}: StackedSopCardProps) {
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const childCount = children.length;
  const ghostLayers = Math.min(Math.max(childCount, 0), 3);
  const isOrphan = top.kind === "orphan";

  const allChildSelected = childCount > 0 && children.every((c) => bulkSelectedDocs.has(c.id));
  const someChildSelected = childCount > 0 && children.some((c) => bulkSelectedDocs.has(c.id));
  const stackChecked = isOrphan
    ? allChildSelected
    : topDoc
      ? bulkSelectedDocs.has(topDoc.id)
      : false;

  const onToggleStack = () => {
    if (isOrphan) {
      const targetState = !allChildSelected;
      children.forEach((c) => {
        const isSel = bulkSelectedDocs.has(c.id);
        if (targetState && !isSel) onToggleBulk(c.id);
        if (!targetState && isSel) onToggleBulk(c.id);
      });
    } else if (topDoc) {
      onToggleBulk(topDoc.id);
    }
  };

  // Click anywhere on the card body opens the SOP draft (or the WI list for orphans).
  const onCardClick = () => {
    if (topDoc) onEdit(topDoc);
    else if (childCount > 0) setOpen(true);
  };

  return (
    <div className="relative" style={{ paddingRight: ghostLayers * 5, paddingBottom: ghostLayers * 5 }}>
      {/* Ghost stack layers behind the top card */}
      {Array.from({ length: ghostLayers }).map((_, i) => {
        const offset = (i + 1) * 5;
        return (
          <div
            key={i}
            aria-hidden
            className={`absolute rounded-lg border bg-card shadow-sm ${cluster.accentClass} border-l-4`}
            style={{
              top: offset,
              left: offset,
              right: 0,
              bottom: 0,
              zIndex: -i - 1,
              opacity: 1 - (i + 1) * 0.15,
            }}
          />
        );
      })}

      <Popover open={open} onOpenChange={setOpen}>
        <div
          role="button"
          tabIndex={0}
          onClick={onCardClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onCardClick();
            }
          }}
          className={`relative cursor-pointer rounded-lg border-l-4 border bg-card shadow-sm hover:shadow-md hover:border-primary/40 transition-all hover:-translate-y-0.5 ${cluster.accentClass} ${isOrphan ? "border-dashed" : ""}`}
        >
          <button
            type="button"
            aria-label="View details"
            onClick={(e) => {
              e.stopPropagation();
              setDetailsOpen(true);
            }}
            className="absolute top-1.5 right-1.5 z-10 h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
          <div className="p-3 flex items-start gap-2">
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={stackChecked}
                onCheckedChange={onToggleStack}
                aria-label={`Select ${top.label}`}
                {...(someChildSelected && !allChildSelected ? { "data-state": "indeterminate" as const } : {})}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                {isOrphan ? <Layers className="h-3 w-3 shrink-0" /> : <FileText className="h-3 w-3 shrink-0" />}
                <span className="truncate">{top.label}</span>
                {isOrphan && (
                  <Badge variant="outline" className="h-4 px-1 text-[10px] ml-1">
                    WI group
                  </Badge>
                )}
              </div>
              <div className={`text-sm truncate mt-0.5 ${isOrphan ? "text-muted-foreground italic" : "font-medium"}`} title={top.title}>
                {top.title}
              </div>
              <div className="mt-2 flex items-center gap-2">
                {childCount > 0 ? (
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs -ml-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Badge variant="secondary" className="mr-1.5 h-5 px-1.5">
                        {childCount}
                      </Badge>
                      View WI{childCount === 1 ? "" : "s"}
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </PopoverTrigger>
                ) : (
                  <span className="text-xs text-muted-foreground">No WIs</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {childCount > 0 && (
          <PopoverContent align="start" className="w-80 p-0">
            <div className="px-3 py-2 border-b">
              <div className="text-xs font-mono text-muted-foreground">{top.label}</div>
              <div className={`text-sm truncate ${isOrphan ? "italic text-muted-foreground" : "font-medium"}`}>{top.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {childCount} Work Instruction{childCount === 1 ? "" : "s"}
              </div>
            </div>
            <div className="max-h-80 overflow-auto py-1">
              {children.map((wi) => (
                <div key={wi.id} className="flex items-start gap-2 px-3 py-2 hover:bg-muted/50">
                  <Checkbox
                    checked={bulkSelectedDocs.has(wi.id)}
                    onCheckedChange={() => onToggleBulk(wi.id)}
                    aria-label={`Select ${wi.document_number}`}
                  />
                  <button
                    type="button"
                    className="flex-1 min-w-0 text-left"
                    onClick={() => {
                      setOpen(false);
                      onEdit(wi);
                    }}
                  >
                    <div className="text-xs font-mono text-muted-foreground truncate">
                      {wi.document_number}
                    </div>
                    <div className="text-sm truncate" title={wi.name}>
                      {wi.name}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </PopoverContent>
        )}
      </Popover>

      <SopDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        top={top}
        topDoc={topDoc}
        children={children}
        cluster={cluster}
        onEdit={onEdit}
      />
    </div>
  );
}
