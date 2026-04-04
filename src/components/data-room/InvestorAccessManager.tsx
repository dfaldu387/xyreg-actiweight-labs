import React, { useState } from 'react';
import { Plus, Mail, Copy, Trash2, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useDataRoomAccess } from '@/hooks/useDataRoomAccess';
import { AccessLevel, InviteInvestorInput } from '@/types/dataRoom';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface InvestorAccessManagerProps {
  dataRoomId: string;
}

export function InvestorAccessManager({ dataRoomId }: InvestorAccessManagerProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('viewer');
  const [canDownload, setCanDownload] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');

  const { accessList, inviteInvestor, revokeAccess, isInviting, isRevoking } = useDataRoomAccess(dataRoomId);

  const handleInvite = () => {
    if (!email) return;

    const input: InviteInvestorInput = {
      investor_email: email,
      investor_name: name || undefined,
      investor_organization: organization || undefined,
      access_level: accessLevel,
      can_download: canDownload,
      access_expires_at: expiresAt || undefined,
    };

    inviteInvestor(
      { dataRoomId, input },
      {
        onSuccess: () => {
          setShowInviteDialog(false);
          // Reset form
          setEmail('');
          setName('');
          setOrganization('');
          setAccessLevel('viewer');
          setCanDownload(false);
          setExpiresAt('');
        },
      }
    );
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/investor/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Access link copied to clipboard');
  };

  const getStatusBadge = (status: string, expiresAt?: string) => {
    if (status === 'revoked') {
      return <Badge variant="destructive">Revoked</Badge>;
    }
    if (status === 'expired' || (expiresAt && new Date(expiresAt) < new Date())) {
      return <Badge variant="outline">Expired</Badge>;
    }
    if (status === 'active') {
      return <Badge className="bg-green-500">Active</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Invite Button */}
      <div className="flex justify-end">
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Invite Investor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Investor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="inv-email">Email *</Label>
                <Input
                  id="inv-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="investor@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inv-name">Name</Label>
                <Input
                  id="inv-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inv-org">Organization</Label>
                <Input
                  id="inv-org"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Acme Ventures"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="access-level">Access Level</Label>
                <Select value={accessLevel} onValueChange={(v) => setAccessLevel(v as AccessLevel)}>
                  <SelectTrigger id="access-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Full Viewer</SelectItem>
                    <SelectItem value="limited_viewer">Limited Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="can-download"
                  checked={canDownload}
                  onCheckedChange={(checked) => setCanDownload(checked as boolean)}
                />
                <Label htmlFor="can-download" className="cursor-pointer">
                  Allow document downloads
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires-at">Access Expires (Optional)</Label>
                <Input
                  id="expires-at"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              <Button
                onClick={handleInvite}
                disabled={!email || isInviting}
                className="w-full"
              >
                {isInviting ? 'Inviting...' : 'Send Invitation'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Access List */}
      {accessList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No investors invited yet</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Download</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Last Access</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessList.map((access) => (
                  <TableRow key={access.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {access.investor_name || access.investor_email}
                        </div>
                        {access.investor_organization && (
                          <div className="text-sm text-muted-foreground">
                            {access.investor_organization}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {access.investor_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(access.status, access.access_expires_at)}
                    </TableCell>
                    <TableCell>
                      {access.can_download ? (
                        <Badge variant="outline" className="bg-green-50">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {access.access_expires_at
                        ? new Date(access.access_expires_at).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      {access.last_accessed_at
                        ? formatDistanceToNow(new Date(access.last_accessed_at), { addSuffix: true })
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(access.access_token)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {access.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeAccess(access.id)}
                          disabled={isRevoking}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
