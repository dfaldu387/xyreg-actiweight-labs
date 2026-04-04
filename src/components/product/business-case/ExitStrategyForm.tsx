import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Target, Building2, TrendingUp, FileText, Plus, Pencil, Trash2, Loader2, Save } from 'lucide-react';
import { useExitStrategy, useSaveExitStrategy, Acquirer, ComparableTransaction, ExitStrategyData } from '@/hooks/useExitStrategy';
import { nanoid } from 'nanoid';

const ACQUIRER_TYPES = [
  { value: 'strategic', label: 'Strategic Buyer', color: 'bg-emerald-500' },
  { value: 'private_equity', label: 'Private Equity', color: 'bg-blue-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' },
];

const EXIT_TYPES = [
  { value: 'ma', label: 'M&A (Acquisition)' },
  { value: 'ipo', label: 'IPO' },
  { value: 'strategic_partnership', label: 'Strategic Partnership' },
];

const MULTIPLE_TYPES = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'ebitda', label: 'EBITDA' },
];

interface ExitStrategyFormProps {
  productId?: string;
  disabled?: boolean;
}

export function ExitStrategyForm({ productId: propProductId, disabled = false }: ExitStrategyFormProps) {
  const { productId: routeProductId } = useParams<{ productId: string }>();
  const productId = propProductId || routeProductId;
  
  const { data, isLoading, error } = useExitStrategy(productId);
  const { mutate: save, isPending: isSaving } = useSaveExitStrategy(productId);

  // Local form state
  const [acquirers, setAcquirers] = useState<Acquirer[]>([]);
  const [transactions, setTransactions] = useState<ComparableTransaction[]>([]);
  const [strategicRationale, setStrategicRationale] = useState('');
  const [exitTimelineYears, setExitTimelineYears] = useState<number | null>(null);
  const [preferredExitType, setPreferredExitType] = useState<string | null>(null);

  // Dialog state for acquirer
  const [acquirerDialogOpen, setAcquirerDialogOpen] = useState(false);
  const [editingAcquirer, setEditingAcquirer] = useState<Acquirer | null>(null);
  const [acquirerForm, setAcquirerForm] = useState<Partial<Acquirer>>({});

  // Dialog state for transaction
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<ComparableTransaction | null>(null);
  const [transactionForm, setTransactionForm] = useState<Partial<ComparableTransaction>>({});

  // Initialize form from fetched data
  useEffect(() => {
    if (data) {
      setAcquirers(data.potential_acquirers || []);
      setTransactions(data.comparable_transactions || []);
      setStrategicRationale(data.strategic_rationale || '');
      setExitTimelineYears(data.exit_timeline_years);
      setPreferredExitType(data.preferred_exit_type);
    }
  }, [data]);

  const handleSave = () => {
    save({
      potential_acquirers: acquirers,
      comparable_transactions: transactions,
      strategic_rationale: strategicRationale || null,
      exit_timeline_years: exitTimelineYears,
      preferred_exit_type: preferredExitType,
    });
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

    if (editingAcquirer) {
      setAcquirers(prev => prev.map(a => 
        a.id === editingAcquirer.id 
          ? { ...a, ...acquirerForm } as Acquirer
          : a
      ));
    } else {
      const newAcquirer: Acquirer = {
        id: nanoid(),
        name: acquirerForm.name,
        type: acquirerForm.type as Acquirer['type'],
        rationale: acquirerForm.rationale || '',
        acquisition_history: acquirerForm.acquisition_history,
      };
      setAcquirers(prev => [...prev, newAcquirer]);
    }
    setAcquirerDialogOpen(false);
    setAcquirerForm({});
  };

  const deleteAcquirer = (id: string) => {
    setAcquirers(prev => prev.filter(a => a.id !== id));
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

    if (editingTransaction) {
      setTransactions(prev => prev.map(t => 
        t.id === editingTransaction.id 
          ? { ...t, ...transactionForm } as ComparableTransaction
          : t
      ));
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
      setTransactions(prev => [...prev, newTransaction]);
    }
    setTransactionDialogOpen(false);
    setTransactionForm({});
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Calculate average multiple
  const avgMultiple = transactions.length > 0
    ? transactions
        .filter(t => t.multiple_value)
        .reduce((sum, t) => sum + (t.multiple_value || 0), 0) / 
      transactions.filter(t => t.multiple_value).length
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading Exit Strategy...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Error loading exit strategy data
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    return ACQUIRER_TYPES.find(t => t.value === type)?.color || 'bg-gray-500';
  };

  const getTypeLabel = (type: string) => {
    return ACQUIRER_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Exit Strategy & Comparable Valuations
          </h2>
          <p className="text-muted-foreground mt-1">
            Identify potential acquirers and comparable M&A transactions to show investors the path to liquidity
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

      {/* Section 1: Potential Acquirers */}
      <Card>
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

      {/* Section 2: Comparable Transactions */}
      <Card>
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
                  {avgMultiple && (
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={4} className="font-medium text-right">Average Multiple:</TableCell>
                      <TableCell className="font-bold">{avgMultiple.toFixed(1)}x</TableCell>
                      {!disabled && <TableCell />}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Strategic Rationale & Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-600" />
            Strategic Rationale & Timeline
          </CardTitle>
          <CardDescription>
            Why acquirers would want your technology, team, or market position
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="rationale">Strategic Rationale</Label>
            <Textarea
              id="rationale"
              placeholder="Describe why acquirers would be interested in your product. Consider: technology differentiation, market position, team expertise, regulatory approvals, customer relationships, IP portfolio..."
              value={strategicRationale}
              onChange={(e) => setStrategicRationale(e.target.value)}
              disabled={disabled}
              className="mt-2 min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="exit-type">Preferred Exit Type</Label>
              <Select
                value={preferredExitType || ''}
                onValueChange={(v) => setPreferredExitType(v || null)}
                disabled={disabled}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select exit type" />
                </SelectTrigger>
                <SelectContent>
                  {EXIT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeline">Exit Timeline (Years)</Label>
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
              <Label htmlFor="acq-name">Company Name *</Label>
              <Input
                id="acq-name"
                placeholder="e.g., Medtronic"
                value={acquirerForm.name || ''}
                onChange={(e) => setAcquirerForm(prev => ({ ...prev, name: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="acq-type">Acquirer Type *</Label>
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
              <Label htmlFor="acq-rationale">Why They'd Acquire You</Label>
              <Textarea
                id="acq-rationale"
                placeholder="Strategic fit, technology gap, market access..."
                value={acquirerForm.rationale || ''}
                onChange={(e) => setAcquirerForm(prev => ({ ...prev, rationale: e.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="acq-history">Acquisition History</Label>
              <Input
                id="acq-history"
                placeholder="e.g., Acquired 5 medtech startups in last 3 years"
                value={acquirerForm.acquisition_history || ''}
                onChange={(e) => setAcquirerForm(prev => ({ ...prev, acquisition_history: e.target.value }))}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcquirerDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveAcquirer} disabled={!acquirerForm.name}>
              {editingAcquirer ? 'Save Changes' : 'Add Acquirer'}
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
              Document a relevant M&A transaction in your space
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tx-target">Target Company *</Label>
                <Input
                  id="tx-target"
                  placeholder="e.g., AccuVein"
                  value={transactionForm.target_company || ''}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, target_company: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="tx-acquirer">Acquirer *</Label>
                <Input
                  id="tx-acquirer"
                  placeholder="e.g., Medtronic"
                  value={transactionForm.acquirer || ''}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, acquirer: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tx-date">Date</Label>
                <Input
                  id="tx-date"
                  placeholder="e.g., 2023"
                  value={transactionForm.date || ''}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="tx-value">Deal Value</Label>
                <Input
                  id="tx-value"
                  placeholder="e.g., $200M"
                  value={transactionForm.deal_value || ''}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, deal_value: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tx-mult-type">Multiple Type</Label>
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
                <Label htmlFor="tx-mult-value">Multiple Value</Label>
                <Input
                  id="tx-mult-value"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 8.5"
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
              {editingTransaction ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
