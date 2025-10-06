import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import UniversalLayout from '@/components/UniversalLayout';
import VideoCard from '@/components/VideoCard';

interface LibraryVideo {
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
    avatarUrl?: string;
    subscriberCount: number;
  };
  addedAt: string;
}

interface LibraryData {
  watchLater: LibraryVideo[];
  likedVideos: LibraryVideo[];
  playlists: Array<{
    id: string;
    name: string;
    description?: string;
    videoCount: number;
    thumbnailUrl?: string;
    createdAt: string;
  }>;
  recentVideos: LibraryVideo[];
}

interface LibraryPageProps {
  user?: any;
  libraryData: LibraryData;
}

export default function LibraryPage({ user, libraryData: initialLibraryData }: LibraryPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'watch-later' | 'liked' | 'playlists' | 'recent'>('watch-later');
  const [libraryData, setLibraryData] = useState<LibraryData>(initialLibraryData);
  const [loading, setLoading] = useState(false);

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

  const handleRemoveFromWatchLater = async (videoId: string) => {
    try {
      const response = await fetch(`/api/library/watch-later/${videoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        setLibraryData(prev => ({
          ...prev,
          watchLater: prev.watchLater.filter(video => video.id !== videoId)
        }));
      }
    } catch (error) {
      console.error('Error removing from watch later:', error);
    }
  };

  const handleRemoveFromLiked = async (videoId: string) => {
    try {
      const response = await fetch(`/api/library/liked/${videoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        setLibraryData(prev => ({
          ...prev,
          likedVideos: prev.likedVideos.filter(video => video.id !== videoId)
        }));
      }
    } catch (error) {
      console.error('Error removing from liked:', error);
    }
  };

  const tabs = [
    { id: 'watch-later', label: 'Watch Later', count: libraryData.watchLater.length },
    { id: 'liked', label: 'Liked Videos', count: libraryData.likedVideos.length },
    { id: 'playlists', label: 'Playlists', count: libraryData.playlists.length },
    { id: 'recent', label: 'Recent', count: libraryData.recentVideos.length },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'watch-later':
        return (
          <div className="space-y-4">
            {libraryData.watchLater.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos in Watch Later</h3>
                <p className="text-gray-600 mb-4">Videos you save to watch later will appear here.</p>
                <button
                  onClick={() => router.push('/videos')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Explore Videos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {libraryData.watchLater.map((video) => (
                  <div key={video.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="relative">
                      <VideoCard video={video} />
                      <button
                        onClick={() => handleRemoveFromWatchLater(video.id)}
                        className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded hover:bg-black/90 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-500">Added {formatTimeAgo(video.addedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'liked':
        return (
          <div className="space-y-4">
            {libraryData.likedVideos.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No liked videos</h3>
                <p className="text-gray-600 mb-4">Videos you like will appear here.</p>
                <button
                  onClick={() => router.push('/videos')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Explore Videos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {libraryData.likedVideos.map((video) => (
                  <div key={video.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="relative">
                      <VideoCard video={video} />
                      <button
                        onClick={() => handleRemoveFromLiked(video.id)}
                        className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded hover:bg-black/90 transition-colors"
                      >
                        Unlike
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-500">Liked {formatTimeAgo(video.addedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'playlists':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Your Playlists</h3>
              <button
                onClick={() => router.push('/playlists/create')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Create Playlist
              </button>
            </div>
            
            {libraryData.playlists.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No playlists yet</h3>
                <p className="text-gray-600 mb-4">Create playlists to organize your favorite videos.</p>
                <button
                  onClick={() => router.push('/playlists/create')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Create Your First Playlist
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {libraryData.playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => router.push(`/playlist/${playlist.id}`)}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="aspect-video bg-gray-200 flex items-center justify-center">
                      {playlist.thumbnailUrl ? (
                        <img src={playlist.thumbnailUrl} alt={playlist.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-1">{playlist.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{playlist.videoCount} videos</p>
                      <p className="text-xs text-gray-500">Created {formatTimeAgo(playlist.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'recent':
        return (
          <div className="space-y-4">
            {libraryData.recentVideos.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No recent videos</h3>
                <p className="text-gray-600 mb-4">Recently watched videos will appear here.</p>
                <button
                  onClick={() => router.push('/videos')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Explore Videos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {libraryData.recentVideos.map((video) => (
                  <div key={video.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <VideoCard video={video} />
                    <div className="p-3">
                      <p className="text-xs text-gray-500">Watched {formatTimeAgo(video.addedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <UniversalLayout user={user}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <span className="mr-3 text-red-600">📚</span>
                  Library
                </h1>
                <p className="text-gray-600 mt-1">
                  Your personal video collections
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {renderContent()}
          </div>
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

    // If no user is authenticated, redirect to auth page
    if (!user) {
      return {
        redirect: {
          destination: '/auth',
          permanent: false,
        },
      };
    }

    // Try to fetch library data
    let libraryData = {
      watchLater: [],
      likedVideos: [],
      playlists: [],
      recentVideos: [],
    };

    try {
      const protocol = context.req.headers['x-forwarded-proto'] || 'http';
      const host = context.req.headers.host;
      const baseUrl = process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : `${protocol}://${host}`;

      const res = await fetch(`${baseUrl}/api/library`, { 
        headers: { 
          cookie: context.req.headers.cookie || '',
          'Authorization': `Bearer ${token}`
        } 
      });
      
      if (res.ok) {
        const data = await res.json();
        libraryData = data.data || libraryData;
      }
    } catch (e) {
      console.log('Could not fetch library data:', e);
    }

    return { props: { libraryData, user } };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      redirect: {
        destination: '/auth',
        permanent: false,
      },
    };
  }
};
