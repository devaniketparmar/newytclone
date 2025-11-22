import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';

interface ShortVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  videoUrl: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  publishedAt: string;
  status: 'PROCESSING' | 'READY' | 'FAILED';
  channel: {
    id: string;
    name: string;
    avatarUrl: string;
    subscriberCount: number;
    userId: string;
  };
  hashtags: string[];
  isShort: boolean;
  aspectRatio: string;
  category: string;
  engagement: number;
  trendingScore: number;
}

interface MobileShortsPlayerProps {
  videos: ShortVideo[];
  initialIndex?: number;
  onVideoChange?: (video: ShortVideo, index: number) => void;
  onLike?: (videoId: string) => void;
  onComment?: (videoId: string) => void;
  onShare?: (videoId: string) => void;
  onSubscribe?: (channelId: string) => void;
}

export default function MobileShortsPlayer({
  videos,
  initialIndex = 0,
  onVideoChange,
  onLike,
  onComment,
  onShare,
  onSubscribe
}: MobileShortsPlayerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [doubleTapTimeout, setDoubleTapTimeout] = useState<NodeJS.Timeout | null>(null);
  const [tapCount, setTapCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentVideo = videos[currentIndex];

  useEffect(() => {
    if (currentVideo && onVideoChange) {
      onVideoChange(currentVideo, currentIndex);
    }
  }, [currentIndex, currentVideo, onVideoChange]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleMuteToggle = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleLike = useCallback(() => {
    if (onLike && currentVideo) {
      onLike(currentVideo.id);
      setIsLiked(!isLiked);
    }
  }, [onLike, currentVideo, isLiked]);

  const handleComment = useCallback(() => {
    if (onComment && currentVideo) {
      onComment(currentVideo.id);
    }
  }, [onComment, currentVideo]);

  const handleShare = useCallback(() => {
    if (onShare && currentVideo) {
      onShare(currentVideo.id);
    }
  }, [onShare, currentVideo]);

  const handleSubscribe = useCallback(() => {
    if (onSubscribe && currentVideo) {
      onSubscribe(currentVideo.channel.id);
      setIsSubscribed(!isSubscribed);
    }
  }, [onSubscribe, currentVideo, isSubscribed]);

  const handleChannelClick = useCallback(() => {
    if (currentVideo) {
      router.push(`/channel/${currentVideo.channel.id}`);
    }
  }, [currentVideo, router]);

  const nextVideo = useCallback(() => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    }
  }, [currentIndex, videos.length]);

  const previousVideo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
    }
  }, [currentIndex]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchStartX(e.touches[0].clientX);
    setIsScrolling(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touchY = e.touches[0].clientY;
    const touchX = e.touches[0].clientX;
    const deltaY = touchY - touchStartY;
    const deltaX = touchX - touchStartX;

    // Detect if it's a vertical swipe
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
      setIsScrolling(true);
    }
  }, [touchStartY, touchStartX]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchY = e.changedTouches[0].clientY;
    const touchX = e.changedTouches[0].clientX;
    const deltaY = touchY - touchStartY;
    const deltaX = touchX - touchStartX;

    if (!isScrolling) {
      // Handle tap/double tap
      setTapCount(prev => prev + 1);
      
      if (doubleTapTimeout) {
        clearTimeout(doubleTapTimeout);
      }
      
      const timeout = setTimeout(() => {
        if (tapCount === 0) {
          // Single tap - toggle play/pause
          handlePlayPause();
        } else if (tapCount === 1) {
          // Double tap - like video
          handleLike();
        }
        setTapCount(0);
      }, 300);
      
      setDoubleTapTimeout(timeout);
    } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 100) {
      // Vertical swipe - navigate videos
      if (deltaY > 0) {
        previousVideo();
      } else {
        nextVideo();
      }
    }

    setIsScrolling(false);
  }, [touchStartY, touchStartX, isScrolling, handlePlayPause, nextVideo, previousVideo, handleLike, tapCount, doubleTapTimeout]);

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!currentVideo) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-neutral-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 16h14l-2-16M9 8v8M15 8v8" />
            </svg>
          </div>
          <p className="text-lg font-medium">No videos available</p>
          <p className="text-neutral-400">Check back later for new shorts!</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative h-screen w-full bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Video Player */}
      <div className="relative h-full w-full flex items-center justify-center">
        <video
          ref={videoRef}
          src={currentVideo.videoUrl}
          className="h-full w-full object-cover"
          autoPlay
          muted={isMuted}
          loop
          playsInline
          onLoadedData={() => {
            if (videoRef.current) {
              videoRef.current.play();
            }
          }}
          onEnded={nextVideo}
        />
        
        {/* Video Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        
        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={handlePlayPause}
              className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
        )}

        {/* Double Tap Like Animation */}
        {tapCount === 1 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center animate-ping">
              <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMuteToggle}
            className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMuted ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 7.663 12 8.109 12 9v6c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 7.663 12 8.109 12 9v6c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              )}
            </svg>
          </button>
          
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom Info Panel */}
      {showInfo && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 z-10">
          {/* Video Info */}
          <div className="mb-4">
            <h2 className="text-white text-lg font-semibold mb-2 line-clamp-2">
              {currentVideo.title}
            </h2>
            <div className="flex items-center space-x-4 text-white/80 text-sm">
              <span>{formatCount(currentVideo.viewCount)} views</span>
              <span>•</span>
              <span>{formatDuration(currentVideo.duration)}</span>
              <span>•</span>
              <span>{new Date(currentVideo.publishedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Channel Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <img
                src={currentVideo.channel.avatarUrl || '/api/placeholder/40/40'}
                alt={currentVideo.channel.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h3 className="text-white font-medium">{currentVideo.channel.name}</h3>
                <p className="text-white/60 text-sm">{formatCount(currentVideo.channel.subscriberCount)} subscribers</p>
              </div>
            </div>
            <button
              onClick={handleSubscribe}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                isSubscribed
                  ? 'bg-white/20 text-white'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>

          {/* Description */}
          <div className="mb-4">
            <p className="text-white/80 text-sm line-clamp-3">
              {currentVideo.description}
            </p>
          </div>
        </div>
      )}

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-4 z-10">
        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isLiked ? 'bg-red-600' : 'bg-white/20 backdrop-blur-sm'
          }`}
        >
          <svg className={`w-6 h-6 ${isLiked ? 'text-white' : 'text-white'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
        <span className="text-white text-xs">{formatCount(currentVideo.likeCount)}</span>

        {/* Comment Button */}
        <button
          onClick={handleComment}
          className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
        <span className="text-white text-xs">{formatCount(currentVideo.commentCount)}</span>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        </button>

        {/* More Options */}
        <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Navigation Indicators */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-1 z-10">
        {videos.map((_, index) => (
          <div
            key={index}
            className={`w-1 h-8 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Touch Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center z-10">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
          <p className="text-white text-xs">
            Tap to play/pause • Double tap to like • Swipe up/down to navigate
          </p>
        </div>
      </div>
    </div>
  );
}

