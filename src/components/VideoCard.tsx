import React from 'react';
import { useRouter } from 'next/router';

interface VideoCardProps {
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
    status: 'PROCESSING' | 'READY' | 'FAILED';
    channel: {
      id: string;
      name: string;
      avatarUrl: string;
      subscriberCount: number;
      userId: string;
    };
  };
  user?: any;
  onEdit?: (videoId: string, e: React.MouseEvent) => void;
  onDelete?: (videoId: string, e: React.MouseEvent) => void;
  deletingVideoId?: string | null;
  layout?: 'grid' | 'list';
}

export default function VideoCard({ 
  video, 
  user, 
  onEdit, 
  onDelete, 
  deletingVideoId,
  layout = 'grid'
}: VideoCardProps) {
  const router = useRouter();

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  const handleCardClick = () => {
    router.push(`/video/${video.id}`);
  };

  if (layout === 'list') {
    return (
      <div 
        className="flex bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Thumbnail */}
        <div className="relative w-80 h-48 bg-neutral-200 rounded-l-lg overflow-hidden flex-shrink-0">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl.startsWith('/uploads/') ? `/api/uploads/${video.thumbnailUrl.replace('/uploads/', '')}` : video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/api/placeholder/320/180';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500">
              <div className="text-center text-white">
                <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <p className="text-sm font-medium">Processing...</p>
              </div>
            </div>
          )}
          
          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
          
          {/* Status Badge */}
          {video.status === 'PROCESSING' && (
            <div className="absolute top-2 left-2 bg-warning-500 text-white text-xs px-2 py-1 rounded">
              Processing
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-neutral-900 line-clamp-2 flex-1 mr-4">
              {video.title}
            </h3>
            
            {/* Edit/Delete buttons for video owner */}
            {user && video.channel.userId === user.id && onEdit && onDelete && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => onEdit(video.id, e)}
                  className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Edit video"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => onDelete(video.id, e)}
                  disabled={deletingVideoId === video.id}
                  className="p-2 text-neutral-500 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete video"
                >
                  {deletingVideoId === video.id ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-3">
            <span>{formatViewCount(video.viewCount)} views</span>
            <span>•</span>
            <span>{formatTimeAgo(video.publishedAt)}</span>
          </div>

          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-neutral-300 rounded-full flex-shrink-0">
              <img
                src={video.channel.avatarUrl || '/api/placeholder/40/40'}
                alt={video.channel.name}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTIwIDEyQzIyLjIwOTEgMTIgMjQgMTMuNzkwOSAyNCAxNkMyNCAxOC4yMDkxIDIyLjIwOTEgMjAgMjAgMjBDMTcuNzkwOSAyMCAxNiAxOC4yMDkxIDE2IDE2QzE2IDEzLjc5MDkgMTcuNzkwOSAxMiAyMCAxMloiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTIwIDI0QzE0LjQ3NzEgMjQgMTAgMjguNDc3MSAxMCAzNEgzMEMzMCAyOC40NzcxIDI1LjUyMjkgMjQgMjAgMjRaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">
                {video.channel.name}
              </p>
              <p className="text-xs text-neutral-500">
                {formatViewCount(video.channel.subscriberCount)} subscribers
              </p>
            </div>
          </div>

          <p className="text-sm text-neutral-600 line-clamp-2">
            {video.description}
          </p>
        </div>
      </div>
    );
  }

  // Grid layout (default)
  return (
    <div 
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-neutral-200 rounded-t-lg overflow-hidden">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl.startsWith('/uploads/') ? `/api/uploads/${video.thumbnailUrl.replace('/uploads/', '')}` : video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              e.currentTarget.src = '/api/placeholder/320/180';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500">
            <div className="text-center text-white">
              <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <p className="text-sm font-medium">Processing...</p>
            </div>
          </div>
        )}
        
        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
          {formatDuration(video.duration)}
        </div>
        
        {/* Status Badge */}
        {video.status === 'PROCESSING' && (
          <div className="absolute top-2 left-2 bg-warning-500 text-white text-xs px-2 py-1 rounded">
            Processing
          </div>
        )}

        {/* Edit/Delete buttons for video owner */}
        {user && video.channel.userId === user.id && onEdit && onDelete && (
          <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => onEdit(video.id, e)}
              className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 text-neutral-600 hover:text-primary-600 rounded-lg transition-all duration-200 shadow-sm"
              title="Edit video"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => onDelete(video.id, e)}
              disabled={deletingVideoId === video.id}
              className="p-2 bg-white bg-opacity-90 hover:bg-opacity-100 text-neutral-600 hover:text-error-600 rounded-lg transition-all duration-200 shadow-sm disabled:opacity-50"
              title="Delete video"
            >
              {deletingVideoId === video.id ? (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-neutral-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
          {video.title}
        </h3>
        
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-neutral-300 rounded-full flex-shrink-0">
            <img
              src={video.channel.avatarUrl || '/api/placeholder/32/32'}
              alt={video.channel.name}
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTE2IDEwQzE4LjIwOTEgMTAgMjAgMTEuNzkwOSAyMCAxNEMyMCAxNi4yMDkxIDE4LjIwOTEgMTggMTYgMThDMTMuNzkwOSAxOCAxMiAxNi4yMDkxIDEyIDE0QzEyIDExLjc5MDkgMTMuNzkwOSAxMCAxNiAxMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE2IDIwQzEwLjQ3NzEgMjAgNiAyNC40NzcxIDYgMzBIMjZDMjYgMjQuNDc3MSAyMS41MjI5IDIwIDE2IDIwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
              }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {video.channel.name}
            </p>
            <div className="flex items-center space-x-2 text-xs text-neutral-500">
              <span>{formatViewCount(video.viewCount)} views</span>
              <span>•</span>
              <span>{formatTimeAgo(video.publishedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
