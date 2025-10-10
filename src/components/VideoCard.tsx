import React from 'react';
import { useRouter } from 'next/router';
import SubscriptionButton from './SubscriptionButton';
import VideoMenu from './VideoMenu';
import ShareButton from './ShareButton';

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
  showSubscriptionButton?: boolean;
  initialSubscribed?: boolean;
}

export default function VideoCard({ 
  video, 
  user, 
  onEdit, 
  onDelete, 
  deletingVideoId,
  layout = 'grid',
  showSubscriptionButton = false,
  initialSubscribed = false
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
        className="flex bg-white rounded-lg duration-300 cursor-pointer relative"
        onClick={handleCardClick}
      >
        {/* Thumbnail */}
        <div className="relative w-40 h-24 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-l-lg overflow-hidden flex-shrink-0 group">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl.startsWith('/uploads/') ? `/api/uploads/${video.thumbnailUrl.replace('/uploads/', '')}` : video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = '/api/placeholder/320/180';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-500">
              <div className="text-center text-white">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mb-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <p className="text-xs font-medium">Processing...</p>
              </div>
            </div>
          )}
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
              <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          
          {/* Duration Badge */}
          <div className="absolute bottom-1 right-1 bg-black/90 text-white text-xs px-1 py-0.5 rounded font-medium backdrop-blur-sm">
            {formatDuration(video.duration)}
          </div>
          
          {/* Status Badge */}
          {video.status === 'PROCESSING' && (
            <div className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-1 py-0.5 rounded font-medium">
              Processing
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1 mr-2 group-hover:text-red-600 transition-colors duration-200"> 
              {video.title}
            </h3>
            
            {/* Action buttons */}
            <div className="flex items-center space-x-1">
              {/* Share Button */}
              <div onClick={(e) => e.stopPropagation()}>
                <ShareButton
                  videoId={video.id}
                  videoTitle={video.title}
                  videoUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/video/${video.id}`}
                  variant="icon-only"
                  className="p-1 text-neutral-500 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                />
              </div>
              
              {/* Video Menu for all users */}
              {user && (
                <VideoMenu 
                  videoId={video.id}
                  videoTitle={video.title}
                  videoUrl={video.videoUrl}
                  size="sm"
                />
              )}
              
              {/* Edit/Delete buttons for video owner */}
              {user && video.channel.userId === user.id && onEdit && onDelete && (
                <>
                  <button
                    onClick={(e) => onEdit(video.id, e)}
                    className="p-1 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit video"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => onDelete(video.id, e)}
                    disabled={deletingVideoId === video.id}
                    className="p-1 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Delete video"
                  >
                    {deletingVideoId === video.id ? (
                      <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-700 mb-2">
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{formatViewCount(video.viewCount)}</span>
            </div>
            <span className="text-neutral-300">•</span>
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatTimeAgo(video.publishedAt)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
              {video.channel.name ? video.channel.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {video.channel.name}
              </p>
              <p className="text-xs text-gray-600">
                {formatViewCount(video.channel.subscriberCount)} subscribers
              </p>
            </div>
            {showSubscriptionButton && user && video.channel.userId !== user.id && (
              <SubscriptionButton
                channelId={video.channel.id}
                initialSubscribed={initialSubscribed}
                initialSubscriberCount={video.channel.subscriberCount}
                className="text-xs"
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid layout (default)
  return (
    <div 
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group border border-neutral-100 hover:border-neutral-200 relative"
      onClick={handleCardClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-t-xl overflow-hidden">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl.startsWith('/uploads/') ? `/api/uploads/${video.thumbnailUrl.replace('/uploads/', '')}` : video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = '/api/placeholder/320/180';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-500">
            <div className="text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <p className="text-sm font-medium">Processing...</p>
            </div>
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
          <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
            <svg className="w-6 h-6 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        
        {/* Duration Badge */}
        <div className="absolute bottom-3 right-3 bg-black/90 text-white text-xs px-2 py-1 rounded-md font-medium backdrop-blur-sm">
          {formatDuration(video.duration)}
        </div>
        
        {/* Status Badge */}
        {video.status === 'PROCESSING' && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs px-2 py-1 rounded-md font-medium">
            Processing
          </div>
        )}

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Share Button */}
          <div onClick={(e) => e.stopPropagation()}>
            <ShareButton
              videoId={video.id}
              videoTitle={video.title}
              videoUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/video/${video.id}`}
              variant="icon-only"
              className="p-2 bg-white/90 backdrop-blur-sm hover:bg-white text-neutral-600 hover:text-gray-800 rounded-lg transition-all duration-200 shadow-lg"
            />
          </div>
          
          {/* Edit/Delete buttons for video owner */}
          {user && video.channel.userId === user.id && onEdit && onDelete && (
            <>
              <button
                onClick={(e) => onEdit(video.id, e)}
                className="p-2 bg-white/90 backdrop-blur-sm hover:bg-white text-neutral-600 hover:text-blue-600 rounded-lg transition-all duration-200 shadow-lg"
                title="Edit video"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={(e) => onDelete(video.id, e)}
                disabled={deletingVideoId === video.id}
                className="p-2 bg-white/90 backdrop-blur-sm hover:bg-white text-neutral-600 hover:text-red-600 rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50"
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
            </>
          )}
        </div>
      </div>

      {/* Video Info */}
      <div className="p-4 relative">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors duration-200 leading-tight flex-1 mr-2">
            {video.title}
          </h3>
          
          {/* Video Menu - positioned in video info section */}
          {user && (
            <div className="flex-shrink-0">
              <VideoMenu 
                videoId={video.id}
                videoTitle={video.title}
                videoUrl={video.videoUrl}
                size="sm"
              />
            </div>
          )}
        </div>
        
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md flex-shrink-0">
            {video.channel.name ? video.channel.name.charAt(0).toUpperCase() : 'C'}
          </div>
          
          <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate mb-1">
              {video.channel.name}
            </p>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{formatViewCount(video.viewCount)} views</span>
              </div>
              <span className="text-neutral-300">•</span>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatTimeAgo(video.publishedAt)}</span>
              </div>
            </div>
          </div>
          
          {showSubscriptionButton && user && video.channel.userId !== user.id && (
            <SubscriptionButton
              channelId={video.channel.id}
              initialSubscribed={initialSubscribed}
              initialSubscriberCount={video.channel.subscriberCount}
              className="text-xs"
            />
          )}
        </div>
      </div>
    </div>
  );
}
