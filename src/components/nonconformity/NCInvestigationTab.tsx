import React from 'react';
import { NCRecord, NC_ROOT_CAUSE_CATEGORY_LABELS } from '@/types/nonconformity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateNC } from '@/hooks/useNonconformityData';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface NCInvestigationTabProps {
  nc: NCRecord;
}

export function NCInvestigationTab({ nc }: NCInvestigationTabProps) {
  const updateMutation = useUpdateNC();
  const [rootCause, setRootCause] = useState(nc.root_cause_summary || '');
  const [category, setCategory] = useState(nc.root_cause_category || '');
  const { lang } = useTranslation();

  const handleSave = () => {
    updateMutation.mutate({
      id: nc.id,
      updates: {
        root_cause_summary: rootCause,
        root_cause_category: category || null,
      },
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>{lang('nonconformity.rootCauseInvestigation')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{lang('nonconformity.rootCauseSummary')}</Label>
            <Textarea
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              rows={4}
              placeholder={lang('nonconformity.rootCausePlaceholder')}
            />
          </div>

          <div>
            <Label>{lang('nonconformity.rootCauseCategory')}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder={lang('nonconformity.selectCategory')} /></SelectTrigger>
              <SelectContent>
                {Object.entries(NC_ROOT_CAUSE_CATEGORY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? lang('nonconformity.saving') : lang('nonconformity.saveInvestigation')}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {lang('nonconformity.investigationTip')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
