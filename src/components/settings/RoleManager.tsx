
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Settings, Shield } from "lucide-react";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isDefault: boolean;
}

interface RoleManagerProps {
  companyId: string;
}

export function RoleManager({ companyId }: RoleManagerProps) {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: "admin",
      name: "Administrator",
      description: "Full access to all company features and settings",
      permissions: ["read", "write", "delete", "admin"],
      userCount: 2,
      isDefault: true
    },
    {
      id: "manager",
      name: "Manager",
      description: "Manage team members and approve documents",
      permissions: ["read", "write", "approve"],
      userCount: 5,
      isDefault: true
    },
    {
      id: "reviewer",
      name: "Reviewer",
      description: "Review and comment on documents",
      permissions: ["read", "comment"],
      userCount: 12,
      isDefault: true
    },
    {
      id: "viewer",
      name: "Viewer",
      description: "Read-only access to documents and data",
      permissions: ["read"],
      userCount: 8,
      isDefault: true
    }
  ]);

  const getPermissionBadgeColor = (permission: string) => {
    switch (permission) {
      case "admin": return "destructive";
      case "write": return "default";
      case "approve": return "secondary";
      case "comment": return "outline";
      default: return "outline";
    }
  };

  const handleCreateRole = () => {
    toast.info("Role creation functionality coming soon");
  };

  const handleEditRole = (roleId: string) => {
    toast.info(`Edit role functionality coming soon for role: ${roleId}`);
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isDefault) {
      toast.error("Cannot delete default roles");
      return;
    }
    toast.info(`Delete role functionality coming soon for role: ${roleId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Management
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage user roles and permissions for your company. Define what each role can access and do.
              </p>
            </div>
            <Button onClick={handleCreateRole} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Role
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{role.name}</h3>
                    {role.isDefault && (
                      <Badge variant="outline" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {role.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditRole(role.id)}
                  className="h-8 w-8 p-0"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* User Count */}
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {role.userCount} user{role.userCount !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Permissions */}
              <div>
                <h4 className="text-sm font-medium mb-2">Permissions</h4>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.map((permission) => (
                    <Badge
                      key={permission}
                      variant={getPermissionBadgeColor(permission)}
                      className="text-xs"
                    >
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditRole(role.id)}
                  className="flex-1"
                >
                  Edit
                </Button>
                {!role.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRole(role.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Hierarchy Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Permission Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Badge variant="destructive">Administrator</Badge>
              <span className="text-sm">Full system access, can manage all users and settings</span>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Badge variant="default">Manager</Badge>
              <span className="text-sm">Can manage team members, approve documents and workflows</span>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Badge variant="secondary">Reviewer</Badge>
              <span className="text-sm">Can review documents, add comments and provide feedback</span>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Badge variant="outline">Viewer</Badge>
              <span className="text-sm">Read-only access to documents and data</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
