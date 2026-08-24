// frontend/src/components/VideoPlayer.tsx
// YouTube, Facebook, TikTok, direct video URL সব support করে

interface VideoPlayerProps {
  url: string;
  className?: string;
}

function getEmbedUrl(url: string): { type: 'youtube' | 'facebook' | 'tiktok' | 'direct'; embedUrl: string } {
  // YouTube — watch?v=, youtu.be/, shorts/
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&rel=0`,
    };
  }

  // Facebook video
  if (url.includes('facebook.com') || url.includes('fb.watch')) {
    const encoded = encodeURIComponent(url);
    return {
      type: 'facebook',
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&autoplay=true&mute=false`,
    };
  }

  // TikTok
  const tiktokMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (tiktokMatch) {
    return {
      type: 'tiktok',
      embedUrl: `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`,
    };
  }

  // Direct video URL (.mp4, .webm, .ogg)
  return { type: 'direct', embedUrl: url };
}

export function VideoPlayer({ url, className = '' }: VideoPlayerProps) {
  const { type, embedUrl } = getEmbedUrl(url);

  if (type === 'direct') {
    return (
      <video
        src={embedUrl}
        controls
        autoPlay
        className={`w-full h-full object-contain bg-black ${className}`}
        playsInline
      />
    );
  }

  // Facebook এ allow এর জন্য বড় size দরকার
  const isFacebook = type === 'facebook';

  return (
    <iframe
      src={embedUrl}
      className={`w-full h-full ${className}`}
      allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
      allowFullScreen
      frameBorder="0"
      scrolling={isFacebook ? 'no' : undefined}
      style={isFacebook ? { border: 'none', overflow: 'hidden' } : undefined}
    />
  );
}
