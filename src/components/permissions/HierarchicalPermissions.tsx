
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Table, Grid2X2 } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { AddCompanyUserDialog } from "@/components/permissions/AddCompanyUserDialog";
import { CompanyUserPermissions } from "@/components/permissions/CompanyUserPermissions";
import { PermissionsTable } from "@/components/permissions/PermissionsTable";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { HybridUserManagement } from "@/components/permissions/HybridUserManagement";

interface HierarchicalPermissionsProps {
  company?: string;
}

export function HierarchicalPermissions({ company }: HierarchicalPermissionsProps) {
  // Use the new hybrid user management component if we have a company
  if (company) {
    return <HybridUserManagement companyId={company} />;
  }

  // Fallback to original implementation for backwards compatibility
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  const { users, isLoading, error, removeUser } = useCompanyUsers(company);
  
  const handleAddUser = () => {
    setDialogOpen(false);
  };
  
  const handleRemoveUser = async (userId: string) => {
    if (confirm('Are you sure you want to remove this user from the company?')) {
      await removeUser(userId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error loading users: {error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">User Permissions</h3>
        <div className="flex gap-2">
          <div className="flex border rounded-md p-1">
            <Button
              variant="ghost"
              size="icon"
              className={viewMode === 'cards' ? 'bg-muted' : ''}
              onClick={() => setViewMode('cards')}
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={viewMode === 'table' ? 'bg-muted' : ''}
              onClick={() => setViewMode('table')}
            >
              <Table className="h-4 w-4" />
            </Button>
          </div>
          {company && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <AddCompanyUserDialog 
                onUserAdded={handleAddUser}
                onUserInvited={handleAddUser}
                companyId={company}
              />
            </Dialog>
          )}
        </div>
      </div>
      
      {users.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No users have been added to this company yet.</p>
          {company && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add First User
                </Button>
              </DialogTrigger>
              <AddCompanyUserDialog 
                onUserAdded={handleAddUser}
                onUserInvited={handleAddUser}
                companyId={company}
              />
            </Dialog>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'cards' ? (
            <div className="space-y-4">
              {users.map(user => (
                <CompanyUserPermissions
                  key={user.id}
                  user={user}
                  onRemove={() => handleRemoveUser(user.id)}
                  companyId={company || ''}
                />
              ))}
            </div>
          ) : (
            <PermissionsTable 
              users={users}
              onUpdatePermissions={() => {}} // This would need to be implemented
              onRemoveUser={(userId) => handleRemoveUser(userId.toString())}
            />
          )}
        </>
      )}
    </div>
  );
}
