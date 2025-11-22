import React, { useState, useEffect, useRef, useCallback } from 'react';
import ShortsPlayer from './ShortsPlayer';
import LoadingPlaceholder from './LoadingPlaceholder';

interface ShortsVideo {
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
}

interface ShortsFeedProps {
  user?: any;
  initialVideos?: ShortsVideo[];
  onVideoChange?: (video: ShortsVideo) => void;
  autoPlay?: boolean;
  showControls?: boolean;
}

export default function ShortsFeed({
  user,
  initialVideos = [],
  onVideoChange,
  autoPlay = true,
  showControls = false
}: ShortsFeedProps) {
  const [videos, setVideos] = useState<ShortsVideo[]>(initialVideos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Fetch more videos
  const fetchMoreVideos = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shorts?page=${Math.floor(videos.length / 10) + 1}&limit=10`);
      const data = await response.json();

      if (data.success) {
        const newVideos = data.data;
        if (newVideos.length === 0) {
          setHasMore(false);
        } else {
          setVideos(prev => [...prev, ...newVideos]);
        }
      } else {
        setError(data.error || 'Failed to load videos');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, videos.length]);

  // Handle next video
  const handleNext = useCallback(() => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (hasMore) {
      fetchMoreVideos();
    }
  }, [currentIndex, videos.length, hasMore, fetchMoreVideos]);

  // Handle previous video
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Handle video change
  useEffect(() => {
    if (videos[currentIndex] && onVideoChange) {
      onVideoChange(videos[currentIndex]);
    }
  }, [currentIndex, videos, onVideoChange]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          fetchMoreVideos();
        }
      },
      { threshold: 0.1 }
    );

    const lastVideo = containerRef.current.querySelector('.shorts-video:last-child');
    if (lastVideo) {
      observerRef.current.observe(lastVideo);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [videos.length, hasMore, loading, fetchMoreVideos]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handlePrevious();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleNext, handlePrevious]);

  // Load initial videos if none provided
  useEffect(() => {
    if (videos.length === 0) {
      fetchMoreVideos();
    }
  }, []);

  if (videos.length === 0 && loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <LoadingPlaceholder />
      </div>
    );
  }

  if (videos.length === 0 && error) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold mb-2">Failed to load Shorts</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchMoreVideos();
            }}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-screen bg-black overflow-hidden">
      {/* Current Video */}
      {videos[currentIndex] && (
        <div className="shorts-video w-full h-full">
          <ShortsPlayer
            video={videos[currentIndex]}
            user={user}
            onNext={handleNext}
            onPrevious={handlePrevious}
            autoPlay={autoPlay}
            showControls={showControls}
          />
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-2 bg-black/50 rounded-full px-4 py-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white text-sm">Loading more Shorts...</span>
          </div>
        </div>
      )}

      {/* End of Feed */}
      {!hasMore && videos.length > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/50 rounded-full px-4 py-2">
            <span className="text-white text-sm">You've reached the end!</span>
          </div>
        </div>
      )}

      {/* Video Counter */}
      <div className="absolute top-4 left-4 bg-black/50 rounded-full px-3 py-1">
        <span className="text-white text-sm">
          {currentIndex + 1} / {videos.length}
        </span>
      </div>

      {/* Navigation Hints */}
      <div className="absolute top-4 right-4 bg-black/50 rounded-lg p-3">
        <div className="text-white text-xs space-y-1">
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
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0114 0z" />
            </svg>
            <span>Space to play/pause</span>
          </div>
        </div>
      </div>
    </div>
  );
}