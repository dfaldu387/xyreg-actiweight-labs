import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { User, Building2, TrendingUp } from "lucide-react";
import { UserType } from '@/hooks/useRegistrationFlow';
import { useNavigate } from 'react-router-dom';

interface TypeSelectionProps {
  onUserTypeSelection: (type: UserType) => void;
}

export function TypeSelection({ onUserTypeSelection }: TypeSelectionProps) {
  const navigate = useNavigate();

  const handleInvestorClick = () => {
    navigate('/investor/register');
  };

  return (
    <div className="space-y-8 p-6">
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-semibold">Welcome to XYREG</h3>
        <p className="text-muted-foreground">Choose your registration type to get started</p>
      </div>
      
      <div className="grid gap-4">
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20" 
          onClick={() => onUserTypeSelection('consultant')}
        >
          <CardContent className="mt-3">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">I'm a Consultant</h4>
                <p className="text-sm text-muted-foreground">
                  Providing regulatory consulting services to medical device companies
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20" 
          onClick={() => onUserTypeSelection('business')}
        >
          <CardContent className="mt-3">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">I'm a Business</h4>
                <p className="text-sm text-muted-foreground">
                  Medical device company seeking regulatory compliance management
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20" 
          onClick={handleInvestorClick}
        >
          <CardContent className="mt-3">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">I'm an Investor</h4>
                <p className="text-sm text-muted-foreground">
                  Angel investor or VC seeking MedTech investment opportunities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}