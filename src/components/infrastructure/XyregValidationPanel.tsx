import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Clock, AlertTriangle, Download, ArrowRight, Shield, Layers, ChevronRight, Building, ArrowUpCircle, PackageOpen, FileText, ArrowLeft } from 'lucide-react';
import { XYREG_MODULE_GROUPS, type XyregModuleGroup } from '@/data/xyregModuleGroups';
import { CORE_SERVICES } from '@/data/coreModuleDependencies';
import { ModuleGroupChecklist } from './ModuleGroupChecklist';
import { ValidationCoverageDashboard } from './ValidationCoverageDashboard';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useCompanyAdoptedRelease, useAdoptRelease, type AdoptReleaseParams } from '@/hooks/useCompanyAdoptedRelease';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  const label = i === 0 ? '12:00 AM'
    : i < 12 ? `${i}:00 AM`
    : i === 12 ? '12:00 PM'
    : `${i - 12}:00 PM`;
  return { value: `${hour}:00`, label };
});
import { useAvailableXyregReleases } from '@/hooks/useAvailableXyregReleases';
import { useCumulativeChangelog } from '@/hooks/useCumulativeChangelog';
import { useAllModuleGroupValidations } from '@/hooks/useModuleGroupValidation';

interface XyregValidationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
}

type ValidationStatus = 'validated' | 'pending' | 'invalidated' | 'not_started';

function StatusBadge({ status, lang }: { status: ValidationStatus; lang: (key: string, variables?: Record<string, string | number>) => string }) {
  switch (status) {
    case 'validated':
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />{lang('infrastructure.validationPanel.statusValidated')}</Badge>;
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="h-3 w-3 mr-1" />{lang('infrastructure.validationPanel.statusInProgress')}</Badge>;
    case 'invalidated':
      return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertTriangle className="h-3 w-3 mr-1" />{lang('infrastructure.validationPanel.statusRevalidationRequired')}</Badge>;
    case 'not_started':
      return <Badge variant="outline" className="text-muted-foreground">{lang('infrastructure.validationPanel.statusNotStarted')}</Badge>;
  }
}

function RiskBadge({ risk }: { risk: 'low' | 'medium' | 'high' }) {
  const colors = {
    low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    high: 'bg-red-100 text-red-800 border-red-200',
  };
  return <Badge className={`text-xs ${colors[risk]}`}>{risk}</Badge>;
}

export function XyregValidationPanel({ open, onOpenChange, companyId: propCompanyId }: XyregValidationPanelProps) {
  const { lang } = useTranslation();
  const hookCompanyId = useCompanyId();
  const resolvedCompanyId = propCompanyId || hookCompanyId || '';
  const [selectedGroup, setSelectedGroup] = useState<XyregModuleGroup | null>(null);

  // Fetch adopted release for this company
  const { data: adoptedRelease, isLoading: isLoadingAdoption } = useCompanyAdoptedRelease(resolvedCompanyId);
  // Fetch all available published releases
  const { data: availableReleases = [] } = useAvailableXyregReleases();
  // Mutation to adopt a release
  const adoptRelease = useAdoptRelease(resolvedCompanyId);

  const [showChangelog, setShowChangelog] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');

  // Tomorrow's date as min for native date input
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Check if there's a newer release available
  const newerReleases = adoptedRelease
    ? availableReleases.filter(r => r.id !== adoptedRelease.release_id)
    : [];
  const latestAvailable = availableReleases.length > 0 ? availableReleases[0] : null;
  const hasNewerVersion = adoptedRelease && latestAvailable && latestAvailable.id !== adoptedRelease.release_id;

  // Cumulative changelog: from current adopted release to latest available
  const { data: cumulativeChangelog = [] } = useCumulativeChangelog(
    adoptedRelease?.release_date ?? null,
    hasNewerVersion ? latestAvailable!.release_date : null
  );

  const currentVersion = adoptedRelease?.version ? `v${adoptedRelease.version}` : null;
  const currentReleaseDate = adoptedRelease?.release_date ?? null;

  // Fetch real validation statuses from DB
  const { data: dbValidations = [] } = useAllModuleGroupValidations(resolvedCompanyId, adoptedRelease?.release_id ?? null);

  function getModuleStatus(groupId: string): ValidationStatus {
    const record = dbValidations.find(v => v.module_group_id === groupId);
    if (!record) return 'not_started';
    if (record.overall_verdict === 'validated' || record.overall_verdict === 'validated_with_conditions') return 'validated';
    if (record.overall_verdict === 'not_validated') return 'invalidated';
    if (record.iq_verdict || record.oq_verdict || record.pq_verdict) return 'pending';
    return 'not_started';
  }

  const validatedCount = XYREG_MODULE_GROUPS.filter(g => getModuleStatus(g.id) === 'validated').length;

  const handleAdoptRelease = (releaseId: string) => {
    setShowSchedule(true);
  };

  const handleConfirmUpgrade = () => {
    if (!latestAvailable || !preferredDate || !timeStart || !timeEnd) return;
    adoptRelease.mutate(
      {
        releaseId: latestAvailable.id,
        preferredDate,
        preferredTimeStart: timeStart,
        preferredTimeEnd: timeEnd,
      },
      {
        onSuccess: () => {
          toast.success(`Adopted XYREG v${latestAvailable.version}. Validation cycle started.`);
          setShowSchedule(false);
          setPreferredDate('');
          setTimeStart('');
          setTimeEnd('');
        },
        onError: () => {
          toast.error('Failed to adopt release. Please try again.');
        },
      },
    );
  };

  const isScheduleValid = preferredDate && timeStart && timeEnd && timeStart < timeEnd;

  const handleSaveValidation = (data: any) => {
    console.log('Saving validation for', selectedGroup?.id, data);
    toast.success(lang('infrastructure.validationPanel.validationSaved', { name: selectedGroup?.name || '' }));
    setSelectedGroup(null);
  };

  // Sub-view: Module Group Checklist
  if (selectedGroup) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
          <SheetHeader className="px-6 pt-6 pb-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedGroup(null)} className="h-7 px-2 text-xs flex justify-center items-center">
                <ArrowLeft className="mr-1 h-3 w-3" />
                {`${lang('infrastructure.validationPanel.back')}`}
              </Button>
              <SheetTitle className="text-base">{lang('infrastructure.validationPanel.validate', { name: selectedGroup.name })}</SheetTitle>
            </div>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-80px)] px-6 pb-6">
            <ModuleGroupChecklist
              moduleGroup={selectedGroup}
              companyId={resolvedCompanyId}
              adoptedReleaseId={adoptedRelease?.release_id ?? null}
              releaseVersion={adoptedRelease?.version}
              releaseDate={adoptedRelease?.release_date}
              onSave={handleSaveValidation}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {lang('infrastructure.validationPanel.title')}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)] px-6 pb-6">
          <div className="space-y-6">
            {/* Validation Coverage Dashboard */}
            <ValidationCoverageDashboard adoptedReleaseId={adoptedRelease?.release_id ?? null} />

            {/* Release Adoption Section */}
            {!adoptedRelease && !isLoadingAdoption ? (
              /* No adopted release — show latest version only */
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <PackageOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-3">
                      {latestAvailable ? (
                        <>
                          <div>
                            <p className="text-sm font-semibold">XYREG v{latestAvailable.version} Available</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Released {new Date(latestAvailable.release_date).toLocaleDateString()} — Start validation to begin your IQ/OQ/PQ cycle.
                            </p>
                          </div>
                          {!showSchedule ? (
                            <Button
                              size="sm"
                              disabled={adoptRelease.isPending}
                              onClick={() => handleAdoptRelease(latestAvailable.id)}
                            >
                              <ArrowUpCircle className="h-3.5 w-3.5 mr-1.5" />
                              {adoptRelease.isPending ? 'Adopting...' : `Start Validation for v${latestAvailable.version}`}
                            </Button>
                          ) : (
                            <div className="w-full border-t pt-3 mt-1 space-y-3">
                              <p className="text-xs font-semibold">Choose your preferred update window</p>
                              <p className="text-xs text-muted-foreground">Our team will perform the upgrade during this window.</p>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Preferred Date</Label>
                                <Input
                                  type="date"
                                  className="h-9 max-w-fit"
                                  value={preferredDate}
                                  min={minDate}
                                  onChange={(e) => setPreferredDate(e.target.value)}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs">From</Label>
                                  <Select value={timeStart} onValueChange={setTimeStart}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Start time" /></SelectTrigger>
                                    <SelectContent>
                                      {TIME_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">To</Label>
                                  <Select value={timeEnd} onValueChange={setTimeEnd}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="End time" /></SelectTrigger>
                                    <SelectContent>
                                      {TIME_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              {timeStart && timeEnd && timeStart >= timeEnd && (
                                <p className="text-xs text-red-500">End time must be after start time.</p>
                              )}
                              <div className="flex items-center gap-2 pt-1">
                                <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setShowSchedule(false); setPreferredDate(''); setTimeStart(''); setTimeEnd(''); }} disabled={adoptRelease.isPending}>
                                  Cancel
                                </Button>
                                <Button size="sm" className="text-xs" disabled={!isScheduleValid || adoptRelease.isPending} onClick={handleConfirmUpgrade}>
                                  {adoptRelease.isPending ? 'Requesting...' : 'Confirm & Request Update'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold">No Version Available</p>
                          <p className="text-xs text-muted-foreground italic mt-0.5">No published releases available yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Has adopted release — show version + optional upgrade banner */
              <>
                <Card className="border-primary/20">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{lang('infrastructure.validationPanel.currentVersion')}</p>
                        <p className="text-2xl font-bold text-primary">{currentVersion ?? '...'}</p>
                        {currentReleaseDate && (
                          <p className="text-xs text-muted-foreground">
                            Adopted {new Date(adoptedRelease!.adopted_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{lang('infrastructure.validationPanel.moduleGroupsValidated')}</p>
                        <p className="text-2xl font-bold">
                          {validatedCount}<span className="text-muted-foreground text-lg">/{XYREG_MODULE_GROUPS.length}</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* New version available banner */}
                {hasNewerVersion && (
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="py-3 px-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ArrowUpCircle className="h-4 w-4 text-blue-600 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">
                              New version available: v{latestAvailable!.version}
                            </p>
                            <p className="text-xs text-blue-700">
                              Released {new Date(latestAvailable!.release_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {cumulativeChangelog.length > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-700 hover:bg-blue-100 text-xs"
                              onClick={() => setShowChangelog(!showChangelog)}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              {showChangelog ? 'Hide changes' : `View changes (${cumulativeChangelog.length})`}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-100"
                            disabled={adoptRelease.isPending}
                            onClick={() => handleAdoptRelease(latestAvailable!.id)}
                          >
                            <ArrowUpCircle className="h-3 w-3 mr-1" />
                            {adoptRelease.isPending ? 'Upgrading...' : 'Upgrade'}
                          </Button>
                        </div>
                      </div>

                      {/* Inline preferred schedule picker */}
                      {showSchedule && (
                        <div className="border-t border-blue-200 pt-3 space-y-3">
                          <p className="text-xs font-semibold text-blue-900">
                            Choose your preferred update window
                          </p>
                          <p className="text-xs text-blue-700">
                            Our team will perform the upgrade during this window.
                          </p>
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-blue-800">Preferred Date</Label>
                              <Input
                                type="date"
                                className="h-9 max-w-fit bg-white border-blue-200"
                                value={preferredDate}
                                min={minDate}
                                onChange={(e) => setPreferredDate(e.target.value)}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs text-blue-800">From</Label>
                                <Select value={timeStart} onValueChange={setTimeStart}>
                                  <SelectTrigger className="h-9 bg-white border-blue-200">
                                    <SelectValue placeholder="Start time" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {TIME_OPTIONS.map(opt => (
                                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs text-blue-800">To</Label>
                                <Select value={timeEnd} onValueChange={setTimeEnd}>
                                  <SelectTrigger className="h-9 bg-white border-blue-200">
                                    <SelectValue placeholder="End time" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {TIME_OPTIONS.map(opt => (
                                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {timeStart && timeEnd && timeStart >= timeEnd && (
                              <p className="text-xs text-red-500">End time must be after start time.</p>
                            )}
                            <div className="flex items-center gap-2 pt-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-blue-700 hover:bg-blue-100 text-xs"
                                onClick={() => { setShowSchedule(false); setPreferredDate(''); setTimeStart(''); setTimeEnd(''); }}
                                disabled={adoptRelease.isPending}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                disabled={!isScheduleValid || adoptRelease.isPending}
                                onClick={handleConfirmUpgrade}
                              >
                                {adoptRelease.isPending ? 'Requesting...' : 'Confirm & Request Update'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cumulative changelog */}
                      {showChangelog && cumulativeChangelog.length > 0 && (
                        <div className="border-t border-blue-200 pt-3 space-y-3">
                          <p className="text-xs font-semibold text-blue-900">
                            Changes since {currentVersion}:
                          </p>
                          {cumulativeChangelog.map((entry) => (
                            <div key={entry.version} className="space-y-1">
                              <p className="text-xs font-medium text-blue-800">
                                v{entry.version} — {new Date(entry.release_date).toLocaleDateString()}
                              </p>
                              {entry.impacted_module_groups && entry.impacted_module_groups.length > 0 && (
                                <div className="flex flex-wrap gap-1 pl-3">
                                  {entry.impacted_module_groups.map(moduleId => {
                                    const group = XYREG_MODULE_GROUPS.find(g => g.id === moduleId);
                                    return (
                                      <Badge key={moduleId} variant="outline" className="text-[9px] py-0 border-blue-300 text-blue-700">
                                        {group?.name || moduleId}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              )}
                              {entry.changelog ? (
                                <div className="text-xs text-blue-700 pl-3 whitespace-pre-line">
                                  {entry.changelog}
                                </div>
                              ) : (
                                <p className="text-xs text-blue-600/60 pl-3 italic">No changelog provided</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Download Kit */}
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={async () => {
                try {
                  toast.info(lang('infrastructure.validationPanel.generatingKit'));
                  const { generateValidationKit } = await import('@/utils/generateValidationKit');
                  await generateValidationKit();
                  toast.success(lang('infrastructure.validationPanel.kitDownloaded'));
                } catch (err) {
                  console.error('DOCX generation error:', err);
                  toast.error(lang('infrastructure.validationPanel.kitFailed'));
                }
              }}
            >
              <Download className="h-4 w-4" />
              {lang('infrastructure.validationPanel.downloadKit')}
              <Badge variant="secondary" className="ml-auto text-xs">CSV-VP-001</Badge>
            </Button>

            <Separator />

            {/* Core Engine Services */}
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 text-muted-foreground" />
                {lang('infrastructure.validationPanel.coreEngineServices')}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {CORE_SERVICES.map(svc => (
                  <div key={svc.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/20">
                    <div className={`h-2 w-2 rounded-full ${svc.criticality === 'high' ? 'bg-red-500' : svc.criticality === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className="text-xs font-medium truncate">{svc.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Module Groups Grid */}
            <div>
              <h4 className="text-sm font-semibold mb-3">{lang('infrastructure.validationPanel.moduleGroups')}</h4>
              <div className="space-y-2">
                {XYREG_MODULE_GROUPS.map(group => {
                  const status = getModuleStatus(group.id);
                  const expiredDeps = group.infrastructureDependencies?.filter(dep => {
                    const expiredAssetIds = ['FAC-005', 'DIG-005', 'MNT-004'];
                    return expiredAssetIds.includes(dep.assetId);
                  }) || [];

                  return (
                    <Card
                      key={group.id}
                      className={`cursor-pointer hover:bg-muted/30 transition-colors ${expiredDeps.length > 0 ? 'border-amber-300' : ''}`}
                      onClick={() => setSelectedGroup(group)}
                    >
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{group.name}</span>
                              <RiskBadge risk={group.processRisk} />
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {group.features.slice(0, 3).map(f => (
                                <Badge key={f} variant="secondary" className="text-[10px] py-0">{f}</Badge>
                              ))}
                              {group.features.length > 3 && (
                                <Badge variant="secondary" className="text-[10px] py-0">+{group.features.length - 3}</Badge>
                              )}
                            </div>
                            {expiredDeps.length > 0 && (
                              <div className="mt-1.5 space-y-0.5">
                                {expiredDeps.map(dep => (
                                  <div key={dep.assetId} className="flex items-center gap-1.5 text-[10px] text-amber-700">
                                    <Building className="h-3 w-3 shrink-0" />
                                    <span>Infrastructure dependency expired: <strong>{dep.assetName}</strong></span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <StatusBadge status={status} lang={lang} />
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
