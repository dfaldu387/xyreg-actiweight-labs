import React, { useState } from 'react';
import { InspectionRecord, INSPECTION_STATUS_LABELS, INSPECTION_DISPOSITION_LABELS, INSPECTION_STATE_GATES, InspectionStatus } from '@/types/incomingInspection';
import { useUpdateInspection } from '@/hooks/useIncomingInspection';
import { useInspectionItems, useCreateInspectionItem, useUpdateInspectionItem } from '@/hooks/useIncomingInspection';
import { incomingInspectionService } from '@/services/incomingInspectionService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface InspectionDetailPanelProps {
  inspection: InspectionRecord;
  userId: string;
  onBack: () => void;
}

export function InspectionDetailPanel({ inspection, userId, onBack }: InspectionDetailPanelProps) {
  const { lang } = useTranslation();
  const updateMutation = useUpdateInspection();
  const { data: items = [], isLoading: itemsLoading } = useInspectionItems(inspection.id);
  const createItemMutation = useCreateInspectionItem();
  const updateItemMutation = useUpdateInspectionItem();

  const [dispositionNotes, setDispositionNotes] = useState(inspection.disposition_notes || '');
  const [newCheckName, setNewCheckName] = useState('');
  const [newSpec, setNewSpec] = useState('');

  const nextStatuses = INSPECTION_STATE_GATES[inspection.status] || [];

  const handleTransition = async (toStatus: InspectionStatus) => {
    try {
      await incomingInspectionService.transitionState(inspection.id, inspection.status, toStatus, userId);
      toast.success(lang('deviceOperations.inspection.detail.statusChanged', { status: INSPECTION_STATUS_LABELS[toStatus] }));
      // Parent will refetch
    } catch (err: any) {
      toast.error(err.message || lang('deviceOperations.inspection.detail.statusChangeFailed'));
    }
  };

  const handleSetDisposition = async (disposition: string) => {
    try {
      await updateMutation.mutateAsync({
        id: inspection.id,
        updates: { disposition, disposition_notes: dispositionNotes },
      });

      // Auto-create NC on rejection
      if (disposition === 'rejected') {
        const ncId = await incomingInspectionService.createNCFromRejection(
          { ...inspection, disposition: 'rejected' as any, disposition_notes: dispositionNotes },
          userId
        );
        if (ncId) {
          toast.success(lang('deviceOperations.inspection.detail.ncAutoCreated'));
        }
      }
    } catch (err) {
      toast.error(lang('deviceOperations.inspection.detail.dispositionFailed'));
    }
  };

  const handleAddItem = async () => {
    if (!newCheckName.trim()) return;
    await createItemMutation.mutateAsync({
      inspection_id: inspection.id,
      check_name: newCheckName,
      specification: newSpec || null,
      sort_order: items.length,
    });
    setNewCheckName('');
    setNewSpec('');
  };

  const handleItemResult = async (itemId: string, result: string) => {
    await updateItemMutation.mutateAsync({ id: itemId, updates: { result } });
  };

  const handleItemMeasured = async (itemId: string, measured_value: string) => {
    await updateItemMutation.mutateAsync({ id: itemId, updates: { measured_value } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {lang('deviceOperations.inspection.detail.backToList')}
        </Button>
        <span className="font-mono text-lg font-bold">{inspection.inspection_id}</span>
        <Badge variant="secondary">{INSPECTION_STATUS_LABELS[inspection.status]}</Badge>
        <Badge variant={inspection.disposition === 'rejected' ? 'destructive' : 'outline'}>
          {INSPECTION_DISPOSITION_LABELS[inspection.disposition]}
        </Badge>
      </div>

      {/* Status Actions */}
      {nextStatuses.length > 0 && (
        <div className="flex gap-2">
          {nextStatuses.map((s) => (
            <Button key={s} variant="outline" size="sm" onClick={() => handleTransition(s)}>
              → {INSPECTION_STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
      )}

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">{lang('deviceOperations.inspection.detail.detailsTab')}</TabsTrigger>
          <TabsTrigger value="checks">{lang('deviceOperations.inspection.detail.checksTab', { count: items.length })}</TabsTrigger>
          <TabsTrigger value="disposition">{lang('deviceOperations.inspection.detail.dispositionTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{lang('deviceOperations.inspection.detail.shipmentInfo')}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">{lang('deviceOperations.inspection.detail.material')}</span> <span>{inspection.material_description || '—'}</span></div>
              <div><span className="text-muted-foreground">{lang('deviceOperations.inspection.detail.poNumber')}</span> <span>{inspection.purchase_order_number || '—'}</span></div>
              <div><span className="text-muted-foreground">{lang('deviceOperations.inspection.detail.lotBatch')}</span> <span>{inspection.lot_batch_number || '—'}</span></div>
              <div><span className="text-muted-foreground">{lang('deviceOperations.inspection.detail.qtyReceived')}</span> <span>{inspection.quantity_received ?? '—'}</span></div>
              <div><span className="text-muted-foreground">{lang('deviceOperations.inspection.detail.qtyInspected')}</span> <span>{inspection.quantity_inspected ?? '—'}</span></div>
              <div><span className="text-muted-foreground">{lang('deviceOperations.inspection.detail.cocReceived')}</span> <span>{inspection.coc_received ? lang('deviceOperations.inspection.detail.cocYes', { ref: inspection.coc_reference || 'N/A' }) : lang('deviceOperations.inspection.detail.cocNo')}</span></div>
            </CardContent>
          </Card>

          {inspection.linked_nc_id && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="py-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm">{lang('deviceOperations.inspection.detail.linkedNc', { ncId: inspection.linked_nc_id })}</span>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="checks" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang('deviceOperations.inspection.detail.checksHeaders.check')}</TableHead>
                <TableHead>{lang('deviceOperations.inspection.detail.checksHeaders.specification')}</TableHead>
                <TableHead>{lang('deviceOperations.inspection.detail.checksHeaders.measuredValue')}</TableHead>
                <TableHead>{lang('deviceOperations.inspection.detail.checksHeaders.result')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.check_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.specification || '—'}</TableCell>
                  <TableCell>
                    <Input
                      className="h-8 w-32"
                      defaultValue={item.measured_value || ''}
                      onBlur={(e) => handleItemMeasured(item.id, e.target.value)}
                      placeholder={lang('deviceOperations.inspection.detail.enterValue')}
                    />
                  </TableCell>
                  <TableCell>
                    <Select defaultValue={item.result || ''} onValueChange={(v) => handleItemResult(item.id, v)}>
                      <SelectTrigger className="h-8 w-24"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">{lang('deviceOperations.inspection.detail.resultPass')}</SelectItem>
                        <SelectItem value="fail">{lang('deviceOperations.inspection.detail.resultFail')}</SelectItem>
                        <SelectItem value="na">{lang('deviceOperations.inspection.detail.resultNa')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs">{lang('deviceOperations.inspection.detail.checkName')}</Label>
              <Input value={newCheckName} onChange={(e) => setNewCheckName(e.target.value)} placeholder={lang('deviceOperations.inspection.detail.checkNamePlaceholder')} className="h-8" />
            </div>
            <div className="flex-1">
              <Label className="text-xs">{lang('deviceOperations.inspection.detail.specificationLabel')}</Label>
              <Input value={newSpec} onChange={(e) => setNewSpec(e.target.value)} placeholder={lang('deviceOperations.inspection.detail.specificationPlaceholder')} className="h-8" />
            </div>
            <Button size="sm" onClick={handleAddItem} disabled={!newCheckName.trim()}>
              <Plus className="h-3 w-3 mr-1" /> {lang('deviceOperations.inspection.detail.add')}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="disposition" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{lang('deviceOperations.inspection.detail.dispositionDecision')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{lang('deviceOperations.inspection.detail.dispositionNotes')}</Label>
                <Textarea value={dispositionNotes} onChange={(e) => setDispositionNotes(e.target.value)} placeholder={lang('deviceOperations.inspection.detail.dispositionNotesPlaceholder')} rows={3} />
              </div>

              <div className="flex gap-2">
                <Button variant="default" onClick={() => handleSetDisposition('accepted')} disabled={updateMutation.isPending}>
                  ✓ {lang('deviceOperations.inspection.detail.accept')}
                </Button>
                <Button variant="outline" onClick={() => handleSetDisposition('conditional_accept')} disabled={updateMutation.isPending}>
                  {lang('deviceOperations.inspection.detail.conditionalAccept')}
                </Button>
                <Button variant="destructive" onClick={() => handleSetDisposition('rejected')} disabled={updateMutation.isPending}>
                  ✗ {lang('deviceOperations.inspection.detail.rejectCreatesNc')}
                </Button>
              </div>

              {inspection.disposition === 'rejected' && (
                <div className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {lang('deviceOperations.inspection.detail.rejectedMessage')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
