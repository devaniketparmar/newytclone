import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import UniversalLayout from './UniversalLayout';
import PageHeader from './PageHeader';
import VerticalShortsFeed from './VerticalShortsFeed';

interface ShortsVideo {
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
    verified: boolean;
  };
  hashtags?: string[];
}

interface ShortsDiscoveryProps {
  user?: any;
}

export default function ShortsDiscovery({ user }: ShortsDiscoveryProps) {
  const router = useRouter();
  const [videos, setVideos] = useState<ShortsVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<ShortsVideo | null>(null);
  const [activeTab, setActiveTab] = useState<'for-you' | 'trending' | 'following'>('for-you');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, [activeTab]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'for-you' ? '/api/shorts/feed' : 
                      activeTab === 'trending' ? '/api/shorts/trending' : 
                      '/api/shorts/following';
      
      const response = await fetch(endpoint, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setVideos(data.data || []);
        if (data.data && data.data.length > 0) {
          setCurrentVideo(data.data[0]);
        }
      } else {
        setError('Failed to load Shorts');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoChange = (video: ShortsVideo) => {
    setCurrentVideo(video);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/shorts/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setVideos(data.data || []);
        if (data.data && data.data.length > 0) {
          setCurrentVideo(data.data[0]);
        }
      } else {
        setError('Search failed');
      }
    } catch (err) {
      setError('Search error');
      console.error('Error searching:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && videos.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading Shorts...</p>
        </div>
      </div>
    );
  }

  if (error && videos.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold mb-2">Failed to load Shorts</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchVideos}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Shorts</h1>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-4">
            {showSearch ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                  placeholder="Search Shorts..."
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
                <button
                  onClick={() => handleSearch(searchQuery)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Search
                </button>
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                    fetchVideos();
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="w-full px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white transition-colors text-left"
              >
                Search Shorts...
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/shorts/create')}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Create
            </button>
            <button
              onClick={() => router.push('/shorts/analytics')}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center space-x-8 px-4 pb-3">
          {[
            { id: 'for-you', label: 'For You', icon: '🎯' },
            { id: 'trending', label: 'Trending', icon: '🔥' },
            { id: 'following', label: 'Following', icon: '👥' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24">
        {videos.length > 0 ? (
          <VerticalShortsFeed
            user={user}
            initialVideos={videos}
            onVideoChange={handleVideoChange}
            autoPlay={true}
            showControls={false}
          />
        ) : (
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center text-white">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-semibold mb-2">No Shorts Found</h3>
              <p className="text-gray-400 mb-4">
                {activeTab === 'for-you' ? 'No Shorts available for you right now' :
                 activeTab === 'trending' ? 'No trending Shorts at the moment' :
                 'No Shorts from channels you follow'}
              </p>
              <button
                onClick={() => router.push('/shorts/create')}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Create Your First Short
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => router.push('/shorts/create')}
          className="w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
