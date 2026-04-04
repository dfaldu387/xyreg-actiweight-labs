import React from 'react';
import { Building2 } from "lucide-react";

export function Complete() {
  return (
    <div className="text-center space-y-4 py-8">
      <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
        <Building2 className="h-8 w-8 text-success" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-success-foreground">Registration Complete!</h3>
        <p className="text-sm text-muted-foreground">
          Your account has been created successfully. Please check your email to verify your account.
        </p>
      </div>
    </div>
  );
}