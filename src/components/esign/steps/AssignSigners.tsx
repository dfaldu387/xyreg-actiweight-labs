import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Search, GripVertical, X, UserPlus, Send, Users, Loader2 } from 'lucide-react';
import { SIGNATURE_MEANINGS } from '../lib/esign.constants';
import { ESignService } from '../lib/esign.service';
import { useAuth } from '@/context/AuthContext';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { supabase } from '@/integrations/supabase/client';
import type { SignatureMeaning, SigningOrder, ESignRequest } from '../lib/esign.types';

interface AssignedSigner {
  id: string;
  name: string;
  email: string;
  role: string;
  meaning: SignatureMeaning;
}

interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AssignSignersProps {
  documentId: string;
  onSubmit: (request: ESignRequest) => void;
}

export function AssignSigners({ documentId, onSubmit }: AssignSignersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [signingOrder, setSigningOrder] = useState<SigningOrder>('sequential');
  const [assignedSigners, setAssignedSigners] = useState<AssignedSigner[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { activeCompanyId } = useCompanyRole();

  // Use the same hook as Settings > Users tab, with the active company
  const { users: companyUsers, isLoading: isLoadingUsers } = useCompanyUsers(activeCompanyId || undefined);

  const allUsers: CompanyUser[] = companyUsers.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
  }));

  // Filter users based on search query
  const availableUsers = allUsers.filter(u => {
    // Exclude already assigned
    if (assignedSigners.some(s => s.id === u.id)) return false;
    // If no search query, show all
    if (!searchQuery.trim()) return true;
    // Filter by query
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const addSigner = (cUser: CompanyUser) => {
    setAssignedSigners(prev => [...prev, { ...cUser, meaning: 'reviewer' }]);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const removeSigner = (id: string) => {
    setAssignedSigners(prev => prev.filter(s => s.id !== id));
  };

  const updateMeaning = (id: string, meaning: SignatureMeaning) => {
    setAssignedSigners(prev => prev.map(s => s.id === id ? { ...s, meaning } : s));
  };

  const handleSubmit = async () => {
    if (!user?.id || assignedSigners.length === 0) return;

    setIsSubmitting(true);
    try {
      const documentHash = await ESignService.computeDocumentHash(documentId);

      const request = await ESignService.createSignRequest(
        documentId,
        documentHash,
        user.id,
        signingOrder,
        assignedSigners.map((s, i) => ({
          userId: s.id,
          displayName: s.name,
          meaning: s.meaning,
          orderIndex: i,
        }))
      );

      if (request) {
        onSubmit(request);
      }
    } catch (err) {
      console.error('[ESign] Failed to create sign request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search / Add Signers */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Signers
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isLoadingUsers ? "Loading users..." : "Search users by name or email..."}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => { setTimeout(() => setShowDropdown(false), 200); }}
            className="pl-10"
            disabled={isLoadingUsers}
          />
          {showDropdown && !isLoadingUsers && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
              {availableUsers.length > 0 ? (
                availableUsers.map(cUser => (
                  <button
                    key={cUser.id}
                    className="w-full text-left px-3 py-2 hover:bg-accent flex items-center justify-between text-sm"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addSigner(cUser)}
                  >
                    <div>
                      <span className="font-medium">{cUser.name}</span>
                      <span className="text-muted-foreground ml-2">{cUser.email}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{cUser.role}</Badge>
                  </button>
                ))
              ) : (
                <div className="px-3 py-3 text-sm text-muted-foreground">
                  {searchQuery ? `No users found matching "${searchQuery}"` : 'No users available'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Signing Order */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Signing Order
        </Label>
        <RadioGroup value={signingOrder} onValueChange={(v) => setSigningOrder(v as SigningOrder)} className="flex gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sequential" id="sequential" />
            <Label htmlFor="sequential" className="text-sm cursor-pointer">
              Sequential <span className="text-muted-foreground">(one at a time, in order)</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="parallel" id="parallel" />
            <Label htmlFor="parallel" className="text-sm cursor-pointer">
              Parallel <span className="text-muted-foreground">(all at once)</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Assigned Signers List */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Assigned Signers ({assignedSigners.length})
        </Label>
        {assignedSigners.length === 0 ? (
          <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground text-sm">
            No signers assigned. Search and add users above.
          </div>
        ) : (
          <div className="space-y-2">
            {assignedSigners.map((signer, index) => (
              <div
                key={signer.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                {signingOrder === 'sequential' && (
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab flex-shrink-0" />
                )}
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{signer.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{signer.email}</div>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">{signer.role}</Badge>
                <Select value={signer.meaning} onValueChange={(v) => updateMeaning(signer.id, v as SignatureMeaning)}>
                  <SelectTrigger className="w-[180px] flex-shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIGNATURE_MEANINGS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => removeSigner(signer.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSubmit} disabled={assignedSigners.length === 0 || isSubmitting} className="gap-2">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isSubmitting ? 'Creating Request...' : 'Send for Signature'}
        </Button>
      </div>
    </div>
  );
}
