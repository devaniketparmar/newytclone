import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

interface Comment {
  id: string;
  content: string;
  likeCount: number;
  dislikeCount: number;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  pinnedAt?: string;
  pinnedBy?: string;
  user: {
    id: string;
    username: string;
    name: string;
    avatarUrl?: string;
  };
  replies?: Reply[];
}

interface Reply {
  id: string;
  content: string;
  likeCount: number;
  dislikeCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    name: string;
    avatarUrl?: string;
  };
}

interface CommentsProps {
  videoId: string;
  user?: any;
  commentCount: number;
  videoOwnerId?: string; // Add video owner ID
}

export default function Comments({ videoId, user, commentCount, videoOwnerId }: CommentsProps) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({});
  const [autoResize, setAutoResize] = useState(true);
  const [showReportModal, setShowReportModal] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reporting, setReporting] = useState(false);
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);
  const [actualCommentCount, setActualCommentCount] = useState(commentCount);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch comments
  const fetchComments = async (pageNum: number = 1, reset: boolean = true) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/videos/${videoId}/comments?page=${pageNum}&limit=10&sort=${sortBy}`,
        {
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      
      if (data.success) {
        if (reset) {
          setComments(data.data.comments);
          setActualCommentCount(data.data.pagination.total);
          // Show success message for refresh
          if (pageNum === 1) {
            setShowRefreshSuccess(true);
            setTimeout(() => setShowRefreshSuccess(false), 2000);
          }
        } else {
          setComments(prev => [...prev, ...data.data.comments]);
        }
        setHasMore(data.data.pagination.page < data.data.pagination.pages);
      } else {
        throw new Error(data.error || 'Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/auth');
      return;
    }

    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/videos/${videoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: newComment.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }

      const data = await response.json();
      
      if (data.success) {
        setComments(prev => [data.data, ...prev]);
        setNewComment('');
        // Update comment count in parent component
        window.dispatchEvent(new CustomEvent('commentAdded'));
      } else {
        throw new Error(data.error || 'Failed to submit comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      setError('Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit comment
  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/videos/${videoId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: editContent.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update comment');
      }

      const data = await response.json();
      
      if (data.success) {
        // Check if this is a reply (child comment) or main comment
        const isReply = isReplyComment(commentId);
        
        if (isReply) {
          // Update reply within parent comment
          setComments(prev => prev.map(comment => ({
            ...comment,
            replies: comment.replies ? comment.replies.map(reply => 
              reply.id === commentId ? { ...reply, content: editContent.trim(), updatedAt: new Date().toISOString() } : reply
            ) : []
          })));
        } else {
          // Update main comment
          setComments(prev => prev.map(comment => 
            comment.id === commentId ? data.data : comment
          ));
        }
        
        setEditingComment(null);
        setEditContent('');
      } else {
        throw new Error(data.error || 'Failed to update comment');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      setError('Failed to update comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/videos/${videoId}/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      const data = await response.json();
      
      if (data.success) {
        // Check if this is a reply (child comment) or main comment
        const isReply = isReplyComment(commentId);
        
        if (isReply) {
          // Remove reply from parent comment
          setComments(prev => prev.map(comment => ({
            ...comment,
            replies: comment.replies ? comment.replies.filter(reply => reply.id !== commentId) : [],
            replyCount: comment.replies ? comment.replies.filter(reply => reply.id !== commentId).length : 0
          })));
        } else {
          // Remove main comment
          setComments(prev => prev.filter(comment => comment.id !== commentId));
        }
        
        // Update comment count in parent component
        window.dispatchEvent(new CustomEvent('commentDeleted'));
      } else {
        throw new Error(data.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Like/dislike comment
  const handleLikeComment = async (commentId: string, type: 'like' | 'dislike') => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      const response = await fetch(`/api/videos/${videoId}/comments/${commentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ type })
      });

      if (!response.ok) {
        throw new Error('Failed to like comment');
      }

      const data = await response.json();
      
      if (data.success) {
        // Check if this is a reply (child comment) or main comment
        const isReply = isReplyComment(commentId);
        
        if (isReply) {
          // Update like/dislike count for reply
          setComments(prev => prev.map(comment => ({
            ...comment,
            replies: comment.replies ? comment.replies.map(reply => 
              reply.id === commentId 
                ? { 
                    ...reply, 
                    likeCount: data.data.likeCount,
                    dislikeCount: data.data.dislikeCount
                  }
                : reply
            ) : []
          })));
        } else {
          // Update like/dislike count for main comment
          setComments(prev => prev.map(comment => 
            comment.id === commentId 
              ? { 
                  ...comment, 
                  likeCount: data.data.likeCount,
                  dislikeCount: data.data.dislikeCount
                }
              : comment
          ));
        }
      } else {
        throw new Error(data.error || 'Failed to like comment');
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  // Load more comments
  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchComments(nextPage, false);
      
      // Smooth scroll to show the new comments
      setTimeout(() => {
        const loadMoreButton = document.querySelector('[data-load-more-button]');
        if (loadMoreButton) {
          loadMoreButton.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  };

  // Helper function to check if a comment ID is a reply
  const isReplyComment = (commentId: string): boolean => {
    return comments.some(comment => 
      comment.replies && comment.replies.some(reply => reply.id === commentId)
    );
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
    if (autoResize) {
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }
  };

  // Auto-resize reply textarea
  const handleReplyTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyContent(e.target.value);
    if (autoResize) {
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }
  };

  // Toggle replies visibility
  const toggleReplies = (commentId: string) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent, type: 'comment' | 'reply' | 'edit') => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (type === 'comment' && newComment.trim()) {
        handleSubmitComment(e);
      } else if (type === 'reply' && replyContent.trim()) {
        handleReply(replyingTo!);
      } else if (type === 'edit' && editContent.trim()) {
        handleEditComment(editingComment!);
      }
    }
    
    if (e.key === 'Escape') {
      if (type === 'reply') {
        cancelReply();
      } else if (type === 'edit') {
        setEditingComment(null);
        setEditContent('');
      }
    }
  };

  // Report comment
  const handleReportComment = async (commentId: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    if (!reportReason.trim()) {
      setError('Please select a reason for reporting');
      return;
    }

    setReporting(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/comments/${commentId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: reportReason,
          description: reportDescription.trim() || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to report comment');
      }

      const data = await response.json();
      
      if (data.success) {
        setShowReportModal(null);
        setReportReason('');
        setReportDescription('');
        setError(null);
        // Show success message
        alert('Comment reported successfully. Thank you for helping keep our community safe.');
      } else {
        throw new Error(data.error || 'Failed to report comment');
      }
    } catch (error) {
      console.error('Error reporting comment:', error);
      setError('Failed to report comment. Please try again.');
    } finally {
      setReporting(false);
    }
  };

  // Pin/Unpin comment
  const handlePinComment = async (commentId: string, pinned: boolean) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      const method = pinned ? 'DELETE' : 'POST';
      const response = await fetch(`/api/videos/${videoId}/comments/${commentId}/pin`, {
        method,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to ${pinned ? 'unpin' : 'pin'} comment`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update the comment in the state
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            // Update the specific comment that was pinned/unpinned
            return { 
              ...comment, 
              pinned: !pinned,
              pinnedAt: pinned ? null : new Date().toISOString(),
              pinnedBy: pinned ? null : user.id
            };
          } else if (!pinned) {
            // If we're pinning a new comment, unpin all other comments
            return {
              ...comment,
              pinned: false,
              pinnedAt: null,
              pinnedBy: null
            };
          }
          return comment;
        }));
      } else {
        throw new Error(data.error || `Failed to ${pinned ? 'unpin' : 'pin'} comment`);
      }
    } catch (error) {
      console.error(`Error ${pinned ? 'unpinning' : 'pinning'} comment:`, error);
      setError(`Failed to ${pinned ? 'unpin' : 'pin'} comment. Please try again.`);
    }
  };

  // Handle reply
  const handleReply = async (parentCommentId: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    if (!replyContent.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: replyContent.trim(),
          parentId: parentCommentId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit reply');
      }

      const data = await response.json();
      
      if (data.success) {
        // Add the reply to the parent comment's replies array
        setComments(prev => prev.map(comment => {
          if (comment.id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), data.data],
              replyCount: (comment.replyCount || 0) + 1
            };
          }
          return comment;
        }));
        
        // Auto-show replies for the parent comment
        setShowReplies(prev => ({
          ...prev,
          [parentCommentId]: true
        }));
        
        setReplyContent('');
        setReplyingTo(null);
        
        // Update comment count in parent component
        window.dispatchEvent(new CustomEvent('commentAdded'));
      } else {
        throw new Error(data.error || 'Failed to submit reply');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      setError('Failed to submit reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Start replying to a comment
  const startReply = (commentId: string) => {
    setReplyingTo(commentId);
    setReplyContent('');
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  // Effects
  useEffect(() => {
    fetchComments(1, true);
  }, [videoId, sortBy]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newComment]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 mt-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{actualCommentCount.toLocaleString()} Comments</span>
        </h3>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-neutral-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="top">Top comments</option>
          </select>
          
          {/* Refresh Button */}
          <button
            onClick={() => fetchComments(1, true)}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh comments"
          >
            <svg 
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Success Message */}
      {showRefreshSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Comments refreshed successfully!</span>
          </div>
        </div>
      )}

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md flex-shrink-0">
              {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={handleTextareaChange}
                  onKeyDown={(e) => handleKeyDown(e, 'comment')}
                  placeholder="Add a public comment..."
                  className="w-full p-3 border-0 border-b border-gray-300 rounded-none resize-none focus:outline-none focus:border-b-red-500 text-gray-900 transition-all duration-200 bg-transparent"
                  rows={1}
                  maxLength={1000}
                  disabled={submitting}
                />
                <div className="absolute bottom-1 right-1 text-xs text-gray-400 bg-white px-1">
                  {newComment.length}/1000
                </div>
              </div>
              <div className="flex items-center justify-end mt-3 space-x-3">
                <button
                  type="button"
                  onClick={() => setNewComment('')}
                  disabled={!newComment.trim() || submitting}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                >
                  {submitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Posting...</span>
                    </div>
                  ) : (
                    'Comment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-neutral-50 rounded-lg text-center">
          <p className="text-neutral-600 mb-3">Sign in to leave a comment</p>
          <button
            onClick={() => router.push('/auth')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading && comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-800">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-700">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-800">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={`flex space-x-3 group py-4 ${comment.pinned ? 'bg-yellow-50 border-l-4 border-yellow-400 pl-2' : ''}`}>
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md flex-shrink-0">
                {comment.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  {comment.pinned && (
                    <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Pinned by creator</span>
                    </div>
                  )}
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {comment.user.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(comment.createdAt)}
                  </span>
                  {comment.updatedAt !== comment.createdAt && (
                    <span className="text-xs text-gray-400">(edited)</span>
                  )}
                </div>
                
                {editingComment === comment.id ? (
                  <div className="mb-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, 'edit')}
                      className="w-full p-2 border-0 border-b border-gray-300 rounded-none resize-none focus:outline-none focus:border-b-red-500 text-sm text-gray-900 transition-all duration-200 bg-transparent"
                      rows={2}
                      maxLength={1000}
                      autoFocus
                    />
                    <div className="flex items-center justify-end mt-2 space-x-3">
                      <button
                        onClick={() => {
                          setEditingComment(null);
                          setEditContent('');
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleEditComment(comment.id)}
                        disabled={!editContent.trim() || submitting}
                        className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                      >
                        {submitting ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Saving...</span>
                          </div>
                        ) : (
                          'Save'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap line-clamp-4">
                    {comment.content}
                  </p>
                )}

                <div className="flex items-center space-x-6 text-sm text-gray-600 mt-2">
                  <button
                    onClick={() => handleLikeComment(comment.id, 'like')}
                    className="flex items-center space-x-1 hover:text-red-600 transition-colors py-1 px-2 rounded-full hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    <span className="font-medium">{comment.likeCount}</span>
                  </button>
                  
                  <button
                    onClick={() => handleLikeComment(comment.id, 'dislike')}
                    className="flex items-center space-x-1 hover:text-red-600 transition-colors py-1 px-2 rounded-full hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.096c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                    </svg>
                    <span className="font-medium">{comment.dislikeCount}</span>
                  </button>

                  <button 
                    onClick={() => startReply(comment.id)}
                    className="hover:text-red-600 transition-colors py-1 px-2 rounded-full hover:bg-gray-100 font-medium"
                  >
                    Reply
                  </button>

                  {user && user.id === comment.user.id && (
                    <>
                      <button
                        onClick={() => {
                          setEditingComment(comment.id);
                          setEditContent(comment.content);
                        }}
                        className="hover:text-red-600 transition-colors py-1 px-2 rounded-full hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="hover:text-red-600 transition-colors py-1 px-2 rounded-full hover:bg-gray-100"
                      >
                        Delete
                      </button>
                    </>
                  )}

                  {/* Pin/Unpin button for video owner */}
                  {user && videoOwnerId && user.id === videoOwnerId && !comment.parentId && (
                    <button
                      onClick={() => handlePinComment(comment.id, comment.pinned)}
                      className={`transition-colors py-1 px-2 rounded-full hover:bg-gray-100 ${
                        comment.pinned 
                          ? 'text-yellow-600 hover:text-yellow-700' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      {comment.pinned ? 'Unpin' : 'Pin'}
                    </button>
                  )}

                  {/* Report button */}
                  {user && user.id !== comment.user.id && (
                    <button
                      onClick={() => setShowReportModal(comment.id)}
                      className="hover:text-red-600 transition-colors py-1 px-2 rounded-full hover:bg-gray-100"
                    >
                      Report
                    </button>
                  )}
                </div>

                {/* Reply Input Form */}
                {replyingTo === comment.id && (
                  <div className="mt-4 ml-8 border-l-2 border-gray-200 pl-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="relative">
                      {/* Reply Thread Line */}
                      <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      
                      <div className="flex space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-md flex-shrink-0">
                          {user?.firstName ? user.firstName.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="relative">
                            <textarea
                              ref={replyTextareaRef}
                              value={replyContent}
                              onChange={handleReplyTextareaChange}
                              onKeyDown={(e) => handleKeyDown(e, 'reply')}
                              placeholder={`Reply to ${comment.user.name}...`}
                              className="w-full p-2 border-0 border-b border-gray-300 rounded-none resize-none focus:outline-none focus:border-b-red-500 text-sm text-gray-900 transition-all duration-200 bg-transparent"
                              rows={2}
                              maxLength={1000}
                              autoFocus
                            />
                            <div className="absolute bottom-1 right-1 text-xs text-gray-400 bg-white px-1">
                              {replyContent.length}/1000
                            </div>
                          </div>
                          <div className="flex items-center justify-end mt-3 space-x-3">
                            <button
                              onClick={cancelReply}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleReply(comment.id)}
                              disabled={!replyContent.trim() || submitting}
                              className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                            >
                              {submitting ? (
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Replying...</span>
                                </div>
                              ) : (
                                'Reply'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 ml-8 border-l-2 border-gray-200 pl-4">
                    {/* Replies Header */}
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => toggleReplies(comment.id)}
                        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors py-1 px-2 rounded-full hover:bg-gray-100"
                      >
                        <svg 
                          className={`w-4 h-4 transition-transform duration-200 ${showReplies[comment.id] ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        <span className="font-medium">
                          {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                        </span>
                      </button>
                    </div>
                    
                    {showReplies[comment.id] && (
                      <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="relative group py-2">
                            {/* Reply Thread Line */}
                            <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                            
                            <div className="flex space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-md flex-shrink-0">
                                {reply.user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-semibold text-gray-900 truncate">
                                    {reply.user.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatTimeAgo(reply.createdAt)}
                                  </span>
                                  {reply.updatedAt !== reply.createdAt && (
                                    <span className="text-xs text-gray-400">(edited)</span>
                                  )}
                                </div>
                                
                                {editingComment === reply.id ? (
                                  <div className="mb-2">
                                    <textarea
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      onKeyDown={(e) => handleKeyDown(e, 'edit')}
                                      className="w-full p-2 border-0 border-b border-gray-300 rounded-none resize-none focus:outline-none focus:border-b-red-500 text-sm text-gray-900 transition-all duration-200 bg-transparent"
                                      rows={2}
                                      maxLength={1000}
                                      autoFocus
                                    />
                                    <div className="flex items-center justify-end mt-2 space-x-3">
                                      <button
                                        onClick={() => {
                                          setEditingComment(null);
                                          setEditContent('');
                                        }}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleEditComment(reply.id)}
                                        disabled={!editContent.trim() || submitting}
                                        className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                                      >
                                        {submitting ? (
                                          <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Saving...</span>
                                          </div>
                                        ) : (
                                          'Save'
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap leading-relaxed line-clamp-3">
                                    {reply.content}
                                  </p>
                                )}

                                <div className="flex items-center space-x-6 text-sm text-gray-600">
                                  <button
                                    onClick={() => handleLikeComment(reply.id, 'like')}
                                    className="flex items-center space-x-1 hover:text-red-600 transition-colors py-1 px-2 rounded-full hover:bg-gray-100"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                    </svg>
                                    <span className="font-medium">{reply.likeCount}</span>
                                  </button>
                                  
                                  <button
                                    onClick={() => handleLikeComment(reply.id, 'dislike')}
                                    className="flex items-center space-x-1 hover:text-red-600 transition-colors py-1 px-2 rounded-full hover:bg-gray-100"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.096c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                    </svg>
                                    <span className="font-medium">{reply.dislikeCount}</span>
                                  </button>

                                  {user && user.id === reply.user.id && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEditingComment(reply.id);
                                          setEditContent(reply.content);
                                        }}
                                        className="hover:text-red-600 transition-colors py-1 px-2 rounded-full hover:bg-gray-100"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteComment(reply.id)}
                                        className="hover:text-red-600 transition-colors py-1 px-2 rounded-full hover:bg-gray-100"
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Load More Button */}
        {hasMore && comments.length > 0 && (
          <div className="text-center pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={loadMore}
                disabled={loading}
                data-load-more-button
                className="px-8 py-3 bg-white text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading more comments...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span>
                      {actualCommentCount - comments.length <= 10 
                        ? `Load ${actualCommentCount - comments.length} More Comments`
                        : 'Load More Comments'
                      }
                    </span>
                  </div>
                )}
              </button>
              
              {/* Show All Comments Button (when there are many remaining) */}
              {actualCommentCount - comments.length > 20 && (
                <button
                  onClick={() => {
                    // Load all remaining comments
                    const remainingPages = Math.ceil((actualCommentCount - comments.length) / 10);
                    for (let i = 1; i <= remainingPages; i++) {
                      setTimeout(() => {
                        const nextPage = page + i;
                        setPage(nextPage);
                        fetchComments(nextPage, false);
                      }, i * 100);
                    }
                  }}
                  disabled={loading}
                  className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  Show All Comments
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Showing {comments.length} of {actualCommentCount} comments
            </p>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Comment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for reporting
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                >
                  <option value="">Select a reason</option>
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment or bullying</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please provide more details about why you're reporting this comment..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {reportDescription.length}/500 characters
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowReportModal(null);
                  setReportReason('');
                  setReportDescription('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReportComment(showReportModal)}
                disabled={!reportReason.trim() || reporting}
                className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
              >
                {reporting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Reporting...</span>
                  </div>
                ) : (
                  'Report'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
