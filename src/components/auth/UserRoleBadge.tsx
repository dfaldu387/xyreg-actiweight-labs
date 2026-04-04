
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types/documentTypes";

interface UserRoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  const roleConfig = {
    admin: {
      label: "Admin",
      className: "bg-blue-100 text-blue-800"
    },
    editor: {
      label: "Editor",
      className: "bg-green-100 text-green-800"
    },
    viewer: {
      label: "Viewer",
      className: "bg-gray-100 text-gray-800"
    }
  };

  const { label, className: badgeClassName } = roleConfig[role];

  return (
    <Badge 
      variant="outline" 
      className={`px-2 py-0.5 text-xs font-medium ${badgeClassName} ${className || ''}`}
    >
      {label}
    </Badge>
  );
}
