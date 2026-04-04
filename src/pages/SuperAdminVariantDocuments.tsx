import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Layers, Search, Trash2, ExternalLink, Loader2, FileText } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VariantDevice {
  id: string;
  name: string;
  company_id: string;
  company_name: string;
  parent_product_id: string;
  master_name: string;
  doc_count: number;
}

interface VariantDoc {
  id: string;
  name: string;
  status: string | null;
  sub_section: string | null;
  source: "phase_assigned" | "documents";
}

export default function SuperAdminVariantDocuments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [selectedVariant, setSelectedVariant] = useState<VariantDevice | null>(null);
  const [variantDocs, setVariantDocs] = useState<VariantDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const { data: variants = [], isLoading } = useQuery({
    queryKey: ["super-admin-variant-devices"],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from("products")
        .select("id, name, company_id, parent_product_id, parent_relationship_type")
        .eq("parent_relationship_type", "variant")
        .not("parent_product_id", "is", null)
        .eq("is_archived", false);

      if (error) throw error;
      if (!products || products.length === 0) return [];

      const companyIds = [...new Set(products.map((p) => p.company_id))];
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name")
        .in("id", companyIds);
      const companyMap = new Map((companies || []).map((c) => [c.id, c.name]));

      const masterIds = [...new Set(products.map((p) => p.parent_product_id))];
      const { data: masters } = await supabase
        .from("products")
        .select("id, name")
        .in("id", masterIds);
      const masterMap = new Map((masters || []).map((m) => [m.id, m.name]));

      const variantIds = products.map((p) => p.id);
      const { data: docCounts } = await supabase
        .from("phase_assigned_document_template")
        .select("product_id")
        .in("product_id", variantIds);

      const countMap = new Map<string, number>();
      (docCounts || []).forEach((d: any) => {
        countMap.set(d.product_id, (countMap.get(d.product_id) || 0) + 1);
      });

      const { data: docTableCounts } = await supabase
        .from("documents")
        .select("product_id")
        .in("product_id", variantIds);

      (docTableCounts || []).forEach((d: any) => {
        countMap.set(d.product_id, (countMap.get(d.product_id) || 0) + 1);
      });

      return products.map((p) => ({
        id: p.id,
        name: p.name,
        company_id: p.company_id,
        company_name: companyMap.get(p.company_id) || "Unknown",
        parent_product_id: p.parent_product_id,
        master_name: masterMap.get(p.parent_product_id) || "Unknown",
        doc_count: countMap.get(p.id) || 0,
      }));
    },
  });

  const filteredVariants = useMemo(() => {
    if (!searchQuery.trim()) return variants;
    const q = searchQuery.toLowerCase();
    return variants.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.company_name.toLowerCase().includes(q) ||
        v.master_name.toLowerCase().includes(q)
    );
  }, [variants, searchQuery]);

  // Fetch documents when a variant is selected
  const handleOpenDeleteDialog = async (variant: VariantDevice) => {
    setSelectedVariant(variant);
    setSelectedDocIds(new Set());
    setLoadingDocs(true);
    setVariantDocs([]);

    try {
      // Fetch from phase_assigned_document_template
      const { data: phaseDocs } = await supabase
        .from("phase_assigned_document_template")
        .select("id, name, status, sub_section")
        .eq("product_id", variant.id);

      const docs: VariantDoc[] = (phaseDocs || []).map((d: any) => ({
        id: d.id,
        name: d.name || "Unnamed Document",
        status: d.status,
        sub_section: d.sub_section,
        source: "phase_assigned" as const,
      }));

      // Fetch from documents table
      const { data: tableDocs } = await supabase
        .from("documents")
        .select("id, title, status")
        .eq("product_id", variant.id);

      (tableDocs || []).forEach((d: any) => {
        docs.push({
          id: d.id,
          name: d.title || "Unnamed Document",
          status: d.status,
          sub_section: null,
          source: "documents" as const,
        });
      });

      setVariantDocs(docs);
    } catch (error: any) {
      toast.error(`Failed to load documents: ${error.message}`);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleToggleDoc = (docId: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedDocIds.size === variantDocs.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(variantDocs.map((d) => d.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedVariant || selectedDocIds.size === 0) return;

    setIsDeleting(true);
    try {
      const phaseDocIds = variantDocs
        .filter((d) => d.source === "phase_assigned" && selectedDocIds.has(d.id))
        .map((d) => d.id);

      const docTableIds = variantDocs
        .filter((d) => d.source === "documents" && selectedDocIds.has(d.id))
        .map((d) => d.id);

      if (phaseDocIds.length > 0) {
        const { error } = await supabase
          .from("phase_assigned_document_template")
          .delete()
          .in("id", phaseDocIds);
        if (error) throw error;
      }

      if (docTableIds.length > 0) {
        const { error } = await supabase
          .from("documents")
          .delete()
          .in("id", docTableIds);
        if (error) throw error;
      }

      toast.success(
        `Deleted ${selectedDocIds.size} document${selectedDocIds.size > 1 ? "s" : ""} from "${selectedVariant.name}"`
      );
      queryClient.invalidateQueries({ queryKey: ["super-admin-variant-devices"] });
      setSelectedVariant(null);
    } catch (error: any) {
      toast.error(`Failed to delete documents: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "in_review":
      case "in review":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "draft":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Layers className="h-6 w-6" />
          Variant Documents
        </h1>
        <p className="text-muted-foreground mt-1">
          View all variant devices and manage their documents. Variants inherit documents from their master device.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Variant Devices ({filteredVariants.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search variants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading variants...</span>
            </div>
          ) : filteredVariants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No variants match your search" : "No variant devices found"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant Device</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Master Device</TableHead>
                  <TableHead className="text-center">Docs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVariants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{variant.name}</span>
                        <Badge variant="outline" className="text-xs">Variant</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{variant.id}</span>
                    </TableCell>
                    <TableCell>{variant.company_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{variant.master_name}</span>
                        <a
                          href={`/app/product/${variant.parent_product_id}/documents`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                      <span className="text-xs text-muted-foreground">{variant.parent_product_id}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={variant.doc_count > 0 ? "default" : "secondary"}>
                        {variant.doc_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={variant.doc_count === 0 || deletingIds.has(variant.id)}
                        onClick={() => handleOpenDeleteDialog(variant)}
                      >
                        {deletingIds.has(variant.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Delete Docs
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Document Selection Dialog */}
      <Dialog open={!!selectedVariant} onOpenChange={(open) => !open && setSelectedVariant(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delete Documents — {selectedVariant?.name}</DialogTitle>
            <DialogDescription>
              Select which documents to delete from this variant. The variant will inherit these from its master device "{selectedVariant?.master_name}".
            </DialogDescription>
          </DialogHeader>

          {loadingDocs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading documents...</span>
            </div>
          ) : variantDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No documents found for this variant</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedDocIds.size === variantDocs.length && variantDocs.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    Select All ({variantDocs.length})
                  </span>
                </div>
                {selectedDocIds.size > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selectedDocIds.size} selected
                  </span>
                )}
              </div>

              <ScrollArea className="max-h-[400px] border rounded-md">
                <div className="divide-y">
                  {variantDocs.map((doc) => (
                    <label
                      key={doc.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedDocIds.has(doc.id)}
                        onCheckedChange={() => handleToggleDoc(doc.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{doc.name}</span>
                          {doc.status && (
                            <span className={`text-xs px-1.5 py-0.5 rounded border ${getStatusColor(doc.status)}`}>
                              {doc.status}
                            </span>
                          )}
                        </div>
                        {doc.sub_section && (
                          <span className="text-xs text-muted-foreground">{doc.sub_section}</span>
                        )}
                        <span className="text-xs text-muted-foreground block">{doc.id}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedVariant(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={selectedDocIds.size === 0 || isDeleting}
              onClick={handleDeleteSelected}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Delete {selectedDocIds.size > 0 ? `${selectedDocIds.size} Document${selectedDocIds.size > 1 ? "s" : ""}` : "Selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
