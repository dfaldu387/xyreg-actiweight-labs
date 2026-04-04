
import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, Search, Edit, Trash2, Building, Plus, ChevronUp, ChevronDown, ChevronsUpDown, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Activity, ACTIVITY_TYPES } from '@/types/activities';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface ActivityInstancesTableProps {
  activities: Activity[];
  isLoading: boolean;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  onScheduleActivity?: () => void;
  onExecuteTemplate?: (activity: Activity) => void;
  title: string;
  disabled?: boolean;
}

export function ActivityInstancesTable({
  activities,
  isLoading,
  onEdit,
  onDelete,
  onScheduleActivity,
  onExecuteTemplate,
  title,
  disabled = false
}: ActivityInstancesTableProps) {
  const { lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-primary" />
      : <ChevronDown className="h-4 w-4 text-primary" />;
  };

  const sortedActivities = React.useMemo(() => {
    let sortableActivities = [...activities];
    
    if (sortConfig !== null) {
      sortableActivities.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (sortConfig.key) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'type':
            aValue = ACTIVITY_TYPES[a.type];
            bValue = ACTIVITY_TYPES[b.type];
            break;
          case 'phase':
            aValue = a.phases?.name || '';
            bValue = b.phases?.name || '';
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'begin_date':
            aValue = a.phases?.start_date || a.start_date || '';
            bValue = b.phases?.start_date || b.start_date || '';
            break;
          case 'end_date':
            aValue = a.phases?.end_date || a.end_date || '';
            bValue = b.phases?.end_date || b.end_date || '';
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return sortableActivities;
  }, [activities, sortConfig]);

  const filteredActivities = sortedActivities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.type.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'overdue') {
      const isOverdue = activity.end_date && new Date(activity.end_date) < new Date() && activity.status !== 'completed';
      return matchesSearch && isOverdue;
    }
    return matchesSearch && activity.status === activeFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusCounts = () => {
    const all = activities.length;
    const planned = activities.filter(a => a.status === 'planned').length;
    const inProgress = activities.filter(a => a.status === 'in_progress').length;
    const completed = activities.filter(a => a.status === 'completed').length;
    const overdue = activities.filter(a =>
      a.end_date && new Date(a.end_date) < new Date() && a.status !== 'completed'
    ).length;

    return { all, planned, inProgress, completed, overdue };
  };


  const counts = getStatusCounts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {lang('activities.table.loading')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const filterLabel = (filter: string) => {
    switch (filter) {
      case 'planned':
        return lang('activities.table.filters.planned');
      case 'in_progress':
        return lang('activities.table.filters.inProgress');
      case 'completed':
        return lang('activities.table.filters.completed');
      case 'overdue':
        return lang('activities.table.filters.overdue');
      case 'all':
      default:
        return lang('activities.table.filters.all');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-3">
            {onScheduleActivity && (
              <Button onClick={onScheduleActivity} disabled={disabled}>
                <Plus className="h-4 w-4 mr-2" />
                {lang('activities.table.schedule')}
              </Button>
            )}
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">{filterLabel('all')} ({counts.all})</SelectItem>
                <SelectItem value="planned">{filterLabel('planned')} ({counts.planned})</SelectItem>
                <SelectItem value="in_progress">{filterLabel('in_progress')} ({counts.inProgress})</SelectItem>
                <SelectItem value="completed">{filterLabel('completed')} ({counts.completed})</SelectItem>
                <SelectItem value="overdue">{filterLabel('overdue')} ({counts.overdue})</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={lang('activities.table.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? lang('activities.table.emptySearch')
                : (activeFilter === 'all'
                  ? lang('activities.table.emptyAll')
                  : lang('activities.table.emptyFiltered').replace('{{filter}}', filterLabel(activeFilter))
                )
              }
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('name')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      {lang('activities.table.columns.name')} {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('type')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      {lang('activities.table.columns.type')} {getSortIcon('type')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('phase')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      {lang('activities.table.columns.phases')} {getSortIcon('phase')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('status')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      {lang('activities.table.columns.status')} {getSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('begin_date')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      {lang('activities.table.columns.beginDate')} {getSortIcon('begin_date')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('end_date')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      {lang('activities.table.columns.endDate')} {getSortIcon('end_date')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!activity.product_id && (
                          <Building className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{activity.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ACTIVITY_TYPES[activity.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {activity.phases?.name ? (
                          <div>
                            <div className="font-medium">{activity.phases.name}</div>
                            {(activity.phases.start_date || activity.phases.end_date) && (
                              <div className="text-xs text-muted-foreground">
                                {activity.phases.start_date ? format(new Date(activity.phases.start_date), 'MMM dd, yyyy') : 'Start TBD'} - {activity.phases.end_date ? format(new Date(activity.phases.end_date), 'MMM dd, yyyy') : 'End TBD'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            N/A {activity.phase_id ? `(Phase ID: ${activity.phase_id.substring(0,8)}...)` : '(No Phase)'}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {activity.start_date 
                        ? format(new Date(activity.start_date), 'MMM dd, yyyy') 
                        : activity.phases?.start_date 
                        ? format(new Date(activity.phases.start_date), 'MMM dd, yyyy')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {activity.end_date 
                        ? format(new Date(activity.end_date), 'MMM dd, yyyy') 
                        : activity.phases?.end_date 
                        ? format(new Date(activity.phases.end_date), 'MMM dd, yyyy')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={disabled}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(activity as any).template_metadata?.useDigitalTemplate && onExecuteTemplate && (
                            <DropdownMenuItem onClick={() => !disabled && onExecuteTemplate(activity)} disabled={disabled}>
                              <FileText className="h-4 w-4 mr-2" />
                              {lang('activities.table.actions.executeTemplate')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => !disabled && onEdit(activity)} disabled={disabled}>
                            <Edit className="h-4 w-4 mr-2" />
                            {lang('activities.table.actions.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (disabled) return;
                              if (confirm(lang('activities.table.actions.deleteConfirm'))) {
                                onDelete(activity.id);
                              }
                            }}
                            className="text-red-600"
                            disabled={disabled}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {lang('activities.table.actions.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
