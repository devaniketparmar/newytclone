import React, { useState, useEffect } from 'react';
import VideoCard from '../components/VideoCard';
import LoadingPlaceholder from '../components/LoadingPlaceholder';

interface Channel {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  subscribers: number;
  videoCount: number;
  isVerified: boolean;
  isLive: boolean;
  category: string;
}

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  views: number;
  likes: number;
  createdAt: string;
  channel: {
    id: string;
    name: string;
    avatarUrl: string;
    subscribers: number;
  };
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'featured' | 'trending'>('featured');

  useEffect(() => {
    fetchChannels();
    fetchTrendingVideos();
  }, [activeTab]);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      // For now, use mock data since there's no channels API endpoint
      const mockChannels: Channel[] = [
        {
          id: '1',
          name: 'Tech Channel',
          description: 'Latest technology news and reviews',
          avatarUrl: '/api/placeholder/80/80',
          subscribers: 2500000,
          videoCount: 450,
          isVerified: true,
          isLive: false,
          category: 'Technology'
        },
        {
          id: '2',
          name: 'Gaming Pro',
          description: 'Professional gaming content and tutorials',
          avatarUrl: '/api/placeholder/80/80',
          subscribers: 1800000,
          videoCount: 320,
          isVerified: true,
          isLive: true,
          category: 'Gaming'
        },
        {
          id: '3',
          name: 'Music World',
          description: 'Discover new music and artists',
          avatarUrl: '/api/placeholder/80/80',
          subscribers: 3200000,
          videoCount: 680,
          isVerified: true,
          isLive: false,
          category: 'Music'
        }
      ];
      setChannels(mockChannels);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingVideos = async () => {
    try {
      const response = await fetch('/api/videos?limit=12');
      const data = await response.json();
      setVideos(data.data || []);
    } catch (error) {
      console.error('Error fetching trending videos:', error);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-neutral-900">
                Channels
              </h1>
            </div>
            <p className="text-neutral-600">
              Discover new creators and popular channels
            </p>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 border-b border-neutral-200">
            <button
              onClick={() => setActiveTab('featured')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'featured'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Featured Channels
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'trending'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Trending Videos
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'featured' ? (
          <>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, index) => (
                  <LoadingPlaceholder key={index} />
                ))}
              </div>
            ) : channels.length > 0 ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                    Featured Channels
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {channels.map((channel) => (
                    <div key={channel.id} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="relative">
                          <img
                            src={channel.avatarUrl}
                            alt={channel.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          {channel.isLive && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-neutral-900 truncate group-hover:text-indigo-600 transition-colors duration-200">
                              {channel.name}
                            </h3>
                            {channel.isVerified && (
                              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                            )}
                          </div>
                          <p className="text-sm text-neutral-600 truncate">
                            {formatCount(channel.subscribers)} subscribers
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                        {channel.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>{channel.category}</span>
                        <span>{channel.videoCount} videos</span>
                      </div>
                      
                      <button className="w-full mt-4 bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200">
                        Subscribe
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-neutral-200 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  No channels available
                </h3>
                <p className="text-neutral-600">
                  There are no featured channels available at the moment.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                Trending Videos
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
