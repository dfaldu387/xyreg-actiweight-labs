import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useEudamedNameUpdate } from '@/hooks/useEudamedNameUpdate';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DirectNameFixProps {
  companyId: string;
  companyName: string;
}

export function DirectNameFix({ companyId, companyName }: DirectNameFixProps) {
  const { isUpdating, progress, updateProductNames } = useEudamedNameUpdate();
  const [isFixing, setIsFixing] = useState(false);

  const handleDirectFix = async () => {
    setIsFixing(true);
    try {
     // Use the name update service directly
      const result = await updateProductNames(companyId);
      
      // Also try to update the specific problematic product directly
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, name, udi_di')
        .eq('company_id', companyId)
        .eq('id', '50b1a821-f851-40ac-89b4-1d08470ec61b');

      if (fetchError) {
        console.error('Error fetching specific product:', fetchError);
      } else if (products && products.length > 0) {
        const product = products[0];
        
        // Check if this product needs manual correction
        if (product.name.includes('Nox A1®') || product.name.includes('EEG Head Cable')) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ name: 'Snap-on Electrode Cables' })
            .eq('id', product.id);

          if (updateError) {
            console.error('Error updating specific product:', updateError);
          } else {
            toast.success(`Updated product name to: Snap-on Electrode Cables`);
          }
        }
      }
      
    } catch (error) {
      console.error('Direct fix failed:', error);
      toast.error('Fix failed: ' + error.message);
    } finally {
      setIsFixing(false);
    }
  };

  const isProcessing = isUpdating || isFixing;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          URGENT: Product Name Issue Detected
        </CardTitle>
        <CardDescription className="text-orange-700">
          Products are using trade names instead of EUDAMED device names. This needs immediate correction.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white p-4 rounded border border-orange-200">
          <h4 className="font-semibold mb-2">Example Issue Found:</h4>
          <div className="text-sm space-y-1">
            <div><strong>Current Name:</strong> "Nox A1® EEG Head Cable" (trade name)</div>
            <div><strong>Correct Name:</strong> "Snap-on Electrode Cables" (device name)</div>
          </div>
        </div>

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{isUpdating ? progress.operation : 'Processing fix...'}</span>
              <span>{isUpdating ? `${progress.processed}%` : ''}</span>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all"
                style={{ width: isUpdating ? `${progress.processed}%` : '50%' }}
              />
            </div>
          </div>
        )}

        <Button
          onClick={handleDirectFix}
          disabled={isProcessing}
          className="w-full bg-orange-600 hover:bg-orange-700"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isUpdating ? 'Updating Names...' : 'Processing Fix...'}
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Fix All Product Names Now
            </>
          )}
        </Button>

        <p className="text-xs text-orange-600 text-center">
          This will update all products in {companyName} to use correct EUDAMED device names
        </p>
      </CardContent>
    </Card>
  );
}