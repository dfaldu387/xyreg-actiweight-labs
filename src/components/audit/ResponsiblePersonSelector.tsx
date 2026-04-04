
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface ResponsiblePersonSelectorProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  companyId?: string;
}

export function ResponsiblePersonSelector({ value, onChange, companyId }: ResponsiblePersonSelectorProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // If we have a company ID, get users with access to that company
        if (companyId) {
          const { data, error } = await supabase
            .from('user_company_access')
            .select(`
              user_id,
              user_profiles!inner(
                id,
                email,
                first_name,
                last_name
              )
            `)
            .eq('company_id', companyId);

          if (error) {
            // console.error('Error fetching company users:', error);
            return;
          }

          const companyUsers = data?.map(item => item.user_profiles).filter(Boolean) || [];
          setUsers(companyUsers as any[]);
        } else {
          // Fallback: get all user profiles (limited for performance)
          const { data, error } = await supabase
            .from('user_profiles')
            .select('id, email, first_name, last_name')
            .limit(50);

          if (error) {
            // console.error('Error fetching users:', error);
            return;
          }

          setUsers(data || []);
        }
      } catch (error) {
        // console.error('Error in fetchUsers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [companyId]);

  const getDisplayName = (user: UserProfile) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.email;
  };

  const handleValueChange = (val: string) => {
    // Convert "unassigned" back to undefined for the parent component
    onChange(val === "unassigned" ? undefined : val);
  };

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading users..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value || "unassigned"} onValueChange={handleValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select responsible person (optional)">
          {value && users.find(u => u.id === value) && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {getDisplayName(users.find(u => u.id === value)!)}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">No one assigned</SelectItem>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <div>
                <div className="font-medium">{getDisplayName(user)}</div>
                {user.first_name && user.last_name && (
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
