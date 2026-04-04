import React, { useState } from 'react';
import { ProductionOrder, PRODUCTION_STATUS_LABELS, BATCH_DISPOSITION_LABELS, PRODUCTION_STATE_GATES, ProductionOrderStatus, CHECKPOINT_RESULT_LABELS } from '@/types/production';
import { useUpdateProductionOrder, useProductionCheckpoints, useCreateProductionCheckpoint, useUpdateProductionCheckpoint } from '@/hooks/useProduction';
import { productionService } from '@/services/productionService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, AlertTriangle, FileText, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useBomRevision, useBomItems } from '@/hooks/useBom';
import { useTranslation } from '@/hooks/useTranslation';

interface ProductionOrderDetailPanelProps {
  order: ProductionOrder;
  userId: string;
  onBack: () => void;
}

export function ProductionOrderDetailPanel({ order, userId, onBack }: ProductionOrderDetailPanelProps) {
  const { lang } = useTranslation();
  const updateMutation = useUpdateProductionOrder();
  const { data: checkpoints = [] } = useProductionCheckpoints(order.id);
  const createCheckpointMutation = useCreateProductionCheckpoint();
  const updateCheckpointMutation = useUpdateProductionCheckpoint();

  const { data: bomRevision } = useBomRevision(order.bom_revision_id || undefined);
  const { data: bomItems = [] } = useBomItems(order.bom_revision_id || undefined);
  const [dispositionNotes, setDispositionNotes] = useState(order.disposition_notes || '');
  const [newCheckName, setNewCheckName] = useState('');
  const [newSpec, setNewSpec] = useState('');
  const [quantityProduced, setQuantityProduced] = useState(String(order.quantity_produced));

  const nextStatuses = PRODUCTION_STATE_GATES[order.status] || [];

  const handleTransition = async (toStatus: ProductionOrderStatus) => {
    try {
      await productionService.transitionState(order.id, order.status, toStatus, userId);
      toast.success(lang('deviceOperations.production.detail.statusChanged', { status: PRODUCTION_STATUS_LABELS[toStatus] }));
    } catch (err: any) {
      toast.error(err.message || lang('deviceOperations.production.detail.statusChangeFailed'));
    }
  };

  const handleSetDisposition = async (disposition: string) => {
    try {
      await productionService.setDisposition(order.id, disposition, dispositionNotes, userId);
      toast.success(lang('deviceOperations.production.detail.dispositionSet', { disposition }));

      if (disposition === 'rejected') {
        const ncId = await productionService.createNCFromRejection(
          { ...order, disposition: 'rejected' as any, disposition_notes: dispositionNotes },
          userId
        );
        if (ncId) toast.success(lang('deviceOperations.production.detail.ncAutoCreated'));
      }
    } catch (err) {
      toast.error(lang('deviceOperations.production.detail.dispositionFailed'));
    }
  };

  const handleAddCheckpoint = async () => {
    if (!newCheckName.trim()) return;
    await createCheckpointMutation.mutateAsync({
      order_id: order.id,
      checkpoint_name: newCheckName,
      specification: newSpec || null,
      sort_order: checkpoints.length,
    });
    setNewCheckName('');
    setNewSpec('');
  };

  const handleCheckpointResult = async (id: string, result: string) => {
    await updateCheckpointMutation.mutateAsync({ id, updates: { result, inspected_at: new Date().toISOString() } });
  };

  const handleCheckpointMeasured = async (id: string, measured_value: string) => {
    await updateCheckpointMutation.mutateAsync({ id, updates: { measured_value } });
  };

  const handleUpdateQuantity = async () => {
    const qty = Number(quantityProduced);
    await updateMutation.mutateAsync({ id: order.id, updates: { quantity_produced: qty } });
  };

  const handleGenerateDHR = async () => {
    try {
      await productionService.markDHRGenerated(order.id, userId);
      toast.success(lang('deviceOperations.production.detail.dhrMarked'));
    } catch (err) {
      toast.error(lang('deviceOperations.production.detail.dhrFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {lang('deviceOperations.production.detail.backToList')}
        </Button>
        <span className="font-mono text-lg font-bold">{order.order_id}</span>
        <Badge variant="secondary">{PRODUCTION_STATUS_LABELS[order.status]}</Badge>
        <Badge variant={order.disposition === 'rejected' ? 'destructive' : 'outline'}>
          {BATCH_DISPOSITION_LABELS[order.disposition]}
        </Badge>
        {order.dhr_generated && (
          <Badge variant="default" className="gap-1"><FileText className="h-3 w-3" /> DHR</Badge>
        )}
      </div>

      {nextStatuses.length > 0 && (
        <div className="flex gap-2">
          {nextStatuses.map((s) => (
            <Button key={s} variant="outline" size="sm" onClick={() => handleTransition(s)}>
              → {PRODUCTION_STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
      )}

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">{lang('deviceOperations.production.detail.detailsTab')}</TabsTrigger>
          {order.bom_revision_id && <TabsTrigger value="bom">{lang('deviceOperations.production.detail.bomTab')}</TabsTrigger>}
          <TabsTrigger value="checkpoints">{lang('deviceOperations.production.detail.checkpointsTab', { count: checkpoints.length })}</TabsTrigger>
          <TabsTrigger value="disposition">{lang('deviceOperations.production.detail.dispositionTab')}</TabsTrigger>
          <TabsTrigger value="dhr">{lang('deviceOperations.production.detail.dhrTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{lang('deviceOperations.production.detail.batchInfo')}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">{lang('deviceOperations.production.detail.batch')}</span> <span>{order.batch_number || '—'}</span></div>
              <div><span className="text-muted-foreground">{lang('deviceOperations.production.detail.lot')}</span> <span>{order.lot_number || '—'}</span></div>
              <div><span className="text-muted-foreground">{lang('deviceOperations.production.detail.serialRange')}</span> <span>{order.serial_number_range || '—'}</span></div>
              <div><span className="text-muted-foreground">{lang('deviceOperations.production.detail.qtyPlanned')}</span> <span>{order.quantity_planned ?? '—'}</span></div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <span className="text-muted-foreground">{lang('deviceOperations.production.detail.qtyProduced')}</span>
                  <Input className="h-8 mt-1" type="number" value={quantityProduced} onChange={(e) => setQuantityProduced(e.target.value)} />
                </div>
                <Button size="sm" variant="outline" onClick={handleUpdateQuantity}>{lang('deviceOperations.production.detail.save')}</Button>
              </div>
              <div><span className="text-muted-foreground">{lang('deviceOperations.production.detail.qtyAccepted')}</span> <span>{order.quantity_accepted}</span></div>
            </CardContent>
          </Card>

          {order.linked_nc_id && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="py-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm">{lang('deviceOperations.production.detail.linkedNc', { ncId: order.linked_nc_id })}</span>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {order.bom_revision_id && (
          <TabsContent value="bom" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" /> {lang('deviceOperations.production.detail.linkedBom', { revision: bomRevision?.revision || '...' })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bomRevision && (
                  <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                    <div><span className="text-muted-foreground">{lang('deviceOperations.production.detail.bomStatus')}</span> <Badge variant="secondary">{bomRevision.status}</Badge></div>
                    <div><span className="text-muted-foreground">{lang('deviceOperations.production.detail.bomTotalCost')}</span> {bomRevision.currency} {bomRevision.total_cost.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">{lang('deviceOperations.production.detail.bomItems')}</span> {bomItems.length}</div>
                  </div>
                )}
                {bomItems.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{lang('deviceOperations.production.detail.bomHeaders.number')}</TableHead>
                        <TableHead>{lang('deviceOperations.production.detail.bomHeaders.description')}</TableHead>
                        <TableHead className="text-right">{lang('deviceOperations.production.detail.bomHeaders.qty')}</TableHead>
                        <TableHead className="text-right">{lang('deviceOperations.production.detail.bomHeaders.unitCost')}</TableHead>
                        <TableHead className="text-right">{lang('deviceOperations.production.detail.bomHeaders.extended')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bomItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs">{item.item_number}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity} {item.unit_of_measure}</TableCell>
                          <TableCell className="text-right">{item.unit_cost.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">{item.extended_cost.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="checkpoints" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang('deviceOperations.production.detail.checkpointHeaders.checkpoint')}</TableHead>
                <TableHead>{lang('deviceOperations.production.detail.checkpointHeaders.specification')}</TableHead>
                <TableHead>{lang('deviceOperations.production.detail.checkpointHeaders.measured')}</TableHead>
                <TableHead>{lang('deviceOperations.production.detail.checkpointHeaders.result')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checkpoints.map((cp) => (
                <TableRow key={cp.id}>
                  <TableCell className="font-medium">{cp.checkpoint_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{cp.specification || '—'}</TableCell>
                  <TableCell>
                    <Input className="h-8 w-32" defaultValue={cp.measured_value || ''} onBlur={(e) => handleCheckpointMeasured(cp.id, e.target.value)} placeholder={lang('deviceOperations.production.detail.enterValue')} />
                  </TableCell>
                  <TableCell>
                    <Select defaultValue={cp.result || 'pending'} onValueChange={(v) => handleCheckpointResult(cp.id, v)}>
                      <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CHECKPOINT_RESULT_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs">{lang('deviceOperations.production.detail.checkpointName')}</Label>
              <Input value={newCheckName} onChange={(e) => setNewCheckName(e.target.value)} placeholder={lang('deviceOperations.production.detail.checkpointNamePlaceholder')} className="h-8" />
            </div>
            <div className="flex-1">
              <Label className="text-xs">{lang('deviceOperations.production.detail.specificationLabel')}</Label>
              <Input value={newSpec} onChange={(e) => setNewSpec(e.target.value)} placeholder={lang('deviceOperations.production.detail.specificationPlaceholder')} className="h-8" />
            </div>
            <Button size="sm" onClick={handleAddCheckpoint} disabled={!newCheckName.trim()}>
              <Plus className="h-3 w-3 mr-1" /> {lang('deviceOperations.production.detail.add')}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="disposition" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{lang('deviceOperations.production.detail.batchReleaseDecision')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{lang('deviceOperations.production.detail.dispositionNotes')}</Label>
                <Textarea value={dispositionNotes} onChange={(e) => setDispositionNotes(e.target.value)} placeholder={lang('deviceOperations.production.detail.dispositionNotesPlaceholder')} rows={3} />
              </div>
              <div className="flex gap-2">
                <Button variant="default" onClick={() => handleSetDisposition('released')}>✓ {lang('deviceOperations.production.detail.releaseBatch')}</Button>
                <Button variant="outline" onClick={() => handleSetDisposition('on_hold')}>{lang('deviceOperations.production.detail.hold')}</Button>
                <Button variant="outline" onClick={() => handleSetDisposition('quarantined')}>{lang('deviceOperations.production.detail.quarantine')}</Button>
                <Button variant="destructive" onClick={() => handleSetDisposition('rejected')}>✗ {lang('deviceOperations.production.detail.rejectCreatesNc')}</Button>
              </div>
              {order.disposition === 'rejected' && (
                <div className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {lang('deviceOperations.production.detail.rejectedMessage')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dhr" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{lang('deviceOperations.production.detail.dhrTitle')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {lang('deviceOperations.production.detail.dhrDescription')}
              </p>

              <div className="grid grid-cols-2 gap-3 text-sm border rounded-lg p-4 bg-muted/30">
                <div><span className="font-medium">{lang('deviceOperations.production.detail.dhrOrder')}</span> {order.order_id}</div>
                <div><span className="font-medium">{lang('deviceOperations.production.detail.dhrBatch')}</span> {order.batch_number || '—'}</div>
                <div><span className="font-medium">{lang('deviceOperations.production.detail.dhrLot')}</span> {order.lot_number || '—'}</div>
                <div><span className="font-medium">{lang('deviceOperations.production.detail.dhrStatus')}</span> {PRODUCTION_STATUS_LABELS[order.status]}</div>
                <div><span className="font-medium">{lang('deviceOperations.production.detail.dhrDisposition')}</span> {BATCH_DISPOSITION_LABELS[order.disposition]}</div>
                <div><span className="font-medium">{lang('deviceOperations.production.detail.dhrQtyProduced')}</span> {order.quantity_produced}</div>
               <div><span className="font-medium">{lang('deviceOperations.production.detail.dhrCheckpoints')}</span> {lang('deviceOperations.production.detail.dhrCheckpointsSummary', { total: checkpoints.length, passed: checkpoints.filter(c => c.result === 'pass').length })}</div>
                <div><span className="font-medium">{lang('deviceOperations.production.detail.dhrOperators')}</span> {order.operator_ids.length || '—'}</div>
                {bomRevision && <div><span className="font-medium">{lang('deviceOperations.production.detail.dhrBom')}</span> {lang('deviceOperations.production.detail.dhrBomSummary', { revision: bomRevision.revision, status: bomRevision.status })}</div>}
              </div>

              {order.dhr_generated ? (
                <div className="text-sm text-primary flex items-center gap-1">
                  <FileText className="h-4 w-4" /> {lang('deviceOperations.production.detail.dhrGenerated', { date: new Date(order.dhr_generated_at!).toLocaleDateString() })}
                </div>
              ) : (
                <Button onClick={handleGenerateDHR} disabled={order.status !== 'released'}>
                  <FileText className="h-4 w-4 mr-1" /> {lang('deviceOperations.production.detail.generateDhr')}
                </Button>
              )}
              {order.status !== 'released' && !order.dhr_generated && (
                <p className="text-xs text-muted-foreground">{lang('deviceOperations.production.detail.dhrOnlyAfterRelease')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
