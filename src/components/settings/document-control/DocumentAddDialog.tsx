
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentCreationService } from "@/services/documentCreationService";
import { toast } from "sonner";
import { DocumentItem } from "@/types/client";

interface DocumentAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
  phases: any[];
  availablePhases: string[];
  phaseOrder: string[];
  onDocumentAdded: (document: DocumentItem) => void;
}

export function DocumentAddDialog({
  open,
  onOpenChange,
  companyId,
  phases,
  availablePhases,
  phaseOrder,
  onDocumentAdded
}: DocumentAddDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    documentType: 'Standard',
    phaseId: 'NO_PHASE', // Use special value instead of empty string
    techApplicability: 'All device types'
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;

    setIsCreating(true);
    try {
      let documentId: string | null = null;
      
      if (formData.phaseId && formData.phaseId !== 'NO_PHASE') {
        // Create phase-assigned template
        documentId = await DocumentCreationService.createDocument({
          name: formData.name,
          description: formData.description,
          documentType: formData.documentType,
          scope: 'company_template',
          companyId,
          phaseId: formData.phaseId,
          techApplicability: formData.techApplicability
        });
      } else {
        // Create standalone template
        documentId = await DocumentCreationService.createStandaloneTemplate({
          name: formData.name,
          description: formData.description,
          documentType: formData.documentType,
          companyId: companyId!,
          techApplicability: formData.techApplicability
        });
      }

      if (documentId) {
        // Create document object for callback - using proper type
        const newDocument: DocumentItem = {
          id: documentId,
          name: formData.name,
          type: formData.documentType as any, // Cast to match DocumentItemType
          description: formData.description || "",
          status: "Not Started",
          version: "1.0",
          lastUpdated: new Date().toISOString(),
          phases: [],
          reviewers: []
        };
        
        onDocumentAdded(newDocument);
        onOpenChange(false);
        setFormData({
          name: '',
          description: '',
          documentType: 'Standard',
          phaseId: 'NO_PHASE', // Reset to special value
          techApplicability: 'All device types'
        });
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
    'Design',
    'SOP'
  ];

  const techApplicabilityOptions = [
    'All device types',
    'Software devices',
    'Hardware devices',
    'Combination devices',
    'Implantable devices'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Document Template</DialogTitle>
          <DialogDescription>
            Create a new document template. You can optionally assign it to a specific phase.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter template name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phase">Phase (optional)</Label>
            <Select
              value={formData.phaseId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, phaseId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="No phase (unassigned)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NO_PHASE">No phase (unassigned)</SelectItem>
                {phases.map(phase => (
                  <SelectItem key={phase.id} value={phase.id}>{phase.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter template description (optional)"
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
              {isCreating ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
