import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';
import { useStudyTypeConfigs, StudyTypeConfig } from '@/hooks/useStudyTypeConfigs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTranslation } from '@/hooks/useTranslation';

interface StudyTypeConfigTableProps {
  companyId: string;
  onConfigure: (config: StudyTypeConfig) => void;
}

export function StudyTypeConfigTable({ companyId, onConfigure }: StudyTypeConfigTableProps) {
  const { lang } = useTranslation();
  const { configs, isLoading, toggleEnabled } = useStudyTypeConfigs(companyId);

  const studyTypeLabels: Record<string, string> = {
    feasibility: lang('companyClinical.studyTypeLabels.feasibility'),
    pivotal: lang('companyClinical.studyTypeLabels.pivotal'),
    pmcf: lang('companyClinical.studyTypeLabels.pmcf'),
    registry: lang('companyClinical.studyTypeLabels.registry'),
    other: lang('companyClinical.studyTypeLabels.other')
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {lang('companyClinical.studyTypeTable.noConfigs')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.studyTypeTable.headers.studyType')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.studyTypeTable.headers.enabled')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.studyTypeTable.headers.enrollment')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.studyTypeTable.headers.timeline')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.studyTypeTable.headers.requirements')}</th>
              <th className="px-4 py-3 text-right text-sm font-medium">{lang('companyClinical.studyTypeTable.headers.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {configs.map((config) => (
              <tr key={config.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <span className="font-medium">
                    {studyTypeLabels[config.study_type] || config.study_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={config.is_enabled}
                    onCheckedChange={(checked) => toggleEnabled(config.id, checked)}
                  />
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {config.default_min_enrollment && config.default_max_enrollment
                    ? `${config.default_min_enrollment} - ${config.default_max_enrollment}`
                    : lang('companyClinical.studyTypeTable.notSet')}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {config.typical_timeline_months
                    ? lang('companyClinical.studyTypeTable.months').replace('{{count}}', String(config.typical_timeline_months))
                    : lang('companyClinical.studyTypeTable.notSet')}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary">
                    {lang('companyClinical.studyTypeTable.documents').replace('{{count}}', String(config.required_documents.length))}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onConfigure(config)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    {lang('companyClinical.studyTypeTable.configure')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
