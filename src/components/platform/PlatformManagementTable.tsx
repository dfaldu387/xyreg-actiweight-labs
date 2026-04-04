import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Package2, Building2, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CompanyPlatformService, type CompanyPlatform, type CreatePlatformData } from "@/services/companyPlatformService";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

interface PlatformManagementTableProps {
  companyId: string;
}

export function PlatformManagementTable({ companyId }: PlatformManagementTableProps) {
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<CompanyPlatform | null>(null);
  const [formData, setFormData] = useState<CreatePlatformData>({ name: "", description: "" });
  
  // Inline editing state
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'name' | 'description' | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data: platforms = [], isLoading } = useQuery({
    queryKey: ['company-platforms', companyId],
    queryFn: () => CompanyPlatformService.getDistinctPlatforms(companyId),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePlatformData) => CompanyPlatformService.createPlatform(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-platforms', companyId] });
      setShowCreateDialog(false);
      setFormData({ name: "", description: "" });
      toast.success("Platform created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create platform: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ platformId, data }: { platformId: string; data: CreatePlatformData }) => 
      CompanyPlatformService.updatePlatform(companyId, platformId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-platforms', companyId] });
      setShowEditDialog(false);
      setSelectedPlatform(null);
      setFormData({ name: "", description: "" });
      toast.success("Platform updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update platform: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (platformName: string) => CompanyPlatformService.deletePlatform(companyId, platformName),
    onSuccess: (affectedProductsCount) => {
      queryClient.invalidateQueries({ queryKey: ['company-platforms', companyId] });
      setShowDeleteDialog(false);
      setSelectedPlatform(null);
      toast.success(`Platform deleted successfully${affectedProductsCount > 0 ? `. ${affectedProductsCount} products were unassigned from this platform.` : ""}`);
    },
    onError: (error) => {
      toast.error("Failed to delete platform: " + error.message);
    },
  });

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (platform: CompanyPlatform) => {
    setSelectedPlatform(platform);
    setFormData({ 
      name: platform.name, 
      description: platform.description || "" 
    });
    setShowEditDialog(true);
  };

  const handleUpdate = () => {
    if (!selectedPlatform) return;
    
    // For standalone platforms, use the regular update method
    if (selectedPlatform.isStandalone && selectedPlatform.id) {
      updateMutation.mutate({ platformId: selectedPlatform.id, data: formData });
    } else {
      // For product-derived platforms, only handle name changes
      if (formData.name !== selectedPlatform.name) {
        CompanyPlatformService.renamePlatform(companyId, selectedPlatform.name, formData.name)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['company-platforms', companyId] });
            setShowEditDialog(false);
            setSelectedPlatform(null);
            setFormData({ name: "", description: "" });
            toast.success("Platform updated successfully");
          })
          .catch((error) => {
            toast.error("Failed to update platform: " + error.message);
          });
      } else if (formData.description !== (selectedPlatform.description || "")) {
        // User tried to change description on product-derived platform
        toast.error("Descriptions cannot be added to product-derived platforms. These platforms inherit their properties from products.");
        setShowEditDialog(false);
        setSelectedPlatform(null);
        setFormData({ name: "", description: "" });
      } else {
        // No changes needed
        setShowEditDialog(false);
        setSelectedPlatform(null);
        setFormData({ name: "", description: "" });
      }
    }
  };

  const handleDelete = (platform: CompanyPlatform) => {
    setSelectedPlatform(platform);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!selectedPlatform) return;
    deleteMutation.mutate(selectedPlatform.name);
  };

  // Inline editing handlers
  const startInlineEdit = (platform: CompanyPlatform, field: 'name' | 'description') => {
    // For description, only allow editing if it's a standalone platform
    if (field === 'description' && !platform.isStandalone) {
      toast.error("Descriptions can only be added to standalone platforms. Product-derived platforms inherit their properties from products.");
      return;
    }
    
    setEditingPlatform(platform.id || platform.name);
    setEditingField(field);
    setEditValue(field === 'name' ? platform.name : (platform.description || ""));
  };

  const cancelInlineEdit = () => {
    setEditingPlatform(null);
    setEditingField(null);
    setEditValue("");
  };

  const saveInlineEdit = () => {
    if (!editingPlatform || !editingField) return;
    
    const platform = platforms.find(p => (p.id || p.name) === editingPlatform);
    if (!platform) return;

    if (editingField === 'name') {
      // For renaming platforms, use the rename method that updates across all products
      CompanyPlatformService.renamePlatform(companyId, platform.name, editValue)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['company-platforms', companyId] });
          toast.success("Platform renamed successfully");
          cancelInlineEdit();
        })
        .catch((error) => {
          toast.error("Failed to rename platform: " + error.message);
        });
    } else if (editingField === 'description') {
      // Description can only be updated for standalone platforms
      if (platform.isStandalone && platform.id) {
        const updateData = {
          name: platform.name,
          description: editValue
        };

        updateMutation.mutate(
          { platformId: platform.id, data: updateData },
          {
            onSuccess: () => {
              cancelInlineEdit();
            }
          }
        );
      } else {
        toast.error("Descriptions can only be set for standalone platforms");
        cancelInlineEdit();
      }
    }
  };

  // Handle key press for inline editing
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveInlineEdit();
    } else if (e.key === 'Escape') {
      cancelInlineEdit();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {lang('platform.management.title')}
          </CardTitle>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {lang('platform.management.addPlatform')}
          </Button>
        </CardHeader>
        <CardContent>
          {platforms.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{lang('platform.management.noPlatformsYet')}</h3>
              <p className="text-muted-foreground mb-4">
                {lang('platform.management.createFirstDescription')}
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {lang('platform.management.createFirstPlatform')}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{lang('platform.management.table.platformName')}</TableHead>
                  <TableHead>{lang('platform.management.table.description')}</TableHead>
                  <TableHead>{lang('platform.management.table.productCount')}</TableHead>
                  <TableHead>{lang('platform.management.table.type')}</TableHead>
                  <TableHead className="w-[100px]">{lang('platform.management.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platforms.map((platform) => (
                  <TableRow key={platform.id || platform.name}>
                    <TableCell className="font-medium">
                      {editingPlatform === (platform.id || platform.name) && editingField === 'name' ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className="h-8"
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" onClick={saveInlineEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelInlineEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="cursor-pointer hover:bg-muted/50 p-1 rounded group flex items-center gap-2"
                          onClick={() => startInlineEdit(platform, 'name')}
                          title="Click to edit platform name"
                        >
                          <span>{platform.name}</span>
                          <Edit className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {editingPlatform === (platform.id || platform.name) && editingField === 'description' ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className="h-8"
                            autoFocus
                            placeholder="Enter description"
                          />
                          <Button size="sm" variant="ghost" onClick={saveInlineEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelInlineEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className={`cursor-pointer hover:bg-muted/50 p-1 rounded group flex items-center gap-2 ${!platform.isStandalone ? 'opacity-60' : ''}`}
                          onClick={() => startInlineEdit(platform, 'description')}
                          title={platform.isStandalone ? "Click to edit description" : "Product-derived platforms cannot have descriptions"}
                        >
                          <span>{platform.description || lang('platform.management.noDescription')}</span>
                          {platform.isStandalone && <Edit className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package2 className="h-4 w-4" />
                        {platform.productCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={platform.isStandalone ? "default" : "secondary"}>
                        {platform.isStandalone ? lang('platform.management.standalone') : lang('platform.management.productDerived')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(platform)}
                          title={platform.isStandalone ? "Edit platform details" : "Edit platform name"}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(platform)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Platform Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang('platform.dialog.createTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{lang('platform.dialog.platformName')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={lang('platform.dialog.enterPlatformName')}
              />
            </div>
            <div>
              <Label htmlFor="description">{lang('platform.dialog.descriptionOptional')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={lang('platform.dialog.enterDescription')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {lang('platform.dialog.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? lang('platform.dialog.creating') : lang('platform.dialog.createPlatform')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Platform Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang('platform.dialog.editTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">{lang('platform.dialog.platformName')}</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={lang('platform.dialog.enterPlatformName')}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">{lang('platform.dialog.descriptionOptional')}</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={selectedPlatform?.isStandalone ? lang('platform.dialog.enterDescription') : lang('platform.dialog.productDerivedNoDescription')}
                rows={3}
                disabled={!selectedPlatform?.isStandalone}
              />
              {!selectedPlatform?.isStandalone && (
                <p className="text-sm text-muted-foreground mt-1">
                  {lang('platform.dialog.productDerivedInheritDescription')}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {lang('platform.dialog.cancel')}
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.name.trim()}
            >
              {updateMutation.isPending ? lang('platform.dialog.updating') : lang('platform.dialog.updatePlatform')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Platform Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang('platform.dialog.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang('platform.dialog.deleteConfirmation', { name: selectedPlatform?.name })}
              {selectedPlatform?.productCount > 0 && (
                <span className="block mt-2 text-amber-600">
                  {lang('platform.dialog.deleteWarning', { count: selectedPlatform.productCount })}
                </span>
              )}
              {lang('platform.dialog.cannotBeUndone')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lang('platform.dialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? lang('platform.dialog.deleting') : lang('platform.dialog.deletePlatform')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}