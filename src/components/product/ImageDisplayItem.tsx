import React, { useState } from 'react';
import { ExternalLink, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageDisplayItemProps {
  imageUrl: string;
  alt?: string;
  className?: string;
  onError?: () => void;
}

export function ImageDisplayItem({ imageUrl, alt = "Product image", className = "", onError }: ImageDisplayItemProps) {
  const [imageError, setImageError] = useState(false);
  
  if (imageError || imageUrl.startsWith('data:text/')) {
    // Show URL as text when image fails to load or is a text data URL
    return (
      <div className={`border rounded-lg p-4 bg-gray-50 flex flex-col items-center justify-center space-y-2 ${className}`}>
        <ImageIcon className="h-8 w-8 text-gray-400" />
        <p className="text-sm font-medium text-gray-600">External Image URL</p>
        <div className="text-xs text-gray-500 break-all text-center max-w-full">
          {imageUrl}
        </div>
        {imageUrl.startsWith('http') && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(imageUrl, '_blank')}
            className="text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Open URL
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover rounded-lg"
        onError={() => {
          setImageError(true);
          onError?.();
        }}
        onLoad={() => setImageError(false)}
      />
    </div>
  );
}