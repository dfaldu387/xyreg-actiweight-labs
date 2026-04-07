import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentStar } from '@/hooks/useDocumentStar';

interface DocumentStarButtonProps {
  documentId: string;
  size?: 'sm' | 'default';
}

export function DocumentStarButton({ documentId, size = 'sm' }: DocumentStarButtonProps) {
  const { isStarred, isLoading, toggleStar } = useDocumentStar(documentId);

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={(e) => { e.stopPropagation(); toggleStar(); }}
      disabled={isLoading}
      title={isStarred ? 'Unstar document' : 'Star document'}
      className="px-1"
    >
      <Star
        className={`h-4 w-4 ${isStarred ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`}
      />
    </Button>
  );
}
