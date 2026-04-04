
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, FilterIcon, RefreshCwIcon } from 'lucide-react';
import { useEnhancedPhaseDocuments } from '@/hooks/useEnhancedPhaseDocuments';
import { toast } from 'sonner';

interface EnhancedDocumentMatrixProps {
  companyId: string;
  phaseName?: string;
  showFilters?: boolean;
}

export function EnhancedDocumentMatrix({ 
  companyId, 
  phaseName, 
  showFilters = true 
}: EnhancedDocumentMatrixProps) {
  const {
    documents,
    filterOptions,
    filters,
    statistics,
    loading,
    updating,
    updateFilters,
    clearFilters,
    refreshData,
    updateDocumentStatus,
    updateDocumentDeadline
  } = useEnhancedPhaseDocuments(companyId, phaseName);

  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Not Started': return 'bg-gray-100 text-gray-800';
      case 'Not Required': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (documentId: string, newStatus: string) => {
    await updateDocumentStatus(
      documentId, 
      newStatus as "Not Started" | "In Progress" | "Completed" | "Not Required"
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCwIcon className="h-6 w-6 animate-spin mr-2" />
            Loading enhanced document matrix...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Panel */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{statistics.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{statistics.inProgress}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{statistics.notStarted}</div>
                <div className="text-sm text-muted-foreground">Not Started</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{statistics.notRequired}</div>
                <div className="text-sm text-muted-foreground">Not Required</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{statistics.completionPercentage}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Panel */}
      {showFilters && filterOptions && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Document Filters</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                >
                  <FilterIcon className="h-4 w-4 mr-2" />
                  {showFilterPanel ? 'Hide Filters' : 'Show Filters'}
                </Button>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button variant="outline" size="sm" onClick={refreshData}>
                  <RefreshCwIcon className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {showFilterPanel && (
            <CardContent className="border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tech Applicability Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Tech Applicability</label>
                  <Select
                    value={filters.techApplicabilityFilter || ''}
                    onValueChange={(value) => 
                      updateFilters({ techApplicabilityFilter: value || undefined })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      {filterOptions.techApplicabilities.map(tech => (
                        <SelectItem key={tech} value={tech}>{tech}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Market Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Markets</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {filterOptions.markets.map(market => (
                      <div key={market} className="flex items-center space-x-2">
                        <Checkbox
                          id={`market-${market}`}
                          checked={filters.marketFilter?.includes(market) || false}
                          onCheckedChange={(checked) => {
                            const currentMarkets = filters.marketFilter || [];
                            if (checked) {
                              updateFilters({ 
                                marketFilter: [...currentMarkets, market] 
                              });
                            } else {
                              updateFilters({ 
                                marketFilter: currentMarkets.filter(m => m !== market) 
                              });
                            }
                          }}
                        />
                        <label htmlFor={`market-${market}`} className="text-sm">{market}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <div className="space-y-2">
                    {filterOptions.statuses.map(status => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={filters.statusFilter?.includes(status) || false}
                          onCheckedChange={(checked) => {
                            const currentStatuses = filters.statusFilter || [];
                            if (checked) {
                              updateFilters({ 
                                statusFilter: [...currentStatuses, status] 
                              });
                            } else {
                              updateFilters({ 
                                statusFilter: currentStatuses.filter(s => s !== status) 
                              });
                            }
                          }}
                        />
                        <label htmlFor={`status-${status}`} className="text-sm">{status}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Documents {phaseName && `for ${phaseName}`}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({documents.length} documents)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No documents found matching the current filters.
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{doc.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {doc.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {doc.techApplicability}
                        </Badge>
                        {doc.markets.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Markets: {doc.markets.join(', ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Select
                        value={doc.status}
                        onValueChange={(value) => handleStatusChange(doc.id, value)}
                        disabled={updating}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not Started">Not Started</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Not Required">Not Required</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge className={getStatusColor(doc.status)} variant="outline">
                        {doc.status}
                      </Badge>
                    </div>
                  </div>
                  {doc.deadline && (
                    <div className="mt-2 flex items-center text-sm text-muted-foreground">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Due: {doc.deadline.toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
