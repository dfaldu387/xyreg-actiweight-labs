import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, RotateCcw, AlertTriangle, CheckCircle2, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  seedAcmeDemo,
  resetAcmeDemo,
  isAlreadySeeded,
  getSeedSummary,
} from '@/services/demo-seeder';

interface CompanyOption {
  id: string;
  name: string;
}

interface SummaryState {
  counts: Record<string, number>;
  lastAt: string | null;
  lastBy: string | null;
  total: number;
}

export default function SuperAdminDemoSeeder() {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [progressTotal, setProgressTotal] = useState(0);
  const [summary, setSummary] = useState<SummaryState | null>(null);
  const [alreadySeeded, setAlreadySeeded] = useState(false);

  // Load companies
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('companies')
        .select('id, name')
        .ilike('name', '%ltd%')
        .order('name');
      const list = (data || []) as CompanyOption[];
      setCompanies(list);
      // Default to Acme ltd
      const acme = list.find((c) => c.name === 'Acme ltd');
      if (acme) setCompanyId(acme.id);
      else if (list[0]) setCompanyId(list[0].id);
    })();
  }, []);

  // Refresh summary when company changes
  useEffect(() => {
    if (!companyId) return;
    refreshSummary(companyId);
  }, [companyId]);

  async function refreshSummary(id: string) {
    const seeded = await isAlreadySeeded(id);
    setAlreadySeeded(seeded);
    if (seeded) {
      const s = await getSeedSummary(id);
      setSummary(s);
    } else {
      setSummary(null);
    }
  }

  async function handleSeed() {
    if (!companyId) return;
    if (alreadySeeded) {
      const ok = window.confirm(
        'This company already has demo data. Reset it first to re-seed cleanly. Continue with reset + seed?',
      );
      if (!ok) return;
      setResetting(true);
      try {
        await resetAcmeDemo(companyId);
      } finally {
        setResetting(false);
      }
    }

    setRunning(true);
    setProgress(0);
    setProgressLabel('Starting…');
    try {
      const result = await seedAcmeDemo(companyId, (msg, current, total) => {
        setProgressLabel(msg);
        setProgressTotal(total);
        setProgress(Math.round((current / total) * 100));
      });
      toast.success(
        `Demo seeded: ${result.devices} devices, ${result.suppliers} suppliers, ${result.bomItems} BOM items, ${result.hazards} hazards.`,
      );
      await refreshSummary(companyId);
    } catch (e: any) {
      console.error('Seeder failed:', e);
      toast.error(`Seeder failed: ${e.message ?? e}`);
    } finally {
      setRunning(false);
      setProgress(0);
      setProgressLabel('');
    }
  }

  async function handleReset() {
    if (!companyId) return;
    const ok = window.confirm(
      'Delete ALL demo-seeded rows for this company? This will not affect any user-created data.',
    );
    if (!ok) return;
    setResetting(true);
    try {
      const deleted = await resetAcmeDemo(companyId);
      toast.success(`Reset complete — ${deleted} rows deleted.`);
      await refreshSummary(companyId);
    } catch (e: any) {
      toast.error(`Reset failed: ${e.message ?? e}`);
    } finally {
      setResetting(false);
    }
  }

  const selectedCompany = companies.find((c) => c.id === companyId);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" /> Demo Seeder
        </h1>
        <p className="text-muted-foreground">
          Populate a company with rich, hardcoded medical-device demo data — devices, suppliers,
          BOM, hazards, and an activity feed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Target company</CardTitle>
          <CardDescription>
            Limited to companies whose name ends in "ltd" — guard against seeding real customers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger className="w-full md:w-[420px]">
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {alreadySeeded && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>This company already has demo data</AlertTitle>
              <AlertDescription>
                Re-seeding will reset existing demo rows first. User-created data is preserved.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSeed} disabled={running || resetting || !companyId}>
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {running ? 'Seeding…' : alreadySeeded ? 'Reset & re-seed' : 'Seed full demo dataset'}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={!alreadySeeded || running || resetting}>
              {resetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
              Reset demo data
            </Button>
          </div>

          {running && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">{progressLabel}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {summary && summary.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" /> Current demo data
            </CardTitle>
            <CardDescription>
              Tagged as <code className="text-xs">acme-v1</code> for {selectedCompany?.name} · {summary.total} rows
              total
              {summary.lastAt && <> · last seeded {new Date(summary.lastAt).toLocaleString()}</>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.counts).map(([table, count]) => (
                <Badge key={table} variant="secondary" className="text-sm">
                  {table}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Alert variant="default" className="border-amber-500/40 bg-amber-500/5">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle>What gets seeded</AlertTitle>
        <AlertDescription className="text-sm">
          5 devices (3-member AcmeGuard family + AcmePump XR + AcmeStrip One), 8 suppliers
          (Helsinki Polymers, Bavaria Precision, Lyon Sterilization, Osaka Microelectronics, etc.),
          ~60 BOM items linked to suppliers, ~50 hazards with mitigations, and a populated
          activity feed for Mission Control.
        </AlertDescription>
      </Alert>
    </div>
  );
}
