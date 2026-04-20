import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileCheck, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

// EHDS Annex II checklist items (simplified)
const EHDS_CHECKLIST = [
  { id: 'interoperability', label: 'System supports EEHRxF interoperability requirements' },
  { id: 'data_quality', label: 'Data quality and accuracy mechanisms are in place' },
  { id: 'security_measures', label: 'Cybersecurity measures meet EHDS requirements' },
  { id: 'logging', label: 'Logging of data access and transfers is implemented' },
  { id: 'user_information', label: 'Clear information provided to users about data processing' },
  { id: 'opt_out', label: 'Opt-out mechanism for secondary use is available' },
  { id: 'identification', label: 'Unique identification system (UDI) is assigned' },
  { id: 'eu_declaration', label: 'EU Declaration of Conformity for EHDS is prepared' },
  { id: 'technical_documentation', label: 'Technical documentation per Annex II is maintained' },
  { id: 'conformity_marking', label: 'Conformity marking requirements are met' },
];

interface Declaration {
  id: string;
  declaration_version: string;
  checklist_responses: any;
  overall_status: string;
  declaration_generated_at: string | null;
  signed_by: string | null;
  signed_at: string | null;
  product_id: string | null;
  created_at: string;
}

interface SelfDeclarationTabProps {
  companyId: string | null;
}

export function SelfDeclarationTab({ companyId }: SelfDeclarationTabProps) {
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeDeclaration, setActiveDeclaration] = useState<Declaration | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (companyId) fetchDeclarations();
  }, [companyId]);

  const fetchDeclarations = async () => {
    if (!companyId) return;
    setIsLoading(true);
    const { data } = await supabase.from('ehds_self_declarations').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    setDeclarations(data || []);
    setIsLoading(false);
  };

  const handleCreateNew = async () => {
    if (!companyId) return;
    const initialResponses: Record<string, boolean> = {};
    EHDS_CHECKLIST.forEach(item => { initialResponses[item.id] = false; });
    const { error } = await supabase.from('ehds_self_declarations').insert({
      company_id: companyId,
      declaration_version: '1.0',
      checklist_responses: initialResponses,
      overall_status: 'not_started',
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Declaration created' });
      fetchDeclarations();
    }
  };

  const openChecklist = (decl: Declaration) => {
    setActiveDeclaration(decl);
    setChecklist(decl.checklist_responses || {});
    setIsDialogOpen(true);
  };

  const handleChecklistSave = async () => {
    if (!activeDeclaration) return;
    const completedCount = Object.values(checklist).filter(Boolean).length;
    const total = EHDS_CHECKLIST.length;
    let status = 'not_started';
    if (completedCount === total) status = 'compliant';
    else if (completedCount > 0) status = 'in_progress';

    const { error } = await supabase.from('ehds_self_declarations').update({
      checklist_responses: checklist,
      overall_status: status,
    }).eq('id', activeDeclaration.id);
    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Checklist saved' });
      setIsDialogOpen(false);
      fetchDeclarations();
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
      not_started: { variant: 'outline', label: 'Not Started' },
      in_progress: { variant: 'secondary', label: 'In Progress' },
      compliant: { variant: 'default', label: 'Compliant' },
      non_compliant: { variant: 'destructive', label: 'Non-Compliant' },
    };
    const cfg = map[status] || map.not_started;
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  const getCompletionCount = (responses: Record<string, boolean>) => {
    return Object.values(responses || {}).filter(Boolean).length;
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Self-Declaration Dashboard</h3>
          <p className="text-sm text-muted-foreground">EHDS Annex II self-declaration of conformity checklist</p>
        </div>
        <Button size="sm" onClick={handleCreateNew}><Plus className="h-4 w-4 mr-1" /> New Declaration</Button>
      </div>

      {declarations.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h4 className="font-medium mb-1">No self-declarations</h4>
          <p className="text-sm text-muted-foreground">Create a declaration to start the EHDS conformity assessment</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {declarations.map(d => {
            const completed = getCompletionCount(d.checklist_responses);
            return (
              <Card key={d.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => openChecklist(d)}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Declaration v{d.declaration_version}</span>
                      {statusBadge(d.overall_status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {completed}/{EHDS_CHECKLIST.length} requirements met • Created {new Date(d.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); openChecklist(d); }}>Review Checklist</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>EHDS Annex II Conformity Checklist</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {EHDS_CHECKLIST.map(item => (
              <div key={item.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                <Checkbox
                  id={item.id}
                  checked={checklist[item.id] || false}
                  onCheckedChange={checked => setChecklist(prev => ({ ...prev, [item.id]: !!checked }))}
                />
                <label htmlFor={item.id} className="text-sm cursor-pointer leading-snug">{item.label}</label>
              </div>
            ))}
          </div>
          <Button onClick={handleChecklistSave} className="w-full mt-4">Save Checklist</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
