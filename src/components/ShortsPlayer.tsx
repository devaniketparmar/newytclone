import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

interface ShortsPlayerProps {
  video: {
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
    channel: {
      id: string;
      name: string;
      avatarUrl: string;
      subscriberCount: number;
      verified: boolean;
    };
    hashtags?: string[];
  };
  user?: any;
  onNext?: () => void;
  onPrevious?: () => void;
  autoPlay?: boolean;
  showControls?: boolean;
}

export default function ShortsPlayer({
  video,
  user,
  onNext,
  onPrevious,
  autoPlay = true,
  showControls = false
}: ShortsPlayerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [doubleTapLike, setDoubleTapLike] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format numbers for display
  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Handle video loading
  const handleVideoLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, [autoPlay]);

  const handleVideoError = useCallback(() => {
    setIsLoading(false);
    setError('Failed to load video');
  }, []);

  // Handle play/pause
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
    }
  }, [isPlaying]);

  // Handle double tap for like
  const handleDoubleTap = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsLiked(true);
    setDoubleTapLike(true);
    setTimeout(() => setDoubleTapLike(false), 1000);
  }, []);

  // Handle swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startY = touch.clientY;
    const startTime = Date.now();

    const handleTouchEnd = (e: React.TouchEvent) => {
      const touch = e.changedTouches[0];
      const endY = touch.clientY;
      const endTime = Date.now();
      const deltaY = startY - endY;
      const deltaTime = endTime - startTime;

      // Swipe up for next video
      if (deltaY > 50 && deltaTime < 300) {
        onNext?.();
      }
      // Swipe down for previous video
      else if (deltaY < -50 && deltaTime < 300) {
        onPrevious?.();
      }

      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchend', handleTouchEnd);
  }, [onNext, onPrevious]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowUp':
          e.preventDefault();
          onNext?.();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onPrevious?.();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setIsMuted(!isMuted);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayPause, onNext, onPrevious, isMuted]);

  // Handle video progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onNext?.();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onNext]);

  // Handle volume changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-black flex items-center justify-center overflow-hidden"
      onTouchStart={handleTouchStart}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src={video.videoUrl}
        poster={video.thumbnailUrl}
        onLoadedData={handleVideoLoad}
        onError={handleVideoError}
        onDoubleClick={handleDoubleTap}
        loop={false}
        playsInline
        preload="metadata"
      />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white text-sm">Loading...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center">
            <svg className="w-12 h-12 text-white mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-white text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
        <div 
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Double Tap Like Animation */}
      {doubleTapLike && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="animate-ping">
            <svg className="w-20 h-20 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        </div>
      )}

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-6">
        {/* Channel Avatar */}
        <div className="flex flex-col items-center">
          <div 
            className="w-12 h-12 rounded-full overflow-hidden border-2 border-white cursor-pointer hover:scale-110 transition-transform"
            onClick={() => router.push(`/channel/${video.channel.id}`)}
          >
            <img
              src={video.channel.avatarUrl || '/api/placeholder/48/48'}
              alt={video.channel.name}
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={() => setIsSubscribed(!isSubscribed)}
            className={`mt-2 px-4 py-1 rounded-full text-sm font-medium transition-colors ${
              isSubscribed 
                ? 'bg-white text-black' 
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>

        {/* Like Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isLiked ? 'bg-red-500' : 'bg-black/50'
            }`}
          >
            <svg 
              className={`w-6 h-6 ${isLiked ? 'text-white' : 'text-white'}`} 
              fill={isLiked ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <span className="text-white text-xs mt-1">{formatCount(video.likeCount)}</span>
        </div>

        {/* Comment Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => router.push(`/video/${video.id}`)}
            className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <span className="text-white text-xs mt-1">{formatCount(video.commentCount)}</span>
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center">
          <button className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
          <span className="text-white text-xs mt-1">Share</span>
        </div>

        {/* More Options */}
        <button className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-20 left-4 right-20 text-white">
        {/* Channel Info */}
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-semibold text-sm">@{video.channel.name}</span>
          {video.channel.verified && (
            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          )}
        </div>

        {/* Video Title */}
        <h3 className="font-semibold text-sm mb-2 line-clamp-2">{video.title}</h3>

        {/* Description */}
        <div className="text-xs text-gray-300">
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="hover:text-white transition-colors"
          >
            {showDescription ? 'Show less' : 'Show more'}
          </button>
          {showDescription && (
            <div className="mt-2 space-y-1">
              <p className="line-clamp-3">{video.description}</p>
              {video.hashtags && video.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {video.hashtags.map((tag, index) => (
                    <span key={index} className="text-blue-400 hover:text-blue-300">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Play/Pause Overlay */}
      {showControls && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
          onClick={togglePlayPause}
        >
          <div className={`w-16 h-16 rounded-full bg-black/50 flex items-center justify-center transition-opacity ${
            isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
          }`}>
            {isPlaying ? (
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Volume Control */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          {isMuted ? (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 2.663 12 3.109 12 4v16c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 2.663 12 3.109 12 4v16c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      </div>

      {/* Navigation Hints */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 text-xs">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span>Next</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>Previous</span>
          </div>
        </div>
      </div>
    </div>
  );
}
