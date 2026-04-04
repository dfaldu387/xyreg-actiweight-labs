import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Search,
  RefreshCw,
  Users,
  Building2,
  Mail,
  Send,
  UserCheck,
  Clock,
  Sparkles,
  Download,
  CheckCircle2,
  XCircle,
  Eye,
  Ticket,
} from 'lucide-react';
import { format } from 'date-fns';

interface WHXAccessRequest {
  id: string;
  name: string;
  email: string;
  company: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  assigned_code: string | null;
  created_at: string;
  updated_at: string;
}

interface WHXEventCode {
  id: string;
  code: string;
  description: string | null;
  is_active: boolean;
  max_uses: number | null;
  current_uses: number;
}

export default function SuperAdminWHXUsers() {
  const [requests, setRequests] = useState<WHXAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Event codes
  const [eventCodes, setEventCodes] = useState<WHXEventCode[]>([]);

  // Message dialog state
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isBulkMessageDialogOpen, setIsBulkMessageDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WHXAccessRequest | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [selectedCodeToSend, setSelectedCodeToSend] = useState<string>('none');
  const [isSending, setIsSending] = useState(false);

  // Reason detail dialog
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<WHXAccessRequest | null>(null);

  useEffect(() => {
    fetchRequests();
    fetchEventCodes();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whx_access_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as WHXAccessRequest[]) || []);
    } catch (error) {
      console.error('Error fetching WHX requests:', error);
      toast.error('Failed to fetch access requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('whx_event_codes')
        .select('id, code, description, is_active, max_uses, current_uses')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEventCodes((data as WHXEventCode[]) || []);
    } catch (error) {
      console.error('Error fetching event codes:', error);
    }
  };

  const filteredRequests = useMemo(() => {
    let filtered = requests;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query) ||
        r.company.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    return filtered;
  }, [requests, searchQuery, statusFilter]);

  // Default message content
  const getDefaultSubject = (name?: string) =>
    `Welcome to XYREG Genesis 500${name ? `, ${name.split(' ')[0]}` : ''}! Your Access Code is Ready`;

  const getDefaultMessage = (name?: string) => {
    const firstName = name?.split(' ')[0] || '';
    return `Thank you for your interest in XYREG Genesis 500!${firstName ? ` ${firstName}, we` : ' We'} are excited to welcome you to our exclusive early adopter program.

Your Genesis access code is included below. Use it to create your free account and get started right away.

As a Genesis 500 member, you'll get:
- Zero subscription fees — free for life
- Direct roadmap influence with our product team
- Priority regulatory sync and early access to new features
- Unlimited users for your company

If you have any questions or need assistance getting started, simply reply to this email. We're here to help!`;
  };

  // Open message dialog for a single user
  const openMessageDialog = (request: WHXAccessRequest) => {
    setSelectedRequest(request);
    setMessageSubject(getDefaultSubject(request.name));
    setMessageBody(getDefaultMessage(request.name));
    // Pre-select the user's assigned code, or 'none'
    setSelectedCodeToSend(request.assigned_code || 'none');
    setIsMessageDialogOpen(true);
  };

  // Open bulk message dialog
  const openBulkMessageDialog = () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one user');
      return;
    }
    setMessageSubject('Welcome to XYREG Genesis 500! Your Access Code is Ready');
    setMessageBody(getDefaultMessage());
    setSelectedCodeToSend('none');
    setIsBulkMessageDialogOpen(true);
  };

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRequests.map(r => r.id)));
    }
  };

  // Get the code string to send (or undefined if 'none')
  const getCodeToSend = (): string | undefined => {
    if (selectedCodeToSend === 'none') return undefined;
    return selectedCodeToSend;
  };

  // Send message to a single user
  const sendMessage = async () => {
    if (!selectedRequest || !messageSubject.trim() || !messageBody.trim()) {
      toast.error('Please fill in subject and message');
      return;
    }

    const codeToSend = getCodeToSend();

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-whx-message', {
        body: {
          recipients: [{
            email: selectedRequest.email,
            name: selectedRequest.name,
            accessCode: codeToSend,
          }],
          subject: messageSubject,
          message: messageBody,
        },
      });

      if (error) throw error;

      toast.success(`Message sent to ${selectedRequest.name}`);
      setIsMessageDialogOpen(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Send message to multiple users
  const sendBulkMessage = async () => {
    if (!messageSubject.trim() || !messageBody.trim()) {
      toast.error('Please fill in subject and message');
      return;
    }

    const codeToSend = getCodeToSend();

    const recipients = requests
      .filter(r => selectedIds.has(r.id))
      .map(r => ({
        email: r.email,
        name: r.name,
        accessCode: codeToSend,
      }));

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-whx-message', {
        body: {
          recipients,
          subject: messageSubject,
          message: messageBody,
        },
      });

      if (error) throw error;

      toast.success(`Message sent to ${recipients.length} user${recipients.length > 1 ? 's' : ''}`);
      setIsBulkMessageDialogOpen(false);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error sending bulk message:', error);
      toast.error('Failed to send messages');
    } finally {
      setIsSending(false);
    }
  };

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Company', 'Reason', 'Status', 'Assigned Code', 'Requested'];
    const rows = filteredRequests.map(r => [
      r.name,
      r.email,
      r.company,
      r.reason,
      r.status,
      r.assigned_code || '',
      format(new Date(r.created_at), 'yyyy-MM-dd HH:mm'),
    ]);

    const csv = [headers, ...rows].map(row => row.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whx-event-users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Users exported to CSV');
  };

  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;
  const companiesCount = new Set(requests.map(r => r.company)).size;

  const getStatusBadge = (status: WHXAccessRequest['status']) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-teal-500" />
            WHX Event Users
          </h1>
          <p className="text-muted-foreground mt-1">
            View and message all WHX event access requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={fetchRequests} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {selectedIds.size > 0 && (
            <Button onClick={openBulkMessageDialog} className="gap-2">
              <Send className="h-4 w-4" />
              Message {selectedIds.size} User{selectedIds.size > 1 ? 's' : ''}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <Users className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Companies</p>
                <p className="text-2xl font-bold">{companiesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Access Requests</CardTitle>
          <CardDescription>
            All WHX event access code requests and their status
          </CardDescription>
          <div className="flex items-center gap-3 pt-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No requests found</p>
              <p className="text-sm mt-1">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'WHX event access requests will appear here'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredRequests.length && filteredRequests.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(request.id)}
                        onChange={() => toggleSelection(request.id)}
                        className="rounded border-slate-300"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{request.name}</TableCell>
                    <TableCell>
                      <a href={`mailto:${request.email}`} className="text-primary hover:underline">
                        {request.email}
                      </a>
                    </TableCell>
                    <TableCell>{request.company}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {request.assigned_code ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {request.assigned_code}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 h-8"
                          onClick={() => {
                            setViewingRequest(request);
                            setIsReasonDialogOpen(true);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 h-8"
                          onClick={() => openMessageDialog(request)}
                        >
                          <Mail className="h-3 w-3" />
                          Message
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Reason Dialog */}
      <Dialog open={isReasonDialogOpen} onOpenChange={setIsReasonDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              {viewingRequest?.name} - {viewingRequest?.company}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{viewingRequest?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{viewingRequest?.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Company</p>
                <p className="font-medium">{viewingRequest?.company}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                {viewingRequest && getStatusBadge(viewingRequest.status)}
              </div>
              {viewingRequest?.assigned_code && (
                <div>
                  <p className="text-muted-foreground">Assigned Code</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                    {viewingRequest.assigned_code}
                  </code>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Requested</p>
                <p className="font-medium">
                  {viewingRequest && format(new Date(viewingRequest.created_at), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-2">Reason for Access</p>
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                {viewingRequest?.reason}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReasonDialogOpen(false)}>
              Close
            </Button>
            <Button
              className="gap-1"
              onClick={() => {
                setIsReasonDialogOpen(false);
                if (viewingRequest) openMessageDialog(viewingRequest);
              }}
            >
              <Mail className="h-4 w-4" />
              Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single User Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Message
            </DialogTitle>
            <DialogDescription>
              Send an email to {selectedRequest?.name} ({selectedRequest?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Recipient info */}
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">To: </span>
                  <span className="font-medium">{selectedRequest?.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  <span className="font-medium">{selectedRequest?.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Company: </span>
                  <span className="font-medium">{selectedRequest?.company}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  {selectedRequest && getStatusBadge(selectedRequest.status)}
                </div>
              </div>
            </div>

            {/* Event Code Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-teal-600" />
                Include Event Code
              </Label>
              <Select value={selectedCodeToSend} onValueChange={setSelectedCodeToSend}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an event code to include" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No code - send message only</SelectItem>
                  {eventCodes.map((ec) => (
                    <SelectItem key={ec.id} value={ec.code}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{ec.code}</span>
                        <span className="text-muted-foreground text-xs">
                          ({ec.current_uses}/{ec.max_uses || '\u221E'} uses)
                        </span>
                        {ec.description && (
                          <span className="text-muted-foreground text-xs">- {ec.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCodeToSend !== 'none' && (
                <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2">
                  <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                  <span className="text-sm text-teal-700 dark:text-teal-300">Code </span>
                  <code className="font-mono font-bold text-teal-800 dark:text-teal-200 bg-teal-100 dark:bg-teal-800/50 px-2 py-0.5 rounded text-sm">
                    {selectedCodeToSend}
                  </code>
                  <span className="text-sm text-teal-700 dark:text-teal-300">will be included in the email</span>
                </div>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                placeholder="e.g., Your XYREG Genesis Access Code"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Write your message here..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                The message will be sent as a formatted email with XYREG branding.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendMessage} disabled={isSending} className="gap-2">
              {isSending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Message Dialog */}
      <Dialog open={isBulkMessageDialogOpen} onOpenChange={setIsBulkMessageDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Bulk Message
            </DialogTitle>
            <DialogDescription>
              Send an email to {selectedIds.size} selected user{selectedIds.size > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Recipients list */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Recipients ({selectedIds.size}):</p>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-auto">
                {requests
                  .filter(r => selectedIds.has(r.id))
                  .map(r => (
                    <Badge key={r.id} variant="secondary" className="text-xs">
                      {r.name}
                    </Badge>
                  ))}
              </div>
            </div>

            {/* Event Code Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-teal-600" />
                Include Event Code
              </Label>
              <Select value={selectedCodeToSend} onValueChange={setSelectedCodeToSend}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an event code to include" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No code - send message only</SelectItem>
                  {eventCodes.map((ec) => (
                    <SelectItem key={ec.id} value={ec.code}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{ec.code}</span>
                        <span className="text-muted-foreground text-xs">
                          ({ec.current_uses}/{ec.max_uses || '\u221E'} uses)
                        </span>
                        {ec.description && (
                          <span className="text-muted-foreground text-xs">- {ec.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCodeToSend !== 'none' && (
                <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2">
                  <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                  <span className="text-sm text-teal-700 dark:text-teal-300">Code </span>
                  <code className="font-mono font-bold text-teal-800 dark:text-teal-200 bg-teal-100 dark:bg-teal-800/50 px-2 py-0.5 rounded text-sm">
                    {selectedCodeToSend}
                  </code>
                  <span className="text-sm text-teal-700 dark:text-teal-300">will be sent to all recipients</span>
                </div>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                placeholder="e.g., Your XYREG Genesis Access Code"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Write your message here..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                Each user will receive a personalized email with their name.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkMessageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendBulkMessage} disabled={isSending} className="gap-2">
              {isSending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send to {selectedIds.size} User{selectedIds.size > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
