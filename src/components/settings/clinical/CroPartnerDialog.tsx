import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { X, HelpCircle } from 'lucide-react';
import { useCroPartners, CroPartner } from '@/hooks/useCroPartners';

interface CroPartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: CroPartner | null;
  companyId: string;
}

export function CroPartnerDialog({ open, onOpenChange, partner, companyId }: CroPartnerDialogProps) {
  const { createPartner, updatePartner } = useCroPartners(companyId);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    specialty_areas: [] as string[],
    performance_notes: '',
  });
  const [newSpecialty, setNewSpecialty] = useState('');

  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name || '',
        contact_person: partner.contact_person || '',
        email: partner.email || '',
        phone: partner.phone || '',
        specialty_areas: partner.specialty_areas || [],
        performance_notes: partner.performance_notes || '',
      });
    } else {
      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        specialty_areas: [],
        performance_notes: '',
      });
    }
  }, [partner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (partner) {
        await updatePartner(partner.id, formData);
      } else {
        await createPartner({
          ...formData,
          standard_agreement_path: null,
          is_preferred: false,
        });
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving CRO partner:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      specialty_areas: [],
      performance_notes: '',
    });
    setNewSpecialty('');
  };

  const addSpecialty = () => {
    if (newSpecialty.trim()) {
      setFormData(prev => ({
        ...prev,
        specialty_areas: [...prev.specialty_areas, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialty_areas: prev.specialty_areas.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{partner ? 'Edit' : 'Add'} CRO Partner</DialogTitle>
          <DialogDescription>
            Manage preferred Contract Research Organization (CRO) partners for clinical trials.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="name">CRO Name *</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Full legal name of the Contract Research Organization</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., ABC Clinical Research"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Primary contact at the CRO for clinical trial coordination</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="phone">Phone</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Direct contact number for the primary CRO representative</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="email">Email</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Primary email address for CRO communications</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="contact@cro.com"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="specialty_areas">Specialty Areas</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Clinical specialties or therapeutic areas where this CRO has expertise (e.g., Cardiovascular, Orthopedic, Neurology)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex gap-2 mb-2">
              <Input
                id="specialty_areas"
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                placeholder="e.g., Cardiovascular, Orthopedic"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
              />
              <Button type="button" onClick={addSpecialty}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.specialty_areas.map((specialty, index) => (
                <Badge key={index} variant="secondary">
                  {specialty}
                  <button
                    type="button"
                    onClick={() => removeSpecialty(index)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="performance_notes">Performance Notes</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Historical notes on past performance, capabilities, strengths, or areas for improvement</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="performance_notes"
              value={formData.performance_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, performance_notes: e.target.value }))}
              placeholder="Notes on past performance, capabilities, or preferences"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {partner ? 'Update' : 'Create'} CRO Partner
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
