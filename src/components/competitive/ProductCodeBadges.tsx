import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FDAProductCodeService } from '@/services/fdaProductCodeService';
import { useQuery } from '@tanstack/react-query';

interface ProductCodeBadgesProps {
  productCodes?: string[];
  productCode?: string; // Backward compatibility
  className?: string;
  maxDisplay?: number;
}

export function ProductCodeBadges({ 
  productCodes, 
  productCode, 
  className = '', 
  maxDisplay = 3 
}: ProductCodeBadgesProps) {
  // Combine single productCode with productCodes array for backward compatibility
  const allCodes = [
    ...(productCode ? [productCode] : []),
    ...(productCodes || [])
  ].filter((code, index, arr) => arr.indexOf(code) === index); // Remove duplicates

  // Get product code info for tooltips
  const { data: productCodeInfo } = useQuery({
    queryKey: ['product-codes-info', allCodes],
    queryFn: () => FDAProductCodeService.getMultipleProductCodeInfo(allCodes),
    enabled: allCodes.length > 0,
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });

  if (allCodes.length === 0) {
    return null;
  }

  const displayCodes = allCodes.slice(0, maxDisplay);
  const remainingCount = allCodes.length - maxDisplay;

  const getCodeColor = (code: string) => {
    const info = productCodeInfo?.find(info => info.code === code);
    if (!info) return 'bg-muted text-muted-foreground';
    
    // Color based on device class
    switch (info.deviceClass) {
      case 'I':
      case '1':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      case 'II':
      case '2':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400';
      case 'III':
      case '3':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getCodeDescription = (code: string) => {
    const info = productCodeInfo?.find(info => info.code === code);
    if (!info) return `Product Code: ${code}`;
    return `${code} - ${info.description}\nDevice Class: ${FDAProductCodeService.getDeviceClassDescription(info.deviceClass)}`;
  };

  return (
    <TooltipProvider>
      <div className={`flex flex-wrap gap-1 ${className}`}>
        {displayCodes.map((code) => (
          <Tooltip key={code}>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={`text-xs ${getCodeColor(code)}`}
              >
                {code}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <pre className="text-xs whitespace-pre-wrap">
                  {getCodeDescription(code)}
                </pre>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                +{remainingCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <p className="text-xs font-medium mb-1">Additional Product Codes:</p>
                {allCodes.slice(maxDisplay).map((code) => (
                  <div key={code} className="text-xs">
                    {getCodeDescription(code)}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}