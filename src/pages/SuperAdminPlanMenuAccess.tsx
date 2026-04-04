import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  BarChart3, Package, FileText, Monitor, TrendingUp, Clock, CheckCircle,
  Settings, Eye, MessageSquare, FileBarChart, Briefcase, Shield, Microscope,
  Timer, UserCheck, Check, X, Loader2, Cloud, GraduationCap,
  ArrowLeft, Users, Crown
} from "lucide-react";
import { MasterPlanEmailsDialog } from "@/components/super-admin/MasterPlanEmailsDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

interface MenuItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
  hasLimit?: boolean;  // For features that can have numeric limits (e.g., target markets)
  hasAccessModes?: boolean;  // For features that can have access modes (e.g., Market Analysis: manual, auto-data)
}

const missionControlMenuItems: MenuItem[] = [
  { id: 'mission-control', name: 'Mission Control', icon: <Monitor className="w-4 h-4" /> },
  { id: 'client-compass', name: 'Client Compass', icon: <Users className="w-4 h-4" /> }
];

const portfolioMenuItems: MenuItem[] = [
  { id: 'dashboard', name: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'milestones', name: 'Enterprise Roadmap', icon: <Clock className="w-4 h-4" /> },
  {
    id: 'commercial',
    name: 'Commercial Intelligence',
    icon: <TrendingUp className="w-4 h-4" />,
    children: [
      { id: 'strategic-blueprint', name: 'Strategic Blueprint' },
      { id: 'business-canvas', name: 'Business Canvas' },
      { id: 'feasibility-studies', name: 'Feasibility Studies' },
      { id: 'market-analysis', name: 'Market Analysis', hasAccessModes: true },
      { id: 'commercial-performance', name: 'Commercial Performance' },
      { id: 'variance-analysis', name: 'Variance Analysis' },
      { id: 'pricing-strategy', name: 'Pricing Strategy' },
      { id: 'investors', name: 'Investors' },
      { id: 'ip-portfolio', name: 'IP Portfolio' }
    ]
  },
  {
    id: 'device-portfolio',
    name: 'Portfolio Management',
    icon: <Package className="w-4 h-4" />,
    children: [
      { id: 'sunburst', name: 'Sunburst Chart' },
      { id: 'phases-chart', name: 'Phases Chart' },
      { id: 'cards', name: 'Device Cards' },
      { id: 'phases', name: 'Phases Board' },
      { id: 'timeline', name: 'Timeline View' },
      { id: 'list', name: 'Data Table' },
      { id: 'relationships', name: 'Sibling Device Groups' },
      { id: 'hierarchy-graph', name: 'Hierarchy Graph' },
      { id: 'bundles', name: 'Bundle Projects' }
    ]
  },
  {
    id: 'compliance-instances',
    name: 'Enterprise Compliance',
    icon: <CheckCircle className="w-4 h-4" />,
    children: [
      { id: 'documents', name: 'Documents' },
      { id: 'gap-analysis', name: 'Gap Analysis' },
      { id: 'activities', name: 'Activities' },
      { id: 'audits', name: 'Audits' }
    ]
  },
  {
    id: 'operations',
    name: 'Operations',
    icon: <Settings className="w-4 h-4" />,
    children: [
      { id: 'budget-dashboard', name: 'Budget Dashboard' },
      { id: 'suppliers', name: 'Suppliers' }
    ]
  },
  { id: 'pms', name: 'Post-Market Surveillance', icon: <Eye className="w-4 h-4" /> },
  { id: 'training', name: 'Training', icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'quality-governance', name: 'Quality Governance', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'audit-log', name: 'Audit Log', icon: <FileBarChart className="w-4 h-4" /> }
];

const devicesMenuItems: MenuItem[] = [
  { id: 'device-dashboard', name: 'Device Dashboard', icon: <Monitor className="w-4 h-4" /> },
  {
    id: 'business-case',
    name: 'Business Case',
    icon: <Briefcase className="w-4 h-4" />,
    children: [
      { id: 'viability-scorecard', name: 'Viability Scorecard' },
      { id: 'venture-blueprint', name: 'Venture Blueprint' },
      { id: 'business-canvas', name: 'Business Canvas' },
      { id: 'team-profile', name: 'Team' },
      { id: 'market-analysis', name: 'Market Analysis', hasAccessModes: true },
      { id: 'rnpv', name: 'rNPV Analysis' },
      { id: 'reimbursement', name: 'Reimbursement' },
      { id: 'pricing-strategy', name: 'Pricing Strategy' }
    ]
  },
  {
    id: 'device-definition',
    name: 'Device Definition',
    icon: <FileText className="w-4 h-4" />,
    children: [
      { id: 'overview', name: 'Overview' },
      { id: 'intended-purpose', name: 'Intended Purpose' },
      { id: 'general', name: 'General' },
      { id: 'identification', name: 'Identification' },
      { id: 'regulatory', name: 'Regulatory', hasLimit: true },
      { id: 'target-markets', name: 'Target Markets', hasLimit: true },
      { id: 'bundles', name: 'Bundles' },
      { id: 'audit-log', name: 'Audit Log' }
    ]
  },
  {
    id: 'design-risk-controls',
    name: 'Design & Risk Controls',
    icon: <Shield className="w-4 h-4" />,
    children: [
      { 
        id: 'requirements', 
        name: 'Requirements',
        children: [
          { id: 'user-needs', name: 'User Needs' },
          { id: 'system-requirements', name: 'System Requirements' },
          { id: 'software-requirements', name: 'Software Requirements' },
          { id: 'hardware-requirements', name: 'Hardware Requirements' }
        ]
      },
      { id: 'architecture', name: 'Architecture' },
      { id: 'risk-management', name: 'Risk Management' },
      { 
        id: 'verification-validation', 
        name: 'V&V',
        children: [
          { id: 'vv-plan', name: 'V&V Plan' },
          { id: 'test-cases', name: 'Test Cases' },
          { id: 'test-execution', name: 'Test Execution' },
          { id: 'defects', name: 'Defects' },
          { id: 'reports', name: 'Reports' }
        ]
      },
      { 
        id: 'traceability', 
        name: 'Traceability',
        children: [
          { id: 'matrix', name: 'Traceability Matrix' },
          { id: 'gaps', name: 'Gap Analysis' },
          { id: 'impact', name: 'Impact Analysis' },
          { id: 'settings', name: 'Settings' }
        ]
      }
    ]
  },
  { id: 'clinical-trials', name: 'Clinical Trials', icon: <Microscope className="w-4 h-4" /> },
  { id: 'milestones', name: 'Milestones', icon: <Timer className="w-4 h-4" /> },
  {
    id: 'compliance-instances',
    name: 'Enterprise Compliance',
    icon: <CheckCircle className="w-4 h-4" />,
    children: [
      { id: 'documents', name: 'Documents' },
      { id: 'gap-analysis', name: 'Gap Analysis' },
      { id: 'activities', name: 'Activities' },
      { id: 'audits', name: 'Audits' }
    ]
  },
  { id: 'pms', name: 'Post-Market Surveillance', icon: <Eye className="w-4 h-4" /> },
  { id: 'user-access', name: 'User Access', icon: <UserCheck className="w-4 h-4" />, hasLimit: true }
];

const draftStudioMenuItems: MenuItem[] = [
  { id: 'document-studio', name: 'Document Studio', icon: <FileText className="w-4 h-4" /> }
];

// Helper to get all IDs
const getAllMenuItemIds = (items: MenuItem[], prefix: string = ''): string[] => {
  const ids: string[] = [];
  items.forEach(item => {
    const fullId = prefix ? `${prefix}.${item.id}` : item.id;
    ids.push(fullId);
    if (item.children) {
      item.children.forEach(child => {
        const childId = `${fullId}.${child.id}`;
        ids.push(childId);
        // If child has access modes, also add manual and auto-data keys
        if (child.hasAccessModes) {
          ids.push(`${childId}.manual`);
          ids.push(`${childId}.auto-data`);
        }
      });
      // Recursively get children of nested children
      item.children.forEach(child => {
        if (child.children) {
          ids.push(...getAllMenuItemIds(child.children, `${fullId}.${child.id}`));
        }
      });
    }
  });
  return ids;
};

// Menu Item Row Component
const MenuItemRow = ({
  item,
  fullId,
  isEnabled,
  onToggle,
  menuAccess,
  onToggleChild,
  accentColor,
  featureLimits,
  onUpdateLimit
}: {
  item: MenuItem;
  fullId: string;
  isEnabled: boolean;
  onToggle: () => void;
  menuAccess: Record<string, boolean>;
  onToggleChild: (id: string) => void;
  accentColor: string;
  featureLimits: Record<string, number>;
  onUpdateLimit: (id: string, limit: number | null) => void;
}) => {
  const hasChildren = item.children && item.children.length > 0;

  // Helper to count all children (including nested) recursively
  const countAllChildren = (children: MenuItem[], parentId: string): { enabled: number; total: number } => {
    let enabled = 0;
    let total = 0;
    children.forEach(child => {
      const childId = `${parentId}.${child.id}`;
      total++;
      if (child.hasAccessModes) {
        const manualKey = `${childId}.manual`;
        const autoDataKey = `${childId}.auto-data`;
        if ((menuAccess[manualKey] !== false) || (menuAccess[autoDataKey] !== false)) {
          enabled++;
        }
      } else {
        if (menuAccess[childId] !== false) {
          enabled++;
        }
      }
      // Recursively count nested children
      if (child.children) {
        const nested = countAllChildren(child.children, childId);
        enabled += nested.enabled;
        total += nested.total;
      }
    });
    return { enabled, total };
  };

  const { enabled: enabledChildren, total: totalChildren } = hasChildren
    ? countAllChildren(item.children!, fullId)
    : { enabled: 0, total: 0 };

  // Check if this item itself has a limit (for top-level items like user-access)
  const itemHasLimit = item.hasLimit;
  const itemLimit = featureLimits[fullId];

  return (
    <div className={cn(
      "rounded-xl border transition-all h-fit",
      isEnabled
        ? "border-slate-300 shadow-sm bg-white"
        : "border-slate-300 bg-white"
    )}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl transition-colors",
          isEnabled ? accentColor : "bg-slate-100 text-slate-500"
        )}>
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium transition-colors",
            isEnabled ? "text-slate-900" : "text-slate-500"
          )}>
            {item.name}
          </p>
          {hasChildren && (
            <p className={cn(
              "text-xs mt-0.5 transition-colors",
              isEnabled ? "text-slate-500" : "text-slate-400"
            )}>
              {enabledChildren} of {totalChildren} sub-items enabled
            </p>
          )}
        </div>
        {/* Show limit input for top-level items with hasLimit */}
        {itemHasLimit && isEnabled && (
          <div className="flex items-center gap-2 mr-2">
            <span className="text-xs text-slate-500">Limit:</span>
            <input
              type="number"
              min="0"
              value={itemLimit ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateLimit(fullId, val === '' ? null : parseInt(val, 10));
              }}
              placeholder="∞"
              className="w-16 h-8 px-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
        <Switch
          checked={isEnabled}
          onCheckedChange={onToggle}
        />
      </div>

      {hasChildren && isEnabled && (
        <div className="px-4 pb-4 pt-1">
          <div className="flex flex-wrap gap-2">
            {item.children!.map(child => {
              const childId = `${fullId}.${child.id}`;
              const childEnabled = menuAccess[childId] !== false;
              const childHasLimit = child.hasLimit;
              const childHasAccessModes = child.hasAccessModes;
              const childLimit = featureLimits[childId];
              const childHasNestedChildren = child.children && child.children.length > 0;
              
              // For access modes, check separate keys
              const manualKey = `${childId}.manual`;
              const autoDataKey = `${childId}.auto-data`;
              const manualEnabled = childHasAccessModes ? (menuAccess[manualKey] !== false) : false;
              const autoDataEnabled = childHasAccessModes ? (menuAccess[autoDataKey] !== false) : false;

              return (
                <div key={childId} className="contents">
                  {childHasNestedChildren ? (
                    // Show parent label with nested children in a bordered container (like Market Analysis)
                    childEnabled ? (
                      <div className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white">
                        <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                          {child.name}:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {child.children!.map(nestedChild => {
                            const nestedChildId = `${childId}.${nestedChild.id}`;
                            const nestedChildEnabled = menuAccess[nestedChildId] !== false;
                            return (
                              <button
                                key={nestedChildId}
                                onClick={() => onToggleChild(nestedChildId)}
                                className={cn(
                                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                                  nestedChildEnabled
                                    ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                                    : "bg-white text-slate-500 border-slate-300 hover:border-slate-400"
                                )}
                              >
                                {nestedChildEnabled ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <X className="w-3 h-3" />
                                )}
                                {nestedChild.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      // When parent is disabled, show as regular button
                      <button
                        onClick={() => onToggleChild(childId)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                          "bg-white text-slate-500 border-slate-300 hover:border-slate-400"
                        )}
                      >
                        <X className="w-3 h-3" />
                        {child.name}
                      </button>
                    )
                  ) : childHasAccessModes ? (
                    // Show Market Analysis label with two toggle buttons in a bordered container
                    <div className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white">
                      <span className="text-xs font-medium text-slate-700 whitespace-nowrap">
                        {child.name}:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onToggleChild(manualKey);
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                            manualEnabled
                              ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                              : "bg-white text-slate-500 border-slate-300 hover:border-slate-400"
                          )}
                          title="Manual Mode"
                        >
                          {manualEnabled ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          🚧 Manual
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onToggleChild(autoDataKey);
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                            autoDataEnabled
                              ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                              : "bg-white text-slate-500 border-slate-300 hover:border-slate-400"
                          )}
                          title="Auto-Data Mode"
                        >
                          {autoDataEnabled ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          ✅ Auto-Data
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Regular toggle button for other features
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggleChild(childId)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                          childEnabled
                            ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                            : "bg-white text-slate-500 border-slate-300 hover:border-slate-400",
                          childHasLimit && childEnabled && "rounded-r-none border-r-0"
                        )}
                      >
                        {childEnabled ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                        {child.name}
                      </button>
                      {/* Show limit input for children with hasLimit when enabled */}
                      {childHasLimit && childEnabled && !childHasAccessModes && (
                        <input
                          type="number"
                          min="0"
                          value={childLimit ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            onUpdateLimit(childId, val === '' ? null : parseInt(val, 10));
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="∞"
                          className="w-14 h-[30px] px-2 text-xs border border-slate-900 rounded-r-full bg-slate-900 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Section Component
const MenuSection = ({
  title,
  icon,
  borderColor,
  headerBg,
  iconBg,
  items,
  prefix,
  menuAccess,
  onToggleAccess,
  onToggleAll,
  featureLimits,
  onUpdateLimit
}: {
  title: string;
  icon: React.ReactNode;
  borderColor: string;
  headerBg: string;
  iconBg: string;
  items: MenuItem[];
  prefix: string;
  menuAccess: Record<string, boolean>;
  onToggleAccess: (id: string) => void;
  onToggleAll: (enabled: boolean) => void;
  featureLimits: Record<string, number>;
  onUpdateLimit: (id: string, limit: number | null) => void;
}) => {
  const allIds = getAllMenuItemIds(items, prefix);
  const enabledCount = allIds.filter(id => menuAccess[id] !== false).length;
  const totalCount = allIds.length;
  const allEnabled = enabledCount === totalCount;

  return (
    <div className={cn("rounded-2xl border-2 overflow-hidden bg-white shadow-sm", borderColor)}>
      {/* Section Header */}
      <div className={cn("px-5 py-4", headerBg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl", iconBg)}>
              {icon}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm text-muted-foreground">{enabledCount} of {totalCount} features enabled</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-bold",
              allEnabled ? "text-slate-400" : "text-slate-700"
            )}>
              Disable
            </span>
            <Switch
              checked={allEnabled}
              onCheckedChange={onToggleAll}
            />
            <span className={cn(
              "text-sm font-bold",
              allEnabled ? "text-slate-700" : "text-slate-400"
            )}>
              Enable
            </span>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="p-4 bg-slate-50/50">
        <div className="grid grid-cols-2 gap-3 items-start">
          {items.map(item => {
            const fullId = `${prefix}.${item.id}`;
            const isEnabled = menuAccess[fullId] !== false;
            return (
              <MenuItemRow
                key={fullId}
                item={item}
                fullId={fullId}
                isEnabled={isEnabled}
                onToggle={() => onToggleAccess(fullId)}
                menuAccess={menuAccess}
                onToggleChild={onToggleAccess}
                accentColor={iconBg}
                featureLimits={featureLimits}
                onUpdateLimit={onUpdateLimit}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function SuperAdminPlanMenuAccess() {
  const { planName } = useParams<{ planName: string }>();
  const navigate = useNavigate();
  const decodedPlanName = decodeURIComponent(planName || '');

  const [planId, setPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  const allMenuItemIds = useMemo(() => [
    ...getAllMenuItemIds(missionControlMenuItems, 'missionControl'),
    ...getAllMenuItemIds(portfolioMenuItems, 'portfolio'),
    ...getAllMenuItemIds(devicesMenuItems, 'devices'),
    ...getAllMenuItemIds(draftStudioMenuItems, 'draftStudio')
  ], []);

  const [menuAccess, setMenuAccess] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    allMenuItemIds.forEach(id => { 
      // Default to false for access mode keys (.manual, .auto-data), true for others
      if (id.endsWith('.manual') || id.endsWith('.auto-data')) {
        initial[id] = false;
      } else {
        initial[id] = true;
      }
    });
    return initial;
  });

  // Feature limits for items with hasLimit (e.g., target markets count, user count)
  const [featureLimits, setFeatureLimits] = useState<Record<string, number>>({});

  // Load plan data on mount
  useEffect(() => {
    const loadPlanData = async () => {
      if (!decodedPlanName) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('id, menu_access')
          .eq('name', decodedPlanName)
          .single();

        if (error) throw error;

        if (data) {
          setPlanId(data.id);
          // Load existing menu_access or initialize with all enabled
          if (data.menu_access && typeof data.menu_access === 'object') {
            const menuAccessData = data.menu_access as Record<string, unknown>;

            // Extract feature_limits from menu_access if present
            const storedLimits = menuAccessData._feature_limits as Record<string, number> | undefined;
            if (storedLimits && typeof storedLimits === 'object') {
              setFeatureLimits(storedLimits);
            }

            // Load menu access booleans (excluding _feature_limits key)
            setMenuAccess(prev => {
              const merged: Record<string, boolean> = {};
              allMenuItemIds.forEach(id => {
                const value = menuAccessData[id];
                // Default to true for main items, false for access mode keys if not set
                if (id.endsWith('.manual') || id.endsWith('.auto-data')) {
                  merged[id] = typeof value === 'boolean' ? value : false;
                } else {
                  merged[id] = typeof value === 'boolean' ? value : true;
                }
              });
              return merged;
            });
          }
        }
      } catch (error) {
        console.error('Error loading plan:', error);
        toast.error('Failed to load plan data');
      } finally {
        setIsLoading(false);
        // Mark initial load complete after state updates settle
        setTimeout(() => {
          initialLoadRef.current = false;
        }, 100);
      }
    };

    loadPlanData();
  }, [decodedPlanName, allMenuItemIds]);

  const toggleMenuAccess = (id: string) => {
    setMenuAccess(prev => {
      const updated = { ...prev };
      const newValue = !prev[id];
      updated[id] = newValue;

      // If toggling a parent, also toggle all children
      allMenuItemIds.forEach(itemId => {
        if (itemId.startsWith(id + '.')) {
          updated[itemId] = newValue;
        }
      });

      setHasChanges(true);
      return updated;
    });
  };

  const enableAllInSection = (prefix: string, items: MenuItem[]) => {
    const ids = getAllMenuItemIds(items, prefix);
    setMenuAccess(prev => {
      const updated = { ...prev };
      ids.forEach(id => { updated[id] = true; });
      return updated;
    });
  };

  const disableAllInSection = (prefix: string, items: MenuItem[]) => {
    const ids = getAllMenuItemIds(items, prefix);
    setMenuAccess(prev => {
      const updated = { ...prev };
      ids.forEach(id => { updated[id] = false; });
      return updated;
    });
  };

  // Update feature limit for a specific menu item
  const updateFeatureLimit = (id: string, limit: number | null) => {
    setFeatureLimits(prev => {
      const updated = { ...prev };
      if (limit === null || limit === undefined) {
        delete updated[id];
      } else {
        updated[id] = limit;
      }
      return updated;
    });
  };

  const totalEnabled = Object.values(menuAccess).filter(Boolean).length;
  const totalItems = allMenuItemIds.length;

  // Auto-save function
  const saveToDatabase = useCallback(async (
    menuAccessData: Record<string, boolean>,
    featureLimitsData: Record<string, number>
  ) => {
    if (!planId) return;

    try {
      setSaveStatus('saving');
      setIsSaving(true);

      // Combine menu access and feature limits into single JSON object
      // Feature limits are stored under _feature_limits key
      const combinedData: Json = {
        ...menuAccessData,
        _feature_limits: featureLimitsData
      } as Json;

      const { error } = await supabase
        .from('subscription_plans')
        .update({ menu_access: combinedData })
        .eq('id', planId);

      if (error) throw error;

      setSaveStatus('saved');
      setHasChanges(false);

      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving menu access:', error);
      setSaveStatus('error');
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [planId]);

  // Auto-save effect with debounce
  useEffect(() => {
    // Skip on initial load (wait for data to load first)
    if (initialLoadRef.current) return;

    // Skip if no plan loaded yet
    if (!planId || isLoading) return;

    setHasChanges(true);
    setSaveStatus('idle');

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (1.5 seconds after last change)
    saveTimeoutRef.current = setTimeout(() => {
      saveToDatabase(menuAccess, featureLimits);
    }, 1500);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [menuAccess, featureLimits, planId, isLoading, saveToDatabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg">Loading plan data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/super-admin/app/plans')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Plans
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-bold">Menu Access Configuration</h1>
                <p className="text-sm text-muted-foreground">{decodedPlanName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Master Plan Button */}
              <MasterPlanEmailsDialog />
              <div className="h-8 w-px bg-border" />
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums">
                  {totalEnabled}
                  <span className="text-muted-foreground font-normal text-lg">/{totalItems}</span>
                </p>
                <p className="text-xs text-muted-foreground">features enabled</p>
              </div>
              <div className="flex gap-2">
                {/* Auto-save status indicator */}
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  saveStatus === 'saving' && "bg-blue-50 text-blue-600",
                  saveStatus === 'saved' && "bg-green-50 text-green-600",
                  saveStatus === 'idle' && !hasChanges && "bg-slate-100 text-slate-500"
                )}>
                  {saveStatus === 'saving' && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <Check className="w-4 h-4" />
                      Saved
                    </>
                  )}
                  {saveStatus === 'idle' && !hasChanges && (
                    <>
                      <Cloud className="w-4 h-4" />
                      Auto Save
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8 space-y-8">
        <MenuSection
          title="Mission Control"
          icon={<Monitor className="w-5 h-5 text-amber-700" />}
          borderColor="border-amber-100"
          headerBg="bg-amber-100"
          iconBg="bg-amber-200/50 text-amber-700"
          items={missionControlMenuItems}
          prefix="missionControl"
          menuAccess={menuAccess}
          onToggleAccess={toggleMenuAccess}
          onToggleAll={(enabled) => enabled ? enableAllInSection('missionControl', missionControlMenuItems) : disableAllInSection('missionControl', missionControlMenuItems)}
          featureLimits={featureLimits}
          onUpdateLimit={updateFeatureLimit}
        />

        <MenuSection
          title="Company Dashboard"
          icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
          borderColor="border-purple-200"
          headerBg="bg-purple-200"
          iconBg="bg-purple-100 text-purple-600"
          items={portfolioMenuItems}
          prefix="portfolio"
          menuAccess={menuAccess}
          onToggleAccess={toggleMenuAccess}
          onToggleAll={(enabled) => enabled ? enableAllInSection('portfolio', portfolioMenuItems) : disableAllInSection('portfolio', portfolioMenuItems)}
          featureLimits={featureLimits}
          onUpdateLimit={updateFeatureLimit}
        />

        <MenuSection
          title="Devices"
          icon={<Package className="w-5 h-5 text-blue-600" />}
          borderColor="border-blue-200"
          headerBg="bg-blue-200"
          iconBg="bg-blue-100 text-blue-600"
          items={devicesMenuItems}
          prefix="devices"
          menuAccess={menuAccess}
          onToggleAccess={toggleMenuAccess}
          onToggleAll={(enabled) => enabled ? enableAllInSection('devices', devicesMenuItems) : disableAllInSection('devices', devicesMenuItems)}
          featureLimits={featureLimits}
          onUpdateLimit={updateFeatureLimit}
        />

        <MenuSection
          title="Document Studio"
          icon={<FileText className="w-5 h-5 text-emerald-600" />}
          borderColor="border-emerald-200"
          headerBg="bg-emerald-100"
          iconBg="bg-emerald-100 text-emerald-600"
          items={draftStudioMenuItems}
          prefix="draftStudio"
          menuAccess={menuAccess}
          onToggleAccess={toggleMenuAccess}
          onToggleAll={(enabled) => enabled ? enableAllInSection('draftStudio', draftStudioMenuItems) : disableAllInSection('draftStudio', draftStudioMenuItems)}
          featureLimits={featureLimits}
          onUpdateLimit={updateFeatureLimit}
        />
      </div>
    </div>
  );
}
