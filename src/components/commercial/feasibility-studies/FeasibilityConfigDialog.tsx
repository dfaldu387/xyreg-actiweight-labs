import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCompanyBundles } from '@/hooks/useCompanyBundles';
import { useCompanyProductSelection } from '@/hooks/useCompanyProductSelection';
import { BundleSelectionCard } from './BundleSelectionCard';
import { ProductSelectionCard } from './ProductSelectionCard';
import { useTranslation } from '@/hooks/useTranslation';

interface FeasibilityConfigDialogProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  onSubmit: (config: {
    name: string;
    description: string;
    sourceBundleId?: string;
    sourceProductId?: string;
  }) => void;
}

export function FeasibilityConfigDialog({
  open,
  onClose,
  companyId,
  onSubmit,
}: FeasibilityConfigDialogProps) {
  const { lang } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<'bundle' | 'product'>('bundle');
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const { data: bundles, isLoading: bundlesLoading } = useCompanyBundles(companyId);
  const { products, isLoading: productsLoading } = useCompanyProductSelection(companyId);

  const handleSubmit = () => {
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      sourceBundleId: sourceType === 'bundle' ? selectedBundleId || undefined : undefined,
      sourceProductId: sourceType === 'product' ? selectedProductId || undefined : undefined,
    });

    // Reset form
    setName('');
    setDescription('');
    setSelectedBundleId(null);
    setSelectedProductId(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>{lang('commercial.feasibilityStudies.dialogTitle')}</DialogTitle>
          <DialogDescription>
            {lang('commercial.feasibilityStudies.dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 min-h-0">
          <div className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="study-name">{lang('commercial.feasibilityStudies.studyName')}</Label>
              <Input
                id="study-name"
                placeholder={lang('commercial.feasibilityStudies.studyNamePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="study-description">{lang('commercial.feasibilityStudies.descriptionOptional')}</Label>
              <Textarea
                id="study-description"
                placeholder={lang('commercial.feasibilityStudies.descriptionPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{lang('commercial.feasibilityStudies.source')}</Label>
              <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as 'bundle' | 'product')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="bundle">{lang('commercial.feasibilityStudies.deviceBundle')}</TabsTrigger>
                  <TabsTrigger value="product">{lang('commercial.feasibilityStudies.individualDevice')}</TabsTrigger>
                </TabsList>

                <TabsContent value="bundle" className="mt-4">
                  <ScrollArea className="h-64">
                    <div className="space-y-2 px-2 py-1">
                      {bundlesLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      ) : bundles && bundles.length > 0 ? (
                        bundles.map((bundle) => (
                          <BundleSelectionCard
                            key={bundle.id}
                            bundle={bundle}
                            isSelected={selectedBundleId === bundle.id}
                            onSelect={() => setSelectedBundleId(bundle.id)}
                          />
                        ))
                      ) : (
                        <p className="text-center text-sm text-muted-foreground py-8">
                          {lang('commercial.feasibilityStudies.noBundlesAvailable')}
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="product" className="mt-4">
                  <ScrollArea className="h-64">
                    <div className="space-y-2 px-1 py-1">
                      {productsLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      ) : products && products.length > 0 ? (
                        products.map((product) => (
                          <ProductSelectionCard
                            key={product.id}
                            product={product}
                            isSelected={selectedProductId === product.id}
                            onSelect={() => setSelectedProductId(product.id)}
                          />
                        ))
                      ) : (
                        <p className="text-center text-sm text-muted-foreground py-8">
                          {lang('commercial.feasibilityStudies.noDevicesAvailable')}
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-background shrink-0">
          <Button variant="outline" onClick={onClose}>
            {lang('commercial.feasibilityStudies.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !name.trim() ||
              (sourceType === 'bundle' && !selectedBundleId) ||
              (sourceType === 'product' && !selectedProductId)
            }
          >
            {lang('commercial.feasibilityStudies.createStudy')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}