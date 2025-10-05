import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import UniversalLayout from '@/components/UniversalLayout';
import SearchHeader from '@/components/SearchHeader';
import LoadingPlaceholder from '@/components/LoadingPlaceholder';
import HashtagFollowButton from '@/components/HashtagFollowButton';
import HashtagAnalytics from '@/components/HashtagAnalytics';
import HashtagReportButton from '@/components/HashtagReportButton';

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
  hashtags: Array<{
    id: string;
    name: string;
    usageCount: number;
    trendingScore: number;
  }>;
}

interface HashtagPageProps {
  videos: Video[];
  hashtag: string;
  hashtagId: string;
  user?: any;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function HashtagPage({ videos: initialVideos, hashtag, hashtagId, user, pagination: initialPagination }: HashtagPageProps) {
  const router = useRouter();
  const [videos, setVideos] = useState(initialVideos);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(initialPagination);
  const [trendingHashtags, setTrendingHashtags] = useState<Array<{name: string, usageCount: number}>>([]);

  const currentUser = user || null;

  // Format duration helper
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format view count helper
  const formatViewCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Format time ago helper
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;

    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  // Load more videos
  const loadMoreVideos = async () => {
    if (loading || !pagination.hasMore) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/hashtags?action=search&hashtag=${encodeURIComponent(hashtag)}&limit=20&offset=${videos.length}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setVideos(prev => [...prev, ...data.data.videos]);
          setPagination(data.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error loading more videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load trending hashtags
  useEffect(() => {
    const loadTrendingHashtags = async () => {
      try {
        const response = await fetch('/api/hashtags?action=trending&limit=10');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setTrendingHashtags(data.data.hashtags.map((tag: any) => ({
              name: tag.name,
              usageCount: tag.usageCount
            })));
          }
        }
      } catch (error) {
        console.error('Error loading trending hashtags:', error);
      }
    };

    loadTrendingHashtags();
  }, []);

  return (
    <UniversalLayout 
      user={currentUser}
      showHeader={true}
      headerContent={
        <SearchHeader
          searchQuery=""
          onSearchChange={() => {}}
          showViewToggle={false}
          compact={false}
        />
      }
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <span className="text-red-600 mr-2">#</span>
                  {hashtag}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({pagination.total} videos)
                  </span>
                </h1>
                <p className="text-gray-600 mt-1">
                  Discover videos tagged with #{hashtag}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {currentUser && (
                  <HashtagFollowButton
                    hashtag={hashtag}
                    size="lg"
                    showFollowerCount={true}
                  />
                )}
                <HashtagReportButton
                  hashtagId={hashtagId}
                  hashtagName={hashtag}
                  className="text-gray-600 hover:text-red-600"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Analytics Dashboard */}
              <HashtagAnalytics hashtag={hashtag} className="mb-6" />

              {/* Videos */}
              {loading && videos.length === 0 ? (
                <LoadingPlaceholder type="video-list" count={5} />
              ) : videos.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-r from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No videos found</h3>
                  <p className="text-gray-600 mb-6">
                    No videos have been tagged with #{hashtag} yet
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => router.push(`/video/${video.id}`)}
                      className="flex space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-80 h-48 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-500">
                            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(video.duration)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                          {video.title}
                        </h3>
                        
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center space-x-2">
                            <img
                              src={video.channel.avatarUrl || '/default-avatar.png'}
                              alt={video.channel.name}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="text-sm text-gray-700">{video.channel.name}</span>
                          </div>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-700">{formatViewCount(video.viewCount)} views</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-700">{formatTimeAgo(video.publishedAt)}</span>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {video.description}
                        </p>

                        {/* Video Hashtags */}
                        {video.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {video.hashtags.slice(0, 5).map((hashtag) => (
                              <span
                                key={hashtag.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/hashtag/${hashtag.name}`);
                                }}
                                className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition-colors cursor-pointer"
                              >
                                #{hashtag.name}
                              </span>
                            ))}
                            {video.hashtags.length > 5 && (
                              <span className="text-xs text-gray-500">
                                +{video.hashtags.length - 5} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{formatViewCount(video.likeCount)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>{formatViewCount(video.commentCount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Load More Button */}
                  {pagination.hasMore && (
                    <div className="text-center py-6">
                      <button
                        onClick={loadMoreVideos}
                        disabled={loading}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Loading...
                          </>
                        ) : (
                          'Load More Videos'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Hashtags</h3>
                <div className="space-y-2">
                  {trendingHashtags.map((hashtag, index) => (
                    <button
                      key={index}
                      onClick={() => router.push(`/hashtag/${hashtag.name}`)}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      <span className="text-red-600 font-medium">#{hashtag.name}</span>
                      <span className="text-xs text-gray-500">{hashtag.usageCount} videos</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UniversalLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { hashtag } = context.params!;
    
    const protocol = context.req.headers['x-forwarded-proto'] || 'http';
    const host = context.req.headers.host;
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : `${protocol}://${host}`;

    // Fetch videos for this hashtag
    const response = await fetch(`${baseUrl}/api/hashtags?action=search&hashtag=${encodeURIComponent(hashtag as string)}&limit=20&offset=0`);
    let videos = [];
    let pagination = {
      total: 0,
      limit: 20,
      offset: 0,
      hasMore: false
    };

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        videos = data.data.videos || [];
        pagination = data.data.pagination || pagination;
      }
    }

    // Try to get user data
    let user = null;
    const token = context.req.cookies.token;
    
    if (token) {
      try {
        const userResponse = await fetch(`${baseUrl}/api/auth/me`, {
          headers: {
            'Cookie': `token=${token}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          user = userData.data.user;
        }
      } catch (error) {
        console.log('Could not fetch user data:', error);
      }
    }

    return {
      props: {
        videos,
        hashtag: hashtag as string,
        hashtagId: hashtagRecord.id,
        user,
        pagination
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        videos: [],
        hashtag: '',
        hashtagId: '',
        user: null,
        pagination: {
          total: 0,
          limit: 20,
          offset: 0,
          hasMore: false
        }
      }
    };
  }
};
