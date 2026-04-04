import React, { useState } from 'react';
import { NCRecord, NC_DISPOSITION_LABELS, NCDisposition } from '@/types/nonconformity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useUpdateNC } from '@/hooks/useNonconformityData';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface NCDispositionTabProps {
  nc: NCRecord;
}

export function NCDispositionTab({ nc }: NCDispositionTabProps) {
  const updateMutation = useUpdateNC();
  const [disposition, setDisposition] = useState<NCDisposition | ''>(nc.disposition || '');
  const [justification, setJustification] = useState(nc.disposition_justification || '');
  const { lang } = useTranslation();

  const isConcession = disposition === 'concession';

  const handleSave = () => {
    updateMutation.mutate({
      id: nc.id,
      updates: {
        disposition: disposition || null,
        disposition_justification: justification || null,
      },
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle>{lang('nonconformity.dispositionDecision')}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>{lang('nonconformity.dispositionLabel')}</Label>
          <Select value={disposition} onValueChange={(v) => setDisposition(v as NCDisposition)}>
            <SelectTrigger><SelectValue placeholder={lang('nonconformity.selectDisposition')} /></SelectTrigger>
            <SelectContent>
              {Object.entries(NC_DISPOSITION_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isConcession && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>{lang('nonconformity.concessionWarning')}</strong>
            </div>
          </div>
        )}

        <div>
          <Label>{isConcession ? lang('nonconformity.justificationConcession') : lang('nonconformity.justification')}</Label>
          <Textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={4}
            placeholder={lang('nonconformity.justificationPlaceholder')}
          />
        </div>

        <div className="flex justify-end gap-2">
          {nc.linked_capa_id && (
            <p className="text-sm text-muted-foreground self-center">{lang('nonconformity.linkedToCAPA')}</p>
          )}
          <Button onClick={handleSave} disabled={updateMutation.isPending || (isConcession && !justification.trim())}>
            {updateMutation.isPending ? lang('nonconformity.saving') : lang('nonconformity.saveDisposition')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
