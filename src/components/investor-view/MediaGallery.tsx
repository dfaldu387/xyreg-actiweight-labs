import { useState, useCallback, useEffect, useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Play, Pause } from "lucide-react";
import type { MediaItem } from "@/types/investorView";

interface MediaGalleryProps {
  mediaItems: MediaItem[];
}

export function MediaGallery({ mediaItems }: MediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  const onSelect = useCallback(() => {
    if (!api) return;
    const newIndex = api.selectedScrollSnap();
    setCurrentIndex(newIndex);
    // Pause any playing video when sliding away
    if (playingVideo !== null && playingVideo !== newIndex) {
      const video = videoRefs.current.get(playingVideo);
      if (video) {
        video.pause();
      }
      setPlayingVideo(null);
    }
  }, [api, playingVideo]);

  useEffect(() => {
    if (!api) return;
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  const handleVideoToggle = (index: number) => {
    const video = videoRefs.current.get(index);
    if (!video) return;

    if (playingVideo === index) {
      video.pause();
      setPlayingVideo(null);
    } else {
      video.play();
      setPlayingVideo(index);
    }
  };

  const setVideoRef = (index: number, el: HTMLVideoElement | null) => {
    if (el) {
      videoRefs.current.set(index, el);
    } else {
      videoRefs.current.delete(index);
    }
  };

  return (
    <div className="relative">
      <Carousel className="w-full" opts={{ loop: true }} setApi={setApi}>
        <CarouselContent>
          {mediaItems.map((item, index) => (
            <CarouselItem key={index}>
              <div className="relative aspect-video bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden">
                {item.type === 'image' && (
                  <img
                    src={item.url}
                    alt={item.label}
                    className="w-full h-full object-cover"
                  />
                )}
                {item.type === 'video' && (
                  <div 
                    className="relative w-full h-full group cursor-pointer"
                    onClick={() => handleVideoToggle(index)}
                  >
                    <video
                      ref={(el) => setVideoRef(index, el)}
                      src={item.url}
                      poster={item.thumbnailUrl}
                      className="w-full h-full object-cover"
                      playsInline
                      onEnded={() => setPlayingVideo(null)}
                    />
                    {/* Play/Pause overlay */}
                    <div 
                      className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                        playingVideo === index 
                          ? 'opacity-0 hover:opacity-100 bg-black/20' 
                          : 'bg-black/30 hover:bg-black/40'
                      }`}
                    >
                      <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center">
                        {playingVideo === index ? (
                          <Pause className="h-10 w-10 text-indigo-600" />
                        ) : (
                          <Play className="h-10 w-10 text-indigo-600 ml-1" />
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {item.type === '3d' && (
                  <img
                    src={item.url}
                    alt={item.label}
                    className="w-full h-full object-contain p-4"
                  />
                )}
              </div>
              <p className="mt-3 text-sm text-muted-foreground text-center">
                {item.label}
              </p>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>

      {/* Dots indicator */}
      {mediaItems.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {mediaItems.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-8 bg-indigo-600"
                  : "w-2 bg-slate-300 dark:bg-slate-600"
              }`}
              onClick={() => api?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
