import { Image, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product, LifecyclePhase, PhaseItem } from "@/types/client";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ProductDocuments } from "./ProductDocuments";
import { getStatusColor } from "@/utils/statusUtils";
import { sanitizeImageArray } from "@/utils/imageDataUtils";
import { detectProductType } from "@/utils/productTypeDetection";

export interface ProductCardProps {
  product: Product;
  onShowImage?: (img: string) => void;
  onClose?: () => void;
  phaseId?: string;
}

export function ProductCard({ product, onShowImage, onClose, phaseId }: ProductCardProps) {
  const navigate = useNavigate();
  
  // Memoize image processing to prevent repeated operations
  const imageUrls = useMemo(() => {
    return sanitizeImageArray(product.image);
  }, [product.image]);
  
  const primaryImage = imageUrls.length > 0 ? imageUrls[0] : undefined;
  
  const pendingDocuments = product.documents?.filter(doc => 
    doc.status === "Pending" || doc.status === "Overdue"
  ) || [];

  const currentPhase = product.lifecyclePhases?.find(phase => 
    phaseId ? phase.phase_id === phaseId : phase.isCurrentPhase
  );
  const phaseDocuments = currentPhase?.documents || [];

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    navigate(`/app/product/${product.id}/device-information`);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (onShowImage && primaryImage) {
      onShowImage(primaryImage);
    }
  };

  // Get status color class for the top strip
  const getStatusStripColor = (status: string) => {
    switch (status) {
      case "On Track":
        return "bg-green-500";
      case "At Risk":
        return "bg-red-500";
      case "Needs Attention":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  // Enhanced product type label to include platform name for line extensions
  const getProductTypeLabel = (productType: string, productPlatform?: string) => {
    switch (productType) {
      case 'new_product':
        return 'New Product';
      case 'existing_product':
        return 'Product Upgrade';
      case 'line_extension':
        return productPlatform ? `Line Extension (${productPlatform})` : 'Line Extension';
      default:
        return 'Product';
    }
  };

  // Detect product type for this product
  const productType = detectProductType(product);
  const productTypeLabel = getProductTypeLabel(productType, product.product_platform);

  return (
    <Card className="overflow-hidden shadow-md">
      {/* Add colored status strip at the top */}
      <div className={`h-2 w-full ${getStatusStripColor(product.status || "")}`} />
      
      <div 
        className="p-6 cursor-pointer space-y-6" 
        onClick={handleCardClick}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="text-2xl font-semibold">{product.name}</h2>
              <p className="text-muted-foreground mt-1 space-x-2">
                {product.class && <Badge variant="outline">Class {product.class}</Badge>}
                <Badge variant="outline" className="ml-2">
                  {productTypeLabel}
                </Badge>
              </p>
            </div>
            
            {/* Move status badge to the top right with proper styling */}
            <div className="flex flex-col gap-2 items-end">
              <Badge
                className={`${getStatusColor(product.status || "")} px-3 py-1 text-sm font-medium`}
              >
                {product.status}
              </Badge>
              
              {primaryImage ? (
                <div 
                  className="w-20 h-20 rounded overflow-hidden border shadow-sm cursor-pointer hover:opacity-90 transition-opacity bg-muted flex items-center justify-center"
                  onClick={handleImageClick}
                  tabIndex={0}
                >
                  <img 
                    src={primaryImage} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded overflow-hidden border shadow-sm bg-muted flex items-center justify-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
          
          {/* Remove the duplicate status badge previously shown here */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Progress: {product.progress}%
            </div>
          </div>

          {product.lifecyclePhases && product.lifecyclePhases.length > 0 && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Required Documents:</h3>
                <Badge variant="secondary" className="text-xs">
                  {currentPhase?.name}
                </Badge>
              </div>
              {phaseDocuments.length > 0 ? (
                <div className="space-y-2">
                  {phaseDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{doc.name}</span>
                      </div>
                      <Badge 
                        variant={doc.status === "Completed" ? "outline" : "secondary"}
                        className="text-xs"
                      >
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">No documents required in this phase</span>
              )}
            </div>
          )}

          {pendingDocuments.length > 0 && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950 rounded-md border border-amber-200 dark:border-amber-800">
                  <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm text-amber-700 dark:text-amber-300">
                    {pendingDocuments.length} document{pendingDocuments.length > 1 ? 's' : ''} pending approval
                  </span>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Documents Requiring Approval:</h4>
                  <ul className="space-y-1">
                    {pendingDocuments.map((doc, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        {doc.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
        </div>
      </div>
    </Card>
  );
}
