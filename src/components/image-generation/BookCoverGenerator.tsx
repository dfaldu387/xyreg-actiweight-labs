import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ImageGenerationService, ImageGenerationRequest } from "@/services/imageGenerationService";

const DEFAULT_PROMPT = "A professional book cover for 'THE MEDTECH EXECUTIVE'S COMPASS' by Arnar H. Kristjansson, PhD. The central image is a highly detailed, realistic chrome compass on a desk littered with medical device blueprints and electronic components. The background is a bright, clean, slightly out-of-focus laboratory. The aesthetic is modern and authoritative. Ultra high resolution, 16:9 aspect ratio.";

export const BookCoverGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [size, setSize] = useState<"1024x1024" | "1024x1536" | "1536x1024">("1024x1536");
  const [quality, setQuality] = useState<"high" | "medium" | "low">("high");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const request: ImageGenerationRequest = {
        prompt: prompt.trim(),
        size,
        quality
      };

      const response = await ImageGenerationService.generateImage(request);

      if (response.success && response.imageData) {
        setGeneratedImage(response.imageData);
        toast.success("Book cover generated successfully!");
      } else {
        toast.error(response.error || "Failed to generate image");
      }
    } catch (error: any) {
      console.error("Error generating image:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    try {
      ImageGenerationService.downloadImage(
        generatedImage, 
        "medtech-executives-compass-cover.png"
      );
      toast.success("Image downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  const resetToDefault = () => {
    setPrompt(DEFAULT_PROMPT);
    setSize("1024x1536");
    setQuality("high");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Book Cover Generator
          </CardTitle>
          <CardDescription>
            Generate professional book covers using AI. Optimized for "THE MEDTECH EXECUTIVE'S COMPASS"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Book Cover Description</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the book cover you want to generate..."
              className="min-h-32"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefault}
              className="mt-2"
            >
              Reset to Default Prompt
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Size</label>
              <Select value={size} onValueChange={(value: any) => setSize(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024x1536">Portrait (1024x1536) - Recommended for books</SelectItem>
                  <SelectItem value="1024x1024">Square (1024x1024)</SelectItem>
                  <SelectItem value="1536x1024">Landscape (1536x1024)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quality</label>
              <Select value={quality} onValueChange={(value: any) => setQuality(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Quality</SelectItem>
                  <SelectItem value="medium">Medium Quality</SelectItem>
                  <SelectItem value="low">Low Quality (Faster)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Book Cover...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Generate Book Cover
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Book Cover</CardTitle>
            <CardDescription>
              Your AI-generated book cover is ready for download
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <img
                src={`data:image/png;base64,${generatedImage}`}
                alt="Generated book cover"
                className="max-w-full h-auto max-h-96 rounded-lg shadow-lg border"
              />
            </div>
            <Button
              onClick={handleDownload}
              className="w-full"
              size="lg"
              variant="default"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Book Cover (PNG)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};