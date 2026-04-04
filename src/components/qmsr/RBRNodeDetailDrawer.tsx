import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText,
  Plus,
  ExternalLink,
  Shield,
  Zap,
  Database,
  Info,
  BookOpen,
  Settings2,
  Loader2,
  Link2,
} from 'lucide-react';
import type { RBRPulseStatus } from '@/hooks/useRBRPulseStatus';
import { EscalateToCAPA } from './EscalateToCAPA';
import { HELIX_NODE_CONFIGS } from '@/config/helixNodeConfig';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ISO13485ClausePopover } from './ISO13485ClausePopover';
import { CAPAAggregationPanel } from '@/components/capa/CAPAAggregationPanel';
import { useCAPACompanyAggregation } from '@/hooks/useCAPAAggregation';
import { NodeInternalProcessPopover } from './NodeInternalProcessPopover';
import { useQmsNodeData } from '@/hooks/useQmsNodeProcess';
import { NodeItemsListDialog } from './NodeItemsListDialog';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Data source mapping for each node type
 * Explains where the displayed information comes from
 */
const NODE_DATA_SOURCES: Record<string, {
  table?: string;
  tableName?: string;
  fields: { name: string; source: string }[];
}> = {
  // Rung 1 - Company Foundation
  'mgmt-resp': {
    fields: [
      { name: 'Status', source: 'Derived from management review records and quality policy approvals' },
      { name: 'Progress', source: 'Based on documented management review cycles' },
      { name: 'Last Updated', source: 'Most recent management review date' },
    ]
  },
  'resource-strategy': {
    table: 'training_records',
    tableName: 'Training & Competency Records',
    fields: [
      { name: 'Status', source: 'Personnel competence evaluations and training compliance' },
      { name: 'Progress', source: 'training_records completion rate per role' },
      { name: 'RBR-TRN', source: 'Training Effectiveness Rationales' },
    ]
  },
  'infra-training': {
    fields: [
      { name: 'Status', source: 'Equipment qualification status (IQ/OQ/PQ)' },
      { name: 'Progress', source: 'Qualified equipment and validated IT systems' },
      { name: 'Future', source: 'Will link to equipment_qualifications table when implemented' },
    ]
  },

  // Rung 2 - Device Upstream
  'reg-planning': {
    fields: [
      { name: 'Status', source: 'Regulatory pathway decisions per product' },
      { name: 'Progress', source: 'Products with completed pathway selection' },
      { name: 'RBR-REG', source: 'Pathway Selection Rationales (not yet implemented)' },
    ]
  },
  'design-inputs': {
    fields: [
      { name: 'Status', source: 'Design input documents per product' },
      { name: 'Progress', source: 'Products with complete design input specifications' },
    ]
  },
  'supplier-selection': {
    table: 'supplier_criticality_rationales',
    tableName: 'Supplier Criticality Rationales',
    fields: [
      { name: 'Status', source: 'Approved vs pending supplier classifications' },
      { name: 'Total/Pending/Approved', source: 'supplier_criticality_rationales table' },
      { name: 'RBR-SUP', source: 'Supplier Criticality Rationale documents' },
    ]
  },

  // Rung 3 - Device Execution
  'risk-mgmt': {
    fields: [
      { name: 'Status', source: 'Risk Management File completion per product' },
      { name: 'Progress', source: 'Products with completed risk assessments' },
    ]
  },
  'design-dev': {
    table: 'design_change_rationales',
    tableName: 'Design Change Rationales',
    fields: [
      { name: 'Status', source: 'Active design change orders and approvals' },
      { name: 'Progress', source: 'Approved vs pending design changes' },
      { name: 'RBR-DCH', source: 'Design Change Impact Rationales' },
    ]
  },
  'supplier-controls': {
    fields: [
      { name: 'Status', source: 'Supplier audit and monitoring records' },
      { name: 'Progress', source: 'Suppliers meeting control requirements' },
    ]
  },

  // Rung 4 - Device Verification
  'vv-testing': {
    table: 'sample_size_rationales',
    tableName: 'Sample Size Rationales',
    fields: [
      { name: 'Status', source: 'V&V protocol completion status' },
      { name: 'Progress', source: 'Approved sample size justifications' },
      { name: 'RBR-SAM', source: 'Statistical Sample Size Rationales' },
    ]
  },
  'process-validation': {
    table: 'process_validation_rationales',
    tableName: 'Process Validation Rationales',
    fields: [
      { name: 'Status', source: 'IQ/OQ/PQ completion status' },
      { name: 'Progress', source: 'Validated vs pending processes' },
      { name: 'RBR-ENG', source: 'Process Validation Approach Rationales' },
    ]
  },
  'production-monitoring': {
    fields: [
      { name: 'Status', source: 'Production control and monitoring records' },
      { name: 'Progress', source: 'Products in active production' },
    ]
  },

  // Rung 5 - Feedback
  'pms': {
    fields: [
      { name: 'Status', source: 'PMS plans and complaint trending data' },
      { name: 'Progress', source: 'Products with active surveillance' },
      { name: 'RBR-CLE', source: 'Clinical Evaluation Rationales (not yet implemented)' },
    ]
  },
  'capa-loop': {
    table: 'capa_priority_rationales',
    tableName: 'CAPA Priority Rationales',
    fields: [
      { name: 'Status', source: 'Open CAPAs and escalation decisions' },
      { name: 'Progress', source: 'capa_priority_rationales table counts' },
      { name: 'RBR-CAP', source: 'CAPA Priority Decision Rationales' },
    ]
  },
  'device-pms': {
    fields: [
      { name: 'Status', source: 'Product-specific PMS data and complaints' },
      { name: 'Progress', source: 'Device vigilance and feedback records' },
    ]
  },
  'device-capa': {
    table: 'capa_priority_rationales',
    tableName: 'CAPA Priority Rationales (Product-filtered)',
    fields: [
      { name: 'Status', source: 'Product-specific CAPA records' },
      { name: 'Progress', source: 'capa_priority_rationales filtered by product_id' },
    ]
  },
};

interface RBRNodeDetailDrawerProps {
  pulse: RBRPulseStatus | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateRationale?: () => void;
  onViewAll?: () => void;
  // For escalation support
  productId?: string;
  companyId?: string;
  onEscalated?: () => void;
}

const statusConfig = {
  dormant: {
    color: 'text-gray-500',
    bg: 'bg-gray-100',
    border: 'border-gray-200',
    icon: Clock,
    labelKey: 'deviceProcessEngine.drawerStatusDormant',
  },
  active: {
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: Clock,
    labelKey: 'deviceProcessEngine.drawerStatusActive',
  },
  validated: {
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: CheckCircle,
    labelKey: 'deviceProcessEngine.drawerStatusValidated',
  },
  critical: {
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertTriangle,
    labelKey: 'deviceProcessEngine.drawerStatusCriticalGap',
  },
};

const riskColors = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
};

/**
 * Generate concrete, context-specific recommendations based on actual data.
 * NEVER show generic "ensure ISO clause" messages - always be specific.
 */
function generateConcreteRecommendations(pulse: RBRPulseStatus): string[] {
  const recommendations: string[] = [];
  const isCapaNode = pulse.nodeId === 'device-capa' || pulse.nodeId === 'capa-loop';
  
  // Check for overdue items (items with dueDate in the past)
  const overdueItems = pulse.pendingItems?.filter(item => {
    if ('dueDate' in item && item.dueDate) {
      return new Date(item.dueDate) < new Date();
    }
    return false;
  }) || [];
  
  // Check for items in specific statuses that need action
  const investigationItems = pulse.pendingItems?.filter(item => 
    item.status === 'investigation' || item.status === 'draft'
  ) || [];
  
  const planningItems = pulse.pendingItems?.filter(item => 
    item.status === 'planning' || item.status === 'pending'
  ) || [];
  
  // 1. Prioritize overdue items first
  if (overdueItems.length > 0) {
    overdueItems.forEach(item => {
      const daysOverdue = 'dueDate' in item && item.dueDate 
        ? Math.ceil((new Date().getTime() - new Date(item.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      if (daysOverdue > 0) {
        recommendations.push(`Prioritize ${item.documentId} - ${daysOverdue} days overdue`);
      }
    });
  }
  
  // 2. Items needing investigation/RCA
  if (investigationItems.length > 0) {
    const itemIds = investigationItems.map(i => i.documentId).join(', ');
    if (isCapaNode) {
      recommendations.push(`Complete root cause analysis for: ${itemIds}`);
    } else {
      recommendations.push(`Complete review for: ${itemIds}`);
    }
  }
  
  // 3. Items needing planning/action plan approval
  if (planningItems.length > 0) {
    const itemIds = planningItems.map(i => i.documentId).join(', ');
    if (isCapaNode) {
      recommendations.push(`Submit action plan for approval: ${itemIds}`);
    } else {
      recommendations.push(`Review and approve pending: ${itemIds}`);
    }
  }
  
  // 4. Linked CAPA resolution
  if (pulse.linkedCAPA) {
    recommendations.push(`Resolve blocking CAPA: ${pulse.linkedCAPA}`);
  }
  
  // 5. If no items at all, suggest creating documentation
  if (pulse.count === 0 && !pulse.pendingItems?.length) {
    // Be specific about what kind of documentation based on node type
    const docTypes: Record<string, string> = {
      'device-capa': 'No open CAPAs for this device - monitor for new quality events',
      'capa-loop': 'No CAPA priority rationales - system is healthy',
      'design-inputs': 'Create Design Input Specification document',
      'design-dev': 'Create Design Change documentation',
      'vv-testing': 'Create V&V Protocol with sample size justification',
      'process-validation': 'Create Process Validation Protocol (IQ/OQ/PQ)',
      'supplier-selection': 'Complete supplier criticality assessment',
      'risk-mgmt': 'Create Risk Management File with hazard analysis',
    };
    recommendations.push(docTypes[pulse.nodeId] || `Create initial ${pulse.label} documentation`);
  }
  
  // 6. If pending items exist but no overdue/investigation/planning - general review
  if (recommendations.length === 0 && pulse.pendingItems && pulse.pendingItems.length > 0) {
    recommendations.push(`Review ${pulse.pendingItems.length} pending item(s) awaiting action`);
  }
  
  // 7. If all healthy with no pending items
  if (recommendations.length === 0) {
    if (pulse.status === 'validated') {
      recommendations.push('All items approved - no action required');
    } else if (pulse.status === 'dormant') {
      recommendations.push('Node inactive - initiate when ready');
    } else {
      recommendations.push('Review current status and plan next steps');
    }
  }
  
  return recommendations;
}

export function RBRNodeDetailDrawer({
  pulse,
  isOpen,
  onClose,
  onCreateRationale,
  onViewAll,
  productId,
  companyId,
  onEscalated,
}: RBRNodeDetailDrawerProps) {
  const { lang } = useTranslation();
  const [processPopoverOpen, setProcessPopoverOpen] = useState(false);
  const [itemsDialogState, setItemsDialogState] = useState<{
    isOpen: boolean;
    variant: 'pending' | 'approved';
  }>({ isOpen: false, variant: 'pending' });
  
  // Determine if this is a company-level CAPA node (shows aggregation)
  const isCompanyCAPANode = pulse?.nodeId === 'capa-loop';
  
  // Fetch aggregation data for company CAPA node
  const aggregation = useCAPACompanyAggregation(isCompanyCAPANode ? companyId : undefined);
  
  // Fetch internal process and SOP data for this node
  const nodeProcessData = useQmsNodeData(companyId, pulse?.nodeId);
  
  if (!pulse) return null;

  const config = statusConfig[pulse.status];
  const Icon = config.icon;
  const progressPercent = pulse.count > 0 ? (pulse.approvedCount / pulse.count) * 100 : 0;
  
  // Get node configuration for data source info
  const nodeConfig = HELIX_NODE_CONFIGS.find(n => n.id === pulse.nodeId);
  const dataSource = NODE_DATA_SOURCES[pulse.nodeId];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={cn(
        'fixed right-0 top-0 bottom-0 w-96 max-w-full z-50',
        'bg-white backdrop-blur-xl border-l border-gray-200',
        'shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.15)]',
        'transform transition-transform duration-300 ease-out',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Header */}
        <div className={cn(
          'flex items-start justify-between p-6 border-b',
          config.border,
          config.bg
        )}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn(
                'text-[10px] font-mono font-bold',
                config.color,
                config.border
              )}>
                {pulse.nodeType}
              </Badge>
              <Badge variant="outline" className={cn(
                'text-[10px]',
                riskColors[pulse.riskLevel]
              )}>
                {pulse.riskLevel.toUpperCase()} {lang('deviceProcessEngine.risk')}
              </Badge>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {pulse.label}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <Icon className={cn('h-4 w-4', config.color)} />
              <span className={cn('text-sm font-medium', config.color)}>
                {lang(config.labelKey)}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100%-180px)]">
          <div className="p-6 space-y-6">
            {/* QMS Reference - with clickable clause help */}
            <ISO13485ClausePopover 
              clauseRef={pulse.isoClause} 
              nodeLabel={pulse.label}
            >
              <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-50 border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors group">
                <Shield className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">{lang('deviceProcessEngine.isoClauseReference')}</p>
                  <p className="text-sm font-mono font-medium text-gray-900">
                    {lang('deviceProcessEngine.clause')} {pulse.isoClause}
                  </p>
                </div>
                <BookOpen className="h-4 w-4 text-purple-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </ISO13485ClausePopover>

            {/* Internal Process & SOP Section */}
            <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold text-foreground">{lang('deviceProcessEngine.internalProcessSOP')}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5"
                  onClick={() => setProcessPopoverOpen(true)}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {lang('deviceProcessEngine.view')}
                </Button>
              </div>
              
              {/* Process preview */}
              {nodeProcessData.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {lang('deviceProcessEngine.loading')}
                </div>
              ) : nodeProcessData.process?.process_description ? (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {nodeProcessData.process.process_description}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  {lang('deviceProcessEngine.noProcessDescription')}
                </p>
              )}
              
              {/* Linked SOPs preview */}
              {nodeProcessData.sops.length > 0 && (
                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  <Link2 className="h-3.5 w-3.5 text-purple-500" />
                  <span className="text-xs text-muted-foreground">
                    {lang('deviceProcessEngine.sopsLinked').replace('{count}', String(nodeProcessData.sops.length))}
                  </span>
                  {nodeProcessData.sops.some(s => s.document?.status?.toLowerCase() === 'approved') && (
                    <Badge variant="outline" className="h-5 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {lang('deviceProcessEngine.approved')}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{lang('deviceProcessEngine.approvalProgress')}</span>
                <span className="font-medium text-gray-900">
                  {pulse.approvedCount} / {pulse.count}
                </span>
              </div>
              <Progress 
                value={progressPercent} 
                className="h-2 bg-gray-100"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{pulse.pendingCount} {lang('deviceProcessEngine.pending').toLowerCase()}</span>
                <span>{Math.round(progressPercent)}% {lang('deviceProcessEngine.complete')}</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted border border-border text-center">
                <p className="text-2xl font-bold text-foreground">{pulse.count}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{lang('deviceProcessEngine.total')}</p>
              </div>
              <div
                className={cn(
                  "p-3 rounded-lg bg-amber-50 border border-amber-200 text-center transition-all",
                  pulse.pendingCount > 0 && "cursor-pointer hover:bg-amber-100 hover:border-amber-300 hover:shadow-sm"
                )}
                onClick={() => pulse.pendingCount > 0 && setItemsDialogState({ isOpen: true, variant: 'pending' })}
              >
                <p className="text-2xl font-bold text-amber-600">{pulse.pendingCount}</p>
                <p className="text-[10px] text-amber-600 uppercase tracking-wider">{lang('deviceProcessEngine.pending')}</p>
              </div>
              <div
                className={cn(
                  "p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center transition-all",
                  pulse.approvedCount > 0 && "cursor-pointer hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-sm"
                )}
                onClick={() => pulse.approvedCount > 0 && setItemsDialogState({ isOpen: true, variant: 'approved' })}
              >
                <p className="text-2xl font-bold text-emerald-600">{pulse.approvedCount}</p>
                <p className="text-[10px] text-emerald-600 uppercase tracking-wider">{lang('deviceProcessEngine.approved')}</p>
              </div>
            </div>

            {/* Company CAPA Aggregation Panel - Only for company-level capa-loop node */}
            {isCompanyCAPANode && (
              <CAPAAggregationPanel
                stats={aggregation.stats}
                patterns={aggregation.patterns}
                escalatedCAPAs={aggregation.escalatedCAPAs}
                openCAPAs={aggregation.openCAPAs}
                isLoading={aggregation.isLoading}
              />
            )}

            {/* Why Critical Section - with detailed diagnostics */}
            {pulse.status === 'critical' && (
              <div className="p-4 rounded-lg border bg-red-50 border-red-300 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-700">{lang('deviceProcessEngine.whyCritical')}</span>
                </div>
                
                {/* Specific Critical Issues */}
                {pulse.criticalIssues && pulse.criticalIssues.length > 0 ? (
                  <div className="space-y-2">
                    {pulse.criticalIssues.map((issue, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-red-800">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-red-800">
                    <span className="font-medium">{lang('deviceProcessEngine.issue')}: </span>
                    {pulse.pendingCount > 0
                      ? lang('deviceProcessEngine.pendingItemsRequireReview').replace('{count}', String(pulse.pendingCount))
                      : pulse.linkedCAPA
                        ? lang('deviceProcessEngine.openCapaBlocking').replace('{capa}', pulse.linkedCAPA)
                        : lang('deviceProcessEngine.noDocumentation').replace('{clause}', pulse.isoClause)}
                  </p>
                )}

                {/* Pending Items Detail */}
                {pulse.pendingItems && pulse.pendingItems.length > 0 && (
                  <div className="pt-2 border-t border-red-200">
                    <p className="text-xs font-semibold text-red-700 mb-2">{lang('deviceProcessEngine.pendingItemsRequiringAction')}</p>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {pulse.pendingItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-white/60 rounded border border-red-200">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono font-medium text-red-800 truncate">{item.documentId}</p>
                            <p className="text-[10px] text-red-600 truncate">{item.name}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 bg-amber-50 ml-2">
                            {item.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Recommended Actions - Concrete and Context-Specific */}
                <div className="pt-2 border-t border-red-200">
                  <p className="font-medium text-red-700 text-xs mb-1">{lang('deviceProcessEngine.recommendedActions')}</p>
                  <ul className="list-disc list-inside text-xs space-y-1 text-red-700">
                    {generateConcreteRecommendations(pulse).map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Pending Items Section (for active status) */}
            {pulse.status === 'active' && pulse.pendingItems && pulse.pendingItems.length > 0 && (
              <div className="p-4 rounded-lg border bg-amber-50 border-amber-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700">{lang('deviceProcessEngine.itemsAwaitingReview')}</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {pulse.pendingItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-white/60 rounded border border-amber-200">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono font-medium text-amber-800 truncate">{item.documentId}</p>
                        <p className="text-[10px] text-amber-600 truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-500">{lang('deviceProcessEngine.created')} {new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 bg-amber-50 ml-2">
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linked CAPA */}
            {pulse.linkedCAPA && pulse.status !== 'critical' && (
              <div className={cn(
                'p-4 rounded-lg border',
                'bg-red-50 border-red-200'
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-700">{lang('deviceProcessEngine.linkedCapa')}</span>
                </div>
                <p className="text-sm font-mono text-red-800">{pulse.linkedCAPA}</p>
                <p className="text-xs text-red-600 mt-1">
                  {lang('deviceProcessEngine.openCapaBlockingValidation')}
                </p>
              </div>
            )}

            {/* Last Updated */}
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-500">{lang('deviceProcessEngine.lastUpdated')}</span>
              </div>
              <p className="text-sm text-gray-900">
                {pulse.lastUpdated 
                  ? new Date(pulse.lastUpdated).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : lang('deviceProcessEngine.never')
                }
              </p>
            </div>

            {/* Data Source Attribution */}
            {dataSource && (
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">{lang('deviceProcessEngine.dataSource')}</span>
                </div>
                
                {/* Primary Table */}
                {dataSource.table && (
                  <div className="mb-3 p-2 bg-white/60 rounded border border-blue-100">
                    <p className="text-[10px] text-blue-600 uppercase tracking-wide mb-0.5">{lang('deviceProcessEngine.primaryTable')}</p>
                    <p className="text-xs font-mono text-blue-800">{dataSource.table}</p>
                    {dataSource.tableName && (
                      <p className="text-[10px] text-gray-500 mt-0.5">{dataSource.tableName}</p>
                    )}
                  </div>
                )}
                
                {/* Field Sources */}
                <div className="space-y-2">
                  {dataSource.fields.map((field, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-gray-700">{field.name}: </span>
                        <span className="text-xs text-gray-500">{field.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white space-y-2">
          {/* Escalation Button - Only show for critical nodes with device context */}
          {pulse.status === 'critical' && productId && companyId && (
            <EscalateToCAPA
              nodeId={pulse.nodeType}
              nodeLabel={pulse.label}
              productId={productId}
              companyId={companyId}
              isCritical={true}
              onEscalated={onEscalated}
            />
          )}
          
          {onCreateRationale && (
            <Button
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={onCreateRationale}
            >
              <Plus className="h-4 w-4" />
              {lang('deviceProcessEngine.createNewRationale')}
            </Button>
          )}
          {onViewAll && (
            <Button
              variant="outline"
              className="w-full gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={onViewAll}
            >
              {lang('deviceProcessEngine.viewAllRationales')}
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Internal Process Popover */}
      {companyId && pulse?.nodeId && (
        <NodeInternalProcessPopover
          isOpen={processPopoverOpen}
          onClose={() => setProcessPopoverOpen(false)}
          nodeId={pulse.nodeId}
          companyId={companyId}
        />
      )}

      {/* Items List Dialog */}
      <NodeItemsListDialog
        isOpen={itemsDialogState.isOpen}
        onClose={() => setItemsDialogState({ ...itemsDialogState, isOpen: false })}
        title={itemsDialogState.variant === 'pending' ? lang('deviceProcessEngine.pendingItems') : lang('deviceProcessEngine.approvedItems')}
        items={itemsDialogState.variant === 'pending' ? (pulse.pendingItems || []) : (pulse.approvedItems || [])}
        variant={itemsDialogState.variant}
      />
    </>
  );
}
