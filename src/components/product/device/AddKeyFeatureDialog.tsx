import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Sparkles, Check, ChevronsUpDown, Tag } from 'lucide-react';
import { KeyFeature } from '@/utils/keyFeaturesNormalizer';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AIFeatureUserNeedSuggestions } from './AIFeatureUserNeedSuggestions';
import { AIFeatureComponentSuggestions } from './AIFeatureComponentSuggestions';
import {
  useFeatureDetailsSuggestions,
  AIFieldTrigger,
  AIDescriptionSuggestion,
  AITagSuggestion,
  AIClinicalBenefitsSuggestion,
} from './AIFeatureDetailsSuggestions';

interface UserNeedOption {
  id: string;
  user_need_id: string;
  description: string;
}

interface AvailableComponent {
  name: string;
  description: string;
}

interface AddKeyFeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (feature: KeyFeature) => void;
  clinicalBenefits?: string[];
  onAddClinicalBenefit?: (benefit: string) => void;
  userNeeds?: UserNeedOption[];
  editingFeature?: KeyFeature | null;
  productId?: string;
  companyId?: string;
  productName?: string;
  availableComponents?: AvailableComponent[];
}

export function AddKeyFeatureDialog({
  open,
  onOpenChange,
  onSave,
  clinicalBenefits = [],
  onAddClinicalBenefit,
  userNeeds = [],
  editingFeature,
  productId,
  companyId,
  productName,
  availableComponents = [],
}: AddKeyFeatureDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [tagOpen, setTagOpen] = useState(false);
  const [isNovel, setIsNovel] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [selectedUserNeedIds, setSelectedUserNeedIds] = useState<string[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [localAvailableComponents, setLocalAvailableComponents] = useState(availableComponents);
  const [newBenefitInput, setNewBenefitInput] = useState('');
  const [showBenefitInput, setShowBenefitInput] = useState(false);
  const [showDescSuggestion, setShowDescSuggestion] = useState(false);
  const [showTagSuggestion, setShowTagSuggestion] = useState(false);
  const [showBenefitSuggestion, setShowBenefitSuggestion] = useState(false);

  const detailsAI = useFeatureDetailsSuggestions(name, productName);

  // Sync local available components with prop
  useEffect(() => {
    setLocalAvailableComponents(availableComponents);
  }, [availableComponents]);

  const PRESET_TAGS = ['Safety', 'Connectivity', 'Novel', 'Performance', 'Usability', 'Monitoring', 'Clinical', 'Compliance'];

  // Reset form when dialog opens or editingFeature changes
  useEffect(() => {
    if (open) {
      if (editingFeature) {
        setName(editingFeature.name);
        setDescription(editingFeature.description || '');
        setTag(editingFeature.tag || '');
        setIsNovel(editingFeature.isNovel);
        setExplanation(editingFeature.explanation || '');
        setSelectedBenefits(editingFeature.linkedClinicalBenefits || []);
        setSelectedUserNeedIds(editingFeature.linkedUserNeedIds || []);
        setSelectedComponents(editingFeature.linkedComponentNames || []);
      } else {
        setName('');
        setDescription('');
        setTag('');
        setIsNovel(false);
        setExplanation('');
        setSelectedBenefits([]);
        setSelectedUserNeedIds([]);
        setSelectedComponents([]);
      }
    }
  }, [open, editingFeature]);

  const toggleBenefit = (benefit: string) => {
    setSelectedBenefits(prev =>
      prev.includes(benefit) ? prev.filter(b => b !== benefit) : [...prev, benefit]
    );
  };

  const toggleUserNeed = (userNeedId: string) => {
    setSelectedUserNeedIds(prev =>
      prev.includes(userNeedId) ? prev.filter(id => id !== userNeedId) : [...prev, userNeedId]
    );
  };

  const toggleComponent = (componentName: string) => {
    setSelectedComponents(prev =>
      prev.includes(componentName) ? prev.filter(n => n !== componentName) : [...prev, componentName]
    );
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      isNovel,
      explanation: isNovel ? explanation : '',
      description,
      tag: tag || undefined,
      linkedClinicalBenefits: selectedBenefits,
      linkedUserNeedIds: selectedUserNeedIds,
      linkedComponentNames: selectedComponents,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingFeature ? 'Edit Key Feature' : 'Add Key Feature'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Feature Name */}
          <div>
            <Label htmlFor="feature-name">Feature Name *</Label>
            <Input
              id="feature-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Continuous Glucose Monitoring"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">
                Description
                <span className="ml-1 text-muted-foreground text-xs">(Annex II 1.1.f)</span>
              </Label>
              <AIFieldTrigger
                isLoading={detailsAI.isLoading && !detailsAI.result}
                disabled={!name.trim()}
                onClick={async () => {
                  const res = detailsAI.result || await detailsAI.generate();
                  if (res) setShowDescSuggestion(true);
                }}
              />
            </div>
            <textarea
              className="w-full min-h-[60px] p-2 border rounded-md resize-y text-sm bg-background"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this feature do?"
            />
            {showDescSuggestion && detailsAI.result?.description && (
              <AIDescriptionSuggestion
                suggestion={detailsAI.result.description}
                onApply={(d) => setDescription(d)}
                onDismiss={() => setShowDescSuggestion(false)}
              />
            )}
          </div>

          {/* Tag */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                Tag
              </Label>
              <AIFieldTrigger
                isLoading={detailsAI.isLoading && !detailsAI.result}
                disabled={!name.trim()}
                onClick={async () => {
                  const res = detailsAI.result || await detailsAI.generate();
                  if (res) setShowTagSuggestion(true);
                }}
              />
            </div>
            {showTagSuggestion && detailsAI.result?.tag && (
              <AITagSuggestion
                suggestion={detailsAI.result.tag}
                onApply={(t) => setTag(t)}
                onDismiss={() => setShowTagSuggestion(false)}
              />
            )}
            <Popover open={tagOpen} onOpenChange={setTagOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={tagOpen}
                  className="w-full justify-between mt-1"
                >
                  {tag || 'Select a tag...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 z-[9999]" align="start">
                <Command>
                  <CommandInput placeholder="Search or type custom tag..." />
                  <CommandList className="max-h-[200px]">
                    <CommandEmpty>
                      <button
                        type="button"
                        className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded"
                        onClick={() => {
                          const input = document.querySelector<HTMLInputElement>('[cmdk-input]');
                          if (input?.value) {
                            setTag(input.value);
                            setTagOpen(false);
                          }
                        }}
                      >
                        Use custom tag
                      </button>
                    </CommandEmpty>
                    <CommandGroup>
                      {tag && !PRESET_TAGS.includes(tag) && (
                        <CommandItem
                          value={tag}
                          onSelect={() => { setTag(tag); setTagOpen(false); }}
                        >
                          <Check className={cn('mr-2 h-4 w-4 opacity-100')} />
                          {tag}
                        </CommandItem>
                      )}
                      {PRESET_TAGS.map(t => (
                        <CommandItem
                          key={t}
                          value={t}
                          onSelect={() => { setTag(t === tag ? '' : t); setTagOpen(false); }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', tag === t ? 'opacity-100' : 'opacity-0')} />
                          {t}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Novel Toggle */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Switch checked={isNovel} onCheckedChange={setIsNovel} />
              <Label className={cn("text-sm flex items-center gap-1", isNovel && "text-primary font-medium")}>
                <Sparkles className="h-3.5 w-3.5" />
                Novel Feature
              </Label>
            </div>
            {isNovel && (
              <textarea
                className="w-full min-h-[50px] p-2 border rounded-md resize-y text-sm bg-background"
                value={explanation}
                onChange={e => setExplanation(e.target.value)}
                placeholder="Explain what makes this feature novel..."
              />
            )}
          </div>

          {/* Clinical Benefits — linked */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">
                Clinical Benefits
                <span className="ml-1 text-muted-foreground text-xs">(Annex II 1.1.c)</span>
              </Label>
              <div className="flex items-center gap-1">
                <AIFieldTrigger
                  isLoading={detailsAI.isLoading && !detailsAI.result}
                  disabled={!name.trim()}
                  onClick={async () => {
                    const res = detailsAI.result || await detailsAI.generate();
                    if (res) setShowBenefitSuggestion(true);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setShowBenefitInput(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            </div>
            {showBenefitInput && (
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={newBenefitInput}
                  onChange={e => setNewBenefitInput(e.target.value)}
                  placeholder="e.g., Improved Patient Outcomes"
                  className="text-sm h-8"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newBenefitInput.trim()) {
                      e.preventDefault();
                      onAddClinicalBenefit?.(newBenefitInput.trim());
                      setSelectedBenefits(prev => [...prev, newBenefitInput.trim()]);
                      setNewBenefitInput('');
                      setShowBenefitInput(false);
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="h-8"
                  disabled={!newBenefitInput.trim()}
                  onClick={() => {
                    onAddClinicalBenefit?.(newBenefitInput.trim());
                    setSelectedBenefits(prev => [...prev, newBenefitInput.trim()]);
                    setNewBenefitInput('');
                    setShowBenefitInput(false);
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8" onClick={() => { setShowBenefitInput(false); setNewBenefitInput(''); }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            {clinicalBenefits.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {clinicalBenefits.map(benefit => (
                  <Badge
                    key={benefit}
                    variant={selectedBenefits.includes(benefit) ? 'default' : 'outline'}
                    className="cursor-pointer select-none"
                    onClick={() => toggleBenefit(benefit)}
                  >
                    {benefit}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                No clinical benefits defined yet. Click + Add above.
              </p>
            )}
            {showBenefitSuggestion && detailsAI.result?.clinicalBenefits?.length > 0 && (
              <AIClinicalBenefitsSuggestion
                suggestions={detailsAI.result.clinicalBenefits}
                existingBenefits={clinicalBenefits}
                selectedBenefits={selectedBenefits}
                onToggleBenefit={toggleBenefit}
                onAddClinicalBenefit={onAddClinicalBenefit}
                onDismiss={() => setShowBenefitSuggestion(false)}
              />
            )}
          </div>

          {/* Linked User Needs — V-model traceability */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">
                Linked User Needs
                <span className="ml-1 text-muted-foreground text-xs">(ISO 13485 §7.3.3)</span>
              </Label>
            </div>
            {productId && companyId && (
              <AIFeatureUserNeedSuggestions
                featureName={name}
                featureDescription={description}
                productId={productId}
                companyId={companyId}
                productName={productName}
                existingUserNeeds={userNeeds}
                selectedIds={selectedUserNeedIds}
                onSelect={toggleUserNeed}
                onUserNeedCreated={(newNeed) => {
                  userNeeds.push(newNeed);
                }}
              />
            )}
            {userNeeds.length > 0 ? (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between mt-1.5"
                    >
                      {selectedUserNeedIds.length === 0
                        ? 'Select user needs...'
                        : `${selectedUserNeedIds.length} user need${selectedUserNeedIds.length !== 1 ? 's' : ''} linked`}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 z-[9999]" align="start">
                    <Command>
                      <CommandInput placeholder="Search user needs..." />
                      <CommandList className="max-h-[200px]">
                        <CommandEmpty>No user needs found.</CommandEmpty>
                        <CommandGroup>
                          {userNeeds.map(un => (
                            <CommandItem
                              key={un.id}
                              value={`${un.user_need_id} ${un.description}`}
                              onSelect={() => toggleUserNeed(un.id)}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedUserNeedIds.includes(un.id) ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <span className="font-medium mr-1.5">{un.user_need_id}:</span>
                              <span className="truncate text-muted-foreground">
                                {un.description?.substring(0, 60)}{un.description && un.description.length > 60 ? '…' : ''}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedUserNeedIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedUserNeedIds.map(id => {
                      const un = userNeeds.find(u => u.id === id);
                      if (!un) return null;
                      return (
                        <Badge key={id} variant="secondary" className="flex items-center gap-1">
                          <span className="text-xs">{un.user_need_id}</span>
                          <button
                            type="button"
                            onClick={() => toggleUserNeed(id)}
                            className="ml-0.5 hover:bg-muted rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                No user needs defined yet. Add them in Design &amp; Risk Controls → User Needs.
              </p>
            )}
          </div>

          {/* Linked Components — Design Traceability */}
          <div>
            <Label className="text-sm">
              Linked Components
              <span className="ml-1 text-muted-foreground text-xs">(ISO 13485 §7.3)</span>
            </Label>
            {localAvailableComponents.length > 0 && (
              <AIFeatureComponentSuggestions
                featureName={name}
                featureDescription={description}
                productName={productName}
                productId={productId}
                companyId={companyId}
                availableComponents={localAvailableComponents}
                selectedComponents={selectedComponents}
                onToggle={toggleComponent}
                onComponentCreated={(comp) => {
                  setLocalAvailableComponents(prev => [...prev, comp]);
                }}
              />
            )}
            {localAvailableComponents.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {localAvailableComponents.map(comp => (
                  <Badge
                    key={comp.name}
                    variant={selectedComponents.includes(comp.name) ? 'default' : 'outline'}
                    className="cursor-pointer select-none"
                    onClick={() => toggleComponent(comp.name)}
                  >
                    {comp.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                No components defined yet. Add components in the Device Components section below.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              {editingFeature ? 'Save Changes' : 'Add Feature'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
