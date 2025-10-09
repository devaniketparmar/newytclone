import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import UniversalLayout from '@/components/UniversalLayout';
import VideoCard from '@/components/VideoCard';
import LoadingPlaceholder from '@/components/LoadingPlaceholder';

interface Channel {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  verified: boolean;
  createdAt: string;
  user: {
    id: string;
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
  videoUrl: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  publishedAt: string;
  status: 'PROCESSING' | 'READY' | 'FAILED';
  privacy: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
}

interface ChannelPageProps {
  channel: Channel;
  videos: Video[];
  user?: any;
}

export default function ChannelPage({ channel, videos, user }: ChannelPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('videos');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(channel.subscriberCount);
  const [loading, setLoading] = useState(false);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/channels/${channel.id}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setIsSubscribed(data.subscribed);
        setSubscriberCount(data.subscriberCount);
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  const publicVideos = videos.filter(video => video.privacy === 'PUBLIC' && video.status === 'READY');

  return (
    <UniversalLayout user={user}>
      <div className="min-h-screen bg-gray-50">
        {/* Channel Header */}
        <div className="bg-white border-b border-gray-200">
          {/* Banner */}
          <div className="relative h-48 bg-gradient-to-r from-red-500 to-red-600">
            {channel.bannerUrl && (
              <img
                src={channel.bannerUrl}
                alt={`${channel.name} banner`}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Channel Info */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6 pb-6 -mt-16">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                  {channel.avatarUrl ? (
                    <img
                      src={channel.avatarUrl}
                      alt={channel.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                      <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                {channel.verified && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Channel Details */}
              <div className="flex-1 mt-4 sm:mt-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                      <span>{channel.name}</span>
                      {channel.verified && (
                        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </h1>
                    <p className="text-gray-600 mt-1">@{channel.user.username}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>{formatNumber(subscriberCount)} subscribers</span>
                      <span>{formatNumber(channel.videoCount)} videos</span>
                      <span>{formatNumber(channel.viewCount)} total views</span>
                    </div>
                  </div>

                  {/* Subscribe Button */}
                  <div className="mt-4 sm:mt-0">
                    {user && user.id === channel.user.id ? (
                      <button
                        onClick={() => router.push(`/channel/${channel.id}/dashboard`)}
                        className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Manage Channel
                      </button>
                    ) : (
                      <button
                        onClick={handleSubscribe}
                        disabled={loading}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                          isSubscribed
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {loading ? 'Loading...' : isSubscribed ? 'Subscribed' : 'Subscribe'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                {channel.description && (
                  <div className="mt-4">
                    <p className="text-gray-800">{channel.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  Videos
                </button>
                <button
                  onClick={() => setActiveTab('playlists')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'playlists'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Playlists
                </button>
                <button
                  onClick={() => setActiveTab('about')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'about'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  About
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'videos' && (
            <div>
              {publicVideos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {publicVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={{
                        ...video,
                        channel: {
                          id: channel.id,
                          name: channel.name,
                          avatarUrl: channel.avatarUrl,
                          subscriberCount: subscriberCount,
                          userId: channel.user.id
                        }
                      }}
                      user={user}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No videos yet</h3>
                  <p className="text-gray-500">This channel hasn't uploaded any videos.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'playlists' && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No playlists yet</h3>
              <p className="text-gray-500">This channel hasn't created any playlists.</p>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="max-w-3xl">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About {channel.name}</h3>
                
                {channel.description ? (
                  <p className="text-gray-800 whitespace-pre-wrap">{channel.description}</p>
                ) : (
                  <p className="text-gray-500">No description available.</p>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Channel Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Joined:</span>
                      <span className="ml-2 text-gray-600">
                        {new Date(channel.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Total Views:</span>
                      <span className="ml-2 text-gray-600">{formatNumber(channel.viewCount)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Subscribers:</span>
                      <span className="ml-2 text-gray-600">{formatNumber(subscriberCount)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Videos:</span>
                      <span className="ml-2 text-gray-600">{formatNumber(channel.videoCount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </UniversalLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  
  // This would typically fetch real data from your API
  // For now, we'll return mock data
  const mockChannel = {
    id: id as string,
    name: 'Tech Tutorials',
    description: 'Welcome to Tech Tutorials! I create educational content about programming, web development, and technology. Subscribe for weekly tutorials and coding tips!',
    avatarUrl: '/api/placeholder/128/128',
    bannerUrl: '/api/placeholder/2560/1440',
    subscriberCount: 1250,
    videoCount: 12,
    viewCount: 125000,
    verified: true,
    createdAt: new Date('2023-01-15').toISOString(),
    user: {
      id: id as string,
      username: 'techtutorials',
      firstName: 'Tech',
      lastName: 'Tutorials'
    }
  };

  const mockVideos = [
    {
      id: '1',
      title: 'How to Build Modern React Apps',
      description: 'Learn how to build modern React applications with hooks and functional components.',
      thumbnailUrl: '/api/placeholder/320/180',
      videoUrl: '/api/videos/1',
      duration: 1800,
      viewCount: 15000,
      likeCount: 850,
      commentCount: 120,
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      status: 'READY' as const,
      privacy: 'PUBLIC' as const
    },
    {
      id: '2',
      title: 'JavaScript ES2024 Features',
      description: 'Explore the latest features in JavaScript ES2024.',
      thumbnailUrl: '/api/placeholder/320/180',
      videoUrl: '/api/videos/2',
      duration: 1200,
      viewCount: 8500,
      likeCount: 420,
      commentCount: 65,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'READY' as const,
      privacy: 'PUBLIC' as const
    },
    {
      id: '3',
      title: 'CSS Grid vs Flexbox',
      description: 'Understanding when to use CSS Grid vs Flexbox for layouts.',
      thumbnailUrl: '/api/placeholder/320/180',
      videoUrl: '/api/videos/3',
      duration: 1500,
      viewCount: 6200,
      likeCount: 310,
      commentCount: 45,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      status: 'READY' as const,
      privacy: 'PUBLIC' as const
    }
  ];

  return {
    props: {
      channel: mockChannel,
      videos: mockVideos
    }
  };
};
