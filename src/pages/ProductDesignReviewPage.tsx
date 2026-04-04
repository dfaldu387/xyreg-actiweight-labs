import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDesignReviews } from '@/hooks/useDesignReviews';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ClipboardCheck, AlertTriangle, PenTool, CheckCircle2, Trash2 } from 'lucide-react';
import { DesignReview, REVIEW_TYPE_LABELS, STATUS_LABELS, formatBaselineLabel } from '@/types/designReview';
import { DesignReviewCreateDialog } from '@/components/design-review/DesignReviewCreateDialog';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    scoping: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    in_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    closing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return (
    <Badge className={variants[status] || variants.draft}>
      {STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}
    </Badge>
  );
}

export default function ProductDesignReviewPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const { lang } = useTranslation();

  // Get product's company_id
  const { data: product } = useQuery({
    queryKey: ['product-company', productId],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, company_id, name').eq('id', productId!).single();
      return data;
    },
    enabled: !!productId,
  });

  const { reviewsQuery } = useDesignReviews(product?.company_id, productId);
  const reviews = reviewsQuery.data || [];

  // Analytics
  const totalReviews = reviews.length;
  const completedBaselines = reviews.filter(r => r.status === 'completed').length;
  const activeReviews = reviews.filter(r => !['completed', 'cancelled'].includes(r.status)).length;

  // Fetch finding counts per review
  const { data: findingCounts } = useQuery({
    queryKey: ['design-review-finding-counts', productId],
    queryFn: async () => {
      const reviewIds = reviews.map(r => r.id);
      if (reviewIds.length === 0) return {};
      const { data } = await supabase
        .from('design_review_findings' as any)
        .select('design_review_id, status')
        .in('design_review_id', reviewIds);
      const counts: Record<string, { open: number; total: number }> = {};
      ((data || []) as any[]).forEach(f => {
        if (!counts[f.design_review_id]) counts[f.design_review_id] = { open: 0, total: 0 };
        counts[f.design_review_id].total++;
        if (f.status !== 'closed') counts[f.design_review_id].open++;
      });
      return counts;
    },
    enabled: reviews.length > 0,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            {lang('designReview.productPageTitle')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang('designReview.productPageSubtitle')}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> {lang('designReview.newDesignReview')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{lang('designReview.totalReviews')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalReviews}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{lang('designReview.active')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-600">{activeReviews}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{lang('designReview.completedBaselines')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{completedBaselines}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{lang('designReview.openFindings')}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {Object.values(findingCounts || {}).reduce((sum, c) => sum + (c as any).open, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang('designReview.drId')}</TableHead>
                <TableHead>{lang('designReview.title')}</TableHead>
                <TableHead>{lang('designReview.type')}</TableHead>
                <TableHead>{lang('designReview.phase')}</TableHead>
                <TableHead>{lang('designReview.status')}</TableHead>
                <TableHead>{lang('designReview.findings')}</TableHead>
                <TableHead>{lang('designReview.baseline')}</TableHead>
                <TableHead>{lang('designReview.date')}</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {lang('designReview.noReviewsYet')}
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map(review => {
                  const fc = (findingCounts as any)?.[review.id];
                  return (
                    <TableRow
                      key={review.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/app/product/${productId}/design-review/${review.id}`)}
                    >
                      <TableCell className="font-mono text-sm">{review.dr_id}</TableCell>
                      <TableCell className="font-medium">{review.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{REVIEW_TYPE_LABELS[review.review_type]}</Badge>
                      </TableCell>
                      <TableCell>{review.phase_name || '—'}</TableCell>
                      <TableCell><StatusBadge status={review.status} /></TableCell>
                      <TableCell>
                        {fc ? (
                          <span className={fc.open > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                            {fc.open}/{fc.total}
                          </span>
                        ) : '0/0'}
                      </TableCell>
                      <TableCell>{formatBaselineLabel(review.baseline_label)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {review.due_date
                          ? format(new Date(review.due_date), 'MMM d, yyyy')
                          : format(new Date(review.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {review.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!confirm(lang('designReview.deleteConfirm', { title: review.title }))) return;
                              const { error } = await supabase.from('design_reviews' as any).delete().eq('id', review.id);
                              if (error) { toast.error(lang('designReview.deleteFailed')); return; }
                              queryClient.invalidateQueries({ queryKey: ['design-reviews'] });
                              toast.success(lang('designReview.deleteSuccess'));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DesignReviewCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyId={product?.company_id || ''}
        productId={productId || ''}
      />
    </div>
  );
}
