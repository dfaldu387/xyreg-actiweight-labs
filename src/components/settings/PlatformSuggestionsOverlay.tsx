import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Plus, Eye, EyeOff } from "lucide-react";
import { MEDICAL_DEVICE_PLATFORMS } from "@/data/medicalDevicePlatforms";

interface PlatformSuggestionsOverlayProps {
  onSelectPlatform: (platformName: string, description?: string) => void;
}

export const PlatformSuggestionsOverlay: React.FC<PlatformSuggestionsOverlayProps> = ({
  onSelectPlatform
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [selectedCount, setSelectedCount] = useState(0);

  const handlePlatformSelect = (platform: (typeof MEDICAL_DEVICE_PLATFORMS)[number]) => {
    console.log('🎯 PLATFORM SELECTED FROM OVERLAY:', platform.label);
    alert(`✅ Selected Platform: ${platform.label}`);
    onSelectPlatform(platform.label, platform.description);
    setSelectedCount(prev => prev + 1);
  };

  if (!isVisible) {
    return (
      <div className="fixed top-4 right-4 z-[9999]">
        <Button 
          onClick={() => setIsVisible(true)}
          className="bg-red-500 hover:bg-red-600 text-white shadow-2xl border-4 border-yellow-400"
          size="lg"
        >
          <Eye className="h-4 w-4 mr-2" />
          SHOW PLATFORM SUGGESTIONS ({MEDICAL_DEVICE_PLATFORMS.length})
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Debug Header */}
      <div className="bg-red-100 border-4 border-red-500 rounded-lg p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-red-900 flex items-center gap-2">
              🚨 PLATFORM SUGGESTIONS DEBUG PANEL 🚨
            </h2>
            <p className="text-red-700 font-medium">
              Available: {MEDICAL_DEVICE_PLATFORMS.length} platforms | Selected: {selectedCount}
            </p>
          </div>
          <Button 
            onClick={() => setIsVisible(false)}
            variant="outline"
            size="sm"
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Hide
          </Button>
        </div>
      </div>

      {/* Massive Visible Platform Grid */}
      <Card className="border-8 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-100 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold">
            <Lightbulb className="h-8 w-8 text-yellow-300" />
            🏥 MEDICAL DEVICE PLATFORMS - CLICK + TO SELECT
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {MEDICAL_DEVICE_PLATFORMS.slice(0, 6).map((platform) => (
              <div 
                key={platform.value} 
                className="flex items-start justify-between gap-4 p-4 rounded-lg bg-white border-2 border-blue-300 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg text-blue-900 mb-2">{platform.label}</div>
                  <div className="text-sm text-blue-700 mb-3 line-clamp-3">{platform.description}</div>
                  {platform.examples.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {platform.examples.slice(0, 3).map((example, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          {example}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  size="lg"
                  onClick={() => handlePlatformSelect(platform)}
                  className="h-12 w-12 p-0 shrink-0 bg-green-500 hover:bg-green-600 text-white border-2 border-green-700 shadow-lg"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="text-center pt-4 border-t-2 border-blue-300">
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 inline-block">
              <div className="flex items-center gap-2 text-yellow-800 font-medium">
                <Lightbulb className="h-5 w-5" />
                <span>💡 Tip: Click any + button to instantly fill the form with that platform!</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};