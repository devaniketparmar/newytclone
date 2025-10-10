import React, { useState, useEffect, useCallback } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import UniversalLayout from '@/components/UniversalLayout';
import YouTubeSearchBar from '@/components/YouTubeSearchBar';
import SearchFilters, { FilterState } from '@/components/SearchFilters';
import LoadingPlaceholder from '@/components/LoadingPlaceholder';
import VideoMenu from '@/components/VideoMenu';

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
  category?: {
    id: number;
    name: string;
  };
  channel: {
    id: string;
    name: string;
    avatarUrl: string;
    subscriberCount: number;
    userId: string;
  };
}

interface SearchPageProps {
  videos: Video[];
  user?: any;
  query?: string;
  filters?: FilterState;
}

export default function SearchPage({ videos, user, query, filters }: SearchPageProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(query || '');
  const [searchResults, setSearchResults] = useState(videos || []);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFilters, setCurrentFilters] = useState<FilterState>(filters || {
    uploadDate: '',
    duration: '',
    quality: '',
    viewCount: '',
    sort: 'relevance',
    category: ''
  });

  // Ensure user is defined
  const currentUser = user || null;

  const performSearch = useCallback(async (query: string, filters: FilterState, page: number = 1) => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      params.append('page', page.toString());
      params.append('limit', '20');
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value);
        }
      });
      
      const response = await fetch(`/api/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setSearchResults(data.data.videos || []);
        } else {
          setSearchResults(prev => [...prev, ...(data.data.videos || [])]);
        }
        setHasMore(data.data.videos && data.data.videos.length === 20);
      }
    } catch (error) {
      console.error('Error searching videos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setCurrentFilters(newFilters);
    setCurrentPage(1);
    setSearchResults([]);
    performSearch(searchQuery, newFilters, 1);
  }, [searchQuery, performSearch]);

  const formatViewCount = (count: number | undefined | null) => {
    if (!count || count === 0) {
      return '0';
    }
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatTimeAgo = (dateString: string | undefined | null) => {
    if (!dateString) {
      return 'Unknown';
    }
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    setSearchResults([]);
    performSearch(query, currentFilters, 1);
  };

  const handleFilterChange = async (filterType: string, value: string) => {
    const newFilters = { ...currentFilters, [filterType]: value };
    setCurrentFilters(newFilters);
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append('q', searchQuery);
      params.append('page', '1');
      params.append('limit', '20');
      
      // Add updated filters
      Object.entries(newFilters).forEach(([key, val]) => {
        if (val && val !== 'all') {
          params.append(key, val);
        }
      });
      
      const response = await fetch(`/api/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data.videos || []);
      }
    } catch (error) {
      console.error('Error filtering videos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UniversalLayout 
      user={currentUser}
      showHeader={true}
      headerContent={
        <div className="w-full max-w-4xl mx-auto">
          <YouTubeSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearch}
            filters={currentFilters}
            onFiltersChange={handleFiltersChange}
            showFilters={true}
            compact={false}
          />
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        {/* Search Results Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  Search results for "{searchQuery}"
                </h1>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {/* View Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Grid view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="List view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          {loading && (
            <LoadingPlaceholder type="video-list" count={5} />
          )}
          
          {!loading && searchResults.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                No results found
              </h3>
              <p className="text-neutral-600 mb-6">
                Try different keywords or check your spelling
              </p>
            </div>
          )}
          
          {!loading && searchResults.length > 0 && (
            <div className="space-y-6">
              {searchResults.map((video) => (
                <div 
                  key={video.id} 
                  className="flex space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/video/${video.id}`)}
                >
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <div className="relative w-80 h-48 bg-neutral-200 rounded-lg overflow-hidden group">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl.startsWith('/uploads/') ? `/api/uploads/${video.thumbnailUrl.replace('/uploads/', '')}` : video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600">
                          <div className="text-center text-white">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                            <p className="text-sm font-medium">Processing...</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Duration Badge */}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-medium text-neutral-900 line-clamp-2 hover:text-red-600 transition-colors flex-1 mr-2">
                        {video.title}
                      </h3>
                      
                      {/* Three Dots Menu */}
                      {user && (
                        <div className="flex-shrink-0">
                          <VideoMenu 
                            videoId={video.id}
                            videoTitle={video.title}
                            videoUrl={video.videoUrl}
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-neutral-600 mb-3">
                      <span>{formatViewCount(video.viewCount)} views</span>
                      <span>•</span>
                      <span>{formatTimeAgo(video.publishedAt)}</span>
                      {video.category && (
                        <>
                          <span>•</span>
                          <span className="px-2 py-1 bg-neutral-100 rounded-full text-xs">
                            {video.category.name}
                          </span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-neutral-200 rounded-full flex-shrink-0 overflow-hidden">
                        <img
                          src={video.channel.avatarUrl || '/api/placeholder/32/32'}
                          alt={video.channel.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {video.channel.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {formatViewCount(video.channel.subscriberCount)} subscribers
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-neutral-600 line-clamp-2">
                      {video.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </UniversalLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { 
      q: query, 
      category, 
      duration, 
      uploadDate, 
      sort,
      quality,
      viewCount
    } = context.query;
    
    // If no query, redirect to videos page
    if (!query || typeof query !== 'string') {
      return {
        redirect: {
          destination: '/videos',
          permanent: false,
        },
      };
    }

    // Fetch search results from the API
    const protocol = context.req.headers['x-forwarded-proto'] || 'http';
    const host = context.req.headers.host;
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : `${protocol}://${host}`;
    
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    searchParams.append('page', '1');
    searchParams.append('limit', '20');
    
    if (category && category !== 'all') searchParams.append('category', category as string);
    if (duration && duration !== 'all') searchParams.append('duration', duration as string);
    if (uploadDate && uploadDate !== 'all') searchParams.append('uploadDate', uploadDate as string);
    if (sort && sort !== 'relevance') searchParams.append('sort', sort as string);
    if (quality && quality !== '') searchParams.append('quality', quality as string);
    if (viewCount && viewCount !== '') searchParams.append('viewCount', viewCount as string);
    
    const searchResponse = await fetch(`${baseUrl}/api/search?${searchParams.toString()}`);
    let videos = [];
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      videos = searchData.data.videos || [];
    }

    // Try to get user data from cookies
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
        user,
        query,
        filters: {
          uploadDate: uploadDate || '',
          duration: duration || '',
          quality: quality || '',
          viewCount: viewCount || '',
          sort: sort || 'relevance',
          category: category || ''
        }
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      redirect: {
        destination: '/videos',
        permanent: false,
      },
    };
  }
};
