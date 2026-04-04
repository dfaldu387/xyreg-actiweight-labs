import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ProductModelCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, description?: string) => Promise<void>;
  title?: string;
  defaultValues?: {
    name: string;
    description?: string;
  };
}

export function ProductModelCreateDialog({ 
  open, 
  onOpenChange, 
  onCreate, 
  title = "Create Product Model",
  defaultValues 
}: ProductModelCreateDialogProps) {
  const [name, setName] = useState(defaultValues?.name || '');
  const [description, setDescription] = useState(defaultValues?.description || '');
  const [isSaving, setIsSaving] = useState(false);

  // Update form fields when defaultValues changes (e.g., when editing different models)
  useEffect(() => {
    setName(defaultValues?.name || '');
    setDescription(defaultValues?.description || '');
  }, [defaultValues]);

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Model name is required');
      return;
    }

    setIsSaving(true);
    try {
      await onCreate(trimmedName, description.trim() || undefined);
      toast.success('Product model created successfully');
      setName('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create product model');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="model-name">Model Name *</Label>
            <Input
              id="model-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter model name"
              disabled={isSaving}
            />
          </div>
          <div>
            <Label htmlFor="model-description">Description</Label>
            <Textarea
              id="model-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              disabled={isSaving}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? 'Creating...' : 'Create Model'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}