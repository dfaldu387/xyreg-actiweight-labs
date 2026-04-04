import { useState, useEffect } from 'react';
import { Crown, Plus, Trash2, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// We store master_emails in the first subscription_plan row (or any row, they all share it)
// This is a global setting that applies across all plans

export function MasterPlanEmailsDialog() {
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load emails from database
  useEffect(() => {
    if (open) {
      loadEmails();
    }
  }, [open]);

  const loadEmails = async () => {
    setIsLoading(true);
    try {
      // Get master_emails from the first plan that has it set
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('master_emails')
        .not('master_emails', 'is', null)
        .limit(1)
        .single();

      if (data?.master_emails && !error) {
        const emailList = data.master_emails as string[];
        setEmails(Array.isArray(emailList) ? emailList : []);
      } else {
        setEmails([]);
      }
    } catch (error) {
      console.error('Error loading master emails:', error);
      setEmails([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEmails = async (emailList: string[]) => {
    setIsSaving(true);
    try {
      // Update master_emails on all subscription_plans rows
      const { error } = await supabase
        .from('subscription_plans')
        .update({ master_emails: emailList })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

      if (error) throw error;

      toast.success('Master emails saved');
    } catch (error) {
      console.error('Error saving master emails:', error);
      toast.error('Failed to save master emails');
    } finally {
      setIsSaving(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddEmail = () => {
    const trimmedEmail = newEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      toast.error('Please enter an email address');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (emails.includes(trimmedEmail)) {
      toast.error('This email is already in the list');
      return;
    }

    const updatedEmails = [...emails, trimmedEmail];
    setEmails(updatedEmails);
    setNewEmail('');
    saveEmails(updatedEmails);
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    const updatedEmails = emails.filter(email => email !== emailToRemove);
    setEmails(updatedEmails);
    saveEmails(updatedEmails);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Crown className="h-4 w-4 text-yellow-500" />
          Master Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Master Plan Users
          </DialogTitle>
          <DialogDescription>
            Users with these email addresses will have access to all features regardless of their subscription plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Add Email Input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="new-email" className="sr-only">
                Email Address
              </Label>
              <Input
                id="new-email"
                type="email"
                placeholder="Enter email address..."
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSaving}
              />
            </div>
            <Button
              onClick={handleAddEmail}
              disabled={isSaving || !newEmail.trim()}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {/* Email List */}
          <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Mail className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No master plan users added yet</p>
              </div>
            ) : (
              emails.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100">
                      <Crown className="h-4 w-4 text-yellow-600" />
                    </div>
                    <span className="text-sm font-medium">{email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEmail(email)}
                    disabled={isSaving}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {emails.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {emails.length} user{emails.length !== 1 ? 's' : ''} with master plan access
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check if current user has master plan access
export function useMasterPlanAccess() {
  const [isMasterPlanUser, setIsMasterPlanUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Get current user email
        const { data: { user } } = await supabase.auth.getUser();
        const userEmail = user?.email?.toLowerCase();

        if (!userEmail) {
          setIsMasterPlanUser(false);
          setIsLoading(false);
          return;
        }

        // Load master_emails from subscription_plans table
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('master_emails')
          .not('master_emails', 'is', null)
          .limit(1)
          .single();

        if (data?.master_emails && !error) {
          const masterEmails = Array.isArray(data.master_emails)
            ? data.master_emails.map((e: string) => e.toLowerCase())
            : [];
          setIsMasterPlanUser(masterEmails.includes(userEmail));
        } else {
          setIsMasterPlanUser(false);
        }
      } catch (error) {
        console.error('Error checking master plan access:', error);
        setIsMasterPlanUser(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, []);

  return { isMasterPlanUser, isLoading };
}
