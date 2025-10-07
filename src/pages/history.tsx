import React, { useState } from 'react';
import UniversalLayout from '@/components/UniversalLayout';
import VideoCard from '@/components/VideoCard';
import { GetServerSideProps } from 'next';

interface MinimalVideo {
  id: string;
  title: string;
  thumbnailUrl?: string;
  duration?: number;
  viewCount?: number;
  publishedAt?: string;
  channel?: { id: string; name: string };
}

interface HistoryPageProps {
  history: MinimalVideo[];
  user?: any;
}

export default function HistoryPage({ history: initialHistory = [], user }: HistoryPageProps) {
  const [history, setHistory] = useState<MinimalVideo[]>(initialHistory || []);
  const [loading, setLoading] = useState(false);

  const removeItem = async (id: string) => {
    // optimistic update
    setHistory(prev => prev.filter(v => v.id !== id));
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
    } catch (e) {
      // ignore for now, could re-fetch
    }
  };

  const clearHistory = async () => {
    setLoading(true);
    setHistory([]);
    try {
      await fetch('/api/history', { method: 'DELETE' });
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <UniversalLayout user={user}>
      <div className="mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Watch history</h1>
            <p className="text-sm text-gray-600">Videos you recently watched</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={clearHistory}
              disabled={loading || history.length === 0}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${history.length === 0 ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
            >
              {loading ? 'Clearing...' : 'Clear all history'}
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="p-8 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
            <p className="text-gray-700">No watch history yet. Watch videos and they'll appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((video) => (
              <div key={video.id} className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
                <VideoCard 
                  video={{
                    ...video,
                    description: '',
                    videoUrl: '',
                    likeCount: 0,
                    commentCount: 0,
                    createdAt: '',
                    status: 'READY' as const,
                    channel: {
                      id: video.channel?.id || '',
                      name: video.channel?.name || '',
                      avatarUrl: '',
                      subscriberCount: 0,
                      userId: ''
                    }
                  }}
                  user={user}
                  layout="grid"
                />
                <div className="p-3 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">Watched recently</p>
                    <button 
                      onClick={() => removeItem(video.id)} 
                      className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </UniversalLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
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

    // If no user is authenticated, redirect to auth page
    if (!user) {
      return {
        redirect: {
          destination: '/auth',
          permanent: false,
        },
      };
    }

    // Try to fetch history from API if user is authenticated
    try {
      const protocol = context.req.headers['x-forwarded-proto'] || 'http';
      const host = context.req.headers.host;
      const baseUrl = process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : `${protocol}://${host}`;

      const res = await fetch(`${baseUrl}/api/history`, { 
        headers: { 
          cookie: context.req.headers.cookie || '',
          'Authorization': `Bearer ${token}`
        } 
      });
      
      if (res.ok) {
        const data = await res.json();
        return { props: { history: data.data || [], user } };
      }
    } catch (e) {
      console.log('Could not fetch history:', e);
    }

    // Return empty history if API fails but user is authenticated
    return { props: { history: [], user } };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      redirect: {
        destination: '/auth',
        permanent: false,
      },
    };
  }
};
