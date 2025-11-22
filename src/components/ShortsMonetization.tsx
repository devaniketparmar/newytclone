import React, { useState, useEffect } from 'react';
import UniversalLayout from './UniversalLayout';
import PageHeader from './PageHeader';

interface ShortsMonetizationData {
  eligibility: {
    isEligible: boolean;
    requirements: Array<{
      requirement: string;
      status: 'met' | 'not_met';
      currentValue?: number;
      requiredValue?: number;
    }>;
  };
  revenue: {
    totalEarnings: number;
    monthlyEarnings: number;
    shortsFundEarnings: number;
    adRevenue: number;
    estimatedMonthlyEarnings: number;
  };
  performance: {
    totalViews: number;
    totalShorts: number;
    averageViewsPerShort: number;
    engagementRate: number;
    subscriberGrowth: number;
  };
  shortsFund: {
    isEligible: boolean;
    monthlyPool: number;
    estimatedShare: number;
    lastPayment: string;
    nextPayment: string;
  };
  tips: Array<{
    title: string;
    description: string;
    category: 'content' | 'engagement' | 'growth' | 'monetization';
  }>;
}

interface ShortsMonetizationProps {
  user?: any;
}

export default function ShortsMonetization({ user }: ShortsMonetizationProps) {
  const [monetizationData, setMonetizationData] = useState<ShortsMonetizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'earnings' | 'requirements' | 'tips'>('overview');

  useEffect(() => {
    fetchMonetizationData();
  }, []);

  const fetchMonetizationData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/shorts/monetization', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMonetizationData(data.data);
      } else {
        setError('Failed to load monetization data');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching monetization data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-800">Loading monetization data...</p>
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
          <h3 className="text-xl font-semibold mb-2">Failed to load monetization data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchMonetizationData}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!monetizationData) {
    return null;
  }

  return (
    <UniversalLayout 
      user={user}
      pageHeader={
        <PageHeader
          title="Shorts Monetization"
          subtitle="Earn money from your Shorts content"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
          iconColor="bg-gradient-to-r from-green-500 to-emerald-500"
        />
      }
    >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-gray-200 rounded-lg p-1">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'earnings', label: 'Earnings', icon: '💰' },
                { id: 'requirements', label: 'Requirements', icon: '✅' },
                { id: 'tips', label: 'Tips', icon: '💡' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Eligibility Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Monetization Status</h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    monetizationData.eligibility.isEligible
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {monetizationData.eligibility.isEligible ? 'Eligible' : 'Not Eligible'}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  {monetizationData.eligibility.isEligible
                    ? 'Congratulations! You can start earning money from your Shorts.'
                    : 'Complete the requirements below to start monetizing your Shorts.'}
                </p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(monetizationData.revenue.totalEarnings)}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Monthly Earnings</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(monetizationData.revenue.monthlyEarnings)}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Views</p>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(monetizationData.performance.totalViews)}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{monetizationData.performance.engagementRate.toFixed(1)}%</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shorts Fund */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Shorts Fund</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Pool</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(monetizationData.shortsFund.monthlyPool)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Your Estimated Share</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(monetizationData.shortsFund.estimatedShare)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Next Payment</p>
                    <p className="text-xl font-bold text-gray-900">{monetizationData.shortsFund.nextPayment}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === 'earnings' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Breakdown */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Ad Revenue</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(monetizationData.revenue.adRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Shorts Fund</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(monetizationData.revenue.shortsFundEarnings)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">Total Earnings</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(monetizationData.revenue.totalEarnings)}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Shorts</span>
                      <span className="text-sm font-bold text-gray-900">{monetizationData.performance.totalShorts}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Average Views per Short</span>
                      <span className="text-sm font-bold text-gray-900">{formatNumber(monetizationData.performance.averageViewsPerShort)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Engagement Rate</span>
                      <span className="text-sm font-bold text-gray-900">{monetizationData.performance.engagementRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Subscriber Growth</span>
                      <span className="text-sm font-bold text-gray-900">+{formatNumber(monetizationData.performance.subscriberGrowth)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estimated Monthly Earnings */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Estimated Monthly Earnings</h3>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 mb-2">{formatCurrency(monetizationData.revenue.estimatedMonthlyEarnings)}</p>
                  <p className="text-sm text-gray-600">Based on current performance trends</p>
                </div>
              </div>
            </div>
          )}

          {/* Requirements Tab */}
          {activeTab === 'requirements' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monetization Requirements</h3>
                <div className="space-y-4">
                  {monetizationData.eligibility.requirements.map((requirement, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          requirement.status === 'met' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {requirement.status === 'met' ? (
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{requirement.requirement}</p>
                          {requirement.currentValue !== undefined && requirement.requiredValue !== undefined && (
                            <p className="text-xs text-gray-600">
                              {requirement.currentValue.toLocaleString()} / {requirement.requiredValue.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        requirement.status === 'met'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {requirement.status === 'met' ? 'Met' : 'Not Met'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tips Tab */}
          {activeTab === 'tips' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {monetizationData.tips.map((tip, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tip.category === 'content' ? 'bg-blue-100' :
                        tip.category === 'engagement' ? 'bg-green-100' :
                        tip.category === 'growth' ? 'bg-purple-100' :
                        'bg-orange-100'
                      }`}>
                        {tip.category === 'content' ? '📝' :
                         tip.category === 'engagement' ? '💬' :
                         tip.category === 'growth' ? '📈' :
                         '💰'}
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900">{tip.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600">{tip.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </UniversalLayout>
  );
}