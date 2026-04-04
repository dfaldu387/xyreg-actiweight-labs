import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Calendar, 
  Clock, 
  User, 
  Edit, 
  MoreHorizontal, 
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  Pause
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CITimelineEditModal } from './CITimelineEditModal';
import { toast } from 'sonner';
import { differenceInDays, format } from 'date-fns';

interface CITimelineManagerProps {
  productId: string;
  companyId: string;
  phaseName?: string;
}

interface CIInstance {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  due_date?: string;
  assigned_to?: string;
  company_id: string;
  product_id?: string;
  phase_id?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  planned: { label: 'Planned', color: 'bg-gray-100 text-gray-800', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: PlayCircle },
  review: { label: 'Review', color: 'bg-yellow-100 text-yellow-800', icon: Pause },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  blocked: { label: 'Blocked', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

const priorityConfig = {
  low: { label: 'Low', color: 'border-gray-300 text-gray-600' },
  medium: { label: 'Medium', color: 'border-blue-300 text-blue-600' },
  high: { label: 'High', color: 'border-orange-300 text-orange-600' },
  critical: { label: 'Critical', color: 'border-red-300 text-red-600' },
};

export function CITimelineManager({ 
  productId, 
  companyId, 
  phaseName 
}: CITimelineManagerProps) {
  const [ciInstances, setCIInstances] = useState<CIInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCI, setSelectedCI] = useState<CIInstance | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    loadCIInstances();
  }, [productId, companyId, phaseName]);

  const loadCIInstances = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ci_instances')
        .select('*')
        .eq('company_id', companyId);

      if (productId) {
        query = query.eq('product_id', productId);
      }

      // If we have a specific phase, filter by that
      if (phaseName) {
        // First get the phase ID for this phase name
        const { data: phases } = await supabase
          .from('lifecycle_phases')
          .select('id')
          .eq('product_id', productId)
          .eq('name', phaseName)
          .limit(1);

        if (phases && phases.length > 0) {
          query = query.eq('phase_id', phases[0].id);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading CI instances:', error);
        toast.error('Failed to load CI instances');
        return;
      }

      setCIInstances(data || []);
    } catch (error) {
      console.error('Error loading CI instances:', error);
      toast.error('Failed to load CI instances');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCI = (ci: CIInstance) => {
    setSelectedCI(ci);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedCI(null);
  };

  const handleSaveCI = () => {
    loadCIInstances(); // Refresh the list
  };

  const filteredInstances = ciInstances.filter(ci => {
    const matchesSearch = ci.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ci.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ci.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ci.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.planned;
    const Icon = config.icon;
    return (
      <Badge variant="secondary" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return 'No due date';
    
    const date = new Date(dueDate);
    const today = new Date();
    const daysUntilDue = differenceInDays(date, today);
    
    let className = 'text-muted-foreground';
    let prefix = '';
    
    if (daysUntilDue < 0) {
      className = 'text-red-600';
      prefix = `${Math.abs(daysUntilDue)} days overdue - `;
    } else if (daysUntilDue <= 7) {
      className = 'text-orange-600';
      prefix = daysUntilDue === 0 ? 'Due today - ' : `${daysUntilDue} days left - `;
    }
    
    return (
      <span className={className}>
        {prefix}{format(date, 'MMM dd, yyyy')}
      </span>
    );
  };

  const getOverdueCount = () => {
    const today = new Date();
    return filteredInstances.filter(ci => 
      ci.due_date && 
      new Date(ci.due_date) < today && 
      ci.status !== 'completed'
    ).length;
  };

  const getStatusCounts = () => {
    return Object.keys(statusConfig).reduce((acc, status) => {
      acc[status] = filteredInstances.filter(ci => ci.status === status).length;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();
  const overdueCount = getOverdueCount();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="h-4 w-4 mr-2 animate-spin" />
            Loading CI instances...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            CI Timeline Manager
            {phaseName && (
              <Badge variant="outline" className="ml-2">
                {phaseName}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{filteredInstances.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            {Object.entries(statusCounts).map(([status, count]) => {
              const config = statusConfig[status as keyof typeof statusConfig];
              return (
                <div key={status} className="text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground">{config.label}</div>
                </div>
              );
            })}
            {overdueCount > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
                <div className="text-xs text-muted-foreground">Overdue</div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search CI instances..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Status: {statusFilter === 'all' ? 'All' : statusConfig[statusFilter as keyof typeof statusConfig]?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  All Statuses
                </DropdownMenuItem>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <DropdownMenuItem key={status} onClick={() => setStatusFilter(status)}>
                    {config.label} ({statusCounts[status] || 0})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* CI Instances Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'No CI instances match your filters'
                        : 'No CI instances found'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInstances.map((ci) => (
                    <TableRow key={ci.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{ci.title}</div>
                          {ci.description && (
                            <div className="text-sm text-muted-foreground">{ci.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ci.type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(ci.status)}</TableCell>
                      <TableCell>{getPriorityBadge(ci.priority)}</TableCell>
                      <TableCell>{formatDueDate(ci.due_date)}</TableCell>
                      <TableCell>
                        {ci.assigned_to ? (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="text-sm">Assigned</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditCI(ci)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Timeline
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <CITimelineEditModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveCI}
        ciInstance={selectedCI}
      />
    </div>
  );
}