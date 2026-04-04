import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  SkipBack, 
  SkipForward, 
  RotateCcw,
  Settings,
  Download,
  ExternalLink
} from "lucide-react";
import { useTranslation } from '@/hooks/useTranslation';

interface VideoPlayerProps {
  src: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: string;
  autoplay?: boolean;
  controls?: boolean;
  className?: string;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
}

export function VideoPlayer({
  src,
  title,
  description,
  thumbnail,
  duration,
  autoplay = false,
  controls = true,
  className = '',
  onComplete,
  onProgress
}: VideoPlayerProps) {
  const { lang } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  const progressPercentage = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      const progress = (video.currentTime / video.duration) * 100;
      onProgress?.(progress);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onComplete?.();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onProgress, onComplete]);

  useEffect(() => {
    if (autoplay && videoRef.current && !hasStarted) {
      videoRef.current.play().catch(console.error);
      setHasStarted(true);
    }
  }, [autoplay, hasStarted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(console.error);
      setHasStarted(true);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    setVolume(newVolume);
    video.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const handleSeek = (percentage: number) => {
    const video = videoRef.current;
    if (!video || videoDuration === 0) return;

    const newTime = (percentage / 100) * videoDuration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(videoDuration, video.currentTime + seconds));
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const toggleFullscreen = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (!isFullscreen) {
        if (video.requestFullscreen) {
          await video.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const restartVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    setCurrentTime(0);
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="relative group">
        <video
          ref={videoRef}
          className="w-full aspect-video object-cover bg-black"
          src={src}
          poster={thumbnail}
          playsInline
          preload="metadata"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(controls)}
        >
          {lang('videoPlayer.browserNotSupported')}
        </video>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm">{lang('videoPlayer.loading')}</p>
            </div>
          </div>
        )}

        {/* Play Overlay for Initial State */}
        {!hasStarted && !isLoading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Button
              size="lg"
              onClick={togglePlay}
              className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
            >
              <Play className="h-8 w-8 ml-1" />
            </Button>
          </div>
        )}

        {/* Video Controls */}
        {controls && showControls && hasStarted && !isLoading && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-3">
              <div 
                className="w-full h-2 bg-white/20 rounded-full cursor-pointer group/progress"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percentage = ((e.clientX - rect.left) / rect.width) * 100;
                  handleSeek(percentage);
                }}
              >
                <div 
                  className="h-full bg-white rounded-full transition-all group-hover/progress:bg-primary"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                {/* Play/Pause */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>

                {/* Skip Back */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skip(-10)}
                  className="text-white hover:bg-white/20"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                {/* Skip Forward */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => skip(10)}
                  className="text-white hover:bg-white/20"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                {/* Restart */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={restartVideo}
                  className="text-white hover:bg-white/20"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                {/* Volume */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Time Display */}
                <span className="text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(videoDuration)}
                </span>

                {/* Playback Speed */}
                <select
                  value={playbackRate}
                  onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                  className="bg-white/20 text-white text-xs rounded px-2 py-1 border-none focus:outline-none"
                >
                  <option value={0.25}>0.25x</option>
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>

                {/* Fullscreen */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Information */}
      {(title || description) && (
        <CardContent className="p-4">
          <div className="space-y-2">
            {title && (
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
                {duration && (
                  <Badge variant="secondary" className="ml-2">
                    {duration}
                  </Badge>
                )}
              </div>
            )}
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {description}
              </p>
            )}
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <Button variant="outline" size="sm">
                <Download className="h-3 w-3 mr-1" />
                {lang('videoPlayer.download')}
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3 w-3 mr-1" />
                {lang('videoPlayer.openNewTab')}
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Predefined video players for common tutorial types
export const TutorialVideos = {
  GettingStarted: (props: VideoPlayerProps) => (
    <VideoPlayer
      title="Getting Started with XYREG"
      description="Complete walkthrough of the XYREG platform for new users"
      duration="12:30"
      src="/tutorials/getting-started.mp4"
      {...props}
    />
  ),

  ProductCreation: (props: VideoPlayerProps) => (
    <VideoPlayer
      title="Creating Your First Product"
      description="Step-by-step guide to setting up a new medical device product"
      duration="8:45"
      src="/tutorials/product-creation.mp4"
      {...props}
    />
  ),

  DocumentManagement: (props: VideoPlayerProps) => (
    <VideoPlayer
      title="Document Control System"
      description="Learn how to manage regulatory documents and templates effectively"
      duration="15:20"
      src="/tutorials/document-management.mp4"
      {...props}
    />
  ),

  GapAnalysis: (props: VideoPlayerProps) => (
    <VideoPlayer
      title="Running Gap Analysis"
      description="Comprehensive guide to conducting regulatory compliance assessments"
      duration="11:10"
      src="/tutorials/gap-analysis.mp4"
      {...props}
    />
  ),

  Classification: (props: VideoPlayerProps) => (
    <VideoPlayer
      title="Device Classification Tools"
      description="Using classification wizards for SaMD, IVDR, and EU MDR"
      duration="9:35"
      src="/tutorials/classification.mp4"
      {...props}
    />
  )
};