import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, GitCompare } from 'lucide-react';
import { ProductCodeBadges } from './ProductCodeBadges';

interface FDASearchConfigProps {
  emdnCode: string;
  onSearchParamsChange: (params: {
    keywords: string[];
    productCodes: string[];
    deviceClass?: string;
  }) => void;
  currentParams?: {
    keywords: string[];
    productCodes: string[];
    deviceClass?: string;
  };
  onCompareProductCodes?: (codes: string[]) => void;
}

export function FDASearchConfig({ emdnCode, onSearchParamsChange, currentParams, onCompareProductCodes }: FDASearchConfigProps) {
  const [keywords, setKeywords] = useState<string[]>(currentParams?.keywords || []);
  const [productCodes, setProductCodes] = useState<string[]>(currentParams?.productCodes || []);
  const [deviceClass, setDeviceClass] = useState(currentParams?.deviceClass || '');
  const [newKeyword, setNewKeyword] = useState('');
  const [newProductCode, setNewProductCode] = useState('');

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      const updated = [...keywords, newKeyword.trim()];
      setKeywords(updated);
      setNewKeyword('');
      updateParams(updated, productCodes, deviceClass);
    }
  };

  const removeKeyword = (keyword: string) => {
    const updated = keywords.filter(k => k !== keyword);
    setKeywords(updated);
    updateParams(updated, productCodes, deviceClass);
  };

  const addProductCode = () => {
    if (newProductCode.trim() && !productCodes.includes(newProductCode.trim().toUpperCase())) {
      const updated = [...productCodes, newProductCode.trim().toUpperCase()];
      setProductCodes(updated);
      setNewProductCode('');
      updateParams(keywords, updated, deviceClass);
    }
  };

  const removeProductCode = (code: string) => {
    const updated = productCodes.filter(c => c !== code);
    setProductCodes(updated);
    updateParams(keywords, updated, deviceClass);
  };

  const updateParams = (kw: string[], pc: string[], dc: string) => {
    onSearchParamsChange({
      keywords: kw,
      productCodes: pc,
      deviceClass: dc || undefined
    });
  };

  const handleDeviceClassChange = (value: string) => {
    setDeviceClass(value);
    updateParams(keywords, productCodes, value);
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-sm">FDA Search Configuration</CardTitle>
        <p className="text-xs text-muted-foreground">
          Customize search terms for finding competing devices in FDA 510(k) database
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs">Search Keywords</Label>
          <div className="flex gap-2 mt-1">
            <Input
              placeholder="e.g., needle, biopsy"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
              className="text-xs"
            />
            <Button onClick={addKeyword} size="sm" variant="outline">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="text-xs">
                {keyword}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => removeKeyword(keyword)}
                />
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs">FDA Product Codes</Label>
          <div className="flex gap-2 mt-1">
            <Input
              placeholder="e.g., FMI, GDH"
              value={newProductCode}
              onChange={(e) => setNewProductCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addProductCode()}
              className="text-xs"
            />
            <Button onClick={addProductCode} size="sm" variant="outline">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {productCodes.map((code) => (
              <div key={code} className="flex items-center gap-1">
                <ProductCodeBadges productCode={code} className="cursor-pointer" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeProductCode(code)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs">Device Class (Optional)</Label>
          <Input
            placeholder="1, 2, or 3"
            value={deviceClass}
            onChange={(e) => handleDeviceClassChange(e.target.value)}
            className="text-xs mt-1"
          />
        </div>

        {/* Product Code Comparison Button */}
        {productCodes.length >= 2 && onCompareProductCodes && (
          <div className="pt-2 border-t">
            <Button 
              onClick={() => onCompareProductCodes(productCodes)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <GitCompare className="h-4 w-4 mr-2" />
              Compare {productCodes.length} Product Codes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}