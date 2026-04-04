import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Compass, Building2, TrendingUp, Landmark, Handshake, Briefcase, 
  CheckCircle2, Plus, Pencil, Trash2, Loader2, Save, AlertTriangle, Target
} from 'lucide-react';
import { useExitStrategy, useSaveExitStrategy, Acquirer, ComparableTransaction, ExitStrategyData, EndgameChecklistState } from '@/hooks/useExitStrategy';
import { useQueryClient } from '@tanstack/react-query';
import { ENDGAME_CONFIGS, ENDGAME_ORDER, EndgameType } from '@/lib/constants/endgameChecklists';
import { nanoid } from 'nanoid';
import { cn } from '@/lib/utils';
import { GenesisStepNotice } from './GenesisStepNotice';

const ACQUIRER_TYPES = [
  { value: 'strategic', label: 'Strategic Buyer', color: 'bg-emerald-500' },
  { value: 'private_equity', label: 'Private Equity', color: 'bg-blue-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' },
];

const MULTIPLE_TYPES = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'ebitda', label: 'EBITDA' },
];

const ENDGAME_ICONS: Record<EndgameType, React.ReactNode> = {
  trade_sale: <Building2 className="h-6 w-6" />,
  independent: <TrendingUp className="h-6 w-6" />,
  ipo: <Landmark className="h-6 w-6" />,
  licensing: <Handshake className="h-6 w-6" />,
  private_equity: <Briefcase className="h-6 w-6" />,
  uncertain: <Compass className="h-6 w-6" />,
};

interface StrategicHorizonFormProps {
  productId?: string;
  disabled?: boolean;
}

export function StrategicHorizonForm({ productId: propProductId, disabled = false }: StrategicHorizonFormProps) {
  const { productId: routeProductId } = useParams<{ productId: string }>();
  const productId = propProductId || routeProductId;
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useExitStrategy(productId);
  const { mutate: save, isPending: isSaving } = useSaveExitStrategy(productId);

  // Check if in Genesis flow
  const isInGenesisFlow = searchParams.get('returnTo') === 'genesis';

  // Local form state — initialize from URL subsection if present
  const initialEndgame = searchParams.get('subsection') as EndgameType | null;
  const [selectedEndgame, setSelectedEndgame] = useState<EndgameType | null>(initialEndgame);
  const [endgameChecklist, setEndgameChecklist] = useState<EndgameChecklistState>({});
  const [acquirers, setAcquirers] = useState<Acquirer[]>([]);
  const [transactions, setTransactions] = useState<ComparableTransaction[]>([]);
  const [strategicRationale, setStrategicRationale] = useState('');
  const [exitTimelineYears, setExitTimelineYears] = useState<number | null>(null);

  // Dialog state for acquirer
  const [acquirerDialogOpen, setAcquirerDialogOpen] = useState(false);
  const [editingAcquirer, setEditingAcquirer] = useState<Acquirer | null>(null);
  const [acquirerForm, setAcquirerForm] = useState<Partial<Acquirer>>({});

  // Dialog state for transaction
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ComparableTransaction | null>(null);
  const [transactionForm, setTransactionForm] = useState<Partial<ComparableTransaction>>({});

  // Genesis flow completion check - requires BOTH acquirers AND transactions
  const hasAcquirers = acquirers.length > 0;
  const hasTransactions = transactions.length > 0;
  const hasBothComplete = hasAcquirers && hasTransactions;
  const hasEndgameSelected = selectedEndgame !== null;

  // Get Genesis flow border class for Endgame section
  const getEndgameBorderClass = () => {
    if (!isInGenesisFlow) return '';
    if (hasEndgameSelected) return 'border-2 border-emerald-500 bg-emerald-50/30';
    return 'border-2 border-amber-400 bg-amber-50/30';
  };

  // Get Genesis flow border class for Acquirers section
  const getAcquirersBorderClass = () => {
    if (!isInGenesisFlow) return '';
    if (hasAcquirers) return 'border-2 border-emerald-500 bg-emerald-50/30';
    return 'border-2 border-amber-400 bg-amber-50/30';
  };

  // Get Genesis flow border class for Transactions section — no Genesis styling (not a required step)
  const getTransactionsBorderClass = () => {
    return '';
  };

  // Auto-save refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Mark initial load complete after data loads
  useEffect(() => {
    if (!isLoading) {
      isInitialLoadRef.current = false;
    }
  }, [isLoading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save callback
  const triggerAutoSave = useCallback((updatedAcquirers: Acquirer[], updatedTransactions: ComparableTransaction[]) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      console.log('[StrategicHorizon] Auto-saving...', {
        acquirers: updatedAcquirers.length,
        transactions: updatedTransactions.length,
      });
      save({
        selected_endgame: selectedEndgame,
        endgame_checklist: endgameChecklist,
        endgame_metrics_focus: selectedEndgame ? ENDGAME_CONFIGS[selectedEndgame].metricsFocus : null,
        potential_acquirers: updatedAcquirers,
        comparable_transactions: updatedTransactions,
        strategic_rationale: strategicRationale || null,
        exit_timeline_years: exitTimelineYears,
        preferred_exit_type: selectedEndgame,
      }, {
        onSuccess: () => {
          console.log('[StrategicHorizon] Auto-save complete');
          queryClient.invalidateQueries({ queryKey: ["exit-strategy", productId] });
        },
        onError: (error) => {
          console.error("[StrategicHorizon] Auto-save failed:", error);
        }
      });
    }, 1000);
  }, [save, queryClient, productId, selectedEndgame, endgameChecklist, strategicRationale, exitTimelineYears]);

  // Read subsection from URL
  const subsectionFromUrl = searchParams.get('subsection') as EndgameType | null;

  // Initialize form from fetched data
  useEffect(() => {
    if (data) {
      // Use subsection from URL if present, otherwise use saved data
      const endgame = subsectionFromUrl || data.selected_endgame;
      setSelectedEndgame(endgame);

      // Initialize checklist for URL-defaulted endgame
      const checklist = data.endgame_checklist || {};
      if (endgame && !data.selected_endgame) {
        const config = ENDGAME_CONFIGS[endgame];
        config.checklist.forEach(item => {
          if (!(item.id in checklist)) {
            checklist[item.id] = false;
          }
        });
      }
      setEndgameChecklist(checklist);
      setAcquirers(data.potential_acquirers || []);
      setTransactions(data.comparable_transactions || []);
      setStrategicRationale(data.strategic_rationale || '');
      setExitTimelineYears(data.exit_timeline_years);

      // In Genesis flow, auto-scroll to Potential Acquirers if M&A/PE already selected
      if (isInGenesisFlow && (endgame === 'trade_sale' || endgame === 'private_equity')) {
        setTimeout(() => {
          const el = document.getElementById('genesis-potential-acquirers');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 1000);
      }
    }
  }, [data, subsectionFromUrl]);

  const handleSave = () => {
    save({
      selected_endgame: selectedEndgame,
      endgame_checklist: endgameChecklist,
      endgame_metrics_focus: selectedEndgame ? ENDGAME_CONFIGS[selectedEndgame].metricsFocus : null,
      potential_acquirers: acquirers,
      comparable_transactions: transactions,
      strategic_rationale: strategicRationale || null,
      exit_timeline_years: exitTimelineYears,
      preferred_exit_type: selectedEndgame, // Map endgame to preferred type for backwards compatibility
    });
  };

  const handleEndgameSelect = (endgame: EndgameType) => {
    if (disabled) return;
    setSelectedEndgame(endgame);
    // Update URL with subsection
    const newParams = new URLSearchParams(searchParams);
    newParams.set('subsection', endgame);
    setSearchParams(newParams, { replace: true });
    // Initialize checklist for new endgame if not already set
    const config = ENDGAME_CONFIGS[endgame];
    const newChecklist: EndgameChecklistState = { ...endgameChecklist };
    config.checklist.forEach(item => {
      if (!(item.id in newChecklist)) {
        newChecklist[item.id] = false;
      }
    });
    setEndgameChecklist(newChecklist);

    // In Genesis flow, auto-scroll to Potential Acquirers after selecting M&A or PE
    if (isInGenesisFlow && (endgame === 'trade_sale' || endgame === 'private_equity')) {
      setTimeout(() => {
        const el = document.getElementById('genesis-potential-acquirers');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  };

  const handleChecklistToggle = (itemId: string) => {
    if (disabled) return;
    setEndgameChecklist(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Acquirer handlers
  const openAddAcquirer = () => {
    setEditingAcquirer(null);
    setAcquirerForm({ type: 'strategic' });
    setAcquirerDialogOpen(true);
  };

  const openEditAcquirer = (acquirer: Acquirer) => {
    setEditingAcquirer(acquirer);
    setAcquirerForm(acquirer);
    setAcquirerDialogOpen(true);
  };

  const saveAcquirer = () => {
    if (!acquirerForm.name || !acquirerForm.type) return;

    let updatedAcquirers: Acquirer[];
    if (editingAcquirer) {
      updatedAcquirers = acquirers.map(a =>
        a.id === editingAcquirer.id
          ? { ...a, ...acquirerForm } as Acquirer
          : a
      );
    } else {
      const newAcquirer: Acquirer = {
        id: nanoid(),
        name: acquirerForm.name,
        type: acquirerForm.type as Acquirer['type'],
        rationale: acquirerForm.rationale || '',
        acquisition_history: acquirerForm.acquisition_history,
      };
      updatedAcquirers = [...acquirers, newAcquirer];
    }
    setAcquirers(updatedAcquirers);
    setAcquirerDialogOpen(false);
    setAcquirerForm({});

    // Auto-save
    if (!isInitialLoadRef.current && !disabled) {
      triggerAutoSave(updatedAcquirers, transactions);
    }
  };

  const deleteAcquirer = (id: string) => {
    const updatedAcquirers = acquirers.filter(a => a.id !== id);
    setAcquirers(updatedAcquirers);

    // Auto-save
    if (!isInitialLoadRef.current && !disabled) {
      triggerAutoSave(updatedAcquirers, transactions);
    }
  };

  // Transaction handlers
  const openAddTransaction = () => {
    setEditingTransaction(null);
    setTransactionForm({});
    setTransactionDialogOpen(true);
  };

  const openEditTransaction = (transaction: ComparableTransaction) => {
    setEditingTransaction(transaction);
    setTransactionForm(transaction);
    setTransactionDialogOpen(true);
  };

  const saveTransaction = () => {
    if (!transactionForm.target_company || !transactionForm.acquirer) return;

    let updatedTransactions: ComparableTransaction[];
    if (editingTransaction) {
      updatedTransactions = transactions.map(t =>
        t.id === editingTransaction.id
          ? { ...t, ...transactionForm } as ComparableTransaction
          : t
      );
    } else {
      const newTransaction: ComparableTransaction = {
        id: nanoid(),
        target_company: transactionForm.target_company,
        acquirer: transactionForm.acquirer,
        date: transactionForm.date || '',
        deal_value: transactionForm.deal_value,
        multiple_type: transactionForm.multiple_type as ComparableTransaction['multiple_type'],
        multiple_value: transactionForm.multiple_value,
      };
      updatedTransactions = [...transactions, newTransaction];
    }
    setTransactions(updatedTransactions);
    setTransactionDialogOpen(false);
    setTransactionForm({});

    // Auto-save
    if (!isInitialLoadRef.current && !disabled) {
      triggerAutoSave(acquirers, updatedTransactions);
    }
  };

  const deleteTransaction = (id: string) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);

    // Auto-save
    if (!isInitialLoadRef.current && !disabled) {
      triggerAutoSave(acquirers, updatedTransactions);
    }
  };

  // Calculate checklist completion
  const getChecklistProgress = () => {
    if (!selectedEndgame) return { completed: 0, total: 0 };
    const config = ENDGAME_CONFIGS[selectedEndgame];
    const completed = config.checklist.filter(item => endgameChecklist[item.id]).length;
    return { completed, total: config.checklist.length };
  };

  // Get type helpers
  const getTypeColor = (type: string) => {
    return ACQUIRER_TYPES.find(t => t.value === type)?.color || 'bg-gray-500';
  };

  const getTypeLabel = (type: string) => {
    return ACQUIRER_TYPES.find(t => t.value === type)?.label || type;
  };

  // Show acquirers/transactions for M&A and PE paths
  const showAcquirersSection = selectedEndgame === 'trade_sale' || selectedEndgame === 'private_equity';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading Strategic Horizon...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Error loading strategic horizon data
      </div>
    );
  }

  const checklistProgress = getChecklistProgress();
  const selectedConfig = selectedEndgame ? ENDGAME_CONFIGS[selectedEndgame] : null;

  return (
    <div className="space-y-6">
      <GenesisStepNotice stepNumber={23} stepName="Strategic Horizon" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Compass className="h-6 w-6" />
            Strategic Horizon
          </h2>
          <p className="text-muted-foreground mt-1">
            Where does this end? Define your strategic path and prepare accordingly.
          </p>
        </div>
        <Button onClick={handleSave} disabled={disabled || isSaving} className="gap-2">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Strategy
            </>
          )}
        </Button>
      </div>

      {/* Section 1: Endgame Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Your Endgame
          </CardTitle>
          <CardDescription>
            Select your primary strategic ambition for the next 5-7 years
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 6-column grid to fit all endgame cards in one row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {ENDGAME_ORDER.map((endgame) => {
              const config = ENDGAME_CONFIGS[endgame];
              const isSelected = selectedEndgame === endgame;
              
              // Genesis styling: Yellow border when no selection, Green when selected
              const useGenesisGreen = isInGenesisFlow && isSelected;
              const useGenesisYellow = isInGenesisFlow && !hasEndgameSelected;

              return (
                <button
                  key={endgame}
                  onClick={() => handleEndgameSelect(endgame)}
                  disabled={disabled}
                  className={cn(
                    "relative p-3 rounded-lg border-2 text-left transition-all",
                    "hover:shadow-md hover:border-primary/50",
                    // Genesis styling - all cards get yellow when none selected, selected card gets green
                    useGenesisGreen
                      ? "border-emerald-500 bg-emerald-50/30 shadow-md"
                      : useGenesisYellow
                        ? "border-amber-400 bg-amber-50/30"
                        // Normal styling (outside Genesis flow)
                        : isSelected
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border bg-card",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className={cn(
                        "h-4 w-4",
                        useGenesisGreen ? "text-emerald-500" : "text-primary"
                      )} />
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <div className={cn(
                      "p-1.5 rounded-md w-fit",
                      // Genesis styling for icon
                      useGenesisGreen
                        ? "bg-emerald-500/10 text-emerald-600"
                        : useGenesisYellow
                          ? "bg-amber-500/10 text-amber-600"
                          // Normal styling
                          : isSelected
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                    )}>
                      {ENDGAME_ICONS[endgame]}
                    </div>
                    <h4 className="font-semibold text-xs leading-tight">{config.title}</h4>
                    <p className="text-[10px] text-muted-foreground leading-tight">{config.subtitle}</p>
                    <Badge variant="outline" className="w-fit text-[10px] mt-0.5 px-1.5 py-0">
                      {config.goal}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Strategic Focus Panel (shown when endgame selected) */}
      {selectedConfig && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {ENDGAME_ICONS[selectedEndgame!]}
                  Strategic Focus: {selectedConfig.title}
                </CardTitle>
                <CardDescription>
                  Key requirements and checklist for your chosen path
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                Focus: {selectedConfig.metricsFocus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Warning message if applicable */}
            {selectedConfig.warningMessage && (
              <Alert variant="destructive" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-200">Strategy Gap Warning</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  {selectedConfig.warningMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Checklist */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-medium">Readiness Checklist</Label>
                <span className="text-sm text-muted-foreground">
                  {checklistProgress.completed} / {checklistProgress.total} complete
                </span>
              </div>
              <div className="space-y-2">
                {selectedConfig.checklist.map((item) => (
                  <label
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      endgameChecklist[item.id] 
                        ? "bg-primary/5 border-primary/30" 
                        : "bg-card border-border hover:border-primary/30",
                      disabled && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <Checkbox
                      checked={endgameChecklist[item.id] || false}
                      onCheckedChange={() => handleChecklistToggle(item.id)}
                      disabled={disabled}
                    />
                    <span className={cn(
                      "text-sm",
                      endgameChecklist[item.id] && "line-through text-muted-foreground"
                    )}>
                      {item.label}
                    </span>
                    {item.required && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        Required
                      </Badge>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 3: Potential Acquirers (only for M&A and PE paths) */}
      {showAcquirersSection && (
        <Card id="genesis-potential-acquirers" className={cn(getAcquirersBorderClass())}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  Potential Acquirers
                </CardTitle>
                <CardDescription>
                  Strategic buyers, private equity, or larger medtech companies interested in your space
                </CardDescription>
              </div>
              {!disabled && (
                <Button onClick={openAddAcquirer} size="sm" variant="outline" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Acquirer
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {acquirers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No potential acquirers added yet</p>
                <p className="text-sm">Click "Add Acquirer" to identify strategic exit opportunities</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {acquirers.map((acquirer) => (
                  <div key={acquirer.id} className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{acquirer.name}</h4>
                        <Badge variant="secondary" className={`${getTypeColor(acquirer.type)} text-white text-xs mt-1`}>
                          {getTypeLabel(acquirer.type)}
                        </Badge>
                      </div>
                      {!disabled && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditAcquirer(acquirer)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteAcquirer(acquirer.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {acquirer.rationale && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{acquirer.rationale}</p>
                    )}
                    {acquirer.acquisition_history && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        History: {acquirer.acquisition_history}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section 4: Comparable Transactions (only for M&A and PE paths) */}
      {showAcquirersSection && (
        <Card id="genesis-comparable-transactions" className={cn(getTransactionsBorderClass())}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Comparable Transactions
                </CardTitle>
                <CardDescription>
                  Recent M&A deals in your category with revenue or EBITDA multiples
                </CardDescription>
              </div>
              {!disabled && (
                <Button onClick={openAddTransaction} size="sm" variant="outline" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Transaction
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No comparable transactions added yet</p>
                <p className="text-sm">Click "Add Transaction" to document relevant M&A deals</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Target Company</TableHead>
                      <TableHead>Acquirer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Deal Value</TableHead>
                      <TableHead>Multiple</TableHead>
                      {!disabled && <TableHead className="w-[80px]">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.target_company}</TableCell>
                        <TableCell>{transaction.acquirer}</TableCell>
                        <TableCell>{transaction.date || '—'}</TableCell>
                        <TableCell>{transaction.deal_value || '—'}</TableCell>
                        <TableCell>
                          {transaction.multiple_value ? (
                            <span>
                              {transaction.multiple_value}x {transaction.multiple_type}
                            </span>
                          ) : '—'}
                        </TableCell>
                        {!disabled && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditTransaction(transaction)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteTransaction(transaction.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section 5: Strategic Rationale & Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-amber-600" />
            Strategic Rationale & Timeline
          </CardTitle>
          <CardDescription>
            {selectedEndgame === 'independent' 
              ? 'Why you can build a sustainable commercial business'
              : selectedEndgame === 'licensing'
              ? 'Why partners would want to license your technology'
              : 'Why acquirers would want your technology, team, or market position'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="rationale">Strategic Rationale</Label>
            <Textarea
              id="rationale"
              placeholder={
                selectedEndgame === 'independent'
                  ? 'Describe your path to commercial independence. Consider: market size, gross margin potential, sales team structure, distribution strategy...'
                  : selectedEndgame === 'licensing'
                  ? 'Describe the value of licensing your technology. Consider: IP strength, reference design quality, territory opportunities...'
                  : 'Describe why acquirers would be interested. Consider: technology differentiation, market position, team expertise, regulatory approvals, IP portfolio...'
              }
              value={strategicRationale}
              onChange={(e) => setStrategicRationale(e.target.value)}
              disabled={disabled}
              className="mt-2 min-h-[120px]"
            />
          </div>

          <div className="max-w-xs">
            <Label htmlFor="timeline">Timeline to Outcome (Years)</Label>
            <Input
              id="timeline"
              type="number"
              min={1}
              max={20}
              placeholder="e.g., 5"
              value={exitTimelineYears || ''}
              onChange={(e) => setExitTimelineYears(e.target.value ? parseInt(e.target.value) : null)}
              disabled={disabled}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Acquirer Dialog */}
      <Dialog open={acquirerDialogOpen} onOpenChange={setAcquirerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAcquirer ? 'Edit Acquirer' : 'Add Potential Acquirer'}</DialogTitle>
            <DialogDescription>
              Identify a company that could be a potential acquirer for your product
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="acquirer-name">Company Name</Label>
              <Input
                id="acquirer-name"
                placeholder="e.g., Medtronic"
                value={acquirerForm.name || ''}
                onChange={(e) => setAcquirerForm(prev => ({ ...prev, name: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="acquirer-type">Buyer Type</Label>
              <Select
                value={acquirerForm.type || 'strategic'}
                onValueChange={(v) => setAcquirerForm(prev => ({ ...prev, type: v as Acquirer['type'] }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACQUIRER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="acquirer-rationale">Strategic Rationale</Label>
              <Textarea
                id="acquirer-rationale"
                placeholder="Why would this company want to acquire you?"
                value={acquirerForm.rationale || ''}
                onChange={(e) => setAcquirerForm(prev => ({ ...prev, rationale: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="acquirer-history">Acquisition History (optional)</Label>
              <Input
                id="acquirer-history"
                placeholder="e.g., Acquired XYZ Corp for $500M in 2023"
                value={acquirerForm.acquisition_history || ''}
                onChange={(e) => setAcquirerForm(prev => ({ ...prev, acquisition_history: e.target.value }))}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcquirerDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveAcquirer} disabled={!acquirerForm.name}>
              {editingAcquirer ? 'Update' : 'Add'} Acquirer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add Comparable Transaction'}</DialogTitle>
            <DialogDescription>
              Document a relevant M&A deal in your category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="target-company">Target Company</Label>
              <Input
                id="target-company"
                placeholder="Company that was acquired"
                value={transactionForm.target_company || ''}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, target_company: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="transaction-acquirer">Acquirer</Label>
              <Input
                id="transaction-acquirer"
                placeholder="Company that made the acquisition"
                value={transactionForm.acquirer || ''}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, acquirer: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transaction-date">Date</Label>
                <Input
                  id="transaction-date"
                  type="date"
                  value={transactionForm.date || ''}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="deal-value">Deal Value</Label>
                <Input
                  id="deal-value"
                  placeholder="e.g., $500M"
                  value={transactionForm.deal_value || ''}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, deal_value: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="multiple-type">Multiple Type</Label>
                <Select
                  value={transactionForm.multiple_type || ''}
                  onValueChange={(v) => setTransactionForm(prev => ({ ...prev, multiple_type: v as ComparableTransaction['multiple_type'] }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MULTIPLE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="multiple-value">Multiple Value</Label>
                <Input
                  id="multiple-value"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 5.0"
                  value={transactionForm.multiple_value || ''}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, multiple_value: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransactionDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveTransaction} disabled={!transactionForm.target_company || !transactionForm.acquirer}>
              {editingTransaction ? 'Update' : 'Add'} Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
