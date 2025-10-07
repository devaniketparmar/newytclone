import React, { useState } from 'react';

import { api } from '../lib/axios';
interface WatchLaterButtonProps {
  videoId: string;
  isInWatchLater?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  onToggle?: (isInWatchLater: boolean) => void;
}

export default function WatchLaterButton({ 
  videoId, 
  isInWatchLater = false, 
  size = 'md',
  showText = false,
  onToggle 
}: WatchLaterButtonProps) {
  const [loading, setLoading] = useState(false);
  const [inWatchLater, setInWatchLater] = useState(isInWatchLater);

  const handleToggle = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const method = inWatchLater ? 'DELETE' : 'POST';
      const response = await api.get(`/api/library/watch-later/${videoId}`, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        const newState = !inWatchLater;
        setInWatchLater(newState);
        onToggle?.(newState);
      } else {
        console.error('Failed to toggle watch later');
      }
    } catch (error) {
      console.error('Error toggling watch later:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        rounded-full
        transition-all duration-200
        ${inWatchLater 
          ? 'bg-red-600 text-white hover:bg-red-700' 
          : 'bg-black/70 text-white hover:bg-black/90'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        ${showText ? 'px-3 py-2 rounded-lg' : ''}
      `}
      title={inWatchLater ? 'Remove from Watch Later' : 'Add to Watch Later'}
    >
      {loading ? (
        <div className={`${iconSizes[size]} border-2 border-white border-t-transparent rounded-full animate-spin`} />
      ) : (
        <>
          <svg 
            className={iconSizes[size]} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          {showText && (
            <span className="ml-2 text-sm font-medium">
              {inWatchLater ? 'Added' : 'Watch Later'}
            </span>
          )}
        </>
      )}
    </button>
  );
}
