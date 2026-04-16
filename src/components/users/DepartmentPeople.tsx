import React, { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { UserCard } from "./UserCard";
import { QuickMessageDialog } from "@/components/communications/QuickMessageDialog";

interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  avatar_url?: string | null;
  functional_area?: string;
  access_level?: string;
}

interface DepartmentPeopleProps {
  departmentName: string;
  users: User[];
  onUserUpdate?: () => void;
  companyId?: string;
}

// Map department names to functional area enum values
const mapDepartmentToFunctionalArea = (departmentName: string): string => {
  switch (departmentName) {
    case "Design & Development":
      return "design_development";
    case "Sales & Marketing":
      return "sales_marketing";
    case "Regulatory Affairs":
      return "regulatory_affairs";
    case "Quality Assurance":
      return "quality_assurance";
    case "Research & Development":
      return "research_development";
    case "Manufacturing":
      return "manufacturing";
    case "Clinical Affairs":
      return "clinical_affairs";
    default:
      return departmentName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  }
};

export function DepartmentPeople({ departmentName, users, onUserUpdate, companyId }: DepartmentPeopleProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [quickMessageUser, setQuickMessageUser] = useState<User | null>(null);

  const getInitials = (user: User) => {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || user.email.charAt(0).toUpperCase();
  };

  if (users.length === 0) {
    return null;
  }

  const maxVisible = 6;
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  return (
    <>
      <div className="flex items-center justify-start py-2">
        <div className="flex items-center gap-1">
          {visibleUsers.map((user) => (
            <Avatar 
              key={user.id} 
              className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-white/30 transition-all"
              onClick={() => setSelectedUser(user)}
            >
              <AvatarImage src={user.avatar_url || undefined} alt={`${user.first_name} ${user.last_name}`} />
              <AvatarFallback className="text-xs bg-white/20 text-white">
                {getInitials(user)}
              </AvatarFallback>
            </Avatar>
          ))}
          {remainingCount > 0 && (
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-xs text-white/70">+{remainingCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* User Profile Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <>
              <UserCard 
                user={selectedUser} 
                canEdit={false}
                onAvatarUpdate={onUserUpdate}
              />
              {companyId && (
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={() => {
                    setQuickMessageUser(selectedUser);
                    setSelectedUser(null);
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Message Dialog */}
      {quickMessageUser && companyId && (
        <QuickMessageDialog
          open={!!quickMessageUser}
          onOpenChange={(open) => { if (!open) setQuickMessageUser(null); }}
          recipient={quickMessageUser}
          companyId={companyId}
        />
      )}
    </>
  );
}