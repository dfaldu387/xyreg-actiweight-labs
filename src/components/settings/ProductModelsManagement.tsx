import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Trash2, Package, Pencil, Plus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CompanyProductModelsService, type CompanyProductModel } from '@/services/companyProductModelsService';
import { ProductModelCreateDialog } from './ProductModelCreateDialog';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface Props { companyId: string; }

export function ProductModelsManagement({ companyId }: Props) {
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<CompanyProductModel | null>(null);

  const { data: models = [], isLoading } = useQuery({
    queryKey: ['company-product-models', companyId],
    queryFn: () => CompanyProductModelsService.getDistinctModels(companyId),
    enabled: !!companyId,
    staleTime: 30 * 1000,
  });

  const handleCreateModel = async (name: string, description?: string) => {
    try {
      await CompanyProductModelsService.createModel(companyId, { name, description });
      queryClient.invalidateQueries({ queryKey: ['company-product-models', companyId] });
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateModel = async (name: string, description?: string) => {
    if (!editingModel?.id) return;
    try {
      await CompanyProductModelsService.updateModel(companyId, editingModel.id, { name, description });
      queryClient.invalidateQueries({ queryKey: ['company-product-models', companyId] });
      toast.success(lang('settings.models.updateSuccess'));
    } catch (error) {
      console.error(error);
      toast.error(lang('settings.models.updateError'));
      throw error;
    } finally {
      setEditingModel(null);
    }
  };

  const deleteModel = async (name: string) => {
    try {
      const affected = await CompanyProductModelsService.deleteModel(companyId, name);
      toast.success(lang('settings.models.deleteSuccess', { count: affected }));
      queryClient.invalidateQueries({ queryKey: ['company-product-models', companyId] });
    } catch (e) {
      console.error(e);
      toast.error(lang('settings.models.deleteError'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {lang('settings.models.title')}
                </CardTitle>
                <CardDescription>
                  {lang('settings.models.description', { count: models.length })}
                </CardDescription>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{lang('settings.models.sectionTitle')}</h4>
                <p className="text-sm text-muted-foreground">{lang('settings.models.sectionDescription')}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" /> {lang('settings.models.newModel')}
              </Button>
            </div>

            {models.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">{lang('settings.models.noModels')}</p>
                <p className="text-sm">{lang('settings.models.noModelsHint')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {models.map((m) => (
                  <div key={m.id || m.name} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{m.name}</h4>
                        {m.isStandalone && <Badge variant="secondary" className="text-xs">{lang('settings.models.standalone')}</Badge>}
                      </div>
                      {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
                      <div className="text-xs text-muted-foreground">
                        {lang('settings.models.productCount', { count: m.productCount })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {m.isStandalone && m.id && (
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingModel(m);
                          setIsEditOpen(true);
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{lang('settings.models.deleteTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {lang('settings.models.deleteConfirm', { name: m.name })}
                              <br /><br />
                              <strong>{lang('settings.models.deleteNote')}</strong> {lang('settings.models.deleteNoteText')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteModel(m.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              {lang('settings.models.deleteButton')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>

      <ProductModelCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreateModel}
      />

      <ProductModelCreateDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onCreate={handleUpdateModel}
        title={lang('settings.models.editTitle')}
        defaultValues={{
          name: editingModel?.name || '',
          description: editingModel?.description || ''
        }}
      />
    </Collapsible>
  );
}