
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentCreationService } from "@/services/documentCreationService";
import { useExistingTags } from "@/hooks/useExistingTags";

interface AddDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  companyId?: string;
  phases?: any[];
  onDocumentAdded: (document: any) => void;
}

export function AddDocumentDialog({
  open,
  onOpenChange,
  productId,
  companyId,
  phases = [],
  onDocumentAdded
}: AddDocumentDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    documentType: 'Standard',
    techApplicability: 'All device types'
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { data: existingTags = [] } = useExistingTags(companyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;

    setIsCreating(true);
    try {
      // Determine scope based on context
      let scope: 'company_template' | 'product_document' | 'company_document';
      if (productId) {
        scope = 'product_document';
      } else {
        scope = 'company_document';
      }

      const documentId = await DocumentCreationService.createDocument({
        name: formData.name,
        description: formData.description,
        documentType: formData.documentType,
        scope,
        companyId,
        productId,
        techApplicability: formData.techApplicability,
        tags: tags.length > 0 ? tags : undefined
      });

      if (documentId) {
        // Create document object for callback
        const newDocument = {
          id: documentId,
          name: formData.name,
          description: formData.description,
          type: formData.documentType,
          status: 'Draft',
          techApplicability: formData.techApplicability
        };
        
        onDocumentAdded(newDocument);
        onOpenChange(false);
        setFormData({
          name: '',
          description: '',
          documentType: 'Standard',
          techApplicability: 'All device types'
        });
        setTags([]);
        setTagInput('');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const documentTypes = [
    'Standard',
    'Regulatory',
    'Technical',
    'Clinical',
    'Quality',
    'Design'
  ];

  const techApplicabilityOptions = [
    'All device types',
    'Class I devices only',
    'Class II devices only',
    'Class III devices only',
    'Software devices only',
    'Hardware devices only'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {productId ? 'Add Product Document' : 'Add Company Document'}
          </DialogTitle>
          <DialogDescription>
            {productId 
              ? 'Create a new document for this specific product.' 
              : 'Create a new document for your company.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Document Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter document name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type</Label>
            <Select
              value={formData.documentType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="techApplicability">Tech Applicability</Label>
            <Select
              value={formData.techApplicability}
              onValueChange={(value) => setFormData(prev => ({ ...prev, techApplicability: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {techApplicabilityOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[42px] items-center">
              {tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    className="ml-1 text-xs hover:text-destructive"
                    onClick={() => setTags(prev => prev.filter((_, i) => i !== idx))}
                  >
                    ×
                  </button>
                </Badge>
              ))}
              <Input
                className="border-0 shadow-none flex-1 min-w-[120px] h-7 p-0 focus-visible:ring-0"
                placeholder="Type a tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    e.preventDefault();
                    const newTag = tagInput.trim();
                    if (!tags.includes(newTag)) {
                      setTags(prev => [...prev, newTag]);
                    }
                    setTagInput('');
                  }
                }}
                disabled={isCreating}
              />
            </div>
            {/* Existing tag suggestions */}
            {(() => {
              const suggestions = existingTags.filter(t => !tags.includes(t) && (!tagInput || t.toLowerCase().includes(tagInput.toLowerCase())));
              if (suggestions.length === 0) return null;
              return (
                <div className="mt-1">
                  <span className="text-xs text-muted-foreground">Existing tags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {suggestions.slice(0, 15).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => {
                          if (!tags.includes(tag)) {
                            setTags(prev => [...prev, tag]);
                          }
                          setTagInput('');
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter document description (optional)"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !formData.name.trim()}>
              {isCreating ? 'Creating...' : 'Create Document'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
