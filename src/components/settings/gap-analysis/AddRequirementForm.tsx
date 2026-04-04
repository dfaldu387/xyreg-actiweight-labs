import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type GapTemplateItemInsert = Database["public"]["Tables"]["gap_template_items"]["Insert"];

interface AddRequirementFormProps {
  templateId: string;
  onSave: (requirement: Omit<GapTemplateItemInsert, 'template_id'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  nextSortOrder?: number;
}

export function AddRequirementForm({
  templateId,
  onSave,
  onCancel,
  isLoading = false,
  nextSortOrder = 0
}: AddRequirementFormProps) {
  const [formData, setFormData] = useState({
    item_number: '',
    requirement_text: '',
    clause_reference: '',
    category: 'documentation',
    priority: 'medium',
    is_applicable: true,
    applicability_rationale: '',
    guidance_text: '',
    sort_order: nextSortOrder,
    evidence_method: ''
  });

  const [evidenceMethods, setEvidenceMethods] = useState<Array<{
    id: string;
    method: string;
    isCompleted: boolean;
    comments: string;
  }>>([]);

  const [applicableStandards, setApplicableStandards] = useState<string[]>([]);
  const [newStandard, setNewStandard] = useState('');
  const [newEvidenceMethod, setNewEvidenceMethod] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addStandard = () => {
    if (newStandard.trim()) {
      setApplicableStandards(prev => [...prev, newStandard.trim()]);
      setNewStandard('');
    }
  };

  const removeStandard = (index: number) => {
    setApplicableStandards(prev => prev.filter((_, i) => i !== index));
  };

  const addEvidenceMethod = () => {
    if (newEvidenceMethod.trim()) {
      const newMethod = {
        id: `evidence-${Date.now()}`,
        method: newEvidenceMethod.trim(),
        isCompleted: false,
        comments: ''
      };
      setEvidenceMethods(prev => [...prev, newMethod]);
      setNewEvidenceMethod('');
    }
  };

  const removeEvidenceMethod = (id: string) => {
    setEvidenceMethods(prev => prev.filter(method => method.id !== id));
  };

  const updateEvidenceMethod = (id: string, field: string, value: any) => {
    setEvidenceMethods(prev => prev.map(method => 
      method.id === id ? { ...method, [field]: value } : method
    ));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const requirement = {
      ...formData,
      applicable_standards: applicableStandards,
      evidence_of_conformity: evidenceMethods.map(method => ({
        method: method.method,
        isCompleted: method.isCompleted,
        comments: method.comments
      }))
    };

    await onSave(requirement);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="item_number">Item Number *</Label>
          <Input
            id="item_number"
            value={formData.item_number}
            onChange={(e) => handleInputChange('item_number', e.target.value)}
            placeholder="e.g., 1.1, 2.3.4"
            required
          />
        </div>
        <div>
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="requirement_text">Requirement Text *</Label>
        <Textarea
          id="requirement_text"
          value={formData.requirement_text}
          onChange={(e) => handleInputChange('requirement_text', e.target.value)}
          rows={4}
          placeholder="Enter the requirement text..."
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="clause_reference">Clause Reference</Label>
          <Input
            id="clause_reference"
            value={formData.clause_reference}
            onChange={(e) => handleInputChange('clause_reference', e.target.value)}
            placeholder="e.g., Article 10.1"
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="documentation">Documentation</SelectItem>
              <SelectItem value="verification">Verification</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_applicable"
            checked={formData.is_applicable}
            onCheckedChange={(checked) => handleInputChange('is_applicable', checked)}
          />
          <Label htmlFor="is_applicable">Is Applicable</Label>
        </div>
        {!formData.is_applicable && (
          <div>
            <Label htmlFor="applicability_rationale">Applicability Rationale</Label>
            <Textarea
              id="applicability_rationale"
              value={formData.applicability_rationale}
              onChange={(e) => handleInputChange('applicability_rationale', e.target.value)}
              rows={2}
              placeholder="Explain why this requirement is not applicable..."
            />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="guidance_text">Guidance Text</Label>
        <Textarea
          id="guidance_text"
          value={formData.guidance_text}
          onChange={(e) => handleInputChange('guidance_text', e.target.value)}
          rows={3}
          placeholder="Additional guidance or implementation notes..."
        />
      </div>

      <div>
        <Label>Applicable Standards</Label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newStandard}
              onChange={(e) => setNewStandard(e.target.value)}
              placeholder="Add applicable standard..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStandard())}
            />
            <Button type="button" variant="outline" size="sm" onClick={addStandard}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {applicableStandards.map((standard, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {standard}
                <button
                  type="button"
                  onClick={() => removeStandard(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="evidence_method">Primary Evidence Method</Label>
        <Input
          id="evidence_method"
          value={formData.evidence_method}
          onChange={(e) => handleInputChange('evidence_method', e.target.value)}
          placeholder="Primary method for demonstrating compliance..."
        />
      </div>

      <div>
        <Label>Evidence & Verification Methods</Label>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newEvidenceMethod}
              onChange={(e) => setNewEvidenceMethod(e.target.value)}
              placeholder="Add evidence method (e.g., Document review, Testing, Audit)..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEvidenceMethod())}
            />
            <Button type="button" variant="outline" size="sm" onClick={addEvidenceMethod}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {evidenceMethods.map((method) => (
              <div key={method.id} className="border rounded-lg p-4 space-y-3 bg-muted/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2 flex-1">
                    <Switch
                      checked={method.isCompleted}
                      onCheckedChange={(checked) => updateEvidenceMethod(method.id, 'isCompleted', checked)}
                    />
                    <div className="flex-1">
                      <Input
                        value={method.method}
                        onChange={(e) => updateEvidenceMethod(method.id, 'method', e.target.value)}
                        placeholder="Evidence method..."
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEvidenceMethod(method.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Comments</Label>
                  <Textarea
                    value={method.comments}
                    onChange={(e) => updateEvidenceMethod(method.id, 'comments', e.target.value)}
                    placeholder="Add comments, notes, or verification details..."
                    rows={2}
                    className="bg-background"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Requirement'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}