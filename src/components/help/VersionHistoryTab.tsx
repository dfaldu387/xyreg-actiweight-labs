import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAvailableXyregReleases } from '@/hooks/useAvailableXyregReleases';
import { useCompanyAdoptedRelease } from '@/hooks/useCompanyAdoptedRelease';
import { useCompanyId } from '@/hooks/useCompanyId';
import { XYREG_MODULE_GROUPS } from '@/data/xyregModuleGroups';
import { useTranslation } from '@/hooks/useTranslation';
import { ChevronDown, ChevronUp, Rocket } from 'lucide-react';

const MAX_CHANGELOG_LENGTH = 200;

function getModuleGroupName(id: string): string {
  const group = XYREG_MODULE_GROUPS.find(g => g.id === id);
  return group?.name ?? id;
}

interface VersionHistoryTabProps {
  onClose?: () => void;
}

export function VersionHistoryTab({ onClose }: VersionHistoryTabProps) {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const { companyName } = useParams<{ companyName: string }>();
  const companyId = useCompanyId();
  const { data: releases, isLoading: releasesLoading } = useAvailableXyregReleases();
  const { data: adoptedRelease, isLoading: adoptedLoading } = useCompanyAdoptedRelease(companyId ?? '');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const isLoading = releasesLoading || adoptedLoading;

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {lang('help.versionHistory.loading')}
      </div>
    );
  }

  if (!releases || releases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
        <Rocket className="h-8 w-8 opacity-40" />
        <p>{lang('help.versionHistory.empty')}</p>
      </div>
    );
  }

  const adoptedReleaseId = adoptedRelease?.release_id;
  const latestRelease = releases[0];
  const latestIsUnadopted = latestRelease && latestRelease.id !== adoptedReleaseId;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{lang('help.versionHistory.title')}</h3>
        {adoptedRelease && (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            {lang('help.versionHistory.currentVersion')}: {adoptedRelease.version}
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {releases.map((release) => {
          const isAdopted = release.id === adoptedReleaseId;
          const isLatestUnadopted = latestIsUnadopted && release.id === latestRelease.id;
          const changelogLong = (release.changelog?.length ?? 0) > MAX_CHANGELOG_LENGTH;
          const isExpanded = expandedIds.has(release.id);

          return (
            <div
              key={release.id}
              className={`rounded-lg border p-4 space-y-2 ${isAdopted ? 'border-green-200 bg-green-50/50' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-base">{release.version}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(release.release_date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {isAdopted && (
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                      {lang('help.versionHistory.current')}
                    </Badge>
                  )}
                </div>
                {isLatestUnadopted && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      onClose?.();
                      navigate(`/app/company/${encodeURIComponent(companyName || '')}/infrastructure`);
                    }}
                  >
                    {lang('help.versionHistory.startValidation')}
                  </Button>
                )}
              </div>

              {release.changelog && (
                <div className="text-sm text-muted-foreground">
                  <p className="whitespace-pre-wrap">
                    {changelogLong && !isExpanded
                      ? release.changelog.slice(0, MAX_CHANGELOG_LENGTH) + '...'
                      : release.changelog}
                  </p>
                  {changelogLong && (
                    <button
                      onClick={() => toggleExpand(release.id)}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                    >
                      {isExpanded ? (
                        <>
                          {lang('help.versionHistory.showLess')} <ChevronUp className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          {lang('help.versionHistory.showMore')} <ChevronDown className="h-3 w-3" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {release.impacted_module_groups && release.impacted_module_groups.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {release.impacted_module_groups.map((moduleId) => (
                    <Badge key={moduleId} variant="secondary" className="text-xs">
                      {getModuleGroupName(moduleId)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
