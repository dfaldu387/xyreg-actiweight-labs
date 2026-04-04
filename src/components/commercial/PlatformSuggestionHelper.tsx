import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Plus } from "lucide-react";
import { MEDICAL_DEVICE_PLATFORMS, getPlatformsByCategory } from "@/data/medicalDevicePlatforms";

interface PlatformSuggestionHelperProps {
  selectedCategory?: string;
  onSelectPlatform: (platformName: string, description?: string) => void;
  className?: string;
}

export const PlatformSuggestionHelper: React.FC<PlatformSuggestionHelperProps> = ({
  selectedCategory,
  onSelectPlatform,
  className
}) => {
  const suggestedPlatforms = selectedCategory 
    ? getPlatformsByCategory(selectedCategory)
    : MEDICAL_DEVICE_PLATFORMS.slice(0, 5); // Show first 5 if no category selected


  const handlePlatformSelect = (platform: (typeof MEDICAL_DEVICE_PLATFORMS)[number]) => {
    onSelectPlatform(platform.label, platform.description);
  };

  return (
    <Card className={`border-4 border-blue-400 bg-white shadow-xl ${className}`}>
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-100 to-indigo-100 border-b-2 border-blue-300">
        <CardTitle className="flex items-center gap-3 text-base font-bold text-blue-900">
          <Lightbulb className="h-5 w-5 text-amber-600" />
          🏥 Medical Device Platform Suggestions
        </CardTitle>
        <CardDescription className="text-sm font-medium text-blue-800">
          {selectedCategory 
            ? "Platforms commonly used for this device category - click + to select"
            : "Popular medical device platforms - click the + button to use instantly"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestedPlatforms.map((platform) => (
          <div key={platform.value} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-muted/50">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{platform.label}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">{platform.description}</div>
              {platform.examples.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {platform.examples.slice(0, 2).map((example, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs px-1 py-0">
                      {example}
                    </Badge>
                  ))}
                  {platform.examples.length > 2 && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      +{platform.examples.length - 2} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handlePlatformSelect(platform)}
              className="h-8 w-8 p-0 shrink-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        ))}
        
        <div className="pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            <span>Tip: Platforms help group related products for better revenue forecasting</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};