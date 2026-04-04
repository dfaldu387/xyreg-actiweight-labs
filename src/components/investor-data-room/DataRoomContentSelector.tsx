import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, FileText } from 'lucide-react';
import { AddContentInput } from '@/types/dataRoom';
import { ContentTypeSelector, ContentSelection } from './ContentTypeSelector';
import { useDataRoomContent } from '@/hooks/useDataRoomContent';

interface DataRoomContentSelectorProps {
  dataRoomId: string;
  productIds?: string[];
}

export function DataRoomContentSelector({ dataRoomId, productIds = [] }: DataRoomContentSelectorProps) {
  const [selections, setSelections] = useState<ContentSelection[]>([]);
  const { addGeneratedContent, isAdding } = useDataRoomContent(dataRoomId);

  const handleGenerate = () => {
    const enabledSelections = selections.filter(s => s.enabled);
    
    if (enabledSelections.length === 0 || productIds.length === 0) return;

    // Create content entries for each selection and each product
    productIds.forEach(productId => {
      enabledSelections.forEach((selection, index) => {
        const input: AddContentInput = {
          content_type: selection.type as any,
          document_title: productIds.length > 1 
            ? `${selection.title} (Product ${productIds.indexOf(productId) + 1})`
            : selection.title,
          document_description: `Auto-generated ${selection.title}`,
          display_order: index,
          is_visible: true,
        };

        addGeneratedContent({
          dataRoomId,
          productId,
          input,
        });
      });
    });

    // Reset selections
    setSelections([]);
  };

  const enabledCount = selections.filter(s => s.enabled).length;
  const hasProducts = productIds.length > 0;

  // Don't show content generation UI if no products selected
  if (!hasProducts) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Select Content to Generate</CardTitle>
          </div>
          <CardDescription>
            Choose what information to include in your data room. Content will be automatically generated from {productIds.length === 1 ? 'your product' : `${productIds.length} selected products`}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContentTypeSelector
            selections={selections}
            onSelectionChange={setSelections}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
        <div className="text-sm">
          <span className="font-medium">{enabledCount} item{enabledCount !== 1 ? 's' : ''} selected</span>
          {enabledCount > 0 && (
            <p className="text-muted-foreground mt-1">
              {productIds.length === 1 
                ? 'Content will be generated from your product data'
                : `Content will be generated for ${productIds.length} products`
              }
            </p>
          )}
        </div>
        <Button
          onClick={handleGenerate}
          disabled={enabledCount === 0 || isAdding}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          {isAdding ? 'Generating...' : `Generate Content (${enabledCount})`}
        </Button>
      </div>
    </div>
  );
}
