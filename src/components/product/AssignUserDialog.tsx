
import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, UserPlus, AlertCircle } from "lucide-react";

interface AssignUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  categoryType: string;
}

const mockUsers = [
  { id: "user1", name: "John Smith" },
  { id: "user2", name: "Maria Garcia" },
  { id: "user3", name: "Alex Johnson" },
  { id: "user4", name: "Sarah Lee" },
  { id: "user5", name: "Michael Brown" },
];

const roleTypes = [
  { id: "viewer", name: "Viewer", description: "Can view and comment only" },
  { id: "editor", name: "Editor", description: "Can edit, add comments and suggest actions" },
  { id: "admin", name: "Admin", description: "Has full control and approval rights" },
];

export function AssignUserDialog({ 
  open, 
  onOpenChange, 
  categoryId,
  categoryType
}: AssignUserDialogProps) {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const handleSubmit = () => {
    if (!selectedUser || !selectedRole) {
      setErrorMessage("Please select both a user and a role.");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      
      const user = mockUsers.find(u => u.id === selectedUser);
      const role = roleTypes.find(r => r.id === selectedRole);
      
      if (user && role) {
        setSuccessMessage(`${user.name} has been assigned as ${role.name} to ${categoryId}`);
      } else {
        setErrorMessage("Failed to assign user.");
      }
      
      onOpenChange(false);
      
      // Reset form
      setSelectedUser("");
      setSelectedRole("");
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign User to Category</DialogTitle>
          <DialogDescription>
            Assign a user and role to the category {categoryId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="user">Select User</Label>
            <Select 
              value={selectedUser} 
              onValueChange={setSelectedUser}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {mockUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Select Role</Label>
            <Select 
              value={selectedRole} 
              onValueChange={setSelectedRole}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleTypes.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRole && (
            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="font-medium">Role Description:</p>
              <p>{roleTypes.find(r => r.id === selectedRole)?.description}</p>
            </div>
          )}
        </div>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>Processing...</>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
