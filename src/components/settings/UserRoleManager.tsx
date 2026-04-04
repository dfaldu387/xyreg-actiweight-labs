
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";
import { useRoleSwitcher } from "@/hooks/useRoleSwitcher";
import { UserRole } from "@/types/documentTypes";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check } from "lucide-react";
import { getRoleDisplayName } from "@/utils/roleUtils";
import { useCompanyRole } from "@/context/CompanyRoleContext";

interface UserRoleManagerProps {
  companyId?: string;
}

export function UserRoleManager({ companyId }: UserRoleManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [user, setUser] = useState<User | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Use company-specific roles if companyId is provided
  const { activeCompanyRole, updateCompanyRole } = useCompanyRole();
  const currentRole = companyId 
    ? activeCompanyRole?.role
    : (user?.user_metadata?.role as UserRole || "viewer");

  // Fetch current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user?.user_metadata?.role) {
          setSelectedRole(user.user_metadata.role as UserRole);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        toast.error("Failed to fetch user data");
      }
    };
    getCurrentUser();
  }, []);

  const handleRoleUpdate = async () => {
    if (!selectedRole) return;
    
    if (selectedRole === currentRole) {
      toast(`Your role is already set to ${getRoleDisplayName(selectedRole)}`);
      return;
    }
    
    setIsUpdating(true);
    try {
      let success = false;
      
      if (companyId) {
        // Update company-specific role
        const result = await updateCompanyRole(companyId, selectedRole);
        success = result.success;
        
        if (!result.success) {
          throw new Error(result.message || "Failed to update role");
        }
      } else {
        // Update global role (legacy behavior)
        const { error } = await supabase.auth.updateUser({
          data: { role: selectedRole }
        });
        
        if (error) throw error;
        success = true;
      }
      
      if (success) {
        toast.success(`Your role has been updated to ${getRoleDisplayName(selectedRole)}`);
        setShowSuccessMessage(true);
        
        // Hide success message after a delay
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 5000);
      }
      
    } catch (error: any) {
      console.error("Failed to update role:", error);
      toast.error(error.message || "Failed to update role");
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper function to handle role value changes as string
  const handleRoleChange = (value: string) => {
    setSelectedRole(value as UserRole);
    setShowSuccessMessage(false);
  };
  
  // Determine if current role display badge should be shown
  const shouldShowRoleBadge = currentRole && currentRole !== "viewer";
  
  // Function to get role badge variant
  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "editor":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>User Role</CardTitle>
          {shouldShowRoleBadge && (
            <Badge variant={getRoleBadgeVariant(currentRole)}>
              {getRoleDisplayName(currentRole)}
            </Badge>
          )}
        </div>
        <CardDescription>
          Change your user role to access different permissions levels 
          {companyId && " for this company"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showSuccessMessage && (
          <div className="bg-green-50 p-3 rounded-md flex items-center text-green-700 mb-4">
            <Check className="h-5 w-5 mr-2 flex-shrink-0 text-green-500" />
            <p className="text-sm">Role successfully updated to {getRoleDisplayName(selectedRole)}!</p>
          </div>
        )}
      
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Current role: {getRoleDisplayName(currentRole || "viewer")}
          </p>
          <Select value={selectedRole} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select new role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrator</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          
          {selectedRole === "admin" && (
            <div className="flex mt-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-600">
                Administrator role grants full access to all system features including user management and configuration settings.
              </p>
            </div>
          )}
        </div>
        
        <Button 
          onClick={handleRoleUpdate} 
          disabled={isUpdating || !selectedRole || selectedRole === currentRole}
          className="w-full"
        >
          {isUpdating ? "Updating..." : "Update Role"}
        </Button>
        
        <p className="text-xs text-muted-foreground mt-4">
          Note: Changing your role affects the permissions and features available to you 
          {companyId ? " for this specific company." : " across the platform."}
          You'll be able to switch back at any time.
        </p>
      </CardContent>
    </Card>
  );
}
