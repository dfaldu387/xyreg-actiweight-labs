import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, ArrowRightLeft, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface FieldMapping {
  id: string;
  internal_field_name: string;
  internal_field_path: string | null;
  eehrxf_standard_field: string | null;
  fhir_resource_type: string | null;
  fhir_field_path: string | null;
  mapping_status: string;
  transformation_notes: string | null;
}

interface Dataset {
  id: string;
  name: string;
}

interface TranslationLayerTabProps {
  companyId: string | null;
}

export function TranslationLayerTab({ companyId }: TranslationLayerTabProps) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMapping, setNewMapping] = useState({ internal_field_name: '', eehrxf_standard_field: '', fhir_resource_type: '', fhir_field_path: '' });
  const { toast } = useToast();

  useEffect(() => {
    if (companyId) {
      supabase.from('ehds_datasets').select('id, name').eq('company_id', companyId).then(({ data }) => {
        setDatasets(data || []);
      });
    }
  }, [companyId]);

  useEffect(() => {
    if (selectedDatasetId) fetchMappings();
  }, [selectedDatasetId]);

  const fetchMappings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('ehds_field_mappings')
      .select('*')
      .eq('dataset_id', selectedDatasetId)
      .order('created_at');
    if (!error) setMappings(data || []);
    setIsLoading(false);
  };

  const handleAddMapping = async () => {
    if (!companyId || !selectedDatasetId || !newMapping.internal_field_name.trim()) return;
    const mappingStatus = newMapping.eehrxf_standard_field ? 'mapped' : 'unmapped';
    const { error } = await supabase.from('ehds_field_mappings').insert({
      company_id: companyId,
      dataset_id: selectedDatasetId,
      internal_field_name: newMapping.internal_field_name,
      eehrxf_standard_field: newMapping.eehrxf_standard_field || null,
      fhir_resource_type: newMapping.fhir_resource_type || null,
      fhir_field_path: newMapping.fhir_field_path || null,
      mapping_status: mappingStatus,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Mapping added' });
      setNewMapping({ internal_field_name: '', eehrxf_standard_field: '', fhir_resource_type: '', fhir_field_path: '' });
      setIsDialogOpen(false);
      fetchMappings();
    }
  };

  const exportFHIR = () => {
    const bundle = {
      resourceType: 'Bundle',
      type: 'collection',
      entry: mappings.filter(m => m.fhir_resource_type).map(m => ({
        resource: {
          resourceType: m.fhir_resource_type,
          _mapping: { internalField: m.internal_field_name, fhirPath: m.fhir_field_path, eehrxfField: m.eehrxf_standard_field },
        },
      })),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'FHIR_Mapping_Export.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'FHIR mapping exported' });
  };

  const mappedCount = mappings.filter(m => m.mapping_status === 'mapped' || m.mapping_status === 'verified').length;
  const completeness = mappings.length > 0 ? Math.round((mappedCount / mappings.length) * 100) : 0;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'verified': return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'mapped': return <Badge className="bg-blue-100 text-blue-800">Mapped</Badge>;
      default: return <Badge variant="outline">Unmapped</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Translation Layer</h3>
          <p className="text-sm text-muted-foreground">Map internal database fields to EEHRxF / HL7 FHIR standards</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
            <SelectTrigger className="w-[240px]"><SelectValue placeholder="Select a dataset..." /></SelectTrigger>
            <SelectContent>
              {datasets.map(ds => <SelectItem key={ds.id} value={ds.id}>{ds.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedDatasetId && (
        <>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Mapping Completeness</span>
                <span className="font-medium">{completeness}%</span>
              </div>
              <Progress value={completeness} className="h-2" />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Mapping</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Field Mapping</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Internal Field Name *</Label><Input value={newMapping.internal_field_name} onChange={e => setNewMapping(p => ({ ...p, internal_field_name: e.target.value }))} placeholder="e.g. patient_ankle_rom" /></div>
                  <div><Label>EEHRxF Standard Field</Label><Input value={newMapping.eehrxf_standard_field} onChange={e => setNewMapping(p => ({ ...p, eehrxf_standard_field: e.target.value }))} placeholder="e.g. Observation.value" /></div>
                  <div><Label>FHIR Resource Type</Label><Input value={newMapping.fhir_resource_type} onChange={e => setNewMapping(p => ({ ...p, fhir_resource_type: e.target.value }))} placeholder="e.g. Observation" /></div>
                  <div><Label>FHIR Field Path</Label><Input value={newMapping.fhir_field_path} onChange={e => setNewMapping(p => ({ ...p, fhir_field_path: e.target.value }))} placeholder="e.g. Observation.valueQuantity.value" /></div>
                  <Button onClick={handleAddMapping} disabled={!newMapping.internal_field_name.trim()} className="w-full">Add Mapping</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button size="sm" variant="outline" onClick={exportFHIR} disabled={mappings.length === 0}>
              <Download className="h-4 w-4 mr-1" /> Export FHIR
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : mappings.length === 0 ? (
            <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ArrowRightLeft className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h4 className="font-medium mb-1">No field mappings yet</h4>
              <p className="text-sm text-muted-foreground">Add your internal database fields and map them to EEHRxF/FHIR standards</p>
            </CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50"><tr>
                  <th className="text-left p-3 font-medium">Internal Field</th>
                  <th className="text-left p-3 font-medium">EEHRxF Field</th>
                  <th className="text-left p-3 font-medium">FHIR Resource</th>
                  <th className="text-left p-3 font-medium">FHIR Path</th>
                  <th className="text-left p-3 font-medium">Status</th>
                </tr></thead>
                <tbody>
                  {mappings.map(m => (
                    <tr key={m.id} className="border-t hover:bg-muted/25">
                      <td className="p-3 font-mono text-xs">{m.internal_field_name}</td>
                      <td className="p-3 text-xs">{m.eehrxf_standard_field || '—'}</td>
                      <td className="p-3 text-xs">{m.fhir_resource_type || '—'}</td>
                      <td className="p-3 font-mono text-xs">{m.fhir_field_path || '—'}</td>
                      <td className="p-3">{statusBadge(m.mapping_status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!selectedDatasetId && (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ArrowRightLeft className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h4 className="font-medium mb-1">Select a dataset to begin mapping</h4>
          <p className="text-sm text-muted-foreground">Choose a dataset from the dropdown above to map its fields to EEHRxF/FHIR standards</p>
        </CardContent></Card>
      )}
    </div>
  );
}
