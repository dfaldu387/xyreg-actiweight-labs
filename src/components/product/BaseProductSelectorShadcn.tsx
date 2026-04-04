import React, { useState } from 'react';
import {
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Search,
  ExpandMore,
  ExpandLess,
  Inventory,
  Check
} from '@mui/icons-material';
import { useCompanyProductSelection } from '@/hooks/useCompanyProductSelection';
import { ProductForSelection } from '@/types/project';

interface BaseProductSelectorShadcnProps {
  companyId: string;
  selectedProductId?: string;
  onProductSelect: (productId: string) => void;
  currentProductId?: string;
  className?: string;
}

export function BaseProductSelectorShadcn({
  companyId,
  selectedProductId,
  onProductSelect,
  currentProductId,
  className
}: BaseProductSelectorShadcnProps) {
  const { products, isLoading, error } = useCompanyProductSelection(companyId);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const productHierarchyCache = React.useMemo(() => {
    if (!Array.isArray(products)) return new Map<string, ProductForSelection>();
    return new Map(products.map(product => [product.id, product]));
  }, [products]);

  const isBaseProduct = React.useCallback((product: ProductForSelection): boolean => {
    if (!product.parent_product_id) return true;
    const parentProduct = productHierarchyCache.get(product.parent_product_id);
    return !parentProduct || !parentProduct.parent_product_id;
  }, [productHierarchyCache]);

  // Filter to only show true base products (no parent, or parent already root)
  const baseProducts = Array.isArray(products) 
    ? products.filter((product: ProductForSelection) => isBaseProduct(product))
    : [];
  
  // If currentProductId is provided and the product exists in baseProducts, ensure it's shown even if no selectedProductId
  const currentProduct = currentProductId ? baseProducts.find(p => p.id === currentProductId) : null;
  
  const selectedProduct = baseProducts.find(p => p.id === selectedProductId);

  // Filter products based on search term
  const filteredProducts = baseProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductSelect = (product: ProductForSelection) => {
    onProductSelect(product.id);
    setOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    setOpen(!open);
    if (!open) {
      setSearchTerm('');
    }
  };

  if (error) {
    return (
      <Button
        variant="outlined"
        disabled
        fullWidth
        startIcon={<Inventory />}
        sx={{
          color: 'hsl(var(--muted-foreground))',
          borderColor: 'hsl(var(--border))',
          justifyContent: 'flex-start'
        }}
      >
        Error loading products
      </Button>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <Button
        variant="outlined"
        fullWidth
        onClick={handleToggle}
        disabled={isLoading}
        endIcon={open ? <ExpandLess /> : <ExpandMore />}
        startIcon={isLoading ? <CircularProgress size={16} /> : <Inventory />}
        sx={{
          color: 'hsl(var(--foreground))',
          borderColor: 'hsl(var(--border))',
          justifyContent: 'space-between',
          textTransform: 'none',
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
        {isLoading ? (
          "Loading..."
        ) : selectedProduct ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, justifyContent: 'flex-start' }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {selectedProduct.name}
            </Typography>
            <Chip
              label={`v${selectedProduct.version || '1.0'}`}
              size="small"
              sx={{
                backgroundColor: 'hsl(var(--secondary))',
                color: 'hsl(var(--secondary-foreground))',
                fontSize: '0.75rem'
              }}
            />
          </Box>
        ) : (
          "Select Base Product"
        )}
      </Button>

      <Collapse in={open}>
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            mt: 1,
            maxHeight: 300,
            overflow: 'hidden',
            border: '1px solid hsl(var(--border))',
            borderRadius: 1
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid hsl(var(--border))' }}>
            <TextField
              fullWidth
              placeholder="Search base products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 16, color: 'hsl(var(--muted-foreground))' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  '& fieldset': {
                    borderColor: 'hsl(var(--border))',
                  },
                  '&:hover fieldset': {
                    borderColor: 'hsl(var(--ring))',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'hsl(var(--primary))',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'hsl(var(--foreground))',
                  '&.Mui-focused': {
                    color: 'hsl(var(--primary))',
                  },
                },
              }}
            />
          </Box>

          <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
            {filteredProducts.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {baseProducts.length === 0 
                    ? Array.isArray(products) && products.length === 0 
                      ? 'No products found' 
                      : 'No base products found (all products have parent products)'
                    : 'No products found matching your search.'
                  }
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {filteredProducts.map((product) => (
                  <ListItem key={product.id} disablePadding>
                    <ListItemButton
                      onClick={() => handleProductSelect(product)}
                      selected={product.id === selectedProductId}
                      sx={{
                        '&.Mui-selected': {
                          backgroundColor: 'hsl(var(--accent))',
                          '&:hover': {
                            backgroundColor: 'hsl(var(--accent))',
                          }
                        },
                        '&:hover': {
                          backgroundColor: 'hsl(var(--accent))',
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Inventory sx={{ fontSize: 16, color: 'hsl(var(--muted-foreground))' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {product.name}
                            </Typography>
                            {product.id === selectedProductId && (
                              <Chip
                                label="Selected"
                                size="small"
                                color="primary"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            Current: v{product.version || '1.0'} • {product.status}
                          </Typography>
                        }
                      />
                      {product.id === selectedProductId && (
                        <Check sx={{ fontSize: 16, color: 'hsl(var(--primary))' }} />
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
}