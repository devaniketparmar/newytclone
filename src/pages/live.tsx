import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import UniversalLayout from '../components/UniversalLayout';
import VideoCard from '../components/VideoCard';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import PageHeader from '../components/PageHeader';

interface LiveVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  viewers: number;
  channel: {
    id: string;
    name: string;
    avatarUrl: string;
    subscribers: number;
  };
  category: string;
  isLive: boolean;
  startedAt: string;
}

interface LivePageProps {
  user?: any;
}

export default function LivePage({ user }: LivePageProps) {
  const [liveVideos, setLiveVideos] = useState<LiveVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveVideos();
  }, []);

  const fetchLiveVideos = async () => {
    try {
      setLoading(true);
      // For now, use regular videos endpoint and simulate live videos
      const response = await fetch('/api/videos?limit=20');
      const data = await response.json();
      
      // Transform regular videos to simulate live videos
      const liveVideos = (data.data || []).map((video: any) => ({
        ...video,
        viewers: Math.floor(Math.random() * 10000) + 100,
        isLive: true,
        startedAt: new Date(Date.now() - Math.random() * 3600000).toISOString()
      }));
      
      setLiveVideos(liveVideos);
    } catch (error) {
      console.error('Error fetching live videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatViewers = (viewers: number) => {
    if (viewers >= 1000000) {
      return `${(viewers / 1000000).toFixed(1)}M`;
    } else if (viewers >= 1000) {
      return `${(viewers / 1000).toFixed(1)}K`;
    }
    return viewers.toString();
  };

  return (
    <UniversalLayout 
      user={user}
      pageHeader={
        <PageHeader
          title="Live"
          subtitle="Watch live streams happening right now"
          icon={
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          }
          iconColor="bg-red-600"
        />
      }
    >
      <div className="min-h-screen bg-neutral-50">

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <LoadingPlaceholder key={index} />
            ))}
          </div>
        ) : liveVideos.length > 0 ? (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                Live Now ({liveVideos.length})
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {liveVideos.map((video) => (
                <div key={video.id} className="relative group">
                  <VideoCard video={video} />
                  
                  {/* Live Badge */}
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-medium flex items-center space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>LIVE</span>
                  </div>
                  
                  {/* Viewer Count */}
                  <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {formatViewers(video.viewers)} watching
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-neutral-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              No live streams available
            </h3>
            <p className="text-neutral-600">
              There are no live streams happening right now. Check back later!
            </p>
          </div>
        )}
      </div>
      </div>
    </UniversalLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    let user = null;
    const token = context.req.cookies.token;

    if (token) {
      try {
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/me`, {
          headers: {
            'Cookie': `token=${token}`,
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            user = data.data.user;
          }
        }
      } catch (error) {
        console.log('User authentication failed:', error);
      }
    }

    return {
      props: {
        user
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        user: null
      }
    };
  }
};
