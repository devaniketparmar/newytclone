import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

import { api } from '../lib/axios';
interface HashtagAnalyticsProps {
  hashtag: string;
  className?: string;
}

interface AnalyticsData {
  hashtag: {
    id: string;
    name: string;
    usageCount: number;
    followerCount: number;
    trendingScore: number;
    createdAt: string;
  };
  metrics: {
    totalViews: number;
    totalEngagement: number;
    totalNewFollowers: number;
    totalVideosAdded: number;
    averageTrendingScore: number;
    viewsGrowthRate: number;
    engagementRate: number;
  };
  analytics: Array<{
    date: string;
    views: number;
    engagement: number;
    newFollowers: number;
    videosAdded: number;
    trendingScore: number;
  }>;
  recentVideos: Array<{
    id: string;
    title: string;
    thumbnailUrl?: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    publishedAt: string;
    channel: {
      id: string;
      name: string;
      avatarUrl: string;
      subscriberCount: number;
    };
  }>;
  period: string;
  generatedAt: string;
}

interface TrendingData {
  trendingHashtags: Array<{
    id: string;
    name: string;
    usageCount: number;
    followerCount: number;
    trendingScore: number;
    metrics: {
      totalViews: number;
      totalEngagement: number;
      totalNewFollowers: number;
      engagementRate: number;
    };
    growth: {
      viewsGrowth: number;
      followersGrowth: number;
    };
  }>;
  period: string;
  generatedAt: string;
}

const HashtagAnalytics: React.FC<HashtagAnalyticsProps> = ({ hashtag, className = '' }) => {
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [trendingData, setTrendingData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'trending' | 'performance' | 'comparison'>('overview');
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [hashtag, period, activeTab]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        hashtag,
        period,
        action: activeTab,
      });

      const response = await api.get(`/api/hashtags/analytics?${params.toString()}`);
      
      if (response.status === 200) {
        const data = response.data as any;
        if (data.success) {
          if (activeTab === 'trending') {
            setTrendingData(data.data);
          } else {
            setAnalyticsData(data.data);
          }
        } else {
          setError(data.error || 'Failed to fetch analytics data');
        }
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('An error occurred while fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getGrowthColor = (rate: number): string => {
    if (rate > 0) return 'text-green-600';
    if (rate < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (rate: number): string => {
    if (rate > 0) return '↗';
    if (rate < 0) return '↘';
    return '→';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className}`}>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analytics</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchAnalyticsData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-3 text-red-600">📊</span>
              Hashtag Analytics
            </h2>
            <p className="text-gray-600 mt-1">
              Performance insights for #{hashtag}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: '📈' },
            { id: 'trending', label: 'Trending', icon: '🔥' },
            { id: 'performance', label: 'Performance', icon: '⚡' },
            { id: 'comparison', label: 'Comparison', icon: '📊' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && analyticsData && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Views</p>
                    <p className="text-2xl font-bold text-blue-900">{formatNumber(analyticsData.metrics.totalViews)}</p>
                    <p className={`text-sm ${getGrowthColor(analyticsData.metrics.viewsGrowthRate)}`}>
                      {getGrowthIcon(analyticsData.metrics.viewsGrowthRate)} {formatPercentage(analyticsData.metrics.viewsGrowthRate)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Engagement</p>
                    <p className="text-2xl font-bold text-green-900">{formatNumber(analyticsData.metrics.totalEngagement)}</p>
                    <p className="text-sm text-green-600">
                      {analyticsData.metrics.engagementRate.toFixed(1)}% rate
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">New Followers</p>
                    <p className="text-2xl font-bold text-purple-900">{formatNumber(analyticsData.metrics.totalNewFollowers)}</p>
                    <p className="text-sm text-purple-600">
                      {analyticsData.hashtag.followerCount.toLocaleString()} total
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Trending Score</p>
                    <p className="text-2xl font-bold text-orange-900">{analyticsData.metrics.averageTrendingScore.toFixed(0)}</p>
                    <p className="text-sm text-orange-600">
                      {analyticsData.metrics.totalVideosAdded} new videos
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Videos */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Videos</h3>
              <div className="space-y-3">
                {analyticsData.recentVideos.slice(0, 5).map((video) => (
                  <div
                    key={video.id}
                    onClick={() => router.push(`/video/${video.id}`)}
                    className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <img
                      src={video.thumbnailUrl || '/placeholder-thumbnail.jpg'}
                      alt={video.title}
                      className="w-16 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{video.title}</h4>
                      <p className="text-xs text-gray-600">{video.channel.name}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>{formatNumber(video.viewCount)} views</span>
                        <span>{formatNumber(video.likeCount)} likes</span>
                        <span>{formatTimeAgo(video.publishedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trending' && trendingData && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Trending Hashtags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trendingData.trendingHashtags.map((trend, index) => (
                <div
                  key={trend.id}
                  onClick={() => router.push(`/hashtag/${trend.name}`)}
                  className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg hover:from-red-100 hover:to-orange-100 transition-colors cursor-pointer border border-red-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-red-600">#{trend.name}</span>
                      <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">
                        #{index + 1}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-red-600">
                      {trend.trendingScore.toFixed(0)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Views</p>
                      <p className="font-semibold">{formatNumber(trend.metrics.totalViews)}</p>
                      <p className={`text-xs ${getGrowthColor(trend.growth.viewsGrowth)}`}>
                        {getGrowthIcon(trend.growth.viewsGrowth)} {formatPercentage(trend.growth.viewsGrowth)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Followers</p>
                      <p className="font-semibold">{formatNumber(trend.followerCount)}</p>
                      <p className={`text-xs ${getGrowthColor(trend.growth.followersGrowth)}`}>
                        {getGrowthIcon(trend.growth.followersGrowth)} {formatPercentage(trend.growth.followersGrowth)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance and Comparison tabs would have similar detailed charts and metrics */}
        {activeTab === 'performance' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Analytics</h3>
            <p className="text-gray-600">Detailed performance metrics and charts coming soon!</p>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Comparison Analytics</h3>
            <p className="text-gray-600">Compare with similar hashtags coming soon!</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Last updated: {analyticsData ? formatTimeAgo(analyticsData.generatedAt) : 'Never'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HashtagAnalytics;
