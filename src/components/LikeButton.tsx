import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface LikeButtonProps {
  videoId: string;
  initialLiked?: boolean;
  initialDisliked?: boolean;
  initialLikeCount?: number;
  initialDislikeCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCounts?: boolean;
  onLikeChange?: (liked: boolean, disliked: boolean, likeCount: number, dislikeCount: number) => void;
  className?: string;
}

export default function LikeButton({
  videoId,
  initialLiked = false,
  initialDisliked = false,
  initialLikeCount = 0,
  initialDislikeCount = 0,
  size = 'md',
  showCounts = true,
  onLikeChange,
  className = ''
}: LikeButtonProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [disliked, setDisliked] = useState(initialDisliked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);
  const [loading, setLoading] = useState(false);

  // Update state when props change
  useEffect(() => {
    setLiked(initialLiked);
    setDisliked(initialDisliked);
    setLikeCount(initialLikeCount);
    setDislikeCount(initialDislikeCount);
  }, [initialLiked, initialDisliked, initialLikeCount, initialDislikeCount]);

  const handleLike = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ type: 'like' }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLiked(data.data.liked);
          setDisliked(data.data.disliked);
          setLikeCount(data.data.likeCount);
          setDislikeCount(data.data.dislikeCount);
          onLikeChange?.(data.data.liked, data.data.disliked, data.data.likeCount, data.data.dislikeCount);
        }
      } else if (response.status === 401) {
        // Redirect to auth if not logged in
        router.push('/auth');
      }
    } catch (error) {
      console.error('Error liking video:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ type: 'dislike' }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLiked(data.data.liked);
          setDisliked(data.data.disliked);
          setLikeCount(data.data.likeCount);
          setDislikeCount(data.data.dislikeCount);
          onLikeChange?.(data.data.liked, data.data.disliked, data.data.likeCount, data.data.dislikeCount);
        }
      } else if (response.status === 401) {
        // Redirect to auth if not logged in
        router.push('/auth');
      }
    } catch (error) {
      console.error('Error disliking video:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const sizeClasses = {
    sm: {
      button: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-sm',
    },
    md: {
      button: 'w-10 h-10',
      icon: 'w-5 h-5',
      text: 'text-sm',
    },
    lg: {
      button: 'w-12 h-12',
      icon: 'w-6 h-6',
      text: 'text-base',
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Like Button */}
      <button
        onClick={handleLike}
        disabled={loading}
        className={`
          ${currentSize.button} flex items-center justify-center rounded-full transition-all duration-200
          ${liked 
            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        `}
        title={liked ? 'Unlike' : 'Like'}
      >
        <svg 
          className={currentSize.icon} 
          fill={liked ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
          />
        </svg>
      </button>

      {/* Like Count */}
      {showCounts && (
        <span className={`${currentSize.text} font-medium text-gray-700 min-w-[2rem]`}>
          {formatCount(likeCount)}
        </span>
      )}

      {/* Dislike Button */}
      <button
        onClick={handleDislike}
        disabled={loading}
        className={`
          ${currentSize.button} flex items-center justify-center rounded-full transition-all duration-200
          ${disliked 
            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        `}
        title={disliked ? 'Remove dislike' : 'Dislike'}
      >
        <svg 
          className={currentSize.icon} 
          fill={disliked ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ transform: 'rotate(180deg)' }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
          />
        </svg>
      </button>

      {/* Dislike Count */}
      {showCounts && (
        <span className={`${currentSize.text} font-medium text-gray-700 min-w-[2rem]`}>
          {formatCount(dislikeCount)}
        </span>
      )}
    </div>
  );
}
