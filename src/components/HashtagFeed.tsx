import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import VideoCard from './VideoCard';
import LoadingPlaceholder from './LoadingPlaceholder';

interface FollowedHashtag {
  id: string;
  name: string;
  usageCount: number;
  followerCount: number;
  trendingScore: number;
  followedAt: string;
}

interface RecentVideo {
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
  };
  hashtags: Array<{
    id: string;
    name: string;
  }>;
}

interface HashtagFeedProps {
  className?: string;
  maxHashtags?: number;
  maxVideos?: number;
}

const HashtagFeed: React.FC<HashtagFeedProps> = ({
  className = '',
  maxHashtags = 10,
  maxVideos = 20,
}) => {
  const router = useRouter();
  const [followedHashtags, setFollowedHashtags] = useState<FollowedHashtag[]>([]);
  const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFollowedHashtags();
  }, []);

  const fetchFollowedHashtags = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hashtags/following?limit=${maxHashtags}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFollowedHashtags(data.data.followedHashtags);
          setRecentVideos(data.data.recentVideos);
        } else {
          setError('Failed to fetch followed hashtags');
        }
      } else {
        setError('Failed to fetch followed hashtags');
      }
    } catch (error) {
      console.error('Error fetching followed hashtags:', error);
      setError('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagClick = (hashtagName: string) => {
    router.push(`/hashtag/${hashtagName}`);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className}`}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Hashtag Feed</h3>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <LoadingPlaceholder key={index} type="skeleton" />
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Hashtag Feed</h3>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchFollowedHashtags}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (followedHashtags.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className}`}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Hashtag Feed</h3>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Hashtags Followed</h4>
            <p className="text-gray-600 mb-4">Follow hashtags to see videos from topics you're interested in!</p>
            <button
              onClick={() => router.push('/videos')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Explore Videos
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
          <h3 className="text-lg font-semibold text-gray-900">Your Hashtag Feed</h3>
          <span className="text-sm text-gray-600">{followedHashtags.length} hashtags followed</span>
        </div>

        {/* Followed Hashtags */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Followed Hashtags</h4>
          <div className="flex flex-wrap gap-2">
            {followedHashtags.map((hashtag) => (
              <button
                key={hashtag.id}
                onClick={() => handleHashtagClick(hashtag.name)}
                className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-800 text-sm font-medium rounded-full hover:bg-red-200 transition-colors"
              >
                <span className="mr-1">#</span>
                {hashtag.name}
                <span className="ml-2 text-xs text-red-600">
                  {hashtag.followerCount.toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Videos */}
        {recentVideos.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Videos</h4>
            <div className="space-y-4">
              {recentVideos.slice(0, maxVideos).map((video) => (
                <div key={video.id} className="flex space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0">
                    <img
                      src={video.thumbnailUrl || '/placeholder-thumbnail.jpg'}
                      alt={video.title}
                      className="w-20 h-14 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 truncate mb-1">
                      {video.title}
                    </h5>
                    <p className="text-xs text-gray-600 mb-2">
                      {video.channel.name} • {video.viewCount.toLocaleString()} views • {formatTimeAgo(video.publishedAt)}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {video.hashtags.slice(0, 3).map((hashtag) => (
                        <button
                          key={hashtag.id}
                          onClick={() => handleHashtagClick(hashtag.name)}
                          className="text-xs text-red-600 hover:text-red-800 transition-colors"
                        >
                          #{hashtag.name}
                        </button>
                      ))}
                      {video.hashtags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{video.hashtags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recentVideos.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Recent Videos</h4>
            <p className="text-gray-600">No new videos from your followed hashtags yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HashtagFeed;
