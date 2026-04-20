import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, AlertCircle, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Dataset {
  id: string;
  name: string;
  description: string | null;
  data_categories: any;
  collection_method: string | null;
  data_format: string | null;
  volume_estimate: string | null;
  status: string;
  accuracy_check_due_at: string | null;
  accuracy_last_checked_at: string | null;
  created_at: string;
}

interface DatasetLibraryTabProps {
  companyId: string | null;
}

export function DatasetLibraryTab({ companyId }: DatasetLibraryTabProps) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDataset, setNewDataset] = useState({ name: '', description: '', collection_method: '', data_format: '', volume_estimate: '', status: 'draft' });
  const { toast } = useToast();

  useEffect(() => {
    if (companyId) fetchDatasets();
  }, [companyId]);

  const fetchDatasets = async () => {
    if (!companyId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('ehds_datasets')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error loading datasets', description: error.message, variant: 'destructive' });
    } else {
      setDatasets(data || []);
    }
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!companyId || !newDataset.name.trim()) return;
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('ehds_datasets').insert({
      company_id: companyId,
      name: newDataset.name,
      description: newDataset.description || null,
      collection_method: newDataset.collection_method || null,
      data_format: newDataset.data_format || null,
      volume_estimate: newDataset.volume_estimate || null,
      status: newDataset.status,
      created_by: userData?.user?.id || null,
    });
    if (error) {
      toast({ title: 'Error creating dataset', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Dataset created' });
      setNewDataset({ name: '', description: '', collection_method: '', data_format: '', volume_estimate: '', status: 'draft' });
      setIsDialogOpen(false);
      fetchDatasets();
    }
  };

  const exportHealthDCAT = (dataset: Dataset) => {
    const healthdcat = {
      '@context': 'https://semiceu.github.io/DCAT-AP/releases/3.0.0/context.jsonld',
      '@type': 'dcat:Dataset',
      'dct:title': dataset.name,
      'dct:description': dataset.description || '',
      'dcat:theme': dataset.data_categories || [],
      'dct:format': dataset.data_format || 'Unknown',
      'dcat:contactPoint': { '@type': 'vcard:Organization' },
    };
    const blob = new Blob([JSON.stringify(healthdcat, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.name.replace(/\s+/g, '_')}_HealthDCAT-AP.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'HealthDCAT-AP exported' });
  };

  const isAccuracyOverdue = (dueAt: string | null) => {
    if (!dueAt) return false;
    return new Date(dueAt) < new Date();
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'outline';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Dataset Library</h3>
          <p className="text-sm text-muted-foreground">Catalog your device data per EHDS Article 33 — auto-formatted to HealthDCAT-AP</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Dataset</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register New Dataset</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Dataset Name *</Label><Input value={newDataset.name} onChange={e => setNewDataset(p => ({ ...p, name: e.target.value }))} placeholder="e.g. WearNGo Ankle ROM Data" /></div>
              <div><Label>Description</Label><Textarea value={newDataset.description} onChange={e => setNewDataset(p => ({ ...p, description: e.target.value }))} placeholder="Describe the health data collected..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Collection Method</Label><Input value={newDataset.collection_method} onChange={e => setNewDataset(p => ({ ...p, collection_method: e.target.value }))} placeholder="e.g. IoT sensor" /></div>
                <div><Label>Data Format</Label><Input value={newDataset.data_format} onChange={e => setNewDataset(p => ({ ...p, data_format: e.target.value }))} placeholder="e.g. HL7 FHIR, CSV" /></div>
              </div>
              <div><Label>Volume Estimate</Label><Input value={newDataset.volume_estimate} onChange={e => setNewDataset(p => ({ ...p, volume_estimate: e.target.value }))} placeholder="e.g. ~10,000 records/year" /></div>
              <div><Label>Status</Label>
                <Select value={newDataset.status} onValueChange={v => setNewDataset(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={!newDataset.name.trim()} className="w-full">Create Dataset</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {datasets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h4 className="font-medium mb-1">No datasets registered</h4>
            <p className="text-sm text-muted-foreground mb-4">Start by cataloging the health data your devices collect</p>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add First Dataset</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {datasets.map(ds => (
            <Card key={ds.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ds.name}</span>
                    <Badge variant={statusColor(ds.status)}>{ds.status}</Badge>
                    {isAccuracyOverdue(ds.accuracy_check_due_at) && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Accuracy Check Overdue
                      </Badge>
                    )}
                  </div>
                  {ds.description && <p className="text-sm text-muted-foreground line-clamp-1">{ds.description}</p>}
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {ds.collection_method && <span>Method: {ds.collection_method}</span>}
                    {ds.data_format && <span>Format: {ds.data_format}</span>}
                    {ds.volume_estimate && <span>Volume: {ds.volume_estimate}</span>}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportHealthDCAT(ds)}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Export HealthDCAT-AP
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
