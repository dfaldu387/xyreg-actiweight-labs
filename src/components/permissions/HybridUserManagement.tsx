
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, AlertTriangle } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddCompanyUserDialog } from "@/components/permissions/AddCompanyUserDialog";
import { UserInvitationsTable } from "@/components/permissions/UserInvitationsTable";
import { PendingUsersTable } from "@/components/permissions/PendingUsersTable";
import { CompanyUserPermissions } from "@/components/permissions/CompanyUserPermissions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useInvitations } from "@/hooks/useInvitations";
import { usePendingUsers } from "@/hooks/usePendingUsers";
import { useTranslation } from "@/hooks/useTranslation";

interface HybridUserManagementProps {
  companyId: string;
}

export function HybridUserManagement({ companyId }: HybridUserManagementProps) {
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const { lang } = useTranslation();

  const { users, isLoading: usersLoading, error: usersError, removeUser, fetchUsers } = useCompanyUsers(companyId);
  const { invitations, isLoading: invitationsLoading, fetchInvitations } = useInvitations(companyId);
  const { pendingUsers, isLoading: pendingUsersLoading, fetchPendingUsers } = usePendingUsers(companyId);

  const handleUserAction = async () => {
    setAddUserDialogOpen(false);
    await Promise.all([
      fetchUsers(),
      fetchInvitations(),
      fetchPendingUsers()
    ]);
  };

  const handleRemoveUser = (userId: string) => {
    setUserToRemove(userId);
    setRemoveDialogOpen(true);
  };

  const confirmRemoveUser = async () => {
    if (!userToRemove) return;
    setIsRemoving(true);
    await removeUser(userToRemove);
    setIsRemoving(false);
    setRemoveDialogOpen(false);
    setUserToRemove(null);
  };

  const isLoading = usersLoading || invitationsLoading || pendingUsersLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{lang('companySettings.usersAccess.errorLoadingUsers')}: {usersError}</p>
        <Button onClick={() => window.location.reload()}>
          {lang('common.tryAgain')}
        </Button>
      </div>
    );
  }

  const pendingInvitationsCount = (invitations?.filter(inv => inv.status === 'pending').length || 0) + (pendingUsers?.length || 0);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">{lang('companySettings.usersAccess.title')}</h3>
        <div className="flex gap-2">
          <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Mail className="h-4 w-4 mr-2" />
                {lang('companySettings.usersAccess.addUser')}
              </Button>
            </DialogTrigger>
            <AddCompanyUserDialog 
              onUserInvited={handleUserAction}
              onUserAdded={handleUserAction}
              companyId={companyId}
            />
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">{lang('companySettings.usersAccess.activeUsers')} ({users.length})</TabsTrigger>
          <TabsTrigger value="invitations">
            {lang('companySettings.usersAccess.pendingInvitations')} ({pendingInvitationsCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{lang('companySettings.usersAccess.noUsersYet')}</p>
              <p className="text-sm text-muted-foreground mb-4">
                {lang('companySettings.usersAccess.addUsersHint')}
              </p>
              <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Mail className="h-4 w-4 mr-2" />
                    {lang('companySettings.usersAccess.addFirstUser')}
                  </Button>
                </DialogTrigger>
                <AddCompanyUserDialog 
                  onUserInvited={handleUserAction}
                  onUserAdded={handleUserAction}
                  companyId={companyId}
                />
              </Dialog>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(user => (
                <CompanyUserPermissions
                  key={user.id}
                  user={user}
                  onRemove={() => handleRemoveUser(user.id)}
                  companyId={companyId}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <PendingUsersTable companyId={companyId} onChanged={() => fetchPendingUsers()} />
          <UserInvitationsTable companyId={companyId} onChanged={() => fetchInvitations()} />
        </TabsContent>
      </Tabs>

      {/* Remove User Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remove User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this user from the company? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => { setRemoveDialogOpen(false); setUserToRemove(null); }}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveUser}
              disabled={isRemoving}
            >
              {isRemoving ? 'Removing...' : 'Remove User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
