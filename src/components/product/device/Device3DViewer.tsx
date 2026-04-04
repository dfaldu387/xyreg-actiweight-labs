
import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Environment, PerspectiveCamera } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Box, RotateCcw, ZoomIn, ZoomOut, Maximize, AlertTriangle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Device3DModel, Device3DViewerProps } from "@/types/device3d";

// Component to load and display GLTF models
function Model({ url }: { url: string }) {
  try {
    const { scene } = useGLTF(url);
    return (
      <Center>
        <primitive object={scene} />
      </Center>
    );
  } catch (error) {
    console.error('Failed to load 3D model:', error);
    throw error;
  }
}

// Error fallback component
function ModelError({ format, error }: { format: string; error?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-medium mb-2">Failed to Load 3D Model</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {error || `Unable to load .${format} format file`}
      </p>
      <div className="text-xs text-muted-foreground">
        <p>Possible issues:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Invalid or broken URL</li>
          <li>File format not supported by browser</li>
          <li>CORS restrictions on the file server</li>
          <li>File is too large or corrupted</li>
        </ul>
      </div>
    </div>
  );
}

// Fallback component for unsupported formats
function UnsupportedModel({ format }: { format: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <Box className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Preview Not Available</h3>
      <p className="text-sm text-muted-foreground">
        .{format} format preview is not fully supported in the browser.
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        For full 3D viewing, convert to .glb or .gltf format.
      </p>
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
    </div>
  );
}

// Loading component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

// Error boundary for 3D model loading
class ModelErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('3D Model Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export const Device3DViewer: React.FC<Device3DViewerProps> = ({
  models,
  selectedModelIndex = 0,
  onModelSelect
}) => {
  const [viewMode, setViewMode] = useState<'solid' | 'wireframe'>('solid');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  if (!models || models.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Box className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium">No 3D Models</h3>
              <p className="text-sm text-muted-foreground">
                Upload 3D models to view them here with interactive controls.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedModel = models[selectedModelIndex];
  const isGLTF = selectedModel?.format === 'glb' || selectedModel?.format === 'gltf';
  const isDataUrl = selectedModel?.url.startsWith('data:');

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const ViewerContent = () => (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-96'}`}>
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <Select value={viewMode} onValueChange={(value: 'solid' | 'wireframe') => setViewMode(value)}>
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Solid</SelectItem>
            <SelectItem value="wireframe">Wireframe</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={toggleFullscreen}>
          <Maximize className="h-4 w-4" />
        </Button>
        {isFullscreen && (
          <Button size="sm" variant="outline" onClick={toggleFullscreen}>
            ✕
          </Button>
        )}
      </div>

      {modelError ? (
        <ModelError format={selectedModel.format} error={modelError} />
      ) : (
        <Canvas className="w-full h-full">
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Environment preset="studio" />
          
          <Suspense fallback={null}>
            <ModelErrorBoundary 
              fallback={<ModelError format={selectedModel.format} />}
            >
              {isGLTF ? (
                <Model url={selectedModel.url} />
              ) : (
                <UnsupportedModel format={selectedModel.format} />
              )}
            </ModelErrorBoundary>
          </Suspense>
          
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={false}
          />
        </Canvas>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Box className="h-5 w-5" />
            3D Model Viewer
          </CardTitle>
          {models.length > 1 && (
            <Select 
              value={selectedModelIndex.toString()} 
              onValueChange={(value) => onModelSelect?.(parseInt(value))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((model, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{selectedModel.name}</Badge>
          <Badge variant={isGLTF ? "default" : "destructive"}>
            .{selectedModel.format}
          </Badge>
          {!isGLTF && (
            <span className="text-xs text-muted-foreground">
              (Limited support - use .glb or .gltf for full features)
            </span>
          )}
          {!isDataUrl && !isGLTF && (
            <Badge variant="outline" className="text-xs">
              External URL
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Suspense fallback={<LoadingSpinner />}>
          <ViewerContent />
        </Suspense>
        <div className="p-4 bg-muted/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>🖱️ Click & drag to rotate</span>
            <span>🔍 Scroll to zoom</span>
            <span>⌨️ Right-click & drag to pan</span>
          </div>
          {!isGLTF && (
            <div className="mt-2 text-orange-600">
              ⚠️ For best experience, use .glb or .gltf format files
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
