import React, { useState, useEffect } from 'react';

import { api } from '../lib/axios';
interface HashtagFollowButtonProps {
  hashtag: string;
  initialFollowStatus?: boolean;
  followerCount?: number;
  onFollowChange?: (isFollowing: boolean, newFollowerCount: number) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showFollowerCount?: boolean;
}

interface HashtagData {
  id: string;
  name: string;
  followerCount: number;
  usageCount: number;
  trendingScore: number;
}

const HashtagFollowButton: React.FC<HashtagFollowButtonProps> = ({
  hashtag,
  initialFollowStatus = false,
  followerCount: initialFollowerCount = 0,
  onFollowChange,
  className = '',
  size = 'md',
  showFollowerCount = true,
}) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowStatus);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [loading, setLoading] = useState(false);
  const [hashtagData, setHashtagData] = useState<HashtagData | null>(null);

  useEffect(() => {
    fetchHashtagData();
  }, [hashtag]);

  const fetchHashtagData = async () => {
    try {
      const response = await api.get(`/api/hashtags/${encodeURIComponent(hashtag)}/follow`);
      if (response.status === 200) {
        const data = response.data as any;
        if (data.success) {
          setHashtagData(data.data.hashtag);
          setIsFollowing(data.data.isFollowing);
          setFollowerCount(data.data.hashtag.followerCount);
        }
      }
    } catch (error: any) {
      console.error('Error fetching hashtag data:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const method = isFollowing ? 'delete' : 'post';
      const response = await api[method](`/api/hashtags/${encodeURIComponent(hashtag)}/follow`);

      if (response.status === 200) {
        const data = response.data as any;
        if (data.success) {
          const newFollowStatus = !isFollowing;
          const newFollowerCount = newFollowStatus ? followerCount + 1 : followerCount - 1;
          
          setIsFollowing(newFollowStatus);
          setFollowerCount(newFollowerCount);
          
          if (onFollowChange) {
            onFollowChange(newFollowStatus, newFollowerCount);
          }
        }
      } else {
        const errorData = response.data as any;
        console.error('Error toggling follow:', errorData.error);
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
    } finally {
      setLoading(false);
    }
  };

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const stateClasses = isFollowing
      ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500';

    return `${baseClasses} ${sizeClasses[size]} ${stateClasses} ${className}`;
  };

  const getIconClasses = () => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };
    return `${sizeClasses[size]} mr-2`;
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleFollowToggle}
        disabled={loading}
        className={getButtonClasses()}
      >
        {loading ? (
          <svg className={`${getIconClasses()} animate-spin`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : isFollowing ? (
          <svg className={getIconClasses()} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className={getIconClasses()} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        )}
        {isFollowing ? 'Following' : 'Follow'}
      </button>

      {showFollowerCount && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">{followerCount.toLocaleString()}</span>
          <span className="ml-1">followers</span>
        </div>
      )}

      {hashtagData && (
        <div className="text-xs text-gray-500">
          <span>{hashtagData.usageCount.toLocaleString()} videos</span>
        </div>
      )}
    </div>
  );
};

export default HashtagFollowButton;
