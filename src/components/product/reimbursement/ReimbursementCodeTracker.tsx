import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, CheckCircle2, AlertCircle, Clock, XCircle, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { ReimbursementCodeAIService } from '@/services/reimbursementCodeAIService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ReimbursementCodeDialog } from './ReimbursementCodeDialog';
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  Button as MuiButton,
  Typography,
  Box
} from '@mui/material';
import { useTranslation } from '@/hooks/useTranslation';

interface ReimbursementCode {
  id: string;
  product_id: string;
  company_id: string;
  market_code: string;
  code_type: string;
  code_value: string;
  code_description: string | null;
  coverage_status: string;
  application_date: string | null;
  approval_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ReimbursementCodeTrackerProps {
  productId: string;
  companyId: string;
  targetMarkets: string[];
  disabled?: boolean;
}

export function ReimbursementCodeTracker({ productId, companyId, targetMarkets, disabled = false }: ReimbursementCodeTrackerProps) {
  const { lang } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<ReimbursementCode | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingCode, setDeletingCode] = useState<ReimbursementCode | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const statusConfig = {
    exact_match: { icon: CheckCircle2, label: lang('reimbursementCode.statusExactMatch'), variant: 'default' as const, color: 'text-green-500' },
    partial_match: { icon: AlertCircle, label: lang('reimbursementCode.statusPartialMatch'), variant: 'secondary' as const, color: 'text-yellow-500' },
    pending: { icon: Clock, label: lang('reimbursementCode.statusPending'), variant: 'outline' as const, color: 'text-blue-500' },
    new_needed: { icon: XCircle, label: lang('reimbursementCode.statusNewNeeded'), variant: 'destructive' as const, color: 'text-red-500' },
  };

  // Fetch product data for AI suggestions
  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setDeletingCode(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCode) return;

    setIsDeleting(true);
    deleteMutation.mutate(deletingCode.id, {
      onSuccess: () => {
        setIsDeleting(false);
        setShowDeleteDialog(false);
        setDeletingCode(null);
      },
      onError: () => {
        setIsDeleting(false);
      },
    });
  };
  
  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['reimbursement-codes', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reimbursement_codes')
        .select('*')
        .eq('product_id', productId)
        .order('market_code', { ascending: true })
        .order('code_type', { ascending: true });

      if (error) throw error;
      return data as ReimbursementCode[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (codeId: string) => {
      const { error } = await supabase
        .from('product_reimbursement_codes')
        .delete()
        .eq('id', codeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reimbursement-codes', productId] });
      toast({ title: lang('reimbursementCode.codeDeleted') });
    },
    onError: (error) => {
      toast({ title: lang('reimbursementCode.deleteFailed'), description: error.message, variant: 'destructive' });
    },
  });

  const handleEdit = (code: ReimbursementCode) => {
    setEditingCode(code);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingCode(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCode(null);
  };

  const saveMutation = useMutation({
    mutationFn: async (codeData: any) => {
      const { error } = await supabase
        .from('product_reimbursement_codes')
        .insert(codeData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reimbursement-codes', productId] });
    },
  });

  const handleGetAISuggestions = async (market: string) => {
    if (!product) {
      sonnerToast.error(lang('reimbursementCode.productNotLoaded'));
      return;
    }

    setIsGeneratingAI(true);
    try {
      const intendedPurposeData = product.intended_purpose_data as any;

      const response = await ReimbursementCodeAIService.generateCodeSuggestions({
        companyId,
        market,
        productData: {
          product_name: product.name,
          intended_use: intendedPurposeData?.clinicalPurpose,
          device_type: product.device_type,
          clinical_purpose: intendedPurposeData?.clinicalPurpose,
          indications_for_use: intendedPurposeData?.indicationsForUse
        }
      });

      if (response.success && response.suggestions && response.suggestions.length > 0) {
        // Insert all AI-suggested codes
        const insertPromises = response.suggestions.map(suggestion =>
          saveMutation.mutateAsync({
            product_id: productId,
            company_id: companyId,
            market_code: market,
            code_type: 'AI Suggested',
            code_value: suggestion.code,
            code_description: suggestion.description,
            coverage_status: suggestion.status,
            notes: `AI Suggested (${suggestion.confidence}% confidence): ${suggestion.rationale}`,
          })
        );

        await Promise.all(insertPromises);

        sonnerToast.success(lang('reimbursementCode.aiCodesAdded', { count: response.suggestions.length, market }));
      } else {
        sonnerToast.error(lang('reimbursementCode.noSuggestionsGenerated'));
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
      sonnerToast.error(lang('reimbursementCode.aiSuggestionFailed'));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{lang('reimbursementCode.trackerTitle')}</CardTitle>
              <CardDescription>
                {lang('reimbursementCode.trackerDescription')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} size="sm" variant="outline" disabled={disabled}>
                <Plus className="h-4 w-4 mr-2" />
                {lang('reimbursementCode.addCode')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{lang('reimbursementCode.loadingCodes')}</div>
          ) : codes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {lang('reimbursementCode.noCodesYet')}
            </div>
          ) : (
            <div className="space-y-4">
              {targetMarkets.map(market => {
                const marketCodes = codes.filter(c => c.market_code === market);
                return (
                  <div key={market} className="border rounded-lg">
                    <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
                      <h3 className="font-semibold">{market}</h3>
                      <Button
                        onClick={() => handleGetAISuggestions(market)}
                        disabled={disabled || isGeneratingAI}
                        size="sm"
                        variant="ghost"
                      >
                        {isGeneratingAI ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {lang('reimbursementCode.generating')}
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            {lang('reimbursementCode.getAISuggestions')}
                          </>
                        )}
                      </Button>
                    </div>
                    {marketCodes.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        {lang('reimbursementCode.noCodesForMarket')}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{lang('reimbursementCode.codeType')}</TableHead>
                            <TableHead>{lang('reimbursementCode.codeValue')}</TableHead>
                            <TableHead>{lang('common.status')}</TableHead>
                            <TableHead>{lang('reimbursementCode.applicationDate')}</TableHead>
                            <TableHead>{lang('reimbursementCode.approvalDate')}</TableHead>
                            <TableHead className="text-right">{lang('common.actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {marketCodes.map((code) => {
                            const statusInfo = statusConfig[code.coverage_status as keyof typeof statusConfig];
                            const StatusIcon = statusInfo.icon;

                            return (
                              <TableRow key={code.id}>
                                <TableCell className="font-medium">{code.code_type}</TableCell>
                                <TableCell className="font-mono text-sm">{code.code_value}</TableCell>
                                <TableCell>
                                  <Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit">
                                    <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
                                    {statusInfo.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {code.application_date || '-'}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {code.approval_date || '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {!disabled && (
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEdit(code)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setDeletingCode(code);
                                          setShowDeleteDialog(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ReimbursementCodeDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        productId={productId}
        companyId={companyId}
        targetMarkets={targetMarkets}
        editingCode={editingCode}
      />
      <MuiDialog 
        open={showDeleteDialog} 
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
          }
        }}
      >
        <MuiDialogTitle
          sx={{
            color: 'hsl(var(--foreground))',
            fontWeight: 600,
            fontSize: '1.25rem',
            pb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <AlertTriangle className="h-5 w-5 text-red-500" />
          {lang('reimbursementCode.deleteCode')}
        </MuiDialogTitle>

        <MuiDialogContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mt: 1 }}>
            <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
            <Box>
              <Typography
                variant="body1"
                sx={{
                  color: 'hsl(var(--foreground))',
                  lineHeight: 1.5,
                  mb: 1
                }}
              >
                {lang('reimbursementCode.deleteConfirmation', { code: deletingCode?.code_value, market: deletingCode?.market_code })}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'hsl(var(--muted-foreground))',
                  lineHeight: 1.5
                }}
              >
                {lang('reimbursementCode.deleteWarning')}
              </Typography>
            </Box>
          </Box>
        </MuiDialogContent>

        <MuiDialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
          <MuiButton
            onClick={handleCancelDelete}
            disabled={isDeleting}
            variant="outlined"
            sx={{
              color: 'hsl(var(--foreground))',
              borderColor: 'hsl(var(--border))',
              '&:hover': {
                borderColor: 'hsl(var(--ring))',
                backgroundColor: 'hsl(var(--accent))',
              },
              '&:disabled': {
                color: 'hsl(var(--muted-foreground))',
                borderColor: 'hsl(var(--border))',
              }
            }}
          >
            {lang('common.cancel')}
          </MuiButton>
          <MuiButton
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            variant="contained"
            sx={{
              backgroundColor: '#dc2626',
              color: 'white',
              '&:hover': {
                backgroundColor: '#b91c1c',
              },
              '&:disabled': {
                backgroundColor: 'hsl(var(--muted))',
                color: 'hsl(var(--muted-foreground))',
              }
            }}
          >
            {isDeleting ? lang('reimbursementCode.deleting') : lang('common.delete')}
          </MuiButton>
        </MuiDialogActions>
      </MuiDialog>
    </>
  );
}
