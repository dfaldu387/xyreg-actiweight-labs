import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, User, Building2, FileText, AlertTriangle, CheckCircle2, Users, Tag } from "lucide-react";
import { GapAnalysisItem } from "@/types/client";

interface EnhancedGapAnalysisViewProps {
  items: GapAnalysisItem[];
  productId?: string;
  companyId?: string;
  onClose: () => void;
  onRefresh?: () => void;
  onItemUpdate?: (itemId: string, updates: Partial<GapAnalysisItem>) => void;
  onAddEvidence?: (itemId: string) => void;
  onAssignReviewer?: (itemId: string) => void;
}

type ViewMode = 'workflow' | 'owner' | 'chapter' | 'priority';
type OwnerType = 'qa_ra' | 'rd' | 'mfg_ops' | 'labeling' | 'clinical' | 'other';

const OWNER_LABELS: Record<OwnerType, string> = {
  qa_ra: 'QA/RA',
  rd: 'R&D',
  mfg_ops: 'Mfg/Ops',
  labeling: 'Labeling',
  clinical: 'Clinical',
  other: 'Other'
};

export function EnhancedGapAnalysisView({ 
  items, 
  productId,
  companyId,
  onClose,
  onRefresh,
  onItemUpdate, 
  onAddEvidence, 
  onAssignReviewer 
}: EnhancedGapAnalysisViewProps) {
  
  // Map GapAnalysisItem status to expected values
  const mapStatus = (status?: string) => {
    switch (status) {
      case 'Closed': return 'completed';
      case 'In Progress': return 'in_progress';
      case 'Open': return 'not_started';
      case 'not_applicable': return 'not_applicable';
      default: return 'not_started';
    }
  };
  
  const getStatusDisplay = (status?: string) => {
    switch (status) {
      case 'Closed': return 'completed';
      case 'In Progress': return 'in_progress';
      case 'Open': return 'not_started';
      case 'not_applicable': return 'not_applicable';
      default: return 'not_started';
    }
  };
  const [viewMode, setViewMode] = useState<ViewMode>('workflow');
  const [selectedOwner, setSelectedOwner] = useState<OwnerType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Smart filtering and grouping logic
  const { filteredItems, groupedItems, stats } = useMemo(() => {
    let filtered = items;

    // Filter by owner
    if (selectedOwner !== 'all') {
      filtered = filtered.filter(item => {
        const ownerField = `${selectedOwner}_owner` as keyof GapAnalysisItem;
        return item[ownerField] === 'primary' || item[ownerField] === 'secondary';
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Group items based on view mode
    const grouped: Record<string, GapAnalysisItem[]> = {};
    
    filtered.forEach(item => {
      let groupKey = '';
      
        switch (viewMode) {
        case 'workflow':
          // Group by completion status and urgency
          const mappedStatus = mapStatus(item.status);
          if (mappedStatus === 'completed') {
            groupKey = 'Completed';
          } else if (item.priority === 'high') {
            groupKey = 'High Priority - In Progress';
          } else if (mappedStatus === 'in_progress') {
            groupKey = 'In Progress';
          } else {
            groupKey = 'Not Started';
          }
          break;
          
        case 'owner':
          // Group by primary owner
          const primaryOwner = Object.entries(item).find(([key, value]) => 
            key.endsWith('_owner') && value === 'primary'
          );
          groupKey = primaryOwner 
            ? OWNER_LABELS[primaryOwner[0].replace('_owner', '') as OwnerType] || 'Unassigned'
            : 'Unassigned';
          break;
          
        case 'chapter':
          groupKey = item.section || 'No Chapter';
          break;
          
        case 'priority':
          groupKey = `${item.priority?.charAt(0).toUpperCase()}${item.priority?.slice(1)} Priority` || 'No Priority';
          break;
      }
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(item);
    });

    // Calculate statistics
    const statistics = {
      total: filtered.length,
      completed: filtered.filter(item => mapStatus(item.status) === 'completed').length,
      inProgress: filtered.filter(item => mapStatus(item.status) === 'in_progress').length,
      notStarted: filtered.filter(item => mapStatus(item.status) === 'not_started').length,
      
    };

    return {
      filteredItems: filtered,
      groupedItems: grouped,
      stats: statistics
    };
  }, [items, viewMode, selectedOwner, statusFilter]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderOwnerBadges = (item: GapAnalysisItem) => {
    const owners: string[] = [];
    Object.entries(item).forEach(([key, value]) => {
      if (key.endsWith('_owner') && (value === 'primary' || value === 'secondary')) {
        const ownerType = key.replace('_owner', '') as OwnerType;
        const label = OWNER_LABELS[ownerType];
        if (label) {
          owners.push(`${label}${value === 'primary' ? ' (P)' : ' (S)'}`);
        }
      }
    });
    
    return owners.map((owner, index) => (
      <Badge key={index} variant="outline" className="text-xs">
        <Users className="w-3 h-3 mr-1" />
        {owner}
      </Badge>
    ));
  };

  const canMarkNA = (item: GapAnalysisItem) => {
    // For now, allow marking N/A on any non-completed item
    return mapStatus(item.status) !== 'completed';
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select view mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="workflow">Workflow View</SelectItem>
              <SelectItem value="owner">By Owner</SelectItem>
              <SelectItem value="chapter">By Chapter</SelectItem>
              <SelectItem value="priority">By Priority</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedOwner} onValueChange={(value) => setSelectedOwner(value as OwnerType | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owners</SelectItem>
              {Object.entries(OWNER_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Progress Summary */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Completed: {stats.completed}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>In Progress: {stats.inProgress}</span>
          </div>
        </div>
      </div>

      {/* Enhanced Item Display */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([groupName, groupItems]) => (
          <Card key={groupName} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{groupName}</CardTitle>
                <Badge variant="secondary">{groupItems.length} items</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupItems.map((item) => (
                <Card key={item.id} className="border border-border/50 hover:border-border transition-colors">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header with status and priority */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(getStatusDisplay(item.status))}>
                              {getStatusDisplay(item.status) === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              
                              {getStatusDisplay(item.status) === 'in_progress' && <Clock className="w-3 h-3 mr-1" />}
                              {item.status?.replace('_', ' ').toUpperCase() || 'NOT STARTED'}
                            </Badge>
                            {item.priority && (
                              <Badge className={getPriorityColor(item.priority)}>
                                <Tag className="w-3 h-3 mr-1" />
                                {item.priority}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium text-base mb-1">
                            {item.description || item.requirement}
                          </h4>
                        </div>
                      </div>

                      {/* Owner assignments */}
                      {renderOwnerBadges(item).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {renderOwnerBadges(item)}
                        </div>
                      )}

                      {/* Framework info */}
                      {item.framework && (
                        <div className="bg-muted/50 p-3 rounded-md">
                          <span className="text-sm font-medium">Framework:</span>
                          <span className="text-sm ml-2">{item.framework}</span>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-2">
                        {canMarkNA(item) && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onItemUpdate?.(item.id, { status: 'not_applicable' })}
                          >
                            Mark N/A
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onAddEvidence?.(item.id)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Add Evidence
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onAssignReviewer?.(item.id)}
                        >
                          <User className="w-4 h-4 mr-1" />
                          Assign Reviewer
                        </Button>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}