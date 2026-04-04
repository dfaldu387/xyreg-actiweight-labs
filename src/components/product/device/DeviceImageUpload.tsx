
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload, Image as ImageIcon, Link } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sanitizeImageArray, validateImageUrl } from "@/utils/imageDataUtils";

interface DeviceImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  disabled?: boolean;
}

export const DeviceImageUpload: React.FC<DeviceImageUploadProps> = ({
  images,
  onImagesChange,
  disabled = false
}) => {
  const [newImageUrl, setNewImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImage = () => {
    if (newImageUrl.trim() && validateImageUrl(newImageUrl.trim())) {
      const cleanUrl = newImageUrl.trim();
      console.log('🔄 [DeviceImageUpload] Adding URL image:', cleanUrl);
      
      // Ensure we're working with a proper array and avoid duplicates
      const currentImages = sanitizeImageArray(images);
      if (!currentImages.includes(cleanUrl)) {
        const updatedImages = [...currentImages, cleanUrl];
        console.log('✅ [DeviceImageUpload] Updated images array:', updatedImages.length, 'total images');
        onImagesChange(updatedImages);
        setNewImageUrl("");
      } else {
        console.log('⚠️ [DeviceImageUpload] Image already exists, skipping');
      }
    } else {
      console.warn('❌ [DeviceImageUpload] Invalid image URL provided:', newImageUrl);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('🔄 [DeviceImageUpload] Processing file upload:', file.name, file.size, 'bytes');
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result;
        if (dataUrl && typeof dataUrl === 'string' && validateImageUrl(dataUrl)) {
          console.log('✅ [DeviceImageUpload] File converted to data URL, length:', dataUrl.length);
          
          // Ensure we're working with a proper array and avoid duplicates
          const currentImages = sanitizeImageArray(images);
          if (!currentImages.includes(dataUrl)) {
            const updatedImages = [...currentImages, dataUrl];
            console.log('✅ [DeviceImageUpload] Updated images array:', updatedImages.length, 'total images');
            onImagesChange(updatedImages);
          } else {
            console.log('⚠️ [DeviceImageUpload] Identical image already exists, skipping');
          }
        } else {
          console.error('❌ [DeviceImageUpload] Invalid data URL generated from file');
        }
      };
      reader.onerror = (error) => {
        console.error('❌ [DeviceImageUpload] File read error:', error);
      };
      reader.readAsDataURL(file);
    }
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    console.log('🗑️ [DeviceImageUpload] Removing image at index:', index);
    const currentImages = sanitizeImageArray(images);
    if (index >= 0 && index < currentImages.length) {
      const newImages = [...currentImages];
      newImages.splice(index, 1);
      console.log('✅ [DeviceImageUpload] Updated images array after removal:', newImages.length, 'remaining images');
      onImagesChange(newImages);
    } else {
      console.warn('⚠️ [DeviceImageUpload] Invalid index for removal:', index);
    }
  };

  // Ensure we're working with a valid array
  const safeImages = sanitizeImageArray(images);
  console.log('🎯 [DeviceImageUpload] Rendering with', safeImages.length, 'valid images');

  return (
    <div className="space-y-4">
      {/* Display existing images */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {safeImages.map((url, index) => (
          <div key={index} className="relative bg-muted/50 rounded-md overflow-hidden aspect-square">
            {url && validateImageUrl(url) ? (
              <img
                src={url}
                alt={`Device image ${index + 1}`}
                className="w-full h-full object-cover"
                onLoad={() => {
                  console.log(`✅ [DeviceImageUpload] Image ${index} loaded successfully`);
                }}
                onError={(e) => {
                  console.error(`❌ [DeviceImageUpload] Image ${index} failed to load:`, url.substring(0, 100));
                  e.currentTarget.src = "https://placehold.co/400x400?text=Invalid+Image";
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                <span className="text-sm text-muted-foreground mt-2">Invalid image</span>
              </div>
            )}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-90"
              onClick={() => handleRemoveImage(index)}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        {safeImages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-muted/50 rounded-md p-6 col-span-full">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              No images added yet. Add images using the options below.
            </p>
          </div>
        )}
      </div>
      
      {/* Add new images */}
      <Tabs defaultValue="url" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            URL
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="url" className="space-y-2">
          <Label htmlFor="image-url">Add Image URL</Label>
          <div className="flex items-center gap-2">
            <Input
              id="image-url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Enter image URL (https://... or data:image/...)"
              className="flex-grow"
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !disabled && newImageUrl.trim() && validateImageUrl(newImageUrl.trim())) {
                  e.preventDefault();
                  handleAddImage();
                }
              }}
            />
            <Button 
              onClick={handleAddImage} 
              size="sm" 
              className="whitespace-nowrap"
              disabled={!newImageUrl.trim() || !validateImageUrl(newImageUrl.trim()) || disabled}
            >
              <Link className="h-4 w-4 mr-2" />
              Add URL
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
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="flex-grow"
              disabled={disabled}
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              size="sm" 
              className="whitespace-nowrap"
              disabled={disabled}
            >
              <Upload className="h-4 w-4 mr-2" />
              Browse
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Supported formats: JPEG, PNG, GIF, WebP (max file size recommended: 5MB)
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
};
