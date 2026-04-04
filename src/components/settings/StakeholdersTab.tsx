import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NotifiedBodySettings } from './NotifiedBodySettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Loader2, Contact, Edit, MoreVertical } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AddStakeholderUserSheet } from './AddStakeholderUserSheet';

interface StakeholderItem {
  id: string;
  name: string;
  email?: string | null;
  type: 'user' | 'pending' | 'custom';
  createdAt?: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  access_level: string;
  is_internal: boolean;
  status: string;
  invited_at: string;
  expires_at?: string;
  first_name?: string;
  last_name?: string;
}

interface StakeholdersTabProps {
  companyId: string;
  companyName?: string;
}

export function StakeholdersTab({ companyId, companyName }: StakeholdersTabProps) {
  const { lang } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allStakeholders, setAllStakeholders] = useState<StakeholderItem[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Read initial subtab from URL, default to 'stakeholders'
  const subtabParam = searchParams.get('subtab');
  const initialTab = subtabParam === 'pending' ? 'pending' : subtabParam === 'notified-bodies' ? 'notified-bodies' : 'stakeholders';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Sync activeTab when URL changes
  useEffect(() => {
    const subtab = searchParams.get('subtab');
    if (subtab === 'pending' || subtab === 'stakeholders' || subtab === 'notified-bodies') {
      setActiveTab(subtab);
    }
  }, [searchParams]);
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('subtab', value);
    setSearchParams(newParams, { replace: true });
  };
  
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: StakeholderItem | null }>({
    open: false,
    item: null
  });
  const [editDialog, setEditDialog] = useState<{ open: boolean; item: StakeholderItem | null }>({
    open: false,
    item: null
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: ''
  });
  const [addUserSheetOpen, setAddUserSheetOpen] = useState(false);
  const [addUserDefaultName, setAddUserDefaultName] = useState('');
  const [addUserStakeholderId, setAddUserStakeholderId] = useState<string | undefined>();
  const { toast } = useToast();

  const fetchStakeholders = useCallback(async () => {
    if (!companyId) {
      setAllStakeholders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch visible document authors (is_visible = true and email is null)
      const { data: documentAuthors, error: docAuthorsError } = await (supabase as any)
        .from('document_authors')
        .select('id, name, last_name, email, created_at, is_visible, user_id, user_invitation_id')
        .eq('company_id', companyId)
        .eq('is_visible', true)
        .is('email', null);

      if (docAuthorsError) {
        console.error('Error fetching document authors:', docAuthorsError);
      }

      // Format custom authors
      const formattedCustom: StakeholderItem[] = (documentAuthors || [])
        .map(a => ({
          id: a.id,
          name: [a.name, a.last_name].filter(Boolean).join(' ') || 'Unknown',
          email: a.email,
          type: 'custom' as const,
          createdAt: a.created_at
        }));

      setAllStakeholders(formattedCustom);
    } catch (error) {
      console.error('Error fetching stakeholders:', error);
      toast({
        title: lang('common.error'),
        description: lang('stakeholders.toast.fetchFailed'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [companyId, toast]);

  const fetchPendingInvitations = useCallback(async () => {
    if (!companyId) {
      setPendingInvitations([]);
      return;
    }

    try {
      const { data: invitations, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'pending')
        .eq('access_level', 'author')
        .order('invited_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending invitations:', error);
        return;
      }

      setPendingInvitations(invitations || []);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    }
  }, [companyId]);

  useEffect(() => {
    fetchStakeholders();
    fetchPendingInvitations();
  }, [fetchStakeholders, fetchPendingInvitations]);

  const handleDeleteClick = (item: StakeholderItem) => {
    setDeleteDialog({ open: true, item });
  };

  const handleEditClick = (item: StakeholderItem) => {
    setEditFormData({
      name: item.name,
      email: item.email || ''
    });
    setEditDialog({ open: true, item });
  };

  const handleConfirmEdit = async () => {
    if (!editDialog.item) return;

    setIsEditing(true);
    try {
      const item = editDialog.item;

      const { error } = await supabase
        .from('document_authors')
        .update({
          name: editFormData.name.trim(),
          email: editFormData.email.trim() || null
        })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: lang('common.success'),
        description: lang('stakeholders.toast.updateSuccess')
      });

      fetchStakeholders();
      setEditDialog({ open: false, item: null });
    } catch (error) {
      console.error('Error updating stakeholder:', error);
      toast({
        title: lang('common.error'),
        description: lang('stakeholders.toast.updateFailed'),
        variant: 'destructive'
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleConfirmDelete = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!deleteDialog.item) return;

    setIsDeleting(true);
    try {
      const item = deleteDialog.item;

      const { error } = await supabase
        .from('document_authors')
        .delete()
        .eq('id', item.id)
        .eq('company_id', companyId);

      if (error) {
        console.error('Error deleting document author:', error);
        throw error;
      }

      toast({
        title: lang('common.success'),
        description: lang('stakeholders.toast.removeSuccess')
      });

      setDeleteDialog({ open: false, item: null });
      await fetchStakeholders();
    } catch (error: any) {
      console.error('Error deleting stakeholder:', error);
      const errorMessage = error?.message || lang('stakeholders.toast.removeFailed');
      toast({
        title: lang('common.error'),
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddUserClick = () => {
    setAddUserDefaultName(editFormData.name);
    setAddUserStakeholderId(editDialog.item?.id);
    setAddUserSheetOpen(true);
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: lang('common.success'),
        description: lang('stakeholders.toast.invitationCancelled')
      });

      fetchPendingInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: lang('common.error'),
        description: lang('stakeholders.toast.cancelFailed'),
        variant: 'destructive'
      });
    }
  };

  const handleResendInvitation = async (invitation: PendingInvitation) => {
    toast({
      title: lang('common.info'),
      description: lang('stakeholders.toast.resendComingSoon')
    });
  };

  const handleStakeholderDeleted = () => {
    setEditDialog({ open: false, item: null });
    fetchStakeholders();
    fetchPendingInvitations();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Contact className="h-5 w-5" />
            {lang('stakeholders.title')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {lang('stakeholders.description')}
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="stakeholders">
            {lang('stakeholders.tabs.stakeholders')} ({allStakeholders.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            {lang('stakeholders.tabs.pending')} ({pendingInvitations.length})
          </TabsTrigger>
          <TabsTrigger value="notified-bodies">
            Notified Bodies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stakeholders">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium mb-4">{lang('stakeholders.tabs.stakeholders')} ({allStakeholders.length})</div>
              {allStakeholders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {lang('stakeholders.empty')}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{lang('stakeholders.table.name')}</TableHead>
                      <TableHead>{lang('stakeholders.table.role')}</TableHead>
                      <TableHead>{lang('stakeholders.table.createdAt')}</TableHead>
                      <TableHead className="w-[100px] text-right">{lang('stakeholders.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allStakeholders.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{lang('stakeholders.role.author')}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditClick(item)}
                              title={lang('common.edit')}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(item)}
                              title={lang('stakeholders.remove')}
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
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium mb-4">{lang('stakeholders.tabs.pending')} ({pendingInvitations.length})</div>
              {pendingInvitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {lang('stakeholders.noPending')}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{lang('stakeholders.table.email')}</TableHead>
                      <TableHead>{lang('stakeholders.table.accessLevel')}</TableHead>
                      <TableHead>{lang('stakeholders.table.type')}</TableHead>
                      <TableHead>{lang('stakeholders.table.status')}</TableHead>
                      <TableHead>{lang('stakeholders.table.invited')}</TableHead>
                      <TableHead>{lang('stakeholders.table.expires')}</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvitations.map(invitation => (
                      <TableRow key={invitation.id}>
                        <TableCell className="text-primary">{invitation.email}</TableCell>
                        <TableCell>{invitation.access_level}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {invitation.is_internal ? lang('stakeholders.type.internal') : lang('stakeholders.type.external')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-500 hover:bg-yellow-500">{lang('stakeholders.status.pending')}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(invitation.invited_at)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(invitation.expires_at)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleResendInvitation(invitation)}>
                                {lang('stakeholders.actions.resend')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleCancelInvitation(invitation.id)}
                              >
                                {lang('stakeholders.actions.cancel')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notified-bodies">
          <Card>
            <CardContent className="pt-6">
              {companyName ? (
                <NotifiedBodySettings companyId={companyId} companyName={companyName} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Company name not available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => {
        if (!isDeleting) {
          setDeleteDialog({ open, item: open ? deleteDialog.item : null });
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang('stakeholders.dialog.removeTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang('stakeholders.dialog.removeDescription').replace('{{name}}', deleteDialog.item?.name || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setDeleteDialog({ open: false, item: null })}>{lang('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete(e);
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {lang('stakeholders.dialog.removing')}
                </>
              ) : (
                lang('stakeholders.remove')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Stakeholder Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, item: open ? editDialog.item : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang('stakeholders.dialog.editTitle')}</DialogTitle>
            <DialogDescription>
              {lang('stakeholders.dialog.editDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end">
            <Button size='sm' onClick={handleAddUserClick}>{lang('stakeholders.dialog.addAsUser')}</Button>
          </div>
          <div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">{lang('stakeholders.form.name')} *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={lang('stakeholders.form.namePlaceholder')}
                disabled={isEditing}
              />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email (optional)"
                disabled={isEditing}
              />
            </div> */}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialog({ open: false, item: null })}
              disabled={isEditing}
            >
              {lang('common.cancel')}
            </Button>
            <Button
              onClick={handleConfirmEdit}
              disabled={isEditing || !editFormData.name.trim()}
            >
              {isEditing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {lang('stakeholders.dialog.updating')}
                </>
              ) : (
                lang('stakeholders.dialog.update')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Sheet */}
      <AddStakeholderUserSheet
        open={addUserSheetOpen}
        onOpenChange={setAddUserSheetOpen}
        companyId={companyId}
        defaultFirstName={addUserDefaultName}
        stakeholderId={addUserStakeholderId}
        onStakeholderDeleted={handleStakeholderDeleted}
      />
    </div>
  );
}
