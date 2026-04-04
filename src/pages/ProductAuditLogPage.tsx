import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { AuditLogTable } from '@/components/audit-log/AuditLogTable';
import { AuditLogFilters } from '@/components/audit-log/AuditLogFilters';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { useProductDocumentAuditTrail } from '@/hooks/useProductDocumentAuditTrail';
import { AuditTrailService } from '@/services/auditTrailService';
import { FileText } from 'lucide-react';
import type { AuditTrailFilters as AuditTrailFiltersType } from '@/types/auditTrail';

export default function ProductAuditLogPage() {
  const { productId } = useParams<{ productId: string }>();
  const { activeCompanyId } = useCompanyRole();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('All');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Don't pass selectedUser as userId — the dropdown uses userName (display name),
  // not UUID. User filtering is applied client-side below.
  const filters: AuditTrailFiltersType = useMemo(() => ({
    category: 'document_record',
    startDate,
    endDate,
    searchTerm: searchTerm || undefined,
  }), [startDate, endDate, searchTerm]);

  const { entries: rawEntries, isLoading, error } = useProductDocumentAuditTrail({
    productId: productId || '',
    companyId: activeCompanyId || '',
    filters,
    limit: 200,
  });

  // Client-side user filter by userName
  const entries = useMemo(() => {
    if (selectedUser === 'All') return rawEntries;
    return rawEntries.filter(e => e.userName === selectedUser);
  }, [rawEntries, selectedUser]);

  const handleExportCSV = () => {
    const csvContent = AuditTrailService.exportCSV(entries);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `device-audit-trail-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!productId || !activeCompanyId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-muted-foreground">Missing product or company information.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-2 pt-4">
      <PageHeader
        heading="Audit Trail"
        text="21 CFR Part 11 compliant audit trail — Who, What, When, Why"
      />

      <div className="space-y-6">

        {/* Filters section */}
        <AuditLogFilters
          entries={rawEntries}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          selectedUser={selectedUser}
          onUserChange={setSelectedUser}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onExportCSV={handleExportCSV}
        />

        {/* Audit trail table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Activity Log</h3>
            <div className="text-sm text-muted-foreground">
              Showing {entries.length} entries
            </div>
          </div>
          <AuditLogTable
            entries={entries}
            isLoading={isLoading}
          />
          {error && (
            <div className="text-sm text-red-500 mt-2">
              Error loading audit trail: {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
