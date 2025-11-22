import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ShortsAnalytics from './ShortsAnalytics';
import ShortsMonetization from './ShortsMonetization';

interface CreatorDashboard {
  channelId: string;
  channelName: string;
  avatarUrl: string;
  subscriberCount: number;
  totalVideos: number;
  totalViews: number;
  totalEarnings: number;
  recentVideos: Array<{
    id: string;
    title: string;
    thumbnailUrl: string;
    viewCount: number;
    likeCount: number;
    publishedAt: string;
    earnings: number;
  }>;
  performance: {
    viewsGrowth: number;
    subscriberGrowth: number;
    earningsGrowth: number;
    engagementRate: number;
  };
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    achieved: boolean;
    progress: number;
    target: number;
  }>;
}

interface ShortsCreatorDashboardProps {
  channelId?: string;
}

export default function ShortsCreatorDashboard({ channelId }: ShortsCreatorDashboardProps) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<CreatorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'monetization' | 'content'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchDashboardData();
  }, [channelId, timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (channelId) params.append('channelId', channelId);
      params.append('timeRange', timeRange);
      
      const response = await fetch(`/api/dashboard/shorts-creator?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setDashboard(data.data?.dashboard);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-neutral-600">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No Dashboard Data</h3>
          <p className="text-neutral-600">Unable to load creator dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src={dashboard.avatarUrl || '/api/placeholder/60/60'}
            alt={dashboard.channelName}
            className="w-15 h-15 rounded-full object-cover"
          />
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{dashboard.channelName}</h1>
            <p className="text-neutral-600">Creator Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <button
            onClick={() => router.push('/upload?type=short')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Create Short
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-neutral-200">
          <div className="text-2xl font-bold text-neutral-900">{formatNumber(dashboard.subscriberCount)}</div>
          <div className="text-sm text-neutral-600">Subscribers</div>
          <div className={`text-xs ${dashboard.performance.subscriberGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercentage(dashboard.performance.subscriberGrowth)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-neutral-200">
          <div className="text-2xl font-bold text-neutral-900">{formatNumber(dashboard.totalViews)}</div>
          <div className="text-sm text-neutral-600">Total Views</div>
          <div className={`text-xs ${dashboard.performance.viewsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercentage(dashboard.performance.viewsGrowth)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-neutral-200">
          <div className="text-2xl font-bold text-neutral-900">{formatNumber(dashboard.totalVideos)}</div>
          <div className="text-sm text-neutral-600">Total Videos</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-neutral-200">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(dashboard.totalEarnings)}</div>
          <div className="text-sm text-neutral-600">Total Earnings</div>
          <div className={`text-xs ${dashboard.performance.earningsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercentage(dashboard.performance.earningsGrowth)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-neutral-200">
        <div className="border-b border-neutral-200">
          <nav className="flex space-x-8 px-6">
            {(['overview', 'analytics', 'monetization', 'content'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Performance Overview */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Performance Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Engagement Rate</span>
                      <span className="font-medium">{dashboard.performance.engagementRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(dashboard.performance.engagementRate, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Views Growth</span>
                      <span className={`font-medium ${dashboard.performance.viewsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(dashboard.performance.viewsGrowth)}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          dashboard.performance.viewsGrowth >= 0 ? 'bg-green-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${Math.min(Math.abs(dashboard.performance.viewsGrowth), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Milestones</h3>
                <div className="space-y-3">
                  {dashboard.milestones.map((milestone) => (
                    <div key={milestone.id} className="p-4 border border-neutral-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-neutral-900">{milestone.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          milestone.achieved ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-800'
                        }`}>
                          {milestone.achieved ? 'Achieved' : 'In Progress'}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mb-2">{milestone.description}</p>
                      {!milestone.achieved && (
                        <div className="w-full bg-neutral-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((milestone.progress / milestone.target) * 100, 100)}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Videos */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Videos</h3>
                <div className="space-y-3">
                  {dashboard.recentVideos.map((video) => (
                    <div key={video.id} className="flex items-center space-x-4 p-3 bg-neutral-50 rounded-lg">
                      <img
                        src={video.thumbnailUrl || '/api/placeholder/60/60'}
                        alt={video.title}
                        className="w-15 h-15 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-neutral-900 truncate">{video.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-neutral-600">
                          <span>{formatNumber(video.viewCount)} views</span>
                          <span>{formatNumber(video.likeCount)} likes</span>
                          <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(video.earnings)}
                        </div>
                        <div className="text-xs text-neutral-500">Earnings</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <ShortsAnalytics channelId={channelId} timeRange={timeRange} />
          )}

          {activeTab === 'monetization' && (
            <ShortsMonetization channelId={channelId} timeRange={timeRange} />
          )}

          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900">Content Management</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push('/upload?type=short')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Upload Short
                  </button>
                  <button
                    onClick={() => router.push('/studio')}
                    className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Studio
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 16h14l-2-16M9 8v8M15 8v8" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-neutral-900">Create Short</h4>
                  </div>
                  <p className="text-sm text-neutral-600 mb-3">Record and upload short videos</p>
                  <button
                    onClick={() => router.push('/upload?type=short')}
                    className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Creating
                  </button>
                </div>

                <div className="p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-neutral-900">Analytics</h4>
                  </div>
                  <p className="text-sm text-neutral-600 mb-3">Track your video performance</p>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    View Analytics
                  </button>
                </div>

                <div className="p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-neutral-900">Monetization</h4>
                  </div>
                  <p className="text-sm text-neutral-600 mb-3">Manage your earnings</p>
                  <button
                    onClick={() => setActiveTab('monetization')}
                    className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    View Earnings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

