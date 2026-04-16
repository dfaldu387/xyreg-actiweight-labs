
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, Clock, Edit, Save, X, Users, Send } from "lucide-react";
import { usePendingUsers, PendingUser } from "@/hooks/usePendingUsers";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog";

interface PendingUsersTableProps {
  companyId: string;
  onChanged?: () => void;
}

export function PendingUsersTable({ companyId, onChanged }: PendingUsersTableProps) {
  const { pendingUsers, isLoading, deletePendingUser, updatePendingUser, activateAllPendingUsers } = usePendingUsers(companyId);
  const [isActivating, setIsActivating] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PendingUser>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deletePendingUser(deleteTarget.id);
      setDeleteTarget(null);
      onChanged?.();
    }
  };

  const handleEdit = (user: PendingUser) => {
    setEditingUser(user.id);
    setEditData({
      name: user.name,
      email: user.email,
      access_level: user.access_level,
      is_internal: user.is_internal,
      functional_area: user.functional_area,
      external_role: user.external_role
    });
  };

  const handleSave = async () => {
    if (!editingUser || !updatePendingUser) return;
    
    const success = await updatePendingUser(editingUser, editData);
    if (success) {
      setEditingUser(null);
      setEditData({});
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditData({});
  };

  const handleActivateAll = async () => {
    setIsActivating(true);
    await activateAllPendingUsers();
    setIsActivating(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (pendingUsers.length === 0) {
    return (
     <></>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Users ({pendingUsers.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingUsers.map((pendingUser) => (
          <div
            key={pendingUser.id}
            className="p-4 border rounded-lg"
          >
            {editingUser === pendingUser.id ? (
              // Edit mode
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={editData.name || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={editData.email || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Access Level</Label>
                    <Select
                      value={editData.access_level}
                      onValueChange={(value: any) => setEditData(prev => ({ ...prev, access_level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="consultant">Consultant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>User Type</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch
                        checked={editData.is_internal || false}
                        onCheckedChange={(checked) => setEditData(prev => ({ ...prev, is_internal: checked }))}
                      />
                      <span className="text-sm">
                        {editData.is_internal ? 'Internal' : 'External'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category field based on user type */}
                {editData.is_internal ? (
                  <div>
                    <Label>Functional Area</Label>
                    <Select
                      value={editData.functional_area || ''}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, functional_area: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select functional area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="research_development">Research & Development (R&D)</SelectItem>
                        <SelectItem value="quality_assurance">Quality Assurance (QA)</SelectItem>
                        <SelectItem value="regulatory_affairs">Regulatory Affairs</SelectItem>
                        <SelectItem value="clinical_affairs">Clinical Affairs</SelectItem>
                        <SelectItem value="manufacturing_operations">Manufacturing Operations</SelectItem>
                        <SelectItem value="marketing_labeling">Marketing & Labeling</SelectItem>
                        <SelectItem value="management_executive">Management & Executive</SelectItem>
                        <SelectItem value="other_internal">Other Internal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <Label>Role</Label>
                    <Select
                      value={editData.external_role || ''}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, external_role: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultant">Consultant</SelectItem>
                        <SelectItem value="auditor">Auditor</SelectItem>
                        <SelectItem value="contract_manufacturer">Contract Manufacturer</SelectItem>
                        <SelectItem value="distributor">Distributor</SelectItem>
                        <SelectItem value="key_opinion_leader">Key Opinion Leader</SelectItem>
                        <SelectItem value="other_external">Other External</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              // View mode
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{pendingUser.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{pendingUser.email}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge
                      variant={
                        pendingUser.access_level === 'admin' ? 'destructive' :
                        pendingUser.access_level === 'editor' ? 'default' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {pendingUser.access_level}
                    </Badge>
                    <Badge variant={pendingUser.is_internal ? 'default' : 'outline'} className="text-xs">
                      {pendingUser.is_internal ? 'Internal' : 'External'}
                    </Badge>
                    {pendingUser.is_internal && pendingUser.functional_area && (
                      <Badge variant="secondary" className="text-xs">
                        {pendingUser.functional_area}
                      </Badge>
                    )}
                    {!pendingUser.is_internal && pendingUser.external_role && (
                      <Badge variant="secondary" className="text-xs">
                        {pendingUser.external_role}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Created: {new Date(pendingUser.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    title="Send Invitation"
                    onClick={async () => {
                      const { sendInvitationDirect } = await import("@/hooks/useInvitations");
                      const nameParts = pendingUser.name.split(' ');
                      const firstName = nameParts[0] || '';
                      const lastName = nameParts.slice(1).join(' ') || '';
                      const result = await sendInvitationDirect(pendingUser.company_id, {
                        email: pendingUser.email,
                        access_level: pendingUser.access_level,
                        is_internal: pendingUser.is_internal,
                        firstName,
                        lastName,
                        functional_area: pendingUser.functional_area || null,
                        external_role: pendingUser.external_role || null,
                      });
                      if (result.success) {
                        await deletePendingUser(pendingUser.id);
                      }
                    }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDeleteTarget({ id: pendingUser.id, name: pendingUser.name })}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>

    <DeleteConfirmationDialog
      open={!!deleteTarget}
      onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      onConfirm={async (_reason: string) => {
        if (deleteTarget) {
          const id = deleteTarget.id;
          setDeleteTarget(null);
          await deletePendingUser(id);
          onChanged?.();
        }
      }}
      title="Remove Pending User"
      description="Are you sure you want to remove this pending user? This action cannot be undone."
      itemName={deleteTarget?.name || ''}
    />
    </>
  );
}
