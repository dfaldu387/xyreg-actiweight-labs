import { useState, useEffect, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { X, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Filter, ChevronDown, ChevronRight, Check } from "lucide-react";

interface Phase {
  id: string;
  name: string;
}

interface DocumentItem {
  id: string;
  name: string;
  phase_id: string;
  phase_name: string;
  product_id: string;
  product_name: string;
}

interface DocumentPermissionSelectorProps {
  companyId: string;
  selectedProductIds: string[];
  selectedDocumentIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  inline?: boolean;
  initialRestricted?: boolean;
}

export function DocumentPermissionSelector({
  companyId,
  selectedProductIds,
  selectedDocumentIds,
  onChange,
  label = "Document Permissions",
  inline = false,
  initialRestricted = false,
}: DocumentPermissionSelectorProps) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  // Temp selection that only commits on "Done"
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);

  // Fetch phases and documents filtered by selected products
  useEffect(() => {
    if (!companyId) {
      setDocuments([]);
      setPhases([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch chosen phases
        const { data: chosenPhases } = await supabase
          .from("company_chosen_phases")
          .select("company_phases!inner(id, name, position)")
          .eq("company_id", companyId);

        const phaseList: Phase[] = (chosenPhases || [])
          .sort(
            (a: any, b: any) =>
              (a.company_phases?.position || 0) -
              (b.company_phases?.position || 0)
          )
          .map((item: any) => ({
            id: item.company_phases.id,
            name: item.company_phases.name,
          }));

        setPhases(phaseList);

        // Build phase name map
        const phaseNameMap = new Map<string, string>();
        phaseList.forEach((p) => phaseNameMap.set(p.id, p.name));

        // Fetch products for name mapping
        const { data: products } = await supabase
          .from("products")
          .select("id, name")
          .eq("company_id", companyId)
          .eq("is_archived", false);

        const productNameMap = new Map<string, string>();
        (products || []).forEach((p: any) => productNameMap.set(p.id, p.name));

        // Fetch document templates - if no specific products selected, fetch all for company
        let docsQuery = (supabase as any)
          .from("phase_assigned_document_template")
          .select("id, name, phase_id, product_id")
          .eq("company_id", companyId);

        if (selectedProductIds.length > 0) {
          docsQuery = docsQuery.in("product_id", selectedProductIds);
        }

        const { data: docs } = await docsQuery;

        const docList: DocumentItem[] = (docs || [])
          .filter((d: any) => d.name)
          .map((d: any) => ({
            id: d.id,
            name: d.name,
            phase_id: d.phase_id,
            phase_name: (() => { const n = phaseNameMap.get(d.phase_id); return (!n || n === "No Phase") ? "Core" : n; })(),
            product_id: d.product_id,
            product_name: productNameMap.get(d.product_id) || '',
          }));

        setDocuments(docList);
      } catch (error) {
        console.error("Error fetching document permissions data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId, selectedProductIds]);

  // Auto-select all documents when they load and none are selected yet
  useEffect(() => {
    if (loading) return;
    if (documents.length > 0 && selectedDocumentIds.length === 0) {
      onChange(documents.map((d) => d.id));
    } else if (documents.length === 0 && selectedDocumentIds.length > 0) {
      onChange([]);
    } else if (selectedDocumentIds.length > 0) {
      const validIds = new Set(documents.map((d) => d.id));
      const filtered = selectedDocumentIds.filter((id) => validIds.has(id));
      if (filtered.length !== selectedDocumentIds.length) {
        onChange(filtered);
      }
    }
  }, [documents, loading]);

  // Filter documents by selected phase
  const filteredDocuments =
    selectedPhase === "all"
      ? documents
      : documents.filter((d) => d.phase_id === selectedPhase);

  // Check if all filtered documents are selected (using temp state when dialog open)
  const activeIds = dialogOpen ? tempSelectedIds : selectedDocumentIds;
  const allFilteredSelected =
    filteredDocuments.length > 0 &&
    filteredDocuments.every((d) => activeIds.includes(d.id));

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredIds = new Set(filteredDocuments.map((d) => d.id));
      setTempSelectedIds(tempSelectedIds.filter((id) => !filteredIds.has(id)));
    } else {
      const existing = new Set(tempSelectedIds);
      filteredDocuments.forEach((d) => existing.add(d.id));
      setTempSelectedIds(Array.from(existing));
    }
  };

  const handleToggleDocument = (docId: string) => {
    if (tempSelectedIds.includes(docId)) {
      setTempSelectedIds(tempSelectedIds.filter((id) => id !== docId));
    } else {
      setTempSelectedIds([...tempSelectedIds, docId]);
    }
  };

  // Group documents by device
  const [expandedDevices, setExpandedDevices] = useState<Set<string>>(new Set());

  const groupedDocuments = useMemo(() => {
    const groups = new Map<string, { productName: string; docs: DocumentItem[] }>();
    filteredDocuments.forEach((doc) => {
      const key = doc.product_id || 'no-device';
      if (!groups.has(key)) {
        groups.set(key, { productName: doc.product_name || 'General', docs: [] });
      }
      groups.get(key)!.docs.push(doc);
    });
    return Array.from(groups.entries());
  }, [filteredDocuments]);

  const toggleDeviceExpand = (productId: string) => {
    setExpandedDevices((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleToggleDeviceDocs = (productId: string, docs: DocumentItem[]) => {
    const docIds = docs.map((d) => d.id);
    const allSelected = docIds.every((id) => tempSelectedIds.includes(id));
    if (allSelected) {
      setTempSelectedIds(tempSelectedIds.filter((id) => !docIds.includes(id)));
    } else {
      const existing = new Set(tempSelectedIds);
      docIds.forEach((id) => existing.add(id));
      setTempSelectedIds(Array.from(existing));
    }
  };

  const handleOpenDialog = () => {
    setTempSelectedIds([...selectedDocumentIds]);
    setSelectedPhase("all");
    setDialogOpen(true);
  };

  const handleDone = () => {
    onChange(tempSelectedIds);
    setDialogOpen(false);
  };

  const handleCancel = () => {
    setDialogOpen(false);
  };

  const getPhaseFilterLabel = () => {
    if (selectedPhase === "all") return "All Phases";
    const phase = phases.find((p) => p.id === selectedPhase);
    const name = phase?.name;
    return (!name || name === "No Phase") ? "Core" : name;
  };

  const disabled = false;
  const allDocsSelected =
    documents.length > 0 &&
    documents.every((d) => selectedDocumentIds.includes(d.id));
  const [hasDocRestriction, setHasDocRestriction] = useState(initialRestricted);

  // Sync when initialRestricted changes (e.g., data loaded from DB)
  useEffect(() => {
    if (initialRestricted) {
      setHasDocRestriction(true);
    }
  }, [initialRestricted]);

  const switchEl = (
    <Switch
      checked={hasDocRestriction}
      disabled={disabled}
      onCheckedChange={(checked) => {
        setHasDocRestriction(checked);
        if (checked) {
          handleOpenDialog();
        } else {
          onChange(documents.map((d) => d.id));
        }
      }}
    />
  );

  const statusText = (
    <span className="text-sm text-muted-foreground">
      {!hasDocRestriction || allDocsSelected
        ? "All Documents"
        : "Restricted"}
    </span>
  );

  return (
    <>
      {inline ? (
        <>
          <Label>{label}</Label>
          {switchEl}
          {statusText}
          {hasDocRestriction && !allDocsSelected && selectedDocumentIds.length > 0 && (
            <p
              className="col-span-3 text-xs text-primary -mt-2 cursor-pointer hover:underline"
              onClick={handleOpenDialog}
            >
              {selectedDocumentIds.length} document{selectedDocumentIds.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{label}</Label>
            <div className="flex items-center space-x-2">
              {switchEl}
              {statusText}
              {hasDocRestriction && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenDialog}
                  disabled={disabled}
                >
                  Select Documents
                </Button>
              )}
            </div>
          </div>

        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setFilterOpen(false); }}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-black/60" />
          <DialogPrimitive.Content
            className="fixed left-[50%] top-[50%] z-[80] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg max-h-[80vh] flex flex-col"
            style={{ overflow: "visible" }}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
          <DialogHeader>
            <DialogTitle>Select Documents</DialogTitle>
          </DialogHeader>

          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Loading documents...</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No documents available for selected devices</p>
          ) : (
            <div className="flex flex-col gap-3 flex-1 min-h-0">
              {/* Phase filter dropdown */}
              <div className="relative" style={{ zIndex: 10 }}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  {getPhaseFilterLabel()}
                  <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
                </Button>
                {filterOpen && (
                  <>
                    <div className="fixed inset-0" style={{ zIndex: 10 }} onClick={() => setFilterOpen(false)} />
                    <div
                      className="absolute left-0 mt-1 w-64 rounded-md border bg-popover p-1 shadow-md overflow-y-auto"
                      style={{ zIndex: 11, maxHeight: 300, top: "100%" }}
                    >
                      <button
                        type="button"
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-sm hover:bg-accent text-left"
                        onClick={() => { setSelectedPhase("all"); setFilterOpen(false); }}
                      >
                        {selectedPhase === "all" && <Check className="h-3.5 w-3.5 shrink-0" />}
                        <span className={selectedPhase === "all" ? "" : "ml-[22px]"}>All Phases</span>
                      </button>
                      {phases.map((phase) => (
                        <button
                          key={phase.id}
                          type="button"
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-sm hover:bg-accent text-left"
                          onClick={() => { setSelectedPhase(phase.id); setFilterOpen(false); }}
                        >
                          {selectedPhase === phase.id && <Check className="h-3.5 w-3.5 shrink-0" />}
                          <span className={selectedPhase === phase.id ? "" : "ml-[22px]"}>{phase.name === "No Phase" ? "Core" : phase.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Select All */}
              <div className="flex items-center space-x-2 border-b pb-2">
                <Checkbox
                  id="dialog-select-all-docs"
                  checked={allFilteredSelected}
                  onCheckedChange={handleSelectAll}
                />
                <Label
                  htmlFor="dialog-select-all-docs"
                  className="text-sm font-medium cursor-pointer"
                >
                  Select All ({filteredDocuments.length} documents)
                </Label>
              </div>

              {/* Document list grouped by device */}
              <div className="h-[300px] overflow-y-auto rounded-md border p-3">
                {filteredDocuments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No documents in this phase
                  </p>
                ) : (
                  <div className="space-y-1">
                    {groupedDocuments.map(([productId, { productName, docs }]) => {
                      const isExpanded = expandedDevices.has(productId);
                      const docIds = docs.map((d) => d.id);
                      const allDeviceDocsSelected = docIds.every((id) => tempSelectedIds.includes(id));
                      const someDeviceDocsSelected = docIds.some((id) => tempSelectedIds.includes(id));

                      return (
                        <div key={productId}>
                          {/* Device header */}
                          <div className="flex items-center space-x-2 py-1.5 hover:bg-muted/50 rounded-md px-1 cursor-pointer">
                            <Checkbox
                              id={`device-group-${productId}`}
                              checked={allDeviceDocsSelected}
                              // @ts-ignore
                              indeterminate={someDeviceDocsSelected && !allDeviceDocsSelected}
                              onCheckedChange={() => handleToggleDeviceDocs(productId, docs)}
                            />
                            <div
                              className="flex items-center gap-1.5 flex-1"
                              onClick={() => toggleDeviceExpand(productId)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              )}
                              <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-sm font-medium">{productName}</span>
                              <span className="text-xs text-muted-foreground">
                                ({docs.length})
                              </span>
                            </div>
                          </div>

                          {/* Document list under device */}
                          {isExpanded && (
                            <div className="ml-8 space-y-1 pb-1">
                              {docs.map((doc) => (
                                <div key={doc.id} className="flex items-center space-x-2 py-0.5">
                                  <Checkbox
                                    id={`dialog-doc-${doc.id}`}
                                    checked={tempSelectedIds.includes(doc.id)}
                                    onCheckedChange={() => handleToggleDocument(doc.id)}
                                  />
                                  <Label
                                    htmlFor={`dialog-doc-${doc.id}`}
                                    className="text-sm cursor-pointer flex items-center gap-1.5 font-normal"
                                  >
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span>{doc.name}</span>
                                  </Label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  {tempSelectedIds.length} document{tempSelectedIds.length !== 1 ? "s" : ""} selected
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={handleDone}>
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </Dialog>
    </>
  );
}
