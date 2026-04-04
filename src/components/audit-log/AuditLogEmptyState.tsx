
import React from 'react';
import { FileSearch } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface AuditLogEmptyStateProps {
  filterCount: number;
  totalCount: number;
}

export function AuditLogEmptyState({ filterCount, totalCount }: AuditLogEmptyStateProps) {
  const { lang } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileSearch className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        {lang('auditLog.emptyState.title')}
      </h3>
      <p className="text-muted-foreground max-w-md">
        {filterCount === 0 ? (
          lang('auditLog.emptyState.noLogs')
        ) : (
          lang('auditLog.emptyState.noMatches')
        )}
      </p>
      {filterCount !== totalCount && (
        <p className="text-sm text-muted-foreground mt-2">
          {lang('auditLog.emptyState.showingOfTotal').replace('{{total}}', String(totalCount))}
        </p>
      )}
    </div>
  );
}
