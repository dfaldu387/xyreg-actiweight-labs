
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DatePicker } from '@/components/ui/date-picker';
import { ArrowLeft, Save, X, Info } from 'lucide-react';
import { useCompanyProducts } from '@/hooks/useCompanyProducts';
import { Activity, ACTIVITY_TYPES, ACTIVITY_TYPE_DESCRIPTIONS } from '@/types/activities';
import { DocumentFileUpload } from '@/components/common/DocumentFileUpload';
import { toast } from 'sonner';

interface ActivityFormProps {
  companyId: string;
  template?: any;
  onSave: (activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => Promise<Activity>;
  onCancel: () => void;
  onBack: () => void;
  title: string;
}

export function ActivityForm({ companyId, template, onSave, onCancel, onBack, title }: ActivityFormProps) {
  const { products } = useCompanyProducts(companyId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPath, setDocumentPath] = useState<string | undefined>();
  
  const [formData, setFormData] = useState({
    name: template?.name || '',
    type: template?.type || 'training_sessions',
    description: template?.description || '',
    product_id: '',
    assignee_ids: [] as string[],
    due_date: '',
    status: 'planned' as const,
    template_id: template?.id || null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Activity name is required');
      return;
    }
    
    if (!formData.product_id) {
      toast.error('Please select a product');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        company_id: companyId,
        product_id: formData.product_id,
        name: formData.name.trim(),
        type: formData.type as Activity['type'],
        status: formData.status,
        assignee_ids: formData.assignee_ids,
        due_date: formData.due_date || null,
        template_id: formData.template_id,
        phase_id: null // We'll handle phase assignment later
      });
      
      onCancel();
      toast.success('Activity created successfully');
    } catch {
      toast.error('Failed to create activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (file: File | null, filePath?: string) => {
    setDocumentFile(file);
    setDocumentPath(filePath);
  };

  // Group activity types to show "Other" at the end
  const orderedActivityTypes = Object.entries(ACTIVITY_TYPES).sort(([keyA], [keyB]) => {
    if (keyA === 'other') return 1;
    if (keyB === 'other') return -1;
    return 0;
  });

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Activity Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter activity name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">Product *</Label>
            <Select value={formData.product_id} onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="type">Activity Type</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="text-sm">
                    {ACTIVITY_TYPE_DESCRIPTIONS[formData.type as keyof typeof ACTIVITY_TYPE_DESCRIPTIONS]}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as Activity['type'] }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {orderedActivityTypes.map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{label}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p className="text-xs">
                            {ACTIVITY_TYPE_DESCRIPTIONS[key as keyof typeof ACTIVITY_TYPE_DESCRIPTIONS]}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <DatePicker
              date={formData.due_date ? new Date(formData.due_date) : undefined}
              setDate={(date) => setFormData(prev => ({ 
                ...prev, 
                due_date: date ? date.toISOString().split('T')[0] : ''
              }))}
              placeholder="Select due date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter activity description"
              rows={3}
            />
          </div>

          <DocumentFileUpload
            onFileChange={handleFileChange}
            disabled={isSubmitting}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create Activity'}
            </Button>
          </div>
        </form>
      </div>
    </TooltipProvider>
  );
}
