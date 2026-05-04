import React, { useState, useEffect } from 'react';
import { useTrainingModules } from '@/hooks/useTrainingModules';
import { 
  useRoleTrainingRequirements, 
  useCreateRoleRequirement, 
  useDeleteRoleRequirement 
} from '@/hooks/useRoleTrainingRequirements';
import { useCompanyRolesList } from '@/hooks/useCompanyRolesList';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { useCreateRolesFromDepartments } from '@/hooks/useCreateRolesFromDepartments';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DueType, TrainingModule } from '@/types/training';
import { toast } from 'sonner';
import { BookOpen, Clock, Calendar, Trash2, AlertCircle, UserPlus, Settings, Wand2, Star } from 'lucide-react';
import { isModuleRecommendedForRole, getRecommendedGroupsForRole } from '@/constants/trainingGroups';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToDirectAssignment?: () => void;
}

interface ModuleConfig {
  moduleId: string;
  selected: boolean;
  is_mandatory: boolean;
  due_type: DueType;
  due_days: number;
  annual_due_month: number | null;
  annual_due_day: number | null;
}

export function RoleTrainingAssignment({ companyId, open, onOpenChange, onSwitchToDirectAssignment }: Props) {
  const { lang } = useTranslation();
  const { data: modules, isLoading: modulesLoading } = useTrainingModules(companyId);
  const { data: requirements, isLoading: requirementsLoading } = useRoleTrainingRequirements(companyId);
  const { data: roles, isLoading: rolesLoading, refetch: refetchRoles } = useCompanyRolesList(companyId);
  const { users } = useCompanyUsers(companyId);
  const createRolesFromDepartments = useCreateRolesFromDepartments(companyId);
  const createRequirement = useCreateRoleRequirement(companyId);
  const deleteRequirement = useDeleteRoleRequirement(companyId);

  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [moduleConfigs, setModuleConfigs] = useState<Map<string, ModuleConfig>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  // Get unique departments from users
  const uniqueDepartments = React.useMemo(() => {
    if (!users) return [];
    const deps = new Set<string>();
    users.forEach(user => {
      if (user.department && user.department.trim()) {
        deps.add(user.department.trim());
      }
    });
    return Array.from(deps);
  }, [users]);

  // Initialize module configs when role changes
  useEffect(() => {
    if (!modules || !requirements || !selectedRoleId) return;

    const roleRequirements = requirements.filter(r => r.role_id === selectedRoleId);
    const newConfigs = new Map<string, ModuleConfig>();
    const selectedRole = roles?.find(r => r.id === selectedRoleId);
    const hasExistingReqs = roleRequirements.length > 0;

    modules.forEach(module => {
      const existingReq = roleRequirements.find(r => r.training_module_id === module.id);
      const recommended = !hasExistingReqs && selectedRole
        ? isModuleRecommendedForRole(module.name, selectedRole.role_name)
        : false;
      
      newConfigs.set(module.id, {
        moduleId: module.id,
        selected: !!existingReq || recommended,
        is_mandatory: existingReq?.is_mandatory ?? true,
        due_type: (existingReq?.due_type as DueType) ?? 'days_after_assignment',
        due_days: existingReq?.due_days ?? 30,
        annual_due_month: existingReq?.annual_due_month ?? null,
        annual_due_day: existingReq?.annual_due_day ?? null,
      });
    });

    setModuleConfigs(newConfigs);
  }, [modules, requirements, selectedRoleId, roles]);

  const updateModuleConfig = (moduleId: string, updates: Partial<ModuleConfig>) => {
    setModuleConfigs(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(moduleId);
      if (existing) {
        newMap.set(moduleId, { ...existing, ...updates });
      }
      return newMap;
    });
  };

  const handleSave = async () => {
    if (!selectedRoleId) {
      toast.error(lang('training.roleAssignment.toast.selectRole'));
      return;
    }

    setIsSaving(true);

    try {
      const roleRequirements = requirements?.filter(r => r.role_id === selectedRoleId) || [];
      
      // Process each module config
      for (const [moduleId, config] of moduleConfigs) {
        const existingReq = roleRequirements.find(r => r.training_module_id === moduleId);
        
        if (config.selected && !existingReq) {
          // Create new requirement
          await createRequirement.mutateAsync({
            role_id: selectedRoleId,
            training_module_id: moduleId,
            is_mandatory: config.is_mandatory,
            due_type: config.due_type,
            due_days: config.due_days,
            annual_due_month: config.due_type === 'annual' ? config.annual_due_month : null,
            annual_due_day: config.due_type === 'annual' ? config.annual_due_day : null,
          });
        } else if (!config.selected && existingReq) {
          // Delete existing requirement
          await deleteRequirement.mutateAsync(existingReq.id);
        }
        // Note: Updates to existing requirements would need useUpdateRoleRequirement
      }

      toast.success(lang('training.roleAssignment.toast.saved'));
      onOpenChange(false);
    } catch {
      toast.error(lang('training.roleAssignment.toast.failed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchToDirectAssignment = () => {
    onOpenChange(false);
    onSwitchToDirectAssignment?.();
  };

  const isLoading = modulesLoading || requirementsLoading || rolesLoading;
  const activeModules = modules?.filter(m => m.is_active) || [];
  const selectedCount = Array.from(moduleConfigs.values()).filter(c => c.selected).length;
  const hasNoRoles = !rolesLoading && (!roles || roles.length === 0);

  const handleCreateRolesFromDepartments = async () => {
    if (uniqueDepartments.length === 0) {
      toast.error(lang('training.roleAssignment.toast.noDepartments'));
      return;
    }
    await createRolesFromDepartments.mutateAsync(uniqueDepartments);
    refetchRoles();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{lang('training.roleAssignment.title')}</DialogTitle>
          <DialogDescription>
            {lang('training.roleAssignment.description')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : hasNoRoles ? (
          /* Empty state when no roles exist */
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{lang('training.roleAssignment.noRoles')}</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>
                  {lang('training.roleAssignment.noRolesDesc')}
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                  <li>{lang('training.roleAssignment.noRolesOption1')}</li>
                  <li>{lang('training.roleAssignment.noRolesOption2')}</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            {/* Show option to create roles from departments if departments exist */}
            {uniqueDepartments.length > 0 && (
              <Alert className="border-primary/50 bg-primary/5">
                <Wand2 className="h-4 w-4 text-primary" />
                <AlertTitle>{lang('training.roleAssignment.quickSetup')}</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>
                    {uniqueDepartments.length > 1
                      ? lang('training.roleAssignment.foundDepartmentsPlural').replace('{{count}}', String(uniqueDepartments.length))
                      : lang('training.roleAssignment.foundDepartments').replace('{{count}}', String(uniqueDepartments.length))}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {uniqueDepartments.map(dept => (
                      <Badge key={dept} variant="secondary">{dept}</Badge>
                    ))}
                  </div>
                  <Button 
                    onClick={handleCreateRolesFromDepartments}
                    disabled={createRolesFromDepartments.isPending}
                    className="mt-2"
                    size="sm"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    {createRolesFromDepartments.isPending
                      ? lang('training.roleAssignment.creatingRoles')
                      : lang('training.roleAssignment.createFromDepartments')
                    }
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {lang('training.roleAssignment.cancel')}
              </Button>
              {onSwitchToDirectAssignment && (
                <Button onClick={handleSwitchToDirectAssignment}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {lang('training.roleAssignment.assignToUsers')}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>{lang('training.roleAssignment.selectRole')}</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder={lang('training.roleAssignment.chooseRole')} />
                </SelectTrigger>
                <SelectContent>
                {roles?.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {lang('training.roleAssignment.roleHint')}
              </p>
            </div>

            {selectedRoleId && (
              <>
                <Separator />
                
                {/* Module List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{lang('training.roleAssignment.trainingModules')}</Label>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const selectedRole = roles?.find(r => r.id === selectedRoleId);
                        const recommended = selectedRole ? getRecommendedGroupsForRole(selectedRole.role_name) : [];
                        if (recommended.length > 0) {
                          return (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (!selectedRole) return;
                                setModuleConfigs(prev => {
                                  const newMap = new Map(prev);
                                  activeModules.forEach(module => {
                                    if (isModuleRecommendedForRole(module.name, selectedRole.role_name)) {
                                      const existing = newMap.get(module.id);
                                      if (existing) {
                                        newMap.set(module.id, { ...existing, selected: true });
                                      }
                                    }
                                  });
                                  return newMap;
                                });
                              }}
                            >
                              <Star className="h-3 w-3 mr-1" />
                              {lang('training.roleAssignment.selectRecommended')}
                            </Button>
                          );
                        }
                        return null;
                      })()}
                      <Badge variant="outline">
                        {selectedCount} {lang('training.roleAssignment.selected')}
                      </Badge>
                    </div>
                  </div>
                  
                  <ScrollArea className="h-[400px] rounded-md border p-4">
                    <div className="space-y-4">
                      {activeModules.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {lang('training.roleAssignment.noActiveModules')}
                        </p>
                      ) : (
                        activeModules.map(module => {
                          const config = moduleConfigs.get(module.id);
                          if (!config) return null;
                          const selectedRole = roles?.find(r => r.id === selectedRoleId);
                          const isRecommended = selectedRole ? isModuleRecommendedForRole(module.name, selectedRole.role_name) : false;

                          return (
                            <div 
                              key={module.id}
                              className={`rounded-lg border p-4 space-y-3 ${
                                config.selected ? 'border-primary bg-primary/5' : ''
                              }`}
                            >
                              {/* Module Header */}
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={config.selected}
                                  onCheckedChange={(checked) => 
                                    updateModuleConfig(module.id, { selected: !!checked })
                                  }
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{module.name}</span>
                                    <Badge variant="secondary" className="text-xs capitalize">
                                      {module.type}
                                    </Badge>
                                    {isRecommended && (
                                      <Badge className="text-xs bg-amber-500/10 text-amber-600 border-amber-300">
                                        <Star className="h-3 w-3 mr-0.5" />
                                        {lang('training.roleAssignment.recommended')}
                                      </Badge>
                                    )}
                                  </div>
                                  {module.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {module.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Configuration Options (shown when selected) */}
                              {config.selected && (
                                <div className="pl-7 space-y-3 pt-2 border-t">
                                  {/* Mandatory Toggle */}
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={config.is_mandatory}
                                      onCheckedChange={(checked) =>
                                        updateModuleConfig(module.id, { is_mandatory: !!checked })
                                      }
                                    />
                                    <Label className="text-sm font-normal">
                                      {lang('training.roleAssignment.mandatory')}
                                    </Label>
                                  </div>

                                  {/* Due Type */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                      <Label className="text-xs">{lang('training.roleAssignment.dueType')}</Label>
                                      <Select
                                        value={config.due_type}
                                        onValueChange={(value: DueType) =>
                                          updateModuleConfig(module.id, { due_type: value })
                                        }
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="days_after_assignment">{lang('training.roleAssignment.dueTypeOptions.daysAfterAssignment')}</SelectItem>
                                          <SelectItem value="days_after_hire">{lang('training.roleAssignment.dueTypeOptions.daysAfterHire')}</SelectItem>
                                          <SelectItem value="annual">{lang('training.roleAssignment.dueTypeOptions.annual')}</SelectItem>
                                          <SelectItem value="one_time">{lang('training.roleAssignment.dueTypeOptions.oneTime')}</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {config.due_type !== 'annual' && (
                                      <div className="space-y-1.5">
                                        <Label className="text-xs">{lang('training.roleAssignment.days')}</Label>
                                        <Input
                                          type="number"
                                          className="h-8"
                                          value={config.due_days}
                                          onChange={(e) =>
                                            updateModuleConfig(module.id, { 
                                              due_days: parseInt(e.target.value) || 30 
                                            })
                                          }
                                        />
                                      </div>
                                    )}

                                    {config.due_type === 'annual' && (
                                      <>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs">{lang('training.roleAssignment.month')}</Label>
                                          <Select
                                            value={String(config.annual_due_month || 1)}
                                            onValueChange={(value) =>
                                              updateModuleConfig(module.id, { 
                                                annual_due_month: parseInt(value) 
                                              })
                                            }
                                          >
                                            <SelectTrigger className="h-8">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {Array.from({ length: 12 }, (_, i) => (
                                                <SelectItem key={i + 1} value={String(i + 1)}>
                                                  {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                          <Label className="text-xs">{lang('training.roleAssignment.day')}</Label>
                                          <Input
                                            type="number"
                                            className="h-8"
                                            min={1}
                                            max={31}
                                            value={config.annual_due_day || 1}
                                            onChange={(e) =>
                                              updateModuleConfig(module.id, { 
                                                annual_due_day: parseInt(e.target.value) || 1 
                                              })
                                            }
                                          />
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    {lang('training.roleAssignment.cancel')}
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? lang('training.roleAssignment.saving') : lang('training.roleAssignment.saveRequirements')}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}