import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProductDefinitionExportService } from '@/services/productDefinitionExportService';
import { toast } from 'sonner';

interface ProductDefinitionExportButtonProps {
  productId: string;
  companyId: string;
  productName?: string;
}

export function ProductDefinitionExportButton({ 
  productId, 
  companyId, 
  productName = 'Product' 
}: ProductDefinitionExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'docx' | 'pdf' | 'html') => {
    setIsExporting(true);
    
    try {
      await ProductDefinitionExportService.exportProductDefinition(
        productId, 
        companyId, 
        { format }
      );
      
      toast.success(`Product definition exported as ${format.toUpperCase()}`, {
        description: 'Check your Downloads folder for the exported file.'
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={() => handleExport('docx')}
          disabled={isExporting}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Export as DOCX
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('html')}
          disabled={isExporting}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Export as HTML
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}