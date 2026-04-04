import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, ArrowLeft, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCompanyProducts } from '@/hooks/useCompanyProducts';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { formatDeviceClassLabel } from '@/utils/deviceClassUtils';
import { useTranslation } from '@/hooks/useTranslation';

export function ProductSelection() {
  const navigate = useNavigate();
  const { activeCompanyRole } = useCompanyRole();
  const { lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { products, isLoading, error } = useCompanyProducts(
    activeCompanyRole?.companyName || '', 
    { enabled: !!activeCompanyRole }
  );

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.class?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleProductSelect = (product: any) => {
    navigate(`/app/document-studio/templates?productId=${product.id}&productName=${encodeURIComponent(product.name)}`);
  };

  const handleBackToStudio = () => {
    navigate('/app/document-studio');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={handleBackToStudio}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {lang('documentStudio.backToDocumentStudio')}
        </Button>

        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {lang('documentStudio.productSelection.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {lang('documentStudio.productSelection.subtitle')}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder={lang('documentStudio.productSelection.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 text-lg bg-background border-2 focus:border-primary"
        />
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">{lang('documentStudio.productSelection.loadingProducts')}</span>
          </div>
        ) : error ? (
          <Card className="border-destructive/50">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-destructive mb-2">{lang('documentStudio.productSelection.errorLoadingProducts')}</h3>
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? lang('documentStudio.productSelection.noProductsFound') : lang('documentStudio.productSelection.noProductsAvailable')}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? lang('documentStudio.productSelection.tryAdjustingSearch')
                  : lang('documentStudio.productSelection.noProductsCreatedYet')
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 border-2 hover:border-primary/40"
                onClick={() => handleProductSelect(product)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        {product.class && (
                          <Badge variant="secondary" className="text-xs">
                            {formatDeviceClassLabel(product.class)}
                          </Badge>
                        )}
                      </div>

                      {product.description && (
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {product.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{lang('documentStudio.productSelection.phase')}: {product.phase || lang('documentStudio.productSelection.notAssigned')}</span>
                        <span>{lang('common.status')}: {product.status}</span>
                      </div>
                    </div>

                    <div className="flex items-center text-primary font-medium group-hover:translate-x-1 transition-transform duration-200">
                      {lang('documentStudio.productSelection.select')} →
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}