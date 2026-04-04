import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useInvitations } from '@/hooks/useInvitations';
import { toast } from 'sonner';

interface AddStakeholderUserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  defaultFirstName?: string;
  stakeholderId?: string;
  onStakeholderDeleted?: () => void;
}

export function AddStakeholderUserSheet({
  open,
  onOpenChange,
  companyId,
  defaultFirstName = '',
  stakeholderId,
  onStakeholderDeleted
}: AddStakeholderUserSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    access_level: 'author' as 'viewer' | 'editor' | 'admin' | 'consultant' | 'author',
    user_type: 'internal' as 'internal' | 'external',
    functional_area: 'none',
    external_role: 'Consultant'
  });

  const { sendInvitation } = useInvitations(companyId);

  // Update firstName when defaultFirstName changes
  useEffect(() => {
    if (defaultFirstName) {
      setFormData(prev => ({ ...prev, firstName: defaultFirstName }));
    }
  }, [defaultFirstName]);

  // Reset form when sheet opens
  useEffect(() => {
    if (open) {
      setFormData(prev => ({
        ...prev,
        firstName: defaultFirstName || '',
        lastName: '',
        email: '',
        access_level: 'author',
        user_type: 'internal',
        functional_area: 'none',
        external_role: 'Consultant'
      }));
    }
  }, [open, defaultFirstName]);

  // Fetch company departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data: companyData, error } = await supabase
          .from('companies')
          .select('department_structure')
          .eq('id', companyId)
          .single();

        if (error) throw error;

        const departmentStructure = companyData?.department_structure;
        if (departmentStructure && Array.isArray(departmentStructure)) {
          const enabledDepts = departmentStructure
            .filter((dept: any) => dept.isEnabled !== false)
            .map((dept: any) => dept.name)
            .filter(Boolean);
          setDepartments(enabledDepts);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartments([]);
      }
    };

    if (companyId) {
      fetchDepartments();
    }
  }, [companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      toast.error("Please fill in the email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await sendInvitation({
        email: formData.email.trim(),
        access_level: formData.access_level,
        is_internal: formData.user_type === "internal",
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim()
      });

      if (result.success) {
        // If access_level is "author" and we have a stakeholderId, update the document_authors entry
        // This preserves the ID for existing document references while hiding it from the stakeholders list
        if (formData.access_level === 'author' && stakeholderId) {
          const { error: updateError } = await supabase
            .from('document_authors')
            .update({
              name: formData.firstName.trim(),
              last_name: formData.lastName.trim(),
              email: formData.email.trim(),
              is_visible: false,
              user_invitation_id: result.invitationId || null
            })
            .eq('id', stakeholderId)
            .eq('company_id', companyId);

          if (updateError) {
            console.error('Error updating stakeholder:', updateError);
          } else {
            onStakeholderDeleted?.();
          }
        }

        toast.success(`Invitation sent to ${formData.email}`);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add User to Company</SheetTitle>
          <SheetDescription>
            Send an email invitation to the user. They will receive an email to sign up and join the company.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="add-firstName">First Name *</Label>
              <Input
                id="add-firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="First name"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-lastName">Last Name *</Label>
              <Input
                id="add-lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Last name"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-email">Email Address *</Label>
            <Input
              id="add-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>Access Level</Label>
            <Select
              value={formData.access_level}
              onValueChange={(value: 'viewer' | 'editor' | 'admin' | 'consultant' | 'author') =>
                setFormData(prev => ({ ...prev, access_level: value }))
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="author">Author - Can author documents</SelectItem>
                <SelectItem value="viewer">Viewer - Can view documents and data</SelectItem>
                <SelectItem value="editor">Editor - Can edit and modify content</SelectItem>
                <SelectItem value="admin">Admin - Full administrative access</SelectItem>
                <SelectItem value="consultant">Consultant - Entire company access</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>User Type</Label>
            <Select
              value={formData.user_type}
              onValueChange={(value: 'internal' | 'external') =>
                setFormData(prev => ({ ...prev, user_type: value }))
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal User</SelectItem>
                <SelectItem value="external">External User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.user_type === 'internal' ? (
            <div className="space-y-2">
              <Label>Functional Area (Optional)</Label>
              <Select
                value={formData.functional_area}
                onValueChange={(value) => setFormData(prev => ({ ...prev, functional_area: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select functional area (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None / Not Specified</SelectItem>
                  {departments.length > 0 ? (
                    departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-departments" disabled>No departments configured</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.external_role}
                onValueChange={(value) => setFormData(prev => ({ ...prev, external_role: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consultant">Consultant</SelectItem>
                  <SelectItem value="Auditor">Auditor</SelectItem>
                  <SelectItem value="Contractor">Contractor</SelectItem>
                  <SelectItem value="Partner">Partner</SelectItem>
                  <SelectItem value="Vendor">Vendor</SelectItem>
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="Regulatory Body">Regulatory Body</SelectItem>
                  <SelectItem value="Notified Body">Notified Body</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
