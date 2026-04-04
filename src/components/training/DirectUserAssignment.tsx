import React, { useState } from 'react';
import { useTrainingModules } from '@/hooks/useTrainingModules';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import { BookOpen, Users, Search, Calendar } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedUserId?: string;
}

export function DirectUserAssignment({ companyId, open, onOpenChange, preSelectedUserId }: Props) {
  const { data: modules, isLoading: modulesLoading } = useTrainingModules(companyId);
  const { users, isLoading: usersLoading } = useCompanyUsers(companyId);
  const queryClient = useQueryClient();
  const { lang } = useTranslation();

  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // Pre-select user when dialog opens with a preSelectedUserId
  React.useEffect(() => {
    if (open && preSelectedUserId) {
      setSelectedUserIds(new Set([preSelectedUserId]));
    }
  }, [open, preSelectedUserId]);
  const [selectedModuleIds, setSelectedModuleIds] = useState<Set<string>>(new Set());
  const [dueDays, setDueDays] = useState(30);
  const [userSearch, setUserSearch] = useState('');
  const [moduleSearch, setModuleSearch] = useState('');

  const createTrainingRecords = useMutation({
    mutationFn: async ({ userIds, moduleIds, dueDate }: { 
      userIds: string[]; 
      moduleIds: string[]; 
      dueDate: string;
    }) => {
      const records = userIds.flatMap(userId => 
        moduleIds.map(moduleId => ({
          user_id: userId,
          training_module_id: moduleId,
          company_id: companyId,
          status: 'not_started',
          due_date: dueDate,
        }))
      );

      const { data, error } = await supabase
        .from('training_records')
        .insert(records)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['training-records'] });
      toast.success(lang('training.directAssignment.toast.assigned').replace('{{count}}', String(data.length)));
      handleClose();
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error(lang('training.directAssignment.toast.alreadyAssigned'));
      } else {
        toast.error(lang('training.directAssignment.toast.failed'));
      }
    },
  });

  const handleClose = () => {
    setSelectedUserIds(new Set());
    setSelectedModuleIds(new Set());
    setDueDays(30);
    setUserSearch('');
    setModuleSearch('');
    onOpenChange(false);
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModuleIds(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const selectAllUsers = () => {
    const filtered = filteredUsers;
    if (selectedUserIds.size === filtered.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filtered.map(u => u.id)));
    }
  };

  const selectAllModules = () => {
    const filtered = filteredModules;
    if (selectedModuleIds.size === filtered.length) {
      setSelectedModuleIds(new Set());
    } else {
      setSelectedModuleIds(new Set(filtered.map(m => m.id)));
    }
  };

  const handleAssign = () => {
    if (selectedUserIds.size === 0) {
      toast.error(lang('training.directAssignment.toast.selectUser'));
      return;
    }
    if (selectedModuleIds.size === 0) {
      toast.error(lang('training.directAssignment.toast.selectModule'));
      return;
    }

    const dueDate = format(addDays(new Date(), dueDays), 'yyyy-MM-dd');
    
    createTrainingRecords.mutate({
      userIds: Array.from(selectedUserIds),
      moduleIds: Array.from(selectedModuleIds),
      dueDate,
    });
  };

  const isLoading = modulesLoading || usersLoading;
  const activeModules = modules?.filter(m => m.is_active) || [];
  
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredModules = activeModules.filter(m =>
    m.name.toLowerCase().includes(moduleSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {lang('training.directAssignment.title')}
          </DialogTitle>
          <DialogDescription>
            {lang('training.directAssignment.description')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Users Column */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {lang('training.directAssignment.selectUsers')}
                  </Label>
                  <Badge variant="outline">{selectedUserIds.size} {lang('training.roleAssignment.selected')}</Badge>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={lang('training.directAssignment.searchUsers')}
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>

                <div className="flex items-center gap-2 pb-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAllUsers}
                    className="h-7 text-xs"
                  >
                    {selectedUserIds.size === filteredUsers.length ? lang('training.directAssignment.deselectAll') : lang('training.directAssignment.selectAll')}
                  </Button>
                </div>

                <ScrollArea className="h-[280px] rounded-md border">
                  <div className="p-2 space-y-1">
                    {filteredUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {lang('training.directAssignment.noUsersFound')}
                      </p>
                    ) : (
                      filteredUsers.map(user => (
                        <div
                          key={user.id}
                          className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50 ${
                            selectedUserIds.has(user.id) ? 'bg-primary/10' : ''
                          }`}
                          onClick={() => toggleUser(user.id)}
                        >
                          <Checkbox
                            checked={selectedUserIds.has(user.id)}
                            onCheckedChange={() => toggleUser(user.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Modules Column */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {lang('training.directAssignment.selectTraining')}
                  </Label>
                  <Badge variant="outline">{selectedModuleIds.size} {lang('training.roleAssignment.selected')}</Badge>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={lang('training.directAssignment.searchTraining')}
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>

                <div className="flex items-center gap-2 pb-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAllModules}
                    className="h-7 text-xs"
                  >
                    {selectedModuleIds.size === filteredModules.length ? lang('training.directAssignment.deselectAll') : lang('training.directAssignment.selectAll')}
                  </Button>
                </div>

                <ScrollArea className="h-[280px] rounded-md border">
                  <div className="p-2 space-y-1">
                    {filteredModules.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {lang('training.directAssignment.noModulesFound')}
                      </p>
                    ) : (
                      filteredModules.map(module => (
                        <div
                          key={module.id}
                          className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50 ${
                            selectedModuleIds.has(module.id) ? 'bg-primary/10' : ''
                          }`}
                          onClick={() => toggleModule(module.id)}
                        >
                          <Checkbox
                            checked={selectedModuleIds.has(module.id)}
                            onCheckedChange={() => toggleModule(module.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{module.name}</p>
                            <Badge variant="secondary" className="text-xs capitalize mt-0.5">
                              {module.type}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <Separator />

            {/* Due Date Configuration */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">{lang('training.directAssignment.dueIn')}</Label>
              </div>
              <Input
                type="number"
                min={1}
                max={365}
                value={dueDays}
                onChange={(e) => setDueDays(parseInt(e.target.value) || 30)}
                className="w-20 h-8"
              />
              <span className="text-sm text-muted-foreground">
                {lang('training.directAssignment.days')} ({format(addDays(new Date(), dueDays), 'MMM d, yyyy')})
              </span>
            </div>

            {/* Summary */}
            {(selectedUserIds.size > 0 || selectedModuleIds.size > 0) && (
              <div className="bg-muted/50 rounded-md p-3 text-sm">
                <span className="font-medium">
                  {selectedUserIds.size} user{selectedUserIds.size !== 1 ? 's' : ''} × {selectedModuleIds.size} module{selectedModuleIds.size !== 1 ? 's' : ''} = {selectedUserIds.size * selectedModuleIds.size} assignment{selectedUserIds.size * selectedModuleIds.size !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleClose}>
                {lang('training.directAssignment.cancel')}
              </Button>
              <Button
                onClick={handleAssign}
                disabled={createTrainingRecords.isPending || selectedUserIds.size === 0 || selectedModuleIds.size === 0}
              >
                {createTrainingRecords.isPending ? lang('training.directAssignment.assigning') : lang('training.directAssignment.assignTraining')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
