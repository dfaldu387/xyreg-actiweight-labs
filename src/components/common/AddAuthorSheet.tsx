import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useInvitations, sendInvitationDirect } from "@/hooks/useInvitations";
import { useTranslation } from "@/hooks/useTranslation";

// Pending author data returned when deferCreation is true
export interface PendingAuthorData {
  tempId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  hasEmail: boolean;
}

// Helper function to create pending authors in the database (called when parent form saves)
export async function createPendingAuthors(
  pendingAuthors: PendingAuthorData[],
  companyId: string
): Promise<Map<string, string>> {
  const tempToRealIdMap = new Map<string, string>();

  for (const pending of pendingAuthors) {
    try {
      const { data: userData } = await supabase.auth.getUser();

      let invitationId: string | undefined;

      // Send invitation only if email is provided
      if (pending.hasEmail && pending.email) {
        const result = await sendInvitationDirect(companyId, {
          email: pending.email,
          access_level: 'author',
          is_internal: true,
          firstName: pending.firstName,
          lastName: pending.lastName
        });

        if (result.success) {
          invitationId = result.invitationId;
        }
      }

      // Create entry in document_authors
      const { data: newAuthor, error } = await supabase
        .from('document_authors')
        .insert({
          company_id: companyId,
          name: pending.fullName,
          email: pending.email,
          created_by: userData?.user?.id,
          user_invitation_id: invitationId || null,
          is_visible: pending.hasEmail ? false : true
        })
        .select('id, name')
        .single();

      if (!error && newAuthor) {
        tempToRealIdMap.set(pending.tempId, newAuthor.id);
      } else if (error) {
        console.error(`[createPendingAuthors] Error creating author ${pending.fullName}:`, error);
      }
    } catch (error) {
      console.error(`[createPendingAuthors] Error creating author ${pending.fullName}:`, error);
    }
  }

  return tempToRealIdMap;
}

interface AddAuthorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onAuthorAdded: (authorId: string, authorName: string) => void;
  // When true, don't create in DB - just return pending data for later creation
  deferCreation?: boolean;
  onPendingAuthorAdded?: (pendingAuthor: PendingAuthorData) => void;
}

export function AddAuthorSheet({
  open,
  onOpenChange,
  companyId,
  onAuthorAdded,
  deferCreation = false,
  onPendingAuthorAdded
}: AddAuthorSheetProps) {
  const { lang } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [hasEmail, setHasEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { sendInvitation } = useInvitations(companyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    // Validate email format only if email is provided
    if (hasEmail && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        toast.error('Please enter a valid email address');
        return;
      }
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    // If deferCreation is true, don't create in DB yet - just return pending data
    if (deferCreation && onPendingAuthorAdded) {
      const tempId = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const pendingAuthor: PendingAuthorData = {
        tempId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName,
        email: hasEmail && email.trim() ? email.trim() : null,
        hasEmail: hasEmail && !!email.trim()
      };

      onPendingAuthorAdded(pendingAuthor);
      // Also call onAuthorAdded with temp ID so it appears in the selector
      onAuthorAdded(tempId, fullName);
      resetForm();
      onOpenChange(false);
      toast.success('Author added (will be saved when you save the document)');
      return;
    }

    // Original behavior: create immediately in DB
    setIsSubmitting(true);

    try {
      const { data: userData } = await supabase.auth.getUser();

      let invitationId: string | undefined;

      // Send invitation only if email is provided
      if (hasEmail && email.trim()) {
        const result = await sendInvitation({
          email: email.trim(),
          access_level: 'author',
          is_internal: true,
          firstName: firstName.trim(),
          lastName: lastName.trim()
        });

        if (!result.success) {
          setIsSubmitting(false);
          return;
        }
        invitationId = result.invitationId;
      }

      // Create entry in document_authors so they can be selected immediately
      // Link with invitation via user_invitation_id if invitation was sent
      const { data: newAuthor, error } = await supabase
        .from('document_authors')
        .insert({
          company_id: companyId,
          name: fullName,
          email: hasEmail && email.trim() ? email.trim() : null,
          created_by: userData?.user?.id,
          user_invitation_id: invitationId || null,
          is_visible: hasEmail && email.trim() ? false : true // Hide from stakeholders if has email (will be in pending invitations)
        })
        .select('id, name')
        .single();

      if (!error && newAuthor) {
        onAuthorAdded(newAuthor.id, newAuthor.name);
        resetForm();
        onOpenChange(false);
      } else if (error) {
        console.error('Error creating author:', error);
        toast.error('Failed to add author');
      }
    } catch (error) {
      console.error('Error adding author:', error);
      toast.error('Failed to add author');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setHasEmail(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:min-w-[550px] z-[1500]">
        <SheetHeader>
          <SheetTitle>{lang('addAuthor.title')}</SheetTitle>
          <SheetDescription>
            {lang('addAuthor.description')}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">{lang('addAuthor.firstName')}</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={lang('addAuthor.firstNamePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">{lang('addAuthor.lastName')}</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={lang('addAuthor.lastNamePlaceholder')}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasEmail"
              checked={hasEmail}
              onCheckedChange={(checked) => {
                setHasEmail(checked === true);
                if (!checked) {
                  setEmail('');
                }
              }}
            />
            <Label htmlFor="hasEmail" className="cursor-pointer">
              {lang('addAuthor.includeEmail')}
            </Label>
          </div>

          {!hasEmail && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
              <p className="font-medium">{lang('addAuthor.noteTitle')}</p>
              <p className="mt-1">
                {lang('addAuthor.noteDescription')}
              </p>
            </div>
          )}

          {hasEmail && (
            <div className="space-y-2">
              <Label htmlFor="email">{lang('addAuthor.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={lang('addAuthor.emailPlaceholder')}
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              {lang('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? lang('addAuthor.adding') : lang('addAuthor.addButton')}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
