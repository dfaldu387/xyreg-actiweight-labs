
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { OptimizedProduct } from '@/hooks/useOptimizedCompanyProducts';

interface TimelineViewProps {
  products: OptimizedProduct[];
}

export function TimelineView({ products }: TimelineViewProps) {
  const navigate = useNavigate();

  const getProductDate = (product: OptimizedProduct): Date => {
    if (product.targetDate) {
      return new Date(product.targetDate);
    }
    return new Date();
  };

  const getProductYear = (product: OptimizedProduct): number => {
    return getProductDate(product).getFullYear();
  };

  const getProductImageUrl = (product: OptimizedProduct): string => {
    if (product.images) {
      if (Array.isArray(product.images)) {
        return product.images.filter(Boolean)[0] || '/placeholder.svg';
      } else if (typeof product.images === 'string') {
        const imageUrls = product.images.split(',').map(url => url.trim()).filter(Boolean);
        return imageUrls[0] || '/placeholder.svg';
      }
    }
    
    if (product.image) {
      if (Array.isArray(product.image)) {
        return product.image.filter(Boolean)[0] || '/placeholder.svg';
      } else if (typeof product.image === 'string') {
        const images = product.image.split(',').map(img => img.trim()).filter(Boolean);
        return images[0] || '/placeholder.svg';
      }
    }
    
    return '/placeholder.svg';
  };

  const categorizedProducts = useMemo(() => {
    
    
    const upgrades: (OptimizedProduct & { year: number })[] = [];
    const lineExtensions: (OptimizedProduct & { year: number })[] = [];
    const newProducts: (OptimizedProduct & { year: number })[] = [];
    
    products.forEach(product => {
      const productYear = getProductYear(product);
      const hasParent = product.parent_product_id;
      const isLineExtension = product.is_line_extension;
      
      const productWithYear = { ...product, year: productYear };
      
      if (hasParent && !isLineExtension) {
        // Product upgrade - has parent but is not a line extension
        upgrades.push(productWithYear);
      } else if (isLineExtension) {
        // Line extension - grouped as platforms
        lineExtensions.push(productWithYear);
      } else {
        // New product - standalone
        newProducts.push(productWithYear);
      }
    });
    
    // Sort each category by year
    upgrades.sort((a, b) => a.year - b.year);
    lineExtensions.sort((a, b) => a.year - b.year);
    newProducts.sort((a, b) => a.year - b.year);
    
    
    return { upgrades, lineExtensions, newProducts };
  }, [products]);

  // Calculate date range for timeline
  const dateRange = useMemo(() => {
    if (products.length === 0) {
      const now = new Date();
      return { 
        minDate: new Date(now.getFullYear(), 0, 1), 
        maxDate: new Date(now.getFullYear(), 11, 31) 
      };
    }
    
    const dates = products.map(getProductDate);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime()), new Date().getTime()));
    
    // Start from beginning of min month and end at end of max month
    const rangeStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const rangeEnd = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
    
    return { minDate: rangeStart, maxDate: rangeEnd };
  }, [products]);

  // Generate month markers and year ranges for timeline
  const { monthMarkers, yearRanges } = useMemo(() => {
    const markers = [];
    const years = new Map<number, { start: number; end: number }>();
    const current = new Date(dateRange.minDate);
    let markerIndex = 0;
    
    while (current <= dateRange.maxDate) {
      const year = current.getFullYear();
      const month = format(current, 'MMM');
      
      markers.push({
        date: new Date(current),
        month,
        year,
        position: markerIndex
      });
      
      // Track year positions for year labels
      if (!years.has(year)) {
        years.set(year, { start: markerIndex, end: markerIndex });
      } else {
        years.get(year)!.end = markerIndex;
      }
      
      current.setMonth(current.getMonth() + 1);
      markerIndex++;
    }
    
    // Convert year map to array, but only include years with substantial representation
    const allYearRanges = Array.from(years.entries()).map(([year, range]) => ({
      year,
      monthCount: range.end - range.start + 1,
      centerPosition: (range.start + range.end) / 2,
      leftPosition: (range.start / (markers.length - 1)) * 100,
      rightPosition: (range.end / (markers.length - 1)) * 100
    }));
    
    // Filter to only show years with at least 6 months OR edge years (first/last)
    const yearRanges = allYearRanges.filter((yearRange, index) => {
      const isEdgeYear = index === 0 || index === allYearRanges.length - 1;
      const hasSubstantialPresence = yearRange.monthCount >= 6;
      return isEdgeYear || hasSubstantialPresence;
    });
    
    return { monthMarkers: markers, yearRanges };
  }, [dateRange]);

  // Enhanced platform grouping logic to include base products
  const platformGroups = useMemo(() => {
    const groups: Record<string, (OptimizedProduct & { year: number })[]> = {};
    
    // First, add all line extensions to their platforms
    categorizedProducts.lineExtensions.forEach(product => {
      const platformKey = product.product_platform || product.parent_product_id || 'standalone';
      if (!groups[platformKey]) {
        groups[platformKey] = [];
      }
      groups[platformKey].push(product);
    });
    
    // Then, find and add base products for each platform
    // A base product is one that is referenced as parent_product_id by line extensions
    // OR one that has a product_platform but is not itself a line extension
    Object.keys(groups).forEach(platformKey => {
      const lineExtensionsInPlatform = groups[platformKey];
      
      // Find base products that are parents of line extensions in this platform
      const baseProductIds = new Set(
        lineExtensionsInPlatform
          .map(product => product.parent_product_id)
          .filter(Boolean)
      );
      
      // Add base products to the platform group
      products.forEach(product => {
        const productYear = getProductYear(product);
        const productWithYear = { ...product, year: productYear };
        
        // Include if it's a base product (referenced as parent) or has the platform but isn't a line extension
        const isBaseProduct = baseProductIds.has(product.id);
        const hasMatchingPlatform = product.product_platform === platformKey && !product.is_line_extension;
        
        if (isBaseProduct || hasMatchingPlatform) {
          // Check if already added to avoid duplicates
          const alreadyInGroup = groups[platformKey].some(p => p.id === product.id);
          if (!alreadyInGroup) {
            groups[platformKey].push(productWithYear);
          }
        }
      });
      
      // Sort products within platform by year
      groups[platformKey].sort((a, b) => a.year - b.year);
    });
    
    return groups;
  }, [categorizedProducts.lineExtensions, products]);

  const getPositionForDate = (date: Date): number => {
    const totalTime = dateRange.maxDate.getTime() - dateRange.minDate.getTime();
    if (totalTime === 0) return 50; // Center if only one date
    
    const position = ((date.getTime() - dateRange.minDate.getTime()) / totalTime) * 100;
    return Math.max(5, Math.min(95, position)); // Keep within 5-95% range
  };

  const handleProductClick = (productId: string) => {
    navigate(`/app/product/${productId}/device-information`);
  };

  const renderProduct = (product: OptimizedProduct & { year: number }, borderColor: string, isBaseProduct?: boolean) => {
    const productDate = getProductDate(product);
    return (
      <div 
        key={product.id} 
        className="absolute flex flex-col items-center space-y-2 transform -translate-x-1/2"
        style={{ left: `${getPositionForDate(productDate)}%` }}
      >
        {/* Product image - now clickable with visual indicator for base products */}
        <div 
          className={`w-16 h-16 rounded-full border-4 ${borderColor} overflow-hidden bg-white shadow-lg cursor-pointer hover:scale-105 transition-transform duration-200 hover:shadow-xl ${isBaseProduct ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}
          onClick={() => handleProductClick(product.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleProductClick(product.id);
            }
          }}
          aria-label={`Navigate to ${product.name} dashboard`}
        >
          <img
            src={getProductImageUrl(product)}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Product name with base product indicator */}
        <div className="text-center max-w-20">
          <p className="text-sm font-medium text-gray-900 truncate">
            {product.name}
            {isBaseProduct && <span className="text-xs text-yellow-600 block">(Base)</span>}
          </p>
          <p className="text-xs text-gray-500">{format(productDate, 'MMM yyyy')}</p>
        </div>
      </div>
    );
  };

  const renderPlatformGroup = (platformKey: string, platformProducts: (OptimizedProduct & { year: number })[]) => {
    // Determine platform name and identify base products
    const baseProducts = platformProducts.filter(p => 
      !p.is_line_extension || platformProducts.some(other => other.parent_product_id === p.id)
    );
    const lineExtensions = platformProducts.filter(p => p.is_line_extension);
    
    // Use the product_platform field directly, or fallback to a generated name
    const platformName = platformProducts[0]?.product_platform || 
      (baseProducts.length > 0 ? baseProducts[0].name + ' Platform' : `Platform ${platformKey.substring(0, 8)}`);
    
    return (
      <div key={platformKey} className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mb-6 relative min-h-32">
        <h3 className="text-lg font-semibold text-orange-800 mb-4 text-center">
          {platformName}
          <span className="text-xs text-orange-600 block font-normal">
            {baseProducts.length} base • {lineExtensions.length} extensions
          </span>
        </h3>
        <div className="relative h-20">
          {platformProducts.map(product => {
            const isBaseProduct = !product.is_line_extension || 
              platformProducts.some(other => other.parent_product_id === product.id);
            return renderProduct(product, 'border-orange-500', isBaseProduct);
          })}
        </div>
      </div>
    );
  };

  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500">No products available for timeline view</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Main title */}
      <div className="p-6 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 text-center">Product Timeline</h2>
      </div>
      
      {/* Sticky Timeline Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-6">
          <div className="relative">
            {/* Year labels - positioned at center of each year using date-based calculation */}
            <div className="relative mb-4 h-6">
              {yearRanges.map((yearRange, index) => {
                // Calculate center date of the year (June 15th)
                const yearCenterDate = new Date(yearRange.year, 5, 15); // June 15th
                const leftPercent = getPositionForDate(yearCenterDate);
                
                return (
                  <div 
                    key={yearRange.year}
                    className="absolute text-lg font-bold text-gray-800 transform -translate-x-1/2"
                    style={{ left: `${leftPercent}%` }}
                  >
                    {yearRange.year}
                  </div>
                );
              })}
            </div>
            
            {/* Timeline line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300 transform -translate-y-1/2"></div>
          </div>
        </div>
      </div>
      
      {/* Scrollable Content Area */}
      <div className="p-6 space-y-8">
        {/* Line Extensions (Platforms) */}
        {Object.keys(platformGroups).length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Platforms & Line Extensions</h3>
            {Object.entries(platformGroups).map(([platformKey, platformProducts]) =>
              renderPlatformGroup(platformKey, platformProducts)
            )}
          </div>
        )}
        
        {/* Product Upgrades */}
        {categorizedProducts.upgrades.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Product Upgrades</h3>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 relative min-h-32">
              <div className="relative h-20">
                {categorizedProducts.upgrades.map(product => renderProduct(product, 'border-green-500'))}
              </div>
            </div>
          </div>
        )}
        
        {/* New Products */}
        {categorizedProducts.newProducts.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">New Products</h3>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 relative min-h-32">
              <div className="relative h-20">
                {categorizedProducts.newProducts.map(product => renderProduct(product, 'border-blue-500'))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
