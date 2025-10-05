import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import UniversalLayout from '@/components/UniversalLayout';
import SearchHeader from '@/components/SearchHeader';
import HashtagFollowButton from '@/components/HashtagFollowButton';
import LoadingPlaceholder from '@/components/LoadingPlaceholder';

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

interface HashtagFollowingPageProps {
  user?: any;
  initialHashtags: FollowedHashtag[];
  initialVideos: RecentVideo[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export default function HashtagFollowingPage({
  user,
  initialHashtags,
  initialVideos,
  pagination: initialPagination,
}: HashtagFollowingPageProps) {
  const router = useRouter();
  const [followedHashtags, setFollowedHashtags] = useState(initialHashtags);
  const [recentVideos, setRecentVideos] = useState(initialVideos);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentUser = user || null;

  const handleFollowChange = (hashtagName: string, isFollowing: boolean, newFollowerCount: number) => {
    if (!isFollowing) {
      // Remove from followed hashtags
      setFollowedHashtags(prev => prev.filter(h => h.name !== hashtagName));
    } else {
      // Add to followed hashtags
      const newHashtag: FollowedHashtag = {
        id: '', // Will be updated when we refetch
        name: hashtagName,
        usageCount: 0,
        followerCount: newFollowerCount,
        trendingScore: 0,
        followedAt: new Date().toISOString(),
      };
      setFollowedHashtags(prev => [newHashtag, ...prev]);
    }
  };

  const loadMoreVideos = async () => {
    if (loading || !pagination.hasMore) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/hashtags/following?page=${pagination.page + 1}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecentVideos(prev => [...prev, ...data.data.recentVideos]);
          setPagination(data.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error loading more videos:', error);
    } finally {
      setLoading(false);
    }
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

  const formatViewCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <UniversalLayout
      user={currentUser}
      showHeader={true}
      headerContent={
        <SearchHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showViewToggle={false}
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
                  <span className="mr-3 text-red-600">🏷️</span>
                  Following Hashtags
                </h1>
                <p className="text-gray-600 mt-1">
                  Videos from hashtags you follow
                </p>
              </div>
              <div className="text-sm text-gray-600">
                {followedHashtags.length} hashtags followed
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Followed Hashtags */}
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Followed Hashtags</h3>
                {followedHashtags.length === 0 ? (
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
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {followedHashtags.map((hashtag) => (
                      <div
                        key={hashtag.id}
                        className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3"
                      >
                        <button
                          onClick={() => router.push(`/hashtag/${hashtag.name}`)}
                          className="text-red-600 font-medium hover:text-red-800 transition-colors"
                        >
                          #{hashtag.name}
                        </button>
                        <div className="text-sm text-gray-600">
                          {hashtag.followerCount.toLocaleString()} followers
                        </div>
                        <HashtagFollowButton
                          hashtag={hashtag.name}
                          size="sm"
                          showFollowerCount={false}
                          onFollowChange={(isFollowing) => handleFollowChange(hashtag.name, isFollowing, hashtag.followerCount)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Videos */}
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Videos</h3>
                {recentVideos.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Recent Videos</h4>
                    <p className="text-gray-600">No new videos from your followed hashtags yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentVideos.map((video) => (
                      <div
                        key={video.id}
                        onClick={() => router.push(`/video/${video.id}`)}
                        className="flex space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
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
                            {video.channel.name} • {formatViewCount(video.viewCount)} views • {formatTimeAgo(video.publishedAt)}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {video.hashtags.slice(0, 3).map((hashtag) => (
                              <button
                                key={hashtag.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/hashtag/${hashtag.name}`);
                                }}
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
                )}

                {/* Load More Button */}
                {pagination.hasMore && (
                  <div className="text-center mt-6">
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
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/videos')}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-800 font-medium">Explore All Videos</span>
                    </div>
                  </button>
                  <button
                    onClick={() => router.push('/trending')}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-gray-800 font-medium">Trending Videos</span>
                    </div>
                  </button>
                  <button
                    onClick={() => router.push('/upload')}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-gray-800 font-medium">Upload Video</span>
                    </div>
                  </button>
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
  const { req } = context;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://your-domain.com'
    : `${protocol}://${host}`;

  let user = null;
  let followedHashtags: FollowedHashtag[] = [];
  let recentVideos: RecentVideo[] = [];
  let pagination = {
    total: 0,
    page: 1,
    limit: 20,
    hasMore: false,
  };

  try {
    // Try to get user data from cookies
    const token = req.cookies.token;
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

    // If user is authenticated, fetch their followed hashtags
    if (user) {
      try {
        const followingResponse = await fetch(`${baseUrl}/api/hashtags/following?limit=20`, {
          headers: {
            'Cookie': `token=${token}`
          }
        });
        if (followingResponse.ok) {
          const data = await followingResponse.json();
          if (data.success) {
            followedHashtags = data.data.followedHashtags;
            recentVideos = data.data.recentVideos;
            pagination = data.data.pagination;
          }
        }
      } catch (error) {
        console.error('Error fetching followed hashtags:', error);
      }
    }
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
  }

  return {
    props: {
      user,
      initialHashtags: followedHashtags,
      initialVideos: recentVideos,
      pagination,
    },
  };
};
