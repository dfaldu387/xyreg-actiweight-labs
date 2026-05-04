import { useEffect, useState } from "react";
import { FileText, ExternalLink, Layers, History as HistoryIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { CompanyDocument } from "@/hooks/useCompanyDocuments";
import type { FunctionalCluster } from "./functionalClusters";
import { getSOPContentByName } from "@/data/sopFullContent";
import type { StackTopMeta } from "./StackedSopCard";

interface SopDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  top: StackTopMeta;
  topDoc: CompanyDocument | null;
  children: CompanyDocument[];
  cluster: FunctionalCluster;
  onEdit: (doc: CompanyDocument) => void;
}

function firstSentences(text: string, n = 2): string {
  if (!text) return "";
  const parts = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/);
  return parts.slice(0, n).join(" ");
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "d MMM yyyy");
  } catch {
    return value;
  }
}

export function SopDetailsModal({
  open,
  onOpenChange,
  top,
  topDoc,
  children,
  cluster,
  onEdit,
}: SopDetailsModalProps) {
  const isOrphan = top.kind === "orphan";
  const [tab, setTab] = useState(isOrphan ? "wis" : "overview");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<
    Array<{ version: string; date: string; description: string; author?: string }>
  >([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const sopContent = getSOPContentByName(top.title, topDoc?.document_number ?? undefined);
  const purpose = sopContent?.sections.find((s) => s.id === "purpose")?.content ?? "";
  const scope = sopContent?.sections.find((s) => s.id === "scope")?.content ?? "";
  const whyItMatters = [firstSentences(purpose, 1), firstSentences(scope, 1)]
    .filter(Boolean)
    .join(" ");

  // Reset tab whenever a new card opens the modal
  useEffect(() => {
    if (open) setTab(isOrphan ? "wis" : "overview");
  }, [open, isOrphan, top.id]);

  // Lazy-load history when its tab is opened
  useEffect(() => {
    if (tab !== "history" || historyLoaded || !topDoc?.id) return;
    let cancelled = false;
    setHistoryLoading(true);
    (async () => {
      const { data } = await supabase
        .from("document_studio_templates")
        .select("metadata, updated_at, created_at")
        .eq("id", topDoc.id)
        .maybeSingle();
      if (cancelled) return;
      const entries: typeof historyEntries = [];
      const meta = (data?.metadata ?? {}) as Record<string, unknown>;
      const snapshots = Array.isArray((meta as any)?.versionHistory)
        ? ((meta as any).versionHistory as Array<Record<string, unknown>>)
        : [];
      for (const s of snapshots) {
        entries.push({
          version: String(s.version ?? "—"),
          date: formatDate(String(s.date ?? s.created_at ?? "")),
          description: String(s.description ?? "Snapshot"),
          author: s.author ? String(s.author) : undefined,
        });
      }
      entries.push({
        version: String((meta as any)?.version ?? topDoc.version ?? "1.0"),
        date: formatDate(data?.updated_at ?? topDoc.updated_at),
        description: "Current draft",
      });
      if (data?.created_at) {
        entries.push({
          version: "—",
          date: formatDate(data.created_at),
          description: "Document created",
        });
      }
      setHistoryEntries(entries);
      setHistoryLoaded(true);
      setHistoryLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, historyLoaded, topDoc?.id, topDoc?.updated_at, topDoc?.version]);

  const handleOpenDraft = () => {
    if (topDoc) {
      onOpenChange(false);
      onEdit(topDoc);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <div className={`border-l-4 ${cluster.accentClass} px-6 py-4`}>
          <DialogHeader className="space-y-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                  {isOrphan ? <Layers className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                  {top.label}
                  {topDoc?.status && (
                    <Badge variant="outline" className="ml-2 h-4 px-1 text-[10px]">
                      {topDoc.status}
                    </Badge>
                  )}
                </div>
                <DialogTitle className={`text-lg mt-1 ${isOrphan ? "italic text-muted-foreground" : ""}`}>
                  {top.title}
                </DialogTitle>
              </div>
              {topDoc && (
                <Button size="sm" onClick={handleOpenDraft} className="shrink-0">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Open draft
                </Button>
              )}
            </div>
          </DialogHeader>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="flex flex-col">
          <div className="px-6 border-b">
            <TabsList className="h-10 bg-transparent p-0 gap-4">
              <TabsTrigger
                value="overview"
                disabled={isOrphan}
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-10"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="wis"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-10"
              >
                Work Instructions
                <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px]">
                  {children.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="history"
                disabled={!topDoc}
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-10"
              >
                History
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="max-h-[60vh]">
            <TabsContent value="overview" className="p-6 pt-4 mt-0 space-y-5">
              {!sopContent && !isOrphan && (
                <p className="text-sm text-muted-foreground">
                  No descriptive content available for this SOP yet.
                </p>
              )}
              {sopContent && (
                <>
                  {whyItMatters && (
                    <div className="rounded-md border bg-muted/30 p-3">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Why it matters
                      </div>
                      <p className="text-sm leading-relaxed">{whyItMatters}</p>
                    </div>
                  )}

                  {purpose && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                        Purpose
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-line">{purpose}</p>
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                      Key facts
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Cluster</div>
                        <div>{cluster.label}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Version</div>
                        <div>{topDoc?.version ?? "1.0"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Owner</div>
                        <div>{topDoc?.author ?? "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Last modified</div>
                        <div>{formatDate(topDoc?.updated_at)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Linked WIs</div>
                        <div>{children.length}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Status</div>
                        <div className="capitalize">{topDoc?.status ?? "—"}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                      Section outline
                    </div>
                    <ul className="text-sm space-y-1">
                      {sopContent.sections.map((s) => (
                        <li key={s.id} className="flex items-baseline gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>{s.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="wis" className="p-6 pt-4 mt-0">
              {children.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No Work Instructions linked to this SOP.
                </p>
              ) : (
                <div className="divide-y border rounded-md">
                  {children.map((wi) => (
                    <div key={wi.id} className="flex items-start gap-3 p-3 hover:bg-muted/50">
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-muted-foreground">
                          {wi.document_number}
                        </div>
                        <div className="text-sm font-medium truncate" title={wi.name}>
                          {wi.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {wi.status ? <span className="capitalize">{wi.status}</span> : null}
                          {wi.updated_at && (
                            <span className="ml-2">Updated {formatDate(wi.updated_at)}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          onOpenChange(false);
                          onEdit(wi);
                        }}
                      >
                        Open
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="p-6 pt-4 mt-0">
              {historyLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : historyEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No version history yet.</p>
              ) : (
                <ol className="relative border-l border-border ml-2 space-y-4">
                  {historyEntries.map((e, i) => (
                    <li key={i} className="ml-4">
                      <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border bg-background">
                        <HistoryIcon className="h-2 w-2 m-0.5 text-muted-foreground" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-mono">
                          v{e.version}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{e.date}</span>
                      </div>
                      <div className="text-sm mt-1">{e.description}</div>
                      {e.author && (
                        <div className="text-xs text-muted-foreground">by {e.author}</div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
