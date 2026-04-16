import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Newspaper, ExternalLink, X, Loader2, Search, RefreshCw } from "lucide-react";
import { useRegulatoryNews } from "@/hooks/useRegulatoryNews";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const REGIONS = ["All", "EU", "US", "UK", "APAC", "LATAM", "Global"];

const categoryColors: Record<string, string> = {
  new_standard: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  guidance: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  regulation_update: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  recall: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  general: "bg-muted text-muted-foreground",
};

const categoryLabels: Record<string, string> = {
  new_standard: "New Standard",
  guidance: "Guidance",
  regulation_update: "Regulation Update",
  recall: "Recall / Alert",
  general: "General",
};

interface RegulatoryNewsWidgetProps {
  companyId?: string;
  onRemove?: () => void;
}

export function RegulatoryNewsWidget({ onRemove }: RegulatoryNewsWidgetProps) {
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: newsItems, isLoading } = useRegulatoryNews(selectedRegion);
  const queryClient = useQueryClient();

  const filteredNews = useMemo(() => {
    if (!newsItems || !searchQuery.trim()) return newsItems;
    const q = searchQuery.toLowerCase();
    return newsItems.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.summary?.toLowerCase().includes(q) ||
        item.source_name?.toLowerCase().includes(q)
    );
  }, [newsItems, searchQuery]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke("fetch-regulatory-news");
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["regulatory-news"] });
      toast.success("Regulatory news refreshed");
    } catch (err: any) {
      console.error("Failed to fetch regulatory news:", err);
      toast.error("Failed to refresh news", {
        description: err?.message || "Please try again later",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Newspaper className="h-4 w-4" />
          Regulatory News
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh regulatory news"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          {onRemove && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Region filter chips */}
        <div className="flex flex-wrap gap-1">
          {REGIONS.map((region) => (
            <Button
              key={region}
              variant={selectedRegion === region ? "default" : "outline"}
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => setSelectedRegion(region)}
            >
              {region}
            </Button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 text-xs pl-8"
          />
        </div>

        {/* News list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !newsItems?.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No regulatory news yet. Click the refresh button to fetch the latest news.
          </p>
        ) : !filteredNews?.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No news matching "{searchQuery}"
          </p>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredNews.map((item) => (
              <div
                key={item.id}
                className="border rounded-md p-2.5 space-y-1 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium leading-tight flex-1">
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline inline-flex items-center gap-1"
                      >
                        {item.title}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    ) : (
                      item.title
                    )}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {item.source_name}
                  </Badge>
                  {item.region && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {item.region}
                    </Badge>
                  )}
                  <span
                    className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${
                      categoryColors[item.category] || categoryColors.general
                    }`}
                  >
                    {categoryLabels[item.category] || item.category}
                  </span>
                  {item.published_at && (
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}
                    </span>
                  )}
                </div>

                {item.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
