import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Sparkles, Loader2, AlertTriangle, Plus } from "lucide-react";
import { RequirementSpecification } from "@/components/product/design-risk-controls/requirement-specifications/types";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MultiSelect } from "@/components/settings/document-control/MultiSelect";
import { hazardsService } from "@/services/hazardsService";
import { toast as sonnerToast } from "sonner";

const SWR_CATEGORIES = [
  { id: 'Functional', label: 'Functional' },
  { id: 'Interface', label: 'Interface' },
  { id: 'Security', label: 'Security' },
  { id: 'Safety', label: 'Safety' },
  { id: 'Usability', label: 'Usability' },
  { id: 'Performance', label: 'Performance' },
  { id: 'Reliability', label: 'Reliability' },
];

interface EditSoftwareRequirementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirement: RequirementSpecification | null;
  onSave: (id: string, updates: { description: string; category: string; traces_to: string; linked_risks: string; verification_status: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  productId: string;
}

export function EditSoftwareRequirementDialog({
  open,
  onOpenChange,
  requirement,
  onSave,
  onDelete,
  isLoading = false,
  disabled = false,
  productId,
}: EditSoftwareRequirementDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { productId: routeProductId } = useParams<{ productId: string }>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isCreatingDraftHazard, setIsCreatingDraftHazard] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);

  const { data: hazards = [], isLoading: loadingHazards } = useQuery({
    queryKey: ['hazards-for-edit', productId],
    queryFn: () => hazardsService.getHazardsByProduct(productId),
    enabled: open && !!productId,
  });

  const hazardOptions = hazards.map(h => ({
    value: h.hazard_id,
    label: `${h.hazard_id}: ${h.description?.substring(0, 60) || 'No description'}`,
  }));

  // Query for affected traceability links on delete
  const { data: affectedLinks = [] } = useQuery({
    queryKey: ['affected-links-for-swr', requirement?.requirement_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('requirement_specifications')
        .select('requirement_id')
        .like('traces_to', `%${requirement!.requirement_id}%`);
      return data || [];
    },
    enabled: !!requirement?.requirement_id,
  });

  const [formData, setFormData] = useState({
    description: '',
    category: '',
    traces_to: '',
    linked_risks: '',
    verification_status: 'Not Started',
  });

  React.useEffect(() => {
    if (requirement) {
      setFormData({
        description: requirement.description || '',
        category: requirement.category || '',
        traces_to: requirement.traces_to || '',
        linked_risks: requirement.linked_risks || '',
        verification_status: requirement.verification_status || 'Not Started',
      });
      setSelectedRisks(
        (requirement.linked_risks || '').split(',').map(s => s.trim()).filter(Boolean)
      );
      setAiSuggested(false);
    }
  }, [requirement]);

  if (!requirement) return null;

  const handleOpenChange = (newOpen: boolean) => {
    if (disabled && newOpen) return;
    onOpenChange(newOpen);
  };

  const triggerAiSuggestion = async () => {
    if (!formData.description || formData.description.length < 15) return;
    setIsSuggesting(true);
    setAiSuggested(false);
    try {
      const categories = SWR_CATEGORIES.map(c => ({ id: c.id, label: c.label, description: c.label }));
      const { data, error } = await supabase.functions.invoke('ai-category-suggester', {
        body: { description: formData.description, categories, context: 'software-requirement' }
      });
      if (!error && data?.categoryId) {
        const validIds = SWR_CATEGORIES.map(c => c.id);
        if (validIds.includes(data.categoryId)) {
          setFormData(prev => ({ ...prev, category: data.categoryId }));
          setAiSuggested(true);
        }
      }
    } catch (e) {
      console.error('AI category suggestion error:', e);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !formData.description.trim()) return;
    await onSave(requirement.id, { ...formData, linked_risks: selectedRisks.join(', ') });
    handleOpenChange(false);
  };

  const handleDelete = async () => {
    if (disabled) return;
    await onDelete(requirement.id);
    setShowDeleteDialog(false);
    handleOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Software Requirement - {requirement.requirement_id}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
                disabled={disabled}
              />
            </div>

            <div>
              <Label htmlFor="traces_to">Traces To</Label>
              <Input
                id="traces_to"
                value={formData.traces_to}
                onChange={(e) => setFormData({ ...formData, traces_to: e.target.value })}
                placeholder="e.g. SYSR-001, SYSR-002"
                disabled={disabled}
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                Category
                <button
                  type="button"
                  onClick={triggerAiSuggestion}
                  disabled={isSuggesting || disabled}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                  title="AI suggest category"
                >
                  {isSuggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {aiSuggested ? 'AI suggested' : 'AI suggest'}
                </button>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => { setFormData({ ...formData, category: value }); setAiSuggested(false); }}
                disabled={disabled}
              >
                <SelectTrigger disabled={disabled}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {SWR_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="verification_status">Verification Status</Label>
              <Select
                value={formData.verification_status}
                onValueChange={(value) => setFormData({ ...formData, verification_status: value })}
                disabled={disabled}
              >
                <SelectTrigger disabled={disabled}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Passed">Passed</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="linked_risks">Linked Risks</Label>
              <MultiSelect
                options={hazardOptions}
                selected={selectedRisks}
                onChange={setSelectedRisks}
                placeholder={loadingHazards ? "Loading hazards..." : "Select linked risks..."}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                disabled={isCreatingDraftHazard}
                onClick={async () => {
                  if (!requirement) return;
                  setIsCreatingDraftHazard(true);
                  try {
                    await hazardsService.createHazard(routeProductId || productId, requirement.company_id || '', {
                      description: `Draft - linked from ${requirement.requirement_id}`,
                      linked_requirements: requirement.requirement_id,
                    }, 'SWR');
                    await queryClient.invalidateQueries({ queryKey: ["hazards", routeProductId || productId] });
                    sonnerToast.success(`Draft hazard created and linked to ${requirement.requirement_id}`);
                    navigate(`/app/product/${routeProductId || productId}/design-risk-controls?tab=risk-management&returnTo=software-requirements`);
                  } catch (e) {
                    console.error('Failed to create draft hazard:', e);
                    sonnerToast.error('Failed to create draft hazard');
                  } finally {
                    setIsCreatingDraftHazard(false);
                  }
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                {isCreatingDraftHazard ? 'Creating...' : 'Create New Hazard'}
              </Button>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={() => { if (!disabled) setShowDeleteDialog(true); }}
                disabled={disabled || isLoading}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Requirement
              </Button>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={disabled}>
                  Cancel
                </Button>
                <Button type="submit" disabled={disabled || isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="z-[200]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Software Requirement
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {requirement.requirement_id}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {affectedLinks.length > 0 && (
            <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-800 mb-2">
                The following requirements reference this software requirement:
              </p>
              <ul className="text-sm text-orange-700 space-y-1">
                {affectedLinks.map((link) => (
                  <li key={link.requirement_id} className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-orange-600 rounded-full" />
                    {link.requirement_id} → {requirement.requirement_id}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
