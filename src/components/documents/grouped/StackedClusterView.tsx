import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { CompanyDocument } from "@/hooks/useCompanyDocuments";
import { classifyDocument, getCluster, FUNCTIONAL_CLUSTERS, OTHER_CLUSTER, type FunctionalCluster } from "./functionalClusters";
import { StackedSopCard, type StackTopMeta } from "./StackedSopCard";
import { formatSopDisplayId, parseSopNumber } from "@/constants/sopAutoSeedTiers";

interface StackedClusterViewProps {
  documents: CompanyDocument[];
  parentChildMap?: Map<string, string[]>;
  bulkSelectedDocs: Set<string>;
  onToggleBulk: (docId: string) => void;
  onOpen: (doc: CompanyDocument) => void;
  onEdit: (doc: CompanyDocument) => void;
}

interface SopStack {
  kind: "sop";
  top: StackTopMeta;
  topDoc: CompanyDocument;
  children: CompanyDocument[];
}
interface OrphanStack {
  kind: "orphan";
  top: StackTopMeta;
  parentKey: string;
  children: CompanyDocument[];
}
type Stack = SopStack | OrphanStack;

interface LaneEntry {
  cluster: FunctionalCluster;
  stacks: Stack[];
  loose: CompanyDocument[];
}

export function StackedClusterView({
  documents,
  parentChildMap,
  bulkSelectedDocs,
  onToggleBulk,
  onOpen,
  onEdit,
}: StackedClusterViewProps) {
  const lanes = useMemo<LaneEntry[]>(() => {
    const docById = new Map(documents.map((d) => [d.id, d]));
    const map = new Map<string, LaneEntry>();

    const ensureLane = (cluster: FunctionalCluster): LaneEntry => {
      let lane = map.get(cluster.key);
      if (!lane) {
        lane = { cluster, stacks: [], loose: [] };
        map.set(cluster.key, lane);
      }
      return lane;
    };

    const consumedAsChild = new Set<string>();
    if (parentChildMap) {
      parentChildMap.forEach((kids) => kids.forEach((id) => consumedAsChild.add(id)));
    }

    // Pass 1: place every SOP and remember its stack by parentKey, so WIs
    // belonging to the same family can attach to it instead of producing a
    // duplicate dashed "orphan" placeholder.
    const sopByParentKey = new Map<string, SopStack>();
    const wis: CompanyDocument[] = [];
    for (const doc of documents) {
      if (consumedAsChild.has(doc.id)) continue;
      const cls = classifyDocument(doc);
      const cluster = getCluster(cls.clusterKey);
      const lane = ensureLane(cluster);

      if (cls.isSOP) {
        const childIds = parentChildMap?.get(doc.id) ?? [];
        const children = childIds
          .map((id) => docById.get(id))
          .filter((d): d is CompanyDocument => Boolean(d));
        const canonical = parseSopNumber(doc.document_number);
        const displayLabel = canonical ? formatSopDisplayId(canonical) : (doc.document_number || "—");
        const stack: SopStack = {
          kind: "sop",
          top: { kind: "sop", id: doc.id, label: displayLabel, title: doc.name },
          topDoc: doc,
          children,
        };
        lane.stacks.push(stack);
        if (cls.parentKey) sopByParentKey.set(cls.parentKey, stack);
      } else if (cls.isWI) {
        wis.push(doc);
      } else {
        lane.loose.push(doc);
      }
    }

    // Pass 2: route each WI to its parent SOP stack when the parent is in
    // view; otherwise group by shared parentKey into an orphan stack.
    const orphanBuckets = new Map<string, Map<string, CompanyDocument[]>>();
    for (const doc of wis) {
      const cls = classifyDocument(doc);
      const cluster = getCluster(cls.clusterKey);
      const pKey = cls.parentKey ?? doc.id;
      const parentStack = cls.parentKey ? sopByParentKey.get(cls.parentKey) : undefined;
      if (parentStack && !parentStack.children.some((c) => c.id === doc.id)) {
        parentStack.children.push(doc);
        continue;
      }
      let bucket = orphanBuckets.get(cluster.key);
      if (!bucket) {
        bucket = new Map();
        orphanBuckets.set(cluster.key, bucket);
      }
      const arr = bucket.get(pKey) ?? [];
      arr.push(doc);
      bucket.set(pKey, arr);
    }

    orphanBuckets.forEach((bucket, clusterKey) => {
      const lane = ensureLane(getCluster(clusterKey));
      bucket.forEach((children, parentKey) => {
        children.sort((a, b) =>
          (a.document_number || "").localeCompare(b.document_number || "", undefined, { numeric: true })
        );
        lane.stacks.push({
          kind: "orphan",
          top: {
            kind: "orphan",
            id: `orphan:${parentKey}`,
            label: `SOP-${parentKey}`,
            title: `${children.length} Work Instruction${children.length === 1 ? "" : "s"} · parent SOP not in view`,
          },
          parentKey,
          children,
        });
      });
    });

    return Array.from(map.values())
      .sort((a, b) => a.cluster.order - b.cluster.order || a.cluster.label.localeCompare(b.cluster.label))
      .map((lane) => ({
        ...lane,
        stacks: lane.stacks
          .map((stack) => ({
            ...stack,
            children: [...stack.children].sort((a, b) =>
              (a.document_number || "").localeCompare(b.document_number || "", undefined, { numeric: true })
            ),
          }))
          .sort((a, b) => a.top.label.localeCompare(b.top.label, undefined, { numeric: true })),
      }));
  }, [documents, parentChildMap]);

  // Lanes start collapsed so the user sees the cluster overview first and
  // expands the ones they care about.
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(["__all__"]));
  const isLaneCollapsed = (key: string) =>
    collapsed.has("__all__") ? !collapsed.has(`open:${key}`) : collapsed.has(key);
  const toggleLane = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has("__all__")) {
        const openKey = `open:${key}`;
        if (next.has(openKey)) next.delete(openKey); else next.add(openKey);
      } else {
        if (next.has(key)) next.delete(key); else next.add(key);
      }
      return next;
    });

  if (lanes.length === 0) return null;

  return (
    <div className="space-y-6">
      {lanes.map((lane) => {
        const isCollapsed = isLaneCollapsed(lane.cluster.key);
        const sopCount = lane.stacks.filter((s) => s.kind === "sop").length;
        const orphanCount = lane.stacks.filter((s) => s.kind === "orphan").length;
        const totalDocs =
          lane.stacks.reduce((sum, s) => sum + (s.kind === "sop" ? 1 : 0) + s.children.length, 0) +
          lane.loose.length;
        return (
          <section key={lane.cluster.key} className={`rounded-lg border-l-4 bg-card/40 ${lane.cluster.accentClass}`}>
            <header className="flex items-center justify-between gap-3 px-4 py-2 border-b bg-card/60 rounded-tr-lg">
              <button
                type="button"
                onClick={() => toggleLane(lane.cluster.key)}
                className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors"
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span>{lane.cluster.label}</span>
                {sopCount > 0 && (
                  <Badge variant="outline" className={`h-5 px-1.5 text-xs ${lane.cluster.badgeClass}`}>
                    {sopCount} SOP{sopCount === 1 ? "" : "s"}
                  </Badge>
                )}
                {orphanCount > 0 && (
                  <Badge variant="outline" className="h-5 px-1.5 text-xs">
                    {orphanCount} WI group{orphanCount === 1 ? "" : "s"}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground font-normal">· {totalDocs} doc{totalDocs === 1 ? "" : "s"}</span>
              </button>
            </header>

            {!isCollapsed && (
              <div className="p-4">
                {lane.stacks.length === 0 && lane.loose.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-4 text-center">No documents</div>
                ) : (
                  <>
                    {lane.stacks.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {lane.stacks.map((stack) => (
                          <StackedSopCard
                            key={stack.top.id}
                            top={stack.top}
                            topDoc={stack.kind === "sop" ? stack.topDoc : null}
                            children={stack.children}
                            cluster={lane.cluster}
                            bulkSelectedDocs={bulkSelectedDocs}
                            onToggleBulk={onToggleBulk}
                            onOpen={onOpen}
                            onEdit={onEdit}
                          />
                        ))}
                      </div>
                    )}
                    {lane.loose.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-dashed">
                        <div className="text-xs text-muted-foreground mb-2">Other documents in {lane.cluster.label}</div>
                        <div className="space-y-1">
                          {lane.loose.map((doc) => (
                            <div key={doc.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50">
                              <Checkbox
                                checked={bulkSelectedDocs.has(doc.id)}
                                onCheckedChange={() => onToggleBulk(doc.id)}
                                aria-label={`Select ${doc.document_number || doc.name}`}
                              />
                              <button
                                type="button"
                                onClick={() => onEdit(doc)}
                                className="flex-1 min-w-0 text-left flex items-center gap-2"
                              >
                                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-xs font-mono text-muted-foreground shrink-0">{doc.document_number || "—"}</span>
                                <span className="text-sm truncate">{doc.name}</span>
                              </button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => onOpen(doc)}
                              >
                                View
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export { FUNCTIONAL_CLUSTERS, OTHER_CLUSTER };
