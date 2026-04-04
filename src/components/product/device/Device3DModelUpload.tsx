
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload, Box, Link, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Device3DModel, Device3DModelUploadProps } from "@/types/device3d";

const SUPPORTED_3D_FORMATS = ['.glb', '.gltf', '.obj', '.fbx'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Helper function to validate 3D model URLs
const validateModelUrl = (url: string): { isValid: boolean; error?: string; detectedFormat?: string } => {
  try {
    new URL(url); // Basic URL validation
  } catch {
    return { isValid: false, error: "Invalid URL format" };
  }

  // Check for common 3D hosting services
  const sketchfabPattern = /sketchfab\.com\/3d-models\//;
  const claraPattern = /clara\.io\//;
  
  if (sketchfabPattern.test(url)) {
    return { 
      isValid: false, 
      error: "Sketchfab page URLs are not supported. You need a direct link to the 3D model file (.glb, .gltf, etc.)" 
    };
  }
  
  if (claraPattern.test(url) && !url.includes('/download/')) {
    return { 
      isValid: false, 
      error: "Clara.io page URLs are not supported. You need a direct download link to the 3D model file." 
    };
  }

  // Try to detect format from URL
  const extension = url.split('.').pop()?.toLowerCase();
  const detectedFormat = extension && SUPPORTED_3D_FORMATS.includes('.' + extension) ? extension : undefined;

  return { isValid: true, detectedFormat };
};

export const Device3DModelUpload: React.FC<Device3DModelUploadProps> = ({
  models,
  onModelsChange,
  disabled = false
}) => {
  const [newModelUrl, setNewModelUrl] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("glb");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getModelFormat = (url: string): string => {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  };

  const validateFile = (file: File): string | null => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!SUPPORTED_3D_FORMATS.includes(extension)) {
      return `Unsupported format. Please use: ${SUPPORTED_3D_FORMATS.join(', ')}`;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File size too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB.`;
    }
    
    return null;
  };

  const handleAddModelUrl = () => {
    if (newModelUrl.trim() && newModelName.trim()) {
      setUploadError(null);
      
      // Validate the URL
      const validation = validateModelUrl(newModelUrl.trim());
      if (!validation.isValid) {
        setUploadError(validation.error || "Invalid URL");
        return;
      }

      // Use detected format or fallback to selected format
      const finalFormat = validation.detectedFormat || selectedFormat;

      const newModel: Device3DModel = {
        url: newModelUrl.trim(),
        name: newModelName.trim(),
        format: finalFormat
      };

      if (!models.some(model => model.url === newModel.url)) {
        onModelsChange([...models, newModel]);
        setNewModelUrl("");
        setNewModelName("");
        setSelectedFormat("glb");
        setUploadError(null);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadProgress(0);

    // Convert file to data URL
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(progress);
      }
    };

    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      if (dataUrl && typeof dataUrl === 'string') {
        const format = getModelFormat(file.name);
        const modelName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension

        const newModel: Device3DModel = {
          url: dataUrl,
          name: modelName,
          format: format
        };

        if (!models.some(model => model.url === newModel.url)) {
          onModelsChange([...models, newModel]);
        }
      }
      setUploadProgress(null);
    };

    reader.onerror = () => {
      setUploadError('Failed to read file. Please try again.');
      setUploadProgress(null);
    };

    reader.readAsDataURL(file);

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveModel = (index: number) => {
    const newModels = [...models];
    newModels.splice(index, 1);
    onModelsChange(newModels);
  };

  return (
    <div className="space-y-4">
      {/* Display existing models */}
      <div className="grid grid-cols-1 gap-4">
        {models.map((model, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  {model.name}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveModel(index)}
                  disabled={disabled}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground">
                Format: .{model.format} | {model.url.startsWith('data:') ? 'Uploaded file' : 'External URL'}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {models.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 bg-muted/50 rounded-md p-6 border-2 border-dashed">
            <Box className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              No 3D models added yet. Add models using the options below.
            </p>
          </div>
        )}
      </div>

      {/* Upload/URL input section */}
      <Tabs defaultValue="url" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">URL</TabsTrigger>
          <TabsTrigger value="upload">Upload File</TabsTrigger>
        </TabsList>
        
        <TabsContent value="url" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> You need direct links to 3D model files (.glb, .gltf, .obj, .fbx).
              <br />
              <strong>✓ Valid:</strong> https://example.com/model.glb
              <br />
              <strong>✗ Invalid:</strong> Sketchfab page links, Clara.io page links
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="model-name-url">Model Name</Label>
            <Input
              id="model-name-url"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              placeholder="Model name (e.g., 'Main Device View')"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="model-url">Direct Model File URL</Label>
            <div className="flex items-center gap-2">
              <Input
                id="model-url"
                value={newModelUrl}
                onChange={(e) => {
                  setNewModelUrl(e.target.value);
                  setUploadError(null); // Clear error when user types
                }}
                placeholder="https://example.com/model.glb"
                className="flex-grow"
                disabled={disabled}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !disabled && newModelUrl.trim() && newModelName.trim()) {
                    e.preventDefault();
                    handleAddModelUrl();
                  }
                }}
              />
              <Button 
                onClick={handleAddModelUrl} 
                size="sm" 
                className="whitespace-nowrap"
                disabled={!newModelUrl.trim() || !newModelName.trim() || disabled}
              >
                <Link className="h-4 w-4 mr-2" />
                Add URL
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="format-select">Model Format (if not detectable from URL)</Label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat} disabled={disabled}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="glb">GLB (recommended)</SelectItem>
                <SelectItem value="gltf">GLTF</SelectItem>
                <SelectItem value="obj">OBJ</SelectItem>
                <SelectItem value="fbx">FBX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Alert>
            <Box className="h-4 w-4" />
            <AlertDescription>
              <strong>Where to get direct 3D model URLs:</strong>
              <br />
              • Upload to Google Drive/Dropbox and get direct links
              <br />
              • Use GitHub raw file URLs for .glb/.gltf files
              <br />
              • Self-hosted CDN or web server URLs
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-4">
          <Alert>
            <Upload className="h-4 w-4" />
            <AlertDescription>
              <strong>Upload 3D model files:</strong> {SUPPORTED_3D_FORMATS.join(', ')}
              <br />
              Maximum file size: {Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="model-file">Upload 3D Model File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="model-file"
                type="file"
                accept={SUPPORTED_3D_FORMATS.join(',')}
                onChange={handleFileUpload}
                ref={fileInputRef}
                disabled={disabled || uploadProgress !== null}
                className="flex-grow"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                size="sm" 
                disabled={disabled || uploadProgress !== null}
                className="whitespace-nowrap"
              >
                <Upload className="h-4 w-4 mr-2" />
                Browse
              </Button>
            </div>
            
            {uploadProgress !== null && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Error display */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      <div className="text-xs text-muted-foreground">
        <strong>Tip:</strong> For best performance, use .glb format. Only direct file URLs work - not page links from hosting services.
      </div>
    </div>
  );
};
