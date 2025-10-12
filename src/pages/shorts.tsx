import React, { useState, useEffect } from 'react';
import VideoCard from '../components/VideoCard';
import LoadingPlaceholder from '../components/LoadingPlaceholder';

interface ShortVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  views: number;
  likes: number;
  createdAt: string;
  channel: {
    id: string;
    name: string;
    avatarUrl: string;
    subscribers: number;
  };
  category: string;
  isShort: boolean;
}

export default function ShortsPage() {
  const [shortVideos, setShortVideos] = useState<ShortVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShortVideos();
  }, []);

  const fetchShortVideos = async () => {
    try {
      setLoading(true);
      // For now, use regular videos endpoint and simulate short videos
      const response = await fetch('/api/videos?limit=20');
      const data = await response.json();
      
      // Transform regular videos to simulate short videos (duration < 60 seconds)
      const shortVideos = (data.data || []).map((video: any) => ({
        ...video,
        duration: `${Math.floor(Math.random() * 60)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        isShort: true
      }));
      
      setShortVideos(shortVideos);
    } catch (error) {
      console.error('Error fetching short videos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 16h14l-2-16M9 8v8M15 8v8" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-neutral-900">
                Shorts
              </h1>
            </div>
            <p className="text-neutral-600">
              Discover short-form videos and quick content
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <LoadingPlaceholder key={index} />
            ))}
          </div>
        ) : shortVideos.length > 0 ? (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                Short Videos ({shortVideos.length})
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {shortVideos.map((video) => (
                <div key={video.id} className="relative group">
                  <VideoCard video={video} />
                  
                  {/* Short Badge */}
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded font-medium">
                    SHORTS
                  </div>
                  
                  {/* Duration for shorts */}
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-neutral-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 16h14l-2-16M9 8v8M15 8v8" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              No short videos available
            </h3>
            <p className="text-neutral-600">
              There are no short videos available at the moment. Check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
