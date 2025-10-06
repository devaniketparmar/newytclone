import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import UniversalLayout from '@/components/UniversalLayout';
import VideoCard from '@/components/VideoCard';
import LoadingPlaceholder from '@/components/LoadingPlaceholder';

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

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscriptions', {
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth');
          return;
        }
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();
      setSubscriptionData(data.data);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async (channelId: string) => {
    try {
      const response = await fetch(`/api/channels/${channelId}/subscribe`, {
        method: 'DELETE',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {subscriptionData.videos.map((video) => (
                    <div key={video.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="relative">
                        <img
                          src={video.thumbnailUrl || '/placeholder-thumbnail.jpg'}
                          alt={video.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
                          {formatDuration(video.duration)}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                          {video.title}
                        </h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <img
                            src={video.channel.avatarUrl || '/placeholder-avatar.jpg'}
                            alt={video.channel.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm text-gray-600">{video.channel.name}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          <div>{formatViewCount(Number(video.viewCount))}</div>
                          <div>{formatTimeAgo(video.publishedAt || video.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
