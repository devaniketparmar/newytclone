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
                <div className="relative">
                  <a href={`/video/${video.id}`} className="block">
                    <div className="w-full h-40 bg-neutral-200 overflow-hidden">
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-400 to-red-600 text-white">
                          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      )}
                    </div>
                  </a>

                  <button onClick={() => removeItem(video.id)} className="absolute top-2 right-2 bg-white/90 text-sm px-2 py-1 rounded-md hover:bg-white">
                    Remove
                  </button>
                </div>

                <div className="p-3">
                  <a href={`/video/${video.id}`} className="text-sm font-semibold text-gray-900 line-clamp-2">{video.title}</a>
                  <div className="text-xs text-gray-600 mt-1">{video.channel?.name}</div>
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
