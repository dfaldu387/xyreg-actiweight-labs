import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, Building2 } from 'lucide-react';

interface CompanyInfo {
  id: string;
  name: string;
  productCount: number;
  hasScopes: boolean;
}

interface SyncResult {
  scopeKey: string;
  productsUpdated: number;
  entriesMirrored: number;
}

const SCOPE_KEYS = [
  { key: 'classification_exclusion_scopes', label: 'Field Scopes (Device Applicability)' },
  { key: 'feature_exclusion_scopes', label: 'Feature Scopes' },
  { key: 'component_exclusion_scopes', label: 'Component Scopes' },
  { key: 'hazard_exclusion_scopes', label: 'Hazard Scopes' },
  { key: 'document_ci_exclusion_scopes', label: 'Document CI Scopes' },
];

export default function DeviceApplicabilitySyncTool() {
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [results, setResults] = useState<SyncResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load companies with scope data info
  const loadCompanies = async () => {
    setIsLoadingCompanies(true);
    try {
      const { data: allProducts, error: err } = await supabase
        .from('products')
        .select('id, company_id, field_scope_overrides, companies!inner(name)')
        .eq('is_archived', false)
        .not('company_id', 'is', null);

      if (err) throw err;

      // Group by company
      const companyMap = new Map<string, { name: string; products: any[] }>();
      for (const p of (allProducts || [])) {
        const companyId = p.company_id as string;
        const companyName = (p as any).companies?.name || 'Unknown';
        if (!companyMap.has(companyId)) {
          companyMap.set(companyId, { name: companyName, products: [] });
        }
        companyMap.get(companyId)!.products.push(p);
      }

      const companiesList: CompanyInfo[] = [];
      for (const [id, info] of companyMap) {
        const hasScopes = info.products.some((p: any) => {
          const overrides = p.field_scope_overrides;
          if (!overrides || typeof overrides !== 'object') return false;
          return SCOPE_KEYS.some(sk => {
            const scopes = overrides[sk.key];
            return scopes && typeof scopes === 'object' && Object.keys(scopes).length > 0;
          });
        });
        companiesList.push({
          id,
          name: info.name,
          productCount: info.products.length,
          hasScopes,
        });
      }

      companiesList.sort((a, b) => a.name.localeCompare(b.name));
      setCompanies(companiesList);
    } catch (e: any) {
      setError(e.message || 'Failed to load companies');
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  useEffect(() => { loadCompanies(); }, []);

  const handleSync = async () => {
    if (!selectedCompany) return;
    setIsSyncing(true);
    setResults(null);
    setError(null);

    try {
      // Get all products for this company
      const { data: products, error: err } = await supabase
        .from('products')
        .select('id, field_scope_overrides')
        .eq('company_id', selectedCompany)
        .eq('is_archived', false);

      if (err) throw err;
      if (!products || products.length === 0) {
        setError('No products found for this company');
        return;
      }

      const syncResults: SyncResult[] = [];

      // Build a mutable copy of each product's overrides to accumulate all changes
      const productOverrides = new Map<string, Record<string, any>>();
      for (const product of products) {
        productOverrides.set(product.id, { ...((product.field_scope_overrides as Record<string, any>) || {}) });
      }

      for (const sk of SCOPE_KEYS) {
        // Merge all scope entries across all products for this scope key
        const mergedScopes: Record<string, any> = {};

        for (const product of products) {
          const overrides = productOverrides.get(product.id)!;
          const scopes = overrides[sk.key];
          if (!scopes || typeof scopes !== 'object') continue;

          for (const [itemKey, itemScope] of Object.entries(scopes)) {
            if (!mergedScopes[itemKey]) {
              // Ensure isManualGroup flag is set so auto-sync won't overwrite it
              mergedScopes[itemKey] = { ...(itemScope as any), isManualGroup: true };
            }
          }
        }

        if (Object.keys(mergedScopes).length === 0) {
          syncResults.push({ scopeKey: sk.label, productsUpdated: 0, entriesMirrored: 0 });
          continue;
        }

        // Apply merged scopes to the in-memory overrides (no DB write yet)
        let productsUpdated = 0;
        let totalEntriesMirrored = 0;

        for (const product of products) {
          const overrides = productOverrides.get(product.id)!;
          const existingScopes = { ...(overrides[sk.key] || {}) };

          let updated = false;
          let entriesAdded = 0;
          for (const [itemKey, itemScope] of Object.entries(mergedScopes)) {
            if (!existingScopes[itemKey]) {
              existingScopes[itemKey] = itemScope;
              updated = true;
              entriesAdded++;
            }
          }

          if (updated) {
            overrides[sk.key] = existingScopes;
            productsUpdated++;
            totalEntriesMirrored += entriesAdded;
          }
        }

        syncResults.push({
          scopeKey: sk.label,
          productsUpdated,
          entriesMirrored: totalEntriesMirrored,
        });
      }

      // Write all accumulated changes in a single PATCH per product
      for (const product of products) {
        const overrides = productOverrides.get(product.id)!;
        const original = (product.field_scope_overrides as Record<string, any>) || {};
        if (JSON.stringify(overrides) !== JSON.stringify(original)) {
          await supabase
            .from('products')
            .update({ field_scope_overrides: overrides } as any)
            .eq('id', product.id);
        }
      }

      setResults(syncResults);
    } catch (e: any) {
      setError(e.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const selectedCompanyInfo = companies.find(c => c.id === selectedCompany);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Device Applicability Scope Sync
        </CardTitle>
        <CardDescription>
          Mirror Device Applicability scope data to all family members within a company.
          Previously, scope data was stored on only one product. This tool copies missing scope entries
          to all sibling products so every device sees the same group membership.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Company</label>
          <div className="flex items-center gap-3">
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-[400px]">
                <SelectValue placeholder={isLoadingCompanies ? 'Loading companies...' : 'Select a company'} />
              </SelectTrigger>
              <SelectContent>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{c.name}</span>
                      <Badge variant="outline" className="text-[10px] ml-1">
                        {c.productCount} devices
                      </Badge>
                      {c.hasScopes && (
                        <Badge variant="secondary" className="text-[10px]">
                          has scopes
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={loadCompanies}
              disabled={isLoadingCompanies}
            >
              {isLoadingCompanies ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Company info */}
        {selectedCompanyInfo && (
          <div className="rounded-md border p-3 bg-muted/30">
            <div className="text-sm">
              <strong>{selectedCompanyInfo.name}</strong> — {selectedCompanyInfo.productCount} devices
              {selectedCompanyInfo.hasScopes
                ? <Badge className="ml-2 text-[10px] bg-amber-100 text-amber-800 border-amber-300" variant="outline">Has existing scope data</Badge>
                : <Badge className="ml-2 text-[10px]" variant="outline">No scope data</Badge>
              }
            </div>
          </div>
        )}

        {/* Sync button */}
        <Button
          onClick={handleSync}
          disabled={!selectedCompany || isSyncing}
        >
          {isSyncing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {isSyncing ? 'Syncing...' : 'Run Scope Sync'}
        </Button>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Sync Complete
            </h4>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium">Scope Type</th>
                    <th className="text-right p-2 font-medium">Products Updated</th>
                    <th className="text-right p-2 font-medium">Entries Mirrored</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-2">{r.scopeKey}</td>
                      <td className="p-2 text-right">
                        {r.productsUpdated > 0
                          ? <Badge className="bg-green-100 text-green-800 border-green-300" variant="outline">{r.productsUpdated}</Badge>
                          : <span className="text-muted-foreground">0</span>
                        }
                      </td>
                      <td className="p-2 text-right">
                        {r.entriesMirrored > 0
                          ? <Badge className="bg-blue-100 text-blue-800 border-blue-300" variant="outline">{r.entriesMirrored}</Badge>
                          : <span className="text-muted-foreground">0</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {results.every(r => r.productsUpdated === 0) && (
              <p className="text-sm text-muted-foreground">All products already have consistent scope data. Nothing to sync.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
