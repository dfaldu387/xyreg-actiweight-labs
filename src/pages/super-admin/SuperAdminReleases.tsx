import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Rocket, FileText, Pencil, Trash2, Send, Building2, CheckCircle2, Loader2, Settings, X, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { XYREG_MODULE_GROUPS } from '@/data/xyregModuleGroups';

interface Company {
  id: string;
  name: string;
}

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

interface CompanyAdoption {
  id: string;
  company_id: string;
  company_name: string;
  release_id: string;
  release_version: string;
  adopted_at: string;
  status: string;
  preferred_date: string | null;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${(m || 0).toString().padStart(2, '0')} ${suffix}`;
}

export default function SuperAdminReleases() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'releases';
  const setActiveTab = useCallback((tab: string) => {
    setSearchParams({ tab }, { replace: true });
  }, [setSearchParams]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [editingRelease, setEditingRelease] = useState<XyregRelease | null>(null);
  const [version, setVersion] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [changelog, setChangelog] = useState('');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [notifyingRelease, setNotifyingRelease] = useState<XyregRelease | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [notifySending, setNotifySending] = useState(false);
  const [notifiedReleases, setNotifiedReleases] = useState<Set<string>>(new Set());

  // Fetch all companies for notification selector
  const { data: companies = [] } = useQuery({
    queryKey: ['all-companies-admin'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('companies')
        .select('id, name')
        .not('name', 'is', null)
        .neq('name', '')
        .or('is_archived.is.null,is_archived.eq.false')
        .order('name');
      if (error) throw error;
      return (data || []).filter((c: Company) => c.name && c.name.trim().length > 0) as Company[];
    },
  });

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

  const { data: adoptions = [], isLoading: isLoadingAdoptions } = useQuery({
    queryKey: ['company-adoptions-admin'],
    queryFn: async (): Promise<CompanyAdoption[]> => {
      // Fetch adoptions (no FK joins available)
      const { data: rawAdoptions, error } = await (supabase as any)
        .from('company_release_adoptions')
        .select('id, company_id, release_id, adopted_at, status, preferred_date, preferred_time_start, preferred_time_end')
        .order('adopted_at', { ascending: false });
      if (error) throw error;
      if (!rawAdoptions || rawAdoptions.length === 0) return [];

      // Build lookup maps from already-fetched data
      const companyMap = new Map(companies.map(c => [c.id, c.name]));
      const releaseMap = new Map(releases.map(r => [r.id, r.version]));

      return rawAdoptions.map((row: any) => ({
        id: row.id,
        company_id: row.company_id,
        company_name: companyMap.get(row.company_id) ?? 'Unknown',
        release_id: row.release_id,
        release_version: releaseMap.get(row.release_id) ?? 'Unknown',
        adopted_at: row.adopted_at,
        status: row.status,
        preferred_date: row.preferred_date ?? null,
        preferred_time_start: row.preferred_time_start ?? null,
        preferred_time_end: row.preferred_time_end ?? null,
      }));
    },
    enabled: companies.length > 0 && releases.length > 0,
  });

  // Fetch notification emails from DB
  const { data: notifEmails = [] } = useQuery({
    queryKey: ['adoption-notification-emails'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await (supabase as any)
        .from('platform_settings')
        .select('value')
        .eq('key', 'adoption_notification_emails')
        .single();
      if (error || !data) return [];
      return (data.value as string[]) || [];
    },
  });

  const saveEmailsMutation = useMutation({
    mutationFn: async (emails: string[]) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('platform_settings')
        .update({ value: emails, updated_at: new Date().toISOString(), updated_by: userData?.user?.id })
        .eq('key', 'adoption_notification_emails');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adoption-notification-emails'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateAdoptionStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from('company_release_adoptions')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['company-adoptions-admin'] });
      toast.success(`Status updated to ${status}`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleAddEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (notifEmails.includes(email)) {
      toast.error('Email already added');
      return;
    }
    saveEmailsMutation.mutate([...notifEmails, email], {
      onSuccess: () => {
        setNewEmail('');
        toast.success(`${email} added`);
      },
    });
  };

  const handleRemoveEmail = (email: string) => {
    saveEmailsMutation.mutate(notifEmails.filter(e => e !== email));
  };

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
    mutationFn: async (release: XyregRelease) => {
      const { error } = await (supabase as any)
        .from('xyreg_releases')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', release.id);
      if (error) throw error;
      return release;
    },
    onSuccess: (release) => {
      queryClient.invalidateQueries({ queryKey: ['xyreg-releases-admin'] });
      queryClient.invalidateQueries({ queryKey: ['xyreg-latest-release'] });
      toast.success(`Release v${release.version} published`);
      // Open notify dialog
      setNotifyingRelease({ ...release, status: 'published', published_at: new Date().toISOString() });
      setSelectedCompanies(companies.map(c => c.id)); // Select all by default
      setNotifyDialogOpen(true);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSendNotifications = async () => {
    if (!notifyingRelease || selectedCompanies.length === 0) return;
    setNotifySending(true);
    try {
      // Get all users for selected companies
      const { data: companyUsers, error: usersError } = await (supabase as any)
        .from('user_company_access')
        .select('user_id, company_id')
        .in('company_id', selectedCompanies);

      if (usersError) throw usersError;

      if (!companyUsers || companyUsers.length === 0) {
        toast.error('No users found in selected companies');
        setNotifySending(false);
        return;
      }

      // Build company name lookup for action_url
      const companyNameMap = new Map(companies.map(c => [c.id, c.name]));

      // Create notification for each user
      const notifications = companyUsers.map((uca: any) => {
        const companyName = companyNameMap.get(uca.company_id) || '';
        return {
          user_id: uca.user_id,
          company_id: uca.company_id,
          category: 'system',
          action: 'new_release',
          title: `New XYREG version v${notifyingRelease.version} available`,
          message: notifyingRelease.changelog || `Version ${notifyingRelease.version} has been published. Go to Infrastructure to validate.`,
          priority: 'high',
          entity_type: 'xyreg_release',
          entity_id: notifyingRelease.id,
          action_url: `/app/company/${encodeURIComponent(companyName)}/infrastructure`,
        };
      });

      const { error } = await (supabase as any)
        .from('app_notifications')
        .insert(notifications);

      if (error) throw error;

      const uniqueUsers = new Set(companyUsers.map((u: any) => u.user_id));
      setNotifiedReleases(prev => new Set([...prev, notifyingRelease.id]));
      toast.success(`Notifications sent to ${uniqueUsers.size} user(s) across ${selectedCompanies.length} company(s)`);
      setNotifyDialogOpen(false);
      setNotifyingRelease(null);
      setSelectedCompanies([]);
    } catch (err: any) {
      toast.error(`Failed to send notifications: ${err.message}`);
    } finally {
      setNotifySending(false);
    }
  };

  const toggleCompany = (companyId: string) => {
    setSelectedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(c => c !== companyId)
        : [...prev, companyId]
    );
  };

  const toggleAllCompanies = () => {
    if (selectedCompanies.length === companies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(companies.map(c => c.id));
    }
  };

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
    <div className="w-full px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">XYREG Releases</h1>
          <p className="text-muted-foreground">Manage software versions that customers validate against</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-1.5" />Email Notifications
            {notifEmails.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{notifEmails.length}</Badge>
            )}
          </Button>
          {activeTab === 'releases' && (
            <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" />New Release</Button>
          )}
        </div>
      </div>

      {/* Email Notification Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Adoption Email Notifications
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              When a company adopts a release, an email notification will be sent to these addresses.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="admin@example.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddEmail()}
                className="flex-1"
              />
              <Button onClick={handleAddEmail} size="sm">Add</Button>
            </div>
            {notifEmails.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4 border rounded-md">
                No email addresses configured yet. Add one above.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {notifEmails.map(email => (
                  <div key={email} className="flex items-center justify-between px-3 py-2 border rounded-md bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{email}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveEmail(email)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="releases" className="gap-1.5">
            <FileText className="h-4 w-4" /> Releases
          </TabsTrigger>
          <TabsTrigger value="adoptions" className="gap-1.5">
            <Building2 className="h-4 w-4" /> Company Adoptions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="releases" className="space-y-3">

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
                  <TableHead>Changelog</TableHead>
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
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-xs text-muted-foreground max-w-[200px] truncate cursor-default">
                                {r.changelog || <span className="italic">No changelog</span>}
                              </p>
                            </TooltipTrigger>
                            {r.changelog && (
                              <TooltipContent className="max-w-[300px] max-h-[250px] overflow-y-auto whitespace-pre-line text-xs">
                                {r.changelog}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const modules = r.impacted_module_groups || [];
                          if (modules.length === 0) return <span className="text-xs text-muted-foreground italic">None</span>;
                          const firstName = XYREG_MODULE_GROUPS.find(g => g.id === modules[0])?.name || modules[0];
                          const remaining = modules.length - 1;
                          const allNames = modules.map(id => XYREG_MODULE_GROUPS.find(g => g.id === id)?.name || id);
                          return (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-[10px] py-0 shrink-0">{firstName}</Badge>
                              {remaining > 0 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="secondary" className="text-[10px] py-0 cursor-default shrink-0">+{remaining}</Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[250px]">
                                      <div className="space-y-0.5">
                                        {allNames.slice(1).map((name, i) => (
                                          <p key={i} className="text-xs">• {name}</p>
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          );
                        })()}
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
                          {r.status === 'draft' ? (
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
                                        onClick={() => publishMutation.mutate(r)}
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
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                setNotifyingRelease(r);
                                setSelectedCompanies(companies.map(c => c.id));
                                setNotifyDialogOpen(true);
                              }}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              {notifiedReleases.has(r.id) ? 'Notify Again' : 'Notify Companies'}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {releases.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No releases yet. Create your first release.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Notify Companies Dialog */}
      <Dialog open={notifyDialogOpen} onOpenChange={(open) => { setNotifyDialogOpen(open); if (!open) setNotifyingRelease(null); }}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Notify Companies
            </DialogTitle>
          </DialogHeader>
          {notifyingRelease && (
            <div className="space-y-4">
              <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
                <p className="text-sm font-medium text-blue-900">Release v{notifyingRelease.version}</p>
                <p className="text-xs text-blue-700 mt-0.5 max-h-[80px] overflow-y-auto whitespace-pre-line">
                  {notifyingRelease.changelog || 'No changelog'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Select Companies ({companies.length})</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={toggleAllCompanies}
                  >
                    {selectedCompanies.length === companies.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <Input
                  placeholder="Search companies..."
                  className="h-8 text-sm mb-2"
                  onChange={(e) => {
                    const search = e.target.value.toLowerCase();
                    const el = document.getElementById('company-list');
                    if (el) {
                      Array.from(el.children).forEach((child: any) => {
                        const name = child.getAttribute('data-name') || '';
                        child.style.display = name.includes(search) ? '' : 'none';
                      });
                    }
                  }}
                />
                <div id="company-list" className="max-h-[250px] overflow-y-auto border rounded-md p-2 space-y-0.5">
                  {companies.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">No companies found</p>
                  ) : (
                    companies.map(company => (
                      <label
                        key={company.id}
                        data-name={company.name.toLowerCase()}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5"
                      >
                        <Checkbox
                          checked={selectedCompanies.includes(company.id)}
                          onCheckedChange={() => toggleCompany(company.id)}
                        />
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[300px]">{company.name}</span>
                      </label>
                    ))
                  )}
                </div>
                {selectedCompanies.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {selectedCompanies.length} of {companies.length} company(s) selected
                  </p>
                )}
              </div>

              <Button
                onClick={handleSendNotifications}
                disabled={selectedCompanies.length === 0 || notifySending}
                className="w-full"
              >
                {notifySending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" />Send Notification to {selectedCompanies.length} Company(s)</>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

        </TabsContent>

        <TabsContent value="adoptions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Adoptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAdoptions ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : adoptions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No companies have adopted a release yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Adopted At</TableHead>
                      <TableHead>Preferred Update</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adoptions.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium">{a.company_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono font-semibold">v{a.release_version}</TableCell>
                        <TableCell>{format(new Date(a.adopted_at), 'MMM d, yyyy hh:mm a')}</TableCell>
                        <TableCell>
                          {a.preferred_date ? (
                            <div className="text-sm">
                              <div className="font-medium">{format(new Date(a.preferred_date + 'T00:00:00'), 'MMM d, yyyy')}</div>
                              {a.preferred_time_start && a.preferred_time_end && (
                                <div className="text-xs text-muted-foreground">{formatTime12h(a.preferred_time_start)} – {formatTime12h(a.preferred_time_end)}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={a.status}
                            onValueChange={(value) => updateAdoptionStatus.mutate({ id: a.id, status: value })}
                          >
                            <SelectTrigger className={`w-[130px] h-8 text-xs font-medium ${
                              a.status === 'pending' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                              a.status === 'active' ? 'bg-green-50 border-green-200 text-green-800' :
                              a.status === 'completed' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                              ''
                            }`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="active">Installed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
