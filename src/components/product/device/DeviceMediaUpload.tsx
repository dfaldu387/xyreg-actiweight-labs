import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload, Image as ImageIcon, Video, Link, Play, AlertTriangle, Youtube, Box, Loader2, StarIcon, Trash2, Layers, Package, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { sanitizeImageArray } from "@/utils/imageDataUtils";
import { detectVideoUrlType, isStreamingServiceUrl } from "@/utils/videoUrlUtils";
import { validateImageUrlWithToast, validateImageFileWithToast } from "@/utils/imageValidationUtils";
import { Device3DModelUpload } from "./Device3DModelUpload";
import { Device3DViewer } from "./Device3DViewer";
import { Device3DModel } from "@/types/device3d";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { ImageDisplayItem } from "@/components/product/ImageDisplayItem";
import { useProductsByBasicUDI } from "@/hooks/useProductsByBasicUDI";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface DeviceMediaUploadProps {
  images: string[];
  videos: string[];
  models3D?: Device3DModel[];
  onImagesChange: (images: string[]) => void;
  onVideosChange: (videos: string[]) => void;
  onModels3DChange?: (models: Device3DModel[]) => void;
  disabled?: boolean;
  onImageDeleted?: () => void;
  selectedVariantId?: string | null;
  companyId?: string; // Optional: pass company_id directly to avoid query
}

// Supported and unsupported video formats
const SUPPORTED_VIDEO_FORMATS = ['.mp4', '.webm', '.ogg'];
const UNSUPPORTED_VIDEO_FORMATS = ['.mov', '.avi', '.wmv', '.flv', '.mkv'];

const getFileExtension = (filename: string): string => {
  return filename.toLowerCase().substring(filename.lastIndexOf('.'));
};

const isVideoFormatSupported = (filename: string): boolean => {
  const ext = getFileExtension(filename);
  return SUPPORTED_VIDEO_FORMATS.includes(ext);
};

export const DeviceMediaUpload: React.FC<DeviceMediaUploadProps> = ({
  images,
  videos,
  models3D = [],
  onImagesChange,
  onVideosChange,
  onModels3DChange,
  disabled = false,
  onImageDeleted,
  companyId: propCompanyId
}) => {
  const [newImageUrl, setNewImageUrl] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [videoFormatWarning, setVideoFormatWarning] = useState<string | null>(null);
  const [selected3DModelIndex, setSelected3DModelIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageData, setImageData] = useState<string[]>([]);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const productId = location.pathname.split('/')[3];
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFamilyImage, setSelectedFamilyImage] = useState<string | null>(null);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [basicUdiDi, setBasicUdiDi] = useState<string | null>(null);
  const [selectedVariantForImage, setSelectedVariantForImage] = useState<Record<string, string | null>>({}); // imageUrl -> variantId
  const [globalVariantFilter, setGlobalVariantFilter] = useState<string | null>(null); // Global variant filter
  const [currentProductData, setCurrentProductData] = useState<{ basic_udi_di: string | null; company_id: string | null } | null>(null);
  const [isLoadingProductData, setIsLoadingProductData] = useState(false);
  const [variantImagesMap, setVariantImagesMap] = useState<Record<string, string[]>>({}); // variantId -> imageUrls[]

  // Get current product's basic_udi_di and company_id
  useEffect(() => {
    if (!productId) return;

    const fetchProductData = async () => {
      setIsLoadingProductData(true);
      

      try {
        const { data, error } = await supabase
          .from('products')
          .select('basic_udi_di, company_id')
          .eq('id', productId)
          .single();

        if (error) {
          console.error('🔄 [DeviceMediaUpload] Error fetching product data:', error);
          setIsLoadingProductData(false);
          return;
        }
        setCurrentProductData(data);
        setBasicUdiDi(data?.basic_udi_di || null);
      } catch (error) {
        console.error('🔄 [DeviceMediaUpload] Error fetching product data:', error);
      } finally {
        setIsLoadingProductData(false);
      }
    };

    fetchProductData();
  }, [productId]);

  const currentBasicUDI = currentProductData?.basic_udi_di || null;
  // Use prop companyId if provided, otherwise use queried companyId
  const companyId = propCompanyId || currentProductData?.company_id || null;

  // Fetch product variants (sibling products) that share the same basic_udi_di
  // Only fetch if we have both companyId and currentBasicUDI
  const { siblings: productVariants, isLoading: variantsLoading } = useProductsByBasicUDI(
    companyId || '',
    currentBasicUDI || undefined
  );

  // Filter out the current product from variants list
  const variants = React.useMemo(() => {
    if (!productVariants || productVariants.length === 0) {
      
      return [];
    }
    const filtered = productVariants.filter(v => v.id !== productId);
    return filtered;
  }, [productVariants, productId]);

  // Fetch variant images from database to show indicators
  useEffect(() => {
    if (!variants || variants.length === 0 || !companyId) return;
    
    const fetchVariantImages = async () => {
      try {
        const variantIds = variants.map(v => v.id);
        const { data: variantProducts, error } = await supabase
          .from('products')
          .select('id, images')
          .in('id', variantIds);
        
        if (error) {
          console.error('Error fetching variant images:', error);
          return;
        }
        
        // Create a map of variantId -> images array
        const imagesMap: Record<string, string[]> = {};
        (variantProducts || []).forEach((variant: any) => {
          if (variant.images && Array.isArray(variant.images)) {
            imagesMap[variant.id] = variant.images.map((img: any) => String(img));
          }
        });
        
        setVariantImagesMap(imagesMap);
      } catch (error) {
        console.error('Error fetching variant images:', error);
      }
    };
    
    fetchVariantImages();
  }, [variants, companyId]);

  useEffect(() => {
    const savedSelectedImage = localStorage.getItem(`selectedImage_${productId}`);
    if (savedSelectedImage) {
      try {
        setSelectedImage(savedSelectedImage);
      } catch (error) {
        console.error('Error parsing selected image from localStorage:', error);
      }
    }

    // Load saved family image when basicUdiDi is available
    if (basicUdiDi) {
      const savedFamilyImage = localStorage.getItem(`selectedFamilyImage_${basicUdiDi}`);
      if (savedFamilyImage) {
        setSelectedFamilyImage(savedFamilyImage);
      }
    }
  }, [productId, basicUdiDi]);

  const handleSetFamilyImage = (url: string) => {
    if (!basicUdiDi) {
      toast.error('Product must have a Basic UDI-DI to set family card image');
      return;
    }

    localStorage.setItem(`selectedFamilyImage_${basicUdiDi}`, url);
    setSelectedFamilyImage(url);
    toast.success('Set as family card image');
  };

  const handleSelectImage = (url: string, index: number) => {
    setSelectedImage(url);
    setCurrentIndex(index);
    localStorage.setItem(`selectedImage_${productId}`, url);
  };

  // Handle variant selection for a specific image
  const handleVariantSelectForImage = async (imageUrl: string, variantId: string | null) => {
    
    
    if (!variantId) {
      // If variantId is null, remove the image assignment from all variants
      // Find all variants that have this image and remove it
      try {
        const { data: variantsWithImage, error: fetchError } = await supabase
          .from('products')
          .select('id, images')
          .eq('company_id', companyId || '')
          .not('images', 'is', null);
        
        if (fetchError) throw fetchError;
        
        // Update each variant that contains this image
        const updatePromises = (variantsWithImage || []).map(async (variant: any) => {
          if (variant.images && Array.isArray(variant.images) && variant.images.includes(imageUrl)) {
            const updatedImages = variant.images.filter((img: string) => img !== imageUrl);
            return supabase
              .from('products')
              .update({ images: updatedImages })
              .eq('id', variant.id);
          }
          return null;
        }).filter(Boolean);
        
        await Promise.all(updatePromises);
        setSelectedVariantForImage(prev => {
          const updated = { ...prev };
          delete updated[imageUrl];
          return updated;
        });
        
        // Update variant images map - remove image from all variants
        setVariantImagesMap(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(variantId => {
            if (updated[variantId]?.includes(imageUrl)) {
              updated[variantId] = updated[variantId].filter(img => img !== imageUrl);
            }
          });
          return updated;
        });
        
        toast.success('Image assignment removed');
      } catch (error) {
        console.error('Error removing image assignment:', error);
        toast.error('Failed to remove image assignment');
      }
      return;
    }
    
    try {
      // Fetch current variant data to get existing images
      const { data: variantData, error: fetchError } = await supabase
        .from('products')
        .select('images')
        .eq('id', variantId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Get current images array or initialize as empty array
      const currentImages = Array.isArray(variantData?.images) ? variantData.images : [];
      
      // Check if image already exists in the array
      if (currentImages.includes(imageUrl)) {
        toast.info('Image is already assigned to this variant');
        return;
      }
      
      // Add new image to the array
      const updatedImages = [...currentImages, imageUrl];
      
      // Update variant with combined images array
      const { error: updateError } = await supabase
        .from('products')
        .update({ images: updatedImages })
        .eq('id', variantId);
      
      if (updateError) throw updateError;
      
      // Update local state
      setSelectedVariantForImage(prev => ({
        ...prev,
        [imageUrl]: variantId
      }));
      
      // Update variant images map
      setVariantImagesMap(prev => ({
        ...prev,
        [variantId]: updatedImages as string[]
      }));
      
      toast.success('Image assigned to variant');
    } catch (error) {
      console.error('Error assigning image to variant:', error);
      toast.error('Failed to assign image to variant');
    }
  };

  // Handle global variant filter
  const handleGlobalVariantFilter = (variantId: string | null) => {
    setGlobalVariantFilter(variantId);
  };
  const handleAddImageUrl = async () => {
    if (!newImageUrl.trim()) return;

    // Validate the image URL
    const isValid = await validateImageUrlWithToast(newImageUrl);
    if (!isValid) {
      return;
    }

    // Add the image URL to the state
    const currentImages = sanitizeImageArray(images);
    const updatedImages = [...currentImages, newImageUrl.trim()];
    onImagesChange(updatedImages);
    setNewImageUrl("");
  };

  const handleAddVideoUrl = () => {
    if (newVideoUrl.trim() && !videos.includes(newVideoUrl.trim())) {
      const cleanUrl = newVideoUrl.trim();

      // Detect video type and provide feedback
      const videoInfo = detectVideoUrlType(cleanUrl);
      

      const currentVideos = videos || [];
      const updatedVideos = [...currentVideos, cleanUrl];
      onVideosChange(updatedVideos);
      setNewVideoUrl("");
      setVideoFormatWarning(null);
    }
  };

  // const handleImageFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (file && file.type.startsWith('image/')) {
  //     console.log('🔄 [DeviceMediaUpload] Processing image file:', file.name);
  //     const reader = new FileReader();
  //     reader.onload = (e) => {
  //       const dataUrl = e.target?.result;
  //       if (dataUrl && typeof dataUrl === 'string' && !images.includes(dataUrl)) {
  //         console.log('✅ [DeviceMediaUpload] Image file converted to data URL');
  //         const currentImages = sanitizeImageArray(images);
  //         const updatedImages = [...currentImages, dataUrl];
  //         onImagesChange(updatedImages);
  //       }
  //     };
  //     reader.readAsDataURL(file);
  //   }
  //   if (imageFileInputRef.current) {
  //     imageFileInputRef.current.value = '';
  //   }
  // };
  // const handleImageFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (file && file.type.startsWith('image/')) {
  //     console.log('🔄 [DeviceMediaUpload] Processing image file:', file.name);

  //     // Create a unique file name to avoid collisions
  //     const fileName = `${Date.now()}-${file.name}`;

  //     try {
  //       // Upload to Supabase Storage
  //       const { data, error: uploadErrors } = await supabase.storage
  //         .from('product-images') // Replace with your bucket name
  //         .upload(fileName, file);

  //       if (uploadErrors) {
  //         // Type the error as any
  //         console.log('🔄 [DeviceMediaUpload] Upload error:', uploadErrors);
  //         const uploadError: any = uploadErrors;
  //         console.error('Error uploading image:', uploadError.message);
  //         return;
  //       }

  //       // Get the public URL of the uploaded image
  //       const { data: { publicUrl } } = await supabase.storage
  //         .from('product-images')
  //         .getPublicUrl(fileName);
  //       console.log('✅ [DeviceMediaUpload] Image uploaded:', publicUrl);

  //       // Add the uploaded image URL to the state
  //       const currentImages = sanitizeImageArray(images);
  //       const updatedImages = [...currentImages, publicUrl];
  //       onImagesChange(updatedImages);
  //     } catch (uploadError: any) {
  //       console.error('Error uploading file:', uploadError);
  //     }
  //   }
  //   if (imageFileInputRef.current) {
  //     imageFileInputRef.current.value = ''; // Reset the input
  //   }
  // };
  const handleImageFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      

      // Validate image file with dimensions
      const isValid = await validateImageFileWithToast(file);
      if (!isValid) {
        // Reset the file input
        if (imageFileInputRef.current) {
          imageFileInputRef.current.value = '';
        }
        return;
      }

      // Create a unique file name to avoid collisions, using the product ID
      const fileName = `${productId}-${Date.now()}-${file.name}`;

      try {
        // Upload to Supabase Storage with the product ID in the file name
        const { data, error: uploadErrors } = await supabase.storage
          .from('product-images') // Replace with your bucket name
          .upload(fileName, file);

        if (uploadErrors) {
          console.error('🔄 [DeviceMediaUpload] Upload error:', uploadErrors);
          toast.error("Failed to upload image to storage.");
          return;
        }

        // Get the public URL of the uploaded image
        const { data: { publicUrl } } = await supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        
        toast.success('Image uploaded successfully');
        // Update the local state with the newly uploaded image URL
        const currentImages = sanitizeImageArray(images);
        const updatedImages = [...currentImages, publicUrl];
        onImagesChange(updatedImages);

        await fetchImagesForProduct(productId);

      } catch (uploadError: any) {
        console.error('Error uploading file:', uploadError);
        toast.error("Failed to upload image file.");
      }
    }

    if (imageFileInputRef.current) {
      imageFileInputRef.current.value = ''; // Reset the input
    }
  };

  const fetchImagesForProduct = async (productId: string) => {
    try {
      setImageLoading(true);
      

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
        setImageLoading(false);
        return;
      }

      // Map over the files and get their public URLs
      const imageUrls = data?.map(file => {
        return supabase.storage.from('product-images').getPublicUrl(file.name).data.publicUrl;
      }) || [];

      

      setImageData(imageUrls);
      setImageLoading(false);
      // Note: Don't call onImagesChange here as it conflicts with the manual image addition
    } catch (fetchError) {
      console.error('Error fetching images for product:', fetchError);
      setImageLoading(false);
    }
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


      // Update the videos state with the fetched URLs
      onVideosChange(videoUrls || []);
    } catch (fetchError) {
      console.error('Error fetching videos for product:', fetchError);
    }
  };
  useEffect(() => {
    if (productId) {
      fetchImagesForProduct(productId);
      fetchVideosForProduct(productId);
    }
  }, [productId]);

  const handleVideoFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      

      // Check if the format is supported
      if (!isVideoFormatSupported(file.name)) {
        const ext = getFileExtension(file.name);
        setVideoFormatWarning(`${ext.toUpperCase()} format may not play in all browsers. For best compatibility, please convert to MP4 format.`);
      } else {
        setVideoFormatWarning(null);
      }

      // Create a unique file name to avoid collisions, using the product ID
      const fileName = `${productId}-${Date.now()}-${file.name}`;

      try {
        // Upload to Supabase Storage with the product ID in the file name
        const { data, error: uploadErrors } = await supabase.storage
          .from('product-videos') // Use product-videos bucket for videos
          .upload(fileName, file);

        if (uploadErrors) {
          
          return;
        }

        // Get the public URL of the uploaded video
        const { data: { publicUrl } } = await supabase.storage
          .from('product-videos')
          .getPublicUrl(fileName);
        toast.success('Video uploaded successfully');
        

        // Update the local state with the newly uploaded video URL
        const currentVideos = videos || [];
        const updatedVideos = [...currentVideos, publicUrl];
        onVideosChange(updatedVideos);

        // Refresh the video list from Supabase
        await fetchVideosForProduct(productId);

      } catch (uploadError: any) {
        console.error('Error uploading video file:', uploadError);
      }
    }

    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = ''; // Reset the input
    }
  };

  // const handleRemoveImage = (index: number) => {
  //   console.log('🗑️ [DeviceMediaUpload] Removing image at index:', index);
  //   const currentImages = sanitizeImageArray(images);
  //   const newImages = [...currentImages];
  //   newImages.splice(index, 1);
  //   onImagesChange(newImages);
  // };
  const handleRemoveImageClick = (imageUrl: string) => {
    setImageToDelete(imageUrl);
    setShowDeleteDialog(true);
  };

  const handleConfirmRemoveImage = async () => {
    if (!imageToDelete) return;

    

    try {
      // Check if this is a Supabase storage image
      const isSupabaseImage = imageToDelete.includes('supabase.co') && imageToDelete.includes(`${productId}-`);

      if (isSupabaseImage) {
        // Handle Supabase storage image removal
        // More robust file name extraction
        let fileName = '';
        try {
          const url = new URL(imageToDelete);
          const pathParts = url.pathname.split('/');
          fileName = pathParts[pathParts.length - 1];

          // Decode URL-encoded characters
          fileName = decodeURIComponent(fileName);
        } catch (error) {
          // Fallback to old method
          const filePath = imageToDelete.split('supabase.co/')[1];
          fileName = filePath.split('/').pop() || '';
        }

        

        // Remove from imageData immediately for UI feedback
        setImageData(prev => prev.filter(img => img !== imageToDelete));

        const { error } = await supabase.storage
          .from('product-images')
          .remove([fileName]);

        if (error) {
          console.error('🛑 Error deleting image from Supabase:', error.message);
          toast.error('Failed to remove image from storage');
          return;
        }

        toast.success('Image removed successfully');

        // Update the database by removing the image from the images array
        const currentImages = sanitizeImageArray(images);
        const updatedImages = currentImages.filter(img => img !== imageToDelete);
        onImagesChange(updatedImages);

        // Re-fetch images from Supabase to update the UI
        await fetchImagesForProduct(productId);

        // Notify parent component that an image was deleted
        onImageDeleted?.();
      } else {
        // Handle external URL removal - just remove from local state
        

        // Remove from the images prop (external URLs)
        const currentImages = sanitizeImageArray(images);
        const updatedImages = currentImages.filter(img => img !== imageToDelete);
        onImagesChange(updatedImages);

        // Also remove from imageData if it exists there (shouldn't happen for external URLs, but just in case)
        const updatedImageData = imageData.filter(img => img !== imageToDelete);
        setImageData(updatedImageData);

        toast.success('External image removed successfully');
      }

      // If the removed image was selected, clear the selection
      if (selectedImage === imageToDelete) {
        setSelectedImage(null);
        localStorage.removeItem(`selectedImage_${productId}`);
      }

    } catch (error) {
      toast.error('Failed to remove image');
    } finally {
      setShowDeleteDialog(false);
      setImageToDelete(null);
    }
  };


  const handleRemoveVideo = async (index: number) => {
    const currentVideos = videos || [];
    const videoToRemove = currentVideos[index];
    const fileName = decodeURIComponent(videoToRemove.split('/').pop() || "");
    

    if (!fileName) {
      console.error('🛑 Could not extract file name from the video URL:', videoToRemove);
      return;
    }

    try {
      // Delete the video from Supabase Storage
      const { error } = await supabase.storage
        .from('product-videos')
        .remove([fileName]);

      if (error) {
        console.error('🛑 Error deleting video from Supabase:', error.message);
        return;
      }

      
      toast.success('Video removed successfully');
      // Re-fetch the videos from Supabase and update the UI
      await fetchVideosForProduct(productId);

    } catch (error) {
      console.error('🛑 Error removing video from Supabase:', error);
    }
  };
  const safeImages = sanitizeImageArray(images);
  // Clean up orphaned Supabase URLs from external images prop
  useEffect(() => {
    if (imageData.length > 0 && safeImages.length > 0) {
      const supabaseUrls = imageData.map(url => url.includes('supabase.co') ? url : null).filter(Boolean);
      const orphanedSupabaseUrls = safeImages.filter(img =>
        img.includes('supabase.co') && img.includes(`${productId}-`) && !supabaseUrls.includes(img)
      );

      if (orphanedSupabaseUrls.length > 0) {
        
        const cleanedImages = safeImages.filter(img => !orphanedSupabaseUrls.includes(img));
        onImagesChange(cleanedImages);
      }
    }
  }, [imageData, safeImages, productId, onImagesChange]);

  // Combine Supabase images (imageData) with external URLs (images prop) and remove duplicates
  // Filter out any Supabase URLs that are no longer in imageData (deleted images)
  const supabaseUrls = imageData.filter(url => url.includes('supabase.co'));
  const externalUrls = safeImages.filter(url => !url.includes('supabase.co'));
  // Remove any external URLs that match deleted Supabase images
  const filteredExternalUrls = externalUrls.filter(externalUrl => {
    // Check if this external URL is actually a Supabase URL that was deleted
    if (externalUrl.includes('supabase.co') && externalUrl.includes(`${productId}-`)) {
      // This is a Supabase URL in the external list, check if it still exists in imageData
      return supabaseUrls.includes(externalUrl);
    }
    return true; // Keep non-Supabase external URLs
  });

  // Also include Supabase URLs from safeImages (database) that might not be in storage listing yet
  const supabaseFromDb = safeImages.filter(url => url.includes('supabase.co'));
  const combinedSupabaseUrls = [...new Set([...supabaseUrls, ...supabaseFromDb])];

  const combinedImages = [...combinedSupabaseUrls, ...filteredExternalUrls];

  const allImages = [...new Set(combinedImages)]; // Remove duplicate URLs

  // Filter images based on global variant filter
  const filteredImages = useMemo(() => {
    if (!globalVariantFilter) {
      return allImages;
    }
    // Show only images assigned to the selected variant
    return allImages.filter(url => selectedVariantForImage[url] === globalVariantFilter);
  }, [allImages, globalVariantFilter, selectedVariantForImage]);

  const safeVideos = videos || [];
  const safe3DModels = models3D || [];
  
  return (
    <div className="space-y-6">
      {/* Display existing media */}
      <div className="space-y-4">
        {/* Images Section */}
        {
          imageLoading ? (
            <div className="flex items-center justify-center h-64 bg-muted/50 rounded-md p-6">
              <LoadingSpinner className="mr-2" />
              Loading images...
            </div>
          ) : (
            filteredImages.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Images ({filteredImages.length}{globalVariantFilter ? ` - Filtered by variant` : ''})
                  </h4>
                  {variants && variants.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          {variantsLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Package className="h-4 w-4" />
                          )}
                          {globalVariantFilter
                            ? variants.find(v => v.id === globalVariantFilter)?.name || variants.find(v => v.id === globalVariantFilter)?.trade_name || 'Select Variant'
                            : 'All Variants'
                          }
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Filter by Variant</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleGlobalVariantFilter(null)}
                          className={!globalVariantFilter ? 'bg-muted' : ''}
                        >
                          <Package className="h-4 w-4 mr-2" />
                          All Variants
                          <Badge variant="outline" className="ml-auto">
                            {allImages.length}
                          </Badge>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {variants.map((variant) => {
                          const variantImageCount = allImages.filter(url => selectedVariantForImage[url] === variant.id).length;
                          return (
                            <DropdownMenuItem
                              key={variant.id}
                              onClick={() => handleGlobalVariantFilter(variant.id)}
                              className={globalVariantFilter === variant.id ? 'bg-muted' : ''}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              {variant.name || `Variant ${variant.id.slice(0, 8)}`}
                              <Badge variant="outline" className="ml-auto">
                                {variantImageCount}
                              </Badge>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredImages.map((url, index) => {
                    // Check if this is a Supabase image (has product ID prefix) or external URL
                    const isSupabaseImage = url.includes('supabase.co') && url.includes(`${productId}-`);

                    return (
                      <div key={url} className="relative bg-muted/50 rounded-md overflow-hidden aspect-square group">
                        <ImageDisplayItem
                          imageUrl={url}
                          alt={`Device image ${index + 1}`}
                          className="w-full h-full"
                        />
                        <Button
                          variant="secondary"
                          size="icon"
                          className={`absolute top-2 left-2 h-8 w-8 rounded-full opacity-90 ${selectedImage === url ? 'bg-green-500' : ''}`}
                          onClick={() => handleSelectImage(url, index)}
                          disabled={disabled}
                          title="Set as product card image"
                        >
                          <StarIcon className="h-4 w-4" />
                        </Button>
                        {basicUdiDi && (
                          <Button
                            variant="secondary"
                            size="icon"
                            className={`absolute top-2 left-12 h-8 w-8 rounded-full opacity-90 hover:opacity-100 ${selectedFamilyImage === url ? 'bg-green-500' : ''}`}
                            onClick={() => handleSetFamilyImage(url)}
                            disabled={disabled}
                            title="Set as family card image"
                          >
                            <Layers className="h-4 w-4" />
                          </Button>
                        )}
                        {/* Always show variant icon if variants exist, regardless of basicUdiDi */}
                        {/* {variants && variants.length > 0 && ( */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              className={`absolute top-2 ${basicUdiDi ? 'left-20' : 'left-12'} h-8 w-8 rounded-full opacity-90 hover:opacity-100 ${selectedVariantForImage[url] ? 'bg-blue-500' : ''}`}
                              disabled={disabled}
                              title="Assign to variant"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuLabel>Assign to Variant</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleVariantSelectForImage(url, null)}
                              className={!selectedVariantForImage[url] ? 'bg-muted' : ''}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              No Variant
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {variants.map((variant) => {
                              const variantImages = variantImagesMap[variant.id] || [];
                              const hasImage = variantImages.includes(url);
                              
                              return (
                                <DropdownMenuItem
                                  key={variant.id}
                                  onClick={() => handleVariantSelectForImage(url, variant.id)}
                                  className={selectedVariantForImage[url] === variant.id ? 'bg-muted' : ''}
                                >
                                  <Package className="h-4 w-4 mr-2" />
                                  {variant.trade_name || `Variant ${variant.id.slice(0, 8)}`}
                                  {hasImage && (
                                    <CheckCircle2 className="h-4 w-4 ml-auto text-blue-500" />
                                  )}
                                  {variant.status && !hasImage && (
                                    <Badge variant="outline" className="ml-auto">
                                      {variant.status}
                                    </Badge>
                                  )}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {/* )} */}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-90 hover:opacity-100"
                          onClick={() => handleRemoveImageClick(url)}
                          disabled={disabled}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {/* Show indicator for image source */}
                        {!isSupabaseImage && (
                          <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            External
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )
        }

        {/* Videos Section */}
        {safeVideos.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Video className="h-4 w-4" />
              Videos ({safeVideos.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

              {safeVideos.map((url, index) => {
                const videoInfo = detectVideoUrlType(url);
                return (
                  <div key={`video-${index}`} className="relative bg-muted/50 rounded-md overflow-hidden aspect-video">
                    {videoInfo.type === 'youtube' || videoInfo.type === 'vimeo' ? (
                      <div className="relative w-full h-full">
                        <iframe
                          src={videoInfo.embedUrl}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={`${videoInfo.type} video ${index + 1}`}
                        />
                        <div className="absolute top-2 left-2">
                          {videoInfo.type === 'youtube' && <Youtube className="h-4 w-4 text-red-500" />}
                          {videoInfo.type === 'vimeo' && <Video className="h-4 w-4 text-blue-500" />}
                        </div>
                      </div>
                    ) : (
                      <>

                        <video
                          controls
                          className="w-full h-full object-contain"
                          preload="metadata"
                        >
                          <source src={url} type="video/mp4" />
                          <source src={url} type="video/webm" />
                          <source src={url} type="video/ogg" />
                          Your browser does not support the video tag.
                        </video>

                        <div className="video-error absolute inset-0 flex-col items-center justify-center bg-red-100 text-red-600 hidden">
                          <AlertTriangle className="h-8 w-8 mb-2" />
                          <span className="text-sm text-center px-2">Video format not supported</span>
                        </div>
                        {/* <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="text-white h-8 w-8" fill="white" />
                        </div> */}
                      </>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-90"
                      onClick={() => handleRemoveVideo(index)}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3D Models Section */}
        {safe3DModels.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Box className="h-4 w-4" />
              3D Models ({safe3DModels.length})
            </h4>
            <Device3DViewer
              models={safe3DModels}
              selectedModelIndex={selected3DModelIndex}
              onModelSelect={setSelected3DModelIndex}
            />
          </div>
        )}

        {/* Empty State */}
        {filteredImages.length === 0 && safeVideos.length === 0 && safe3DModels.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 bg-muted/50 rounded-md p-6">
            <div className="flex items-center gap-4 mb-4">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
              <Video className="h-12 w-12 text-muted-foreground" />
              <Box className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {globalVariantFilter
                ? 'No images assigned to the selected variant. Assign images to variants using the Package icon.'
                : 'No media added yet. Add images, videos, and 3D models using the options below.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Video Format Warning */}
      {videoFormatWarning && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {videoFormatWarning}
            <br />
            <strong>Recommended formats:</strong> MP4, WebM for best browser compatibility.
          </AlertDescription>
        </Alert>
      )}

      {/* Add new media */}
      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="images" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Images
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="3d-models" className="flex items-center gap-2">
            <Box className="h-4 w-4" />
            3D Models
          </TabsTrigger>
        </TabsList>

        <TabsContent value="images" className="space-y-4">
          <Tabs defaultValue="url" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url">URL</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-2">
              <Label htmlFor="image-url">Add Image URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="image-url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Enter image URL (https://...)"
                  disabled={disabled}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && !disabled && newImageUrl.trim()) {
                      e.preventDefault();
                      await handleAddImageUrl();
                    }
                  }}
                />
                <Button
                  onClick={async () => await handleAddImageUrl()}
                  size="sm"
                  disabled={!newImageUrl.trim() || disabled}
                >
                  <Link className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-2">
              <Label htmlFor="image-file">Upload Image File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="image-file"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  ref={imageFileInputRef}
                  disabled={disabled}
                />
                <Button
                  onClick={() => imageFileInputRef.current?.click()}
                  size="sm"
                  disabled={disabled}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: JPEG, PNG, GIF, WebP (max file size: 5MB)
              </p>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <Alert>
            <Youtube className="h-4 w-4" />
            <AlertDescription>
              <strong>Supported video sources:</strong>
              <br />
              • YouTube, Vimeo URLs (automatically embedded)
              <br />
              • Direct video files: MP4, WebM (recommended)
              <br />
              • Avoid: MOV, AVI, WMV (poor browser support)
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="url" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url">URL</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-2">
              <Label htmlFor="video-url">Add Video URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="video-url"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="YouTube, Vimeo, or direct video URL..."
                  disabled={disabled}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !disabled && newVideoUrl.trim()) {
                      e.preventDefault();
                      handleAddVideoUrl();
                    }
                  }}
                />
                <Button
                  onClick={handleAddVideoUrl}
                  size="sm"
                  disabled={!newVideoUrl.trim() || disabled}
                >
                  <Link className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              {newVideoUrl.trim() && (
                <div className="text-xs text-muted-foreground">
                  {isStreamingServiceUrl(newVideoUrl) ? (
                    <span className="text-green-600">✓ Streaming service URL detected</span>
                  ) : (
                    <span>Direct video file URL</span>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upload" className="space-y-2">
              <Label htmlFor="video-file">Upload Video File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="video-file"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileUpload}
                  ref={videoFileInputRef}
                  disabled={disabled}
                />
                <Button
                  onClick={() => videoFileInputRef.current?.click()}
                  size="sm"
                  disabled={disabled}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>Best compatibility:</strong> MP4, WebM | <strong>Avoid:</strong> MOV, AVI, WMV
              </p>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="3d-models" className="space-y-4">
          <div>
            <Label className="text-base font-medium">Add 3D Models</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Add 3D models of your device for interactive visualization. Upload files or provide direct URLs to .glb, .gltf, .obj, and .fbx formats.
            </p>
            <Device3DModelUpload
              models={safe3DModels}
              onModelsChange={onModels3DChange || (() => { })}
              disabled={disabled}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Image Deletion Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Remove Image
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this image? This action cannot be undone.
              {imageToDelete && imageToDelete.includes('supabase.co') && (
                <span className="block mt-2 text-sm text-amber-600">
                  This image will be permanently deleted from storage.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setImageToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRemoveImage}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};



