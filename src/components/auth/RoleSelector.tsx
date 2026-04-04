
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@/types/documentTypes";

export function RoleSelector() {
  const { user, userRole, refreshSession } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(userRole as UserRole | null);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!user) return null;

  const handleRoleChange = (role: string) => {
    setSelectedRole(role as UserRole);
  };

  const updateRole = async () => {
    if (!selectedRole || selectedRole === userRole) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { role: selectedRole }
      });
      
      if (error) throw error;
      
      toast("Role updated", {
        description: `Your role has been updated to ${selectedRole}. You may need to refresh the session.`,
      });
      
      // Refresh the session to apply the new role
      await refreshSession();
      
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast("Error updating role", {
        description: error.message || "Could not update your role",
        // Using a string identifier for the error toast style instead of variant
        style: { backgroundColor: 'hsl(var(--destructive))' }
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto my-4">
      <CardHeader>
        <CardTitle>User Role Selector</CardTitle>
        <CardDescription>For testing purposes only - change your role to access different dashboards</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Current Role: {userRole || "Not set"}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium mb-1">Select New Role:</p>
            <Select value={selectedRole || ""} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={updateRole} 
          disabled={isUpdating || !selectedRole || selectedRole === userRole}
          className="w-full"
        >
          {isUpdating ? "Updating..." : "Update Role"}
        </Button>
      </CardFooter>
    </Card>
  );
}
