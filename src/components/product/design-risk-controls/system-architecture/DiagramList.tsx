import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Eye, Edit, Trash2, Download, Copy } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { SystemArchitectureDiagram, SystemArchitectureService } from '@/services/systemArchitectureService';
import { formatDistanceToNow } from 'date-fns';

interface DiagramListProps {
  diagrams: SystemArchitectureDiagram[];
  onDiagramSelect: (diagram: SystemArchitectureDiagram) => void;
  onDiagramEdit: (diagram: SystemArchitectureDiagram) => void;
  onDiagramDeleted: () => void;
  disabled?: boolean;
}

export function DiagramList({ diagrams, onDiagramSelect, onDiagramEdit, onDiagramDeleted, disabled = false }: DiagramListProps) {
  const { toast } = useToast();
  const { lang } = useTranslation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [diagramToDelete, setDiagramToDelete] = useState<SystemArchitectureDiagram | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDeleteClick = (diagram: SystemArchitectureDiagram) => {
    if (disabled) return;
    setDiagramToDelete(diagram);
    setDeleteDialogOpen(true);
  };

  const handleDialogClose = () => {
    if (!loading) {
      setDeleteDialogOpen(false);
      setDiagramToDelete(null);
    }
  };

  const handleDelete = async () => {
    if (disabled || !diagramToDelete || loading) return;

    setLoading(true);
    try {
      await SystemArchitectureService.deleteDiagram(diagramToDelete.id);
      toast({
        title: lang('systemArchitecture.toast.deleteSuccess'),
        description: lang('systemArchitecture.toast.deleteSuccessDesc'),
      });
      onDiagramDeleted();
    } catch (error) {
      console.error('Error deleting diagram:', error);
      toast({
        title: lang('common.error'),
        description: lang('systemArchitecture.toast.deleteError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setDiagramToDelete(null);
    }
  };

  const handleExport = (diagram: SystemArchitectureDiagram) => {
    if (disabled) return;
    const dataStr = JSON.stringify(diagram, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${diagram.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: lang('systemArchitecture.toast.exportSuccess'),
      description: lang('systemArchitecture.toast.exportSuccessDesc').replace('{name}', diagram.name),
    });
  };

  const handleDuplicate = async (diagram: SystemArchitectureDiagram) => {
    if (disabled) return;
    try {
      await SystemArchitectureService.createDiagram({
        company_id: diagram.company_id,
        product_id: diagram.product_id,
        name: `${diagram.name} (Copy)`,
        description: diagram.description,
        version: diagram.version,
        diagram_data: diagram.diagram_data,
        metadata: {
          ...diagram.metadata,
          duplicatedFrom: diagram.id,
          duplicatedAt: new Date().toISOString()
        }
      });

      toast({
        title: lang('systemArchitecture.toast.duplicateSuccess'),
        description: lang('systemArchitecture.toast.duplicateSuccessDesc'),
      });

      onDiagramDeleted();
    } catch (error) {
      console.error('Error duplicating diagram:', error);
      toast({
        title: lang('common.error'),
        description: lang('systemArchitecture.toast.duplicateError'),
        variant: "destructive",
      });
    }
  };

  if (diagrams.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{lang('systemArchitecture.noDiagrams')}</p>
        <p className="text-sm mt-2">{lang('systemArchitecture.createFirstHint')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {diagrams.map((diagram) => (
          <Card key={diagram.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{diagram.name}</CardTitle>
                  {diagram.description && (
                    <CardDescription className="mt-1 line-clamp-2">
                      {diagram.description}
                    </CardDescription>
                  )}
                </div>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={disabled}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDuplicate(diagram)} disabled={disabled}>
                      <Copy className="mr-2 h-4 w-4" />
                      {lang('systemArchitecture.actions.duplicate')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport(diagram)} disabled={disabled}>
                      <Download className="mr-2 h-4 w-4" />
                      {lang('systemArchitecture.actions.export')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(diagram)}
                      className="text-destructive"
                      disabled={disabled}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {lang('systemArchitecture.actions.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">v{diagram.version}</Badge>
                  {diagram.is_template && (
                    <Badge variant="outline">{lang('systemArchitecture.template')}</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(diagram.updated_at), { addSuffix: true })}
                </div>
              </div>
              
              <div className="mt-3 text-sm text-muted-foreground">
                {lang('systemArchitecture.componentsCount').replace('{count}', String(diagram.diagram_data?.nodes?.length || 0))}, {lang('systemArchitecture.connectionsCount').replace('{count}', String(diagram.diagram_data?.edges?.length || 0))}
              </div>

              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => { if (!disabled) onDiagramSelect(diagram); }} className="flex-1" disabled={disabled}>
                  <Eye className="mr-2 h-4 w-4" />
                  {lang('systemArchitecture.actions.view')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { if (!disabled) onDiagramEdit(diagram); }} disabled={disabled}>
                  <Edit className="mr-2 h-4 w-4" />
                  {lang('systemArchitecture.actions.edit')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={handleDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang('systemArchitecture.dialog.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang('systemArchitecture.dialog.delete.description').replace('{name}', diagramToDelete?.name || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDialogClose} disabled={loading}>
              {lang('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? lang('common.deleting') : lang('systemArchitecture.actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}