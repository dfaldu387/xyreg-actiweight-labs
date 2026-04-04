import React, { useState } from 'react';
import { ExternalLink, Search, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageSearchModal } from './ImageSearchModal';
import { GoogleImageSearchModal } from './GoogleImageSearchModal';
import { useTranslation } from '@/hooks/useTranslation';

interface MediaHeaderProps {
  productName: string;
  tradeName?: string;
  companyWebsite?: string;
  companyName?: string;
  companyId?: string;
  onImageSelect: (imageUrl: string) => void;
  onImagesSelect?: (imageUrls: string[]) => void;
}

export function MediaHeader({ productName, tradeName, companyWebsite, companyName, companyId, onImageSelect, onImagesSelect }: MediaHeaderProps) {
  const { lang } = useTranslation();
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [showGoogleSearch, setShowGoogleSearch] = useState(false);

  const handleMultipleImagesSelect = (imageUrls: string[]) => {
    if (onImagesSelect) {
      onImagesSelect(imageUrls);
    } else {
      // Fallback: add images one by one
      imageUrls.forEach(url => onImageSelect(url));
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <h3 className="text-base sm:text-lg font-semibold">{lang('deviceBasics.media.deviceMediaLabel')}</h3>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGoogleSearch(true)}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            {lang('deviceBasics.media.getMedia')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImageSearch(true)}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {lang('deviceBasics.media.findImages')}
          </Button>

          {companyWebsite && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(companyWebsite, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {lang('deviceBasics.media.manufacturer')}
            </Button>
          )}
        </div>
      </div>

      <GoogleImageSearchModal
        open={showGoogleSearch}
        onOpenChange={setShowGoogleSearch}
        productName={productName}
        tradeName={tradeName}
        companyName={companyName}
        companyId={companyId}
        onImagesSelect={handleMultipleImagesSelect}
      />

      <ImageSearchModal
        open={showImageSearch}
        onOpenChange={setShowImageSearch}
        productName={productName}
        companyId={companyId}
        onImageSelect={onImageSelect}
      />
    </>
  );
}