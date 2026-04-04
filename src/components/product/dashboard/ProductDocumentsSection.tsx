
import { Product } from "@/types/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProductDocumentsSectionProps {
  product: Product | null | undefined;
}

export function ProductDocumentsSection({ product }: ProductDocumentsSectionProps) {
  const navigate = useNavigate();

  if (!product) return null;

  // Get all phases with their documents, ensuring proper array handling
  const phases = Array.isArray(product.lifecyclePhases) ? product.lifecyclePhases : [];
  
  // Get all documents from all phases with proper validation
  const allDocuments = phases.flatMap(phase => 
    Array.isArray(phase.documents) ? phase.documents : []
  );
  
  // Calculate document statistics
  const totalDocuments = allDocuments.length;
  const completedDocuments = allDocuments.filter(doc => 
    doc.status === "Completed"
  ).length;
  
  // Calculate completion percentage
  const documentCompletionRate = totalDocuments > 0 
    ? Math.round((completedDocuments / totalDocuments) * 100) 
    : 0;
  
  // Determine status badge
  const getStatusBadge = () => {
    if (documentCompletionRate >= 80) return <Badge className="bg-green-500">On Track</Badge>;
    if (documentCompletionRate >= 50) return <Badge className="bg-yellow-500">In Progress</Badge>;
    return <Badge className="bg-red-500">Needs Attention</Badge>;
  };

  const handleViewDocuments = () => {
    if (product?.id) {
      navigate(`/app/product/${product.id}/documents`);
    }
  };

  return (
    <Card>
      <CardContent className="p-2 sm:p-3 lg:p-4">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              Document Completion
            </h3>
            {getStatusBadge()}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span>Progress</span>
              <span>{completedDocuments}/{totalDocuments} completed</span>
            </div>
            <Progress value={documentCompletionRate} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {documentCompletionRate}% of documents completed across all phases
            </p>
          </div>

          <Button 
            onClick={handleViewDocuments}
            variant="outline" 
            className="w-full flex items-center justify-between text-xs sm:text-sm"
          >
            View All Documents
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
