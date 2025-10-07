import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import UniversalLayout from '@/components/UniversalLayout';
import SearchHeader from '@/components/SearchHeader';
import LoadingPlaceholder from '@/components/LoadingPlaceholder';
import VideoMenu from '@/components/VideoMenu';

import { api } from '../lib/axios';
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
  filters?: {
    category?: string;
    duration?: string;
    uploadDate?: string;
    sort?: string;
  };
}

export default function SearchPage({ videos, user, query, filters }: SearchPageProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(query || '');
  const [searchResults, setSearchResults] = useState(videos || []);
  const [loading, setLoading] = useState(false);
  const [currentFilters, setCurrentFilters] = useState(filters || {
    category: 'all',
    duration: 'all',
    uploadDate: 'all',
    sort: 'relevance'
  });

  // Ensure user is defined
  const currentUser = user || null;

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
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      params.append('page', '1');
      params.append('limit', '20');
      
      // Add current filters
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });
      
      const response = await api.get(`/api/search?${params.toString()}`);
      if (response.status === 200) {
        const data = response.data;
        setSearchResults(data.data.videos || []);
      }
    } catch (error) {
      console.error('Error searching videos:', error);
    } finally {
      setLoading(false);
    }
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
      
      const response = await api.get(`/api/search?${params.toString()}`);
      if (response.status === 200) {
        const data = response.data;
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
        <SearchHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          showViewToggle={false}
        />
      }
    >
      <div className="min-h-screen bg-neutral-50">
        {/* Search Results Header */}
        <div className="bg-white border-b border-neutral-200 px-4 py-3">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-lg font-medium text-neutral-900">
                  Search results for "{searchQuery}"
                </h1>
                <span className="text-sm text-neutral-500">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {/* Filter Buttons */}
              <div className="flex items-center space-x-2">
                <select
                  value={currentFilters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-md text-sm bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="relevance">Sort by relevance</option>
                  <option value="date">Sort by upload date</option>
                  <option value="viewCount">Sort by view count</option>
                  <option value="rating">Sort by rating</option>
                </select>
                
                <select
                  value={currentFilters.duration}
                  onChange={(e) => handleFilterChange('duration', e.target.value)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-md text-sm bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">Any duration</option>
                  <option value="1">Under 4 minutes</option>
                  <option value="2">4-20 minutes</option>
                  <option value="3">Over 20 minutes</option>
                </select>
                
                <select
                  value={currentFilters.uploadDate}
                  onChange={(e) => handleFilterChange('uploadDate', e.target.value)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-md text-sm bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">Any time</option>
                  <option value="hour">Last hour</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                  <option value="year">This year</option>
                </select>
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
    const { q: query, category, duration, uploadDate, sort } = context.query;
    
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
          category: category || 'all',
          duration: duration || 'all',
          uploadDate: uploadDate || 'all',
          sort: sort || 'relevance'
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
