import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Eye, Settings } from "lucide-react";
import { Device3DViewer } from "@/components/product/device/Device3DViewer";
import { Device3DModelUpload } from "@/components/product/device/Device3DModelUpload";
import { Device3DModel } from "@/types/device3d";

interface DeviceVisualizationTabProps {
  productId: string;
}

export function DeviceVisualizationTab({ productId }: DeviceVisualizationTabProps) {
  const [models, setModels] = useState<Device3DModel[]>([
    // Mock data for demonstration - in real app this would come from the database
  ]);
  const [selectedModelIndex, setSelectedModelIndex] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleModelsChange = (newModels: Device3DModel[]) => {
    setModels(newModels);
    // Here you would typically save to the database
    console.log("Models updated:", newModels);
  };

  const handleUpload = async () => {
    setIsUploading(true);
    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="viewer" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="viewer">3D Viewer</TabsTrigger>
          <TabsTrigger value="models">Model Management</TabsTrigger>
          <TabsTrigger value="technical">Technical Drawings</TabsTrigger>
        </TabsList>

        <TabsContent value="viewer" className="space-y-6">
          {models.length > 0 ? (
            <Device3DViewer
              models={models}
              selectedModelIndex={selectedModelIndex}
              onModelSelect={setSelectedModelIndex}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  3D Model Viewer
                </CardTitle>
                <CardDescription>
                  View and interact with 3D models of your device
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No 3D Models Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload 3D models to visualize your device in the Model Management tab
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Switch to models tab
                      const modelsTab = document.querySelector('[value="models"]') as HTMLElement;
                      modelsTab?.click();
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Models
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                3D Model Management
              </CardTitle>
              <CardDescription>
                Upload and manage 3D models for your device visualization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Device3DModelUpload
                models={models}
                onModelsChange={handleModelsChange}
                disabled={isUploading}
              />
              
              {models.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-medium">Uploaded Models</h4>
                  <div className="space-y-2">
                    {models.map((model, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{model.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Format: <Badge variant="outline">{model.format.toUpperCase()}</Badge>
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedModelIndex(index)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Technical Drawings & Documentation</CardTitle>
              <CardDescription>
                Upload and manage technical drawings, schematics, and visual documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Technical Drawings</h3>
                <p className="text-muted-foreground mb-4">
                  Upload technical drawings, assembly diagrams, and documentation images
                </p>
                <Button variant="outline" disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Drawings (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}