import React from "react";

export const RegulatoryDisclaimer = () => {
  return (
    <footer className="mt-10 border-t border-border bg-background px-6 py-4">
      <div className="flex flex-col gap-2 text-xs text-muted-foreground">
        <p className="leading-relaxed">
          XYREG provides tools and guidance developed in alignment with the quality management principles of ISO 13485. 
          This platform is not a certified QMS and is intended for informational purposes only. The user is solely 
          responsible for all regulatory compliance. Final validation of all outputs and decisions must be performed 
          by qualified regulatory experts.
        </p>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <span>Version 0.1</span>
          <span>© 2025 XYREG. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};