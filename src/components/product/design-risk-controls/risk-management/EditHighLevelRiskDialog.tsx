import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Pencil } from 'lucide-react';
import { format } from 'date-fns';
import {
  RISK_CATEGORIES,
  RISK_OPTIONS,
  LIKELIHOOD_OPTIONS,
  IMPACT_OPTIONS,
  STATUS_OPTIONS,
  isCustomRisk,
  isNoneKnownRisk,
  type RiskCategory,
} from '@/constants/highLevelRiskOptions';
import type { HighLevelRisk, UpdateHighLevelRiskInput } from '@/hooks/useHighLevelRisks';

interface EditHighLevelRiskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: UpdateHighLevelRiskInput) => void;
  risk: HighLevelRisk | null;
  isLoading?: boolean;
}

export function EditHighLevelRiskDialog({
  open,
  onOpenChange,
  onSubmit,
  risk,
  isLoading,
}: EditHighLevelRiskDialogProps) {
  const [category, setCategory] = useState<RiskCategory>('Clinical');
  const [riskType, setRiskType] = useState('');
  const [description, setDescription] = useState('');
  const [likelihood, setLikelihood] = useState<number>(3);
  const [impact, setImpact] = useState<number>(3);
  const [mitigation, setMitigation] = useState('');
  const [status, setStatus] = useState<'Open' | 'In Progress' | 'Mitigated'>('Open');
  const [owner, setOwner] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();

  // Initialize form when risk changes
  useEffect(() => {
    if (risk) {
      setCategory(risk.category);
      setRiskType(risk.risk_type);
      setDescription(risk.description);
      setLikelihood(risk.likelihood);
      setImpact(risk.impact);
      setMitigation(risk.mitigation || '');
      setStatus(risk.status);
      setOwner(risk.owner || '');
      setDueDate(risk.due_date ? new Date(risk.due_date) : undefined);
    }
  }, [risk]);

  const isCustom = isCustomRisk(riskType);
  const isNoneKnown = isNoneKnownRisk(riskType);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!risk || !description.trim()) return;

    onSubmit({
      id: risk.id,
      category,
      risk_type: riskType,
      is_custom: isCustom,
      description: description.trim(),
      likelihood: isNoneKnown ? 0 : likelihood,
      impact: isNoneKnown ? 0 : impact,
      mitigation: mitigation.trim() || null,
      status: isNoneKnown ? 'Mitigated' : status,
      owner: owner.trim() || null,
      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
    });
  };

  const handleCategoryChange = (newCategory: RiskCategory) => {
    setCategory(newCategory);
    // Reset to custom if changing category
    const otherKey = `${newCategory.toLowerCase()}_other`;
    setRiskType(otherKey);
  };

  const isValid = description.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Edit Risk
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {RISK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Risk Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="riskType">Risk Type</Label>
            <Select value={riskType} onValueChange={setRiskType}>
              <SelectTrigger>
                <SelectValue placeholder="Select a risk type..." />
              </SelectTrigger>
              <SelectContent>
                {RISK_OPTIONS[category]?.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      {!isCustomRisk(option.key) && (
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the risk in detail..."
              rows={3}
            />
          </div>

          {/* Likelihood and Impact - hidden for "None known" */}
          {!isNoneKnown && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Likelihood *</Label>
                <RadioGroup
                  value={String(likelihood)}
                  onValueChange={(v) => setLikelihood(Number(v))}
                  className="space-y-2"
                >
                  {LIKELIHOOD_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={String(opt.value)} id={`edit-likelihood-${opt.value}`} />
                      <Label 
                        htmlFor={`edit-likelihood-${opt.value}`} 
                        className="flex-1 cursor-pointer font-normal"
                      >
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({opt.description})
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Impact *</Label>
                <RadioGroup
                  value={String(impact)}
                  onValueChange={(v) => setImpact(Number(v))}
                  className="space-y-2"
                >
                  {IMPACT_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={String(opt.value)} id={`edit-impact-${opt.value}`} />
                      <Label 
                        htmlFor={`edit-impact-${opt.value}`} 
                        className="flex-1 cursor-pointer font-normal"
                      >
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({opt.description})
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Mitigation Strategy, Status, Owner, Due Date - hidden for "None known" */}
          {!isNoneKnown && (
            <>
              <div className="space-y-2">
                <Label htmlFor="mitigation">Mitigation Strategy</Label>
                <Textarea
                  id="mitigation"
                  value={mitigation}
                  onChange={(e) => setMitigation(e.target.value)}
                  placeholder="Describe mitigation approach..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner">Owner (optional)</Label>
                  <Input
                    id="owner"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="Responsible person"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editDueDate">Due Date (optional)</Label>
                  <Input
                    id="editDueDate"
                    type="date"
                    value={dueDate ? format(dueDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value) : undefined)}
                    className="w-full"
                  />
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
