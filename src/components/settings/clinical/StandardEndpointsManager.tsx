import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useStandardEndpoints, StandardEndpoint } from '@/hooks/useStandardEndpoints';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EndpointDialog } from './EndpointDialog';
import { useTranslation } from '@/hooks/useTranslation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface StandardEndpointsManagerProps {
  companyId: string;
}

export function StandardEndpointsManager({ companyId }: StandardEndpointsManagerProps) {
  const { lang } = useTranslation();
  const { primaryEndpoints, secondaryEndpoints, isLoading, deleteEndpoint } = useStandardEndpoints(companyId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<StandardEndpoint | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEndpoint, setDeletingEndpoint] = useState<StandardEndpoint | null>(null);

  const handleEdit = (endpoint: StandardEndpoint) => {
    setEditingEndpoint(endpoint);
    setDialogOpen(true);
  };

  const handleAdd = (type: 'primary' | 'secondary') => {
    setEditingEndpoint({ endpoint_type: type } as StandardEndpoint);
    setDialogOpen(true);
  };

  const handleDelete = (endpoint: StandardEndpoint) => {
    setDeletingEndpoint(endpoint);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingEndpoint) {
      await deleteEndpoint(deletingEndpoint.id);
      setDeleteDialogOpen(false);
      setDeletingEndpoint(null);
    }
  };

  const EndpointTable = ({ endpoints, type }: { endpoints: StandardEndpoint[], type: 'primary' | 'secondary' }) => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (endpoints.length === 0) {
      return (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground mb-4">
            {type === 'primary'
              ? lang('companyClinical.endpoints.noPrimaryEndpoints')
              : lang('companyClinical.endpoints.noSecondaryEndpoints')}
          </p>
          <Button onClick={() => handleAdd(type)}>
            <Plus className="h-4 w-4 mr-2" />
            {type === 'primary'
              ? lang('companyClinical.endpoints.addPrimaryEndpoint')
              : lang('companyClinical.endpoints.addSecondaryEndpoint')}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => handleAdd(type)}>
            <Plus className="h-4 w-4 mr-2" />
            {lang('companyClinical.endpoints.addEndpoint')}
          </Button>
        </div>
        <div className="rounded-md border">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.endpoints.headers.name')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.endpoints.headers.category')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.endpoints.headers.measurementCriteria')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{lang('companyClinical.endpoints.headers.references')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium">{lang('companyClinical.endpoints.headers.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {endpoints.map((endpoint) => (
                <tr key={endpoint.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <span className="font-medium">{endpoint.name}</span>
                    {endpoint.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {endpoint.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {endpoint.category && (
                      <Badge variant="outline">{endpoint.category}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                    {endpoint.measurement_criteria || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {endpoint.regulatory_references.map((ref, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {ref}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(endpoint)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(endpoint)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      <Tabs defaultValue="primary" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="primary">{lang('companyClinical.endpoints.tabs.primary')}</TabsTrigger>
          <TabsTrigger value="secondary">{lang('companyClinical.endpoints.tabs.secondary')}</TabsTrigger>
        </TabsList>
        <TabsContent value="primary" className="mt-6">
          <EndpointTable endpoints={primaryEndpoints} type="primary" />
        </TabsContent>
        <TabsContent value="secondary" className="mt-6">
          <EndpointTable endpoints={secondaryEndpoints} type="secondary" />
        </TabsContent>
      </Tabs>

      <EndpointDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        endpoint={editingEndpoint}
        companyId={companyId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang('companyClinical.endpoints.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang('companyClinical.endpoints.deleteDialog.description').replace('{{name}}', deletingEndpoint?.name || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{lang('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
