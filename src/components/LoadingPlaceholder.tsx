import React from 'react';

interface LoadingPlaceholderProps {
  type?: 'video-card' | 'video-list' | 'comment' | 'search' | 'spinner' | 'skeleton';
  count?: number;
  className?: string;
}

export default function LoadingPlaceholder({ 
  type = 'spinner', 
  count = 1, 
  className = "" 
}: LoadingPlaceholderProps) {
  
  // Spinner loading
  if (type === 'spinner') {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  // Video card skeleton
  if (type === 'video-card') {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden ${className}`}>
        {/* Thumbnail skeleton */}
        <div className="relative aspect-video bg-neutral-200 animate-pulse">
          <div className="absolute bottom-2 right-2 bg-neutral-300 h-4 w-12 rounded"></div>
        </div>
        
        {/* Content skeleton */}
        <div className="p-4">
          {/* Title skeleton */}
          <div className="h-4 bg-neutral-200 rounded mb-3 animate-pulse"></div>
          <div className="h-4 bg-neutral-200 rounded w-3/4 mb-3 animate-pulse"></div>
          
          {/* Channel info skeleton */}
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 bg-neutral-200 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="h-3 bg-neutral-200 rounded w-1/2 mb-1 animate-pulse"></div>
              <div className="h-3 bg-neutral-200 rounded w-1/3 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Video list skeleton
  if (type === 'video-list') {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex space-x-4 p-4 bg-white rounded-lg shadow-sm">
            {/* Thumbnail skeleton */}
            <div className="relative w-80 h-48 bg-neutral-200 rounded-lg animate-pulse">
              <div className="absolute bottom-2 right-2 bg-neutral-300 h-4 w-12 rounded"></div>
            </div>
            
            {/* Content skeleton */}
            <div className="flex-1 min-w-0">
              <div className="h-5 bg-neutral-200 rounded mb-2 animate-pulse"></div>
              <div className="h-5 bg-neutral-200 rounded w-3/4 mb-3 animate-pulse"></div>
              
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-neutral-200 rounded-full animate-pulse"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/3 animate-pulse"></div>
              </div>
              
              <div className="h-3 bg-neutral-200 rounded w-1/2 mb-1 animate-pulse"></div>
              <div className="h-3 bg-neutral-200 rounded w-2/3 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Comment skeleton
  if (type === 'comment') {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex space-x-3 p-3 bg-white rounded-lg">
            <div className="w-8 h-8 bg-neutral-200 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-neutral-200 rounded w-1/4 mb-2 animate-pulse"></div>
              <div className="h-3 bg-neutral-200 rounded mb-1 animate-pulse"></div>
              <div className="h-3 bg-neutral-200 rounded w-3/4 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Search skeleton
  if (type === 'search') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
            <div className="w-4 h-4 bg-neutral-200 rounded animate-pulse"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2 animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  // Generic skeleton
  if (type === 'skeleton') {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-neutral-200 rounded mb-2"></div>
        <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
      </div>
    );
  }

  return null;
}
