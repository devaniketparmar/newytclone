import { useState, useEffect } from 'react';

import { api } from '../lib/axios';
interface SubscriptionButtonProps {
  channelId: string;
  initialSubscribed?: boolean;
  initialSubscriberCount?: number;
  onSubscriptionChange?: (subscribed: boolean, subscriberCount: number) => void;
  className?: string;
}

export default function SubscriptionButton({
  channelId,
  initialSubscribed = false,
  initialSubscriberCount = 0,
  onSubscriptionChange,
  className = ''
}: SubscriptionButtonProps) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [subscriberCount, setSubscriberCount] = useState(initialSubscriberCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSubscribed(initialSubscribed);
    setSubscriberCount(initialSubscriberCount);
  }, [initialSubscribed, initialSubscriberCount]);

  const handleSubscriptionToggle = async () => {
    try {
      setLoading(true);
      setError(null);

      const method = subscribed ? 'DELETE' : 'POST';
      const response = await api.get(`/api/channels/${channelId}/subscribe`, {
        method,
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        const data = response.data as any;
        const newSubscribed = data.data.subscribed;
        const newSubscriberCount = data.data.subscriberCount;

        setSubscribed(newSubscribed);
        setSubscriberCount(newSubscriberCount);
        
        if (onSubscriptionChange) {
          onSubscriptionChange(newSubscribed, newSubscriberCount);
        }
      } else {
        if (response.status === 401) {
          // Redirect to login page
          window.location.href = '/auth';
          return;
        }
        const errorData = response.data as any;
        setError(errorData.error || 'Failed to update subscription');
      }
    } catch (err: any) {
      console.error('Error toggling subscription:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatSubscriberCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={handleSubscriptionToggle}
        disabled={loading}
        className={`
          px-4 py-2 rounded-full font-medium text-sm transition-colors
          ${subscribed
            ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            : 'bg-red-600 text-white hover:bg-red-700'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {loading ? (
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span>{subscribed ? 'Unsubscribing...' : 'Subscribing...'}</span>
          </div>
        ) : (
          <>
            {subscribed ? (
              <>
                <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Subscribed
              </>
            ) : (
              <>
                <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Subscribe
              </>
            )}
          </>
        )}
      </button>
      
      {subscriberCount > 0 && (
        <span className="text-sm text-gray-600">
          {formatSubscriberCount(subscriberCount)} subscribers
        </span>
      )}

      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
