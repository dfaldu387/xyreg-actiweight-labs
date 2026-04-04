import React from 'react';
import { useNCEvidence, useUploadNCEvidence, useDeleteNCEvidence } from '@/hooks/useNonconformityData';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Trash2, Upload, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

interface NCEvidencePanelProps {
  ncId: string;
}

export function NCEvidencePanel({ ncId }: NCEvidencePanelProps) {
  const { user } = useAuth();
  const { data: evidence = [], isLoading } = useNCEvidence(ncId);
  const uploadMutation = useUploadNCEvidence();
  const deleteMutation = useDeleteNCEvidence();
  const { lang } = useTranslation();

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !user?.id) return;
      await uploadMutation.mutateAsync({
        ncId,
        file,
        evidenceType: 'other',
        userId: user.id,
      });
    };
    input.click();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{lang('nonconformity.evidence')}</CardTitle>
        <Button size="sm" onClick={handleUpload} disabled={uploadMutation.isPending}>
          <Upload className="h-4 w-4 mr-2" />
          {lang('nonconformity.upload')}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4"><LoadingSpinner /></div>
        ) : evidence.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">{lang('nonconformity.noEvidence')}</p>
        ) : (
          <div className="space-y-2">
            {evidence.map((e) => (
              <div key={e.id} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{e.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate({ id: e.id, storagePath: e.storage_path, ncId })}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
