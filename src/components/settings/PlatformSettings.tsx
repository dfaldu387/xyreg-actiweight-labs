import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Building2, Package } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CompanyPlatformService, type CompanyPlatform, type CreatePlatformData } from '@/services/companyPlatformService';
import { AutocompleteFreeInput } from '@/components/ui/autocomplete-free-input';
import { PlatformSuggestionsOverlay } from './PlatformSuggestionsOverlay';
import { toast } from "sonner";

interface PlatformSettingsProps {
  companyId: string;
}

export function PlatformSettings({ companyId }: PlatformSettingsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<CompanyPlatform | null>(null);
  const [formData, setFormData] = useState<CreatePlatformData>({ name: '', description: '' });
  
  const queryClient = useQueryClient();

  // Fetch platforms
  const { data: platforms = [], isLoading } = useQuery({
    queryKey: ['company-platforms', companyId],
    queryFn: () => CompanyPlatformService.getDistinctPlatforms(companyId),
  });

  // Create platform mutation
  const createMutation = useMutation({
    mutationFn: (data: CreatePlatformData) => CompanyPlatformService.createPlatform(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-platforms', companyId] });
      setIsCreateDialogOpen(false);
      setFormData({ name: '', description: '' });
      toast.success('Platform created successfully');
    },
    onError: () => {
      toast.error('Failed to create platform');
    }
  });

  // Update platform mutation
  const updateMutation = useMutation({
    mutationFn: ({ platformId, data }: { platformId: string; data: CreatePlatformData }) => 
      CompanyPlatformService.updatePlatform(companyId, platformId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-platforms', companyId] });
      setEditingPlatform(null);
      setFormData({ name: '', description: '' });
      toast.success('Platform updated successfully');
    },
    onError: () => {
      toast.error('Failed to update platform');
    }
  });

  // Delete platform mutation
  const deleteMutation = useMutation({
    mutationFn: (platformName: string) => CompanyPlatformService.deletePlatform(companyId, platformName),
    onSuccess: (affectedProducts) => {
      queryClient.invalidateQueries({ queryKey: ['company-platforms', companyId] });
      toast.success(`Platform deleted. ${affectedProducts} products updated.`);
    },
    onError: () => {
      toast.error('Failed to delete platform');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Platform name is required');
      return;
    }

    if (editingPlatform?.id) {
      updateMutation.mutate({ platformId: editingPlatform.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handlePlatformSuggestion = (platformName: string, description?: string) => {
    setFormData({ name: platformName, description: description || '' });
  };

  const handleEdit = (platform: CompanyPlatform) => {
    setEditingPlatform(platform);
    setFormData({ name: platform.name, description: platform.description || '' });
  };

  const handleDelete = (platformName: string) => {
    deleteMutation.mutate(platformName);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingPlatform(null);
  };

  const standalonePlatforms = platforms.filter(p => p.isStandalone);
  const derivedPlatforms = platforms.filter(p => !p.isStandalone);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Platform Management
          </CardTitle>
          <CardDescription>
            Manage your company's medical device platforms. Platforms help organize related products and enable accurate revenue forecasting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-medium">Company Platforms</h3>
              <p className="text-sm text-muted-foreground">
                {platforms.length} total platforms ({standalonePlatforms.length} defined, {derivedPlatforms.length} derived from products)
              </p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Platform
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[1200px] max-h-[95vh] flex flex-col bg-background border-4 border-red-500 z-[9999]">
                <DialogHeader className="flex-shrink-0 bg-red-100 p-4 -m-6 mb-4 border-b-4 border-red-500">
                  <DialogTitle className="text-2xl font-bold text-red-900">🚨 ADD NEW PLATFORM - NUCLEAR MODE 🚨</DialogTitle>
                  <DialogDescription className="text-red-700 font-medium">
                    NO AUTOCOMPLETE ZONE - Use platform suggestions below or create custom platform
                  </DialogDescription>
                </DialogHeader>
                
                {/* Platform Suggestions at TOP for maximum visibility */}
                <div className="flex-shrink-0 mb-6">
                  <PlatformSuggestionsOverlay 
                    onSelectPlatform={handlePlatformSuggestion}
                  />
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Custom autocomplete-free inputs */}
                    <div className="bg-yellow-100 border-4 border-yellow-400 rounded-lg p-4">
                      <Label htmlFor="name" className="text-lg font-bold text-yellow-900">Platform Name * (AUTOCOMPLETE-FREE INPUT)</Label>
                      <AutocompleteFreeInput
                        id="name"
                        value={formData.name}
                        onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                        placeholder="e.g., Nox A1 Sleep Study System"
                        required
                        className="mt-2 border-4 border-yellow-500 bg-white text-lg font-medium"
                      />
                    </div>
                    
                    <div className="bg-green-100 border-4 border-green-400 rounded-lg p-4">
                      <Label htmlFor="description" className="text-lg font-bold text-green-900">Description (AUTOCOMPLETE-FREE)</Label>
                      <AutocompleteFreeInput
                        id="description"
                        value={formData.description}
                        onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                        placeholder="Describe the platform and its use cases..."
                        className="mt-2 border-4 border-green-500 bg-white min-h-[80px] text-lg"
                      />
                    </div>
                  </form>
                </div>
                  
                <DialogFooter className="flex-shrink-0 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    onClick={handleSubmit}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Platform'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Standalone Platforms */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Defined Platforms</h4>
              {standalonePlatforms.length === 0 ? (
                <div className="border border-dashed rounded-lg p-6 text-center">
                  <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No platforms defined yet</p>
                  <p className="text-xs text-muted-foreground">Create platforms to organize your product portfolio</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {standalonePlatforms.map((platform) => (
                    <div key={platform.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{platform.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {platform.productCount} products
                          </Badge>
                        </div>
                        {platform.description && (
                          <p className="text-sm text-muted-foreground">{platform.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(platform)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px] bg-background border z-50">
                            <DialogHeader>
                              <DialogTitle>Edit Platform</DialogTitle>
                              <DialogDescription>
                                Update the platform name and description.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                              <div>
                                <Label htmlFor="edit-name">Platform Name *</Label>
                                <Input
                                  id="edit-name"
                                  value={formData.name}
                                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                  required
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                  id="edit-description"
                                  value={formData.description}
                                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                  rows={3}
                                />
                              </div>
                              
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={resetForm}>
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={updateMutation.isPending}>
                                  {updateMutation.isPending ? 'Updating...' : 'Update Platform'}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-background border z-50">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Platform</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{platform.name}"? This will remove the platform association from {platform.productCount} products. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(platform.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Platform
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Derived Platforms */}
            {derivedPlatforms.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-3">Platforms from Products</h4>
                <div className="grid gap-3">
                  {derivedPlatforms.map((platform) => (
                    <div key={platform.name} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-muted-foreground">{platform.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {platform.productCount} products
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Auto-derived
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          This platform was automatically created from product data. Convert to a managed platform to add descriptions and better organization.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}