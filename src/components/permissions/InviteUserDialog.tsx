
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useInvitations } from "@/hooks/useInvitations";

interface InviteUserDialogProps {
  onInviteSent: () => void;
  companyId: string;
}

export function InviteUserDialog({ onInviteSent, companyId }: InviteUserDialogProps) {
  const [formData, setFormData] = useState({
    email: "",
    access_level: "editor" as "viewer" | "editor" | "admin",
    user_type: "internal" as "internal" | "external",
    internal_functional_area: "Research & Development (R&D)" as string,
    external_role: "consultant" as string
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { sendInvitation } = useInvitations(companyId);

  const isInternal = formData.user_type === "internal";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      
      const isInternal = formData.user_type === "internal";
      const result = await sendInvitation({
        email: formData.email.trim(),
        access_level: formData.access_level,
        is_internal: isInternal,
        firstName: '',
        lastName: '',
        functional_area: isInternal ? formData.internal_functional_area : null,
        external_role: !isInternal ? formData.external_role : null,
      });

      if (result.success) {
        onInviteSent();
        
        // Reset form
        setFormData({
          email: "",
          access_level: "editor",
          user_type: "internal",
          internal_functional_area: "Research & Development (R&D)",
          external_role: "consultant"
        });
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Invite New User</DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter email address"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="access_level">Access Level</Label>
          <Select
            value={formData.access_level}
            onValueChange={(value: "viewer" | "editor" | "admin") => 
              setFormData(prev => ({ ...prev, access_level: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Viewer - Can view documents and data</SelectItem>
              <SelectItem value="editor">Editor - Can edit and modify content</SelectItem>
              <SelectItem value="admin">Admin - Full administrative access</SelectItem>
              
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>User Type</Label>
          <Select
            value={formData.user_type}
            onValueChange={(value: "internal" | "external") => 
              setFormData(prev => ({ ...prev, user_type: value }))
            }
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

        {formData.user_type === "internal" && (
          <div className="space-y-2">
            <Label>Functional Area</Label>
            <Select
              value={formData.internal_functional_area}
              onValueChange={(value: string) => 
                setFormData(prev => ({ ...prev, internal_functional_area: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Research & Development (R&D)">Research & Development (R&D)</SelectItem>
                <SelectItem value="Quality Assurance (QA)">Quality Assurance (QA)</SelectItem>
                <SelectItem value="Regulatory Affairs (RA)">Regulatory Affairs (RA)</SelectItem>
                <SelectItem value="Clinical Affairs">Clinical Affairs</SelectItem>
                <SelectItem value="Manufacturing / Operations">Manufacturing / Operations</SelectItem>
                <SelectItem value="Marketing & Labeling">Marketing & Labeling</SelectItem>
                <SelectItem value="Management / Executive">Management / Executive</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {formData.user_type === "external" && (
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={formData.external_role}
              onValueChange={(value: string) => 
                setFormData(prev => ({ ...prev, external_role: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultant">Consultant</SelectItem>
                <SelectItem value="auditor">Auditor</SelectItem>
                <SelectItem value="contract_manufacturer">Contract Manufacturer</SelectItem>
                <SelectItem value="distributor">Distributor</SelectItem>
                <SelectItem value="key_opinion_leader">Key Opinion Leader (KOL)</SelectItem>
                <SelectItem value="other_external">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Invitation"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
