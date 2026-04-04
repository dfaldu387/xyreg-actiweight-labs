import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EudamedDataPopulatorProps {
  productId: string;
  onDataUpdated?: () => void;
}

export function EudamedDataPopulator({ productId, onDataUpdated }: EudamedDataPopulatorProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [productData, setProductData] = React.useState<any>(null);
  const [eudamedData, setEudamedData] = React.useState<any>(null);

  useEffect(() => {
    loadProductData();
  }, [productId]);

  const loadProductData = async () => {
    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, trade_name, udi_di, basic_udi_di, key_features')
        .eq('id', productId)
        .maybeSingle();

      if (productError) {
        console.error('Error loading product:', productError);
        return;
      }

      setProductData(product);

      // First check if EUDAMED data already exists in key_features
      const keyFeatures = product?.key_features as any;
      if (keyFeatures?.eudamed_data) {
        console.log('Found existing EUDAMED data in key_features:', keyFeatures.eudamed_data);
        const eudamedData = keyFeatures.eudamed_data;
        
        // Convert the existing data to the format expected by the component
        const formattedData = {
          device_name: product.name?.split(' (')[0], // Extract device name without UDI-DI
          trade_names: eudamedData.trade_names,
          udi_di: product.udi_di,
          basic_udi_di_code: product.basic_udi_di,
          risk_class: eudamedData.risk_class || 'class-i',
          organization: 'Nox Medical',
          reference_number: eudamedData.reference_number,
          nomenclature_codes: eudamedData.nomenclature_codes
        };
        
        setEudamedData([formattedData]);
        return;
      }

      // If no existing EUDAMED data and product has UDI-DI, try to fetch from database
      if (product?.udi_di) {
        console.log('Searching EUDAMED by UDI-DI:', product.udi_di);
        
        // First try direct lookup by UDI-DI using RPC function
        const { data: directLookup, error: directError } = await supabase
          .rpc('get_eudamed_devices_by_company', {
            company_identifier: product.udi_di, // Search by UDI-DI as identifier
            limit_count: 1
          });

        if (directError) {
          console.error('Error with direct UDI-DI lookup:', directError);
        } else if (directLookup && directLookup.length > 0) {
          console.log('Found direct EUDAMED match:', directLookup[0]);
          setEudamedData(directLookup);
          return;
        }

        // Fallback to company search
        const { data: eudamedByCompany, error: companyError } = await supabase
          .rpc('get_eudamed_devices_by_company', {
            company_identifier: 'Nox Medical',
            limit_count: 50
          });

        if (companyError) {
          console.error('Error loading EUDAMED data by company:', companyError);
        } else if (eudamedByCompany && eudamedByCompany.length > 0) {
          // Find the device with matching UDI-DI
          const matchingDevice = eudamedByCompany.find((device: any) => 
            device.udi_di === product.udi_di || 
            device.basic_udi_di_code === product.basic_udi_di
          );
          
          if (matchingDevice) {
            console.log('Found matching EUDAMED device:', matchingDevice);
            setEudamedData([matchingDevice]);
          } else {
            console.log('No matching device found in EUDAMED data');
          }
        }
      }
    } catch (error) {
      console.error('Error in loadProductData:', error);
    }
  };

  const updateProductWithEudamedData = async () => {
    if (!productData || !eudamedData) {
      console.log('Missing data:', { productData: !!productData, eudamedData: !!eudamedData });
      toast.error('Missing product or EUDAMED data');
      return;
    }

    // EUDAMED data might be an array, get the first item
    const eudamedDevice = Array.isArray(eudamedData) ? eudamedData[0] : eudamedData;
    
    if (!eudamedDevice) {
      console.log('No EUDAMED device found in data:', eudamedData);
      toast.error('No EUDAMED device data available');
      return;
    }

    console.log('Updating with EUDAMED data:', { 
      productData, 
      eudamedDevice,
      productName: productData.name,
      eudamedDeviceName: eudamedDevice.device_name,
      eudamedTradeNames: eudamedDevice.trade_names 
    });

    setIsLoading(true);
    try {
      const updateData: any = {};

      // Update product name to use EUDAMED device_name (official regulatory name)
      // Always update to the official device name from EUDAMED for regulatory accuracy
      if (eudamedDevice.device_name) {
        updateData.name = eudamedDevice.device_name;
        updateData.trade_name = eudamedDevice.trade_names || eudamedDevice.device_name;
        console.log('Updating product name from:', productData.name, 'to:', eudamedDevice.device_name);
        console.log('Updating trade name from:', productData.trade_name, 'to:', eudamedDevice.trade_names);
      }

      // Update trade name if missing
      if (!productData.trade_name && eudamedDevice.trade_names) {
        updateData.trade_name = eudamedDevice.trade_names;
      }

      // Update UDI-DI fields if they exist and are different
      if (eudamedDevice.udi_di && (!productData.udi_di || productData.udi_di !== eudamedDevice.udi_di)) {
        updateData.udi_di = eudamedDevice.udi_di;
      }
      
      if (eudamedDevice.basic_udi_di_code && (!productData.basic_udi_di || productData.basic_udi_di !== eudamedDevice.basic_udi_di_code)) {
        updateData.basic_udi_di = eudamedDevice.basic_udi_di_code;
      }

      console.log('Update data to be applied:', updateData);

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', productId);

        if (updateError) {
          console.error('Error updating product:', updateError);
          toast.error('Failed to update product data');
        } else {
          toast.success(`Product updated with EUDAMED data: ${Object.keys(updateData).join(', ')}`);
          if (onDataUpdated) {
            onDataUpdated();
          }
          await loadProductData(); // Refresh data
        }
      } else {
        toast.info('Product data is already up to date');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product data');
    } finally {
      setIsLoading(false);
    }
  };

  if (!productData) {
    return null;
  }

  const hasIssues = () => {
    if (!eudamedData) return false;
    
    // EUDAMED data might be an array, get the first item
    const eudamedDevice = Array.isArray(eudamedData) ? eudamedData[0] : eudamedData;
    if (!eudamedDevice) return false;
    
    // Check for missing trade name OR incorrect product name (should match device_name)
    const tradeNameMissing = !productData.trade_name && eudamedDevice.trade_names;
    const productNameIncorrect = eudamedDevice.device_name && 
      productData.name !== eudamedDevice.device_name;
    
    return tradeNameMissing || productNameIncorrect;
  };

  if (!eudamedData) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <Info className="h-4 w-4" />
            <span className="text-sm">No EUDAMED data found for this product's UDI-DI</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasIssues()) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Product data matches EUDAMED</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get the actual EUDAMED device data (handle array structure)
  const eudamedDevice = Array.isArray(eudamedData) ? eudamedData[0] : eudamedData;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800 text-sm">
          <AlertTriangle className="h-4 w-4" />
          EUDAMED Data Mismatch Detected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 text-sm">
          {eudamedDevice?.device_name && productData.name !== eudamedDevice.device_name && (
            <div className="bg-white p-3 rounded border border-orange-200">
              <div className="font-medium text-orange-800 mb-1">Product Name Mismatch:</div>
              <div><strong>Current Name:</strong> {productData.name}</div>
              <div><strong>EUDAMED Device Name:</strong> {eudamedDevice.device_name}</div>
              <div><strong>EUDAMED Trade Name:</strong> {eudamedDevice.trade_names}</div>
            </div>
          )}

          {!productData.trade_name && eudamedDevice?.trade_names && (
            <div className="bg-white p-3 rounded border border-orange-200">
              <div className="font-medium text-orange-800 mb-1">Missing Trade Name:</div>
              <div><strong>EUDAMED Trade Name:</strong> {eudamedDevice.trade_names}</div>
            </div>
          )}

          <div className="bg-white p-3 rounded border border-blue-200">
            <div className="font-medium text-blue-800 mb-2">Available EUDAMED Data:</div>
            <div className="space-y-1 text-xs">
              <div><strong>UDI-DI:</strong> {eudamedDevice?.udi_di || 'N/A'}</div>
              <div><strong>Device Name:</strong> {eudamedDevice?.device_name || 'N/A'}</div>
              <div><strong>Trade Names:</strong> {eudamedDevice?.trade_names || 'N/A'}</div>
              <div><strong>Risk Class:</strong> {eudamedDevice?.risk_class || 'N/A'}</div>
              <div><strong>Organization:</strong> {eudamedDevice?.organization || 'N/A'}</div>
            </div>
          </div>
        </div>

        <Button
          onClick={updateProductWithEudamedData}
          disabled={isLoading}
          className="w-full bg-orange-600 hover:bg-orange-700"
          size="sm"
        >
          {isLoading ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
              Updating...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Update Product with EUDAMED Data
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}