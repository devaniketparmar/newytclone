import React, { useState, useEffect } from 'react';
import UniversalLayout from './UniversalLayout';
import PageHeader from './PageHeader';

interface ShortsAnalyticsData {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSubscribers: number;
  averageWatchTime: number;
  clickThroughRate: number;
  engagementRate: number;
  topPerformingShorts: Array<{
    id: string;
    title: string;
    thumbnailUrl: string;
    views: number;
    likes: number;
    comments: number;
    publishedAt: string;
  }>;
  viewsOverTime: Array<{
    date: string;
    views: number;
  }>;
  demographics: {
    ageGroups: Array<{
      ageGroup: string;
      percentage: number;
    }>;
    genders: Array<{
      gender: string;
      percentage: number;
    }>;
    countries: Array<{
      country: string;
      percentage: number;
    }>;
  };
  trafficSources: Array<{
    source: string;
    percentage: number;
  }>;
}

interface ShortsAnalyticsProps {
  user?: any;
}

export default function ShortsAnalytics({ user }: ShortsAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<ShortsAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/shorts/analytics?timeRange=${timeRange}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.data);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching analytics:', err);
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
    return `${num.toFixed(1)}%`;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-800">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold mb-2">Failed to load analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return null;
  }

  return (
    <UniversalLayout 
      user={user}
      pageHeader={
        <PageHeader
          title="Shorts Analytics"
          subtitle="Track your Shorts performance and audience insights"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          iconColor="bg-gradient-to-r from-purple-500 to-pink-500"
          actions={
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          }
        />
      }
    >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.totalViews)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Likes</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.totalLikes)}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPercentage(analyticsData.engagementRate)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Watch Time</p>
                  <p className="text-2xl font-bold text-gray-900">{formatDuration(analyticsData.averageWatchTime)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Views Over Time Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Views Over Time</h3>
              <div className="h-64 flex items-end justify-between space-x-1">
                {analyticsData.viewsOverTime.map((data, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className="bg-gradient-to-t from-purple-500 to-pink-500 rounded-t w-8 transition-all duration-500"
                      style={{ height: `${(data.views / Math.max(...analyticsData.viewsOverTime.map(d => d.views))) * 200}px` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">{data.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performing Shorts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Shorts</h3>
              <div className="space-y-4">
                {analyticsData.topPerformingShorts.map((short, index) => (
                  <div key={short.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={short.thumbnailUrl || '/api/placeholder/48/48'}
                        alt={short.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{short.title}</h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">{formatNumber(short.views)} views</span>
                        <span className="text-xs text-gray-500">{formatNumber(short.likes)} likes</span>
                        <span className="text-xs text-gray-500">{formatNumber(short.comments)} comments</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">#{index + 1}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Demographics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Demographics</h3>
              <div className="space-y-6">
                {/* Age Groups */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Age Groups</h4>
                  <div className="space-y-2">
                    {analyticsData.demographics.ageGroups.map((ageGroup, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{ageGroup.ageGroup}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${ageGroup.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12 text-right">
                            {formatPercentage(ageGroup.percentage)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Countries */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Top Countries</h4>
                  <div className="space-y-2">
                    {analyticsData.demographics.countries.slice(0, 5).map((country, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{country.country}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${country.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12 text-right">
                            {formatPercentage(country.percentage)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Traffic Sources */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
              <div className="space-y-4">
                {analyticsData.trafficSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-purple-500' :
                        index === 1 ? 'bg-pink-500' :
                        index === 2 ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`}></div>
                      <span className="text-sm text-gray-600">{source.source}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatPercentage(source.percentage)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UniversalLayout>
  );
}