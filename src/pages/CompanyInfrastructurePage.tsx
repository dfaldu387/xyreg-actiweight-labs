import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Building, Server, Wrench, ClipboardList, AlertTriangle, CheckCircle2, Clock, FolderOpen, Search, Plus, Shield, Pencil, Info, ArrowUpCircle, ArrowRight } from 'lucide-react';
import { XyregValidationPanel } from '@/components/infrastructure/XyregValidationPanel';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useCompanyAdoptedRelease } from '@/hooks/useCompanyAdoptedRelease';
import { useAvailableXyregReleases } from '@/hooks/useAvailableXyregReleases';

import { AddAssetDialog } from '@/components/infrastructure/AddAssetDialog';
import { EditAssetDialog } from '@/components/infrastructure/EditAssetDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { buildCompanyBreadcrumbs } from '@/utils/breadcrumbUtils';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/useTranslation';

// --- Types & Mock Data ---

interface InfrastructureAsset {
  id: string;
  name: string;
  type: string;
  location: string;
  validationStatus: 'Validated' | 'Pending' | 'Expired';
  nextInspection: string;
  softwareVersion?: string;
  cybersecurityTier?: string;
  hasEvidence: boolean;
}

const FACILITIES_INITIAL: InfrastructureAsset[] = [
  { id: 'FAC-001', name: 'Munich HQ - Building A', type: 'Office', location: 'Munich, DE', validationStatus: 'Validated', nextInspection: '2026-09-15', hasEvidence: true },
  { id: 'FAC-002', name: 'Cleanroom Suite CR-100', type: 'Cleanroom (ISO 7)', location: 'Munich, DE', validationStatus: 'Validated', nextInspection: '2026-04-20', hasEvidence: true },
  { id: 'FAC-003', name: 'Shenzhen Assembly Plant', type: 'Manufacturing', location: 'Shenzhen, CN', validationStatus: 'Pending', nextInspection: '2026-03-28', hasEvidence: false },
  { id: 'FAC-004', name: 'Boston R&D Lab', type: 'Laboratory', location: 'Boston, US', validationStatus: 'Validated', nextInspection: '2026-07-01', hasEvidence: true },
  { id: 'FAC-005', name: 'Warehouse W-200', type: 'Storage', location: 'Munich, DE', validationStatus: 'Expired', nextInspection: '2026-02-15', hasEvidence: true },
];

const DIGITAL_INITIAL: InfrastructureAsset[] = [
  { id: 'DIG-001', name: 'XYREG Helix OS', type: 'RegOS / QMS', location: 'AWS eu-central-1', validationStatus: 'Validated', nextInspection: '2026-12-01', softwareVersion: 'v2.4.1', cybersecurityTier: 'Tier 1', hasEvidence: true },
  { id: 'DIG-002', name: 'SAP S/4HANA', type: 'ERP / MRP', location: 'Azure West Europe', validationStatus: 'Validated', nextInspection: '2026-06-15', softwareVersion: 'v2023.02', cybersecurityTier: 'Tier 1', hasEvidence: true },
  { id: 'DIG-003', name: 'Jira Service Management', type: 'DevOps / CI-CD', location: 'Atlassian Cloud', validationStatus: 'Pending', nextInspection: '2026-04-10', softwareVersion: 'Cloud', cybersecurityTier: 'Tier 2', hasEvidence: false },
  { id: 'DIG-004', name: 'LabVIEW Test Suite', type: 'MES / Production', location: 'On-premise', validationStatus: 'Validated', nextInspection: '2026-08-30', softwareVersion: 'v2024.Q1', cybersecurityTier: 'Tier 3', hasEvidence: true },
  { id: 'DIG-005', name: 'Azure DevOps', type: 'DevOps / CI-CD', location: 'Azure West Europe', validationStatus: 'Expired', nextInspection: '2026-02-28', softwareVersion: 'Cloud', cybersecurityTier: 'Tier 2', hasEvidence: true },
];

const EQUIPMENT_INITIAL: InfrastructureAsset[] = [
  { id: 'EQP-001', name: 'EtO Sterilization Chamber SC-5000', type: 'Sterilization', location: 'Munich, DE', validationStatus: 'Validated', nextInspection: '2026-05-15', hasEvidence: true },
  { id: 'EQP-002', name: 'CMM Zeiss Contura G2', type: 'Metrology', location: 'Shenzhen, CN', validationStatus: 'Validated', nextInspection: '2026-06-01', hasEvidence: true },
  { id: 'EQP-003', name: 'Instron 5967 Tensile Tester', type: 'Mechanical Testing', location: 'Boston, US', validationStatus: 'Pending', nextInspection: '2026-03-20', hasEvidence: false },
  { id: 'EQP-004', name: 'Particle Counter PC-3400', type: 'Environmental Monitoring', location: 'Munich, DE', validationStatus: 'Validated', nextInspection: '2026-07-10', hasEvidence: true },
];

const MAINTENANCE_INITIAL: InfrastructureAsset[] = [
  { id: 'MNT-001', name: 'HVAC System - CR-100', type: 'Preventive', location: 'Munich, DE', validationStatus: 'Validated', nextInspection: '2026-04-01', hasEvidence: true },
  { id: 'MNT-002', name: 'Fire Suppression Inspection', type: 'Regulatory', location: 'All Sites', validationStatus: 'Pending', nextInspection: '2026-03-15', hasEvidence: false },
  { id: 'MNT-003', name: 'UPS Battery Replacement', type: 'Corrective', location: 'Munich, DE', validationStatus: 'Validated', nextInspection: '2026-09-01', hasEvidence: true },
  { id: 'MNT-004', name: 'Calibration - Zeiss CMM', type: 'Calibration', location: 'Shenzhen, CN', validationStatus: 'Expired', nextInspection: '2026-02-20', hasEvidence: true },
  { id: 'MNT-005', name: 'Waste Management Audit', type: 'Environmental', location: 'Munich, DE', validationStatus: 'Validated', nextInspection: '2026-06-15', hasEvidence: true },
];

function getStatusBadge(status: InfrastructureAsset['validationStatus'], lang: (key: string, variables?: Record<string, string | number>) => string) {
  switch (status) {
    case 'Validated':
      return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />{lang('infrastructure.statusValidated')}</Badge>;
    case 'Pending':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"><Clock className="h-3 w-3 mr-1" />{lang('infrastructure.statusPending')}</Badge>;
    case 'Expired':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200"><AlertTriangle className="h-3 w-3 mr-1" />{lang('infrastructure.statusExpired')}</Badge>;
  }
}

function isExpiringSoon(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return date.getTime() - now.getTime() <= thirtyDays && date.getTime() >= now.getTime();
}

function AssetTable({ data, searchTerm, showDigitalFields, onRowClick, onEdit, lang }: { data: InfrastructureAsset[]; searchTerm: string; showDigitalFields?: boolean; onRowClick?: (asset: InfrastructureAsset) => void; onEdit: (asset: InfrastructureAsset) => void; lang: (key: string, variables?: Record<string, string | number>) => string }) {
  const filtered = useMemo(() => {
    if (!searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter(a =>
      a.name.toLowerCase().includes(lower) ||
      a.type.toLowerCase().includes(lower) ||
      a.location.toLowerCase().includes(lower) ||
      a.id.toLowerCase().includes(lower)
    );
  }, [data, searchTerm]);

  const inspectionHeader = showDigitalFields ? (
    <span className="flex items-center gap-1">
      {lang('infrastructure.nextRevalidation')}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px] text-xs">
            {lang('infrastructure.tooltipSaasRevalidation')}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  ) : lang('infrastructure.nextInspection');

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="font-semibold w-10"></TableHead>
            <TableHead className="font-semibold">{lang('infrastructure.assetId')}</TableHead>
            <TableHead className="font-semibold">{lang('infrastructure.assetName')}</TableHead>
            <TableHead className="font-semibold">{lang('infrastructure.type')}</TableHead>
            <TableHead className="font-semibold">{lang('infrastructure.location')}</TableHead>
            {showDigitalFields && <TableHead className="font-semibold">{lang('infrastructure.version')}</TableHead>}
            {showDigitalFields && <TableHead className="font-semibold">{lang('infrastructure.cyberTier')}</TableHead>}
            <TableHead className="font-semibold">{lang('infrastructure.validationStatus')}</TableHead>
            <TableHead className="font-semibold">{inspectionHeader}</TableHead>
            <TableHead className="font-semibold text-center">{lang('infrastructure.evidence')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showDigitalFields ? 10 : 8} className="text-center text-muted-foreground py-8">
                {lang('infrastructure.noAssetsFound')}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((asset) => (
              <TableRow key={asset.id} className={`${isExpiringSoon(asset.nextInspection) || asset.validationStatus === 'Expired' ? 'bg-red-50/30' : ''} ${onRowClick ? 'cursor-pointer hover:bg-muted/30' : ''}`} onClick={() => onRowClick?.(asset)}>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); onEdit(asset); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{asset.id}</TableCell>
                <TableCell className="font-medium">{asset.name}</TableCell>
                <TableCell className="text-muted-foreground">{asset.type}</TableCell>
                <TableCell className="text-muted-foreground">{asset.location}</TableCell>
                {showDigitalFields && <TableCell className="font-mono text-xs">{asset.softwareVersion || '—'}</TableCell>}
                {showDigitalFields && (
                  <TableCell>
                    {asset.cybersecurityTier ? (
                      <Badge variant="outline" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />{asset.cybersecurityTier}
                      </Badge>
                    ) : '—'}
                  </TableCell>
                )}
                <TableCell>{getStatusBadge(asset.validationStatus, lang)}</TableCell>
                <TableCell className={isExpiringSoon(asset.nextInspection) ? 'text-amber-700 font-medium' : 'text-muted-foreground'}>
                  {asset.nextInspection}
                  {isExpiringSoon(asset.nextInspection) && <span className="ml-1 text-xs">{lang('infrastructure.soon')}</span>}
                </TableCell>
                <TableCell className="text-center">
                  {asset.hasEvidence ? (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800">
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function CompanyInfrastructurePage() {
  const { companyName } = useParams<{ companyName: string }>();
  const { lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('facilities');
  const [validationPanelOpen, setValidationPanelOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState<InfrastructureAsset | null>(null);

  // Release notification
  const companyId = useCompanyId() || '';
  const { data: adoptedRelease } = useCompanyAdoptedRelease(companyId);
  const { data: availableReleases = [] } = useAvailableXyregReleases();
  const latestRelease = availableReleases.length > 0 ? availableReleases[0] : null;
  const hasNewerVersion = latestRelease && (!adoptedRelease || latestRelease.id !== adoptedRelease.release_id);

  const [facilities, setFacilities] = useState(FACILITIES_INITIAL);
  const [digitalSystems, setDigitalSystems] = useState(DIGITAL_INITIAL);
  const [equipment, setEquipment] = useState(EQUIPMENT_INITIAL);
  const [maintenance, setMaintenance] = useState(MAINTENANCE_INITIAL);

  const decodedCompany = decodeURIComponent(companyName || '');
  const breadcrumbs = buildCompanyBreadcrumbs(decodedCompany, 'Infrastructure');

  const tabDataMap: Record<string, { data: InfrastructureAsset[]; set: React.Dispatch<React.SetStateAction<InfrastructureAsset[]>> }> = {
    facilities: { data: facilities, set: setFacilities },
    digital: { data: digitalSystems, set: setDigitalSystems },
    equipment: { data: equipment, set: setEquipment },
    maintenance: { data: maintenance, set: setMaintenance },
  };

  const allAssets = [...facilities, ...digitalSystems, ...equipment, ...maintenance];
  const totalAssets = allAssets.length;
  const validatedCount = allAssets.filter(a => a.validationStatus === 'Validated').length;
  const validatedPct = Math.round((validatedCount / totalAssets) * 100);
  const expiringSoon = allAssets.filter(a => isExpiringSoon(a.nextInspection) || a.validationStatus === 'Expired');

  const handleAddAsset = (asset: InfrastructureAsset) => {
    const { set } = tabDataMap[activeTab];
    set(prev => [...prev, asset]);
  };

  const handleEditAsset = (asset: InfrastructureAsset) => {
    setEditingAsset(asset);
    setShowEditDialog(true);
  };

  const handleUpdateAsset = (updated: InfrastructureAsset) => {
    const { set } = tabDataMap[activeTab];
    set(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  return (
    <div className="space-y-6 p-6">
      <ConsistentPageHeader
        breadcrumbs={breadcrumbs}
        title={lang('infrastructure.title')}
        subtitle={lang('infrastructure.subtitle')}
      />

      {/* New Release Banner */}
      {hasNewerVersion && latestRelease && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ArrowUpCircle className="h-5 w-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    New XYREG version v{latestRelease.version} available
                  </p>
                  <p className="text-xs text-blue-700">
                    Released {new Date(latestRelease.release_date).toLocaleDateString()}
                    {adoptedRelease && <span> — Current: v{adoptedRelease.version}</span>}
                    {!adoptedRelease && <span> — No version adopted yet</span>}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                onClick={() => setValidationPanelOpen(true)}
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Open Validation Package
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">{lang('infrastructure.infrastructureValidated')}</span>
              <span className="text-2xl font-bold text-blue-700">{validatedPct}%</span>
            </div>
            <Progress value={validatedPct} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1.5">{lang('infrastructure.assetsValidated', { validated: validatedCount, total: totalAssets })}</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">{lang('infrastructure.totalAssets')}</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{totalAssets}</p>
            <p className="text-xs text-muted-foreground">{lang('infrastructure.acrossAllCategories')}</p>
          </CardContent>
        </Card>

        <Card className={`${expiringSoon.length > 0 ? 'border-amber-300 bg-amber-50/30' : 'border-muted'}`}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`h-5 w-5 ${expiringSoon.length > 0 ? 'text-amber-600' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium text-amber-800">{lang('infrastructure.riskAlerts')}</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{expiringSoon.length}</p>
            <p className="text-xs text-muted-foreground">{lang('infrastructure.expiringOrExpired')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Alert Details */}
      {expiringSoon.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {lang('infrastructure.upcomingExpirations')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {expiringSoon.map(asset => (
                <div key={asset.id} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-amber-50 border border-amber-100 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">{asset.id}</span>
                    <span className="font-medium">{asset.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(asset.validationStatus, lang)}
                    <span className="text-xs text-muted-foreground">{asset.nextInspection}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between gap-4 mb-4">
          <TabsList className="grid grid-cols-4 w-auto">
            <TabsTrigger value="facilities" className="flex items-center gap-1.5 text-xs">
              <Building className="h-3.5 w-3.5" />{lang('infrastructure.tabFacilities')}
            </TabsTrigger>
            <TabsTrigger value="digital" className="flex items-center gap-1.5 text-xs">
              <Server className="h-3.5 w-3.5" />{lang('infrastructure.tabDigitalSystems')}
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-1.5 text-xs">
              <Wrench className="h-3.5 w-3.5" />{lang('infrastructure.tabEquipment')}
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-1.5 text-xs">
              <ClipboardList className="h-3.5 w-3.5" />{lang('infrastructure.tabMaintenance')}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={lang('infrastructure.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64 h-9"
              />
            </div>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-9" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />{lang('infrastructure.addAsset')}
            </Button>
          </div>
        </div>

        <TabsContent value="facilities">
          <AssetTable data={facilities} searchTerm={searchTerm} onEdit={handleEditAsset} lang={lang} />
        </TabsContent>
        <TabsContent value="digital">
          <AssetTable
            data={digitalSystems}
            searchTerm={searchTerm}
            showDigitalFields
            onEdit={handleEditAsset}
            lang={lang}
            onRowClick={(asset) => {
              if (asset.name.includes('XYREG')) {
                setValidationPanelOpen(true);
              }
            }}
          />
        </TabsContent>
        <TabsContent value="equipment">
          <AssetTable data={equipment} searchTerm={searchTerm} onEdit={handleEditAsset} lang={lang} />
        </TabsContent>
        <TabsContent value="maintenance">
          <AssetTable data={maintenance} searchTerm={searchTerm} onEdit={handleEditAsset} lang={lang} />
        </TabsContent>
      </Tabs>

      <XyregValidationPanel open={validationPanelOpen} onOpenChange={setValidationPanelOpen} />
      <AddAssetDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        activeTab={activeTab}
        onSubmit={handleAddAsset}
        existingCount={tabDataMap[activeTab]?.data.length || 0}
      />
      <EditAssetDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        activeTab={activeTab}
        asset={editingAsset}
        onSubmit={handleUpdateAsset}
      />
    </div>
  );
}
