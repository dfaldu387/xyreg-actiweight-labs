import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { MultiSelect } from "@/components/settings/document-control/MultiSelect";
import { UserNeedsService } from "@/services/userNeedsService";
import { hazardsService } from "@/services/hazardsService";
import { toast as sonnerToast } from "sonner";
import { AIRequirementUserNeedSuggestions } from "./AIRequirementUserNeedSuggestions";
import { AIRequirementHazardSuggestions } from "./AIRequirementHazardSuggestions";
import type { RequirementSpecification, UpdateRequirementSpecificationData } from "./types";
import type { UserNeed } from "../user-needs/types";
import type { Hazard } from "../risk-management/types";
import { REQUIREMENT_CATEGORIES } from "./types";
import { Plus, Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  description: z.string().min(1, "Requirement description is required"),
  traces_to: z.array(z.string()),
  linked_risks: z.array(z.string()),
  verification_status: z.enum(['Not Started', 'In Progress', 'Passed', 'Failed']),
  category: z.string().min(1, "Category is required"),
});

interface EditRequirementFormProps {
  requirement: RequirementSpecification;
  onSave: (data: UpdateRequirementSpecificationData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  productId: string;
  companyId: string;
  productName?: string;
}

export function EditRequirementForm({
  requirement,
  onSave,
  onCancel,
  isLoading,
  productId,
  companyId,
  productName,
}: EditRequirementFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [userNeeds, setUserNeeds] = useState<UserNeed[]>([]);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [loadingUserNeeds, setLoadingUserNeeds] = useState(true);
  const [loadingHazards, setLoadingHazards] = useState(true);
  const [isCreatingDraftHazard, setIsCreatingDraftHazard] = useState(false);
  const [userNeedPopoverOpen, setUserNeedPopoverOpen] = useState(false);

  // Parse existing traces_to field
  const existingTracesTo = requirement.traces_to
    ? requirement.traces_to.split(',').map(id => id.trim()).filter(Boolean)
    : [];

  // Parse existing linked_risks field
  const existingLinkedRisks = requirement.linked_risks
    ? requirement.linked_risks.split(',').map(id => id.trim()).filter(Boolean)
    : [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: requirement.description,
      traces_to: existingTracesTo,
      linked_risks: existingLinkedRisks,
      verification_status: requirement.verification_status,
      category: requirement.category || "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingUserNeeds(true);
        setLoadingHazards(true);
        const [needs, haz] = await Promise.all([
          UserNeedsService.getUserNeeds(productId),
          hazardsService.getHazardsByProduct(productId),
        ]);
        setUserNeeds(needs);
        setHazards(haz);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoadingUserNeeds(false);
        setLoadingHazards(false);
      }
    };

    fetchData();
  }, [productId]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onSave({
        description: values.description,
        traces_to: values.traces_to.join(', '),
        linked_risks: values.linked_risks.join(', '),
        verification_status: values.verification_status,
        category: values.category,
      });
    } catch (error) {
      console.error('Failed to update requirement specification:', error);
    }
  };

  const currentTracesTo = form.watch('traces_to');
  const currentDescription = form.watch('description');

  const toggleUserNeed = (userNeedId: string) => {
    const current = form.getValues('traces_to');
    if (current.includes(userNeedId)) {
      form.setValue('traces_to', current.filter(id => id !== userNeedId));
    } else {
      form.setValue('traces_to', [...current, userNeedId]);
    }
  };

  const removeUserNeed = (userNeedId: string) => {
    const current = form.getValues('traces_to');
    form.setValue('traces_to', current.filter(id => id !== userNeedId));
  };

  const handleAIUserNeedCreated = (newNeed: { id: string; user_need_id: string; description: string }) => {
    setUserNeeds(prev => [...prev, {
      id: newNeed.id,
      user_need_id: newNeed.user_need_id,
      description: newNeed.description,
      product_id: productId,
      company_id: companyId,
      linked_requirements: '',
      status: 'Not Met' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
    }]);
  };

  const handleAISelect = (userNeedId: string) => {
    const current = form.getValues('traces_to');
    if (!current.includes(userNeedId)) {
      form.setValue('traces_to', [...current, userNeedId]);
    }
  };

  // Prepare hazard options for MultiSelect
  const hazardOptions = hazards.map(hazard => ({
    value: hazard.hazard_id,
    label: `${hazard.hazard_id}: ${hazard.description.substring(0, 60)}${hazard.description.length > 60 ? '...' : ''}`
  }));

  const handleCreateNewHazard = async () => {
    setIsCreatingDraftHazard(true);
    try {
      await hazardsService.createHazard(productId, requirement.company_id || '', {
        description: `Draft - linked from ${requirement.requirement_id}`,
        linked_requirements: requirement.requirement_id,
      }, 'SYS');
      await queryClient.invalidateQueries({ queryKey: ["hazards", productId] });
      sonnerToast.success(`Draft hazard created and linked to ${requirement.requirement_id}`);
      const productPath = location.pathname.split('/design-risk-controls')[0];
      navigate(`${productPath}/design-risk-controls?tab=risk-management&returnTo=system-requirements`);
    } catch (e) {
      console.error('Failed to create draft hazard:', e);
      sonnerToast.error('Failed to create draft hazard');
    } finally {
      setIsCreatingDraftHazard(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requirement Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the requirement description..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* User Needs — Popover + Command searchable multi-select with AI */}
        <FormField
          control={form.control}
          name="traces_to"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between gap-2">
                <FormLabel>Traces to User Need(s)</FormLabel>
                <AIRequirementUserNeedSuggestions
                  requirementDescription={currentDescription}
                  productId={productId}
                  companyId={companyId}
                  productName={productName}
                  existingUserNeeds={userNeeds.map(un => ({
                    id: un.id,
                    user_need_id: un.user_need_id,
                    description: un.description,
                  }))}
                  selectedIds={currentTracesTo}
                  onSelect={handleAISelect}
                  onUserNeedCreated={handleAIUserNeedCreated}
                />
              </div>
              {!loadingUserNeeds && currentTracesTo.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No user need linked yet. Click <span className="font-medium">Suggest with AI</span> to find an existing match or draft a new one from this requirement.
                </p>
              )}
              <FormControl>
                {loadingUserNeeds ? (
                  <div className="h-10 flex items-center px-3 py-2 border rounded-md bg-muted">
                    <span className="text-sm text-muted-foreground">Loading user needs...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Selected user needs as badges */}
                    {currentTracesTo.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {currentTracesTo.map(id => {
                          const need = userNeeds.find(un => un.user_need_id === id);
                          return (
                            <Badge key={id} variant="secondary" className="flex items-center gap-1 text-xs">
                              {id}{need ? `: ${need.description.substring(0, 30)}...` : ''}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => removeUserNeed(id)}
                              >
                                <X className="h-2.5 w-2.5" />
                              </Button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}

                    {/* Searchable dropdown */}
                    <Popover open={userNeedPopoverOpen} onOpenChange={setUserNeedPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between font-normal text-sm"
                        >
                          {currentTracesTo.length === 0
                            ? "Select user needs..."
                            : `${currentTracesTo.length} selected`}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[100] bg-popover" align="start">
                        <Command>
                          <CommandInput placeholder="Search user needs..." />
                          <CommandList>
                            <CommandEmpty>No user needs found.</CommandEmpty>
                            <CommandGroup>
                              {userNeeds.map(un => (
                                <CommandItem
                                  key={un.user_need_id}
                                  value={`${un.user_need_id} ${un.description}`}
                                  onSelect={() => toggleUserNeed(un.user_need_id)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      currentTracesTo.includes(un.user_need_id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <span className="truncate">
                                    <span className="font-medium">{un.user_need_id}</span>
                                    {': '}
                                    {un.description.substring(0, 60)}{un.description.length > 60 ? '...' : ''}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="linked_risks"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Linked Risks</FormLabel>
                <div className="flex items-center gap-2">
                  <AIRequirementHazardSuggestions
                    requirementDescription={form.watch('description') || ''}
                    requirementType={requirement.requirement_id?.startsWith('SWR') ? 'software' : requirement.requirement_id?.startsWith('HWR') ? 'hardware' : 'system'}
                    productId={productId}
                    companyId={companyId}
                    productName={productName}
                    existingHazards={hazards.map(h => ({ id: h.id, hazard_id: h.hazard_id, description: h.description }))}
                    selectedIds={field.value}
                    onSelect={(id) => {
                      if (!field.value.includes(id)) field.onChange([...field.value, id]);
                    }}
                    onHazardCreated={() => {
                      hazardsService.getHazardsByProduct(productId).then(setHazards).catch(console.error);
                      queryClient.invalidateQueries({ queryKey: ['hazards', productId] });
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleCreateNewHazard}
                    disabled={isCreatingDraftHazard}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {isCreatingDraftHazard ? 'Creating...' : 'Create New Hazard'}
                  </Button>
                </div>
              </div>
              {!loadingHazards && field.value.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No risk linked yet. Click <span className="font-medium">Suggest with AI</span> to find a matching hazard or draft a new one from this requirement.
                </p>
              )}
              <FormControl>
                {loadingHazards ? (
                  <div className="h-10 flex items-center px-3 py-2 border rounded-md bg-muted">
                    <span className="text-sm text-muted-foreground">Loading hazards...</span>
                  </div>
                ) : (
                  <MultiSelect
                    options={hazardOptions}
                    selected={field.value}
                    onChange={field.onChange}
                    placeholder="Select hazards linked to this requirement..."
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {REQUIREMENT_CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.label}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="verification_status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select verification status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Passed">Passed</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
