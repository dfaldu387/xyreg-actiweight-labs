import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface AnonProfile {
  id: string;
  profile_name: string;
  dataset_id: string;
  pii_fields_stripped: any;
  method: string;
  template_used: string;
  privacy_score: number;
  last_applied_at: string | null;
}

interface Dataset {
  id: string;
  name: string;
}

interface AnonymizationLabTabProps {
  companyId: string | null;
}

export function AnonymizationLabTab({ companyId }: AnonymizationLabTabProps) {
  const [profiles, setProfiles] = useState<AnonProfile[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProfile, setNewProfile] = useState({ profile_name: '', dataset_id: '', method: 'anonymized', template_used: 'gdpr_standard', pii_fields: '' });
  const { toast } = useToast();

  useEffect(() => {
    if (companyId) {
      fetchProfiles();
      supabase.from('ehds_datasets').select('id, name').eq('company_id', companyId).then(({ data }) => setDatasets(data || []));
    }
  }, [companyId]);

  const fetchProfiles = async () => {
    if (!companyId) return;
    setIsLoading(true);
    const { data } = await supabase.from('ehds_anonymization_profiles').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    setProfiles(data || []);
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!companyId || !newProfile.profile_name.trim() || !newProfile.dataset_id) return;
    const piiFields = newProfile.pii_fields.split(',').map(f => f.trim()).filter(Boolean);
    const privacyScore = Math.min(100, piiFields.length * 15);
    const { error } = await supabase.from('ehds_anonymization_profiles').insert({
      company_id: companyId,
      dataset_id: newProfile.dataset_id,
      profile_name: newProfile.profile_name,
      method: newProfile.method,
      template_used: newProfile.template_used,
      pii_fields_stripped: piiFields,
      privacy_score: privacyScore,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile created' });
      setNewProfile({ profile_name: '', dataset_id: '', method: 'anonymized', template_used: 'gdpr_standard', pii_fields: '' });
      setIsDialogOpen(false);
      fetchProfiles();
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDatasetName = (id: string) => datasets.find(d => d.id === id)?.name || 'Unknown';

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Anonymization Lab</h3>
          <p className="text-sm text-muted-foreground">Configure PII stripping templates and assess privacy scores for datasets</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Profile</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Anonymization Profile</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Profile Name *</Label><Input value={newProfile.profile_name} onChange={e => setNewProfile(p => ({ ...p, profile_name: e.target.value }))} placeholder="e.g. Standard GDPR Strip" /></div>
              <div><Label>Dataset *</Label>
                <Select value={newProfile.dataset_id} onValueChange={v => setNewProfile(p => ({ ...p, dataset_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select dataset..." /></SelectTrigger>
                  <SelectContent>{datasets.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Method</Label>
                <Select value={newProfile.method} onValueChange={v => setNewProfile(p => ({ ...p, method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anonymized">Anonymized</SelectItem>
                    <SelectItem value="pseudonymized">Pseudonymized</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Template</Label>
                <Select value={newProfile.template_used} onValueChange={v => setNewProfile(p => ({ ...p, template_used: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gdpr_standard">GDPR Standard</SelectItem>
                    <SelectItem value="ehds_standard">EHDS Standard</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>PII Fields to Strip (comma-separated)</Label><Input value={newProfile.pii_fields} onChange={e => setNewProfile(p => ({ ...p, pii_fields: e.target.value }))} placeholder="e.g. name, date_of_birth, national_id, email" /></div>
              <Button onClick={handleCreate} disabled={!newProfile.profile_name.trim() || !newProfile.dataset_id} className="w-full">Create Profile</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {profiles.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h4 className="font-medium mb-1">No anonymization profiles</h4>
          <p className="text-sm text-muted-foreground">Create profiles to define how PII is stripped from datasets before sharing</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {profiles.map(p => {
            const fields = Array.isArray(p.pii_fields_stripped) ? p.pii_fields_stripped : [];
            return (
              <Card key={p.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.profile_name}</span>
                        <Badge variant="outline">{p.method}</Badge>
                        <Badge variant="secondary">{p.template_used.replace('_', ' ')}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Dataset: {getDatasetName(p.dataset_id)}</p>
                      {fields.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {fields.map((f: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{f}</Badge>)}
                        </div>
                      )}
                    </div>
                    <div className="text-center min-w-[80px]">
                      <div className={`text-2xl font-bold ${scoreColor(p.privacy_score)}`}>{p.privacy_score}</div>
                      <div className="text-xs text-muted-foreground">Privacy Score</div>
                      <Progress value={p.privacy_score} className="h-1.5 mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
