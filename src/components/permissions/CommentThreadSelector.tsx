
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { useDevMode } from "@/context/DevModeContext";
import { useParams } from "react-router-dom";

interface CommentThreadSelectorProps {
  defaultValue?: "internal" | "external";
  children: React.ReactNode;
  onThreadChange?: (thread: "internal" | "external") => void;
  companyId?: string; // Optional company ID to check internal/external status
}

export function CommentThreadSelector({ 
  defaultValue = "internal", 
  children, 
  onThreadChange,
  companyId 
}: CommentThreadSelectorProps) {
  const { 
    isDevMode, 
    primaryCompany, 
    getCompanyInternalStatus 
  } = useDevMode();
  
  // Try to get company ID from parameters if not provided
  const { companyId: urlCompanyId, productId } = useParams<{ companyId?: string, productId?: string }>();
  const effectiveCompanyId = companyId || urlCompanyId || (primaryCompany?.id);
  
  // Determine if user is internal for the specific company
  const isInternalForCompany = effectiveCompanyId 
    ? getCompanyInternalStatus(effectiveCompanyId) 
    : false;
  
  // In development mode and with a company selected, show tabs based on internal status
  const showInternalTabs = process.env.NODE_ENV !== 'production' && isDevMode && isInternalForCompany;
  
  // If not internal or not in dev mode, default to external comments only
  if (!showInternalTabs) {
    return (
      <div className="w-full border border-amber-200 bg-amber-50 p-4 rounded-md">
        <div className="mb-2 text-sm font-medium flex items-center text-amber-800">
          <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
          Comments (visible to all users)
        </div>
        {children}
      </div>
    );
  }
  
  return (
    <Tabs 
      defaultValue={defaultValue} 
      onValueChange={(value) => onThreadChange?.(value as "internal" | "external")}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-2">
        <TabsList>
          <TabsTrigger value="internal">Internal Comments</TabsTrigger>
          <TabsTrigger value="external" className="relative">
            External Comments
            <span className="absolute -top-1 -right-1">
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </span>
          </TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="internal" className="mt-0 border p-4 rounded-md">
        <div className="mb-2 text-sm font-medium">Internal thread (not visible to external users)</div>
        {children}
      </TabsContent>
      
      <TabsContent value="external" className="mt-0 border border-amber-200 bg-amber-50 p-4 rounded-md">
        <div className="mb-2 text-sm font-medium flex items-center text-amber-800">
          <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
          External thread (visible to all users including external reviewers)
        </div>
        {children}
      </TabsContent>
    </Tabs>
  );
}
