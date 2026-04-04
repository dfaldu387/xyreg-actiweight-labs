import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserCheck, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { GapAnalysisItem } from '@/types/client';
import { useCompanyUsers, CompanyUser } from '@/hooks/useCompanyUsers';
import { toast } from 'sonner';
import { assignResponsiblePersons, getResponsiblePersons } from '@/services/gapAnalysisService';

interface ResponsiblePersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: GapAnalysisItem;
  companyId?: string;
  onResponsiblePersonsChanged?: () => void;
}

export function ResponsiblePersonDialog({
  open,
  onOpenChange,
  item,
  companyId,
  onResponsiblePersonsChanged
}: ResponsiblePersonDialogProps) {
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { users, isLoading } = useCompanyUsers(companyId);

  // Load existing responsible persons when dialog opens
  useEffect(() => {
    if (open && item.id) {
      loadExistingResponsiblePersons();
    }
  }, [open, item.id]);

  const loadExistingResponsiblePersons = async () => {
    try {
      const persons = await getResponsiblePersons(item.id);
      setSelectedPersons(persons);
    } catch (error) {
      console.error('Error loading responsible persons:', error);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchQuery('');
  };

  const handleTogglePerson = (userId: string) => {
    setSelectedPersons(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleAssignPersons = async () => {
    if (!item.id) {
      toast.error('Invalid gap analysis item');
      return;
    }

    setIsAssigning(true);
    try {
      const result = await assignResponsiblePersons(item.id, selectedPersons);

      if (result.success) {
        toast.success(`Successfully assigned ${selectedPersons.length} responsible person(s)`);
        if (onResponsiblePersonsChanged) {
          onResponsiblePersonsChanged();
        }
        handleClose();
      } else {
        toast.error(result.message || 'Failed to assign responsible persons');
      }
    } catch (error) {
      console.error('Error assigning responsible persons:', error);
      toast.error('An error occurred while assigning responsible persons');
    } finally {
      setIsAssigning(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAccessLevelColor = (accessLevel: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-700',
      editor: 'bg-blue-100 text-blue-700',
      viewer: 'bg-gray-100 text-gray-700',
      consultant: 'bg-purple-100 text-purple-700'
    };
    return colors[accessLevel as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getUserTypeLabel = (user: CompanyUser) => {
    if (user.is_internal) {
      return user.functional_area ? user.functional_area.replace(/_/g, ' ') : 'Internal';
    } else {
      return user.external_role ? user.external_role.replace(/_/g, ' ') : 'External';
    }
  };

  // Filter users based on search query and exclude company owners
  const filteredUsers = users.filter(user => {
    // Exclude admin users (company owners)
    if (user.access_level === 'admin') {
      return false;
    }

    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    );
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[65vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Assign Responsible Person
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 p-1">
          {/* Gap Item Info */}
          <div className="bg-muted/50 rounded-lg p-3 shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-sm mb-1">
                  {item.clauseId || 'Gap Item'} - {item.clauseSummary || item.requirement}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {item.framework}
                  </Badge>
                  {item.section && (
                    <Badge variant="secondary" className="text-xs">
                      {item.section}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected Count */}
          {selectedPersons.length > 0 && (
            <div className="shrink-0">
              <Badge variant="secondary" className="text-xs">
                {selectedPersons.length} person(s) selected
              </Badge>
            </div>
          )}

          {/* User List */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No users found matching your search' : 'No users available'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 pb-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                      selectedPersons.includes(user.id) ? 'bg-green-50 border-green-200' : 'bg-background'
                    }`}
                    onClick={() => handleTogglePerson(user.id)}
                  >
                    <Checkbox
                      checked={selectedPersons.includes(user.id)}
                      onCheckedChange={() => handleTogglePerson(user.id)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-500 text-white text-sm font-medium">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{user.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={isAssigning}>
            Cancel
          </Button>
          <Button onClick={handleAssignPersons} disabled={isAssigning || selectedPersons.length === 0}>
            {isAssigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Selecting...
              </>
            ) : (
              `Select ${selectedPersons.length} Person${selectedPersons.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
