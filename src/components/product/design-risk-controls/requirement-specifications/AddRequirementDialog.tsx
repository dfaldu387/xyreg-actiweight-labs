import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { CreateRequirementSpecificationData, REQUIREMENT_CATEGORIES } from "./types";
import type { UserNeed } from "../user-needs/types";
import type { Hazard } from "../risk-management/types";
import { Plus, Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  description: z.string().min(1, "Requirement description is required"),
  traces_to: z.array(z.string()),
  linked_risks: z.array(z.string()),
  verification_status: z.enum(['Not Started', 'In Progress', 'Passed', 'Failed']),
  category: z.string().min(1, "Category is required")
});

interface AddRequirementDialogProps {
  onAdd: (data: CreateRequirementSpecificationData) => Promise<void>;
  isLoading: boolean;
  productId: string;
  companyId: string;
  productName?: string;
}

export function AddRequirementDialog({ onAdd, isLoading, productId, companyId, productName }: AddRequirementDialogProps) {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [userNeeds, setUserNeeds] = useState<UserNeed[]>([]);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [loadingUserNeeds, setLoadingUserNeeds] = useState(true);
  const [loadingHazards, setLoadingHazards] = useState(true);
  const [isCreatingDraftHazard, setIsCreatingDraftHazard] = useState(false);
  const [userNeedPopoverOpen, setUserNeedPopoverOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      traces_to: [],
      linked_risks: [],
      verification_status: "Not Started",
      category: "system_use"
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

    if (open) {
      fetchData();
    }
  }, [productId, open]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onAdd({
        description: values.description,
        traces_to: values.traces_to.join(', '),
        linked_risks: values.linked_risks.join(', '),
        verification_status: values.verification_status,
        category: values.category
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Failed to add requirement specification:', error);
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
      await hazardsService.createHazard(productId, companyId, {
        description: `Draft - linked from new requirement`,
        linked_requirements: '',
      }, 'SYS');
      await queryClient.invalidateQueries({ queryKey: ["hazards", productId] });
      sonnerToast.success('Draft hazard created');
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Requirement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Requirement Specification</DialogTitle>
          <DialogDescription>
            Create a new requirement specification for this product.
          </DialogDescription>
        </DialogHeader>
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
                  <div className="flex items-center gap-1">
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
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REQUIREMENT_CATEGORIES.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div>
                            <div className="font-medium">{category.label}</div>
                            <div className="text-xs text-muted-foreground">{category.description}</div>
                          </div>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <FormField
              control={form.control}
              name="linked_risks"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Linked Risks</FormLabel>
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

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Requirement"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
