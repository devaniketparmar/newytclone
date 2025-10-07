import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import UniversalLayout from '@/components/UniversalLayout';
import VideoCard from '@/components/VideoCard';
import LoadingPlaceholder from '@/components/LoadingPlaceholder';

import { api } from '../lib/axios';
interface Channel {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  subscriberCount: number;
  videoCount: number;
  user: {
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  publishedAt?: string;
  channel: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

interface SubscriptionData {
  channels: Channel[];
  videos: Video[];
  totalSubscriptions: number;
}

interface SubscriptionsPageProps {
  user?: any;
}

export default function SubscriptionsPage({ user }: SubscriptionsPageProps) {
  const router = useRouter();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'channels' | 'videos'>('videos');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchSubscriptions(1, true); // Reset = true
  }, []);

  const fetchSubscriptions = async (page: number = currentPage, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const response = await api.get(`/api/subscriptions?page=${page}&limit=10`);
      console.log('Subscriptions API Response:', response); // Debug log

      if (response.status !== 200) {
        if (response.status === 401) {
          router.push('/auth');
          return;
        }
        throw new Error('Failed to fetch subscriptions');
      }

      const data = response.data;
      
      // Check if response has expected structure
      if (data && data.success && data.data) {
        const newVideos = data.data.videos || [];
        
        if (reset) {
          setSubscriptionData(data.data);
        } else {
          setSubscriptionData(prev => ({
            ...prev!,
            videos: [...prev!.videos, ...newVideos]
          }));
        }
        
        // Check if there are more videos
        setHasMoreVideos(newVideos.length === 10);
      } else {
        console.warn('API response does not have expected structure:', data);
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (reset) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const loadMore = async () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await fetchSubscriptions(nextPage, false); // Reset = false
  };

  const handleUnsubscribe = async (channelId: string) => {
    try {
      const response = await api.delete(`/api/channels/${channelId}/subscribe`);

      if (response.status === 200) {
        // Refresh subscription data
        fetchSubscriptions();
      } else {
        console.error('Failed to unsubscribe');
      }
    } catch (err) {
      console.error('Error unsubscribing:', err);
    }
  };

  const formatSubscriberCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
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

  if (loading) {
    return (
      <UniversalLayout user={user}>
        <Head>
          <title>Subscriptions - YouTube Clone</title>
        </Head>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <LoadingPlaceholder />
          </div>
        </div>
      </UniversalLayout>
    );
  }

  if (error) {
    return (
      <UniversalLayout user={user}>
        <Head>
          <title>Subscriptions - YouTube Clone</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Subscriptions</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchSubscriptions}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </UniversalLayout>
    );
  }

  return (
    <UniversalLayout user={user}>
      <Head>
        <title>Subscriptions - YouTube Clone</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscriptions</h1>
            <p className="text-gray-600">
              {subscriptionData?.totalSubscriptions || 0} channels subscribed
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'videos'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Latest Videos
                </button>
                <button
                  onClick={() => setActiveTab('channels')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'channels'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Channels
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'videos' ? (
            <div>
              {subscriptionData?.videos && subscriptionData.videos.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subscriptionData.videos.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        user={user}
                        layout="grid"
                      />
                    ))}
                  </div>
                  
                  {/* Load More Button */}
                  {hasMoreVideos && !loading && (
                    <div className="flex justify-center mt-8">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        {loadingMore ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>Load More Videos</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* Loading More Indicator */}
                  {loadingMore && (
                    <div className="flex justify-center mt-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Loading more videos...</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No videos from subscriptions</h3>
                  <p className="text-gray-600">Subscribe to channels to see their latest videos here.</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              {subscriptionData?.channels && subscriptionData.channels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subscriptionData.channels.map((channel) => (
                    <div key={channel.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4 mb-4">
                        <img
                          src={channel.avatarUrl || '/placeholder-avatar.jpg'}
                          alt={channel.name}
                          className="w-16 h-16 rounded-full"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{channel.name}</h3>
                          <p className="text-sm text-gray-600">@{channel.user.username}</p>
                          <div className="text-sm text-gray-500">
                            {formatSubscriberCount(channel.subscriberCount)} subscribers
                          </div>
                        </div>
                      </div>
                      {channel.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{channel.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {channel.videoCount} videos
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => router.push(`/channel/${channel.id}`)}
                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors"
                          >
                            View Channel
                          </button>
                          <button
                            onClick={() => handleUnsubscribe(channel.id)}
                            className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm hover:bg-red-200 transition-colors"
                          >
                            Unsubscribe
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions yet</h3>
                  <p className="text-gray-600 mb-4">Subscribe to channels to see them here.</p>
                  <button
                    onClick={() => router.push('/')}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Explore Channels
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </UniversalLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Try to get user data from cookies
    let user = null;
    const token = context.req.cookies.token;
    
    if (token) {
      try {
        const protocol = context.req.headers['x-forwarded-proto'] || 'http';
        const host = context.req.headers.host;
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://your-domain.com' 
          : `${protocol}://${host}`;

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
        user
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        user: null
      }
    };
  }
};
