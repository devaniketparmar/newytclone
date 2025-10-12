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

  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  const performSearch = useCallback(async (query: string, filters: FilterState = currentFilters) => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('q', query.trim());
      
      if (filters.category && filters.category !== '') searchParams.append('category', filters.category);
      if (filters.duration && filters.duration !== 'all') searchParams.append('duration', filters.duration);
      if (filters.uploadDate && filters.uploadDate !== 'all') searchParams.append('uploadDate', filters.uploadDate);
      if (filters.sort && filters.sort !== 'relevance') searchParams.append('sort', filters.sort);
      if (filters.quality && filters.quality !== '') searchParams.append('quality', filters.quality);
      if (filters.viewCount && filters.viewCount !== '') searchParams.append('viewCount', filters.viewCount);

      const response = await fetch(`/api/search?${searchParams.toString()}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data.videos || []);
        setCurrentPage(1);
        setHasMore(data.data.pagination?.hasMore || false);
      } else {
        console.error('Search API error:', data.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  const handleSearch = useCallback((query: string, filters?: FilterState) => {
    setSearchQuery(query);
    if (filters) {
      setCurrentFilters(filters);
    }
    performSearch(query, filters || currentFilters);
  }, [performSearch, currentFilters]);

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setCurrentFilters(newFilters);
    if (searchQuery.trim()) {
      performSearch(searchQuery, newFilters);
    }
  }, [searchQuery, performSearch]);

  const formatViewCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    } else {
      return `${count} views`;
    }
  };

  const formatTimeAgo = (dateString: string): string => {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Enhanced Header */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Search Bar */}
              <div className="flex-1 max-w-2xl">
                <YouTubeSearchBar
                  initialQuery={query}
                  onSearch={handleSearch}
                  showFilters={true}
                  compact={false}
                />
              </div>
              
              {/* Results Count */}
              <div className="ml-6 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Search Results</p>
                    <p className="text-lg font-bold text-gray-900">
                      {searchResults.length > 0 ? `${searchResults.length} videos found` : 'No results'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {loading && (
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex space-x-4 animate-pulse">
                  <div className="flex-shrink-0">
                    <div className="w-64 h-36 bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && searchResults.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-6">Try different keywords or check your spelling</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear search
                </button>
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Go back
                </button>
              </div>
            </div>
          )}

          {!loading && searchResults.length > 0 && (
            <div className="space-y-6">
              {searchResults.map((video, index) => (
                <div 
                  key={video.id} 
                  className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer transform hover:scale-[1.01]"
                  onClick={() => router.push(`/video/${video.id}`)}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex space-x-6 p-6">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      <div className="relative w-80 h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden group-hover:rounded-2xl transition-all duration-300">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                            <div className="text-center text-white">
                              <svg className="w-16 h-16 mx-auto mb-3 opacity-80" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                              <p className="text-sm font-medium">Processing...</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Duration Badge */}
                        <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-sm px-2 py-1 rounded-lg font-medium">
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </div>
                        
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
                            <svg className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Video Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">
                        {video.title}
                      </h3>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>{formatViewCount(video.viewCount)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatTimeAgo(video.publishedAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {video.channel?.name?.charAt(0) || 'C'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{video.channel?.name}</p>
                          <p className="text-sm text-gray-600">{formatViewCount(video.channel?.subscriberCount || 0)} subscribers</p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-3">
                        {video.description}
                      </p>
                    </div>
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Build search parameters
    const searchParams = new URLSearchParams();
    if (query) searchParams.append('q', query as string);
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
          user = userData.user;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }

    const filters: FilterState = {
      uploadDate: (uploadDate as string) || '',
      duration: (duration as string) || '',
      quality: (quality as string) || '',
      viewCount: (viewCount as string) || '',
      sort: (sort as string) || 'relevance',
      category: (category as string) || ''
    };

    return {
      props: {
        videos,
        user,
        query: query || '',
        filters
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