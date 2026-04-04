import React, { useState, useEffect, useMemo } from 'react';
import { Plus, FileText, Video, Users, BookOpen, ExternalLink, MoreVertical, Pencil, Trash2, Clock, RefreshCw, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useTrainingModules, useDeleteTrainingModule, useSeedTrainingModulesFromSOPs } from '@/hooks/useTrainingModules';
import { TrainingModule, TrainingModuleType } from '@/types/training';
import { TrainingModuleForm } from './TrainingModuleForm';
import { GROUP_ORDER } from '@/constants/trainingGroups';

interface Props {
  companyId: string;
  disabled?: boolean;
}

const typeConfig: Record<TrainingModuleType, { icon: React.ElementType; labelKey: string; color: string }> = {
  sop: { icon: FileText, labelKey: 'training.moduleTypes.sop', color: 'bg-blue-500/10 text-blue-500' },
  video: { icon: Video, labelKey: 'training.moduleTypes.video', color: 'bg-purple-500/10 text-purple-500' },
  workshop: { icon: Users, labelKey: 'training.moduleTypes.workshop', color: 'bg-amber-500/10 text-amber-500' },
  course: { icon: BookOpen, labelKey: 'training.moduleTypes.course', color: 'bg-green-500/10 text-green-500' },
  external: { icon: ExternalLink, labelKey: 'training.moduleTypes.external', color: 'bg-gray-500/10 text-gray-500' },
};

const GROUP_NAME_KEYS: Record<string, string> = {
  'Quality Core': 'training.library.groups.qualityCore',
  'Design & Development': 'training.library.groups.designDevelopment',
  'Production & Supply': 'training.library.groups.productionSupply',
  'Post-Market & Vigilance': 'training.library.groups.postMarketVigilance',
  'Risk & Clinical': 'training.library.groups.riskClinical',
  'Regulatory & Compliance': 'training.library.groups.regulatoryCompliance',
  'Facilities & Equipment': 'training.library.groups.facilitiesEquipment',
  'Other': 'training.library.groups.generalOther',
};

const cleanupDialogPortals = () => {
  const portals = document.querySelectorAll('[data-radix-portal]');
  portals.forEach(portal => portal.remove());
  const overlays = document.querySelectorAll('.fixed.inset-0.z-50');
  overlays.forEach(overlay => overlay.remove());
  document.body.style.pointerEvents = '';
  document.body.style.overflow = '';
};

export function TrainingModuleLibrary({ companyId, disabled = false }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const { lang } = useTranslation();

  const { data: modules = [], isLoading } = useTrainingModules(companyId);
  const deleteModule = useDeleteTrainingModule(companyId);
  const seedModules = useSeedTrainingModulesFromSOPs(companyId);

  useEffect(() => {
    return () => { cleanupDialogPortals(); };
  }, []);

  useEffect(() => {
    if (!isFormOpen) {
      const timer = setTimeout(() => { cleanupDialogPortals(); }, 300);
      return () => clearTimeout(timer);
    }
  }, [isFormOpen]);

  // Group modules by group_name
  const groupedModules = useMemo(() => {
    const groups = new Map<string, TrainingModule[]>();
    
    modules.forEach(module => {
      const group = module.group_name || 'Other';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(module);
    });
    
    // Sort groups by GROUP_ORDER
    const sorted = new Map<string, TrainingModule[]>();
    GROUP_ORDER.forEach(groupName => {
      if (groups.has(groupName)) {
        sorted.set(groupName, groups.get(groupName)!);
        groups.delete(groupName);
      }
    });
    // Add remaining groups not in ORDER
    groups.forEach((mods, name) => sorted.set(name, mods));
    
    return sorted;
  }, [modules]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const handleEdit = (module: TrainingModule) => {
    if (disabled) return;
    setEditingModule(module);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (disabled) return;
    if (confirm(lang('training.library.deleteConfirm'))) {
      deleteModule.mutate(id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingModule(null);
    setTimeout(() => { cleanupDialogPortals(); }, 200);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) handleFormClose();
  };
  
  const handleCreateNew = () => {
    setEditingModule(null);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{lang('training.library.title')}</h2>
          <p className="text-muted-foreground">{lang('training.library.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => seedModules.mutate()} 
            disabled={disabled || seedModules.isPending}
          >
            <Download className="w-4 h-4 mr-2" />
            {seedModules.isPending ? lang('training.library.importing') : lang('training.library.importSOPs')}
          </Button>
          <Button onClick={handleCreateNew} disabled={disabled}>
            <Plus className="w-4 h-4 mr-2" />
            {lang('training.library.addModule')}
          </Button>
        </div>
      </div>

      {modules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{lang('training.library.noModules')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {lang('training.library.noModulesDesc')}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => seedModules.mutate()}
                disabled={disabled || seedModules.isPending}
              >
                <Download className="w-4 h-4 mr-2" />
                {seedModules.isPending ? lang('training.library.importing') : lang('training.library.importSOPs')}
              </Button>
              <Button onClick={handleCreateNew} disabled={disabled}>
                <Plus className="w-4 h-4 mr-2" />
                {lang('training.library.createFirstModule')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Array.from(groupedModules.entries()).map(([groupName, groupModules]) => (
            <Collapsible
              key={groupName}
              open={expandedGroups.has(groupName)}
              onOpenChange={() => toggleGroup(groupName)}
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left">
                  {expandedGroups.has(groupName) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-semibold">{GROUP_NAME_KEYS[groupName] ? lang(GROUP_NAME_KEYS[groupName]) : groupName}</span>
                  <Badge variant="secondary" className="ml-auto">{groupModules.length}</Badge>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-3">
                  {groupModules.map((module) => {
                    const config = typeConfig[module.type];
                    const Icon = config.icon;
                    
                    return (
                      <Card key={module.id} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${config.color}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{module.name}</CardTitle>
                                <Badge variant="outline" className="mt-1 text-xs">
                                  v{module.version}
                                </Badge>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(module)} disabled={disabled}>
                                  <Pencil className="w-4 h-4 mr-2" />
                                  {lang('training.library.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(module.id)}
                                  className="text-destructive"
                                  disabled={disabled}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {lang('training.library.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {module.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {module.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary" className={config.color}>
                              {lang(config.labelKey)}
                            </Badge>
                            {module.estimated_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {module.estimated_minutes} {lang('training.library.min')}
                              </span>
                            )}
                            {module.validity_days && (
                              <span className="flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" />
                                {lang('training.library.validity').replace('{{days}}', String(module.validity_days))}
                              </span>
                            )}
                          </div>
                          {!module.is_active && (
                            <Badge variant="outline" className="mt-2 text-muted-foreground">
                              {lang('training.library.inactive')}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}

      {isFormOpen && (
        <Dialog open={isFormOpen} onOpenChange={handleOpenChange}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingModule ? lang('training.library.editModule') : lang('training.library.createModule')}
              </DialogTitle>
            </DialogHeader>
            <TrainingModuleForm
              key={editingModule?.id || 'new'}
              companyId={companyId}
              module={editingModule}
              onSuccess={handleFormClose}
              onCancel={handleFormClose}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
