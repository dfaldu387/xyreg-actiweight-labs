import { supabase } from "@/integrations/supabase/client";

export interface ImageGenerationRequest {
  prompt: string;
  size?: "1024x1024" | "1024x1536" | "1536x1024";
  quality?: "high" | "medium" | "low";
}

export interface ImageGenerationResponse {
  success: boolean;
  imageData?: string;
  format?: string;
  error?: string;
}

export class ImageGenerationService {
  static async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: request.prompt,
          size: request.size || "1024x1536",
          quality: request.quality || "high"
        }
      });

      if (error) {
        console.error('Error calling generate-image function:', error);
        return {
          success: false,
          error: error.message || 'Failed to generate image'
        };
      }

      return data as ImageGenerationResponse;
    } catch (error: any) {
      console.error('Exception during image generation:', error);
      return {
        success: false,
        error: error.message || 'Unexpected error during image generation'
      };
    }
  }

  static downloadImage(imageData: string, filename: string = 'generated-image.png') {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(imageData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      throw new Error('Failed to download image');
    }
  }
}