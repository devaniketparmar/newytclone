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
  dislikeCount: number;
  commentCount: number;
  createdAt: string;
  publishedAt: string;
  status: 'PROCESSING' | 'READY' | 'FAILED';
  channel: {
    id: string;
    name: string;
    avatarUrl: string;
    subscriberCount: number;
    userId: string;
  };
}

interface TrendingPageProps {
  videos: Video[];
  user?: any;
  filters: {
    category: string;
    period: string;
    limit: number;
  };
  insights?: {
    totalVideos: number;
    averageScore: number;
    topCategories: Array<{category: string, count: number}>;
    trendingFactors: {
      averageViews: number;
      averageEngagement: number;
      averageRecency: number;
    };
  };
}

export default function TrendingPage({ videos: initialVideos, user, filters: initialFilters, insights }: TrendingPageProps) {
  const router = useRouter();
  const [videos, setVideos] = useState(initialVideos);
  const [loading, setLoading] = useState(false);
  const [currentFilters, setCurrentFilters] = useState(initialFilters);
  const [showInsights, setShowInsights] = useState(false);

  const currentUser = user || null;

  // Format duration helper
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format view count helper
  const formatViewCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Format time ago helper
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;

    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  // Handle filter changes
  const handleFilterChange = async (filterType: string, value: string) => {
    setLoading(true);
    const newFilters = { ...currentFilters, [filterType]: value };
    setCurrentFilters(newFilters);

    try {
      const params = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, val]) => {
        if (val && val !== 'all') {
          params.append(key, val);
        }
      });

      const response = await api.get(`/api/videos/trending?${params.toString()}`);
      if (response.status === 200) {
        const data = response.data;
        setVideos(data.data?.videos || []);
      }
    } catch (error) {
      console.error('Error fetching trending videos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter options
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'music', label: 'Music' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'education', label: 'Education' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'technology', label: 'Technology' },
    { value: 'sports', label: 'Sports' },
    { value: 'news', label: 'News' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'science', label: 'Science' }
  ];

  const periodOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  return (
    <UniversalLayout 
      user={currentUser}
      showHeader={true}
      headerContent={
        <SearchHeader
          searchQuery=""
          onSearchChange={() => {}}
          showViewToggle={false}
          compact={false}
        />
      }
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  🔥 Trending
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({videos.length} videos)
                  </span>
                </h1>
                <p className="text-gray-600 mt-1">
                  Discover the most popular videos right now
                </p>
              </div>
              
              {insights && (
                <button
                  onClick={() => setShowInsights(!showInsights)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {showInsights ? 'Hide' : 'Show'} Insights
                </button>
              )}
            </div>

            {/* Insights Panel */}
            {showInsights && insights && (
              <div className="mt-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border border-red-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{insights.totalVideos}</div>
                    <div className="text-sm text-gray-600">Total Trending Videos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{insights.averageScore.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Average Trending Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{insights.trendingFactors.averageViews.toFixed(0)}</div>
                    <div className="text-sm text-gray-600">Average Views</div>
                  </div>
                </div>
                
                {insights.topCategories.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {insights.topCategories.map((cat, index) => (
                        <span key={index} className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border">
                          {cat.category} ({cat.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Category:</label>
                <select
                  value={currentFilters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Period:</label>
                <select
                  value={currentFilters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {periodOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {loading ? (
            <LoadingPlaceholder type="video-list" count={5} />
          ) : videos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No trending videos found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or check back later for new trending content
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {videos.map((video, index) => (
                <div
                  key={video.id}
                  onClick={() => router.push(`/video/${video.id}`)}
                  className="flex space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                >
                  {/* Ranking */}
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full font-bold text-lg">
                    {index + 1}
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-80 h-48 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 group">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-500">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(video.duration)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
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
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <img
                          src={video.channel.avatarUrl || '/default-avatar.png'}
                          alt={video.channel.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm text-gray-700">{video.channel.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-700">{formatViewCount(video.viewCount)} views</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-700">{formatTimeAgo(video.publishedAt)}</span>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {video.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{formatViewCount(video.likeCount)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{formatViewCount(video.commentCount)}</span>
                      </div>
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
    const { category = 'all', period = 'all', limit = '20', includeInsights = 'false' } = context.query;
    
    const protocol = context.req.headers['x-forwarded-proto'] || 'http';
    const host = context.req.headers.host;
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : `${protocol}://${host}`;

    // Build query parameters
    const params = new URLSearchParams();
    if (category !== 'all') params.append('category', category as string);
    if (period !== 'all') params.append('period', period as string);
    params.append('limit', limit as string);
    if (includeInsights === 'true') params.append('includeInsights', 'true');

    // Fetch trending videos
    const response = await fetch(`${baseUrl}/api/videos/trending?${params.toString()}`);
    let videos = [];
    let insights = null;

    if (response.status === 200) {
      const data = await response.json();
      videos = data.data.videos || [];
      insights = data.data.insights || null;
    }

    // Try to get user data
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
          user = userData.data?.user || null;
        }
      } catch (error) {
        console.log('Could not fetch user data:', error);
      }
    }

    return {
      props: {
        videos,
        user,
        filters: {
          category: category as string,
          period: period as string,
          limit: parseInt(limit as string, 10)
        },
        insights
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        videos: [],
        user: null,
        filters: {
          category: 'all',
          period: 'all',
          limit: 20
        },
        insights: null
      }
    };
  }
};
