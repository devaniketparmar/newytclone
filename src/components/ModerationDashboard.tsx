import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

import { api } from '../lib/axios';
interface ModerationDashboardProps {
  className?: string;
}

interface ModerationStats {
  reports: {
    total: number;
    pending: number;
    resolved: number;
    resolutionRate: number;
  };
  moderation: {
    total: number;
    pending: number;
  };
  blacklist: {
    count: number;
  };
  recentActivity: Array<{
    id: string;
    reason: string;
    status: string;
    createdAt: string;
    hashtag: { name: string };
    reporter: { username: string };
  }>;
}

interface ModerationItem {
  id: string;
  action: string;
  reason?: string;
  status: string;
  createdAt: string;
  hashtag: {
    id: string;
    name: string;
    usageCount: number;
    followerCount: number;
    trendingScore: number;
  };
  moderator?: {
    id: string;
    username: string;
    avatarUrl: string;
  };
}

const ModerationDashboard: React.FC<ModerationDashboardProps> = ({ className = '' }) => {
  const router = useRouter();
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [moderationItems, setModerationItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'reports' | 'blacklist'>('overview');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'overview') {
        const response = await api.get('/api/hashtags/moderation?action=stats');
        if (response.status === 200) {
          const data = response.data as any;
          if (data.success) {
            setStats(data.data);
          } else {
            setError(data.error || 'Failed to fetch stats');
          }
        }
      } else if (activeTab === 'queue') {
        const response = await api.get('/api/hashtags/moderation?action=list&status=PENDING');
        if (response.status === 200) {
          const data = response.data as any;
          if (data.success) {
            setModerationItems(data.data.items);
          } else {
            setError(data.error || 'Failed to fetch moderation queue');
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleModerationAction = async (hashtagId: string, action: string, reason?: string) => {
    try {
      setActionLoading(hashtagId);
      
      const response = await api.post('/api/hashtags/moderation?action=moderate', {
        hashtagId,
        action,
        reason,
      });

      if (response.status === 200) {
        const data = response.data as any;
        if (data.success) {
          // Refresh the data
          await fetchData();
        } else {
          setError(data.error || 'Failed to perform moderation action');
        }
      } else {
        setError('Failed to perform moderation action');
      }
    } catch (error: any) {
      console.error('Error performing moderation action:', error);
      setError('An error occurred while performing the action');
    } finally {
      setActionLoading(null);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      case 'ESCALATED': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'APPROVE': return 'text-green-600 hover:bg-green-50';
      case 'REJECT': return 'text-red-600 hover:bg-red-50';
      case 'WARN': return 'text-yellow-600 hover:bg-yellow-50';
      case 'SUSPEND': return 'text-orange-600 hover:bg-orange-50';
      case 'DELETE': return 'text-red-700 hover:bg-red-50';
      default: return 'text-gray-600 hover:bg-gray-50';
    }
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchData}
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
              <span className="mr-3 text-red-600">🛡️</span>
              Hashtag Moderation Dashboard
            </h2>
            <p className="text-gray-600 mt-1">
              Manage hashtag content and community safety
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'queue', label: 'Moderation Queue', icon: '⏳' },
            { id: 'reports', label: 'Reports', icon: '🚨' },
            { id: 'blacklist', label: 'Blacklist', icon: '🚫' },
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
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 font-medium">Total Reports</p>
                    <p className="text-2xl font-bold text-red-900">{formatNumber(stats.reports.total)}</p>
                    <p className="text-sm text-red-600">
                      {stats.reports.pending} pending
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-200 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Resolution Rate</p>
                    <p className="text-2xl font-bold text-green-900">{stats.reports.resolutionRate.toFixed(1)}%</p>
                    <p className="text-sm text-green-600">
                      {stats.reports.resolved} resolved
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Pending Actions</p>
                    <p className="text-2xl font-bold text-yellow-900">{stats.moderation.pending}</p>
                    <p className="text-sm text-yellow-600">
                      {stats.moderation.total} total actions
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-200 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Blacklisted</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.blacklist.count}</p>
                    <p className="text-sm text-gray-600">
                      Hashtags blocked
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          #{activity.hashtag.name} reported for {activity.reason.toLowerCase()}
                        </p>
                        <p className="text-xs text-gray-600">
                          by {activity.reporter.username} • {formatTimeAgo(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Moderation Queue</h3>
            {moderationItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                <p className="text-gray-600">No pending moderation actions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {moderationItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-900">#{item.hashtag.name}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{formatTimeAgo(item.createdAt)}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-600">Usage</p>
                        <p className="font-semibold">{formatNumber(item.hashtag.usageCount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Followers</p>
                        <p className="font-semibold">{formatNumber(item.hashtag.followerCount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Trending Score</p>
                        <p className="font-semibold">{item.hashtag.trendingScore.toFixed(0)}</p>
                      </div>
                    </div>

                    {item.reason && (
                      <p className="text-sm text-gray-600 mb-4">{item.reason}</p>
                    )}

                    <div className="flex space-x-2">
                      {['APPROVE', 'WARN', 'SUSPEND', 'DELETE'].map((action) => (
                        <button
                          key={action}
                          onClick={() => handleModerationAction(item.hashtag.id, action)}
                          disabled={actionLoading === item.hashtag.id}
                          className={`px-3 py-1 text-sm rounded-lg transition-colors ${getActionColor(action)} ${
                            actionLoading === item.hashtag.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {actionLoading === item.hashtag.id ? 'Processing...' : action}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reports and Blacklist tabs would have similar detailed views */}
        {activeTab === 'reports' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports Management</h3>
            <p className="text-gray-600">Detailed reports view coming soon!</p>
          </div>
        )}

        {activeTab === 'blacklist' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Blacklist Management</h3>
            <p className="text-gray-600">Blacklist management interface coming soon!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModerationDashboard;
