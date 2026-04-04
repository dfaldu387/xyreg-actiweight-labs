import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Copy, RefreshCw, Ticket, Users, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface WHXCode {
  id: string;
  code: string;
  description: string | null;
  is_active: boolean;
  max_uses: number | null;
  current_uses: number;
  created_at: string;
  expires_at: string | null;
  created_by: string | null;
}

interface AccessRequest {
  id: string;
  name: string;
  email: string;
  company: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  assigned_code: string | null;
}

const generateRandomCode = (length: number = 8): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'WHX-';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function SuperAdminWHXCodes() {
  const [codes, setCodes] = useState<WHXCode[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCode, setNewCode] = useState({
    code: generateRandomCode(),
    description: '',
    max_uses: '',
    expires_at: '',
  });

  useEffect(() => {
    fetchCodes();
    fetchRequests();
  }, []);

  const fetchCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('whx_event_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error) {
      console.error('Error fetching codes:', error);
      toast.error('Failed to fetch event codes');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('whx_access_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Cast status to the expected union type
      setRequests((data || []).map(item => ({
        ...item,
        status: item.status as 'pending' | 'approved' | 'rejected'
      })));
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const createCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('whx_event_codes')
        .insert({
          code: newCode.code.toUpperCase(),
          description: newCode.description || null,
          max_uses: newCode.max_uses ? parseInt(newCode.max_uses) : null,
          expires_at: newCode.expires_at || null,
          created_by: user?.id || null,
          is_active: true,
          current_uses: 0,
        });

      if (error) throw error;

      toast.success('Event code created successfully');
      setIsCreateDialogOpen(false);
      setNewCode({
        code: generateRandomCode(),
        description: '',
        max_uses: '',
        expires_at: '',
      });
      fetchCodes();
    } catch (error: any) {
      console.error('Error creating code:', error);
      toast.error(error.message || 'Failed to create event code');
    }
  };

  const toggleCodeStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('whx_event_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Code ${currentStatus ? 'deactivated' : 'activated'}`);
      fetchCodes();
    } catch (error) {
      console.error('Error toggling code status:', error);
      toast.error('Failed to update code status');
    }
  };

  const deleteCode = async (id: string) => {
    try {
      const { error } = await supabase
        .from('whx_event_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Event code deleted');
      fetchCodes();
    } catch (error) {
      console.error('Error deleting code:', error);
      toast.error('Failed to delete event code');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const approveRequest = async (request: AccessRequest, code: string) => {
    try {
      const { error } = await supabase
        .from('whx_access_requests')
        .update({
          status: 'approved',
          assigned_code: code
        })
        .eq('id', request.id);

      if (error) throw error;

      // Send email with the code (via edge function)
      await supabase.functions.invoke('send-access-code-email', {
        body: {
          email: request.email,
          name: request.name,
          code: code,
        },
      });

      toast.success('Request approved and code sent');
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  const rejectRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('whx_access_requests')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;

      toast.success('Request rejected');
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const activeCodes = codes.filter(c => c.is_active);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WHX Event Codes</h1>
          <p className="text-muted-foreground mt-1">
            Manage access codes for WHX Dubai event and Genesis signups
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create New Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Event Code</DialogTitle>
              <DialogDescription>
                Generate a new access code for WHX event attendees
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCode.code}
                    onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                    placeholder="WHX-XXXXXXXX"
                    className="font-mono uppercase"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setNewCode({ ...newCode, code: generateRandomCode() })}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={newCode.description}
                  onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                  placeholder="e.g., WHX Dubai 2025 - Booth Visitors"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Uses (leave empty for unlimited)</Label>
                <Input
                  type="number"
                  value={newCode.max_uses}
                  onChange={(e) => setNewCode({ ...newCode, max_uses: e.target.value })}
                  placeholder="e.g., 100"
                />
              </div>
              <div className="space-y-2">
                <Label>Expires At (optional)</Label>
                <Input
                  type="datetime-local"
                  value={newCode.expires_at}
                  onChange={(e) => setNewCode({ ...newCode, expires_at: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createCode}>Create Code</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Ticket className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Codes</p>
                <p className="text-2xl font-bold">{codes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Codes</p>
                <p className="text-2xl font-bold">{activeCodes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Uses</p>
                <p className="text-2xl font-bold">
                  {codes.reduce((sum, c) => sum + c.current_uses, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              Pending Access Requests
            </CardTitle>
            <CardDescription>
              Review and approve access code requests from potential users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.name}</TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell>{request.company}</TableCell>
                    <TableCell className="max-w-xs truncate" title={request.reason}>
                      {request.reason}
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Approve
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Approve Request</DialogTitle>
                              <DialogDescription>
                                Select a code to assign to {request.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <p className="text-sm text-muted-foreground">
                                Available codes:
                              </p>
                              <div className="space-y-2 max-h-60 overflow-auto">
                                {activeCodes.map((code) => (
                                  <Button
                                    key={code.id}
                                    variant="outline"
                                    className="w-full justify-between"
                                    onClick={() => approveRequest(request, code.code)}
                                  >
                                    <span className="font-mono">{code.code}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {code.current_uses}/{code.max_uses || '∞'} uses
                                    </span>
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-red-600 hover:text-red-700"
                          onClick={() => rejectRequest(request.id)}
                        >
                          <XCircle className="h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Event Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Event Codes</CardTitle>
          <CardDescription>
            All generated event codes and their usage statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : codes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No event codes created yet</p>
              <p className="text-sm">Create your first code to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono bg-slate-100 px-2 py-1 rounded text-sm">
                          {code.code}
                        </code>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(code.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {code.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={code.is_active ? 'default' : 'secondary'}>
                        {code.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {code.current_uses} / {code.max_uses || '∞'}
                    </TableCell>
                    <TableCell>
                      {code.expires_at
                        ? format(new Date(code.expires_at), 'MMM d, yyyy')
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(code.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={code.is_active}
                          onCheckedChange={() => toggleCodeStatus(code.id, code.is_active)}
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Event Code</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the code "{code.code}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteCode(code.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
