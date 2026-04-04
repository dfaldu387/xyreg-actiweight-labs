import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, MapPin, Package, Users, Calendar, AlertTriangle, CheckCircle, Briefcase, GitBranch } from "lucide-react";
import { Product } from "@/types/client";
import { ProductPhases } from "@/components/product/ProductPhases";
import { useNavigate } from "react-router-dom";

interface ProductDetailsProps {
  product: Product | null | undefined;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const navigate = useNavigate();

  if (!product) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No product selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get all phases with their documents, ensuring proper array handling
  const phases = Array.isArray(product.lifecyclePhases) ? product.lifecyclePhases : [];
  
  // Calculate overall progress
  const totalPhases = phases.length;
  const completedPhases = phases.filter(phase => phase.status === "Completed").length;
  const overallProgress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;
  
  // Determine status badge
  const getStatusBadge = () => {
    if (!product.status) return <Badge variant="secondary">Unknown</Badge>;
    
    switch (product.status) {
      case "On Track":
        return <Badge className="bg-green-500">On Track</Badge>;
      case "At Risk":
        return <Badge className="bg-yellow-500">At Risk</Badge>;
      case "Needs Attention":
        return <Badge className="bg-red-500">Needs Attention</Badge>;
      default:
        return <Badge variant="secondary">{product.status}</Badge>;
    }
  };

  const handleNavigateToDocuments = () => {
    navigate(`/app/product/${product.id}/documents`);
  };

  const handleNavigateToLifecycle = () => {
    navigate(`/app/product/${product.id}/lifecycle`);
  };

  const handleNavigateToGapAnalysis = () => {
    navigate(`/app/product/${product.id}/gap-analysis`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Product Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg sm:text-xl">{product.name}</CardTitle>
                {product.version && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    v{product.version}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge()}
                {product.class && (
                  <Badge variant="outline">Class {product.class}</Badge>
                )}
                {product.parent_product_id && (
                  <Badge variant="secondary">Version</Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{overallProgress}%</div>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {/* Version Information */}
            {product.version && (
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Version:</span>
                <span>v{product.version}</span>
              </div>
            )}
            
            {product.device_category && (
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Category:</span>
                <span>{product.device_category}</span>
              </div>
            )}
            
            {product.manufacturer && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Manufacturer:</span>
                <span>{product.manufacturer}</span>
              </div>
            )}
            
            {product.current_lifecycle_phase && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Current Phase:</span>
                <span>{product.current_lifecycle_phase}</span>
              </div>
            )}
            
            {product.regulatory_status && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Regulatory Status:</span>
                <span>{product.regulatory_status}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button onClick={handleNavigateToDocuments} variant="outline" className="h-auto p-4">
          <div className="text-center">
            <Package className="h-6 w-6 mx-auto mb-2" />
            <div className="font-medium">Documents</div>
            <div className="text-xs text-muted-foreground">Manage product docs</div>
          </div>
        </Button>
        
        <Button onClick={handleNavigateToLifecycle} variant="outline" className="h-auto p-4">
          <div className="text-center">
            <Clock className="h-6 w-6 mx-auto mb-2" />
            <div className="font-medium">Lifecycle</div>
            <div className="text-xs text-muted-foreground">Track progress</div>
          </div>
        </Button>
        
        <Button onClick={handleNavigateToGapAnalysis} variant="outline" className="h-auto p-4">
          <div className="text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
            <div className="font-medium">Gap Analysis</div>
            <div className="text-xs text-muted-foreground">Review compliance</div>
          </div>
        </Button>
      </div>

      {/* Lifecycle Phases */}
      {phases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Lifecycle Phases</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductPhases 
              phases={phases} 
              product={product}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
