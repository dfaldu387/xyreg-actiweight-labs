import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Bug, AlertTriangle, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { useDefectsByProduct, computeDefectAnalytics, useUpdateDefect } from "@/hooks/useDefectsData";
import { DefectRecord } from "@/types/defect";
import { DefectSeverityBadge, DefectStatusBadge } from "./DefectSeverityBadge";
import { LogDefectDialog } from "./LogDefectDialog";
import { DefectDetailDialog } from "./DefectDetailDialog";
import { CAPACreateDialog } from "@/components/capa/CAPACreateDialog";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useCreateCCR } from "@/hooks/useChangeControlData";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface DefectsModuleProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function DefectsModule({ productId, companyId, disabled = false }: DefectsModuleProps) {
  const { data: defects = [], isLoading } = useDefectsByProduct(productId);
  const [logOpen, setLogOpen] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<DefectRecord | null>(null);

  // CAPA creation state
  const [capaDialogOpen, setCapaDialogOpen] = useState(false);
  const [capaSourceDefect, setCapaSourceDefect] = useState<DefectRecord | null>(null);

  const updateDefect = useUpdateDefect();
  const createCCR = useCreateCCR();
  const navigate = useNavigate();
  const analytics = computeDefectAnalytics(defects);

  const handleCreateCapa = (defect: DefectRecord) => {
    setCapaSourceDefect(defect);
    setSelectedDefect(null);
    setCapaDialogOpen(true);
  };

  const handleCapaCreated = async (open: boolean) => {
    if (!open && capaSourceDefect) {
      // Query for the newly created CAPA by source_id and link it back to the defect
      try {
        const { data } = await supabase
          .from('capa_records')
          .select('id')
          .eq('source_id', capaSourceDefect.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (data) {
          await updateDefect.mutateAsync({
            id: capaSourceDefect.id,
            linked_capa_id: data.id,
          });
          toast.success('CAPA linked to defect');
        }
      } catch (err) {
        // CAPA may not have been created (user cancelled)
      }
    }
    setCapaDialogOpen(false);
    setCapaSourceDefect(null);
  };

  const handleCreateCcr = async (defect: DefectRecord) => {
    try {
      const ccr = await createCCR.mutateAsync({
        company_id: companyId,
        product_id: productId,
        source_type: 'other',
        source_reference: defect.defect_id,
        change_type: 'design',
        title: `Fix: ${defect.title}`,
        description: `Change Control initiated from defect ${defect.defect_id}.\n\n${defect.description}`,
      });

      // Link CCR back to defect
      if (ccr?.id) {
        await updateDefect.mutateAsync({
          id: defect.id,
          linked_ccr_id: ccr.id,
        });
        toast.success('CCR linked to defect');
      }

      setSelectedDefect(null);
    } catch (err: any) {
      // Error handled by the hook's onError
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Defect Management</h3>
          <p className="text-sm text-muted-foreground">
            Closed-loop defect tracking with CAPA, CCR, and hazard traceability.
          </p>
        </div>
        <Button onClick={() => setLogOpen(true)} disabled={disabled}>
          <Plus className="h-4 w-4 mr-2" />
          Log Defect
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Open" count={analytics.byStatus.open} icon={<Clock className="h-4 w-4" />} color="text-yellow-600" />
        <SummaryCard label="In Progress" count={analytics.byStatus.in_progress} icon={<AlertTriangle className="h-4 w-4" />} color="text-blue-600" />
        <SummaryCard label="Resolved" count={analytics.byStatus.resolved} icon={<CheckCircle2 className="h-4 w-4" />} color="text-purple-600" />
        <SummaryCard label="Closed" count={analytics.byStatus.closed} icon={<CheckCircle2 className="h-4 w-4" />} color="text-green-600" />
      </div>

      {/* Defect Table or Empty State */}
      {defects.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">No Defects Logged</h4>
            <p className="text-muted-foreground mb-4">
              Defects will appear here when logged from test executions or manually.
            </p>
            <Button onClick={() => setLogOpen(true)} disabled={disabled}>
              <Plus className="h-4 w-4 mr-2" />
              Log First Defect
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-28">Severity</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-40">Linked To</TableHead>
                  <TableHead className="w-32">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {defects.map(d => (
                  <TableRow
                    key={d.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedDefect(d)}
                  >
                    <TableCell className="font-mono text-xs">{d.defect_id}</TableCell>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell><DefectSeverityBadge severity={d.severity as any} /></TableCell>
                    <TableCell><DefectStatusBadge status={d.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {d.linked_hazard_id && <Badge variant="outline" className="text-xs">HAZ</Badge>}
                        {d.linked_capa_id && (
                          <Badge
                            variant="outline"
                            className="text-xs border-orange-500 text-orange-700 cursor-pointer hover:bg-orange-50"
                            onClick={(e) => { e.stopPropagation(); navigate(`/app/capa/${d.linked_capa_id}`); }}
                          >
                            CAPA
                          </Badge>
                        )}
                        {d.linked_ccr_id && (
                          <Badge
                            variant="outline"
                            className="text-xs border-blue-500 text-blue-700 cursor-pointer hover:bg-blue-50"
                            onClick={(e) => { e.stopPropagation(); navigate(`/app/change-control/${d.linked_ccr_id}`); }}
                          >
                            CCR
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(d.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <LogDefectDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        productId={productId}
        companyId={companyId}
      />

      <DefectDetailDialog
        open={!!selectedDefect}
        onOpenChange={open => { if (!open) setSelectedDefect(null); }}
        defect={selectedDefect}
        onCreateCapa={handleCreateCapa}
        onCreateCcr={handleCreateCcr}
      />

      {/* CAPA Creation Dialog — pre-filled from defect */}
      {capaSourceDefect && (
        <CAPACreateDialog
          open={capaDialogOpen}
          onOpenChange={handleCapaCreated}
          companyId={companyId}
          productId={productId}
          defaultSourceType="defect"
          defaultSourceId={capaSourceDefect.id}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, count, icon, color }: { label: string; count: number; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={color}>{icon}</div>
        <div>
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
