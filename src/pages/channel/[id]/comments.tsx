import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import UniversalLayout from '@/components/UniversalLayout';

interface Comment {
  id: string;
  content: string;
  likeCount: number;
  dislikeCount: number;
  replyCount: number;
  createdAt: string;
  status: 'ACTIVE' | 'HIDDEN' | 'DELETED';
  pinned: boolean;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  video: {
    id: string;
    title: string;
    thumbnailUrl?: string;
  };
}

interface ChannelCommentsProps {
  user?: any;
  comments?: Comment[];
  totalComments?: number;
}

export default function ChannelComments({ user, comments, totalComments }: ChannelCommentsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const filteredComments = comments?.filter(comment => {
    const matchesSearch = comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         comment.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         comment.video.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || comment.status.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleSelectComment = (commentId: string) => {
    setSelectedComments(prev => 
      prev.includes(commentId) 
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedComments.length === filteredComments.length) {
      setSelectedComments([]);
    } else {
      setSelectedComments(filteredComments.map(comment => comment.id));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedComments.length === 0) return;
    
    setLoading(true);
    try {
      // This would typically make an API call to perform bulk actions
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      alert(`${action} applied to ${selectedComments.length} comments`);
      setSelectedComments([]);
      setShowBulkActions(false);
    } catch (error) {
      alert('Failed to perform bulk action. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAction = async (commentId: string, action: string) => {
    setLoading(true);
    try {
      // This would typically make an API call to perform the action
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      alert(`Comment ${action.toLowerCase()}`);
    } catch (error) {
      alert(`Failed to ${action.toLowerCase()} comment. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <UniversalLayout user={user}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You need to be logged in to access comment management.</p>
            <button
              onClick={() => router.push('/auth')}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </UniversalLayout>
    );
  }

  return (
    <UniversalLayout user={user}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Comment Management</h1>
                <p className="text-gray-600">{formatNumber(totalComments || 0)} total comments</p>
              </div>
              <button
                onClick={() => router.push(`/channel/${user.id}/dashboard`)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* Filters and Bulk Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search comments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="all">All Comments</option>
                  <option value="active">Active</option>
                  <option value="hidden">Hidden</option>
                  <option value="deleted">Deleted</option>
                </select>
              </div>
              
              {selectedComments.length > 0 && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">
                    {selectedComments.length} selected
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleBulkAction('Hide')}
                      disabled={loading}
                      className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
                    >
                      Hide
                    </button>
                    <button
                      onClick={() => handleBulkAction('Delete')}
                      disabled={loading}
                      className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedComments([])}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comments List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {searchQuery ? `Search Results (${filteredComments.length})` : 'All Comments'}
                </h3>
                {filteredComments.length > 0 && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedComments.length === filteredComments.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Select All</span>
                  </label>
                )}
              </div>
            </div>
            <div className="p-6">
              {filteredComments.length > 0 ? (
                <div className="space-y-6">
                  {filteredComments.map((comment) => (
                    <div key={comment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-4">
                        <label className="flex items-start">
                          <input
                            type="checkbox"
                            checked={selectedComments.includes(comment.id)}
                            onChange={() => handleSelectComment(comment.id)}
                            className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                        </label>
                        
                        <div className="flex-1 min-w-0">
                          {/* Comment Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                {comment.user.avatarUrl ? (
                                  <img
                                    src={comment.user.avatarUrl}
                                    alt={comment.user.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">
                                  {comment.user.firstName && comment.user.lastName 
                                    ? `${comment.user.firstName} ${comment.user.lastName}`
                                    : comment.user.username
                                  }
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              {comment.pinned && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Pinned
                                </span>
                              )}
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                comment.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                comment.status === 'HIDDEN' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {comment.status}
                              </span>
                            </div>
                          </div>

                          {/* Comment Content */}
                          <div className="mb-3">
                            <p className="text-sm text-gray-800">{comment.content}</p>
                          </div>

                          {/* Video Context */}
                          <div className="flex items-center space-x-3 mb-3 p-3 bg-gray-50 rounded-lg">
                            <div className="relative w-16 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                              {comment.video.thumbnailUrl ? (
                                <img
                                  src={comment.video.thumbnailUrl}
                                  alt={comment.video.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-medium text-gray-900 truncate">
                                {comment.video.title}
                              </h5>
                              <button
                                onClick={() => router.push(`/video/${comment.video.id}`)}
                                className="text-xs text-blue-600 hover:text-blue-700"
                              >
                                View Video
                              </button>
                            </div>
                          </div>

                          {/* Comment Stats */}
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                            <span>{formatNumber(comment.likeCount)} likes</span>
                            <span>{formatNumber(comment.dislikeCount)} dislikes</span>
                            <span>{formatNumber(comment.replyCount)} replies</span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleCommentAction(comment.id, 'Pin')}
                              disabled={loading}
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                            >
                              {comment.pinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button
                              onClick={() => handleCommentAction(comment.id, 'Hide')}
                              disabled={loading}
                              className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
                            >
                              Hide
                            </button>
                            <button
                              onClick={() => handleCommentAction(comment.id, 'Delete')}
                              disabled={loading}
                              className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => router.push(`/video/${comment.video.id}?comment=${comment.id}`)}
                              className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              View in Context
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery ? 'No comments found' : 'No comments yet'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery 
                      ? 'Try adjusting your search terms.'
                      : 'Comments will appear here once viewers start engaging with your videos.'
                    }
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => router.push('/upload')}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Upload Video
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {filteredComments.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {filteredComments.length} of {totalComments} comments
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Previous
                </button>
                <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </UniversalLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  
  try {
    // Try to get user data from cookies
    let user = null;
    const token = context.req.cookies.token;
    
    if (token) {
      try {
        const protocol = context.req.headers['x-forwarded-proto'] || 'http';
        const host = context.req.headers.host;
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://your-domain.com' 
          : `${protocol}://${host}`;

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

    // For now, we'll return empty data to show proper empty states
    // In production, you would fetch real data from your API here
    const mockComments = []; // Empty array to show "No comments yet" message

    return {
      props: {
        user,
        comments: mockComments,
        totalComments: 0
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        user: null,
        comments: [],
        totalComments: 0
      }
    };
  }
};
