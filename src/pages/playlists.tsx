import React, { useState, useEffect } from 'react';
import VideoCard from '../components/VideoCard';
import LoadingPlaceholder from '../components/LoadingPlaceholder';

interface Playlist {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoCount: number;
  views: number;
  createdAt: string;
  channel: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  isPublic: boolean;
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

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'featured' | 'trending'>('featured');

  useEffect(() => {
    fetchPlaylists();
    fetchTrendingVideos();
  }, [activeTab]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      // For now, use mock data since the API requires authentication
      const mockPlaylists: Playlist[] = [
        {
          id: '1',
          title: 'Trending Music Videos',
          description: 'The hottest music videos right now',
          thumbnailUrl: '/api/placeholder/320/180',
          videoCount: 25,
          views: 1500000,
          createdAt: new Date().toISOString(),
          channel: {
            id: '1',
            name: 'Music Channel',
            avatarUrl: '/api/placeholder/40/40'
          },
          isPublic: true
        },
        {
          id: '2',
          title: 'Gaming Highlights',
          description: 'Best gaming moments and highlights',
          thumbnailUrl: '/api/placeholder/320/180',
          videoCount: 18,
          views: 850000,
          createdAt: new Date().toISOString(),
          channel: {
            id: '2',
            name: 'Gaming Pro',
            avatarUrl: '/api/placeholder/40/40'
          },
          isPublic: true
        }
      ];
      setPlaylists(mockPlaylists);
    } catch (error) {
      console.error('Error fetching playlists:', error);
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
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-neutral-900">
                Playlists
              </h1>
            </div>
            <p className="text-neutral-600">
              Discover curated video collections and playlists
            </p>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 border-b border-neutral-200">
            <button
              onClick={() => setActiveTab('featured')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'featured'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Featured Playlists
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'trending'
                  ? 'border-purple-500 text-purple-600'
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
            ) : playlists.length > 0 ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                    Featured Playlists
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {playlists.map((playlist) => (
                    <div key={playlist.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group">
                      <div className="relative">
                        <img
                          src={playlist.thumbnailUrl}
                          alt={playlist.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {playlist.videoCount} videos
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-semibold text-neutral-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors duration-200">
                          {playlist.title}
                        </h3>
                        
                        <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                          {playlist.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-neutral-500">
                          <span>{playlist.channel.name}</span>
                          <span>{formatCount(playlist.views)} views</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-neutral-200 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  No playlists available
                </h3>
                <p className="text-neutral-600">
                  There are no featured playlists available at the moment.
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
