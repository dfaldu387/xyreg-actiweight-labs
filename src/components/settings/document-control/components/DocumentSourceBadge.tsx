
import React from "react";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, FileType, Calendar } from "lucide-react";

interface DocumentSourceBadgeProps {
  documentScope?: string;
  createdAt?: string;
  isImported?: boolean;
  size?: "sm" | "md" | "lg";
}

export function DocumentSourceBadge({ 
  documentScope = "company_template", 
  createdAt, 
  isImported = false,
  size = "sm" 
}: DocumentSourceBadgeProps) {
  const getSourceInfo = () => {
    if (isImported) {
      return {
        label: "CSV Import",
        icon: Upload,
        variant: "secondary" as const,
        className: "bg-blue-100 text-blue-800 border-blue-200"
      };
    }

    switch (documentScope) {
      case "company_template":
        return {
          label: "Template",
          icon: FileType,
          variant: "outline" as const,
          className: "bg-purple-50 text-purple-700 border-purple-200"
        };
      case "company_document":
        return {
          label: "Company Doc",
          icon: FileText,
          variant: "secondary" as const,
          className: "bg-green-50 text-green-700 border-green-200"
        };
      case "product_document":
        return {
          label: "Product Doc",
          icon: FileText,
          variant: "default" as const,
          className: "bg-gray-50 text-gray-700 border-gray-200"
        };
      default:
        return {
          label: "Document",
          icon: FileText,
          variant: "outline" as const,
          className: "bg-gray-50 text-gray-600 border-gray-200"
        };
    }
  };

  const sourceInfo = getSourceInfo();
  const Icon = sourceInfo.icon;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 h-5",
    md: "text-sm px-2 py-1 h-6",
    lg: "text-sm px-3 py-1.5 h-7"
  };

  return (
    <Badge 
      variant={sourceInfo.variant}
      className={`inline-flex items-center gap-1 ${sourceInfo.className} ${sizeClasses[size]}`}
      title={`Document source: ${sourceInfo.label}${createdAt ? ` (${new Date(createdAt).toLocaleDateString()})` : ''}`}
    >
      <Icon className="h-3 w-3" />
      <span>{sourceInfo.label}</span>
    </Badge>
  );
}
