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

interface YouTubeShortsPlayerProps {
  videos: ShortVideo[];
  initialIndex?: number;
  onVideoChange?: (video: ShortVideo, index: number) => void;
  onLike?: (videoId: string) => void;
  onComment?: (videoId: string) => void;
  onShare?: (videoId: string) => void;
  onSubscribe?: (channelId: string) => void;
  onLoadMore?: () => void;
  autoPlay?: boolean;
  showControls?: boolean;
  enableKeyboard?: boolean;
}

export default function YouTubeShortsPlayer({
  videos,
  initialIndex = 0,
  onVideoChange,
  onLike,
  onComment,
  onShare,
  onSubscribe,
  onLoadMore,
  autoPlay = true,
  showControls: defaultShowControls = true,
  enableKeyboard = true
}: YouTubeShortsPlayerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [showControls, setShowControls] = useState(defaultShowControls);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const currentVideo = videos[currentIndex];

  useEffect(() => {
    if (currentVideo && onVideoChange) {
      onVideoChange(currentVideo, currentIndex);
    }
  }, [currentIndex, currentVideo, onVideoChange]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [volume, isMuted, playbackSpeed]);

  useEffect(() => {
    if (videoRef.current && autoPlay) {
      videoRef.current.play().catch(console.error);
    }
  }, [currentIndex, autoPlay]);

  useEffect(() => {
    const handleTimeUpdate = () => {
      if (videoRef.current) {
        const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        setProgress(progress);
        setCurrentTime(videoRef.current.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        setDuration(videoRef.current.duration);
      }
    };

    if (videoRef.current) {
      videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        }
      };
    }
  }, [currentIndex]);

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

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
    }
  }, []);

  const handleLike = useCallback(() => {
    if (onLike && currentVideo) {
      onLike(currentVideo.id);
      setIsLiked(!isLiked);
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 1000);
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
    setShowShareMenu(!showShareMenu);
  }, [onShare, currentVideo, showShareMenu]);

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

  const handleVideoClick = useCallback(() => {
    if (currentVideo) {
      router.push(`/video/${currentVideo.id}`);
    }
  }, [currentVideo, router]);

  const nextVideo = useCallback(() => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
      setProgress(0);
      setCurrentTime(0);
    } else if (onLoadMore) {
      setIsLoading(true);
      onLoadMore();
      setTimeout(() => setIsLoading(false), 1000);
    }
  }, [currentIndex, videos.length, onLoadMore]);

  const previousVideo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
      setProgress(0);
      setCurrentTime(0);
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
      // Single tap - toggle play/pause
      handlePlayPause();
    } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 100) {
      // Vertical swipe - navigate videos
      if (deltaY > 0) {
        previousVideo();
      } else {
        nextVideo();
      }
    }

    setIsScrolling(false);
  }, [touchStartY, touchStartX, isScrolling, handlePlayPause, nextVideo, previousVideo]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enableKeyboard) return;
    
    switch (e.key) {
      case ' ':
        e.preventDefault();
        handlePlayPause();
        break;
      case 'ArrowUp':
        e.preventDefault();
        previousVideo();
        break;
      case 'ArrowDown':
        e.preventDefault();
        nextVideo();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
        }
        break;
      case 'm':
        e.preventDefault();
        handleMuteToggle();
        break;
      case 'l':
        e.preventDefault();
        handleLike();
        break;
      case 'c':
        e.preventDefault();
        handleComment();
        break;
      case 's':
        e.preventDefault();
        handleShare();
        break;
      case 'f':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'Escape':
        e.preventDefault();
        if (isFullscreen) {
          exitFullscreen();
        }
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        e.preventDefault();
        const speeds = [0.5, 0.75, 1, 1.25, 1.5];
        setPlaybackSpeed(speeds[parseInt(e.key) - 1]);
        break;
    }
  }, [enableKeyboard, handlePlayPause, previousVideo, nextVideo, handleMuteToggle, handleLike, handleComment, handleShare, isFullscreen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [handleKeyDown]);

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
      onMouseMove={handleMouseMove}
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
        
        {/* Double Tap Like Animation */}
        {showLikeAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center animate-ping">
              <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
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
      </div>

      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-auto">
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
              
              <div className="w-20">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <span className="text-white text-xs font-medium">{playbackSpeed}x</span>
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
            {/* Video Info */}
            <div className="mb-4">
              <h2 className="text-white text-lg font-semibold mb-2 line-clamp-2">
                {currentVideo.title}
              </h2>
              <div className="flex items-center space-x-4 text-white/80 text-sm">
                <span>{formatCount(currentVideo.viewCount)} views</span>
                <span>•</span>
                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
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

          {/* Right Side Actions */}
          <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-4 pointer-events-auto">
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
              onClick={() => setShowComments(!showComments)}
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
            <button 
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>

          {/* Speed Menu */}
          {showSpeedMenu && (
            <div className="absolute top-16 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-2 z-20">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => {
                    setPlaybackSpeed(speed);
                    setShowSpeedMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-sm rounded transition-colors ${
                    playbackSpeed === speed ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          )}
          
          {/* Share Menu */}
          {showShareMenu && (
            <div className="absolute bottom-20 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 z-20">
              <div className="flex flex-col space-y-2">
                <button className="flex items-center space-x-2 text-white text-sm hover:text-white/70 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                  <span>Twitter</span>
                </button>
                <button className="flex items-center space-x-2 text-white text-sm hover:text-white/70 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                  <span>Facebook</span>
                </button>
                <button className="flex items-center space-x-2 text-white text-sm hover:text-white/70 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                  <span>Pinterest</span>
                </button>
                <button className="flex items-center space-x-2 text-white text-sm hover:text-white/70 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>Instagram</span>
                </button>
                <button className="flex items-center space-x-2 text-white text-sm hover:text-white/70 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span>Copy Link</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
              <div className="bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2 text-white text-sm">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading more...</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Keyboard Shortcuts Help */}
          {enableKeyboard && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 z-20">
              <p className="text-white text-xs text-center">
                Space: Play/Pause • ↑↓: Navigate • ←→: Seek • M: Mute • L: Like • C: Comment • S: Share • F: Fullscreen • 1-5: Speed
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

