import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Trash2, Layers, Pencil, Plus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CompanyPlatformService, type CompanyPlatform } from '@/services/companyPlatformService';
import { ProductPlatformCreateDialog } from './ProductPlatformCreateDialog';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface Props { companyId: string; }

export function ProductPlatformsManagement({ companyId }: Props) {
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<CompanyPlatform | null>(null);

  const { data: platforms = [], isLoading } = useQuery({
    queryKey: ['company-platforms', companyId],
    queryFn: () => CompanyPlatformService.getDistinctPlatforms(companyId),
    enabled: !!companyId,
    staleTime: 30 * 1000,
  });

  const handleCreatePlatform = async (name: string, description?: string) => {
    try {
      await CompanyPlatformService.createPlatform(companyId, { name, description });
      queryClient.invalidateQueries({ queryKey: ['company-platforms', companyId] });
    } catch (error) {
      throw error;
    }
  };

  const handleUpdatePlatform = async (name: string, description?: string) => {
    if (!editingPlatform?.id) return;
    try {
      await CompanyPlatformService.updatePlatform(companyId, editingPlatform.id, { name, description });
      queryClient.invalidateQueries({ queryKey: ['company-platforms', companyId] });
      toast.success(lang('settings.platforms.updateSuccess'));
    } catch (error) {
      console.error(error);
      toast.error(lang('settings.platforms.updateError'));
      throw error;
    } finally {
      setEditingPlatform(null);
    }
  };

  const deletePlatform = async (name: string) => {
    try {
      const affected = await CompanyPlatformService.deletePlatform(companyId, name);
      toast.success(lang('settings.platforms.deleteSuccess', { count: affected }));
      queryClient.invalidateQueries({ queryKey: ['company-platforms', companyId] });
    } catch (e) {
      console.error(e);
      toast.error(lang('settings.platforms.deleteError'));
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
                  <Layers className="h-5 w-5" />
                  {lang('settings.platforms.title')}
                </CardTitle>
                <CardDescription>
                  {lang('settings.platforms.description', { count: platforms.length })}
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
                <h4 className="font-medium">{lang('settings.platforms.sectionTitle')}</h4>
                <p className="text-sm text-muted-foreground">{lang('settings.platforms.sectionDescription')}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" /> {lang('settings.platforms.newPlatform')}
              </Button>
            </div>

            {platforms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">{lang('settings.platforms.noPlatforms')}</p>
                <p className="text-sm">{lang('settings.platforms.noPlatformsHint')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {platforms.map((p) => (
                  <div key={p.id || p.name} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{p.name}</h4>
                        {p.isStandalone && <Badge variant="secondary" className="text-xs">{lang('settings.platforms.standalone')}</Badge>}
                      </div>
                      {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                      <div className="text-xs text-muted-foreground">
                        {lang('settings.platforms.productCount', { count: p.productCount })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {p.isStandalone && p.id && (
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingPlatform(p);
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
                            <AlertDialogTitle>{lang('settings.platforms.deleteTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {lang('settings.platforms.deleteConfirm', { name: p.name })}
                              <br /><br />
                              <strong>{lang('settings.platforms.deleteNote')}</strong> {lang('settings.platforms.deleteNoteText')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletePlatform(p.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              {lang('settings.platforms.deleteButton')}
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

      <ProductPlatformCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreatePlatform}
      />

      <ProductPlatformCreateDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onCreate={handleUpdatePlatform}
        title={lang('settings.platforms.editTitle')}
        defaultValues={{
          name: editingPlatform?.name || '',
          description: editingPlatform?.description || ''
        }}
      />
    </Collapsible>
  );
}