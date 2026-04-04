import React, { useState, useEffect } from "react";
import { Info, FileImage, Upload, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SourcesInfoPopup } from "@/components/ui/sources-info-popup";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { SystemArchitectureService, SystemArchitectureDiagram } from '@/services/systemArchitectureService';
import { CreateDiagramDialog } from './CreateDiagramDialog';
import { DiagramList } from './DiagramList';
import { DiagramEditorWrapper } from './DiagramEditor';

interface SystemArchitectureModuleProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function SystemArchitectureModule({ productId, companyId, disabled = false }: SystemArchitectureModuleProps) {
  const { toast } = useToast();
  const { lang } = useTranslation();
  const [diagrams, setDiagrams] = useState<SystemArchitectureDiagram[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedDiagram, setSelectedDiagram] = useState<SystemArchitectureDiagram | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Source information for the popup
  const sourceInfo = [
    {
      name: lang('systemArchitecture.sources.systemRequirements'),
      status: 'complete' as const,
      description: lang('systemArchitecture.sources.systemRequirementsDesc')
    },
    {
      name: lang('systemArchitecture.sources.componentSpecifications'),
      status: 'pending' as const,
      description: lang('systemArchitecture.sources.componentSpecificationsDesc')
    },
    {
      name: lang('systemArchitecture.sources.interfaceDefinitions'),
      status: 'pending' as const,
      description: lang('systemArchitecture.sources.interfaceDefinitionsDesc')
    },
    {
      name: lang('systemArchitecture.sources.externalDependencies'),
      status: 'pending' as const,
      description: lang('systemArchitecture.sources.externalDependenciesDesc')
    }
  ];

  useEffect(() => {
    loadDiagrams();
  }, [productId]);

  const loadDiagrams = async () => {
    try {
      setLoading(true);
      const data = await SystemArchitectureService.getDiagrams(productId);
      setDiagrams(data);
    } catch (error) {
      console.error('Error loading diagrams:', error);
      toast({
        title: lang('common.error'),
        description: lang('systemArchitecture.toast.loadError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDiagramCreated = (diagram: SystemArchitectureDiagram) => {
    if (disabled) return;
    setDiagrams(prev => [diagram, ...prev]);
    setSelectedDiagram(diagram);
    setIsEditMode(true);
    setEditorOpen(true);
  };

  const handleDiagramSelect = (diagram: SystemArchitectureDiagram) => {
    if (disabled) return;
    setSelectedDiagram(diagram);
    setIsEditMode(false);
    setEditorOpen(true);
  };

  const handleDiagramEdit = (diagram: SystemArchitectureDiagram) => {
    if (disabled) return;
    setSelectedDiagram(diagram);
    setIsEditMode(true);
    setEditorOpen(true);
  };

  const handleSaveDiagram = async (diagramData: any) => {
    if (disabled || !selectedDiagram) return;

    try {
      await SystemArchitectureService.saveDiagramData(selectedDiagram.id, diagramData);
      toast({
        title: lang('systemArchitecture.toast.saveSuccess'),
        description: lang('systemArchitecture.toast.saveSuccessDesc'),
      });
      // Optionally refresh the diagram list
      loadDiagrams();
    } catch (error) {
      console.error('Error saving diagram:', error);
      toast({
        title: lang('common.error'),
        description: lang('systemArchitecture.toast.saveError'),
        variant: "destructive",
      });
    }
  };

  const handleUploadDiagram = () => {
    if (disabled) return;
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.png,.jpg,.jpeg,.pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.type === 'application/json') {
          // Handle JSON diagram file
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const diagramData = JSON.parse(e.target?.result as string);
              // Create a new diagram from the uploaded data
              setCreateDialogOpen(true);
              // You could pre-populate the create dialog with the imported data
            } catch (error) {
              toast({
                title: lang('common.error'),
                description: lang('systemArchitecture.toast.invalidFormat'),
                variant: "destructive",
              });
            }
          };
          reader.readAsText(file);
        } else {
          // Handle image files (PNG, JPG, PDF)
          toast({
            title: lang('systemArchitecture.toast.uploadStarted'),
            description: lang('systemArchitecture.toast.uploadComingSoon'),
          });
        }
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">{lang('systemArchitecture.loading')}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{lang('systemArchitecture.title')}</CardTitle>
              <CardDescription>
                {lang('systemArchitecture.description')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <SourcesInfoPopup
                sources={sourceInfo}
                trigger={
                  <Button variant="ghost" size="sm" disabled={disabled}>
                    <Info className="h-4 w-4" />
                  </Button>
                }
              />
              <Button variant="outline" onClick={handleUploadDiagram} disabled={disabled}>
                <Upload className="h-4 w-4 mr-2" />
                {lang('systemArchitecture.uploadDiagram')}
              </Button>
              <Button onClick={() => { if (!disabled) setCreateDialogOpen(true); }} disabled={disabled}>
                <Plus className="h-4 w-4 mr-2" />
                {lang('systemArchitecture.createDiagram')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {diagrams.length === 0 ? (
            <div className="text-center py-12">
              <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <div className="text-muted-foreground mb-4">
                {lang('systemArchitecture.noDiagrams')}
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {lang('systemArchitecture.noDiagramsHint')}
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={handleUploadDiagram} disabled={disabled}>
                  <Upload className="h-4 w-4 mr-2" />
                  {lang('systemArchitecture.uploadExisting')}
                </Button>
                <Button onClick={() => { if (!disabled) setCreateDialogOpen(true); }} disabled={disabled}>
                  <Plus className="h-4 w-4 mr-2" />
                  {lang('systemArchitecture.createNew')}
                </Button>
              </div>
            </div>
          ) : (
            <DiagramList
              diagrams={diagrams}
              onDiagramSelect={handleDiagramSelect}
              onDiagramEdit={handleDiagramEdit}
              onDiagramDeleted={loadDiagrams}
              disabled={disabled}
            />
          )}
        </CardContent>
      </Card>

      <CreateDiagramDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        productId={productId}
        companyId={companyId}
        onDiagramCreated={handleDiagramCreated}
      />

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              {isEditMode ? lang('systemArchitecture.editDiagram') : lang('systemArchitecture.viewDiagram')}
              {selectedDiagram && (
                <span className="text-muted-foreground font-normal ml-2">
                  - {selectedDiagram.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="h-[80vh]">
            {selectedDiagram && (
              <DiagramEditorWrapper
                initialData={selectedDiagram.diagram_data}
                onSave={isEditMode ? handleSaveDiagram : undefined}
                onClose={() => setEditorOpen(false)}
                diagramName={selectedDiagram.name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}