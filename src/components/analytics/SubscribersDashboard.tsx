import React, { useState, useEffect } from 'react';
import Chart from './Chart';
import { ClientAuth } from '../../utils/clientAuth';

interface SubscriberData {
  overview: {
    totalSubscribers: number;
    periodGrowth: number;
    previousPeriodGrowth: number;
    growthRate: number;
    avgDailyGrowth: number;
  };
  recentSubscribers: Array<{
    id: string;
    user: {
      id: string;
      username: string;
      avatarUrl: string;
      joinedAt: string;
    };
    subscribedAt: string;
  }>;
  growthTrend: Array<{
    date: string;
    gained: number;
    lost: number;
    net: number;
    total: number;
  }>;
  topVideos: Array<{
    id: string;
    title: string;
    views: number;
    likes: number;
    comments: number;
    thumbnailUrl: string;
    publishedAt: string;
    estimatedSubscribers: number;
  }>;
  activityPatterns: {
    hourly: Array<{ hour: number; subscriptions: number }>;
    weekly: Array<{ day: number; dayName: string; subscriptions: number }>;
    totalSubscriptions: number;
  };
}

interface SubscribersDashboardProps {
  userId: string;
  user?: any;
}

export default function SubscribersDashboard({ userId, user }: SubscribersDashboardProps) {
  const [data, setData] = useState<SubscriberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('28d');
  const [activeTab, setActiveTab] = useState('overview');
  const [activeMetric, setActiveMetric] = useState('overview');

  useEffect(() => {
    fetchSubscribersData();
  }, [period, activeMetric]);

  const fetchSubscribersData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching subscribers data for user:', userId);
      const data = await ClientAuth.fetchSubscribersAnalytics(userId, period, activeMetric);
      setData(data);
    } catch (err) {
      console.error('Subscribers fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return num >= 0 ? `+${num.toFixed(1)}%` : `${num.toFixed(1)}%`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading subscribers data</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchSubscribersData}
                className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No subscribers data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subscribers</h2>
          <p className="text-gray-600">Track your subscriber growth and engagement</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="28d">Last 28 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Subscribers</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(data.overview.totalSubscribers)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">New This Period</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(data.overview.periodGrowth)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className={`h-8 w-8 ${data.overview.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Growth Rate</p>
              <p className={`text-2xl font-bold ${data.overview.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(data.overview.growthRate)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Daily Growth</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(data.overview.avgDailyGrowth)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', metric: 'overview' },
            { id: 'growth', name: 'Growth', metric: 'growth' },
            { id: 'demographics', name: 'Demographics', metric: 'demographics' },
            { id: 'activity', name: 'Activity', metric: 'activity' },
            { id: 'retention', name: 'Retention', metric: 'retention' },
            { id: 'sources', name: 'Sources', metric: 'sources' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setActiveMetric(tab.metric);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Growth Chart */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscriber Growth</h3>
            <div className="h-80">
              <Chart
                data={data.growthTrend}
                type="area"
                xKey="date"
                yKey="total"
                color="#ef4444"
                showGrid={true}
                showTooltip={true}
              />
            </div>
          </div>

          {/* Recent Subscribers */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Subscribers</h3>
            <div className="space-y-3">
              {data.recentSubscribers.map((subscriber) => (
                <div key={subscriber.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <img
                      src={subscriber.user.avatarUrl || '/default-avatar.png'}
                      alt={subscriber.user.username}
                      className="h-10 w-10 rounded-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {subscriber.user.username}
                    </p>
                    <p className="text-sm text-gray-500">
                      Subscribed {formatTimeAgo(subscriber.subscribedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Videos for Subscribers */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Videos for Subscriber Growth</h3>
            <div className="space-y-4">
              {data.topVideos.map((video) => (
                <div key={video.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <img
                    src={video.thumbnailUrl || '/default-thumbnail.jpg'}
                    alt={video.title}
                    className="h-20 w-36 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{video.title}</h4>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatNumber(video.views)} views</span>
                      <span>{formatNumber(video.likes)} likes</span>
                      <span>{formatNumber(video.comments)} comments</span>
                      <span className="text-green-600 font-medium">
                        ~{formatNumber(video.estimatedSubscribers)} subscribers
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'growth' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Trends</h3>
            <div className="h-80">
              <Chart
                data={data.growthTrend}
                type="line"
                xKey="date"
                yKey="net"
                color="#10b981"
                showGrid={true}
                showTooltip={true}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'demographics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscriber Demographics</h3>
            <p className="text-gray-500">Demographics data would be displayed here</p>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Patterns</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Hourly Patterns</h4>
                <div className="h-64">
                  <Chart
                    data={data.activityPatterns.hourly}
                    type="bar"
                    xKey="hour"
                    yKey="subscriptions"
                    color="#3b82f6"
                    showGrid={true}
                    showTooltip={true}
                  />
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Weekly Patterns</h4>
                <div className="h-64">
                  <Chart
                    data={data.activityPatterns.weekly}
                    type="bar"
                    xKey="dayName"
                    yKey="subscriptions"
                    color="#8b5cf6"
                    showGrid={true}
                    showTooltip={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'retention' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscriber Retention</h3>
            <p className="text-gray-500">Retention analysis would be displayed here</p>
          </div>
        </div>
      )}

      {activeTab === 'sources' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscriber Sources</h3>
            <p className="text-gray-500">Acquisition sources would be displayed here</p>
          </div>
        </div>
      )}
    </div>
  );
}
