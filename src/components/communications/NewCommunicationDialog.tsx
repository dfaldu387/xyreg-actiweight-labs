
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { X, Users, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from '@/hooks/useTranslation';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/integrations/supabase/client';
import { useCommunicationThreads } from '@/hooks/useCommunicationThreads';
import { THREAD_TEMPLATES, getThreadTemplate } from '@/utils/communicationTemplateUtils';

interface Participant {
  id: string;
  name: string;
  email: string;
  organization: string;
}

interface RelatedEntity {
  value: string;
  label: string;
  type: string;
}

interface NewCommunicationDialogProps {
  children: React.ReactNode;
  disabled?: boolean;
  companyId?: string;
}

// Searchable combobox for related entities
function EntityCombobox({ entities, loading, value, onSelect, placeholder }: {
  entities: RelatedEntity[];
  loading: boolean;
  value: string;
  onSelect: (val: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = entities.find(e => e.value === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[9999]" align="start">
        <Command>
          <CommandInput placeholder="Search by name..." />
          <CommandList>
            <CommandEmpty>{loading ? 'Loading...' : 'No results found.'}</CommandEmpty>
            <CommandGroup>
              <CommandItem value="none" onSelect={() => { onSelect(''); setOpen(false); }}>
                <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                None
              </CommandItem>
              {entities.map((entity) => (
                <CommandItem key={entity.value} value={entity.label} onSelect={() => { onSelect(entity.value); setOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", value === entity.value ? "opacity-100" : "opacity-0")} />
                  {entity.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function NewCommunicationDialog({ children, disabled = false, companyId: explicitCompanyId }: NewCommunicationDialogProps) {
  const { lang } = useTranslation();
  const routeCompanyId = useCompanyId();
  const companyId = explicitCompanyId || routeCompanyId;
  const [open, setOpen] = useState(false);
  const { createThread } = useCommunicationThreads({ companyId: companyId || undefined });

  const handleOpenChange = (newOpen: boolean) => {
    if (disabled) return;
    setOpen(newOpen);
  };
  const [title, setTitle] = useState('');
  const [threadType, setThreadType] = useState('general');
  const [description, setDescription] = useState('');
  const [relatedEntity, setRelatedEntity] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [availableParticipants, setAvailableParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [relatedEntities, setRelatedEntities] = useState<RelatedEntity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);

  // Fetch real users from the company
  useEffect(() => {
    if (!companyId || !open) return;

    const fetchUsers = async () => {
      setLoadingParticipants(true);
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

        const participants: Participant[] = (data || []).map((item: any) => {
          const profile = item.user_profiles;
          const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
          return {
            id: profile.id,
            name: fullName || profile.email,
            email: profile.email,
            organization: item.access_level,
          };
        });

        setAvailableParticipants(participants);
      } catch (err) {
        console.error('Error fetching participants:', err);
      } finally {
        setLoadingParticipants(false);
      }
    };

    fetchUsers();
  }, [companyId, open]);

  // Fetch real related entities (products + documents)
  useEffect(() => {
    if (!companyId || !open) return;

    const fetchEntities = async () => {
      setLoadingEntities(true);
      try {
        const [productsRes, documentsRes] = await Promise.all([
          supabase
            .from('products')
            .select('id, name')
            .eq('company_id', companyId)
            .order('name')
            .limit(50),
          supabase
            .from('documents')
            .select('id, name, products!inner(company_id)')
            .eq('products.company_id', companyId)
            .order('name')
            .limit(50),
        ]);

        const entities: RelatedEntity[] = [];

        (productsRes.data || []).forEach((p: any) => {
          entities.push({ value: `product-${p.id}`, label: `Product: ${p.name}`, type: 'product' });
        });

        (documentsRes.data || []).forEach((d: any) => {
          entities.push({ value: `document-${d.id}`, label: `Document: ${d.name}`, type: 'document' });
        });

        setRelatedEntities(entities);
      } catch (err) {
        console.error('Error fetching related entities:', err);
      } finally {
        setLoadingEntities(false);
      }
    };

    fetchEntities();
  }, [companyId, open]);

  const handleAddParticipant = (participantId: string) => {
    if (!selectedParticipants.includes(participantId)) {
      setSelectedParticipants([...selectedParticipants, participantId]);
    }
  };

  const handleRemoveParticipant = (participantId: string) => {
    setSelectedParticipants(selectedParticipants.filter(id => id !== participantId));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || selectedParticipants.length === 0) {
      toast.error(lang('communications.newDialog.toast.validationError'));
      return;
    }

    if (!companyId) {
      toast.error('No company context');
      return;
    }

    setIsSubmitting(true);

    try {
      // Resolve related entity
      let productId: string | undefined;
      let relatedEntityName = '';
      let relatedEntityType = '';
      let relatedEntityId = '';
      if (relatedEntity && relatedEntity !== 'none') {
        const entity = relatedEntities.find(e => e.value === relatedEntity);
        if (entity) {
          relatedEntityName = entity.label;
          relatedEntityType = entity.type;
          relatedEntityId = relatedEntity.replace(/^(product|document)-/, '');
          if (entity.type === 'product') {
            productId = relatedEntityId;
          }
        }
      }

      await createThread.mutateAsync({
        title,
        companyId,
        participantUserIds: selectedParticipants,
        initialMessage: description || undefined,
        threadType,
        relatedEntityId: relatedEntityId || undefined,
        relatedEntityName: relatedEntityName || undefined,
        relatedEntityType: relatedEntityType || undefined,
        productId,
      });

      toast.success(lang('communications.newDialog.toast.created'));

      // Reset form and close dialog
      setTitle('');
      setThreadType('general');
      setDescription('');
      setRelatedEntity('');
      setSelectedParticipants([]);
      setOpen(false);
    } catch (err: any) {
      console.error('Error creating communication:', err);
      const detail = err?.message || err?.code || 'Unknown error';
      if (typeof detail === 'string' && detail.includes('row-level security policy for table "communication_threads"')) {
        toast.error('Permission denied while creating thread (database policy). Please retry; if it persists, your account may not have create access for this company.');
      } else {
        toast.error(`Failed to create communication: ${detail}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getParticipantById = (id: string) => {
    return availableParticipants.find(p => p.id === id);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild disabled={disabled}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lang('communications.newDialog.title')}</DialogTitle>
          <DialogDescription>
            {lang('communications.newDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title">{lang('communications.newDialog.form.title')}</Label>
            <Input
              id="title"
              placeholder={lang('communications.newDialog.form.titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Thread Type */}
          <div className="space-y-2">
            <Label htmlFor="thread-type">Thread Type</Label>
            <Select value={threadType} onValueChange={(val) => {
              setThreadType(val);
              const template = getThreadTemplate(val);
              if (template?.messageTemplate) {
                setDescription(template.messageTemplate);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select thread type" />
              </SelectTrigger>
              <SelectContent>
                {THREAD_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{t.label}</span>
                      <span className="text-xs text-muted-foreground">{t.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Related Entity (Optional) - Searchable */}
          <div className="space-y-2">
            <Label htmlFor="related-entity">
              {lang('communications.newDialog.form.relatedEntity')} <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <EntityCombobox
              entities={relatedEntities}
              loading={loadingEntities}
              value={relatedEntity}
              onSelect={setRelatedEntity}
              placeholder={lang('communications.newDialog.form.relatedEntityPlaceholder')}
            />
          </div>

          {/* Participants */}
          <div className="space-y-3">
            <Label>{lang('communications.newDialog.form.participants')}</Label>

            {selectedParticipants.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">{lang('communications.newDialog.form.selectedParticipants')}</div>
                <div className="flex flex-wrap gap-2">
                  {selectedParticipants.map((participantId) => {
                    const participant = getParticipantById(participantId);
                    if (!participant) return null;

                    return (
                      <Badge key={participantId} variant="secondary" className="gap-1">
                        <Users className="h-3 w-3" />
                        {participant.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipant(participantId)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            <Select onValueChange={handleAddParticipant} value="">
              <SelectTrigger>
                <SelectValue placeholder={lang('communications.newDialog.form.participantsPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {availableParticipants
                  .filter(p => !selectedParticipants.includes(p.id))
                  .map((participant) => (
                    <SelectItem key={participant.id} value={participant.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{participant.name}</span>
                        <span className="text-xs text-muted-foreground">{participant.organization}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Initial Message */}
          <div className="space-y-2">
            <Label htmlFor="description">{lang('communications.newDialog.form.initialMessage')}</Label>
            <Textarea
              id="description"
              placeholder={lang('communications.newDialog.form.initialMessagePlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {lang('communications.newDialog.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? lang('common.loading') : lang('communications.newDialog.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
