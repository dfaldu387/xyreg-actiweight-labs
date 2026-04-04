
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Info } from "lucide-react";
import { getStatusColor } from "@/utils/statusUtils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { CategoryDetailModal } from "./CategoryDetailModal";
import { Certification } from "@/types/client";

interface ProductCertificationsProps {
  certifications: Certification[];
}

export function ProductCertifications({ certifications }: ProductCertificationsProps) {
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const handleCertificationClick = (cert: Certification) => {
    setSelectedCertification(cert);
    setDetailModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4" />
            Certifications
          </h4>
          <ul className="space-y-2">
            {certifications.map((cert, index) => (
              <li 
                key={index} 
                className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                onClick={() => handleCertificationClick(cert)}
              >
                <span>{cert.name}</span>
                <div className="flex items-center gap-2">
                  {cert.expiryDate && <span className="text-xs text-muted-foreground">Expires: {cert.expiryDate}</span>}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Info</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View certification details</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Badge className={getStatusColor(cert.status)}>{cert.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {selectedCertification && (
        <CategoryDetailModal 
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          category={{
            id: selectedCertification.name,
            title: selectedCertification.name,
            type: "certification",
            status: selectedCertification.status,
            data: {
              expiryDate: selectedCertification.expiryDate,
              // Adding mock data for demo purposes
              evidenceLinks: [`${selectedCertification.name}_certificate.pdf`, "Supporting_documentation.pdf"],
              comments: [
                {
                  author: "Alex Johnson",
                  comment: "This certification needs to be renewed before the expiry date.",
                  timestamp: "2025-03-25"
                }
              ]
            }
          }}
        />
      )}
    </>
  );
}
