
import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { AuditLogTable } from "@/components/audit-log/AuditLogTable";
import { AuditLogFilters } from "@/components/audit-log/AuditLogFilters";
import { AuditTrailCategoryTabs } from "@/components/audit-log/AuditTrailCategoryTabs";
import { useAuditTrail } from "@/hooks/useAuditTrail";
import { useAuth } from "@/context/AuthContext";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';
import { useTranslation } from '@/hooks/useTranslation';
import { AuditTrailService } from '@/services/auditTrailService';
import { Shield } from 'lucide-react';
import type { AuditTrailFilters as AuditTrailFiltersType } from '@/types/auditTrail';

export default function AuditLogPage() {
  const { lang } = useTranslation();
  const { activeCompanyId, activeRole } = useCompanyRole();

  // Restriction check - double security pattern
  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.AUDIT_LOG);
  const isRestricted = !isFeatureEnabled;

  // Category tab state
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Filter state management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('All');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Build filters for the hook
  const filters: AuditTrailFiltersType = useMemo(() => ({
    category: activeCategory !== 'All' ? activeCategory as AuditTrailFiltersType['category'] : undefined,
    userId: selectedUser !== 'All' ? selectedUser : undefined,
    startDate,
    endDate,
    searchTerm: searchTerm || undefined,
  }), [activeCategory, selectedUser, startDate, endDate, searchTerm]);

  // Fetch unified audit trail
  const { entries, isLoading, error } = useAuditTrail({ filters, limit: 200 });

  // Handle CSV export
  const handleExportCSV = () => {
    const csvContent = AuditTrailService.exportCSV(entries);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-trail-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Viewer role gets no access
  if (activeRole === 'viewer') {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">{lang('auditLog.accessRestricted')}</h2>
          <p className="text-muted-foreground">{lang('auditLog.noPermission')}</p>
        </div>
      </div>
    );
  }

  return (
    <RestrictedFeatureProvider
      isRestricted={isRestricted}
      planName={planName}
      featureName={lang('auditLog.featureName')}
    >
      <div className="flex-1 space-y-4 p-2 pt-4">
        <PageHeader
          heading={lang('auditLog.pageHeading')}
          text={lang('auditLog.pageSubtitle')}
        />

        {isRestricted && <RestrictedPreviewBanner />}

        <div className="space-y-6">
          {/* Category tabs */}
          <AuditTrailCategoryTabs
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          {/* Filters section */}
          <AuditLogFilters
            entries={entries}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            selectedUser={selectedUser}
            onUserChange={setSelectedUser}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            onExportCSV={handleExportCSV}
            disabled={isRestricted}
          />

          {/* Audit trail table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{lang('auditLog.activityLog')}</h3>
              <div className="text-sm text-muted-foreground">
                {lang('auditLog.showingEntries', { count: entries.length })}
                {activeRole === 'editor' && ` ${lang('auditLog.yourActionsOnly')}`}
              </div>
            </div>
            <AuditLogTable
              entries={entries}
              isLoading={isLoading}
            />
            {error && (
              <div className="text-sm text-red-500 mt-2">
                {lang('auditLog.errorLoading')} {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </RestrictedFeatureProvider>
  );
}
