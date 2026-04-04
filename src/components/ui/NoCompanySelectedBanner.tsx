import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NoCompanySelectedBannerProps {
  className?: string;
}

export function NoCompanySelectedBanner({ className = "" }: NoCompanySelectedBannerProps) {
  const navigate = useNavigate();

  return (
    <Alert className={`border-blue-200 bg-blue-50 ${className}`}>
      <Building2 className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">No Company Selected</p>
            <p className="text-sm">
              Please select a company to access full features and manage billing settings.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/app/clients')}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Select Company
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
} 