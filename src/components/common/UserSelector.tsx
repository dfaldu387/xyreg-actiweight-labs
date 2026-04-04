import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CompanyUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  access_level: string;
}

interface UserSelectorProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  companyId?: string;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  allowClear?: boolean;
  className?: string;
}

export function UserSelector({
  value,
  onValueChange,
  companyId,
  isLoading: externalLoading = false,
  disabled = false,
  placeholder = "Select user",
  label = "Editor",
  allowClear = true,
  className = ""
}: UserSelectorProps) {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      setUsers([]);
      return;
    }

    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('user_company_access')
          .select(`
            user_id,
            access_level,
            user_profiles!inner(
              id,
              email,
              first_name,
              last_name
            )
          `)
          .eq('company_id', companyId);

        if (error) throw error;

        const formattedUsers: CompanyUser[] = (data || []).map((item: any) => ({
          id: item.user_profiles.id,
          email: item.user_profiles.email,
          first_name: item.user_profiles.first_name,
          last_name: item.user_profiles.last_name,
          access_level: item.access_level
        }));

        setUsers(formattedUsers);
      } catch (err) {
        console.error('Error fetching company users:', err);
        setError('Failed to load users');
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [companyId]);

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === "none") {
      onValueChange(undefined);
    } else {
      onValueChange(selectedValue);
    }
  };

  const handleClear = () => {
    onValueChange(undefined);
  };

  const getUserDisplayName = (user: CompanyUser): string => {
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
    return fullName || user.email;
  };

  const loading = isLoading || externalLoading;

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label>{label}</Label>
        <div className="h-10 w-full animate-pulse bg-gray-200 rounded-md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label>{label}</Label>
        <div className="h-10 w-full border border-destructive rounded-md flex items-center px-3 text-destructive text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      <div className="flex gap-2 items-center">
        <Select
          value={value || "none"}
          onValueChange={handleValueChange}
          disabled={disabled}
        >
          <SelectTrigger className="flex-1 min-w-0 py-4">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No user assigned</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-1" />
                  <div className="flex flex-col leading-tight">
                    <span>{getUserDisplayName(user)}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email} • {user.access_level}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {allowClear && value !== undefined && value !== "none" && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleClear}
            disabled={disabled}
            className="shrink-0 flex-none"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}