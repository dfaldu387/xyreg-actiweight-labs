
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Download, Search } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { UnifiedAuditTrailEntry } from '@/types/auditTrail';

interface AuditLogFiltersProps {
  entries: UnifiedAuditTrailEntry[];
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedUser: string;
  onUserChange: (value: string) => void;
  startDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  endDate: Date | undefined;
  onEndDateChange: (date: Date | undefined) => void;
  onExportCSV: () => void;
  disabled?: boolean;
}

export function AuditLogFilters({
  entries,
  searchTerm,
  onSearchTermChange,
  selectedUser,
  onUserChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onExportCSV,
  disabled = false,
}: AuditLogFiltersProps) {
  const { lang } = useTranslation();

  // Extract unique users from entries
  const uniqueUsers = React.useMemo(() => {
    const users = Array.from(new Set(entries.map(e => e.userName)))
      .filter(u => u && u.trim() !== '' && u !== 'Unknown')
      .sort();
    return ['All', ...users];
  }, [entries]);

  const handleClearFilters = () => {
    onSearchTermChange('');
    onUserChange('All');
    onStartDateChange(undefined);
    onEndDateChange(undefined);
  };

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex flex-wrap items-end gap-4">
        {/* Search */}
        <div className="flex flex-col flex-shrink-0 w-56 gap-2">
          <Label>{lang('auditLog.filters.search')}</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={lang('auditLog.filters.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-8"
              disabled={disabled}
            />
          </div>
        </div>

        {/* User Filter */}
        <div className="flex flex-col flex-shrink-0 w-48 gap-2">
          <Label>{lang('auditLog.filters.user')}</Label>
          <Select value={selectedUser} onValueChange={onUserChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder={lang('auditLog.filters.allUsers')} />
            </SelectTrigger>
            <SelectContent>
              {uniqueUsers.map((user) => (
                <SelectItem key={user} value={user}>
                  {user}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Date Filter */}
        <div className="flex flex-col flex-shrink-0 w-40 gap-2">
          <Label>{lang('auditLog.filters.startDate')}</Label>
          <DatePicker
            date={startDate}
            setDate={onStartDateChange}
            placeholder={lang('auditLog.filters.startDatePlaceholder')}
            disabled={disabled ? undefined : (date) => {
              if (!endDate) return false;
              return date > endDate;
            }}
          />
        </div>

        {/* End Date Filter */}
        <div className="flex flex-col flex-shrink-0 w-40 gap-2">
          <Label>{lang('auditLog.filters.endDate')}</Label>
          <DatePicker
            date={endDate}
            setDate={onEndDateChange}
            placeholder={lang('auditLog.filters.endDatePlaceholder')}
            disabled={disabled ? undefined : (date) => {
              if (!startDate) return false;
              return date < startDate;
            }}
          />
        </div>

        {/* Export CSV */}
        <div className="flex flex-col flex-shrink-0 gap-2">
          <Label className="text-transparent">Actions</Label>
          <Button
            variant="outline"
            onClick={onExportCSV}
            disabled={disabled || entries.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            {lang('auditLog.filters.exportCsv')}
          </Button>
        </div>

        {/* Clear Filters */}
        <div className="flex items-center flex-shrink-0">
          <Button variant="outline" onClick={handleClearFilters} disabled={disabled}>
            {lang('auditLog.filters.clearFilters')}
          </Button>
        </div>
      </div>
    </div>
  );
}
