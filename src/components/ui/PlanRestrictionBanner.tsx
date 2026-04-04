import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Crown, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlanRestrictionBannerProps {
  feature: string;
  currentPlan: string;
  requiredPlan?: string;
  className?: string;
}

export function PlanRestrictionBanner({ 
  feature, 
  currentPlan, 
  requiredPlan = "HELIXOS",
  className = "" 
}: PlanRestrictionBannerProps) {
  const navigate = useNavigate();

  const getPlanUpgradeMessage = () => {
    switch (requiredPlan) {
      case "HELIXOS":
        return "Upgrade to HELIX OS plan to unlock this feature";
      case "Enterprise":
        return "Upgrade to Enterprise plan to unlock this feature";
      default:
        return `Upgrade to ${requiredPlan} plan to unlock this feature`;
    }
  };

  return (
    <Alert className={`border-amber-200 bg-amber-50 ${className}`}>
      <Lock className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Feature Restricted</p>
            <p className="text-sm">
              {feature} is not available on your current {currentPlan} plan. {getPlanUpgradeMessage()}
            </p>
          </div>
          <Button 
            onClick={() => navigate('/app/billing')}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
} 