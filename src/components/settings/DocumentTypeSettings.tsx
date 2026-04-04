import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { FileType, Plus, Edit, Trash2, ChevronDown, Loader2, List } from 'lucide-react';
import { documentTypeService, DocumentType } from '@/services/documentTypeService';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';

interface DocumentTypeSettingsProps {
  companyId: string;
}

export function DocumentTypeSettings({ companyId }: DocumentTypeSettingsProps) {
  const { lang } = useTranslation();
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<DocumentType | null>(null);
  const [typeName, setTypeName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingDefaults, setIsAddingDefaults] = useState(false);

  const { user } = useAuth();

  const DEFAULT_DOCUMENT_TYPES = [
    'Standard',
    'Regulatory',
    'Technical',
    'Clinical',
    'Quality',
    'Design',
    'SOP'
  ];

  // Calculate how many default types are missing
  const existingNames = documentTypes.map(t => t.name.toLowerCase());
  const missingDefaults = DEFAULT_DOCUMENT_TYPES.filter(
    name => !existingNames.includes(name.toLowerCase())
  );
  const allDefaultsExist = missingDefaults.length === 0;

  useEffect(() => {
    loadDocumentTypes();
  }, [companyId]);

  const loadDocumentTypes = async () => {
    try {
      setIsLoading(true);
      const types = await documentTypeService.getCompanyDocumentTypes(companyId);
      setDocumentTypes(types);
    } catch (error) {
      console.error('Error loading document types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingType(null);
    setTypeName('');
    setDialogOpen(true);
  };

  const handleEdit = (type: DocumentType) => {
    setEditingType(type);
    setTypeName(type.name);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!typeName.trim() || !user?.id) return;

    setIsSaving(true);
    try {
      if (editingType) {
        // Update existing
        const success = await documentTypeService.updateDocumentType(editingType.id, {
          name: typeName.trim()
        });
        if (success) {
          await loadDocumentTypes();
          setDialogOpen(false);
        }
      } else {
        // Create new
        const newType = await documentTypeService.createDocumentType(
          companyId,
          typeName.trim(),
          user.id,
          user.id
        );
        if (newType) {
          await loadDocumentTypes();
          setDialogOpen(false);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (typeId: string) => {
    const success = await documentTypeService.deleteDocumentType(typeId);
    if (success) {
      await loadDocumentTypes();
    }
  };

  const handleAddDefaults = async () => {
    if (!user?.id) return;

    setIsAddingDefaults(true);
    try {
      const existingNames = documentTypes.map(t => t.name.toLowerCase());
      const typesToAdd = DEFAULT_DOCUMENT_TYPES.filter(
        name => !existingNames.includes(name.toLowerCase())
      );

      for (const typeName of typesToAdd) {
        await documentTypeService.createDocumentType(
          companyId,
          typeName,
          user.id,
          user.id,
          false
        );
      }

      await loadDocumentTypes();
    } catch (error) {
      console.error('Error adding default document types:', error);
    } finally {
      setIsAddingDefaults(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileType className="h-5 w-5" />
                  {lang('settings.documentTypes.title')}
                </CardTitle>
                <CardDescription>
                  {lang('settings.documentTypes.description')}
                </CardDescription>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">{lang('settings.documentTypes.loading')}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {lang('settings.documentTypes.configuredCount', { count: documentTypes.length })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={handleAddDefaults}
                      disabled={isAddingDefaults || allDefaultsExist}
                      className="flex items-center gap-2"
                    >
                      {isAddingDefaults ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {lang('settings.documentTypes.adding')}
                        </>
                      ) : (
                        <>
                          <List className="h-4 w-4" />
                          {lang('settings.documentTypes.addDefaults')} {`${missingDefaults.length == 0 ? '' : `(${missingDefaults.length})`}`}
                        </>
                      )}
                    </Button>
                    <Button onClick={handleAdd} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      {lang('settings.documentTypes.addType')}
                    </Button>
                  </div>
                </div>

                {documentTypes.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{lang('settings.documentTypes.table.name')}</TableHead>
                          <TableHead>{lang('settings.documentTypes.table.created')}</TableHead>
                          <TableHead>{lang('settings.documentTypes.table.updated')}</TableHead>
                          <TableHead className="w-24 text-right">{lang('settings.documentTypes.table.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documentTypes.map((type) => (
                          <TableRow key={type.id}>
                            <TableCell className="font-medium">{type.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {type.created_at
                                ? new Date(type.created_at).toLocaleDateString()
                                : '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {type.updated_at
                                ? new Date(type.updated_at).toLocaleDateString()
                                : type.created_at
                                ? new Date(type.created_at).toLocaleDateString()
                                : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(type)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{lang('settings.documentTypes.deleteTitle')}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {lang('settings.documentTypes.deleteConfirm', { name: type.name })}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(type.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        {lang('common.delete')}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border rounded-md">
                    <FileType className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{lang('settings.documentTypes.noTypes')}</p>
                    <p className="text-sm">{lang('settings.documentTypes.noTypesHint')}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? lang('settings.documentTypes.editTitle') : lang('settings.documentTypes.addTitle')}
            </DialogTitle>
            <DialogDescription>
              {editingType
                ? lang('settings.documentTypes.editDescription')
                : lang('settings.documentTypes.addDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="typeName">{lang('settings.documentTypes.typeNameLabel')}</Label>
              <Input
                id="typeName"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder={lang('settings.documentTypes.typeNamePlaceholder')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && typeName.trim()) {
                    handleSave();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {lang('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!typeName.trim() || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {lang('common.saving')}
                </>
              ) : editingType ? (
                lang('common.update')
              ) : (
                lang('common.create')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Collapsible>
  );
}
