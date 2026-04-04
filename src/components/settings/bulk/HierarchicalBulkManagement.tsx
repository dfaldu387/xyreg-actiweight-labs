import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HierarchicalBulkService, HierarchicalNode, HierarchyStats } from "@/services/hierarchicalBulkService";
import { HierarchyTreeView } from './HierarchyTreeView';
import { BulkOperationsPanel } from './BulkOperationsPanel';
import { HierarchyStatsOverview } from './HierarchyStatsOverview';
import { DetailedPortfolioOverview } from './DetailedPortfolioOverview';
import { ConfigurationWizard } from './ConfigurationWizard';
import { Package, Settings, Zap, BarChart3 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface HierarchicalBulkManagementProps {
  companyId: string;
}

export interface HierarchicalBulkManagementRef {
  setActiveTab: (tab: string) => void;
  highlightDevices: (devices: string[][]) => void;
}

export const HierarchicalBulkManagement = forwardRef<HierarchicalBulkManagementRef, HierarchicalBulkManagementProps>(
  ({ companyId }, ref) => {
  // console.log('[HierarchicalBulkManagement] 🎯 Component rendering with companyId:', companyId);

  const { lang } = useTranslation();
  const [hierarchy, setHierarchy] = useState<HierarchicalNode[]>([]);
  const [stats, setStats] = useState<HierarchyStats | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<HierarchicalNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [highlightedDevices, setHighlightedDevices] = useState<string[][]>([]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    setActiveTab: (tab: string) => {
      // console.log('Setting active tab to:', tab);
      setActiveTab(tab);
    },
    highlightDevices: (devices: string[][]) => {
      // console.log('Highlighting devices:', devices);
      setHighlightedDevices(devices);
    }
  }), []);
  
  useEffect(() => {
    // console.log('[HierarchicalBulkManagement] 🔄 useEffect triggered with companyId:', companyId);
    // console.log('[HierarchicalBulkManagement] 🔄 useEffect companyId type:', typeof companyId);
    // console.log('[HierarchicalBulkManagement] 🔄 useEffect companyId truthy:', !!companyId);
    
    if (companyId) {
      // console.log('[HierarchicalBulkManagement] ✅ CompanyId exists, calling loadData...');
      loadData();
    } else {
      console.warn('[HierarchicalBulkManagement] ⚠️ No companyId provided to useEffect');
      console.warn('[HierarchicalBulkManagement] ⚠️ CompanyId value:', companyId);
    }
  }, [companyId]);
  
  const loadData = async () => {
    // console.log('[HierarchicalBulkManagement] 🚀 STARTING loadData for company:', companyId);
    
    try {
      setLoading(true);
      
      // Test basic connection first
      // console.log('[HierarchicalBulkManagement] 🔍 Testing basic supabase connection...');
      
      // Call hierarchy service directly with better error handling
      // console.log('[HierarchicalBulkManagement] 📡 Calling getCompanyHierarchy...');
      // console.log('[HierarchicalBulkManagement] 🔧 DEBUG: HierarchicalBulkService object:', HierarchicalBulkService);
      // console.log('[HierarchicalBulkManagement] 🔧 DEBUG: getCompanyHierarchy method:', HierarchicalBulkService.getCompanyHierarchy);
      
      const hierarchyData = await HierarchicalBulkService.getCompanyHierarchy(companyId);
      // console.log('[HierarchicalBulkManagement] ✅ getCompanyHierarchy returned:', hierarchyData);
      // console.log('[HierarchicalBulkManagement] ✅ Hierarchy data type:', typeof hierarchyData);
      // console.log('[HierarchicalBulkManagement] ✅ Hierarchy data length:', hierarchyData?.length || 0, 'items');
      
      // console.log('[HierarchicalBulkManagement] 📊 Calling getHierarchyStats...');  
      const statsData = await HierarchicalBulkService.getHierarchyStats(companyId);
      // console.log('[HierarchicalBulkManagement] ✅ getHierarchyStats returned:', statsData);
      
      // console.log('[HierarchicalBulkManagement] 🔍 Setting state with hierarchy:', hierarchyData?.length || 0, 'items');
      setHierarchy(hierarchyData || []);
      setStats(statsData);
      
      // console.log('[HierarchicalBulkManagement] ✅ State updated successfully');
      
    } catch (error) {
      console.error('[HierarchicalBulkManagement] 💥 CRITICAL ERROR in loadData:', error);
      console.error('[HierarchicalBulkManagement] 💥 Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      
      // Set empty data on error to prevent infinite loading
      setHierarchy([]);
      setStats(null);
    } finally {
      setLoading(false);
      // console.log('[HierarchicalBulkManagement] 🏁 loadData completed, loading set to false');
    }
  };
  
  const handleNodeSelection = (nodes: HierarchicalNode[]) => {
    setSelectedNodes(nodes);
  };
  
  const handleBulkOperation = async () => {
    // Refresh data after bulk operations with a slight delay to ensure DB commits
    // console.log('[HierarchicalBulkManagement] 🔄 Starting post-operation refresh...');
    await new Promise(resolve => setTimeout(resolve, 500)); // Give DB time to commit
    await loadData();
    setSelectedNodes([]);
    
    // Dispatch custom event to notify other components (like the portfolio view) to refresh
    window.dispatchEvent(new CustomEvent('bulk-operation-complete', { 
      detail: { companyId } 
    }));
    
    // console.log('[HierarchicalBulkManagement] ✅ Post-operation refresh completed');
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{lang('bulkManagement.title')}</h2>
          <p className="text-muted-foreground">
            {lang('bulkManagement.description')}
          </p>
        </div>

        {stats && <HierarchyStatsOverview stats={stats} />}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {lang('bulkManagement.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="hierarchy" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {lang('bulkManagement.tabs.hierarchy')}
          </TabsTrigger>
          <TabsTrigger value="bulk-ops" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {lang('bulkManagement.tabs.bulkOperations')}
          </TabsTrigger>
          <TabsTrigger value="wizard" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            {lang('bulkManagement.tabs.quickSetup')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DetailedPortfolioOverview companyId={companyId} />
        </TabsContent>

        <TabsContent value="hierarchy" className="space-y-6">
                <HierarchyTreeView
                  hierarchy={hierarchy}
                  selectedNodes={selectedNodes}
                  onSelectionChange={handleNodeSelection}
                  companyId={companyId}
                  onHierarchyUpdate={loadData}
                  highlightedDevices={highlightedDevices}
                />
        </TabsContent>

        <TabsContent value="bulk-ops" className="space-y-6">
          <BulkOperationsPanel
            selectedNodes={selectedNodes}
            onOperationComplete={handleBulkOperation}
            companyId={companyId}
          />
        </TabsContent>

        <TabsContent value="wizard" className="space-y-6">
          <ConfigurationWizard
            companyId={companyId}
            hierarchy={hierarchy}
            onComplete={loadData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
});