import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, ExternalLink, AlertTriangle, RotateCcw, ArrowUpRight, ArrowDownRight, StarIcon } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { detectVideoUrlType, VideoUrlInfo } from "@/utils/videoUrlUtils";
import { validateImageUrl, repairImageData, deepExtractImages } from "@/utils/imageDataUtils";
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '../ui/loading-spinner';
import InnerImageZoom from 'react-inner-image-zoom';
import 'react-inner-image-zoom/lib/styles.min.css';

interface ProductGalleryProps {
  images?: string[];
  videos?: string[];
  productName?: string;
}

interface ProductImage {
  type: 'image';
  src: string;
  index: number;
  id: string;
}

interface ProductVideo {
  type: 'video';
  src: string;
  index: number;
  id: string;
  embedUrl: string;
  videoType: string;
  thumbnail?: string; // Optional thumbnail URL
}
export function ProductGallery({ images = [], videos = [], productName = "Product" }: ProductGalleryProps) {
  // Process and validate images using enhanced repair function with memoization
  const processedImages = useMemo(() => {
    try {
      // First try the standard repair function
      let result = repairImageData(images);

      // If no images found, try deep extraction as fallback
      if (result.length === 0 && images) {
        result = deepExtractImages(images);
      }

      return result;
    } catch (error) {
      console.error('Error processing images:', error);
      return [];
    }
  }, [images]);

  // Process videos with URL detection
  const processedVideos = useMemo(() => {
    return videos?.map(video => {
      if (typeof video === 'string') {
        return detectVideoUrlType(video);
      }
      return null;
    }).filter((video): video is VideoUrlInfo => video !== null) || [];
  }, [videos]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState<{ [key: number]: boolean }>({});
  const [retryCount, setRetryCount] = useState<{ [key: number]: number }>({});
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [productVideos, setProductVideos] = useState<ProductVideo[]>([]);
  // fetch images from supabase
  const location = useLocation();
  const productId = location.pathname.split('/')[3];

  // Load selected image from localStorage on component mount
  useEffect(() => {
    const savedSelectedImage = localStorage.getItem(`selectedImage_${productId}`);
    if (savedSelectedImage) {
      try {
        setSelectedImage(savedSelectedImage);
      } catch (error) {
        console.error('Error parsing selected image from localStorage:', error);
      }
    }
  }, [productId]);


  useEffect(() => {
    if (productId) {
      if (selectedImage) {
        localStorage.setItem(`selectedImage_${productId}`, selectedImage);
      } else {
        localStorage.removeItem(`selectedImage_${productId}`);
      }
    }
  }, [selectedImage, productId]);

  const fetchImagesForProduct = async (productId: string) => {
    setImageLoading(true);
    try {
      // List files in the product-images bucket
      const { data, error } = await supabase.storage
        .from('product-images')
        .list('', {
          search: `${productId}-`, // Filter by product ID prefix
          limit: 100, // Adjust the limit as necessary
          offset: 0,
        });

      if (error) {
        console.error('Error fetching images:', error.message);
        setProductImages([]);
        setImageLoading(false);
        return;
      }

      // Map over the files and get their public URLs
      const imageUrls = data?.map(file => {
        return supabase.storage.from('product-images').getPublicUrl(file.name).data.publicUrl;
      });
      const mappedImages: ProductImage[] = imageUrls?.map((img, index) => ({
        type: 'image' as const,
        src: img,
        index: index,
        id: `image-${index}`
      })) || [];
      setProductImages(mappedImages);
      setImageLoading(false);
    } catch (fetchError) {
      console.error('Error fetching images for product:', fetchError);
      setProductImages([]);
    } finally {
      setImageLoading(false);
    }
  };
  // Function to generate video thumbnail
  const generateVideoThumbnail = (videoUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.preload = 'metadata';

      video.onloadeddata = () => {
        video.currentTime = 1; // Seek to 1 second
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnailUrl);
        } else {
          resolve(''); // Fallback if canvas is not available
        }
      };

      video.onerror = () => {
        resolve(''); // Fallback on error
      };

      video.src = videoUrl;
    });
  };

  const fetchVideosForProduct = async (productId: string) => {
    try {
      // List files in the product-videos bucket
      const { data, error } = await supabase.storage
        .from('product-videos')
        .list('', {
          search: `${productId}-`, // Filter by product ID prefix
          limit: 100, // Adjust the limit as necessary
          offset: 0,
        });

      if (error) {
        console.error('Error fetching videos:', error.message);
        return;
      }

      // Map over the files and get their public URLs
      const videoUrls = data?.map(file => {
        return supabase.storage.from('product-videos').getPublicUrl(file.name).data.publicUrl;
      });

      // Generate thumbnails for videos
      const mappedVideos: ProductVideo[] = [];
      for (let i = 0; i < (videoUrls?.length || 0); i++) {
        const videoUrl = videoUrls![i];
        const thumbnail = await generateVideoThumbnail(videoUrl);

        mappedVideos.push({
          type: 'video' as const,
          src: videoUrl,
          index: i,
          embedUrl: videoUrl,
          videoType: 'directs',
          id: `video-${i}`,
          thumbnail: thumbnail
        });
      }

      setProductVideos(mappedVideos);
      setImageLoading(false);
    } catch (fetchError) {
      console.error('Error fetching videos for product:', fetchError);
      setImageLoading(false);

    }
  };
  useEffect(() => {
    if (productId) {
      fetchImagesForProduct(productId);
      fetchVideosForProduct(productId);
    }
  }, [productId]);

  // Combine all media items from props and Supabase, prioritizing props
  const allMedia = useMemo(() => {
    const combinedMedia = [
      // First, add images from props (database)
      ...processedImages.map((img, index) => ({
        type: 'image' as const,
        src: img,
        index: index,
        id: `prop-image-${index}`
      })),
      // Then add videos from props
      ...processedVideos.map((video, index) => ({
        type: 'video' as const,
        src: video.originalUrl,
        embedUrl: video.embedUrl,
        videoType: video.type,
        index: processedImages.length + index,
        id: `prop-video-${index}`,
        thumbnail: undefined
      })),
      // Add storage images if no prop images exist
      ...(processedImages.length === 0 ? productImages.map((img, index) => ({
        type: 'image' as const,
        src: img.src,
        index: processedImages.length + processedVideos.length + index,
        id: img.id
      })) : []),
      // Add storage videos if no prop videos exist
      ...(processedVideos.length === 0 ? productVideos.map((video, index) => ({
        type: 'video' as const,
        src: video.src,
        embedUrl: video.embedUrl,
        videoType: video.videoType,
        index: processedImages.length + processedVideos.length + productImages.length + index,
        id: video.id,
        thumbnail: video.thumbnail
      })) : [])
    ];

    // If there's a selected image, move it to the first position
    if (selectedImage) {
      const selectedIndex = combinedMedia.findIndex(media => media.src === selectedImage);
      if (selectedIndex > 0) {
        const selectedMedia = combinedMedia[selectedIndex];
        const reorderedMedia = [
          selectedMedia,
          ...combinedMedia.slice(0, selectedIndex),
          ...combinedMedia.slice(selectedIndex + 1)
        ];
        return reorderedMedia;
      }
    }

    return combinedMedia;
  }, [processedImages, processedVideos, productImages, productVideos, selectedImage]);

  const handleImageError = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  const handleImageRetry = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: false }));
    setRetryCount(prev => ({ ...prev, [index]: (prev[index] || 0) + 1 }));
  };

  const navigateToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % allMedia.length);
  };

  const navigateToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };

  // Handle image selection
  const handleImageSelect = (imageSrc: string) => {
    setSelectedImage(prev => prev === imageSrc ? null : imageSrc);
  };

  const currentMedia = allMedia[currentIndex];

  // Check if current image is selected
  const isCurrentImageSelected = currentMedia ? selectedImage === currentMedia.src : false;

  const renderCurrentMedia = () => {
    if (imageLoading) {
      return (
        <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      );
    }

    // If no media is loaded yet, show loading
    // if (allMedia.length === 0) {
    //   return (
    //     <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
    //       <LoadingSpinner className="h-8 w-8" />
    //     </div>
    //   );
    // }
    if (allMedia.length === 0) {
      return (
        <div className="w-full h-64 bg-gray-50 rounded-lg flex flex-col items-center justify-center">
          <div className="text-gray-400 mb-2">📷</div>
          <p className="text-sm text-gray-500">Images are not found</p>
          <p className="text-xs text-gray-400 mt-1">Upload images to see them here</p>
          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs text-gray-400 max-w-xs text-center break-all">
              Raw images: {JSON.stringify(images).substring(0, 100)}...
            </div>
          )}
        </div>
      );
    }
    if (!currentMedia) {
      return (
        <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">No media available</p>
        </div>
      );
    }

    if (currentMedia.type === 'image') {
      // Check if the image is valid
      if (imageError[currentIndex]) {
        return (
          <div className="w-full h-64 bg-gray-50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
            <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm text-gray-600 mb-2">Failed to load image</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImageRetry(currentIndex)}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Retry ({(retryCount[currentIndex] || 0) + 1})
            </Button>
          </div>
        );
      }

      // Use InnerImageZoom for zoom functionality
      return (
        <div className="w-full h-auto bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center relative">
          <div className="w-full h-full flex items-center justify-center">
            <InnerImageZoom
              src={currentMedia.src}
              zoomSrc={currentMedia.src} // Ensure zoom image is correct
              zoomType="hover" // You can change this to "click" if you prefer
              zoomPreload={true}
              className="max-w-full max-h-full object-contain"
            // zoomScale={0.5}
            />
          </div>

          {/* Selection indicator - top right arrow */}
          {isCurrentImageSelected && (
            <div className="absolute top-2 right-2 z-10">
              <div className="bg-green-500 text-white rounded-full p-1 shadow-lg">
                <StarIcon className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>
      );
    }

    if (currentMedia.type === 'video') {
      // Check if it's a streaming service URL with embed support
      if (currentMedia.embedUrl && currentMedia.videoType !== 'direct') {
        return (
          <div className="w-full h-64 bg-black rounded-lg overflow-hidden">
            <iframe
              src={currentMedia.embedUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`${productName} - Video ${currentMedia.index + 1}`}
            />
          </div>
        );
      }

      // Direct video file
      return (
        <div className="w-full h-64 bg-black rounded-lg overflow-hidden relative">
          <video
            controls
            className="w-full h-full object-contain"
            preload="metadata"
          >
            <source src={currentMedia.src} type="video/mp4" />
            <source src={currentMedia.src} type="video/webm" />
            <source src={currentMedia.src} type="video/ogg" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Unsupported media type</p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Media Display */}
      <div className="relative">
        {renderCurrentMedia()}

        {/* Navigation Buttons */}
        {allMedia.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={navigateToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={navigateToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Media Type Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="bg-white/80">
            {currentMedia?.type === 'image' ? '📷' : '🎥'} {currentIndex + 1} / {allMedia.length}
          </Badge>
        </div>

        {/* External Link for Videos */}
        {(currentMedia as any)?.type === 'video' && (currentMedia as any).videoType !== 'direct' && (
          <div className="absolute top-2 right-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/80 hover:bg-white"
              onClick={() => window.open((currentMedia as any).src, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open
            </Button>
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {allMedia.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allMedia.map((media, index) => {
            const isSelected = selectedImage === media.src;
            return (
              <button
                key={media.id}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all relative ${index === currentIndex
                  ? 'border-primary shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                {media.type === 'image' ? (
                  validateImageUrl(media.src) ? (
                    <>
                      <img
                        src={media.src}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">❌</div>';
                          }
                        }}
                        loading="lazy"
                      />
                      {/* Selection indicator on thumbnail */}
                      {isSelected && (
                        <div className="absolute top-1 right-1 z-10">
                          <div className="bg-green-500 text-white rounded-full p-0.5 shadow-sm">
                            <StarIcon className="h-2 w-2" />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">❌</div>
                  )
                ) : (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                    {/* Video thumbnail */}
                    {media.thumbnail ? (
                      <>
                        <img
                          src={media.thumbnail}
                          alt={`Video thumbnail ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                          onError={(e) => {
                            // Fallback to play icon if thumbnail fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                          loading="lazy"
                        />
                        {/* Play icon overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Fallback: video element for thumbnail generation */}
                        <video
                          src={media.src}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                          onLoadedData={(e) => {
                            const video = e.target as HTMLVideoElement;
                            video.currentTime = 1;
                          }}
                          onSeeked={(e) => {
                            const video = e.target as HTMLVideoElement;
                            const canvas = document.createElement('canvas');
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                              const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
                              const thumbnailDiv = (e.target as HTMLVideoElement).parentElement;
                              if (thumbnailDiv) {
                                thumbnailDiv.style.backgroundImage = `url(${thumbnailUrl})`;
                                thumbnailDiv.style.backgroundSize = 'cover';
                                thumbnailDiv.style.backgroundPosition = 'center';
                              }
                            }
                          }}
                        />
                        {/* Play icon overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}