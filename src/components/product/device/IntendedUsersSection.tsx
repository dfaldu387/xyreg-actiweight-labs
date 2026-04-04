import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface IntendedUsersSectionProps {
  intendedUsers?: string[];
  onIntendedUsersChange?: (users: string[]) => void;
  isLoading?: boolean;
}

export function IntendedUsersSection({
  intendedUsers = [],
  onIntendedUsersChange,
  isLoading = false
}: IntendedUsersSectionProps) {
  const [newUser, setNewUser] = useState('');

  const handleAddUser = () => {
    if (newUser.trim() && !intendedUsers.includes(newUser.trim())) {
      onIntendedUsersChange?.([...intendedUsers, newUser.trim()]);
      setNewUser('');
    }
  };

  const handleRemoveUser = (index: number) => {
    const updated = intendedUsers.filter((_, i) => i !== index);
    onIntendedUsersChange?.(updated);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {intendedUsers.map((user, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-2">
              {user}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemoveUser(index)}
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newUser}
            onChange={(e) => setNewUser(e.target.value)}
            placeholder="e.g., Healthcare Professionals, Patients, Caregivers"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUser();
              }
            }}
          />
          <Button 
            onClick={handleAddUser} 
            disabled={!newUser.trim() || isLoading}
            variant="secondary"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Specify who is intended to use this device, including healthcare professionals, patients, and other stakeholders.
        </p>
      </CardContent>
    </Card>
  );
}
