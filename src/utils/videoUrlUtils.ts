
export interface VideoUrlInfo {
  type: 'youtube' | 'vimeo' | 'direct';
  embedUrl?: string;
  originalUrl: string;
  videoId?: string;
}

export function detectVideoUrlType(url: string): VideoUrlInfo {
  const trimmedUrl = url.trim();
  
  // YouTube detection
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const youtubeMatch = trimmedUrl.match(youtubeRegex);
  
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      originalUrl: trimmedUrl,
      videoId
    };
  }
  
  // Vimeo detection
  const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
  const vimeoMatch = trimmedUrl.match(vimeoRegex);
  
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
      originalUrl: trimmedUrl,
      videoId
    };
  }
  
  // Direct video file
  return {
    type: 'direct',
    originalUrl: trimmedUrl
  };
}

export function isStreamingServiceUrl(url: string): boolean {
  const info = detectVideoUrlType(url);
  return info.type === 'youtube' || info.type === 'vimeo';
}

export function getEmbedUrl(url: string): string | null {
  const info = detectVideoUrlType(url);
  return info.embedUrl || null;
}
