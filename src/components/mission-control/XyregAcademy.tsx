import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Lightbulb, Newspaper, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface AcademyContent {
  id: string;
  type: "tip" | "news" | "feature";
  titleKey: string;
  contentKey: string;
  categoryKey?: string;
  isNew?: boolean;
  url?: string;
}

const academyContent: AcademyContent[] = [
  {
    id: "1",
    type: "tip",
    titleKey: "quickStatusUpdates.title",
    contentKey: "quickStatusUpdates.content",
    categoryKey: "categories.productivity"
  },
  {
    id: "2",
    type: "news",
    titleKey: "fdaUpdates.title",
    contentKey: "fdaUpdates.content",
    categoryKey: "categories.regulatory"
  },
  {
    id: "3",
    type: "feature",
    titleKey: "documentComparison.title",
    contentKey: "documentComparison.content",
    categoryKey: "categories.newFeature",
    isNew: true
  },
  {
    id: "4",
    type: "tip",
    titleKey: "keyboardShortcuts.title",
    contentKey: "keyboardShortcuts.content",
    categoryKey: "categories.productivity"
  },
  {
    id: "5",
    type: "news",
    titleKey: "euMdrUpdates.title",
    contentKey: "euMdrUpdates.content",
    categoryKey: "categories.regulatory"
  },
  {
    id: "6",
    type: "feature",
    titleKey: "advancedSearch.title",
    contentKey: "advancedSearch.content",
    categoryKey: "categories.enhancement",
    isNew: true
  }
];

export function XyregAcademy() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentContent, setCurrentContent] = useState(academyContent[0]);
  const { lang } = useTranslation();

  // Auto-rotate content every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % academyContent.length);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentContent(academyContent[currentIndex]);
  }, [currentIndex]);

  const nextContent = () => {
    setCurrentIndex((prev) => (prev + 1) % academyContent.length);
  };

  const prevContent = () => {
    setCurrentIndex((prev) => (prev - 1 + academyContent.length) % academyContent.length);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tip": return <Lightbulb className="h-4 w-4" />;
      case "news": return <Newspaper className="h-4 w-4" />;
      case "feature": return <Sparkles className="h-4 w-4" />;
      default: return <GraduationCap className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "tip": return "bg-warning text-warning-foreground";
      case "news": return "bg-primary text-primary-foreground";
      case "feature": return "bg-success text-success-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "tip": return lang('missionControl.tipOfTheDay');
      case "news": return lang('missionControl.regulatoryNews');
      case "feature": return lang('missionControl.featureSpotlight');
      default: return lang('missionControl.academy');
    }
  };

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          {lang('missionControl.xyregAcademy')}
        </CardTitle>
        <CardDescription>
          {lang('missionControl.tipsNewsFeatures')}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4 min-h-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Badge className={`${getTypeColor(currentContent.type)} flex items-center gap-1.5 shrink-0`}>
            <span className="shrink-0">{getTypeIcon(currentContent.type)}</span>
            <span className="whitespace-nowrap">{getTypeLabel(currentContent.type)}</span>
          </Badge>
          
          {currentContent.isNew && (
            <Badge variant="outline" className="text-xs shrink-0">
              {lang('missionControl.new')}
            </Badge>
          )}
        </div>

        <div className="flex-1 space-y-3 overflow-hidden">
          <h3 className="font-semibold text-lg leading-tight">{lang(`xyregAcademy.${currentContent.titleKey}`)}</h3>
          <div className="overflow-y-auto flex-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lang(`xyregAcademy.${currentContent.contentKey}`)}
            </p>
          </div>

          {currentContent.categoryKey && (
            <Badge variant="outline" className="text-xs shrink-0">
              {lang(`xyregAcademy.${currentContent.categoryKey}`)}
            </Badge>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t mt-auto flex-shrink-0 gap-2">
          <Button variant="ghost" size="sm" onClick={prevContent} className="shrink-0">
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{lang('missionControl.previous')}</span>
          </Button>

          <div className="flex gap-1 shrink-0">
            {academyContent.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors shrink-0 ${
                  index === currentIndex
                    ? "bg-primary"
                    : "bg-muted hover:bg-muted-foreground/50"
                }`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <Button variant="ghost" size="sm" onClick={nextContent} className="shrink-0">
            <span className="hidden sm:inline">{lang('missionControl.next')}</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}