import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DocumentPdfPreviewService } from '@/services/documentPdfPreviewService';

interface PdfPreviewButtonProps {
  documentId: string;
  companyId: string;
  productId?: string;
  variant?: "ghost" | "outline";
  size?: "sm" | "icon";
}

export function PdfPreviewButton({
  documentId,
  companyId,
  productId,
  variant = "ghost",
  size = "sm",
}: PdfPreviewButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await DocumentPdfPreviewService.generatePreviewPdf(documentId, companyId, productId);
    } catch (error) {
      console.error('PDF preview error:', error);
      toast.error('Failed to generate PDF preview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={loading}
      title="Preview PDF"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
    </Button>
  );
}
