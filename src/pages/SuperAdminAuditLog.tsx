import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, Search, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useSuperAdminAuditLogs } from '@/hooks/useSuperAdminAuditLogs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function SuperAdminAuditLog() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [action, setAction] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const { auditLogs, isLoading, error } = useSuperAdminAuditLogs({
    searchTerm,
    action: action === 'All' ? '' : action,
    companyId: companyFilter === 'All' ? '' : companyFilter,
    startDate,
    endDate,
    limit: 200
  });

  const handleExport = () => {
    if (auditLogs.length === 0) return;

    const csv = [
      ['Date', 'Time', 'User', 'Company', 'Action', 'Document', 'IP Address', 'Duration (seconds)'].join(','),
      ...auditLogs.map(log => [
        log.date,
        log.time,
        log.user || 'Unknown',
        log.companyName || 'Unknown',
        log.actionType || 'Unknown',
        log.entityName || 'Unknown',
        log.ipAddress || 'Unknown',
        log.duration_seconds || 0
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `super-admin-audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'view':
        return 'secondary';
      case 'edit':
        return 'default';
      case 'download':
        return 'outline';
      case 'comment':
        return 'secondary';
      case 'review':
        return 'default';
      default:
        return 'outline';
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Super Admin Audit Log</h1>
            <p className="text-muted-foreground">Monitor all system activity across companies</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Error loading audit logs: {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Super Admin Audit Log</h1>
          <p className="text-muted-foreground">
            Monitor all system activity across companies
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users, documents, companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Action Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Actions</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="download">Download</SelectItem>
                  <SelectItem value="comment">Comment</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="annotate">Annotate</SelectItem>
                  <SelectItem value="share">Share</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Select start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Select end date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Audit Log Entries ({isLoading ? '...' : auditLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit log entries found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Date/Time</th>
                    <th className="text-left p-2 font-medium">User</th>
                    <th className="text-left p-2 font-medium">Company</th>
                    <th className="text-left p-2 font-medium">Action</th>
                    <th className="text-left p-2 font-medium">Document</th>
                    <th className="text-left p-2 font-medium">IP Address</th>
                    <th className="text-left p-2 font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div className="text-sm">
                          <div>{log.date}</div>
                          <div className="text-muted-foreground">{log.time}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          <div className="font-medium">{log.user}</div>
                          {log.user_profiles?.email && (
                            <div className="text-muted-foreground text-xs">
                              {log.user_profiles.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm font-medium">
                          {log.companyName}
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.actionType}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          <div className="font-medium">{log.entityName}</div>
                          {log.entityType && (
                            <div className="text-muted-foreground text-xs">
                              {log.entityType}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {log.ipAddress}
                      </td>
                      <td className="p-2 text-sm">
                        {log.duration_seconds ? `${log.duration_seconds}s` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}