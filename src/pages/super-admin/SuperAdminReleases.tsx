import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Rocket, FileText, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { XYREG_MODULE_GROUPS } from '@/data/xyregModuleGroups';

interface XyregRelease {
  id: string;
  version: string;
  release_date: string;
  changelog: string | null;
  status: string;
  created_at: string;
  published_at: string | null;
  impacted_module_groups: string[] | null;
}

export default function SuperAdminReleases() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<XyregRelease | null>(null);
  const [version, setVersion] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [changelog, setChangelog] = useState('');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['xyreg-releases-admin'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('xyreg_releases')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as XyregRelease[];
    },
  });

  const resetForm = () => {
    setVersion('');
    setReleaseDate('');
    setChangelog('');
    setSelectedModules([]);
    setEditingRelease(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (release: XyregRelease) => {
    setEditingRelease(release);
    setVersion(release.version);
    setReleaseDate(release.release_date);
    setChangelog(release.changelog || '');
    setSelectedModules(release.impacted_module_groups || []);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) resetForm();
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(m => m !== moduleId)
        : [...prev, moduleId]
    );
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from('xyreg_releases')
        .insert({
          version,
          release_date: releaseDate,
          changelog: changelog || null,
          status: 'draft',
          impacted_module_groups: selectedModules,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xyreg-releases-admin'] });
      toast.success(`Release ${version} created as draft`);
      handleDialogClose(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingRelease) return;
      const { error } = await (supabase as any)
        .from('xyreg_releases')
        .update({
          version,
          release_date: releaseDate,
          changelog: changelog || null,
          impacted_module_groups: selectedModules,
        })
        .eq('id', editingRelease.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xyreg-releases-admin'] });
      toast.success(`Release ${version} updated`);
      handleDialogClose(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('xyreg_releases')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xyreg-releases-admin'] });
      toast.success('Draft release deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('xyreg_releases')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xyreg-releases-admin'] });
      queryClient.invalidateQueries({ queryKey: ['xyreg-latest-release'] });
      toast.success('Release published');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const getReadinessIssues = (release: XyregRelease): string[] => {
    const issues: string[] = [];
    if (!release.changelog) issues.push('Changelog is empty');
    if (!release.impacted_module_groups || release.impacted_module_groups.length === 0) {
      issues.push('No impacted modules selected');
    }
    return issues;
  };

  const handleSave = () => {
    if (editingRelease) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">XYREG Releases</h1>
          <p className="text-muted-foreground">Manage software versions that customers validate against</p>
        </div>
        <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" />New Release</Button>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRelease ? 'Edit Draft Release' : 'Create New Release'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Version</Label>
              <Input placeholder="e.g. 2.5.0" value={version} onChange={e => setVersion(e.target.value)} />
            </div>
            <div>
              <Label>Release Date</Label>
              <Input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} />
            </div>
            <div>
              <Label>Changelog</Label>
              <Textarea placeholder="What's new in this release..." value={changelog} onChange={e => setChangelog(e.target.value)} rows={4} />
            </div>
            <div>
              <Label className="mb-2 block">Impacted Module Groups</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {XYREG_MODULE_GROUPS.map(group => (
                  <label key={group.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                    <Checkbox
                      checked={selectedModules.includes(group.id)}
                      onCheckedChange={() => toggleModule(group.id)}
                    />
                    <span className="truncate">{group.name}</span>
                  </label>
                ))}
              </div>
              {selectedModules.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{selectedModules.length} module(s) selected</p>
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={!version || !releaseDate || isSaving}
              className="w-full"
            >
              {editingRelease ? 'Save Changes' : 'Create Draft Release'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />All Releases</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Release Date</TableHead>
                  <TableHead>Impacted Modules</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {releases.map((r) => {
                  const readinessIssues = getReadinessIssues(r);
                  const canPublish = r.status === 'draft' && readinessIssues.length === 0;

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-semibold">v{r.version}</TableCell>
                      <TableCell>{format(new Date(r.release_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(r.impacted_module_groups || []).length > 0 ? (
                            (r.impacted_module_groups || []).map(moduleId => {
                              const group = XYREG_MODULE_GROUPS.find(g => g.id === moduleId);
                              return (
                                <Badge key={moduleId} variant="outline" className="text-[10px] py-0">
                                  {group?.name || moduleId}
                                </Badge>
                              );
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground italic">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === 'published' ? 'default' : 'secondary'}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.published_at ? format(new Date(r.published_at), 'MMM d, yyyy HH:mm') : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {r.status === 'draft' && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => openEditDialog(r)}>
                                <Pencil className="h-3 w-3" />
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete draft v{r.version}?</AlertDialogTitle>
                                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteMutation.mutate(r.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => publishMutation.mutate(r.id)}
                                        disabled={!canPublish || publishMutation.isPending}
                                      >
                                        <Rocket className="h-3 w-3 mr-1" />Publish
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  {readinessIssues.length > 0 && (
                                    <TooltipContent>
                                      <p className="font-semibold mb-1">Cannot publish yet:</p>
                                      <ul className="text-xs list-disc pl-3">
                                        {readinessIssues.map((issue, i) => (
                                          <li key={i}>{issue}</li>
                                        ))}
                                      </ul>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {releases.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No releases yet. Create your first release.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
