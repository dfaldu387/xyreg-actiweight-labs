import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  AlertTriangle, 
  X, 
  ChevronRight, 
  Package, 
  AlertCircle,
  BarChart,
  FileText
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Client } from "@/types/client";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCompanyProducts } from "@/hooks/useCompanyProducts";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { ProductLink } from "@/components/product/ProductLink";
import { ProductListSkeleton } from "@/components/product/ProductListSkeleton";
import { ProductDetailsSkeleton } from "@/components/product/ProductDetailsSkeleton";
import { ArchiveCompanyDialog } from "@/components/company/ArchiveCompanyDialog";
import { useAuth } from "@/context/AuthContext";
import { hasAdminPrivileges } from "@/utils/roleUtils";

interface ClientDetailsProps {
  client: Client;
  onClose?: () => void;
  onClientArchived?: (clientId: string) => void;
  disabled?: boolean;
}

// Product interface for the component
interface ClientProductDisplay {
  name: string;
  progress: number;
  status: "On Track" | "At Risk" | "Needs Attention";
  id: string;
  regulatory: {
    mdr: number;
    iso: number;
    qsrPart820: number;
  }
}

export function ClientDetails({ client, onClose, onClientArchived, disabled = false }: ClientDetailsProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, userRole } = useAuth();
  const { lang } = useTranslation();
  const selectionChangeRef = useRef(0);
  const initialLoadCompleted = useRef(false);
  const renderTimerRef = useRef<number | null>(null);
  
  const isAdmin = user && hasAdminPrivileges(userRole);
  
  // Performance tracking
  useEffect(() => {
    renderTimerRef.current = performance.now();
  }, [client.name]);
  
  // Get real products for this client with optimized fetching
  const { products: companyProducts, isLoading } = useCompanyProducts(client.id);
  
  // Map the client products to the format needed for display
  // Memoize this computation to prevent unnecessary work on each render
  const displayProducts = React.useMemo(() => {
    if (companyProducts.length === 0) return [];

    const mapped: ClientProductDisplay[] = companyProducts.map(product => ({
      name: product.name,
      id: product.id,
      progress: product.progress || 0,
      status: product.status as "On Track" | "At Risk" | "Needs Attention" || "On Track",
      regulatory: product.regulatoryCompliance || {
        // Fallback to deterministic values based on product ID if regulatoryCompliance is not available
        mdr: parseInt(product.id.substring(0, 8), 16) % 30 + 50, // Generate a number between 50-80
        iso: parseInt(product.id.substring(8, 16), 16) % 25 + 55, // Generate a number between 55-80
        qsrPart820: parseInt(product.id.substring(16, 24), 16) % 35 + 45 // Generate a number between 45-80
      }
    }));
    return mapped;
  }, [companyProducts]);
  
  // Select the first product by default or undefined if no products
  const [selectedProduct, setSelectedProduct] = useState<ClientProductDisplay | undefined>(undefined);
  
  // Add explicit state for tracking the selected product ID
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);

  // Update selected product ONLY on initial load or when there was no selection before
  useEffect(() => {
    // Only set the initial product if we have products and haven't completed initial load
    if (displayProducts.length > 0 && !initialLoadCompleted.current) {
      const firstProduct = displayProducts[0];
      setSelectedProduct(firstProduct);
      setSelectedProductId(firstProduct.id);
      initialLoadCompleted.current = true;
    }
  }, [displayProducts]);
  
  // Clean up and handle escape key
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleEscapeKey);
    document.body.style.overflow = "hidden";
    
    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  
  // Reset initialLoadCompleted when client changes
  useEffect(() => {
    initialLoadCompleted.current = false;
    setSelectedProduct(undefined);
    setSelectedProductId(undefined);
  }, [client.id]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Track":
        return "bg-green-100 text-green-800";
      case "At Risk":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const navigateToCompanyDashboard = () => {
    if (disabled) return;
    // Use company name, not company ID - routes expect :companyName parameter
    navigate(`/app/company/${encodeURIComponent(client.name)}`);
    if (onClose) onClose();
    else {
      // Provide feedback if navigation happens but panel doesn't close
      toast.success("Opening company dashboard");
    }
  };

  // Handle product selection
  const handleProductSelection = (product: ClientProductDisplay) => {
    if (disabled) return;
    setSelectedProduct(product);
    setSelectedProductId(product.id);
    selectionChangeRef.current += 1;
  };

  // Handle product navigation
  const handleViewProduct = (productId: string) => {
    if (disabled) return;
    // Navigate to the product page with the correct path format and close the details panel if onClose exists
    navigate(`/app/product/${productId}`);
    if (onClose) {
      onClose();
    } else {
      // Provide feedback if navigation happens but panel doesn't close
      toast.success("Navigating to product details");
    }
  };

  // Handle document navigation - update to use the correct path format
  const handleViewDocuments = (productId: string) => {
    if (disabled) return;
    // Navigate to the product documents page with the correct path format
    navigate(`/app/product/${productId}/documents`);
    if (onClose) {
      onClose();
    } else {
      // Provide feedback if navigation happens but panel doesn't close
      toast.success("Opening product documents");
    }
  };

  const handleClientArchived = () => {
    if (disabled) return;
    if (onClientArchived) {
      onClientArchived(client.id);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b sticky top-0 z-10 bg-background">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback>{client.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{client.name}</h2>
            <p className="text-sm text-muted-foreground">{client.country}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <ArchiveCompanyDialog
              companyId={client.id}
              companyName={client.name}
              onArchived={handleClientArchived}
              variant="ghost"
            />
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content - Using ScrollArea for better scroll handling */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 pb-6">
          {/* Overall Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{lang('clientDetails.overallProgress')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">{lang('clientDetails.developmentLifecycle')}</p>
                  <span className="text-sm font-medium">{client.progress}%</span>
                </div>
                <Progress value={client.progress} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">{lang('clientDetails.devices')}</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center bg-muted/50 rounded p-2 text-center">
                    <span className="text-2xl font-bold">{client.products}</span>
                    <span className="text-xs text-muted-foreground">{lang('clientDetails.total')}</span>
                  </div>
                  <div className="flex flex-col items-center bg-green-50 text-green-800 rounded p-2 text-center">
                    <span className="text-2xl font-bold">
                      {isLoading ? "-" : companyProducts.filter(p => p.status === "On Track").length}
                    </span>
                    <span className="text-xs">{lang('clientDetails.onTrack')}</span>
                  </div>
                  <div className="flex flex-col items-center bg-yellow-50 text-yellow-800 rounded p-2 text-center">
                    <span className="text-2xl font-bold">
                      {isLoading ? "-" : companyProducts.filter(p => p.status !== "On Track").length}
                    </span>
                    <span className="text-xs">{lang('clientDetails.atRisk')}</span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={navigateToCompanyDashboard}
                disabled={disabled}
              >
                {lang('clientDetails.openCompanyDashboard')} <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{lang('clientDetails.devices')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-0">
              {isLoading ? (
                <ProductListSkeleton />
              ) : displayProducts.length > 0 ? (
                displayProducts.map((product) => (
                  <div
                    key={`product-list-${product.id}`}
                    onClick={() => handleProductSelection(product)}
                    className={cn(
                      "border-l-4 p-3 transition-colors",
                      disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/50",
                      selectedProductId === product.id
                        ? "border-l-primary bg-muted/30"
                        : "border-l-transparent",
                      product !== displayProducts[displayProducts.length - 1] && "border-b"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{product.name}</span>
                      </div>
                      <Badge className={getStatusColor(product.status)}>
                        {product.status}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span>{lang('clientDetails.progress')}</span>
                        <span>{product.progress}%</span>
                      </div>
                      <Progress value={product.progress} className="h-2" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  {lang('clientDetails.noDevicesFound')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Product Details */}
          {isLoading && !selectedProduct ? (
            <ProductDetailsSkeleton />
          ) : selectedProduct ? (
            <Card key={`product-details-${selectedProductId}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {lang('clientDetails.productDetails', { productName: selectedProduct.name })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">{lang('clientDetails.developmentProgress')}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-md bg-muted/50">
                        <div className="flex justify-between">
                          <span className="text-sm">{lang('clientDetails.documentation')}</span>
                          <span className="text-sm font-medium">65%</span>
                        </div>
                        <Progress value={65} className="h-1.5 mt-1" />
                      </div>
                      <div className="p-3 rounded-md bg-muted/50">
                        <div className="flex justify-between">
                          <span className="text-sm">{lang('clientDetails.testing')}</span>
                          <span className="text-sm font-medium">42%</span>
                        </div>
                        <Progress value={42} className="h-1.5 mt-1" />
                      </div>
                      <div className="p-3 rounded-md bg-muted/50">
                        <div className="flex justify-between">
                          <span className="text-sm">{lang('clientDetails.riskAnalysis')}</span>
                          <span className="text-sm font-medium">78%</span>
                        </div>
                        <Progress value={78} className="h-1.5 mt-1" />
                      </div>
                      <div className="p-3 rounded-md bg-muted/50">
                        <div className="flex justify-between">
                          <span className="text-sm">{lang('clientDetails.clinicalTrials')}</span>
                          <span className="text-sm font-medium">35%</span>
                        </div>
                        <Progress value={35} className="h-1.5 mt-1" />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <BarChart className="h-4 w-4" />
                      {lang('clientDetails.regulatoryGapAnalysis')}
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{lang('clientDetails.euMdr')}</span>
                            <span className="text-xs text-muted-foreground">{lang('clientDetails.generalSafety')}</span>
                          </div>
                          <span className="text-sm font-medium">{selectedProduct.regulatory.mdr}%</span>
                        </div>
                        <Progress value={selectedProduct.regulatory.mdr} />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{lang('clientDetails.iso13485')}</span>
                            <span className="text-xs text-muted-foreground">{lang('clientDetails.qualityManagement')}</span>
                          </div>
                          <span className="text-sm font-medium">{selectedProduct.regulatory.iso}%</span>
                        </div>
                        <Progress value={selectedProduct.regulatory.iso} />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{lang('clientDetails.qsrPart820')}</span>
                            <span className="text-xs text-muted-foreground">{lang('clientDetails.qmsRegulation')}</span>
                          </div>
                          <span className="text-sm font-medium">{selectedProduct.regulatory.qsrPart820}%</span>
                        </div>
                        <Progress value={selectedProduct.regulatory.qsrPart820} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      className="flex-1 flex items-center gap-1"
                      onClick={() => handleViewDocuments(selectedProduct.id)}
                      disabled={disabled}
                    >
                      <FileText className="h-4 w-4" />
                      <span>{lang('clientDetails.openDocuments')}</span>
                    </Button>

                    <Button
                      className="flex-1"
                      onClick={() => handleViewProduct(selectedProduct.id)}
                      disabled={disabled}
                    >
                      {lang('clientDetails.viewDevices')}
                    </Button>
                  </div>
                </div>
                
                {/* Alerts and Issues */}
                {client.alerts.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      {lang('clientDetails.alerts')}
                    </h4>
                    <ul className="space-y-2">
                      {client.alerts.map((alert, idx) => (
                        <li key={idx} className="text-sm text-destructive flex items-start gap-2 bg-destructive/5 p-2 rounded">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{alert}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}
