import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import VideoCard from './VideoCard';
import LoadingPlaceholder from './LoadingPlaceholder';

interface Video {
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
}

interface HashtagVideoFeedProps {
  hashtag: string;
  className?: string;
  maxVideos?: number;
}

const HashtagVideoFeed: React.FC<HashtagVideoFeedProps> = ({
  hashtag,
  className = '',
  maxVideos = 10, // Changed default to 10 for pagination
}) => {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);

  useEffect(() => {
    fetchVideos();
  }, [hashtag]);

  const fetchVideos = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const response = await fetch(`/api/hashtags?action=search&hashtag=${encodeURIComponent(hashtag)}&limit=${maxVideos}&offset=${(pageNum - 1) * maxVideos}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const videosData = data.data?.videos || [];
          const pagination = data.data?.pagination || {};
          
          if (append) {
            setVideos(prev => [...prev, ...videosData]);
          } else {
            setVideos(videosData);
          }
          
          setHasMore(pagination.hasMore || false);
          setTotalVideos(pagination.total || videosData.length);
          setPage(pageNum);
        } else {
          setError('Failed to fetch videos for this hashtag');
        }
      } else {
        setError('Failed to fetch videos for this hashtag');
      }
    } catch (error) {
      console.error('Error fetching hashtag videos:', error);
      setError('An error occurred while fetching videos');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchVideos(page + 1, true);
    }
  };

  const handleVideoClick = (videoId: string) => {
    router.push(`/video/${videoId}`);
  };

  if (loading && videos.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Videos tagged with #{hashtag}
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <LoadingPlaceholder key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className}`}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Videos tagged with #{hashtag}
          </h3>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchVideos()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className}`}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Videos tagged with #{hashtag}
          </h3>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Videos Found</h4>
            <p className="text-gray-600 mb-4">
              No videos have been tagged with #{hashtag} yet.
            </p>
            <button
              onClick={() => router.push('/upload')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload First Video
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Videos tagged with #{hashtag}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Showing {videos.length} of {totalVideos} videos
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <div key={video.id} onClick={() => handleVideoClick(video.id)}>
              <VideoCard video={video} />
            </div>
          ))}
        </div>

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-2 text-blue-600">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-medium">Loading more videos...</span>
            </div>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !loadingMore && (
          <div className="text-center mt-6">
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((videos.length / totalVideos) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {videos.length} of {totalVideos} videos loaded
              </p>
            </div>
            
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Load More Videos</span>
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Load {maxVideos} more videos
            </p>
          </div>
        )}

        {/* End of Results */}
        {!hasMore && videos.length > 0 && (
          <div className="text-center mt-6 py-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">You've reached the end!</p>
            <p className="text-sm text-gray-500">No more videos available for #{hashtag}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HashtagVideoFeed;
