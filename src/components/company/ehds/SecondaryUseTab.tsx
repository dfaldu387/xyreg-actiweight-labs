import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface DataPermit {
  id: string;
  permit_reference: string;
  hdab_name: string;
  hdab_country: string | null;
  researcher_organization: string | null;
  purpose: string | null;
  permit_status: string;
  approved_at: string | null;
  expires_at: string | null;
  trade_secret_review: any;
  created_at: string;
}

interface SecondaryUseTabProps {
  companyId: string | null;
}

const STATUSES = ['received', 'under_review', 'approved', 'rejected', 'data_released'] as const;

export function SecondaryUseTab({ companyId }: SecondaryUseTabProps) {
  const [permits, setPermits] = useState<DataPermit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPermit, setNewPermit] = useState({ permit_reference: '', hdab_name: '', hdab_country: '', researcher_organization: '', purpose: '' });
  const { toast } = useToast();

  useEffect(() => {
    if (companyId) fetchPermits();
  }, [companyId]);

  const fetchPermits = async () => {
    if (!companyId) return;
    setIsLoading(true);
    const { data } = await supabase.from('ehds_data_permits').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    setPermits(data || []);
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!companyId || !newPermit.permit_reference.trim() || !newPermit.hdab_name.trim()) return;
    const { error } = await supabase.from('ehds_data_permits').insert({
      company_id: companyId,
      ...newPermit,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Data permit created' });
      setNewPermit({ permit_reference: '', hdab_name: '', hdab_country: '', researcher_organization: '', purpose: '' });
      setIsDialogOpen(false);
      fetchPermits();
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const updates: any = { permit_status: newStatus };
    if (newStatus === 'approved') updates.approved_at = new Date().toISOString();
    const { error } = await supabase.from('ehds_data_permits').update(updates).eq('id', id);
    if (!error) {
      toast({ title: `Status updated to ${newStatus.replace('_', ' ')}` });
      fetchPermits();
    }
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      received: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      data_released: 'bg-purple-100 text-purple-800',
    };
    return map[status] || '';
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Secondary Use Gatekeeper</h3>
          <p className="text-sm text-muted-foreground">Track and manage HDAB data permits for secondary research use</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Permit</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register Data Permit</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Permit Reference *</Label><Input value={newPermit.permit_reference} onChange={e => setNewPermit(p => ({ ...p, permit_reference: e.target.value }))} placeholder="e.g. HDAB-2026-0042" /></div>
              <div><Label>HDAB Name *</Label><Input value={newPermit.hdab_name} onChange={e => setNewPermit(p => ({ ...p, hdab_name: e.target.value }))} placeholder="e.g. Finnish Health Data Authority" /></div>
              <div><Label>Country</Label><Input value={newPermit.hdab_country} onChange={e => setNewPermit(p => ({ ...p, hdab_country: e.target.value }))} placeholder="e.g. Finland" /></div>
              <div><Label>Researcher Organization</Label><Input value={newPermit.researcher_organization} onChange={e => setNewPermit(p => ({ ...p, researcher_organization: e.target.value }))} placeholder="e.g. University of Helsinki" /></div>
              <div><Label>Purpose</Label><Textarea value={newPermit.purpose} onChange={e => setNewPermit(p => ({ ...p, purpose: e.target.value }))} placeholder="Describe the research purpose..." /></div>
              <Button onClick={handleCreate} disabled={!newPermit.permit_reference.trim() || !newPermit.hdab_name.trim()} className="w-full">Create Permit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {permits.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h4 className="font-medium mb-1">No data permits</h4>
          <p className="text-sm text-muted-foreground">When an HDAB submits a data access request, register it here</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {permits.map(p => (
            <Card key={p.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.permit_reference}</span>
                      <Badge className={statusColor(p.permit_status)}>{p.permit_status.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{p.hdab_name}{p.hdab_country ? ` (${p.hdab_country})` : ''}</p>
                    {p.researcher_organization && <p className="text-xs text-muted-foreground">Researcher: {p.researcher_organization}</p>}
                    {p.purpose && <p className="text-xs text-muted-foreground line-clamp-1">Purpose: {p.purpose}</p>}
                  </div>
                  <Select value={p.permit_status} onValueChange={v => updateStatus(p.id, v)}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
